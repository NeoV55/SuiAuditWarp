import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import CodeEditor from "@/components/CodeEditor";
import ProgressSteps from "@/components/ProgressSteps";
import AuditStatusCard from "@/components/AuditStatusCard";
import { runAudit } from "@/lib/ai";
import { generatePDF } from "@/lib/pdfGenerator";
import { uploadToIPFS } from "@/lib/pinataClient";
import { getVulnerabilityScore } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { AuditData } from "@/App";

// Sample smart contract for demo purposes
const SAMPLE_CONTRACT = `module hello_blockchain::message {
    use std::error;
    use std::signer;
    use std::string;
    use aptos_framework::event;

    //:!:>resource
    struct MessageHolder has key {
        message: string::String,
    }
    //<:!:resource

    #[event]
    struct MessageChange has drop, store {
        account: address,
        from_message: string::String,
        to_message: string::String,
    }

    /// There is no message present
    const ENO_MESSAGE: u64 = 0;

    #[view]
    public fun get_message(addr: address): string::String acquires MessageHolder {
        assert!(exists<MessageHolder>(addr), error::not_found(ENO_MESSAGE));
        borrow_global<MessageHolder>(addr).message
    }

    public entry fun set_message(account: signer, message: string::String)
    acquires MessageHolder {
        let account_addr = signer::address_of(&account);
        if (!exists<MessageHolder>(account_addr)) {
            move_to(&account, MessageHolder {
                message,
            })
        } else {
            let old_message_holder = borrow_global_mut<MessageHolder>(account_addr);
            let from_message = old_message_holder.message;
            event::emit(MessageChange {
                account: account_addr,
                from_message,
                to_message: copy message,
            });
            old_message_holder.message = message;
        }
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_message(account: signer) acquires MessageHolder {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        set_message(account, string::utf8(b"Hello, Blockchain"));

        assert!(
            get_message(addr) == string::utf8(b"Hello, Blockchain"),
            ENO_MESSAGE
        );
    }
}`;

