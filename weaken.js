/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    await ns.weaken(ns.args[0]);
}