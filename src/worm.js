import scan from 'src/scan.js';

/**
 * @param {NS} ns 
 */
export const main = async (ns) => {
    const scripts = [
        { name: 'BruteSSH.exe', func: ns.brutessh },
        { name: 'FTPCrack.exe', func: ns.ftpcrack },
        { name: 'relaySMTP.exe', func: ns.relaysmtp },
        { name: 'HTTPWorm.exe', func: ns.httpworm },
        { name: 'SQLInject.exe', func: ns.sqlinject }
    ];

    const targets = scan(ns).filter(target => target.rootable);
    const availableScripts = scripts.filter(({ name }) => ns.fileExists(name));

    targets.forEach(target => {
        //if (target.rooted) return;
        availableScripts.forEach(({ _, func }) => func(target.host));
        ns.nuke(target.host);
        ns.scp(['hack.js', 'weaken.js', 'grow.js'], target.host);
    });

    targets.forEach(target => ns.tprint(`✓ Rooted ${target.host}`));
}