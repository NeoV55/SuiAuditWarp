import { Card, CardContent } from "@/components/ui/card";

interface NFTPreviewProps {
  contractName: string;
  auditDate: string;
  vulnerabilityScore: number;
  ipfsHash: string;
}

export default function NFTPreview({ 
  contractName, 
  auditDate, 
  vulnerabilityScore, 
  ipfsHash 
}: NFTPreviewProps) {
  // Calculate vulnerability level and color
  const getVulnerabilityLevel = () => {
    if (vulnerabilityScore <= 2) return { level: "Low", color: "text-green-400" };
    if (vulnerabilityScore <= 5) return { level: "Medium", color: "text-yellow-400" };
    return { level: "High", color: "text-red-400" };
  };
  
  const vulnerabilityInfo = getVulnerabilityLevel();
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary-700 to-accent-600 p-1">
      <Card className="bg-dark-900 rounded-lg p-4">
        <CardContent className="p-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Audit Certificate</h3>
              <p className="text-xs text-gray-400">{contractName}</p>
            </div>
            <div className="bg-primary-700 rounded-full p-1">
              <span className="material-icons text-white text-sm">verified</span>
            </div>
          </div>
          
          <img 
            src="https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500" 
            alt="Blockchain verification concept" 
            className="w-full h-32 object-cover rounded-md mb-4"
          />
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Audit Date</span>
              <span className="text-xs text-white">{auditDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Vulnerability Score</span>
              <span className={`text-xs ${vulnerabilityInfo.color}`}>
                {vulnerabilityInfo.level} ({vulnerabilityScore}/10)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Auditor</span>
              <span className="text-xs text-white">AuditWarp AI</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400 font-mono truncate">
              IPFS: {ipfsHash.substring(0, 8)}...{ipfsHash.substring(ipfsHash.length - 4)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
