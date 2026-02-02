/**
 * @param {NS} ns
 */
export const main = (ns) => {
    const info = hostInfo(ns, ns.args[0]);

    const infoStr = `
    ----------
    Host: ${info.host}, Viable Target: ${info.viableTarget}
    Hacking Level Required: ${info.hackingLevelRequired}, Number of Ports Required: ${info.portsRequired}
    Rootable: ${info.rootable}, Rooted: ${info.rooted}
    Ram (Used/Max): ${info.ramUsed}/${info.ramMax}, Ram %: ${info.ramPerc * 100}% 
    Hack Time (Seconds): ${info.hackTimeSecs}s
    Security (Current/Min): ${info.securityCurrent}/${info.securityMin}, Security %: ${info.securityPerc * 100}%, Weaken Time (Seconds): ${info.weakenTimeSecs}s
    Money (Current/Max): ${info.moneyCurrent}/${info.moneyMax}, Money %: ${info.moneyPerc * 100}%, Growth %: ${info.growthPerc}, Growth Time (Seconds): ${info.growthTimeSecs}s
    ----------`;

    ns.tprint(infoStr);
}

const scripts = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];
/**
 * @param {NS} ns 
 */
const hostInfo = (ns, target) => {
    const host = target ?? ns.getHostname();
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
        ramPerc: ns.getServerUsedRam(host) / ns.getServerMaxRam(host),
        hackTimeSecs: Math.ceil(ns.getHackTime(host) / 1000),
        securityMin: ns.getServerMinSecurityLevel(host),
        securityCurrent: ns.getServerSecurityLevel(host),
        securityPerc: ns.getServerSecurityLevel(host) / ns.getServerMinSecurityLevel(host),
        weakenTimeSecs: Math.ceil(ns.getWeakenTime(host) / 1000),
        moneyMax: ns.getServerMaxMoney(host),
        moneyCurrent: ns.getServerMoneyAvailable(host),
        moneyPerc: ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host),
        growthTimeSecs: Math.ceil(ns.getGrowTime(host) / 1000),
        growthPerc: ns.getServerGrowth(host)
    };
    
    return info;
}

export default hostInfo;