interface AuditPageProps {
  setAuditData: (data: AuditData) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export default function AuditPage({
  setAuditData,
  currentStep,
  setCurrentStep,
}: AuditPageProps) {
  const [, setLocation] = useLocation();
  const [contractName, setContractName] = useState<string>("hello_blockchain");
  const [contractCode, setContractCode] = useState<string>(SAMPLE_CONTRACT);
  const [blockchainNetwork, setBlockchainNetwork] =
    useState<string>("Ethereum");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContractCode(text);
        // Extract contract name from filename if possible
        const fileName = file.name.split(".")[0];
        if (fileName) setContractName(fileName);
      };
      reader.readAsText(file);
      setFile(file);
    },
    [],
  );

  // Create a mutation for saving audit report to database
  const saveAuditReportMutation = useMutation({
    mutationFn: async (auditReportData: any) => {
      return apiRequest("/api/audit-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditReportData),
      });
    },
    onSuccess: (data) => {
      console.log("Audit report saved to database:", data);
      // Update audit data with the saved report ID
      setAuditData((prev) => ({
        ...prev,
        id: data.id,
      }));
      toast.success("Audit report saved to database!");
    },
    onError: (error) => {
      console.error("Failed to save audit report:", error);
      toast.error(
        "Failed to save audit report to database, but audit completed.",
      );
    },
  });

  const handleStartAudit = async () => {
    if (!contractCode.trim()) {
      toast.error("Please enter contract code");
      return;
    }

    if (!contractName.trim()) {
      toast.error("Please enter a contract name");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Starting AI audit. This may take a moment...");

      // Run the audit using AI (Google Gemini)
      const auditResult = await runAudit(contractCode);

      // Calculate vulnerability score
      const vulnerabilityScore = getVulnerabilityScore(auditResult);

      // Generate PDF
      const pdfBlob = await generatePDF(
        contractName,
        contractCode,
        auditResult,
      );

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(pdfBlob, `${contractName}_audit.pdf`);

      const pdfUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

      // Store audit data in parent component
      const auditData = {
        contractName,
        contractCode,
        blockchain: blockchainNetwork,
        auditResult,
        ipfsHash,
        pdfUrl,
        vulnerabilityScore,
      };

      setAuditData(auditData);

      // Save audit report to database
      // Use a mock user ID for now - in a real app, this would come from authentication
      const userId = 1;

      saveAuditReportMutation.mutate({
        userId,
        contractName,
        contractCode,
        blockchain: blockchainNetwork,
        auditResult,
        vulnerabilityScore,
        ipfsHash,
        pdfUrl,
      });

      setCurrentStep(2);
      toast.success("Audit completed successfully!");

      // Navigate to bridge page
      setLocation("/bridge");
    } catch (error) {
      console.error("Audit error:", error);
      toast.error("Error during audit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setContractCode("");
    setContractName("");
    setFile(null);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header and hero section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Smart Contract Audit Platform
          </h1>
          <p className="text-gray-400 max-w-3xl">
            Secure your blockchain applications with AI-powered smart contract
            audits and cross-chain certification.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hero card 1 */}
            <div className="bg-dark-800 rounded-lg p-4 flex items-start">
              <img
                src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"
                alt="Blockchain security"
                className="w-12 h-12 rounded-md object-cover mr-4"
              />
              <div>
                <h3 className="font-medium text-white text-sm">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Identify vulnerabilities with Google Gemini's AI audit
                  technology
                </p>
              </div>
            </div>

            {/* Hero card 2 */}
            <div className="bg-dark-800 rounded-lg p-4 flex items-start">
              <img
                src="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"
                alt="Cross-chain technology"
                className="w-12 h-12 rounded-md object-cover mr-4"
              />
              <div>
                <h3 className="font-medium text-white text-sm">
                  Cross-Chain Bridging
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Secure validation across Ethereum and Sui blockchains
                </p>
              </div>
            </div>

            {/* Hero card 3 */}
            <div className="bg-dark-800 rounded-lg p-4 flex items-start">
              <img
                src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"
                alt="NFT certification"
                className="w-12 h-12 rounded-md object-cover mr-4"
              />
              <div>
                <h3 className="font-medium text-white text-sm">
                  NFT Certification
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  On-chain verification of your smart contract audit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} totalSteps={3} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Input section */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  Smart Contract Input
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Upload or paste your smart contract code for audit
                </p>
              </CardHeader>
              <CardContent className="p-6">
                {/* File upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Smart Contract
                  </label>
                  <div
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-dark-900 rounded-md hover:border-primary-700 transition-colors duration-200 cursor-pointer"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <div className="space-y-1 text-center">
                      <span className="material-icons text-gray-400 mx-auto">
                        upload_file
                      </span>
                      <div className="text-sm text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-dark-800 rounded-md font-medium text-primary-500 hover:text-primary-400"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".sol,.vy,.move,.txt,.js"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {file
                          ? file.name
                          : "Solidity, Vyper, or Move files up to 10MB"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Paste Code
                  </label>
                  <CodeEditor
                    value={contractCode}
                    onChange={setContractCode}
                    height="h-64"
                  />
                </div>

                {/* Contract details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contract Name
                    </label>
                    <Input
                      type="text"
                      className="mt-1 block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="hello_blockchain"
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Blockchain Network
                    </label>
                    <Select
                      value={blockchainNetwork}
                      onValueChange={setBlockchainNetwork}
                    >
                      <SelectTrigger className="mt-1 block w-full rounded-md bg-dark-900 border border-dark-800 text-white p-2 text-sm focus:border-primary-500 focus:ring-primary-500">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ethereum">Ethereum</SelectItem>
                        <SelectItem value="Sui">Sui</SelectItem>
                        <SelectItem value="Solana">Solana</SelectItem>
                        <SelectItem value="Polkadot">Polkadot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex items-center justify-end">
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-dark-900 rounded-md border border-dark-800 hover:border-dark-700 mr-3"
                    onClick={handleClear}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                  <Button
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900"
                    onClick={handleStartAudit}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="loader ease-linear rounded-full border-2 border-t-2 border-gray-200 h-5 w-5 mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      "Start Audit"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Audit information */}
          <div>
            <AuditStatusCard
              title="About AI Audits"
              imageUrl="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              items={[
                {
                  icon: "shield",
                  title: "Advanced Security Analysis",
                  description:
                    "Our AI audit system powered by Google Gemini analyzes your smart contract for common vulnerabilities and logic errors.",
                },
                {
                  icon: "description",
                  title: "Comprehensive Reports",
                  description:
                    "Receive a detailed PDF report with vulnerability assessments, risk levels, and recommended fixes.",
                },
                {
                  icon: "storage",
                  title: "Decentralized Storage",
                  description:
                    "Your audit report is stored on IPFS for permanent, decentralized access and verification.",
                },
                {
                  icon: "verified",
                  title: "On-Chain Certification",
                  description:
                    "Mint an NFT certificate on Sui blockchain that proves your contract has been audited.",
                },
              ]}
            />

            {/* Audit pricing */}
            <Card className="bg-dark-800 shadow-lg mt-6">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  Audit Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center py-3 border-b border-dark-900">
                  <span className="text-sm text-gray-300">Base Audit Fee</span>
                  <span className="text-sm font-medium text-white">
                    0.005 ETH
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dark-900">
                  <span className="text-sm text-gray-300">
                    Wormhole Bridge Fee
                  </span>
                  <span className="text-sm font-medium text-white">
                    0.002 ETH
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-dark-900">
                  <span className="text-sm text-gray-300">
                    NFT Minting Fee (Sui)
                  </span>
                  <span className="text-sm font-medium text-white">
                    0.001 SUI
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 font-medium">
                  <span className="text-sm text-white">Total Cost</span>
                  <span className="text-sm text-primary-500">
                    0.007 ETH + 0.001 SUI
                  </span>
                </div>

                <div className="mt-4">
                  <div className="p-3 bg-dark-900 rounded-md">
                    <p className="text-xs text-gray-400">
                      ETH is locked via Wormhole bridge to verify cross-chain
                      audit. The locked amount is 0.01 ETH by default but can be
                      customized.
                    </p>
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
