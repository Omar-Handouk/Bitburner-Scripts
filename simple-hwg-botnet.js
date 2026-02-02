import { main as scan } from 'utils/scan.js';
/**
 * @param {NS} ns 
 */
export const main = async (ns) => {
    const { _, s: securityThreshold, m: moneyThreshold } = ns.flags([
        ['s', 1.25],
        ['m', 0.75]
    ]);

    const workers = scan(ns).filter(worker => worker.rooted);

    const target = _[0];
    if (!target) {
        ns.tprint('No target selected');
        return;
    }

    const baseCost = 1.6;
    const hackRamCost = 0.1 + baseCost;
    const growRamCost = 0.15 + baseCost;
    const weakenRamCost = 0.15 + baseCost;

    const serverMinSecurityLevel = ns.getServerMinSecurityLevel(target);
    const serverMaxMoney = ns.getServerMaxMoney(target);

    //Prep Phase
    while (ns.getServerSecurityLevel(target) > serverMinSecurityLevel * securityThreshold || ns.getServerMoneyAvailable(target) < serverMaxMoney) {
        workers.forEach(worker => {
            const hasRunningScript = ns.scriptRunning('weaken.js', worker.host) || ns.scriptRunning('grow.js', worker.host);

            if (!hasRunningScript) {
                if (ns.getServerSecurityLevel(target) > serverMinSecurityLevel * securityThreshold) {
                    ns.exec('weaken.js', worker.host, { threads: Math.floor(worker.ramMax / weakenRamCost) }, target);
                } else if (ns.getServerMoneyAvailable(target) < serverMaxMoney) {
                    ns.exec('grow.js', worker.host, { threads: Math.floor(worker.ramMax / growRamCost) }, target);
                }
            }
        });

        await ns.sleep(3000);
    }

    let threadsNeededForHack = ns.hackAnalyzeThreads(target, serverMaxMoney * moneyThreshold);

    while (true) {
        workers.forEach(worker => {
            const hasRunningScript = ns.scriptRunning('weaken.js', worker.host) || ns.scriptRunning('grow.js', worker.host) || ns.scriptRunning('hack.js', worker.host);

            if (!hasRunningScript) {
                threadsNeededForHack = ns.hackAnalyzeThreads(target, serverMaxMoney * moneyThreshold);
                if (ns.getServerSecurityLevel(target) > serverMinSecurityLevel * securityThreshold) {
                    ns.exec('weaken.js', worker.host, { threads: Math.floor(worker.ramMax / weakenRamCost) }, target);
                } else if (ns.getServerMoneyAvailable(target) < serverMaxMoney) {
                    ns.exec('grow.js', worker.host, { threads: Math.floor(worker.ramMax / growRamCost) }, target);
                } else {
                    if (threadsNeededForHack > 0) {
                        const hackThreads = Math.floor(worker.ramMax / hackRamCost);
                        const threadsNeeded = threadsNeededForHack < hackThreads ? threadsNeededForHack : hackThreads;
                        threadsNeededForHack -= threadsNeeded;
                        ns.exec('hack.js', worker.host, { threads: threadsNeeded }, target);
                    }
                }
            }
        });

        await ns.sleep(3000);
    }
}