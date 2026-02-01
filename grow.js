/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    await ns.grow(ns.args[0]);
}