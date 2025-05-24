import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { ethers } from "ethers";

// Add Ethereum provider type definition to Window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default function EvmWalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if MetaMask is already connected
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setConnected(true);
            setError(null);
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
          setError("Failed to check MetaMask connection");
        }
      }
    };
    
    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setConnected(false);
      } else {
        setAddress(accounts[0]);
        setConnected(true);
        setError(null);
      }
    };

    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connectEvmWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError("MetaMask not detected! Please install MetaMask extension.");
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    if (!window.ethereum.isMetaMask) {
      setError("Please use MetaMask wallet");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setConnected(true);
        console.log("Connected to MetaMask:", accounts[0]);
      } else {
        setError("No accounts found in MetaMask");
      }
    } catch (error: any) {
      console.error("Failed to connect to MetaMask:", error);
      if (error.code === 4001) {
        setError("Connection rejected by user");
      } else {
        setError("Failed to connect to MetaMask");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectEvmWallet = async () => {
    // Note: MetaMask doesn't have a true disconnect method through the provider
    // This just clears the UI state
    setAddress(null);
    setConnected(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address: ', err);
    }
  };

  return (
    <div className="p-4 border-b border-dark-800">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">EVM Wallet</h3>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
              alt="MetaMask logo" 
              className="w-5 h-5 rounded-full mr-2"
            />
            <span className="text-sm font-medium text-white">MetaMask</span>
          </div>
          
          {connected ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-400 font-medium">Connected</span>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={connectEvmWallet}
              disabled={isConnecting}
              className="text-xs text-gray-400 hover:text-white hover:bg-primary-800 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-2 p-2 text-xs text-red-400 bg-red-900/20 rounded border border-red-800">
            {error}
          </div>
        )}
        
        {connected && address && (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">
                {truncateAddress(address, 6, 4)}
              </span>
              <button 
                className="ml-2 text-xs text-gray-400 hover:text-white transition-colors"
                onClick={() => copyToClipboard(address)}
                title="Copy address"
              >
                {copied ? 
                  <Check className="h-3 w-3 text-green-400" /> : 
                  <Copy className="h-3 w-3" />
                }
              </button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={disconnectEvmWallet}
              className="text-xs text-gray-400 hover:text-red-400 hover:border-red-400 mt-2"
            >
              Disconnect
            </Button>
          </div>
        )}

        {!window.ethereum && (
          <div className="mt-2 p-2 text-xs text-yellow-400 bg-yellow-900/20 rounded border border-yellow-800">
            MetaMask not detected. 
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline ml-1"
            >
              Install MetaMask
            </a>
          </div>
        )}
      </div>
    </div>
  );
}