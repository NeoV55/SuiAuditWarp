import { ethers } from "ethers";

/**
 * Connect to Ethereum using MetaMask
 * 
 * @returns The connected Ethereum provider and signer
 */
export async function connectToEthereum() {
  if (!window.ethereum) {
    throw new Error("MetaMask or other Web3 provider not found");
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    return { provider, signer, address };
  } catch (error) {
    console.error("Error connecting to Ethereum:", error);
    throw new Error(`Failed to connect to Ethereum: ${(error as Error).message}`);
  }
}

/**
 * Get the current Ethereum network
 * 
 * @returns The current network information
 */
export async function getEthereumNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask or other Web3 provider not found");
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    return network;
  } catch (error) {
    console.error("Error getting Ethereum network:", error);
    throw new Error(`Failed to get Ethereum network: ${(error as Error).message}`);
  }
}

/**
 * Switch Ethereum network
 * 
 * @param chainId The target chain ID
 * @returns Success status
 */
export async function switchEthereumNetwork(chainId: number) {
  if (!window.ethereum) {
    throw new Error("MetaMask or other Web3 provider not found");
  }
  
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // If the chain hasn't been added, this error will be thrown
    if ((error as any).code === 4902) {
      console.error("Network not added to MetaMask");
      throw new Error("This network is not available in your MetaMask, please add it manually");
    }
    console.error("Error switching Ethereum network:", error);
    throw new Error(`Failed to switch Ethereum network: ${(error as Error).message}`);
  }
}

/**
 * Get the ETH balance of an address
 * 
 * @param address The Ethereum address
 * @returns The ETH balance in ether (as a string)
 */
export async function getEthBalance(address: string) {
  if (!window.ethereum) {
    throw new Error("MetaMask or other Web3 provider not found");
  }
  
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error("Error getting ETH balance:", error);
    throw new Error(`Failed to get ETH balance: ${(error as Error).message}`);
  }
}
