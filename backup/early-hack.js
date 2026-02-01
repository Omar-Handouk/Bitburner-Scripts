/** @param {NS} ns */
export async function main(ns) {
    // Target: args[0], or current machine (excluding home/purchased servers), or default to "n00dles"
    const hostname = ns.getHostname();
    const isPurchasedServer = ns.getPurchasedServers().includes(hostname);
    const target = ns.args[0] || (hostname === "home" || isPurchasedServer ? "n00dles" : hostname);

    while (true) {
        // Wait until server is ready to hack
        if (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target) + 5) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.75) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}
