import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink 
} from "lucide-react";
import { toast } from "react-toastify";
import { 
  deployToWalrus, 
  estimateWalrusDeployment, 
  getWalrusDeploymentStatus,
  calculateWalrusDeploymentCost 
} from "@/lib/walrusDeployment";

interface WalrusDeploymentCardProps {
  file: File | Blob | null;
  onDeploymentSuccess: (result: {
    blobId: string;
    transactionHash: string;
    cost: number;
    storageEpochs: number;
  }) => void;
  disabled?: boolean;
}

export default function WalrusDeploymentCard({
  file,
  onDeploymentSuccess,
  disabled = false
}: WalrusDeploymentCardProps) {
  const [storageEpochs, setStorageEpochs] = useState(10);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    if (file) {
      estimateCost();
    }
  }, [file, storageEpochs]);

  const estimateCost = async () => {
    if (!file) return;
    
    setEstimating(true);
    try {
      const estimate = await estimateWalrusDeployment(file.size, storageEpochs);
      setCostEstimate(estimate);
    } catch (error) {
      console.error("Cost estimation failed:", error);
      toast.error("Failed to estimate deployment cost");
    } finally {
      setEstimating(false);
    }
  };

  const handleDeploy = async () => {
    if (!file || !costEstimate) {
      toast.error("Please wait for cost estimation to complete");
      return;
    }

    setDeploying(true);
    try {
      const config = calculateWalrusDeploymentCost(file.size, storageEpochs);
      const result = await deployToWalrus(file, config);
      
      setDeploymentResult(result);
      onDeploymentSuccess(result);
      
      toast.success(`Successfully deployed to Walrus! Transaction: ${result.transactionHash}`);
    } catch (error) {
      console.error("Deployment failed:", error);
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
          <Upload className="w-8 h-8 text-purple-400 mx-auto mb-3" />
          <p className="text-purple-300">Upload a file to enable Walrus deployment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-purple-950 border-purple-800">
      <CardHeader>
        <CardTitle className="text-purple-200 flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
          Deploy to Walrus Network
        </CardTitle>
        <p className="text-sm text-purple-300">
          Store your audit report permanently on the decentralized Walrus network
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Information */}
        <div className="p-3 bg-purple-900 rounded border border-purple-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-purple-400 block">File Size:</span>
              <span className="text-purple-100">{formatFileSize(file.size)}</span>
            </div>
            <div>
              <span className="text-purple-400 block">Type:</span>
              <span className="text-purple-100">PDF Report</span>
            </div>
          </div>
        </div>

        {/* Storage Configuration */}
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
            className="bg-purple-900 border-purple-700 text-purple-100"
            disabled={disabled || deploying}
          />
          <p className="text-xs text-purple-400 mt-1">
            1 epoch ≈ 24 hours. Recommended: 10 epochs (10 days)
          </p>
        </div>

        {/* Cost Estimation */}
        {costEstimate && (
          <div className="p-3 bg-purple-900 rounded border border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-300 text-sm font-medium">Deployment Cost</span>
              {estimating && <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-400">Storage Cost:</span>
                <span className="text-purple-100">{costEstimate.breakdown.storageCost} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400">Gas Fee:</span>
                <span className="text-purple-100">{costEstimate.breakdown.gasCost} SUI</span>
              </div>
              <div className="flex justify-between font-medium border-t border-purple-700 pt-1">
                <span className="text-purple-200">Total Cost:</span>
                <span className="text-purple-100">{costEstimate.breakdown.totalCost} SUI</span>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Status */}
        {deploymentResult && (
          <div className="p-3 bg-green-950 rounded border border-green-700">
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
                  {deploymentResult.transactionHash}
                </code>
              </div>
              <div>
                <span className="text-green-400">Cost Paid:</span>
                <span className="text-green-100 ml-2">{deploymentResult.cost} SUI</span>
              </div>
              <div>
                <span className="text-green-400">Expires:</span>
                <span className="text-green-100 ml-2">
                  Epoch {deploymentResult.expirationEpoch || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Button */}
        <Button
          onClick={handleDeploy}
          disabled={disabled || deploying || !costEstimate || !!deploymentResult}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {deploying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Deploying to Walrus...
            </>
          ) : deploymentResult ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Deployed Successfully
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Deploy for {costEstimate?.breakdown.totalCost || '...'} SUI
            </>
          )}
        </Button>

        {/* Deployment Info */}
        <div className="text-xs text-purple-400 space-y-1">
          <p>• Deployment stores your file permanently on the Walrus decentralized network</p>
          <p>• Payment is made in SUI tokens through the Walrus testnet</p>
          <p>• Files are replicated across multiple nodes for high availability</p>
          <p>• Storage duration is guaranteed for the specified epoch period</p>
        </div>
      </CardContent>
    </Card>
  );
}