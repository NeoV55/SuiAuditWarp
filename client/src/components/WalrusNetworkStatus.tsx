import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WalrusNetworkStatusProps {
  onStatusChange?: (isAvailable: boolean) => void;
}

export default function WalrusNetworkStatus({ onStatusChange }: WalrusNetworkStatusProps) {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable' | 'timeout'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkWalrusStatus = async () => {
    try {
      setStatus('checking');
      
      // Use a lightweight OPTIONS request to check endpoint availability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second test timeout
      
      const response = await fetch('https://publisher.walrus-testnet.walrus.space/v1/blobs', {
        method: 'OPTIONS',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 405) { // 405 Method Not Allowed is expected for OPTIONS
        setStatus('available');
        onStatusChange?.(true);
      } else {
        setStatus('unavailable');
        onStatusChange?.(false);
      }
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        setStatus('timeout');
      } else {
        setStatus('unavailable');
      }
      onStatusChange?.(false);
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkWalrusStatus();
    // Check status every 5 minutes
    const interval = setInterval(checkWalrusStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Checking Walrus Network',
          description: 'Testing connection to Walrus decentralized storage...'
        };
      case 'available':
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          title: 'Walrus Network Available',
          description: 'Walrus decentralized storage is operating normally.'
        };
      case 'timeout':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          title: 'Walrus Network Experiencing High Load',
          description: 'The Walrus network is currently experiencing high traffic. Uploads may be slow or fail. Consider using IPFS storage or try again later.'
        };
      case 'unavailable':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          title: 'Walrus Network Unavailable',
          description: 'Unable to connect to Walrus decentralized storage. Please check your connection or use IPFS storage instead.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Alert variant={statusInfo.variant} className="mb-4">
      <StatusIcon className="h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col space-y-1">
          <span className="font-semibold">{statusInfo.title}</span>
          <span className="text-sm">{statusInfo.description}</span>
          {lastCheck && (
            <span className="text-xs text-muted-foreground">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}