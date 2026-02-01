/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0] || "n00dles";
    const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    const securityThresh = ns.getServerMinSecurityLevel(target) + 5;

    ns.tprint(`Starting automated HGW on ${target}`);
    ns.tprint(`Money threshold: $${ns.formatNumber(moneyThresh)}`);
    ns.tprint(`Security threshold: ${securityThresh}`);

    while (true) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const currentMoney = ns.getServerMoneyAvailable(target);
        const minSecurity = ns.getServerMinSecurityLevel(target);
        const maxMoney = ns.getServerMaxMoney(target);

        // Priority 1: Weaken if security is too high
        if (currentSecurity > securityThresh) {
            const weakenTime = ns.getWeakenTime(target);
            ns.print(`WEAKEN | Security: ${currentSecurity.toFixed(2)}/${minSecurity.toFixed(2)} | Time: ${ns.tFormat(weakenTime)}`);
            await ns.weaken(target);
        }
        // Priority 2: Grow if money is too low
        else if (currentMoney < moneyThresh) {
            const growTime = ns.getGrowTime(target);
            ns.print(`GROW | Money: $${ns.formatNumber(currentMoney)}/$${ns.formatNumber(maxMoney)} | Time: ${ns.tFormat(growTime)}`);
            await ns.grow(target);
        }
        // Priority 3: Hack when conditions are good
        else {
            const hackTime = ns.getHackTime(target);
            const hackChance = ns.hackAnalyzeChance(target);
            ns.print(`HACK | Chance: ${(hackChance * 100).toFixed(1)}% | Time: ${ns.tFormat(hackTime)}`);
            await ns.hack(target);
        }
    }
}
