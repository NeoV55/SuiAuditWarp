import { ethers } from "ethers";
import { toast } from "react-toastify";

// Wormhole bridge constants - SEPOLIA TESTNET (2025)
const WORMHOLE_BRIDGE_ADDRESS = "0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78"; // Sepolia Testnet
const WORMHOLE_TOKEN_BRIDGE_ADDRESS = "0xDB5492265f6038831E89f495670FF909aDe94bd9"; // Sepolia Testnet
const SUI_CHAIN_ID = 21; // Sui chain ID in Wormhole
const ETHEREUM_CHAIN_ID = 2; // Ethereum chain ID in Wormhole

// Allowed testnet chain IDs for security (2025 active testnets)
const ALLOWED_TESTNET_CHAINS = [
  11155111, // Sepolia (Primary Ethereum testnet)
  17000,    // Holesky (Ethereum staking testnet)
  80002,    // Amoy (Current Polygon testnet, replaced Mumbai)
  97,       // BSC Testnet
];

/**
 * Validate that we're on a testnet chain
 */
async function validateTestnetChain(): Promise<boolean> {
  if (!window.ethereum) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const numericChainId = parseInt(chainId, 16);
    return ALLOWED_TESTNET_CHAINS.includes(numericChainId);
  } catch (error) {
    console.error('Failed to get chain ID:', error);
    return false;
  }
}

/**
 * Switch to Sepolia testnet (recommended)
 */
export async function switchToTestnet(): Promise<boolean> {
  if (!window.ethereum) {
    toast.error("MetaMask not found. Please install MetaMask.");
    return false;
  }

  try {
    // Try to switch to Sepolia testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
    });
    toast.success("Switched to Sepolia testnet successfully!");
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            },
          ],
        });
        toast.success("Sepolia testnet added and switched successfully!");
        return true;
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        toast.error("Failed to add Sepolia network to MetaMask");
        return false;
      }
    } else {
      console.error('Failed to switch to Sepolia:', switchError);
      toast.error("Failed to switch to Sepolia testnet");
      return false;
    }
  }
}

/**
 * Connect to MetaMask and ensure testnet
 */
export async function connectMetaMaskTestnet(): Promise<boolean> {
  if (!window.ethereum) {
    toast.error("MetaMask not found. Please install MetaMask.");
    return false;
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Check if we're on a testnet
    const isTestnet = await validateTestnetChain();
    
    if (!isTestnet) {
      toast.info("Please switch to a testnet network. Switching to Sepolia...");
      return await switchToTestnet();
    }
    
    toast.success("Connected to MetaMask on testnet!");
    return true;
  } catch (error) {
    console.error('MetaMask connection error:', error);
    toast.error("Failed to connect to MetaMask");
    return false;
  }
}

// Wormhole bridge ABI (partial, focusing on token transfer)
const WORMHOLE_TOKEN_BRIDGE_ABI = [
  "function transferTokens(address token, uint256 amount, uint16 recipientChain, bytes32 recipient, uint256 arbiterFee, uint32 nonce) external payable returns (uint64 sequence)",
  "function wrapAndTransferETH(uint16 recipientChain, bytes32 recipient, uint256 arbiterFee, uint32 nonce) external payable returns (uint64 sequence)"
];

/**
 * Transfer ETH using Wormhole bridge
 * 
 * Note: In a production environment, this would use the full Wormhole SDK
 * This implementation is simplified for the purpose of this demo
 * 
 * @param sender Ethereum address of the sender
 * @param recipient Sui address of the recipient
 * @param amount Amount of ETH to transfer
 * @param ipfsHash IPFS hash of the audit report
 * @returns Transaction receipt
 */
export async function transferTokens(
  sender: string,
  recipient: string,
  amount: number,
  reportHash: string
): Promise<any> {
  try {
    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error("MetaMask not found. Please install MetaMask to use cross-chain bridging.");
    }

    // Validate we're on a testnet chain only
    const isTestnet = await validateTestnetChain();
    if (!isTestnet) {
      throw new Error("Wormhole bridge is only available on testnet chains (Sepolia, Holesky, Amoy, BSC Testnet). Please switch to a testnet network.");
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    console.log(`Initiating Wormhole bridge transfer from ${sender} to ${recipient} for ${amount} ETH`);
    console.log(`Report hash: ${reportHash}`);
    
    // Convert Sui address to bytes32 format for Wormhole
    const recipientBytes32 = ethers.utils.zeroPad(
      ethers.utils.toUtf8Bytes(recipient.slice(0, 32)), 
      32
    );
    
    // Create contract instance
    const tokenBridge = new ethers.Contract(
      WORMHOLE_TOKEN_BRIDGE_ADDRESS,
      WORMHOLE_TOKEN_BRIDGE_ABI,
      signer
    );

    // Calculate bridge fee (typically 0.002 ETH)
    const bridgeFee = ethers.utils.parseEther("0.002");
    const transferAmount = ethers.utils.parseEther(amount.toString());
    const totalAmount = transferAmount.add(bridgeFee);

    toast.info("Confirm the Wormhole bridge transaction in your wallet...");
    
    // Execute the Wormhole bridge transaction
    const tx = await tokenBridge.wrapAndTransferETH(
      SUI_CHAIN_ID, // Destination chain (Sui)
      recipientBytes32, // Recipient address as bytes32
      bridgeFee, // Arbitrum fee
      Math.floor(Math.random() * 1000000), // Nonce
      {
        value: totalAmount,
        gasLimit: 300000
      }
    );

    toast.info("Transaction submitted, waiting for confirmation...");
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      toast.success("Bridge transaction confirmed! VAA will be available shortly.");
      console.log("Wormhole bridge transaction successful:", receipt.hash);
      
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        status: receipt.status,
        sequence: receipt.logs[0]?.topics[1] // Wormhole sequence number
      };
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error: any) {
    console.error("Wormhole bridge error:", error);
    
    if (error.code === 4001) {
      toast.error("Transaction rejected by user");
      throw new Error("Transaction rejected by user");
    } else if (error.code === -32603) {
      toast.error("Insufficient funds for transaction");
      throw new Error("Insufficient funds for transaction");
    } else {
      toast.error("Bridge transaction failed. Please try again.");
      throw new Error(`Failed to bridge tokens: ${error.message}`);
    }
  }
}

/**
 * Get the status of a Wormhole VAA
 * 
 * @param txHash Transaction hash of the Wormhole transfer
 * @returns VAA status object
 */
export async function getVAAStatus(txHash: string) {
  try {
    // In a real implementation, we would query the Wormhole Guardian network
    // for the status of the VAA using the transaction hash
    
    // For demo purposes, simulate a successful VAA after a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      status: "confirmed",
      sequence: "12345",
      emitterChain: "ethereum",
      emitterAddress: WORMHOLE_TOKEN_BRIDGE_ADDRESS,
      vaaBytes: "0x..."
    };
  } catch (error) {
    console.error("Failed to fetch VAA status:", error);
    throw new Error(`Failed to fetch VAA status: ${(error as Error).message}`);
  }
}
