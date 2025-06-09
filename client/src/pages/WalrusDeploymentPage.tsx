import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Database, FileText, Zap } from "lucide-react";
import WalrusDeploymentWizard from "@/components/WalrusDeploymentWizard";
import { useCurrentAccount } from "@mysten/dapp-kit";
import SuiWalletButton from "@/components/SuiWalletButton";

export default function WalrusDeploymentPage() {
  const [, setLocation] = useLocation();
  const currentAccount = useCurrentAccount();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDeploymentComplete = (result: {
    blobId: string;
    transactionDigest: string;
    suiCost: number;
    storageEpochs: number;
    expirationEpoch: number;
  }) => {
    console.log("Deployment completed:", result);
    // Could navigate to a results page or show success state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/audit")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Audit
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Walrus Deployment</h1>
            <p className="text-gray-600">Deploy files to Walrus decentralized storage on Sui blockchain</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - File Selection & Wallet */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  Sui Wallet
                </CardTitle>
                <CardDescription>
                  Connect your Sui wallet to deploy files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAccount ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Connected</p>
                      <p className="text-xs text-green-600 font-mono">
                        {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready to deploy files to Walrus storage
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SuiWalletButton />
                    <p className="text-xs text-muted-foreground">
                      A Sui wallet is required to pay for storage on Walrus
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Select File
                </CardTitle>
                <CardDescription>
                  Choose a file to deploy to Walrus storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.txt,.jpg,.png,.doc,.docx"
                  />
                  
                  {selectedFile && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">{selectedFile.name}</p>
                          <p className="text-xs text-blue-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <p>Supported formats: PDF, TXT, JPG, PNG, DOC, DOCX</p>
                    <p>Maximum size: 50 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Walrus Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  About Walrus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Walrus is a decentralized storage network built on Sui blockchain that provides:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Redundant, durable storage</li>
                    <li>Cryptographic integrity</li>
                    <li>Efficient encoding</li>
                    <li>Pay-per-epoch pricing</li>
                  </ul>
                  <p className="text-xs">
                    Files are stored across multiple nodes with Byzantine fault tolerance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Deployment Wizard */}
          <div className="lg:col-span-2">
            {selectedFile ? (
              <WalrusDeploymentWizard
                file={selectedFile}
                onDeploymentComplete={handleDeploymentComplete}
                disabled={!currentAccount}
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Select a File to Begin</h3>
                    <p className="text-muted-foreground">
                      Choose a file from the left panel to start the deployment wizard
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}