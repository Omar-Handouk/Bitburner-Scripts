/**
 * @param {NS} ns 
 */
export const main = async (ns) => {
    const { _, s: securityThreshold, m: moneyThreshold } = ns.flags([
        ['s', 1.25],
        ['m', 0.75]
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

/**
 * HWG Logic
 * 1- Scan the network to identify the amount of resources that can be exploited
 * 2- Prep target in order to reach min security and max cash
 * 3- Deploy master process that does the following
 * 4- Check if security level for target <= target security * thershold
 * 5- Check if money level for target >= target cash * threshold
 * 6- If both achieved spawn #threads that enables reaching the targeted amount of cash prioritizing hosts with largest amount of ram
 */