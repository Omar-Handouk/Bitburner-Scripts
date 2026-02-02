import serverCost from 'src/server-cost';
/**
 * @param {NS} ns
 */

export const main = async (ns) => {
    const serverName = ns.args[0];
    const cost = parseInt(ns.args[1] ?? ns.getServerMoneyAvailable('home'));
    ns.upgradePurchasedServer(serverName, serverCost(ns, cost));
}