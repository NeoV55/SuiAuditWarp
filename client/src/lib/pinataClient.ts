import axios from "axios";

// Pinata API credentials
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY || "";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";

/**
 * Upload a file to IPFS using Pinata
 * 
 * @param fileBlob The file to upload as a Blob
 * @param fileName The name for the file
 * @returns CID (Content Identifier) hash string
 */
export async function uploadToIPFS(fileBlob: Blob, fileName: string): Promise<string> {
  // If credentials are not available, simulate with a mock CID for development
  if (!PINATA_API_KEY && !PINATA_JWT) {
    console.warn("Pinata credentials not found. Using mock IPFS hash for development.");
    // Return a simulated IPFS hash after a short delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    return "QmZ9nj7Tz4Jm8gK5q2K4B8fJaPgZm4xkFVSW8k3P";
  }

  try {
    // Create FormData object to upload the file
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        service: "AuditWarp",
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Configure request options
    const options = {
      headers: {
        // Use JWT if available, fall back to API keys
        ...(PINATA_JWT ? { 
          Authorization: `Bearer ${PINATA_JWT}` 
        } : { 
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY 
        }),
      }
    };
    
    // Upload to Pinata's IPFS API
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      options
    );
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Pinata upload error:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Retrieve file from IPFS using a gateway
 * 
 * @param ipfsHash The CID hash of the file on IPFS
 * @returns URL to access the file
 */
export function getIPFSUrl(ipfsHash: string): string {
  return `https://ipfs.io/ipfs/${ipfsHash}`;
}
