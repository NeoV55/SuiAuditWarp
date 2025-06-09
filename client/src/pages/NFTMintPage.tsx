import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, Copy, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { AuditData } from "@/App";
import SuiNFTMinting from "@/components/SuiNFTMinting";
import WalrusStorageDetails from "@/components/WalrusStorageDetails";
import { formatDate } from "@/lib/utils";

interface NFTMintPageProps {
  auditData: AuditData | null;
}

export default function NFTMintPage({ auditData }: NFTMintPageProps) {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState<string>("");

  useEffect(() => {
    if (!auditData) {
      setLocation("/audit");
    }
  }, [auditData, setLocation]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopied(""), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!auditData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Audit Data</h1>
          <Button onClick={() => setLocation("/audit")}>
            Start New Audit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            NFT Certificate Deployment
          </h1>
          <p className="text-gray-400">
            Deploy your audit certificate as an NFT on the Sui blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audit Information */}
          <Card className="bg-dark-800 border-dark-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Audit Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Contract Name</label>
                  <p className="text-white font-medium">{auditData.contractName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Blockchain</label>
                  <p className="text-white">{auditData.blockchain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Security Score</label>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{auditData.vulnerabilityScore || 0}/100</p>
                    <Badge 
                      variant={(auditData.vulnerabilityScore || 0) >= 80 ? "default" : (auditData.vulnerabilityScore || 0) >= 60 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {(auditData.vulnerabilityScore || 0) >= 80 ? "Secure" : (auditData.vulnerabilityScore || 0) >= 60 ? "Moderate" : "High Risk"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Date</label>
                  <p className="text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {auditData.pdfUrl && (
                <div className="pt-4 border-t border-dark-700">
                  <label className="text-sm font-medium text-gray-400 mb-2 block">Audit Report</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(auditData.pdfUrl, '_blank')}
                      className="border-dark-600 text-gray-300 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = auditData.pdfUrl || '';
                        link.download = `${auditData.contractName}_audit_report.pdf`;
                        link.click();
                      }}
                      className="border-dark-600 text-gray-300 hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storage Information */}
          <Card className="bg-dark-800 border-dark-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white">Storage Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Storage Information */}
              {auditData.walrusId ? (
                <WalrusStorageDetails
                  blobId={auditData.walrusId}
                  metadata={auditData.walrusMetadata}
                  showVerification={true}
                />
              ) : auditData.ipfsHash ? (
                <div className="p-4 bg-blue-950 border border-blue-800 rounded-lg">
                  <h3 className="text-blue-200 font-medium mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    IPFS Storage
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-blue-300 mb-1 block">IPFS Hash</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-blue-100 bg-blue-900 px-2 py-1 rounded font-mono break-all">
                          {auditData.ipfsHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(auditData.ipfsHash || '', "IPFS Hash")}
                          className="text-blue-300 hover:text-blue-100 p-1"
                        >
                          {copied === "IPFS Hash" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-blue-300 mb-1 block">Gateway URL</label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-blue-100 bg-blue-900 px-2 py-1 rounded font-mono break-all">
                          https://gateway.pinata.cloud/ipfs/{auditData.ipfsHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`https://gateway.pinata.cloud/ipfs/${auditData.ipfsHash || ''}`, "IPFS URL")}
                          className="text-blue-300 hover:text-blue-100 p-1"
                        >
                          {copied === "IPFS URL" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${auditData.ipfsHash}`, '_blank')}
                      className="border-blue-700 text-blue-300 hover:text-blue-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in IPFS
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <h3 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    Local Storage Only
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Report is stored locally. No decentralized storage selected.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NFT Minting Section */}
        <Card className="bg-dark-800 border-dark-700 mt-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Deploy NFT Certificate</CardTitle>
            <p className="text-gray-400 text-sm">
              Mint your audit certificate as an NFT on the Sui blockchain for permanent verification
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SuiNFTMinting
                  reportUrl={auditData.pdfUrl || ''}
                  contractName={auditData.contractName}
                />
              </div>
              <div className="ml-6">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  className="border-dark-600 text-gray-300 hover:text-white"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}