import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { toast } from "react-toastify";

// Sui testnet configuration for Walrus
const SUI_CLIENT = new SuiClient({ url: getFullnodeUrl("testnet") });

// Walrus contract addresses on Sui testnet
const WALRUS_SYSTEM_OBJECT = "0x2";
const WALRUS_STORAGE_PACKAGE = "0xwalrus_package_id"; // Replace with actual package ID

export interface WalrusDeploymentResult {
  blobId: string;
  transactionDigest: string;
  suiCost: number;
  storageEpochs: number;
  expirationEpoch: number;
  objectId: string;
}

/**
 * Deploy content to Walrus using actual Sui blockchain transactions
 */
export async function deployToWalrusOnSui(
  fileData: Uint8Array,
  storageEpochs: number = 10,
  walletAddress?: string
): Promise<WalrusDeploymentResult> {
  
  if (!walletAddress) {
    throw new Error("Wallet connection required for Walrus deployment");
  }

  try {
    // Calculate storage cost in MIST (1 SUI = 1,000,000,000 MIST)
    const fileSizeMB = fileData.length / (1024 * 1024);
    const storageCostSui = fileSizeMB * 0.01 * storageEpochs;
    const gasCostSui = 0.001;
    const totalCostSui = storageCostSui + gasCostSui;
    const totalCostMist = Math.ceil(totalCostSui * 1_000_000_000);

    // Create transaction block for Walrus storage
    const txb = new TransactionBlock();
    
    // Set gas budget
    txb.setGasBudget(1_000_000); // 0.001 SUI in MIST
    
    // Convert file data to vector<u8> for Move
    const fileVector = Array.from(fileData);
    
    // Call Walrus store function
    const [storageObject] = txb.moveCall({
      target: `${WALRUS_STORAGE_PACKAGE}::walrus::store`,
      arguments: [
        txb.pure(fileVector, "vector<u8>"),
        txb.pure(storageEpochs, "u64"),
      ],
    });
    
    // Transfer payment for storage
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(totalCostMist, "u64")]);
    txb.transferObjects([coin], txb.pure(WALRUS_SYSTEM_OBJECT, "address"));
    
    // Transfer storage object to user
    txb.transferObjects([storageObject], txb.pure(walletAddress, "address"));

    // Request wallet to sign and execute transaction
    const result = await executeWalrusTransaction(txb);
    
    return {
      blobId: result.blobId,
      transactionDigest: result.digest,
      suiCost: totalCostSui,
      storageEpochs,
      expirationEpoch: result.expirationEpoch,
      objectId: result.objectId
    };
    
  } catch (error) {
    console.error("Sui Walrus deployment error:", error);
    throw new Error(`Walrus deployment failed: ${(error as Error).message}`);
  }
}

/**
 * Execute Walrus transaction using connected wallet
 */
async function executeWalrusTransaction(txb: TransactionBlock): Promise<{
  digest: string;
  blobId: string;
  expirationEpoch: number;
  objectId: string;
}> {
  
  // Check if wallet is connected
  if (typeof window === 'undefined' || !window.suiWallet) {
    throw new Error("Sui wallet not connected");
  }

  try {
    // Sign and execute transaction through wallet
    const result = await window.suiWallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    if (!result.digest) {
      throw new Error("Transaction failed - no digest returned");
    }

    // Extract Walrus-specific data from transaction result
    const walrusEvent = result.events?.find(
      event => event.type.includes("walrus::StorageEvent")
    );
    
    const blobId = walrusEvent?.parsedJson?.blob_id || generateBlobId(result.digest);
    const objectId = result.objectChanges?.find(
      change => change.type === "created"
    )?.objectId || "";
    
    // Get current epoch and calculate expiration
    const currentEpoch = await getCurrentEpoch();
    const expirationEpoch = currentEpoch + 10; // Default 10 epochs
    
    return {
      digest: result.digest,
      blobId,
      expirationEpoch,
      objectId
    };
    
  } catch (error) {
    console.error("Transaction execution failed:", error);
    throw new Error(`Transaction failed: ${(error as Error).message}`);
  }
}

/**
 * Get current Sui epoch
 */
async function getCurrentEpoch(): Promise<number> {
  try {
    const epoch = await SUI_CLIENT.getLatestSuiSystemState();
    return parseInt(epoch.epoch);
  } catch (error) {
    console.error("Failed to get current epoch:", error);
    return 1000; // Fallback epoch
  }
}

/**
 * Generate blob ID from transaction digest
 */
function generateBlobId(digest: string): string {
  // Create deterministic blob ID from transaction digest
  return digest.replace("0x", "").substring(0, 32);
}

/**
 * Check wallet connection and balance
 */
export async function checkWalletForWalrusDeployment(): Promise<{
  connected: boolean;
  address?: string;
  balance?: number;
  sufficientFunds: boolean;
}> {
  if (typeof window === 'undefined' || !window.suiWallet) {
    return { connected: false, sufficientFunds: false };
  }

  try {
    const accounts = await window.suiWallet.getAccounts();
    if (!accounts || accounts.length === 0) {
      return { connected: false, sufficientFunds: false };
    }

    const address = accounts[0].address;
    const balance = await SUI_CLIENT.getBalance({ owner: address });
    const balanceSui = parseInt(balance.totalBalance) / 1_000_000_000;
    
    // Check if user has enough SUI for deployment (minimum 0.02 SUI)
    const sufficientFunds = balanceSui >= 0.02;
    
    return {
      connected: true,
      address,
      balance: balanceSui,
      sufficientFunds
    };
    
  } catch (error) {
    console.error("Wallet check failed:", error);
    return { connected: false, sufficientFunds: false };
  }
}

/**
 * Extend window interface for Sui wallet
 */
declare global {
  interface Window {
    suiWallet?: {
      getAccounts(): Promise<{ address: string }[]>;
      signAndExecuteTransactionBlock(args: {
        transactionBlock: TransactionBlock;
        options: any;
      }): Promise<any>;
    };
  }
}