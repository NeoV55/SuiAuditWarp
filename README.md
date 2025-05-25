<p align="center"><img src="/logo.png" width="480"\></p>

## AI-Powered Smart Contract Audits for Move, Secured On-Chain with Sui + Cross-Chain Access via Wormhole
****

## 🌀 Overview

**SuiAuditWarp** is a cross-chain, AI-powered auditing platform purpose-built for smart contracts on the Move language and the Sui blockchain. By leveraging advanced LLMs, decentralized storage (IPFS), and on-chain proof via Sui NFTs, SuiAuditWarp enables developers to audit their code in seconds and anchor verifiable results on-chain. With seamless cross-chain access enabled by Wormhole and no prior Sui expertise required, it's a powerful tool for securing DeFi, NFT, and multi-chain applications with speed, transparency, and trust.

Check out the live dapp here: [💧 SuiAuditWarp ](https://audit-warp.vercel.app/)

---

## 🧠 Architecture Overview

- **User** sends code to **Frontend**  
- **Frontend** calls the **AI Agent** _and_ directly writes to **IPFS/Walrus**  
- **AI Agent** sends analysis to a **Server**, which generates the **PDF Report**  
- **PDF Report** is uploaded to **IPFS/Walrus**  
- **IPFS** then feeds into the **Sui NFT Mint**  
- Finally, the **Wormhole SDK** bridges the proof‑NFT out to any **EVM Chain** and back
- Optionally, the **Move Analyzer** for code compiling assistance 

---

- **Frontend**: Built with `React`, `Tailwind CSS`, `Radix UI`, `Viem`
- **AI Engine**: Uses `OpenAI API` or `Google Gemini` for LLM-based code analysis (pluggable AI api's for: `deepseek` , `Anthropics` and more )
- **Storage**: Generates PDF reports → uploads to `IPFS` (via `Pinata` or `Walrus`)
- **Proof**: Mints Sui NFTs containing audit metadata and `IPFS` hash
- **Cross-chain Access**: `Wormhole` SDK enables EVM ↔ Sui communication
- **Sui Code-Support**: `Move Analyzer` enables compiler support features for Move programming language
- **Wallets Supported**: `DappKit` (Sui), `Web3-react` (EVM)

---

## ⚙️ Core Functions

| Module             | Description |
|--------------------|-------------|
| `analyzeCode()`    | Sends Move code to AI for audit |
| `generatePDF()`    | Converts audit results into styled PDF |
| `uploadToIPFS()`   | Uploads generated PDF via Pinata API |
| `mintAuditNFT()`   | Mints NFT on Sui with audit metadata |
| `wormholeBridge()` | Facilitates cross-chain access & token payments |
| `connectWallet()`  | Initializes wallet connection (Sui or EVM) |

---

### 📄 Sui Deployment (Testnet)

- **Sui NFT Contract Address (Testnet):** [`0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914`](https://testnet.suivision.xyz/package/0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914?tab=Code)  
- **Deployer Address (Testnet):** [`0x768478578364d08dfc4e7c114a883602289256f0e603b64f58eb14ac288ab673`](https://testnet.suivision.xyz/account/0x768478578364d08dfc4e7c114a883602289256f0e603b64f58eb14ac288ab673)

---

## 👷🏻‍♂️ Installation & Local Setup

### 1. Clone the Repo

```bash
git clone https://github.com/DEEPML1818/SuiAuditWarp.git
cd SuiAuditWarp
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Create .env File

```bash
NEXT_PUBLIC_OPENAI_KEY=       # your OpenAI secret key
NEXT_PUBLIC_PINATA_API_KEY=          # your Pinata api key
NEXT_PUBLIC_PINATA_SECRET_API_KEY=      # your Pinata secret key
NEXT_PUBLIC_PACKAGE_ID=0x…         # your deployed Move package ID
```

### 4. Run Locally

```bash
npm run dev
# or
yarn dev
```
**Visit:** <http://localhost:3000>

---

### 🛠 Dependencies
- React
- OpenAI API
- Google Gemini API
- Pinata IPFS
- Walrus
- Sui SDK / DappKit
- Wormhole SDK
- React-PDF
- Web3-React
- Move Analyzer

---

### ✅ Enhancement
- Move Analyzer
- Compiler for Sui codes

---

### 🧪 Coming Soon
- Multi-agent AI audit consensus (voting mechanism)
- Public explorer for verified audits
- Tokenized credit system for audits
- Plugin system for third-party LLMs and chains
- SDK

---

### 🤝 Contributing
PRs and issues are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### 🔐 License
MIT License © 2025 SuiAuditWarp Contributors


