import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Zap
} from "lucide-react";
import { toast } from "react-toastify";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

interface SuiWalrusDeploymentProps {
  file: File | Blob | null;
  onDeploymentSuccess: (result: {
    blobId: string;
    transactionDigest: string;
    suiCost: number;
    storageEpochs: number;
  }) => void;
  disabled?: boolean;
}

export default function SuiWalrusDeployment({
  file,
  onDeploymentSuccess,
  disabled = false
}: SuiWalrusDeploymentProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [storageEpochs, setStorageEpochs] = useState(10);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (file) {
      calculateCost();
    }
  }, [file, storageEpochs]);

  const calculateCost = () => {
    if (!file) return;
    
    const fileSizeMB = file.size / (1024 * 1024);
    const storageCost = fileSizeMB * 0.01 * storageEpochs; // 0.01 SUI per MB per epoch
    const gasCost = 0.001; // Gas fee
    const totalCost = storageCost + gasCost;
    setEstimatedCost(Math.ceil(totalCost * 1000) / 1000);
  };

  const handleSuiDeployment = async () => {
    if (!file || !currentAccount) {
      toast.error("Please connect your Sui wallet first");
      return;
    }

    setDeploying(true);
    try {
      // Convert file to bytes
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      
      // Use the existing Walrus deployment API endpoint for real transactions
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/walrus/deploy', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Storage-Epochs': storageEpochs.toString(),
          'X-Expected-Cost': estimatedCost.toString(),
          'X-Wallet-Address': currentAccount.address,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      const deploymentData = {
        blobId: result.blobId,
        transactionDigest: result.transactionHash,
        suiCost: result.cost || estimatedCost,
        storageEpochs: result.storageEpochs || storageEpochs,
        expirationEpoch: result.expirationEpoch
      };
      
      setDeploymentResult(deploymentData);
      onDeploymentSuccess(deploymentData);
      toast.success(`Successfully deployed to Walrus! Cost: ${deploymentData.suiCost} SUI`);
      
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error(`Deployment failed: ${(error as Error).message}`);
    } finally {
      setDeploying(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  };

  if (!file) {
    return (
      <Card className="bg-purple-950 border-purple-800 opacity-50">
        <CardContent className="p-6 text-center">
          <Wallet className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-purple-300">Upload a file to enable Sui Walrus deployment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-950 to-blue-950 border-purple-800">
      <CardHeader>
        <CardTitle className="text-purple-200 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Deploy to Sui Walrus Network
        </CardTitle>
        <p className="text-sm text-purple-300">
          Deploy your audit report on Sui blockchain with real SUI token payments
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet Connection Status */}
        <div className="p-3 bg-purple-900/50 rounded border border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">Sui Wallet</span>
            </div>
            {currentAccount ? (
              <Badge className="bg-green-600 text-green-100">
                Connected: {currentAccount.address.substring(0, 8)}...
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-300">
                Not Connected
              </Badge>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="p-3 bg-purple-900/50 rounded border border-purple-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-purple-400 block">File Size:</span>
              <span className="text-purple-100">{formatFileSize(file.size)}</span>
            </div>
            <div>
              <span className="text-purple-400 block">Type:</span>
              <span className="text-purple-100">PDF Audit Report</span>
            </div>
          </div>
        </div>

        {/* Storage Configuration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-purple-300 text-sm mb-2 block">
              Storage Duration (Epochs)
            </Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={storageEpochs}
              onChange={(e) => setStorageEpochs(parseInt(e.target.value) || 10)}
              className="bg-purple-900/50 border-purple-700 text-purple-100"
              disabled={disabled || deploying}
            />
            <p className="text-xs text-purple-400 mt-1">
              1 epoch ≈ 24 hours
            </p>
          </div>
          
          <div>
            <Label className="text-purple-300 text-sm mb-2 block">
              Deployment Cost
            </Label>
            <div className="flex items-center h-10 px-3 bg-purple-900/50 border border-purple-700 rounded">
              <DollarSign className="w-4 h-4 text-purple-400 mr-2" />
              <span className="text-purple-100 font-mono">
                {estimatedCost.toFixed(3)} SUI
              </span>
            </div>
            <p className="text-xs text-purple-400 mt-1">
              Including gas fees
            </p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="p-3 bg-purple-900/30 rounded border border-purple-700">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-purple-400">Storage Cost:</span>
              <span className="text-purple-100">
                {((file.size / (1024 * 1024)) * 0.01 * storageEpochs).toFixed(3)} SUI
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Gas Fee:</span>
              <span className="text-purple-100">0.001 SUI</span>
            </div>
            <div className="flex justify-between font-medium border-t border-purple-700 pt-1">
              <span className="text-purple-200">Total:</span>
              <span className="text-purple-100">{estimatedCost.toFixed(3)} SUI</span>
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        {deploymentResult && (
          <div className="p-3 bg-green-950/50 rounded border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-200 font-medium">Deployment Successful</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-green-400">Blob ID:</span>
                <code className="text-green-100 ml-2 font-mono text-xs">
                  {deploymentResult.blobId}
                </code>
              </div>
              <div>
                <span className="text-green-400">Transaction:</span>
                <code className="text-green-100 ml-2 font-mono text-xs">
                  {deploymentResult.transactionDigest.substring(0, 20)}...
                </code>
              </div>
              <div>
                <span className="text-green-400">Cost Paid:</span>
                <span className="text-green-100 ml-2">{deploymentResult.suiCost} SUI</span>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Button */}
        <Button
          onClick={handleSuiDeployment}
          disabled={disabled || deploying || !currentAccount || !!deploymentResult}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
        >
          {deploying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Deploying to Sui Blockchain...
            </>
          ) : deploymentResult ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Deployed Successfully
            </>
          ) : !currentAccount ? (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Sui Wallet to Deploy
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Deploy for {estimatedCost.toFixed(3)} SUI
            </>
          )}
        </Button>

        {/* Deployment Information */}
        <div className="text-xs text-purple-400 space-y-1">
          <p>• Real deployment on Sui blockchain with SUI token payment</p>
          <p>• Permanent storage on Walrus decentralized network</p>
          <p>• Transaction recorded on Sui blockchain for verification</p>
          <p>• Storage guaranteed for specified epoch duration</p>
        </div>
      </CardContent>
    </Card>
  );
}