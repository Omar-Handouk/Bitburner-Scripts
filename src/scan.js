import hostInfo from 'src/host-info.js';
/** @param {NS} ns*/
export const main = (ns) => {
    const { a } = ns.flags([['a', false]]);

    // if flag 'a' (all) is set return all server, else only targets, useful for script killing
    const userServers = a ? [] : [...ns.getPurchasedServers(), 'home'];

    // Get all targets and exclude user hosts
    const targets = scan(ns, 'home').filter(target => !userServers.includes(target));
    
    ns.tprint(targets);
}

/**
 * @param {NS} ns 
 * @param {String} parent 
 */
const scan = (ns, parent = 'home') => {
    bfs(ns, parent);
    const targets = [...visisted.values()].map(target => hostInfo(ns, target));

    return targets;
}

const visisted = new Set();
/**
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

export default scan;