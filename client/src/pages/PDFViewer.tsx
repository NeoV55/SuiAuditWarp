import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import ProgressSteps from "@/components/ProgressSteps";
import { AuditData } from "@/App";
import { formatDate } from "@/lib/utils";

interface PDFViewerProps {
  auditData: AuditData | null;
  currentStep: number;
}

export default function PDFViewer({ auditData, currentStep }: PDFViewerProps) {
  const [, setLocation] = useLocation();
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    // Redirect if no audit data is available
    if (!auditData || !auditData.ipfsHash) {
      toast.error("Please complete an audit first");
      return;
    }

    // Set IPFS gateway URL for PDF viewing
    setPdfUrl(`https://ipfs.io/ipfs/${auditData.ipfsHash}`);
  }, [auditData, setLocation]);

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handleShareResults = () => {
    if (navigator.share && pdfUrl) {
      navigator
        .share({
          title: `${auditData?.contractName} Smart Contract Audit`,
          text: "Check out my smart contract audit report from AuditWarp!",
          url: pdfUrl,
        })
        .catch((error) => {
          console.error("Sharing failed:", error);
          toast.error("Sharing failed. You can manually copy the IPFS URL.");
        });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(pdfUrl)
        .then(() => toast.success("Report URL copied to clipboard!"))
        .catch(() => toast.error("Failed to copy URL to clipboard."));
    }
  };

  const handleStartNewAudit = () => {
    setLocation("/");
  };

  if (!auditData) {
    return null; // This will be handled by the useEffect redirect
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Audit Report</h1>
        <p className="text-gray-400 max-w-3xl mb-8">
          View and verify your smart contract audit report
        </p>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} totalSteps={3} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - PDF preview */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900 flex justify-between items-center">
                <CardTitle className="text-lg font-medium text-white">
                  Audit Report PDF
                </CardTitle>
                <div>
                  <Button variant="ghost" size="icon" onClick={handleDownload}>
                    <span className="material-icons text-gray-400 hover:text-white">
                      file_download
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* PDF Preview */}
                <div className="bg-dark-900 rounded-md h-96 flex items-center justify-center">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full rounded-md"
                      title="Audit Report PDF"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="material-icons text-4xl text-gray-500 mb-4">
                        description
                      </span>
                      <p className="text-gray-400">Loading PDF...</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">IPFS Hash: </span>
                    <span className="text-xs font-mono text-white">
                      {auditData.ipfsHash?.substring(0, 8)}...
                      {auditData.ipfsHash?.substring(
                        auditData.ipfsHash.length - 4,
                      )}
                    </span>
                  </div>
                  <div>
                    <Button
                      variant="link"
                      className="text-xs text-primary-500 hover:text-primary-400 flex items-center p-0"
                      onClick={() =>
                        window.open(
                          `https://ipfs.io/ipfs/${auditData.ipfsHash}`,
                          "_blank",
                        )
                      }
                    >
                      <span className="material-icons text-sm mr-1">
                        open_in_new
                      </span>
                      View on IPFS Gateway
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Process summary */}
          <div>
            <Card className="bg-dark-800 shadow-lg mb-6">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  Audit Process Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ol className="space-y-4">
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white font-medium">
                        Smart Contract Analysis
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        AI analysis of your code using Google Gemini
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white font-medium">
                        PDF Report Generation
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Comprehensive report with findings and recommendations
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white font-medium">
                        IPFS Storage
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Permanent decentralized storage of your audit
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white font-medium">
                        Cross-Chain Verification
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Wormhole bridging from Ethereum to Sui
                      </p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white">
                        <span className="material-icons text-sm">check</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-white font-medium">
                        NFT Certificate
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        On-chain proof of your smart contract audit
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="bg-dark-800 shadow-lg">
              <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
                <CardTitle className="text-lg font-medium text-white">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900 flex items-center justify-center"
                  onClick={handleShareResults}
                >
                  <span className="material-icons text-sm mr-2">share</span>
                  Share Audit Results
                </Button>

                <Button
                  variant="outline"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900 flex items-center justify-center"
                  onClick={() => setLocation("/nfts")}
                >
                  <span className="material-icons text-sm mr-2">
                    collections
                  </span>
                  View NFT in Wallet
                </Button>

                <Button
                  variant="outline"
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-dark-900 hover:bg-dark-800 border border-dark-800 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-dark-900 flex items-center justify-center"
                  onClick={handleDownload}
                >
                  <span className="material-icons text-sm mr-2">
                    file_download
                  </span>
                  Download Report
                </Button>

                <Button
                  variant="link"
                  className="w-full px-4 py-2 text-sm font-medium text-primary-500 hover:text-primary-400 bg-transparent rounded-md focus:outline-none flex items-center justify-center"
                  onClick={handleStartNewAudit}
                >
                  <span className="material-icons text-sm mr-2">add</span>
                  Start New Audit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
