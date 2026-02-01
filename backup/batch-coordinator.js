/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");
    ns.enableLog("exec");

    const CONFIG = {
        batchSpacing: 50,          // ms between batch completions
        prepPhaseDelay: 1000,      // Wait between prep actions
        hackPercent: 0.5,          // Take 50% of server money per batch
        reserveHomeRam: 32,        // Reserve RAM on home
        minMoneyPercent: 0.95,     // Prep target to 95% max money
        maxSecurityOffset: 0.1,    // Prep target to min+0.1 security
        updateInterval: 10000,     // Update dashboard every 10s
    };

    const SCRIPTS = {
        hack: "hack.js",
        grow: "grow.js",
        weaken: "weaken.js"
    };

    // Helper functions
    function scanAll(ns, current = "home", visited = new Set()) {
        visited.add(current);
        for (const neighbor of ns.scan(current)) {
            if (!visited.has(neighbor)) scanAll(ns, neighbor, visited);
        }
        return Array.from(visited);
    }

    function analyzeTarget(ns, target) {
        const maxMoney = ns.getServerMaxMoney(target);
        if (maxMoney === 0) return null;

        const hackTime = ns.getHackTime(target);
        const growTime = ns.getGrowTime(target);
        const weakenTime = ns.getWeakenTime(target);
        const hackChance = ns.hackAnalyzeChance(target);
        const hackLevel = ns.getServerRequiredHackingLevel(target);

        // Calculate profit per cycle
        const cycleTime = weakenTime + CONFIG.batchSpacing * 4;
        const profitPerCycle = maxMoney * CONFIG.hackPercent * hackChance;
        const profitPerSecond = profitPerCycle / (cycleTime / 1000);

        return {
            hostname: target,
            maxMoney,
            hackTime,
            growTime,
            weakenTime,
            hackChance,
            hackLevel,
            profitPerSecond,
            cycleTime,
        };
    }

    function getBestTargets(ns) {
        const myHackLevel = ns.getHackingLevel();
        const rooted = scanAll(ns).filter(s => ns.hasRootAccess(s) && s !== "home");

        return rooted
            .map(s => analyzeTarget(ns, s))
            .filter(t => t !== null && t.hackLevel <= myHackLevel)
            .sort((a, b) => b.profitPerSecond - a.profitPerSecond);
    }

    function getAvailableServers(ns) {
        const servers = ["home", ...ns.getPurchasedServers()];
        return servers.map(s => ({
            hostname: s,
            maxRam: ns.getServerMaxRam(s),
            usedRam: ns.getServerUsedRam(s),
            availableRam: ns.getServerMaxRam(s) - ns.getServerUsedRam(s) - (s === "home" ? CONFIG.reserveHomeRam : 0)
        })).filter(s => s.availableRam > 0);
    }

    async function prepTarget(ns, target) {
        const maxMoney = ns.getServerMaxMoney(target);
        const minSecurity = ns.getServerMinSecurityLevel(target);
        const targetSecurity = minSecurity + CONFIG.maxSecurityOffset;
        const targetMoney = maxMoney * CONFIG.minMoneyPercent;

        ns.print(`\nPrepping ${target}...`);

        let iterations = 0;
        const maxIterations = 100;

        while (iterations++ < maxIterations) {
            const currentSecurity = ns.getServerSecurityLevel(target);
            const currentMoney = ns.getServerMoneyAvailable(target);

            ns.print(`  Security: ${currentSecurity.toFixed(2)}/${targetSecurity.toFixed(2)} | Money: ${(currentMoney / maxMoney * 100).toFixed(1)}%`);

            // Weaken if needed
            if (currentSecurity > targetSecurity) {
                await ns.weaken(target);
            }
            // Grow if needed
            else if (currentMoney < targetMoney) {
                await ns.grow(target);
            }
            // Target is prepped
            else {
                ns.print(`  ✓ ${target} prepped successfully`);
                return true;
            }

            await ns.sleep(CONFIG.prepPhaseDelay);
        }

        ns.print(`  ⚠ ${target} prep timeout`);
        return false;
    }

    function calculateBatchThreads(ns, target) {
        // Hack threads to steal CONFIG.hackPercent of money
        const hackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, ns.getServerMaxMoney(target) * CONFIG.hackPercent)));

        // Security increase from hacking
        const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreads, target);

        // Weaken threads to counter hack security increase
        const weakenThreadsForHack = Math.ceil(hackSecurityIncrease / 0.05);

        // Calculate grow threads needed to recover stolen money
        const moneyAfterHack = ns.getServerMaxMoney(target) * (1 - CONFIG.hackPercent);
        const growthNeeded = ns.getServerMaxMoney(target) / moneyAfterHack;
        const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, growthNeeded)));

        // Security increase from growing
        const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreads, target);

        // Weaken threads to counter grow security increase
        const weakenThreadsForGrow = Math.ceil(growSecurityIncrease / 0.05);

        return {
            hack: hackThreads,
            weakenHack: weakenThreadsForHack,
            grow: growThreads,
            weakenGrow: weakenThreadsForGrow,
            total: hackThreads + weakenThreadsForHack + growThreads + weakenThreadsForGrow
        };
    }

    function calculateBatchTiming(ns, target) {
        const hackTime = ns.getHackTime(target);
        const growTime = ns.getGrowTime(target);
        const weakenTime = ns.getWeakenTime(target);
        const spacing = CONFIG.batchSpacing;

        // All operations should complete in order: H, W1, G, W2
        // with spacing ms between each
        const hackDelay = weakenTime - hackTime - spacing * 3;
        const weakenHackDelay = 0;
        const growDelay = weakenTime - growTime - spacing;
        const weakenGrowDelay = spacing * 2;

        return {
            hack: Math.max(0, hackDelay),
            weakenHack: weakenHackDelay,
            grow: Math.max(0, growDelay),
            weakenGrow: weakenGrowDelay,
            totalTime: weakenTime + spacing * 4
        };
    }

    async function deployBatch(ns, target, servers) {
        const threads = calculateBatchThreads(ns, target);
        const timing = calculateBatchTiming(ns, target);

        const scriptRam = {
            hack: ns.getScriptRam(SCRIPTS.hack),
            grow: ns.getScriptRam(SCRIPTS.grow),
            weaken: ns.getScriptRam(SCRIPTS.weaken)
        };

        const totalRamNeeded =
            threads.hack * scriptRam.hack +
            threads.weakenHack * scriptRam.weaken +
            threads.grow * scriptRam.grow +
            threads.weakenGrow * scriptRam.weaken;

        const totalAvailableRam = servers.reduce((sum, s) => sum + s.availableRam, 0);

        if (totalRamNeeded > totalAvailableRam) {
            ns.print(`⚠ Not enough RAM for full batch on ${target}. Need: ${totalRamNeeded.toFixed(2)}GB, Have: ${totalAvailableRam.toFixed(2)}GB`);
            return false;
        }

        // Copy scripts to all servers
        for (const server of servers) {
            if (server.hostname !== "home") {
                await ns.scp([SCRIPTS.hack, SCRIPTS.grow, SCRIPTS.weaken], server.hostname);
            }
        }

        // Deploy operations
        const operations = [
            { script: SCRIPTS.hack, threads: threads.hack, delay: timing.hack, type: "H" },
            { script: SCRIPTS.weaken, threads: threads.weakenHack, delay: timing.weakenHack, type: "W" },
            { script: SCRIPTS.grow, threads: threads.grow, delay: timing.grow, type: "G" },
            { script: SCRIPTS.weaken, threads: threads.weakenGrow, delay: timing.weakenGrow, type: "W" }
        ];

        let serverIndex = 0;
        let deployed = 0;

        for (const op of operations) {
            let threadsLeft = op.threads;

            while (threadsLeft > 0 && serverIndex < servers.length) {
                const server = servers[serverIndex];
                const ramPerThread = ns.getScriptRam(op.script);
                const maxThreads = Math.floor(server.availableRam / ramPerThread);
                const threadsToRun = Math.min(maxThreads, threadsLeft);

                if (threadsToRun > 0) {
                    const pid = ns.exec(op.script, server.hostname, threadsToRun, target, op.delay);
                    if (pid > 0) {
                        server.availableRam -= threadsToRun * ramPerThread;
                        threadsLeft -= threadsToRun;
                        deployed++;
                    }
                }

                if (threadsLeft > 0) serverIndex++;
            }

            if (threadsLeft > 0) {
                ns.print(`⚠ Failed to deploy all threads for ${op.type} on ${target}`);
                return false;
            }

            serverIndex = 0; // Reset for next operation
        }

        ns.print(`✓ Deployed batch on ${target}: H${threads.hack} W${threads.weakenHack} G${threads.grow} W${threads.weakenGrow}`);
        return true;
    }

    // Main loop
    ns.tprint("=== Batch Coordinator Started ===");
    ns.tprint("Preparing targets...");

    // Prep phase - prepare best target
    const targets = getBestTargets(ns);
    if (targets.length === 0) {
        ns.tprint("ERROR: No valid targets found!");
        return;
    }

    const bestTarget = targets[0];
    ns.tprint(`Best target: ${bestTarget.hostname} ($${ns.formatNumber(bestTarget.profitPerSecond)}/s)`);

    const prepped = await prepTarget(ns, bestTarget.hostname);
    if (!prepped) {
        ns.tprint("ERROR: Failed to prep target!");
        return;
    }

    ns.tprint(`Starting batch operations on ${bestTarget.hostname}...`);

    // Batch phase
    while (true) {
        const servers = getAvailableServers(ns);
        const totalRam = servers.reduce((sum, s) => sum + s.availableRam, 0);

        ns.clearLog();
        ns.print("=".repeat(60));
        ns.print(`Target: ${bestTarget.hostname} | Available RAM: ${totalRam.toFixed(2)}GB`);
        ns.print(`Profit Rate: $${ns.formatNumber(bestTarget.profitPerSecond)}/sec`);
        ns.print("=".repeat(60));

        const deployed = await deployBatch(ns, bestTarget.hostname, servers);

        if (!deployed) {
            ns.print("Waiting for RAM to free up...");
        }

        await ns.sleep(CONFIG.updateInterval);
    }
}
