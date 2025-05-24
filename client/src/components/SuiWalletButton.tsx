
import { ConnectButton } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Box } from "@radix-ui/themes";
import { Copy } from "lucide-react";

export default function SuiWalletButton() {
  return (
    <ConnectButton>
      {({ connected, connecting, connect, disconnect, account }) => {
        if (connected && account) {
          return (
            <Box className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <code className="text-sm">
                  {account.address.slice(0, 4)}...{account.address.slice(-4)}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(account.address);
                  }}
                  className="hover:text-gray-400"
                >
                  <Copy size={14} />
                </button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </Box>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Sui Wallet"}
          </Button>
        );
      }}
    </ConnectButton>
  );
}
