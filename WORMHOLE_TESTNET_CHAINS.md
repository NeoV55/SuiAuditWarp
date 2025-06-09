# Wormhole Testnet Chains - AuditWarp

## Supported Testnet Chains

AuditWarp's Wormhole bridge functionality is **testnet-only** for security purposes. The following testnet chains are supported:

### Ethereum Testnets
- **Sepolia Testnet** (Chain ID: 11155111) - **Primary**
  - Native currency: ETH
  - RPC: `https://sepolia.infura.io/v3/`
  - Block explorer: `https://sepolia.etherscan.io/`
  - Auto-configured in MetaMask

- **Holesky Testnet** (Chain ID: 17000) - **Staking Testnet**
  - Native currency: ETH
  - RPC: `https://ethereum-holesky-rpc.publicnode.com`
  - Block explorer: `https://holesky.etherscan.io/`

### Polygon Testnet
- **Amoy Testnet** (Chain ID: 80002) - **Current Polygon Testnet**
  - Native currency: MATIC
  - RPC: `https://rpc-amoy.polygon.technology/`
  - Block explorer: `https://amoy.polygonscan.com/`
  - Replaced Mumbai in 2024

### Binance Smart Chain Testnet
- **BSC Testnet** (Chain ID: 97)
  - Native currency: BNB
  - RPC: `https://data-seed-prebsc-1-s1.binance.org:8545/`
  - Block explorer: `https://testnet.bscscan.com/`

## Bridge Configuration

### Source Chains
- Any of the above supported testnet chains
- MetaMask wallet required
- Minimum 0.002 ETH for bridge fees

### Destination Chain
- **Sui Testnet** (Wormhole Chain ID: 21)
- Sui wallet connection via @mysten/dapp-kit

### Bridge Fees
- **Standard Fee**: 0.002 ETH
- **Total Cost**: Transfer amount + 0.002 ETH bridge fee

## Security Features

1. **Testnet-Only Operation**: Mainnet chains are blocked for safety
2. **Chain Validation**: Automatic verification of allowed testnet chains
3. **Auto-Switch**: Prompts users to switch to Sepolia if on unsupported network
4. **MetaMask Integration**: Seamless wallet connection and network switching

## Usage Flow

1. Connect MetaMask wallet
2. Ensure you're on a supported testnet (auto-switches to Sepolia)
3. Enter transfer amount (minimum bridge fee applies)
4. Confirm transaction in MetaMask
5. Bridge processes cross-chain transfer to Sui testnet
6. VAA (Verifiable Action Approval) generated for verification

## Technical Details

- **Wormhole Bridge Contract**: `0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78` (Sepolia)
- **Token Bridge Contract**: `0xDB5492265f6038831E89f495670FF909aDe94bd9` (Sepolia)
- **Gas Limit**: 300,000 gas for bridge transactions
- **VAA Processing**: Automatic verification after transaction confirmation

## Important Notes

- **Testnet Only**: This implementation is designed exclusively for testnet usage
- **No Mainnet Support**: Mainnet transactions are intentionally blocked
- **Demo Purpose**: Simplified implementation for demonstration
- **Production Warning**: Full Wormhole SDK required for production deployment