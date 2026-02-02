import serverCost from 'src/server-cost';
/**
 * @param {NS} ns
 */

export const main = async (ns) => {
    const cost = parseInt(ns.args[0] ?? ns.getServerMoneyAvailable('home'));

    // Get the suffix for the server for server enumeration
    const serverNumber = parseInt(ns.getPurchasedServers().pop()?.split('-')[1] ?? '0') + 1;

    ns.purchaseServer(`pserv-${serverNumber}`, serverCost(ns, cost));
}