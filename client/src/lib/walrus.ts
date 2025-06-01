
import { toast } from "react-toastify";

// Walrus testnet configuration
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
}

/**
 * Upload a file to Walrus decentralized storage
 */
export async function uploadToWalrus(
  file: File | Blob,
  contentType?: string
): Promise<WalrusMetadata> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
      method: "PUT",
      body: formData,
      headers: {
        ...(contentType && { "Content-Type": contentType }),
      },
    });

    if (!response.ok) {
      throw new Error(`Walrus upload failed: ${response.statusText}`);
    }

    const result: WalrusUploadResponse = await response.json();
    
    let blobId: string;
    let size: number;

    if (result.newlyCreated) {
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
    };

    toast.success(`File uploaded to Walrus successfully! Blob ID: ${blobId.slice(0, 8)}...`);
    return metadata;
  } catch (error) {
    console.error("Walrus upload error:", error);
    toast.error("Failed to upload to Walrus decentralized storage");
    throw error;
  }
}

/**
 * Generate Walrus URL for accessing stored content
 */
export function getWalrusUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/${blobId}`;
}

/**
 * Download content from Walrus
 */
export async function downloadFromWalrus(blobId: string): Promise<Blob> {
  try {
    const response = await fetch(getWalrusUrl(blobId));
    
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
