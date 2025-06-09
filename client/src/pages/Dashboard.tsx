import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Shield, Calendar, Download, User, MapPin, Mail, MessageSquare, Copy, AlertTriangle, CheckCircle, FileText, Code, Database, Cloud } from "lucide-react";
import { getIPFSUrl } from "@/lib/pinataClient";

interface AuditRecord {
  id: number;
  contractName: string;
  contractCode: string;
  blockchain: string;
  auditResult?: string;
  ipfsHash?: string;
  walrusId?: string;
  pdfUrl?: string;
  vulnerabilityScore?: number;
  createdAt: string;
  userId: number;
  ethAmount?: string;
  storageType?: 'ipfs' | 'walrus' | 'both';
  user?: {
    username: string;
    id: number;
  };
}

interface UserData {
  id: number;
  username: string;
  email?: string;
  walletAddress?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const { data: auditRecords = [], isLoading: auditsLoading } = useQuery({
    queryKey: ['/api/audit-reports'],
    refetchInterval: 30000,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    refetchInterval: 60000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUserInitials = (username: string) => {
    if (!username) return 'U';
    return username.slice(0, 2).toUpperCase();
  };

  const getAuditCount = (userId: number) => {
    return (auditRecords as any[]).filter((audit: any) => audit.userId === userId).length;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Security Auditor': 'bg-blue-500',
      'Senior Auditor': 'bg-purple-500',
      'Lead Auditor': 'bg-red-500',
      'Auditor': 'bg-green-500',
    };
    return roleColors[role] || 'bg-gray-500';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AuditWarp Dashboard</h1>
          <p className="text-gray-400">
            Monitor audit activities and explore verified security professionals in the ecosystem
          </p>
        </div>

        <Tabs defaultValue="audit-feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-dark-800">
            <TabsTrigger value="audit-feed" className="data-[state=active]:bg-blue-600">
              <Shield className="w-4 h-4 mr-2" />
              Audit Feed
            </TabsTrigger>
            <TabsTrigger value="user-directory" className="data-[state=active]:bg-blue-600">
              <User className="w-4 h-4 mr-2" />
              User Directory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit-feed" className="mt-6">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  Recent Audit Activity
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Real-time feed of smart contract audits with comprehensive security analysis
                </p>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (auditRecords as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No audit records found</p>
                    <p className="text-gray-500 text-sm">Audit submissions will appear here when users submit reports</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(auditRecords as any[]).map((audit: any) => (
                      <Card key={audit.id} className="bg-dark-900 border-dark-700 hover:border-dark-600 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <Avatar className="w-14 h-14">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                                  {getUserInitials(audit.user?.username || 'User')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <h3 className="text-xl font-bold text-white">{audit.contractName}</h3>
                                  <Badge variant="secondary" className="bg-blue-900 text-blue-200 px-3 py-1">
                                    {audit.blockchain}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center text-gray-300">
                                    <User className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="text-sm font-medium">{audit.user?.username || 'Anonymous'}</span>
                                  </div>
                                  
                                  <div className="flex items-center text-gray-300">
                                    <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="text-sm">{formatDate(audit.createdAt)}</span>
                                  </div>
                                  
                                  <div className="flex items-center text-gray-300">
                                    <Code className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="text-sm">Lines: {audit.contractCode?.split('\n').length || 0}</span>
                                  </div>
                                  
                                  <div className="flex items-center text-gray-300">
                                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                                    <span className="text-sm">Report ID: #{audit.id}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Security Score Section */}
                          {audit.vulnerabilityScore !== null && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">Security Assessment</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`${
                                    audit.vulnerabilityScore >= 80 ? 'bg-green-900 text-green-200' :
                                    audit.vulnerabilityScore >= 60 ? 'bg-yellow-900 text-yellow-200' :
                                    'bg-red-900 text-red-200'
                                  } px-3 py-1`}
                                >
                                  {audit.vulnerabilityScore >= 80 ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Secure
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      {audit.vulnerabilityScore >= 60 ? 'Moderate Risk' : 'High Risk'}
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Progress 
                                  value={audit.vulnerabilityScore} 
                                  className="flex-1 h-2"
                                />
                                <span className="text-sm font-bold text-white min-w-[3rem]">
                                  {audit.vulnerabilityScore}/100
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Audit Summary */}
                          {audit.auditResult && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">Audit Summary</h4>
                              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                {audit.auditResult.length > 200 
                                  ? `${audit.auditResult.substring(0, 200)}...` 
                                  : audit.auditResult
                                }
                              </p>
                            </div>
                          )}

                          <Separator className="my-4 bg-dark-700" />

                          {/* Storage and Actions Section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Storage Status */}
                              <div className="flex items-center space-x-2">
                                {audit.ipfsHash && (
                                  <Badge variant="outline" className="border-purple-500 text-purple-300">
                                    <Database className="w-3 h-3 mr-1" />
                                    IPFS
                                  </Badge>
                                )}
                                {audit.walrusId && (
                                  <Badge variant="outline" className="border-orange-500 text-orange-300">
                                    <Cloud className="w-3 h-3 mr-1" />
                                    Walrus
                                  </Badge>
                                )}
                                {!audit.ipfsHash && !audit.walrusId && (
                                  <Badge variant="outline" className="border-gray-500 text-gray-400">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Local Only
                                  </Badge>
                                )}
                              </div>

                              {/* ETH Amount if available */}
                              {audit.ethAmount && (
                                <Badge variant="secondary" className="bg-green-900 text-green-200">
                                  {audit.ethAmount} ETH
                                </Badge>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              {audit.ipfsHash && (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(getIPFSUrl(audit.ipfsHash), '_blank')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Database className="w-4 h-4 mr-2" />
                                  IPFS
                                </Button>
                              )}
                              
                              {audit.walrusId && (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(`https://walrus.site/${audit.walrusId}`, '_blank')}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  <Cloud className="w-4 h-4 mr-2" />
                                  Walrus
                                </Button>
                              )}

                              {audit.pdfUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(audit.pdfUrl, '_blank')}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-directory" className="mt-6">
            <Card className="bg-dark-800 border-dark-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-500" />
                  Verified User Directory
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Explore security professionals and their audit contributions
                </p>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-700 rounded-lg p-6 space-y-4">
                          <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto"></div>
                          <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (allUsers as any[]).length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No users found</p>
                    <p className="text-gray-500 text-sm">Users will appear here when they join the platform</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(allUsers as any[]).map((user: any) => (
                      <Card 
                        key={user.id} 
                        className="bg-dark-900 border-dark-700 hover:border-dark-600 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <CardContent className="p-6 text-center">
                          <Avatar className="w-16 h-16 mx-auto mb-4">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xl font-bold">
                              {getUserInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <h3 className="font-semibold text-white mb-2">{user.username}</h3>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-center text-gray-300">
                              <Shield className="w-4 h-4 mr-2 text-blue-400" />
                              <span className="text-sm">{getAuditCount(user.id)} Audits</span>
                            </div>
                            
                            <div className="flex items-center justify-center text-gray-300">
                              <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                              <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
                            </div>
                          </div>

                          {user.email && (
                            <div className="flex items-center justify-center text-gray-400 mb-2">
                              <Mail className="w-4 h-4 mr-2" />
                              <span className="text-sm truncate">{user.email}</span>
                            </div>
                          )}

                          {user.walletAddress && (
                            <div className="flex items-center justify-center text-gray-400 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm font-mono">{formatAddress(user.walletAddress)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(user.walletAddress);
                                }}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          )}

                          <Badge 
                            variant="secondary" 
                            className={`${getRoleColor('Auditor')} text-white`}
                          >
                            Security Auditor
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}