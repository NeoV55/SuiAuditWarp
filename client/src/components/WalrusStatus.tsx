
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { checkWalrusHealth } from "@/lib/walrus";

export function WalrusStatus() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await checkWalrusHealth();
      setIsHealthy(healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <Card className="bg-dark-900 border-dark-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
          Walrus Storage Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isHealthy === null ? (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            ) : isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className="text-gray-300">
              {isHealthy === null
                ? "Checking..."
                : isHealthy
                ? "Connected"
                : "Disconnected"}
            </span>
            <Badge
              variant={isHealthy ? "default" : "destructive"}
              className={
                isHealthy
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }
            >
              {isHealthy ? "Online" : "Offline"}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
            className="border-dark-600 text-gray-300 hover:bg-dark-800"
          >
            {isChecking ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Walrus provides decentralized blob storage for audit reports and NFT metadata
        </div>
      </CardContent>
    </Card>
  );
}
