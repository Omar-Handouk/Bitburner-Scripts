const scripts = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];
/**
 * @param {NS} ns
 */
export const main = (ns, target) => {
    const flags = ns.flags([
        ['p', false], //print
        ['s', false] // string
    ]);

    const host = target ?? flags._[0] ?? ns.getHostname();
    const availableScripts = scripts.filter(script => ns.fileExists(script));

    const info = {
        host: host,
        viableTarget: ns.getServerRequiredHackingLevel(host) <= ns.getHackingLevel() * 0.5 && ns.getServerMaxMoney(host) > 0,
        hackingLevelRequired: ns.getServerRequiredHackingLevel(host),
        portsRequired: ns.getServerNumPortsRequired(host),
        rootable: ns.getServerRequiredHackingLevel(host) <= ns.getHackingLevel() && ns.getServerNumPortsRequired(host) <= availableScripts.length,
        rooted: ns.hasRootAccess(host),
        ramUsed: ns.getServerUsedRam(host),
        ramMax: ns.getServerMaxRam(host),
        hackTimeSecs: Math.ceil(ns.getHackTime(host) / 1000),
        securityMin: ns.getServerMinSecurityLevel(host),
        securityCurrent: ns.getServerSecurityLevel(host),
        weakenTimeSecs: Math.ceil(ns.getWeakenTime(host) / 1000),
        moneyMax: ns.getServerMaxMoney(host),
        moneyCurrent: ns.getServerMoneyAvailable(host),
        growthTimeSecs: Math.ceil(ns.getGrowTime(host) / 1000)
    };

    const infoStr = `
    ----------
    Host: ${info.host}, Viable Target: ${info.viableTarget}
    Hacking Level Required: ${info.hackingLevelRequired}, Number of Ports Required: ${info.portsRequired}
    Rootable: ${info.rootable}, Rooted: ${info.rooted}
    Ram (Used/Max): ${info.ramUsed}/${info.ramMax}
    Hack Time (Seconds): ${info.hackTimeSecs}s
    Security (Current/Min): ${info.securityCurrent}/${info.securityMin}, Weaken Time (Seconds): ${info.weakenTimeSecs}s
    Money (Current/Max): ${info.moneyCurrent}/${info.moneyMax}, Growth Time (Seconds): ${info.growthTimeSecs}s
    ----------`;

    if (flags.p) {
        ns.tprint(infoStr);
    }

    return flags.s ? infoStr : info;
}