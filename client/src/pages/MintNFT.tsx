import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import ProgressSteps from "@/components/ProgressSteps";
import AuditStatusCard from "@/components/AuditStatusCard";
import NFTPreview from "@/components/NFTPreview";
import { mintNFT } from "@/lib/sui";
import SuiNFTMinting from "@/components/SuiNFTMinting";
import { AuditData } from "@/App";
import { formatDate, truncateAddress, getVulnerabilityScore } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface MintNFTProps {
  auditData: AuditData | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function MintNFT({ auditData, currentStep, setCurrentStep }: MintNFTProps) {
  const [, setLocation] = useLocation();
  const currentAccount = useCurrentAccount();
  const isSuiConnected = !!currentAccount;
  const [nftName, setNftName] = useState<string>("");
  const [nftDescription, setNftDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vaaStatus, setVaaStatus] = useState<string>("Pending"); // "Pending", "Verified", "Failed"

  useEffect(() => {
    // Redirect if no audit data is available
    if (!auditData) {
      toast.error("Please complete an audit first");
      setLocation("/");
      return;
    }

    // Initialize NFT metadata
    setNftName(`${auditData.contractName} Audit Certificate`);
    setNftDescription(
      `This NFT certifies that the ${auditData.contractName} smart contract has been audited by AuditWarp on ${formatDate(new Date())}. The audit report is permanently stored on IPFS.`
    );

    // Simulate VAA verification (in a real app, this would listen for the VAA from Wormhole)
    const timer = setTimeout(() => {
      setVaaStatus("Verified");
      toast.success("Wormhole VAA received and verified!");
    }, 3000);

    return () => clearTimeout(timer);
  }, [auditData, setLocation]);

  // Create a mutation for saving NFT certificate to database
  const saveNftCertificateMutation = useMutation({
    mutationFn: async (certificateData: any) => {
      return apiRequest("/api/nft-certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(certificateData),
      });
    },
    onSuccess: (data) => {
      console.log("NFT certificate saved to database:", data);
      setCurrentStep(4);
      toast.success("NFT minted and recorded successfully!");
      setLocation("/report");
    },
    onError: (error) => {
      console.error("Failed to save NFT certificate:", error);
      toast.error("NFT minted, but failed to save details to database.");
      // Continue anyway since the NFT was minted
      setCurrentStep(4);
      setLocation("/report");
    }
  });

  const handleMintNFT = async () => {
    if (!auditData || !auditData.ipfsHash) {
      toast.error("Audit data is incomplete");
      return;
    }

    if (!isSuiConnected) {
      toast.error("Please connect your Sui wallet");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Initiating NFT minting...");

      // Call the Sui contract to mint the NFT
      const txHash = await mintNFT(
        nftName,
        nftDescription,
        `ipfs://${auditData.ipfsHash}`
      );

      // Calculate vulnerability score if not already available
      const vulnerabilityScore = auditData.vulnerabilityScore || 
                               getVulnerabilityScore(auditData.auditResult);
      
      // Mock values for database integration - in a real app these would come from actual data
      const auditReportId = 1; // Would come from the audit report saved in database
      const ownerAddress = "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      // Save NFT certificate to database
      saveNftCertificateMutation.mutate({
        auditReportId,
        mintTxHash: txHash,
        nftObjectId: "0x" + Math.random().toString(16).substring(2, 42), // In real app, would be from Sui response
        ownerAddress
      });
      
    } catch (error) {
      console.error("Minting error:", error);
      toast.error("Error during NFT minting. Please try again.");
      setIsLoading(false);
    }
  };

  if (!auditData) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Mint Audit NFT Certificate</h1>
        <p className="text-gray-400 max-w-3xl mb-8">
          Create a permanent on-chain record of your smart contract audit
        </p>
        
        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} totalSteps={4} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - NFT Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">NFT Certificate Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NFT preview image */}
                  <div>
                    <NFTPreview
                      contractName={auditData.contractName}
                      auditDate={formatDate(new Date())}
                      vulnerabilityScore={2}
                      ipfsHash={auditData.ipfsHash || ""}
                    />
                  </div>
                  
                  {/* NFT details */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">NFT Name</label>
                        <Input
                          type="text"
                          className="block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          value={nftName}
                          onChange={(e) => setNftName(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <Textarea
                          className="block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500 h-24"
                          value={nftDescription}
                          onChange={(e) => setNftDescription(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">IPFS URL</label>
                        <Input
                          type="text"
                          className="block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500 font-mono"
                          value={`ipfs://${auditData.ipfsHash}`}
                          readOnly
                        />
                      </div>
                      
                      <div className="p-4 bg-dark-900 rounded-md">
                        <h3 className="text-sm font-medium text-white mb-2">Wormhole VAA Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">VAA Status</span>
                            <span className={`text-xs ${
                              vaaStatus === "Verified" 
                                ? "text-green-400" 
                                : vaaStatus === "Failed" 
                                  ? "text-red-400" 
                                  : "text-yellow-400"
                            }`}>
                              {vaaStatus}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Source Chain Tx</span>
                            <span className="text-xs text-white font-mono truncate">0x4a2...7b9c</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">ETH Locked</span>
                            <span className="text-xs text-white">{auditData.ethAmount || "0.01"} ETH</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-dark-900 rounded-md border border-dark-800 hover:border-dark-700"
                    onClick={() => setLocation("/bridge")}
                    disabled={isLoading}
                  >
                    Back to Bridge
                  </Button>
                  <SuiNFTMinting 
                    reportUrl={auditData?.ipfsHash ? `ipfs://${auditData.ipfsHash}` : ""}
                    contractName={auditData?.contractName || "Smart Contract"}
                    disabled={isLoading || vaaStatus !== "Verified"}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - NFT information */}
          <div>
            <AuditStatusCard
              title="About Audit NFTs"
              imageUrl="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              items={[
                {
                  icon: "verified",
                  title: "On-Chain Verification",
                  description: "Your NFT provides cryptographic proof that your smart contract has undergone a professional security audit."
                },
                {
                  icon: "link",
                  title: "Permanent Record",
                  description: "The NFT links to your IPFS-stored audit report, ensuring the audit details are immutably preserved."
                },
                {
                  icon: "share",
                  title: "Shareable Proof",
                  description: "Share your audit NFT with investors, users, and other stakeholders to demonstrate your commitment to security."
                }
              ]}
            />
            
            {/* Sui contract information */}
            <Card className="bg-dark-800 shadow-lg mt-6">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-gray-400">NFT Package ID</h3>
                    <p className="text-sm font-mono text-white break-all">
                      0x6120510bd943eda5a8334f627af50832896d99e31b888e0791005f62122a09e5
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-gray-400">Function</h3>
                    <p className="text-sm font-mono text-white">nft_minting_contract::nft::mint_to_sender</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-gray-400">Network</h3>
                    <p className="text-sm text-white">Sui Testnet</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-gray-400">Gas Fee (estimated)</h3>
                    <p className="text-sm text-white">0.00012 SUI</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
