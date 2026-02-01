/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.enableLog("exec");
    ns.enableLog("purchaseServer");

    const CONFIG = {
        startingRam: 8,          // Initial server RAM (8GB)
        maxUpgradeRam: 1048576,  // Max RAM to upgrade to (1PB)
        minMoneyReserve: 0, // Keep this much money in reserve
        updateInterval: 30000,    // Update every 30 seconds
        hackScript: "early-hack.js",
        batchMode: false,         // Set to true for advanced batch coordination
    };

    // Helper functions
    function scanAll(ns, current = "home", visited = new Set()) {
        visited.add(current);
        for (const neighbor of ns.scan(current)) {
            if (!visited.has(neighbor)) scanAll(ns, neighbor, visited);
        }
        return Array.from(visited);
    }

    function getRootedServers(ns) {
        return scanAll(ns).filter(s => ns.hasRootAccess(s) && s !== "home");
    }

    function analyzeTarget(ns, target) {
        const maxMoney = ns.getServerMaxMoney(target);
        if (maxMoney === 0) return null;

        const hackTime = ns.getHackTime(target);
        const growTime = ns.getGrowTime(target);
        const weakenTime = ns.getWeakenTime(target);
        const hackChance = ns.hackAnalyzeChance(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const hackLevel = ns.getServerRequiredHackingLevel(target);

        // Calculate expected money per second
        const cycleTime = Math.max(hackTime, growTime, weakenTime);
        const expectedMoney = (maxMoney * 0.5 * hackChance) / (cycleTime / 1000);

        return {
            hostname: target,
            maxMoney,
            hackTime,
            growTime,
            weakenTime,
            cycleTime,
            hackChance,
            minSec,
            hackLevel,
            expectedMoneyPerSec: expectedMoney,
            profitScore: expectedMoney / cycleTime, // Higher is better
        };
    }

    function getBestTargets(ns) {
        const myHackLevel = ns.getHackingLevel();
        const rootedServers = getRootedServers(ns);

        const targets = rootedServers
            .map(s => analyzeTarget(ns, s))
            .filter(t => t !== null)
            .filter(t => t.hackLevel <= myHackLevel)
            .sort((a, b) => b.profitScore - a.profitScore);

        return targets;
    }

    function getTotalAvailableRam(ns) {
        const purchasedServers = ns.getPurchasedServers();
        let totalRam = 0;

        // Add purchased servers RAM
        for (const server of purchasedServers) {
            const maxRam = ns.getServerMaxRam(server);
            const usedRam = ns.getServerUsedRam(server);
            totalRam += (maxRam - usedRam);
        }

        // Add home server RAM (reserve some for other scripts)
        const homeMaxRam = ns.getServerMaxRam("home");
        const homeUsedRam = ns.getServerUsedRam("home");
        totalRam += Math.max(0, homeMaxRam - homeUsedRam - 32); // Reserve 32GB on home

        return totalRam;
    }

    function buyOrUpgradeServers(ns, targetRam) {
        const purchasedServers = ns.getPurchasedServers();
        const maxServers = ns.getPurchasedServerLimit();
        const money = ns.getServerMoneyAvailable("home");
        const availableMoney = money - CONFIG.minMoneyReserve;

        // Try to buy new servers if under limit
        if (purchasedServers.length < maxServers) {
            const cost = ns.getPurchasedServerCost(targetRam);
            if (cost <= availableMoney) {
                const serverName = `pserv-${purchasedServers.length}`;
                const hostname = ns.purchaseServer(serverName, targetRam);
                if (hostname) {
                    ns.tprint(`✓ Purchased ${hostname} with ${targetRam}GB RAM for $${ns.formatNumber(cost)}`);
                    return true;
                }
            }
        }

        // Try to upgrade existing servers
        for (const server of purchasedServers) {
            const currentRam = ns.getServerMaxRam(server);
            const nextRam = currentRam * 2;

            if (nextRam > CONFIG.maxUpgradeRam) continue;

            const cost = ns.getPurchasedServerCost(nextRam);
            if (cost <= availableMoney) {
                ns.killall(server);
                ns.deleteServer(server);
                const hostname = ns.purchaseServer(server, nextRam);
                if (hostname) {
                    ns.tprint(`↑ Upgraded ${server} from ${currentRam}GB to ${nextRam}GB for $${ns.formatNumber(cost)}`);
                    return true;
                }
            }
        }

        return false;
    }

    function distributeThreads(ns, targets) {
        const scriptRam = ns.getScriptRam(CONFIG.hackScript);
        const allServers = ["home", ...ns.getPurchasedServers()];

        // Build available RAM pool
        const ramPool = [];
        for (const server of allServers) {
            let availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            if (server === "home") availableRam = Math.max(0, availableRam - 32);
            if (availableRam >= scriptRam) {
                ramPool.push({ server, availableRam });
            }
        }

        ramPool.sort((a, b) => b.availableRam - a.availableRam);

        const deployments = [];
        let totalThreads = 0;

        // Distribute threads to top targets
        for (let i = 0; i < Math.min(targets.length, 5); i++) {
            const target = targets[i];
            let threadsNeeded = Math.ceil(targets.length > 0 ?
                (getTotalAvailableRam(ns) / scriptRam) / Math.min(targets.length, 5) : 1);

            for (const pool of ramPool) {
                if (threadsNeeded <= 0) break;

                const maxThreads = Math.floor(pool.availableRam / scriptRam);
                const threads = Math.min(maxThreads, threadsNeeded);

                if (threads > 0) {
                    deployments.push({
                        server: pool.server,
                        target: target.hostname,
                        threads
                    });

                    pool.availableRam -= threads * scriptRam;
                    threadsNeeded -= threads;
                    totalThreads += threads;
                }
            }
        }

        return { deployments, totalThreads };
    }

    async function deployScripts(ns, deployments) {
        const allServers = ["home", ...ns.getPurchasedServers()];

        // Copy script to all servers
        for (const server of allServers) {
            if (server !== "home") {
                await ns.scp(CONFIG.hackScript, server);
            }
        }

        // Kill all existing processes
        for (const server of allServers) {
            ns.scriptKill(CONFIG.hackScript, server);
        }

        await ns.sleep(500);

        // Deploy new processes
        let deployed = 0;
        for (const deploy of deployments) {
            const pid = ns.exec(CONFIG.hackScript, deploy.server, deploy.threads, deploy.target);
            if (pid > 0) {
                deployed++;
                ns.print(`→ ${deploy.server}: ${deploy.threads} threads → ${deploy.target}`);
            }
        }

        return deployed;
    }

    // Main loop
    ns.tprint("=== Auto-Deploy & Server Manager Started ===");

    let currentRamTarget = CONFIG.startingRam;

    while (true) {
        const money = ns.getServerMoneyAvailable("home");
        const hackLevel = ns.getHackingLevel();

        // Analyze targets
        const targets = getBestTargets(ns);

        if (targets.length === 0) {
            ns.print("WARN: No valid targets found. Waiting...");
            await ns.sleep(CONFIG.updateInterval);
            continue;
        }

        // Display top targets
        ns.clearLog();
        ns.print("=".repeat(60));
        ns.print(`Money: $${ns.formatNumber(money)} | Hack Level: ${hackLevel}`);
        ns.print("=".repeat(60));
        ns.print("\nTOP TARGETS:");
        for (let i = 0; i < Math.min(targets.length, 5); i++) {
            const t = targets[i];
            ns.print(`${i + 1}. ${t.hostname.padEnd(20)} | $${ns.formatNumber(t.expectedMoneyPerSec)}/s | Chance: ${(t.hackChance * 100).toFixed(1)}%`);
        }

        // Try to buy/upgrade servers
        if (money > CONFIG.minMoneyReserve * 2) {
            const upgraded = buyOrUpgradeServers(ns, currentRamTarget);
            if (upgraded) {
                // If we successfully upgraded, try for higher RAM next time
                if (currentRamTarget < CONFIG.maxUpgradeRam) {
                    currentRamTarget *= 2;
                }
                await ns.sleep(1000);
                continue; // Restart loop to redeploy
            }
        }

        // Distribute and deploy
        const { deployments, totalThreads } = distributeThreads(ns, targets);

        ns.print(`\nDEPLOYING ${totalThreads} THREADS:`);
        const deployed = await deployScripts(ns, deployments);
        ns.print(`\n✓ Deployed ${deployed} processes`);

        // Calculate total income estimate
        const estimatedIncome = targets.slice(0, 5).reduce((sum, t) => sum + t.expectedMoneyPerSec, 0);
        ns.print(`\nEstimated income: $${ns.formatNumber(estimatedIncome)}/sec`);
        ns.print("=".repeat(60));

        // Wait before next update
        await ns.sleep(CONFIG.updateInterval);
    }
}
