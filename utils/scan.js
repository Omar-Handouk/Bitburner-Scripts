import { main as hostInfo } from 'utils/host-info.js';
/** @param {NS} ns*/
export const main = (ns) => {
    bfs(ns, 'home');
    const flags = [
        ['a', false]
    ];

    // if flag 'a' (all) is set return all server, else only targets, useful for script killing
    const userServers = flags.a ? [] : [...ns.getPurchasedServers(), 'home'];

    // Get all targets and exclude user hosts
    const targets = [...visisted.values()].filter(target => !userServers.includes(target)).map(target => hostInfo(ns, target));

    return targets;
}

const visisted = new Set();
/**
 * 
 * @param {NS} ns 
 * @param {String} parent 
 */
const bfs = (ns, parent) => {
    const children = ns.scan(parent);
    visisted.add(parent);

    while (children.length > 0) {
        const child = children.shift();
        if (visisted.has(child)){
            continue;
        }
        visisted.add(child);
        children.push(...ns.scan(child));
    }
}