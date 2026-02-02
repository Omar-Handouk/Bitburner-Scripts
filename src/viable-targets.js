import scan from 'src/scan.js';

/** @param {NS} ns */
export const main = (ns) => {
    const viableTargets = scan(ns).filter(target => target.rootable && target.viableTarget).sort((a, b) => b.moneyMax - a.moneyMax);
    ns.tprint(viableTargets);
}