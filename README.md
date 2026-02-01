# Bitburner Auto-Deploy Scripts

Comprehensive automated hacking suite with intelligent server management and profit optimization!

## 🚀 Quick Start

**Complete automation in one command:**
```
run auto-deploy.js
```
This will automatically buy servers, analyze targets, and maximize your profits!

---

## Scripts Overview

### 🎯 Main Orchestrators

#### `auto-deploy.js` ⭐ RECOMMENDED
**The complete automation solution!**
- Automatically buys and upgrades servers
- Analyzes ALL targets for profitability
- Distributes attacks across 1-5 best targets
- Prevents overwhelming targets with smart thread balancing
- Real-time profit estimates and status updates

**Usage:**
```
run auto-deploy.js
```

**Features:**
- Starts with 8GB servers, auto-upgrades to higher RAM
- Keeps money reserve for other purchases
- Updates every 30 seconds
- Handles multiple targets simultaneously
- Perfect for passive income!

---

#### `batch-coordinator.js` - Advanced Mode
**For experienced players seeking maximum efficiency**
- Executes precise HWGW (Hack-Weaken-Grow-Weaken) batches
- Preps targets to optimal conditions
- Perfect timing coordination
- Focuses on single most profitable target

**Usage:**
```
run batch-coordinator.js
```

**Best for:** Late game with stable RAM infrastructure

---

### 🛠️ Utility Scripts

#### `worm.js` - Network Spreader
- Scans entire network
- Cracks all accessible servers
- Deploys hack scripts everywhere
- Run this whenever you get new cracking programs!

**Usage:**
```
run worm.js
```

---

#### `early-hack.js` - Simple Worker
- Lightweight HWG loop (low RAM)
- Used by auto-deploy automatically
- Can run manually on specific targets

**Usage:**
```
run early-hack.js n00dles
```

---

#### `auto-hwg.js` - Manual Targeting
- Advanced HGW with detailed logging
- Good for testing specific targets
- Shows security, money, and timing stats

**Usage:**
```
run auto-hwg.js n00dles
```

---

### 🔧 Worker Scripts (Used by batch-coordinator)
- `hack.js` - Hack with delay
- `grow.js` - Grow with delay
- `weaken.js` - Weaken with delay

*Don't run these directly - they're used by batch-coordinator.js*

---

## 📈 Recommended Progression

### Stage 1: Early Game (< $1M)
```
run worm.js
```
- Take over the network
- Let worm-deployed scripts earn initial money
- Focus on leveling up

### Stage 2: Mid Game ($1M - $100M)
```
run auto-deploy.js
```
- THE MAIN MONEY MAKER!
- Automatically scales with your wealth
- Just let it run and watch profits grow
- Buy Augmentations when ready

### Stage 3: Late Game ($100M+)
```
run batch-coordinator.js
```
- Maximum efficiency batching
- Fine-tuned single-target attacks
- Optimized for high RAM setups

---

## ⚙️ Configuration

### auto-deploy.js Settings
```javascript
startingRam: 8           // Initial server size
maxUpgradeRam: 1048576   // Max server RAM (1PB)
minMoneyReserve: 1000000 // Money to keep in reserve
updateInterval: 30000    // Update every 30 seconds
```

### batch-coordinator.js Settings
```javascript
batchSpacing: 50         // ms between operations
hackPercent: 0.5         // Take 50% per batch
reserveHomeRam: 32       // Reserve RAM on home
minMoneyPercent: 0.95    // Prep to 95% max money
```

---

## 🎮 Quick Start Guide

**For most players (EASIEST):**
```
run worm.js        # Root all accessible servers
run auto-deploy.js # Start automated profit engine
```

**For advanced players:**
```
run worm.js              # Root all servers
run batch-coordinator.js # Maximum efficiency batching
```

**Manual control:**
```
run worm.js                 # Root all servers
run auto-hwg.js n00dles     # Manual target
```

---

## 💡 Pro Tips

1. **Start with auto-deploy.js** - Most forgiving and automated
2. **Reserve money** - Keep funds for Augmentations/programs
3. **More RAM = More Profit** - Upgrade servers when possible
4. **Hack level matters** - Higher level unlocks better targets
5. **Re-run worm.js** - Whenever you get new port crackers
6. **Monitor with tail** - `tail auto-deploy.js` for live stats
7. **Check profit estimates** - The script shows expected $/sec

## 🎯 Target Priority (Auto-selected by auto-deploy)

The scripts automatically target servers by profit-per-second ratio, but here are good early targets:

- **n00dles** - Always available, great for beginners
- **foodnstuff** - Good early money
- **sigma-cosmetics** - Decent returns
- **joesguns** - Higher level but good profit
- **hong-fang-tea** - Early game sweet spot

*auto-deploy.js analyzes ALL servers and picks the top 5 automatically!*

---

## 🐛 Troubleshooting

**"No valid targets found"**
- Run `worm.js` to root more servers
- Your hack level might be too low (train more!)

**"Not enough RAM"**
- auto-deploy will buy servers automatically when you have money
- Reduce `minMoneyReserve` in the config
- Kill other running scripts to free RAM

**Batch coordinator stuck in prep**
- Target might be too difficult for current stats
- Run `worm.js` first
- Try auto-deploy.js instead (more forgiving)

**Servers not being purchased**
- Check you have enough money above `minMoneyReserve`
- Script waits for 2x reserve before buying
- Increase your income first

---

## 📊 What Makes auto-deploy Smart?

1. **Profitability Analysis**: Calculates expected $/sec for every target
2. **Smart Distribution**: Spreads threads across multiple targets
3. **Anti-Overwhelm**: Never uses more threads than a target can handle
4. **Auto-Scaling**: Buys and upgrades servers as you earn money
5. **Multi-Target**: Attacks 1-5 targets simultaneously for diversification
6. **Real-time Adaptation**: Updates every 30 seconds to optimize

---

## 🔍 How Batch Coordinator Works

1. **Prep Phase**: Weakens to min security, grows to max money
2. **Thread Calculation**: Computes exact threads needed for HWGW
3. **Timing Coordination**: Delays operations to land in sequence
4. **Execution**: Runs Hack → Weaken → Grow → Weaken in perfect order
5. **Repeat**: Continuously batches for maximum efficiency

*This is advanced! Only use when you understand batching mechanics.*

---

## 📦 Script Dependencies

- `auto-deploy.js` requires: `early-hack.js`
- `batch-coordinator.js` requires: `hack.js`, `grow.js`, `weaken.js`
- `worm.js` requires: `early-hack.js`

**All scripts are included - just run them!**

---

## 🚀 Next Steps

Once you're making good money:
1. Buy Augmentations for permanent boosts
2. Join factions for better Augmentations
3. Increase hack level for better targets
4. Buy port crackers (BruteSSH.exe, FTPCrack.exe, etc.)
5. Rerun `worm.js` after getting new crackers
6. Let auto-deploy scale up your server farm

---

**Happy hacking! Let the scripts do the work while you focus on strategy! 🎮💰**
