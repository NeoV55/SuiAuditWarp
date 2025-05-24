import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnedObjects } from "@/components/OwnedObjects";

export default function NFTList() {
  // Simplified for demo purposes
  const [isSuiConnected, setIsSuiConnected] = useState(false);

  const handleConnectWallet = async () => {
    if (!isSuiConnected) {
      try {
        // Simulate wallet connection for demo
        console.log("Connecting to Sui wallet...");
        setIsSuiConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">My Audit NFTs</h1>
        <p className="text-gray-400 max-w-3xl mb-8">
          View and manage your smart contract audit certificates
        </p>
        
        {!isSuiConnected ? (
          <Card className="bg-dark-800 shadow-lg">
            <CardContent className="p-8 text-center">
              <span className="material-icons text-4xl text-gray-500 mb-4">account_balance_wallet</span>
              <h2 className="text-xl font-medium text-white mb-4">Connect Your Sui Wallet</h2>
              <p className="text-gray-400 mb-6">
                You need to connect your Sui wallet to view your audit NFTs.
              </p>
              <Button 
                className="text-white bg-primary-600 hover:bg-primary-700"
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">About Audit NFTs</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start">
                    <span className="material-icons text-primary-500 mr-3">verified</span>
                    <div>
                      <h3 className="text-sm font-medium text-white">Verified Security</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Each NFT represents a verified smart contract security audit that can be trusted by users and investors.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="material-icons text-primary-500 mr-3">link</span>
                    <div>
                      <h3 className="text-sm font-medium text-white">On-Chain Proof</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Your audit certificates are stored on the Sui blockchain and linked to IPFS reports.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="material-icons text-primary-500 mr-3">autorenew</span>
                    <div>
                      <h3 className="text-sm font-medium text-white">Cross-Chain Verification</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Bridged from Ethereum using Wormhole, ensuring multi-chain verification of your security standards.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <OwnedObjects />
          </div>
        )}
      </div>
    </div>
  );
}
