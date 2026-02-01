/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    await ns.hack(ns.args[0]);
}