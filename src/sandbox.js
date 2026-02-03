import hostInfo from 'src/host-info';
/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    const host = ns.args[0];

    // ns.tprint(`
    //     Host            : ${host}
    //     Weaken Time     : ${weakenTime} ms  / ${weakenTime / 1000}  s   / ${(weakenTime / 1000) / 60}   m
    //     Grow Time       : ${growTime}   ms  / ${growTime / 1000}    s   / ${(growTime / 1000) / 60}     m
    //     Hack Time       : ${hackTime}   ms  / ${hackTime / 1000}    s   / ${(hackTime / 1000) / 60}     m
    //     Hack Threads    : ${hackThreads}
    //     Grow Threads    : ${growThreads}
    //     Weaken Threads  : ${weakenThreads}`);


    const worker = 'pserv-1';
    
    // Prep Phase
    let pid = -1;
    while (ns.getServerSecurityLevel(host) > ns.getServerMinSecurityLevel(host) || ns.getServerMaxMoney(host) > ns.getServerMoneyAvailable(host)) {
        if (ns.getRunningScript(pid) === null) {
            if (ns.getServerSecurityLevel(host) > ns.getServerMinSecurityLevel(host)) {
                pid = ns.exec('src/weaken.js', worker, { threads: Math.ceil((ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host)) / 0.05) + 5 }, 0, host);
            } else if (ns.getServerMaxMoney(host) > ns.getServerMoneyAvailable(host)) {
                pid = ns.exec('src/grow.js', worker, { threads: Math.ceil(ns.growthAnalyze(host, ns.getServerMaxMoney(host) / ns.getServerMoneyAvailable(host))) + 1 }, 0, host);
            }
        }
        await ns.sleep(3000);
    }
    
    const delay = 200;
    let batchParams = hwgwInfo(ns, host);
    
    while (true) {
        batchParams = hwgwInfo(ns, host);
        ns.tprint(batchParams);
        ns.exec('src/hack.js', worker, { threads: batchParams.hackThreads }, batchParams.weakenTime - batchParams.hackTime, host);
        ns.exec('src/weaken.js', worker, { threads: Math.ceil(Math.max(1, batchParams.weakenThreadsAfterHack) * 1.15) }, delay, host);
        ns.exec('src/grow.js', worker, { threads: batchParams.growThreads }, batchParams.weakenTime - batchParams.growTime + 2 * delay, host);
        ns.exec('src/weaken.js', worker, { threads: Math.ceil(Math.max(1, batchParams.weakenThreadsAfterGrow) * 1.15) }, delay * 3, host);
        await ns.sleep(batchParams.weakenTime + delay * 4);
    }
}

/**
 * @param {NS} ns 
 * @param {String} host
 */
// const hwgwInfo = (ns, host) => {
//     const info = {
//         weakenTime: ns.getWeakenTime(host),
//         growTime: ns.getGrowTime(host),
//         hackTime: ns.getHackTime(host),
//         hackThreads: Math.ceil(ns.hackAnalyzeThreads(host, ns.getServerMaxMoney(host) * 0.75)) + 2,
//         growThreads: Math.ceil(ns.growthAnalyze(host, 4)) + 2
//     };

//     info.hackSecurityEffect = ns.hackAnalyzeSecurity(info.hackThreads, host);
//     info.weakenThreadsAfterHack = Math.ceil(info.hackSecurityEffect / 0.05) + 2;
//     info.growSecurityEffect = ns.growthAnalyzeSecurity(info.growThreads, host);
//     info.weakenThreadsAfterGrow = Math.ceil(info.growSecurityEffect / 0.05) + 2;

//     return info;
// }

/**
 * @param {NS} ns 
 * @param {String} host
 */
const hwgwInfo = (ns, host) => {
    const hackPercent = 0.50; // Much safer - hack only 25%
    const maxMoney = ns.getServerMaxMoney(host);
    
    // Calculate hack threads for desired percent
    const hackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(host, maxMoney * hackPercent)));
    
    // Grow multiplier: if we hack 25%, we have 75% left, need to grow by 1/0.75 = 1.333x
    const growMultiplier = 1 / (1 - hackPercent);
    // Add 20% buffer to grow threads to handle variance
    const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(host, growMultiplier) * 1.2));

    const info = {
        weakenTime: ns.getWeakenTime(host),
        growTime: ns.getGrowTime(host),
        hackTime: ns.getHackTime(host),
        hackThreads: hackThreads,
        growThreads: growThreads
    };

    info.hackSecurityEffect = ns.hackAnalyzeSecurity(info.hackThreads, host);
    info.weakenThreadsAfterHack = Math.ceil(info.hackSecurityEffect / ns.weakenAnalyze(1));
    info.growSecurityEffect = ns.growthAnalyzeSecurity(info.growThreads);
    info.weakenThreadsAfterGrow = Math.ceil(info.growSecurityEffect / ns.weakenAnalyze(1));

    return info;
}