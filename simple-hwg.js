/**
 * @param {NS} ns 
 */
export const main = async (ns) => {
    const { _, sec: securityThreshold, mon: moneyThreshold } = ns.flags([
        ['sec', 1.25],
        ['mon', 0.75]
    ]);

    const worker = _[0];
    const target = _[1];
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
    const serverMaxRam = ns.getServerMaxRam(worker);

    //Prep Phase
    while (ns.getServerSecurityLevel(target) > serverMinSecurityLevel * securityThreshold || ns.getServerMoneyAvailable(target) < serverMaxMoney) {
        const hasRunningScript = ns.scriptRunning('weaken.js', worker) || ns.scriptRunning('grow.js', worker);

        if (!hasRunningScript) {
            if (ns.getServerSecurityLevel(target) > serverMinSecurityLevel * securityThreshold) {
                ns.exec('weaken.js', worker, { threads: Math.floor(serverMaxRam / weakenRamCost) }, target);
            } else if (ns.getServerMoneyAvailable(target) < serverMaxMoney){
                ns.exec('grow.js', worker, { threads: Math.floor(serverMaxRam / growRamCost) }, target);
            }
        }

        await ns.sleep(3000);
    }


}