import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface NetworkSwitcherProps {
  currentNetwork?: string;
}

export default function NetworkSwitcher({ currentNetwork = "testnet" }: NetworkSwitcherProps) {
  const [network, setNetwork] = useState(currentNetwork);

  const handleNetworkChange = (newNetwork: string) => {
    setNetwork(newNetwork);
    // In a real implementation, we would update the network in the Sui wallet
    console.log(`Switching to ${newNetwork}`);
  };

  return (
    <div className="p-4 border-b border-dark-800">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Network Selection</h3>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Current Network:</span>
          <span className="text-xs font-medium text-primary-500">{network}</span>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={network === "testnet" ? "default" : "outline"}
            className="text-xs flex-1"
            onClick={() => handleNetworkChange("testnet")}
          >
            Testnet
          </Button>
          <Button
            size="sm"
            variant={network === "mainnet" ? "default" : "outline"}
            className="text-xs flex-1"
            onClick={() => handleNetworkChange("mainnet")}
          >
            Mainnet
          </Button>
        </div>
      </div>
    </div>
  );
}