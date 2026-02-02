/**
 * @param {NS} ns
 */
export const main = async (ns) => {
    ns.tprint(`Max purchasable ram for $${ns.args[0] ?? ns.getServerMoneyAvailable('home')}: ${serverCost(ns, ns.args[0])} GBs`);
}

/**
 * @param {NS} ns
*/
const serverCost = (ns, cost) => {
    const money = parseInt(cost ?? ns.getServerMoneyAvailable('home'));
    const minRam = 2;
    const maxRam = ns.getPurchasedServerMaxRam();

    let maxAffordableRam = minRam;
    for (let ram = minRam; ram <= maxRam; ram *= 2) {
        const quote = ns.getPurchasedServerCost(ram);

        if (quote <= money) {
            maxAffordableRam = ram;
        } else {
            break;
        }
    }

    return maxAffordableRam;
}

export default serverCost;