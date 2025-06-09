import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Coins, 
  Database, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Shield,
  Target
} from "lucide-react";
import { toast } from "react-toastify";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface WalrusDeploymentWizardProps {
  file: File | Blob | null;
  onDeploymentComplete: (result: {
    blobId: string;
    transactionDigest: string;
    suiCost: number;
    storageEpochs: number;
    expirationEpoch: number;
  }) => void;
  disabled?: boolean;
}

interface DeploymentStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
}

export default function WalrusDeploymentWizard({
  file,
  onDeploymentComplete,
  disabled = false
}: WalrusDeploymentWizardProps) {
  const currentAccount = useCurrentAccount();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [storageEpochs, setStorageEpochs] = useState([10]);
  const [estimatedCost, setEstimatedCost] = useState(0.01);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  
  const [steps, setSteps] = useState<DeploymentStep[]>([
    {
      id: 0,
      title: "Configuration",
      description: "Set storage duration and review costs",
      icon: <Target className="w-4 h-4" />,
      status: 'active'
    },
    {
      id: 1,
      title: "Validation",
      description: "Verify file and wallet connection",
      icon: <Shield className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 2,
      title: "Deployment",
      description: "Deploy to Walrus on Sui blockchain",
      icon: <Zap className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 3,
      title: "Confirmation",
      description: "Verify deployment and get access details",
      icon: <CheckCircle className="w-4 h-4" />,
      status: 'pending'
    }
  ]);

  // Calculate estimated cost based on file size and storage epochs
  useEffect(() => {
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      const storageCostSui = fileSizeMB * 0.01 * storageEpochs[0];
      const gasCostSui = 0.001;
      const totalCost = storageCostSui + gasCostSui;
      setEstimatedCost(parseFloat(totalCost.toFixed(4)));
    }
  }, [file, storageEpochs]);

  const updateStepStatus = (stepId: number, status: 'pending' | 'active' | 'completed' | 'error') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const proceedToNext = () => {
    if (currentStep < steps.length - 1) {
      updateStepStatus(currentStep, 'completed');
      setCurrentStep(currentStep + 1);
      updateStepStatus(currentStep + 1, 'active');
    }
  };

  const handleValidation = () => {
    let validationPassed = true;
    
    if (!file) {
      toast.error("No file selected for deployment");
      validationPassed = false;
    }
    
    if (!currentAccount) {
      toast.error("Sui wallet not connected");
      validationPassed = false;
    }
    
    if (file && file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error("File size exceeds 50MB limit for Walrus deployment");
      validationPassed = false;
    }
    
    if (validationPassed) {
      toast.success("Validation successful - ready for deployment");
      proceedToNext();
    } else {
      updateStepStatus(1, 'error');
    }
  };

  const handleDeployment = async () => {
    if (!file || !currentAccount) return;
    
    setDeploying(true);
    updateStepStatus(2, 'active');
    
    try {
      // Convert file to buffer for deployment
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);
      
      const response = await fetch('/api/walrus/deploy', {
        method: 'POST',
        body: fileBuffer,
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Storage-Epochs': storageEpochs[0].toString(),
          'X-Expected-Cost': estimatedCost.toString(),
          'X-Wallet-Address': currentAccount.address,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.message || errorData.error || `Deployment failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setDeploymentResult(result);
      updateStepStatus(2, 'completed');
      proceedToNext();
      
      toast.success(`Successfully deployed to Walrus! Cost: ${result.cost} SUI`);
      
      onDeploymentComplete({
        blobId: result.blobId,
        transactionDigest: result.transactionHash,
        suiCost: result.cost,
        storageEpochs: result.storageEpochs,
        expirationEpoch: result.expirationEpoch
      });
      
    } catch (error) {
      console.error("Deployment error:", error);
      updateStepStatus(2, 'error');
      toast.error(`Deployment failed: ${(error as Error).message}`);
    } finally {
      setDeploying(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0: // Configuration
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Storage Duration</Label>
              <div className="px-4">
                <Slider
                  value={storageEpochs}
                  onValueChange={setStorageEpochs}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 epoch (~1 day)</span>
                <span className="font-medium">{storageEpochs[0]} epochs (~{storageEpochs[0]} days)</span>
                <span>50 epochs (~50 days)</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">File Size</span>
                </div>
                <p className="text-lg font-semibold">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'No file'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Estimated Cost</span>
                </div>
                <p className="text-lg font-semibold text-yellow-600">
                  {estimatedCost.toFixed(4)} SUI
                </p>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Storage Details</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your file will be stored on Walrus for {storageEpochs[0]} epochs. 
                    Each epoch is approximately 24 hours on Sui testnet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 1: // Validation
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">File Ready</p>
                    <p className="text-sm text-muted-foreground">
                      {file ? `${file.type || 'application/octet-stream'} • ${(file.size / 1024).toFixed(1)} KB` : 'No file selected'}
                    </p>
                  </div>
                </div>
                {file ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Sui Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      {currentAccount ? `${currentAccount.address.slice(0, 8)}...${currentAccount.address.slice(-6)}` : 'Not connected'}
                    </p>
                  </div>
                </div>
                {currentAccount ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        );
        
      case 2: // Deployment
        return (
          <div className="space-y-6">
            {deploying ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Deploying to Walrus...</p>
                  <p className="text-sm text-muted-foreground">
                    Creating Sui blockchain transaction and storing your file
                  </p>
                </div>
                <Progress value={65} className="w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Ready for Deployment</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Click Deploy to create a Sui blockchain transaction and store your file on Walrus.
                        This will charge {estimatedCost.toFixed(4)} SUI from your wallet.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{storageEpochs[0]}</p>
                    <p className="text-xs text-muted-foreground">Epochs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{estimatedCost.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">SUI Cost</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{file ? (file.size / 1024).toFixed(0) : '0'}</p>
                    <p className="text-xs text-muted-foreground">KB Size</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 3: // Confirmation
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700">Deployment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your file has been successfully deployed to Walrus
                </p>
              </div>
            </div>
            
            {deploymentResult && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blob ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {deploymentResult.blobId.substring(0, 12)}...
                      </code>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transaction</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {deploymentResult.transactionHash.substring(0, 12)}...
                      </code>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-semibold text-green-600">{deploymentResult.cost}</p>
                    <p className="text-xs text-muted-foreground">SUI Paid</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-lg font-semibold text-blue-600">{deploymentResult.expirationEpoch}</p>
                    <p className="text-xs text-muted-foreground">Expires Epoch</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  const getActionButton = () => {
    switch (currentStep) {
      case 0:
        return (
          <Button 
            onClick={proceedToNext} 
            disabled={disabled || !file}
            className="w-full"
          >
            Continue to Validation
          </Button>
        );
      case 1:
        return (
          <Button 
            onClick={handleValidation} 
            disabled={disabled}
            className="w-full"
          >
            Validate & Continue
          </Button>
        );
      case 2:
        return (
          <Button 
            onClick={handleDeployment} 
            disabled={disabled || deploying || !currentAccount}
            className="w-full"
          >
            {deploying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              'Deploy to Walrus'
            )}
          </Button>
        );
      case 3:
        return (
          <Button 
            onClick={() => setCurrentStep(0)} 
            variant="outline"
            className="w-full"
          >
            Deploy Another File
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          Walrus Deployment Wizard
        </CardTitle>
        <CardDescription>
          Deploy your file to Walrus decentralized storage on the Sui blockchain
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
              step.status === 'active' ? 'border-blue-200 bg-blue-50' :
              step.status === 'completed' ? 'border-green-200 bg-green-50' :
              step.status === 'error' ? 'border-red-200 bg-red-50' :
              'border-muted bg-muted/20'
            }`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.status === 'active' ? 'border-blue-500 bg-blue-500 text-white' :
                step.status === 'completed' ? 'border-green-500 bg-green-500 text-white' :
                step.status === 'error' ? 'border-red-500 bg-red-500 text-white' :
                'border-muted-foreground bg-background'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : step.status === 'active' ? (
                  step.icon
                ) : (
                  <span className="text-xs font-medium">{step.id + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'active' ? 'text-blue-700' :
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-700' :
                  'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {step.status === 'active' && (
                <Badge variant="secondary" className="text-xs">Current</Badge>
              )}
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Step Content */}
        <div className="min-h-[300px]">
          {getStepContent()}
        </div>
        
        {/* Action Button */}
        <div className="pt-4">
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
}