/** @param {NS} ns */
export async function main(ns) {
    const scripts = ["early-hack.js"];
    const crackers = [
        { file: "BruteSSH.exe", func: ns.brutessh },
        { file: "FTPCrack.exe", func: ns.ftpcrack },
        { file: "relaySMTP.exe", func: ns.relaysmtp },
        { file: "HTTPWorm.exe", func: ns.httpworm },
        { file: "SQLInject.exe", func: ns.sqlinject }
    ];

    // Get available cracking programs
    const availableCrackers = crackers.filter(c => ns.fileExists(c.file, "home"));

    // Find all servers
    function scanAll(ns, current = "home", visited = new Set()) {
        visited.add(current);
        const neighbors = ns.scan(current);

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                scanAll(ns, neighbor, visited);
            }
        }
        return Array.from(visited);
    }

    const allServers = scanAll(ns).filter(s => s !== "home");

    // Good targets for early game
    const preferredTargets = [
        "n00dles", "foodnstuff", "sigma-cosmetics", "joesguns",
        "hong-fang-tea", "harakiri-sushi", "iron-gym", "darkweb"
    ];

    ns.tprint(`Found ${allServers.length} servers`);
    ns.tprint(`Available crackers: ${availableCrackers.length}`);

    for (const server of allServers) {
        const reqPorts = ns.getServerNumPortsRequired(server);
        const reqHack = ns.getServerRequiredHackingLevel(server);
        const myHack = ns.getHackingLevel();
        const maxMoney = ns.getServerMaxMoney(server);
        const maxRam = ns.getServerMaxRam(server);

        // Skip servers we can't hack yet
        if (reqHack > myHack || reqPorts > availableCrackers.length) {
            continue;
        }

        // Skip servers with no money or RAM
        if (maxMoney === 0 && maxRam === 0) {
            continue;
        }

        // Crack the server
        try {
            for (let i = 0; i < reqPorts && i < availableCrackers.length; i++) {
                availableCrackers[i].func(server);
            }
            ns.nuke(server);
            ns.tprint(`✓ Rooted ${server}`);
        } catch (e) {
            continue;
        }

        // Copy and run scripts on servers with RAM
        if (maxRam > 0) {
            await ns.scp(scripts, server);
            ns.killall(server);

            const ramPerThread = ns.getScriptRam(scripts[0]);
            const threads = Math.floor(maxRam / ramPerThread);

            if (threads > 0) {
                // Choose best target
                let target = preferredTargets.find(t =>
                    ns.hasRootAccess(t) && ns.getServerMaxMoney(t) > 0
                ) || "n00dles";

                ns.exec(scripts[0], server, threads, target);
                ns.tprint(`→ Running ${threads} threads on ${server} targeting ${target}`);
            }
        }
    }

    ns.tprint("=== Worm complete! ===");
}
