/** @param {NS} ns */
export async function main(ns) {
    // Recursively scan all servers in the network
    function scanAll(ns, current = "home", visited = new Set()) {
        visited.add(current);
        for (const neighbor of ns.scan(current)) {
            if (!visited.has(neighbor)) {
                scanAll(ns, neighbor, visited);
            }
        }
        return Array.from(visited);
    }

    // Get all servers
    const allServers = scanAll(ns);

    ns.tprint(`Found ${allServers.length} servers. Killing all scripts...`);

    let killedCount = 0;
    for (const server of allServers) {
        const killed = ns.killall(server);
        if (killed) {
            ns.tprint(`✓ Killed all scripts on ${server}`);
            killedCount++;
        }
    }

    ns.tprint(`\nCompleted! Killed scripts on ${killedCount} servers.`);
}
