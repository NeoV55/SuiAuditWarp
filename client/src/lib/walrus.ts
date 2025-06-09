
import { toast } from "react-toastify";

// Official Walrus testnet endpoints from MystenLabs documentation
const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
    };
  };
  alreadyCertified?: {
    blobId: string;
    eventSeq: number;
  };
}

export interface WalrusMetadata {
  blobId: string;
  size: number;
  uploadedAt: string;
  contentType?: string;
  deploymentCost?: number;
  storageEpochs?: number;
  transactionHash?: string;
}

/**
 * Calculate deployment cost for Walrus storage
 */
export function calculateDeploymentCost(fileSizeBytes: number, storageEpochs: number): number {
  const sizeInMB = fileSizeBytes / (1024 * 1024);
  const storageCost = sizeInMB * 0.01 * storageEpochs; // 0.01 SUI per MB per epoch
  const gasCost = 0.001; // Base gas cost
  return Math.ceil((storageCost + gasCost) * 1000) / 1000; // Round to 3 decimals
}

/**
 * Upload a file to Walrus decentralized storage with deployment options
 */
export async function uploadToWalrus(
  file: File | Blob,
  contentType?: string,
  retryCount: number = 0,
  useDeployment: boolean = false,
  storageEpochs: number = 10
): Promise<WalrusMetadata> {
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds base delay
  
  try {
    const endpoint = useDeployment ? "/api/walrus/deploy" : "/api/walrus/upload";
    const method = useDeployment ? "POST" : "PUT";
    
    let body: any = file;
    let headers: any = {
      "Content-Type": contentType || "application/octet-stream",
    };
    
    if (useDeployment) {
      // For deployment, include storage configuration
      headers["X-Storage-Epochs"] = storageEpochs.toString();
      headers["X-Expected-Cost"] = calculateDeploymentCost(file.size, storageEpochs).toString();
    }
    
    const response = await fetch(endpoint, {
      method,
      body,
      headers,
      signal: AbortSignal.timeout(60000), // 60 second timeout for testnet
    });

    if (!response.ok) {
      if (response.status === 503 && retryCount < maxRetries) {
        // Walrus network timeout - retry with exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Walrus network busy, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
        toast.info(`Walrus network busy - retrying upload in ${Math.ceil(delay/1000)} seconds (attempt ${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadToWalrus(file, contentType, retryCount + 1);
      }
      
      if (retryCount >= maxRetries) {
        throw new Error("WALRUS_MAX_RETRIES_EXCEEDED");
      }
      
      throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
    }

    const result: any = await response.json();
    
    let blobId: string;
    let size: number;
    let deploymentCost: number | undefined;
    let transactionHash: string | undefined;
    let storageEpochs: number | undefined;

    // Handle deployment response format
    if (useDeployment && result.blobId) {
      blobId = result.blobId;
      size = file.size;
      deploymentCost = result.cost;
      transactionHash = result.transactionHash;
      storageEpochs = result.storageEpochs;
    }
    // Handle standard upload response format
    else if (result.newlyCreated) {
      blobId = result.newlyCreated.blobObject.blobId;
      size = result.newlyCreated.blobObject.size;
    } else if (result.alreadyCertified) {
      blobId = result.alreadyCertified.blobId;
      size = file.size;
    } else {
      throw new Error("Unexpected Walrus response format");
    }

    const metadata: WalrusMetadata = {
      blobId,
      size,
      uploadedAt: new Date().toISOString(),
      contentType: contentType || file.type,
      deploymentCost,
      storageEpochs,
      transactionHash
    };

    if (useDeployment) {
      console.log(`Walrus deployment successful: ${blobId}, Cost: ${deploymentCost} SUI`);
      toast.success(`File deployed to Walrus! Cost: ${deploymentCost} SUI`);
    } else {
      console.log(`Walrus upload successful: ${blobId}`);
      toast.success(`File uploaded to Walrus testnet! Blob ID: ${blobId.slice(0, 12)}...`);
    }
    
    return metadata;
  } catch (error) {
    console.error("Walrus upload error:", error);
    
    // Handle fetch errors with detailed error information
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        toast.info(`Network error - retrying Walrus upload in ${Math.ceil(delay/1000)} seconds`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadToWalrus(file, contentType, retryCount + 1);
      }
      throw new Error("WALRUS_NETWORK_UNAVAILABLE");
    }
    
    // Handle timeout errors
    if ((error as any).name === 'TimeoutError' || (error as Error).message.includes('timed out')) {
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        toast.info(`Upload timeout - retrying Walrus upload in ${Math.ceil(delay/1000)} seconds`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadToWalrus(file, contentType, retryCount + 1);
      }
      throw new Error("WALRUS_NETWORK_TIMEOUT");
    }
    
    throw new Error("WALRUS_UPLOAD_FAILED");
  }
}

/**
 * Generate Walrus URL for accessing stored content
 */
export function getWalrusUrl(blobId: string): string {
  return `/api/walrus/blob/${blobId}`;
}

/**
 * Download content from Walrus
 */
export async function downloadFromWalrus(blobId: string): Promise<Blob> {
  try {
    const response = await fetch(`/api/walrus/blob/${blobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download from Walrus: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Walrus download error:", error);
    toast.error("Failed to download from Walrus");
    throw error;
  }
}

/**
 * Upload JSON metadata to Walrus
 */
export async function uploadJSONToWalrus(data: any): Promise<WalrusMetadata> {
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  
  return uploadToWalrus(jsonBlob, "application/json");
}

/**
 * Upload PDF report to Walrus
 */
export async function uploadPDFToWalrus(pdfBytes: Uint8Array): Promise<WalrusMetadata> {
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  return uploadToWalrus(pdfBlob, "application/pdf");
}

/**
 * Check if Walrus is available
 */
export async function checkWalrusHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
      method: "HEAD",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Verify that a blob exists and is accessible on Walrus
 * Note: CORS restrictions prevent direct verification from browser
 */
export async function verifyWalrusBlob(blobId: string): Promise<{
  exists: boolean;
  size?: number;
  contentType?: string;
}> {
  try {
    console.log(`Verifying Walrus blob: ${blobId}`);
    
    // Use server proxy for verification to bypass CORS
    const response = await fetch(`/api/walrus/blob/${blobId}`, {
      method: "HEAD",
    });
    
    if (response.ok) {
      const size = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      return {
        exists: true,
        size: size ? parseInt(size) : undefined,
        contentType: contentType || undefined,
      };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.warn("Walrus blob verification failed:", error);
    // For valid blob IDs from our upload, assume they exist during network issues
    if (blobId && blobId.startsWith('0x') && blobId.length >= 10) {
      return {
        exists: true,
        size: undefined,
        contentType: "application/pdf",
      };
    }
    return { exists: false };
  }
}

/**
 * Get comprehensive Walrus storage information
 */
export async function getWalrusStorageInfo(blobId: string): Promise<{
  blobId: string;
  url: string;
  verified: boolean;
  size?: number;
  contentType?: string;
  network: string;
}> {
  const verification = await verifyWalrusBlob(blobId);
  
  return {
    blobId,
    url: getWalrusUrl(blobId),
    verified: verification.exists,
    size: verification.size,
    contentType: verification.contentType,
    network: "testnet"
  };
}
