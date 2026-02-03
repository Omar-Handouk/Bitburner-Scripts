// hwgw.js - Batch HWGW controller
// Usage: run hwgw.js [target] [worker]
// Example: run hwgw.js n00dles home

/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  const worker = ns.args[1] || ns.getHostname();
  
  if (!target) {
    ns.tprint("Usage: run hwgw.js [target] [worker]");
    return;
  }

  // Timing constants
  const SPACER = 50; // ms between batch operations landing

  // Get server security/money info
  const minSec = ns.getServerMinSecurityLevel(target);
  const maxMoney = ns.getServerMaxMoney(target);

  // Prep phase - run on worker
  ns.tprint(`Prepping ${target}...`);
  
  while (ns.getServerSecurityLevel(target) > minSec || ns.getServerMoneyAvailable(target) < maxMoney) {
    const currentSec = ns.getServerSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);
    
    if (currentSec > minSec) {
      // Weaken to min security
      const weakenAmount = currentSec - minSec;
      const weakenThreads = Math.ceil(weakenAmount / ns.weakenAnalyze(1));
      const availableRam = ns.getServerMaxRam(worker) - ns.getServerUsedRam(worker);
      const threads = Math.min(weakenThreads, Math.floor(availableRam / ns.getScriptRam("src/weaken.js")));
      
      if (threads > 0) {
        const pid = ns.exec("src/weaken.js", worker, threads, target, 0, "prep");
        if (pid > 0) {
          await ns.sleep(ns.getWeakenTime(target) + 100);
        } else {
          await ns.sleep(1000);
        }
      } else {
        ns.print("Not enough RAM for prep weaken");
        await ns.sleep(1000);
      }
    } else if (currentMoney < maxMoney) {
      // Grow to max money
      const growMultiplier = maxMoney / Math.max(1, currentMoney);
      const growThreads = Math.ceil(ns.growthAnalyze(target, growMultiplier));
      const availableRam = ns.getServerMaxRam(worker) - ns.getServerUsedRam(worker);
      const threads = Math.min(growThreads, Math.floor(availableRam / ns.getScriptRam("src/grow.js")));
      
      if (threads > 0) {
        const pid = ns.exec("src/grow.js", worker, threads, target, 0, "prep");
        if (pid > 0) {
          await ns.sleep(ns.getGrowTime(target) + 100);
        } else {
          await ns.sleep(1000);
        }
      } else {
        ns.print("Not enough RAM for prep grow");
        await ns.sleep(1000);
      }
    }
    
    ns.print(`Prep: Sec ${currentSec.toFixed(2)}/${minSec} | Money ${ns.formatNumber(currentMoney)}/${ns.formatNumber(maxMoney)}`);
  }

  ns.tprint(`${target} prepped! Starting HWGW batches from ${worker}`);

  while (true) {
    const hackTime = ns.getHackTime(target);
    const growTime = ns.getGrowTime(target);
    const weakenTime = ns.getWeakenTime(target);

    // Calculate threads
    const hackPercent = 0.25; // Hack 25% of money
    const hackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, maxMoney * hackPercent)));
    const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads);
    const weaken1Threads = Math.max(1, Math.ceil(hackSecIncrease / ns.weakenAnalyze(1)));
    
    const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, 1 / (1 - hackPercent)) * 1.1));
    const growSecIncrease = ns.growthAnalyzeSecurity(growThreads);
    const weaken2Threads = Math.max(1, Math.ceil(growSecIncrease / ns.weakenAnalyze(1)));

    // Calculate delays so operations land in order: H, W1, G, W2
    const weaken1Delay = 0;
    const weaken2Delay = SPACER * 2;
    const hackDelay = weakenTime - hackTime - SPACER;
    const growDelay = weakenTime - growTime + SPACER;

    // Check if we have enough RAM
    const hackRam = ns.getScriptRam("src/hack.js") * hackThreads;
    const growRam = ns.getScriptRam("src/grow.js") * growThreads;
    const weakenRam = ns.getScriptRam("src/weaken.js") * (weaken1Threads + weaken2Threads);
    const totalRam = hackRam + growRam + weakenRam;
    const availableRam = ns.getServerMaxRam(worker) - ns.getServerUsedRam(worker);

    if (totalRam > availableRam) {
      ns.print(`Not enough RAM. Need ${totalRam.toFixed(2)}, have ${availableRam.toFixed(2)}. Waiting...`);
      await ns.sleep(1000);
      continue;
    }

    // Launch batch
    const batchId = Date.now();
    
    if (hackDelay >= 0) ns.exec("src/hack.js", worker, hackThreads, target, hackDelay, batchId);
    ns.exec("src/weaken.js", worker, weaken1Threads, target, weaken1Delay, batchId);
    ns.exec("src/grow.js", worker, growThreads, target, growDelay, batchId);
    ns.exec("src/weaken.js", worker, weaken2Threads, target, weaken2Delay, batchId);

    // Wait for batch to complete before launching next
    await ns.sleep(weakenTime + SPACER * 4);
  }
}