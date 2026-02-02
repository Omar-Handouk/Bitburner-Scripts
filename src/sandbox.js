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
    while (ns.getServerSecurityLevel(host) > ns.getServerMinSecurityLevel(host) || ns.getServerMaxMoney(host) > ns.getServerMoneyAvailable(host)) {
        if (!ns.scriptRunning('src/weaken.js', worker) && !ns.scriptRunning('src/grow.js', worker)) {
            if (ns.getServerSecurityLevel(host) > ns.getServerMinSecurityLevel(host)) {
                ns.exec('src/weaken.js', worker, { threads: Math.ceil((ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host)) / 0.05) + 5 }, 0, host);
            } else if (ns.getServerMaxMoney(host) > ns.getServerMoneyAvailable(host)) {
                ns.exec('src/grow.js', worker, { threads: Math.ceil(ns.growthAnalyze(host, ns.getServerMaxMoney(host) / ns.getServerMoneyAvailable(host))) + 1 }, 0, host);
            }
        }
        await ns.sleep(3000);
    }
    
    const delay = 5000;
    const batchParams = hwgwInfo(ns, host);
    
    while (true) {
        ns.exec('src/hack.js', worker, { threads: batchParams.hackThreads }, batchParams.weakenTime - batchParams.hackTime - delay * 3, host);
        ns.exec('src/weaken.js', worker, { threads: batchParams.weakenThreadsAfterHack }, 0, host);
        ns.exec('src/grow.js', worker, { threads: batchParams.growThreads }, batchParams.weakenTime - batchParams.growTime - delay, host);
        ns.exec('src/weaken.js', worker, { threads: batchParams.weakenThreadsAfterGrow }, delay, host);
        await ns.sleep(batchParams.weakenTime + delay * 4);
    }
}

/**
 * @param {NS} ns 
 * @param {String} host
 */
const hwgwInfo = (ns, host) => {
    const info = {
        weakenTime: ns.getWeakenTime(host),
        growTime: ns.getGrowTime(host),
        hackTime: ns.getHackTime(host),
        hackThreads: Math.ceil(ns.hackAnalyzeThreads(host, ns.getServerMaxMoney(host) * 0.75)) + 2,
        growThreads: Math.ceil(ns.growthAnalyze(host, 4)) + 2
    };

    info.hackSecurityEffect = ns.hackAnalyzeSecurity(info.hackThreads, host);
    info.weakenThreadsAfterHack = Math.ceil(info.hackSecurityEffect / 0.05) + 2;
    info.growSecurityEffect = ns.growthAnalyzeSecurity(info.growThreads, host);
    info.weakenThreadsAfterGrow = Math.ceil(info.growSecurityEffect / 0.05) + 2;

    return info;
}