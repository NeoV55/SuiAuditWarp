import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import ProgressSteps from "@/components/ProgressSteps";
import { AuditData } from "@/App";
import { formatDate } from "@/lib/utils";
import PDFViewerComponent from "@/components/PDFViewer";
import WalrusStorageDetails from "@/components/WalrusStorageDetails";
import { getWalrusUrl } from "@/lib/walrus";

interface PDFViewerProps {
  auditData: AuditData | null;
  currentStep: number;
}

export default function PDFViewer({ auditData, currentStep }: PDFViewerProps) {
  const [, setLocation] = useLocation();
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    // Redirect if no audit data is available
    if (!auditData || (!auditData.ipfsHash && !auditData.walrusId)) {
      toast.error("Please complete an audit first");
      return;
    }

    // Prioritize Walrus URL, fallback to IPFS
    if (auditData.walrusId) {
      setPdfUrl(getWalrusUrl(auditData.walrusId));
    } else if (auditData.ipfsHash) {
      setPdfUrl(`https://ipfs.io/ipfs/${auditData.ipfsHash}`);
    }
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
          toast.error("Sharing failed. You can manually copy the URL.");
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
            <PDFViewerComponent
              blobId={auditData?.walrusId}
              pdfUrl={auditData?.ipfsHash ? `https://ipfs.io/ipfs/${auditData.ipfsHash}` : undefined}
              title={`${auditData?.contractName || 'Contract'} Audit Report`}
            />
          </div>

          {/* Right column - Storage details and actions */}
          <div className="space-y-6">
            {/* Storage Information */}
            {auditData.walrusId && (
              <WalrusStorageDetails
                blobId={auditData.walrusId}
                metadata={auditData.walrusMetadata}
                showVerification={true}
              />
            )}

            {/* Audit Summary */}
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Audit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Contract:</span>
                    <p className="text-white font-medium">{auditData.contractName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Blockchain:</span>
                    <p className="text-white font-medium">{auditData.blockchain}</p>
                  </div>
                  {auditData.vulnerabilityScore !== undefined && (
                    <div>
                      <span className="text-gray-400">Security Score:</span>
                      <p className="text-white font-medium">{auditData.vulnerabilityScore}/100</p>
                    </div>
                  )}
                </div>

                {/* Storage Options */}
                <div className="pt-4 border-t border-dark-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Storage Options</h4>
                  <div className="space-y-2">
                    {auditData.walrusId && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">Walrus Decentralized Storage</span>
                      </div>
                    )}
                    {auditData.ipfsHash && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">IPFS Decentralized Storage</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-dark-800 border-dark-700">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-primary-600 hover:bg-primary-700"
                  >
                    Download PDF Report
                  </Button>
                  <Button
                    onClick={handleShareResults}
                    variant="outline"
                    className="w-full border-dark-600 text-gray-300 hover:text-white"
                  >
                    Share Results
                  </Button>
                  <Button
                    onClick={handleStartNewAudit}
                    variant="outline"
                    className="w-full border-dark-600 text-gray-300 hover:text-white"
                  >
                    Start New Audit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Process Summary */}
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white">Process Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Smart Contract Analysis</p>
                      <p className="text-xs text-gray-400">AI-powered security audit completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">PDF Report Generated</p>
                      <p className="text-xs text-gray-400">Comprehensive findings and recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Decentralized Storage</p>
                      <p className="text-xs text-gray-400">Report stored on {auditData.walrusId ? 'Walrus' : 'IPFS'}</p>
                    </div>
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