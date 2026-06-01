# 🧵 TextileNexus — Decentralized Textile Supply Chain

A full-stack decentralized application (dApp) built on Ethereum using **Hardhat 3**, **Solidity 0.8.28**, **viem**, and **React + Vite**.

---

## 📁 Project Structure

```
CV Project 3/
├── contracts/              # Solidity smart contracts
│   ├── TexileNexus.sol     # Main contract (TextileNexusPro)
│   ├── TextileLogic.sol    # Library with business logic
│   └── TextileTypes.sol    # Shared enums and structs
├── ignition/modules/
│   └── deploy.js           # Hardhat Ignition deployment module
├── backend/
│   ├── contractBridge.ts   # viem client + contract call helpers (used by frontend)
│   └── abi.ts              # Contract ABI
├── frontend/               # React + Vite frontend
│   ├── pages/              # App pages (Operations, Admin, etc.)
│   └── src/                # Components and routing
├── hardhat.config.ts       # Hardhat configuration
└── package.json
```

---

## ✅ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

Then install all root-level dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

---

## 🚀 Running the Project (3 Terminals)

You need **three separate terminal tabs/windows** running simultaneously.

---

### Terminal 1 — Start the Local Blockchain Node

```bash
npx hardhat node
```

> ✅ Wait until you see:
> `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/`
>
> The node prints 20 accounts with their private keys — keep this terminal open at all times.

---

### Terminal 2 — Compile & Deploy the Smart Contracts

First, compile the contracts:

```bash
npx hardhat compile
```

Then deploy to the running local node:

```bash
npx hardhat ignition deploy ignition/modules/deploy.js --network localhost
```

> ✅ You will see output like:
> ```
> TextileModule#TextileLogic    - 0x5FbDB2315678afecb367f032d93F642f64180aa3
> TextileModule#TextileNexusPro - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
> ```

> ⚠️ **Important:** After every fresh `npx hardhat node` restart, you must re-deploy. The addresses reset each time the node restarts.

#### Update Contract Addresses

After deploying, copy the printed addresses into `backend/contractBridge.ts`:

```ts
// backend/contractBridge.ts — line ~36
export const CONTRACT_ADDRESSES = {
  TextileLogic:    "0x<TextileLogic address from deploy output>"   as Address,
  TextileNexusPro: "0x<TextileNexusPro address from deploy output>" as Address,
};
```

---

### Terminal 3 — Start the Frontend

```bash
cd frontend
npm run dev
```

> ✅ App runs at: **http://localhost:5173**

---

## 🔑 Hardhat Default Accounts (Local Network)

These accounts are always available on the local Hardhat node and never change:

| # | Address | Role (suggested) |
|---|---------|-----------------|
| 0 | `0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266` | Admin / Deployer |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Council Member 2 |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Council Member 3 |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Farmer / Vendor |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Inspector |

> These are the council members hardcoded in `deploy.js`. Multisig threshold is set to **2-of-3**.

---

## 🌐 Deploying to Sepolia Testnet

Set your environment variables first:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then deploy:

```bash
npx hardhat ignition deploy ignition/modules/deploy.js --network sepolia
```

---

## 🧪 Running Tests

```bash
npx hardhat test
```

Run only Solidity tests:
```bash
npx hardhat test solidity
```

Run only Node.js tests:
```bash
npx hardhat test nodejs
```

---

## ⚠️ Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Artifact for contract "Counter" not found` | Wrong deploy module | Use `deploy.js` not `Counter.ts` |
| `Cannot connect to network "localhost"` | Node not running | Start `npx hardhat node` first |
| `Missing script: "build"` | Wrong directory | Run `npm run build` inside `frontend/` |
| Stale contract addresses | Node restarted | Re-deploy and update `contractBridge.ts` |

---

## 🛑 Shutdown Order

1. Stop the frontend (`Ctrl+C` in Terminal 3)
2. Stop the Hardhat node (`Ctrl+C` in Terminal 1)

> Note: Stopping the node wipes all on-chain state. You must re-deploy next time.
# Enterprise-Network-Architecture-Simulation
