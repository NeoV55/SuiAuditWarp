import { toast } from "react-toastify";

export interface WalrusDeploymentConfig {
  gasPrice: number; // In SUI
  storageEpochs: number; // How many epochs to store
  estimatedCost: number; // Total cost in SUI
}

export interface WalrusDeploymentResult {
  blobId: string;
  transactionHash: string;
  cost: number;
  storageEpochs: number;
  expirationEpoch: number;
}

/**
 * Calculate the cost for storing data on Walrus
 * Based on data size and storage duration
 */
export function calculateWalrusDeploymentCost(
  fileSizeBytes: number,
  storageEpochs: number = 10
): WalrusDeploymentConfig {
  // Walrus pricing: approximately 0.01 SUI per MB per epoch
  const sizeInMB = fileSizeBytes / (1024 * 1024);
  const baseStorageCost = sizeInMB * 0.01 * storageEpochs;
  
  // Add gas fees (estimated 0.001 SUI for transaction)
  const gasPrice = 0.001;
  const estimatedCost = baseStorageCost + gasPrice;
  
  return {
    gasPrice,
    storageEpochs,
    estimatedCost: Math.ceil(estimatedCost * 1000) / 1000 // Round to 3 decimal places
  };
}

/**
 * Deploy content to Walrus with actual payment and transaction
 */
export async function deployToWalrus(
  file: File | Blob,
  config: WalrusDeploymentConfig,
  contentType?: string
): Promise<WalrusDeploymentResult> {
  try {
    // Step 1: Upload to Walrus with deployment parameters
    const formData = new FormData();
    formData.append('file', file);
    formData.append('storageEpochs', config.storageEpochs.toString());
    formData.append('expectedCost', config.estimatedCost.toString());
    
    const response = await fetch("/api/walrus/deploy", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.message || `Deployment failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    toast.success(`Successfully deployed to Walrus! Cost: ${result.cost} SUI`);
    
    return result;
  } catch (error) {
    console.error("Walrus deployment error:", error);
    toast.error(`Deployment failed: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get deployment status and transaction details
 */
export async function getWalrusDeploymentStatus(blobId: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  cost?: number;
  expirationEpoch?: number;
  currentEpoch?: number;
}> {
  try {
    const response = await fetch(`/api/walrus/deployment-status/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get deployment status: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get deployment status:", error);
    throw error;
  }
}

/**
 * Estimate gas and deployment costs before actual deployment
 */
export async function estimateWalrusDeployment(
  fileSizeBytes: number,
  storageEpochs: number = 10
): Promise<{
  estimatedCost: number;
  breakdown: {
    storageCost: number;
    gasCost: number;
    totalCost: number;
  };
  epochs: {
    storage: number;
    current: number;
    expiration: number;
  };
}> {
  try {
    const response = await fetch('/api/walrus/estimate-deployment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileSizeBytes,
        storageEpochs,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to estimate deployment cost: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to estimate deployment cost:", error);
    throw error;
  }
}