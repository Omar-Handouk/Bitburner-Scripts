/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    const [delay, host] = ns.args;
    await ns.sleep(parseInt(delay));
    await ns.grow(host);
}