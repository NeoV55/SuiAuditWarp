import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Cloud, Info, Zap, Shield, DollarSign, Clock } from "lucide-react";
import { calculateDeploymentCost } from "@/lib/walrus";

export interface StorageOptions {
  useIPFS: boolean;
  useWalrus: boolean;
  walrusStorageEpochs?: number;
  walrusEstimatedCost?: number;
}

interface StorageOptionsSelectorProps {
  value: StorageOptions;
  onChange: (options: StorageOptions) => void;
  disabled?: boolean;
  estimatedFileSize?: number;
}

export default function StorageOptionsSelector({ 
  value, 
  onChange, 
  disabled = false,
  estimatedFileSize = 1024 * 1024 // Default 1MB
}: StorageOptionsSelectorProps) {
  const [storageEpochs, setStorageEpochs] = useState(value.walrusStorageEpochs || 10);

  const handleIPFSChange = (checked: boolean) => {
    onChange({
      ...value,
      useIPFS: checked
    });
  };

  const handleWalrusChange = (checked: boolean) => {
    const estimatedCost = checked ? calculateDeploymentCost(estimatedFileSize, storageEpochs) : undefined;
    onChange({
      ...value,
      useWalrus: checked,
      walrusStorageEpochs: checked ? storageEpochs : undefined,
      walrusEstimatedCost: estimatedCost
    });
  };

  const handleEpochsChange = (epochs: number) => {
    setStorageEpochs(epochs);
    if (value.useWalrus) {
      const estimatedCost = calculateDeploymentCost(estimatedFileSize, epochs);
      onChange({
        ...value,
        walrusStorageEpochs: epochs,
        walrusEstimatedCost: estimatedCost
      });
    }
  };

  const handleWalrusConfigChange = (checked: boolean) => {
    onChange({
      ...value,
      useWalrus: checked
    });
  };

  return (
    <Card className="bg-dark-800 border-dark-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center text-lg">
          <Database className="w-5 h-5 mr-2 text-blue-500" />
          Storage Options
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Choose where to store your audit report for permanent access
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IPFS Option */}
        <div className="flex items-start space-x-3 p-4 border border-dark-700 rounded-lg hover:border-purple-500 transition-colors">
          <Checkbox
            id="ipfs-storage"
            checked={value.useIPFS}
            onCheckedChange={handleIPFSChange}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-5 h-5 text-purple-400" />
              <label htmlFor="ipfs-storage" className="text-white font-medium cursor-pointer">
                IPFS Storage
              </label>
              <Badge variant="outline" className="border-purple-500 text-purple-300 text-xs">
                Decentralized
              </Badge>
            </div>
            <p className="text-gray-400 text-sm mb-3">
              Store your audit report on the InterPlanetary File System for permanent, 
              decentralized access with content addressing.
            </p>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center text-green-400">
                <Shield className="w-3 h-3 mr-1" />
                Immutable
              </div>
              <div className="flex items-center text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                Global CDN
              </div>
              <div className="flex items-center text-purple-400">
                <Info className="w-3 h-3 mr-1" />
                Content Hash
              </div>
            </div>
          </div>
        </div>

        {/* Walrus Deployment Option */}
        <div className="flex items-start space-x-3 p-4 border border-dark-700 rounded-lg hover:border-purple-500 transition-colors">
          <Checkbox
            id="walrus-storage"
            checked={value.useWalrus}
            onCheckedChange={handleWalrusChange}
            disabled={disabled}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Cloud className="w-5 h-5 text-purple-400" />
              <label htmlFor="walrus-storage" className="text-white font-medium cursor-pointer">
                Deploy to Walrus Network
              </label>
              <Badge variant="outline" className="border-purple-500 text-purple-300 text-xs">
                Paid Storage
              </Badge>
              {value.walrusEstimatedCost && (
                <Badge className="bg-purple-600 text-purple-100 text-xs">
                  {value.walrusEstimatedCost} SUI
                </Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-3">
              Deploy your audit report permanently on Walrus decentralized storage with 
              guaranteed availability and blockchain-verified transactions.
            </p>
            
            {/* Walrus Configuration */}
            {value.useWalrus && (
              <div className="bg-purple-950 border border-purple-800 rounded p-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-purple-300 text-xs mb-1 block">
                      Storage Duration (Epochs)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={storageEpochs}
                      onChange={(e) => handleEpochsChange(parseInt(e.target.value) || 10)}
                      className="bg-purple-900 border-purple-700 text-purple-100 text-sm h-8"
                      disabled={disabled}
                    />
                    <p className="text-xs text-purple-400 mt-1">1 epoch ≈ 24 hours</p>
                  </div>
                  <div>
                    <Label className="text-purple-300 text-xs mb-1 block">
                      Estimated Cost
                    </Label>
                    <div className="flex items-center h-8 px-2 bg-purple-900 border border-purple-700 rounded text-sm">
                      <DollarSign className="w-3 h-3 text-purple-400 mr-1" />
                      <span className="text-purple-100">
                        {value.walrusEstimatedCost?.toFixed(3) || '0.000'} SUI
                      </span>
                    </div>
                    <p className="text-xs text-purple-400 mt-1">Including gas fees</p>
                  </div>
                </div>
                
                <div className="mt-3 p-2 bg-purple-900 rounded border border-purple-700">
                  <div className="flex items-center space-x-2 text-xs">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-300">
                      Report will be stored for {storageEpochs} epochs ({storageEpochs} days)
                    </span>
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    • Payment processed in SUI tokens on Walrus testnet
                    • Immutable storage with blockchain verification
                    • Redundant storage across multiple nodes
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center text-green-400">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </div>
              <div className="flex items-center text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                Permanent
              </div>
              <div className="flex items-center text-purple-400">
                <DollarSign className="w-3 h-3 mr-1" />
                Fee-based
              </div>
            </div>
          </div>
        </div>

        {/* Storage Summary */}
        {(value.useIPFS || value.useWalrus) && (
          <div className="bg-dark-900 border border-dark-600 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2 text-blue-400" />
              Selected Storage
            </h4>
            <div className="space-y-2">
              {value.useIPFS && (
                <div className="flex items-center text-sm text-gray-300">
                  <Database className="w-4 h-4 mr-2 text-purple-400" />
                  Your report will be stored on IPFS with a permanent content hash
                </div>
              )}
              {value.useWalrus && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-300">
                    <Cloud className="w-4 h-4 mr-2 text-purple-400" />
                    Your report will be deployed to Walrus network for {value.walrusStorageEpochs || 10} epochs
                  </div>
                  <div className="flex items-center text-sm text-purple-300 ml-6">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Deployment cost: {value.walrusEstimatedCost?.toFixed(3) || '0.000'} SUI
                  </div>
                </div>
              )}
              {value.useIPFS && value.useWalrus && (
                <div className="text-xs text-blue-400 mt-2 p-2 bg-blue-900/20 rounded">
                  Dual storage provides maximum redundancy and access options
                </div>
              )}
            </div>
          </div>
        )}

        {!value.useIPFS && !value.useWalrus && (
          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
            <div className="flex items-center text-amber-400 text-sm">
              <Info className="w-4 h-4 mr-2" />
              Select at least one storage option to save your audit report
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}