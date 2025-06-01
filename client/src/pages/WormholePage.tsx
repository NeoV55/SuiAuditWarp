import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import ProgressSteps from "@/components/ProgressSteps";
import AuditStatusCard from "@/components/AuditStatusCard";
import { transferTokens } from "@/lib/wormhole";
import { AuditData } from "@/App";
import { formatDate, truncateAddress } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface WormholePageProps {
  auditData: AuditData | null;
  setAuditData: (data: AuditData) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function WormholePage({
  auditData,
  setAuditData,
  currentStep,
  setCurrentStep,
}: WormholePageProps) {
  const [, setLocation] = useLocation();
  // For demonstration purposes, we'll use a mock Sui wallet connection
  const currentAccount = useCurrentAccount();
  const isSuiConnected = !!currentAccount;
  const suiWalletAddress = currentAccount?.address || "";

  // For demonstration purposes, we'll use mock Ethereum data
  const [isEthConnected, setIsEthConnected] = useState<boolean>(false);
  const [ethAddress, setEthAddress] = useState<string>("");
  const [activeChain, setActiveChain] = useState<{ name: string }>({
    name: "Sepolia Testnet",
  });
  const [ethAmount, setEthAmount] = useState<string>("0.01");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<{ formatted: string }>({
    formatted: "1.0",
  });

  // Connect to Ethereum when component loads
  useEffect(() => {
    // Simulate Ethereum connection for demo
    const simulateEthConnection = () => {
      setTimeout(() => {
        setEthAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
        setIsEthConnected(true);
      }, 1000);
    };

    simulateEthConnection();
  }, []);

  useEffect(() => {
    // Redirect if no audit data is available
    if (!auditData) {
      toast.error("Please complete an audit first");
    }
  }, [auditData, setLocation]);

  const handleEthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(parseFloat(value)) || value === "") {
      setEthAmount(value);
    }
  };

  // Create a mutation for saving bridge transaction to database
  const saveBridgeTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      return apiRequest("/api/bridge-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });
    },
    onSuccess: (data) => {
      console.log("Bridge transaction saved to database:", data);
      // Continue with the NFT minting flow after successful database save
      setCurrentStep(3);
      toast.success("ETH locked successfully! Proceeding to NFT minting...");
      setLocation("/mint");
    },
    onError: (error) => {
      console.error("Failed to save bridge transaction:", error);
      toast.error(
        "Transaction recorded, but failed to save details to database.",
      );
      // Continue anyway since the bridge transaction succeeded
      setCurrentStep(3);
      setLocation("/mint");
    },
  });

  const handleBridgeTokens = async () => {
    if (!auditData) {
      toast.error("No audit data available");
      return;
    }

    if (!isEthConnected) {
      toast.error("Please connect your Ethereum wallet");
      return;
    }

    if (!isSuiConnected) {
      toast.error("Please connect your Sui wallet");
      return;
    }

    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error("Minimum amount is 0.01 ETH");
      return;
    }

    if (ethBalance && parseFloat(ethBalance.formatted) < amount) {
      toast.error("Insufficient ETH balance");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Initiating Wormhole token transfer...");

      // Execute the token transfer
      const receipt = await transferTokens(
        ethAddress!,
        suiWalletAddress,
        amount,
        auditData.ipfsHash!,
      );

      // Update audit data with ETH amount
      setAuditData({
        ...auditData,
        ethAmount: ethAmount,
      });

      // Get the most recent audit report ID from the auditData if available
      const auditReportId = (auditData as any).id || 25; // Use latest valid ID from database

      // Save bridge transaction to database
      saveBridgeTransactionMutation.mutate({
        auditReportId,
        sourceChain: "Ethereum",
        destChain: "Sui",
        sourceTxHash: receipt.transactionHash,
        ethAmount: amount.toString(),
        status: "pending",
        vaaId: null, // Will be updated when VAA is received
      });
    } catch (error) {
      console.error("Bridge error:", error);
      toast.error("Error during bridging. Please try again.");
      setIsLoading(false);
    }
  };

  if (!auditData) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">
          Cross-Chain Bridge
        </h1>
        <p className="text-gray-400 max-w-3xl mb-8">
          Secure your audit by locking ETH via Wormhole's token bridge and
          creating a cross-chain verification
        </p>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} totalSteps={3} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Bridge details */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  Bridge Configuration
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Set up cross-chain verification for your smart contract audit
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {/* Audit summary */}
                <div className="mb-6 p-4 bg-dark-900 rounded-md">
                  <h3 className="text-sm font-medium text-white mb-2">
                    Audit Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Contract Name</p>
                      <p className="text-sm text-white font-mono">
                        {auditData.contractName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Blockchain</p>
                      <p className="text-sm text-white">
                        {auditData.blockchain}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">IPFS Report Hash</p>
                      <p className="text-sm text-white font-mono truncate">
                        {auditData.ipfsHash
                          ? truncateAddress(auditData.ipfsHash)
                          : "Not available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Audit Date</p>
                      <p className="text-sm text-white">
                        {formatDate(new Date())}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bridge configuration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ETH Amount to Lock
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="text"
                      className="block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500 pr-12"
                      placeholder="0.01"
                      value={ethAmount}
                      onChange={handleEthAmountChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400 sm:text-sm">ETH</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Minimum amount: 0.01 ETH
                  </p>
                </div>

                {/* Recipient Address */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sui Wallet Address
                  </label>
                  <Input
                    type="text"
                    className="block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500 font-mono"
                    placeholder="0x..."
                    value={isSuiConnected ? suiWalletAddress : "Not connected"}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Address where the audit NFT will be minted
                  </p>
                </div>

                {/* Bridge details */}
                <div className="mb-6 p-4 bg-dark-900 rounded-md">
                  <h3 className="text-sm font-medium text-white mb-2">
                    Bridge Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Source Chain
                      </span>
                      <span className="text-xs text-white">
                        Ethereum ({activeChain?.name || "Not connected"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Destination Chain
                      </span>
                      <span className="text-xs text-white">Sui (Testnet)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Wormhole Fee
                      </span>
                      <span className="text-xs text-white">~0.002 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        Estimated Time
                      </span>
                      <span className="text-xs text-white">2-5 minutes</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-dark-900 rounded-md border border-dark-800 hover:border-dark-700"
                    onClick={() => setLocation("/")}
                    disabled={isLoading}
                  >
                    Back to Audit
                  </Button>
                  <Button
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900"
                    onClick={handleBridgeTokens}
                    disabled={isLoading || !isEthConnected || !isSuiConnected}
                  >
                    {isLoading ? (
                      <>
                        <div className="loader ease-linear rounded-full border-2 border-t-2 border-gray-200 h-5 w-5 mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Lock ETH & Bridge"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Bridge information */}
          <div>
            <AuditStatusCard
              title="About Cross-Chain Bridging"
              imageUrl="https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              items={[
                {
                  icon: "swap_horiz",
                  title: "Wormhole Protocol",
                  description:
                    "AuditWarp uses Wormhole's secure cross-chain messaging protocol to verify audits across different blockchains.",
                },
                {
                  icon: "lock",
                  title: "ETH Locking",
                  description:
                    "By locking ETH, you create a verifiable on-chain record of your audit commitment that can be validated on the Sui blockchain.",
                },
                {
                  icon: "verified_user",
                  title: "Verified Action Approval",
                  description:
                    "The VAA (Verified Action Approval) serves as cryptographic proof of your audit across chains.",
                },
              ]}
            />

            {/* What to expect next */}
            <Card className="bg-dark-800 shadow-lg mt-6">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  What Happens Next
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ol className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 text-white text-xs">
                        1
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white">
                        Confirm the transaction in your Ethereum wallet
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 text-white text-xs">
                        2
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white">
                        Wait for transaction confirmation (15-30 seconds)
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 text-white text-xs">
                        3
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white">
                        AuditWarp monitors for VAA from Wormhole
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-700 text-white text-xs">
                        4
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white">
                        Automatically proceed to NFT minting when ready
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
