import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Transaction } from "@mysten/sui/transactions";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import { NFT_PACKAGE_ID } from "../constants";
import { toast } from "react-toastify";

interface MintNFTButtonProps {
  reportUrl: string;
  contractName: string;
  disabled?: boolean;
}

export default function MintNFTButton({
  reportUrl,
  contractName,
  disabled = false,
}: MintNFTButtonProps) {
  const [mintLoading, setMintLoading] = useState(false);
  const [mintTxResponse, setMintTxResponse] = useState<any>(null);
  const [mintError, setMintError] = useState<string>("");
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: mintSignAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const mintNFT = () => {
    console.log("=== MINT NFT DEBUG START ===");
    console.log("Current account:", currentAccount);
    console.log("Report URL:", reportUrl);
    console.log("Contract name:", contractName);
    console.log("NFT Package ID:", NFT_PACKAGE_ID);

    if (!reportUrl) {
      console.error("No PDF URL available to mint NFT.");
      toast.error("No PDF URL available to mint NFT.");
      return;
    }

    if (!currentAccount) {
      console.error("No wallet connected");
      toast.error("Please connect your Sui wallet first");
      return;
    }

    setMintLoading(true);

    try {
      const tx = new Transaction();
      console.log("Transaction object created:", tx);

      // Auto-generate NFT metadata
      const nftName = `AuditWarp: ${contractName} Certificate`;
      const nftDescription = `AuditWarp: Smart contract audit certificate for ${contractName}. This NFT confirms the contract has been audited with AuditWarp.`;

      console.log("NFT Name:", nftName);
      console.log("NFT Description:", nftDescription);

      tx.moveCall({
        target: `${NFT_PACKAGE_ID}::nft::mint_to_sender`,
        arguments: [
          tx.pure.string(nftName),
          tx.pure.string(nftDescription),
          tx.pure.string(reportUrl),
        ],
        typeArguments: [],
      });

      console.log("Transaction with moveCall:", tx);
      console.log("About to call mintSignAndExecute...");

      mintSignAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("=== MINT SUCCESS ===");
            console.log("NFT minted successfully:", result);
            console.log("=== MINT SUCCESS END ===");
            setMintTxResponse(result);
            toast.success("NFT minted successfully!");
            setMintLoading(false);
          },
          onError: (err: any) => {
            console.log("=== MINT ERROR ===");
            console.error("NFT minting error:", err);
            console.error("Error type:", typeof err);
            console.error("Error constructor:", err?.constructor?.name);
            console.error("Error message:", err?.message);
            console.error("Error stack:", err?.stack);
            console.error("Full error object:", JSON.stringify(err, null, 2));
            console.log("=== MINT ERROR END ===");
            const msg = err.message || "Minting NFT failed";
            setMintError(msg);
            toast.error(msg);
            setMintLoading(false);
          },
        },
      );
    } catch (error) {
      console.log("=== TRANSACTION PREPARATION ERROR ===");
      console.error("Error preparing NFT mint transaction:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);
      console.error("Error message:", (error as any)?.message);
      console.error("Error stack:", (error as any)?.stack);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.log("=== TRANSACTION PREPARATION ERROR END ===");
      const msg =
        (error as any)?.message || "Failed to prepare NFT minting transaction";
      setMintError(msg);
      toast.error(msg);
      setMintLoading(false);
    }
    console.log("=== MINT NFT DEBUG END ===");
  };

  return (
    <>
      <Button
        onClick={mintNFT}
        disabled={disabled || mintLoading || !currentAccount}
        className="w-full mt-4"
      >
        {mintLoading ? "Minting..." : "Mint NFT Certificate"}
      </Button>
      {mintTxResponse && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-green-400">
            ✅ NFT Minted Successfully!
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Transaction Details:
            </h4>
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-400 font-medium">Digest:</span>
                  <span className="col-span-2 font-mono text-blue-400 break-all">
                    {mintTxResponse.digest}
                  </span>
                </div>

                {mintTxResponse.effects?.status && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <span className="col-span-2 text-green-400">
                      {mintTxResponse.effects.status.status}
                    </span>
                  </div>
                )}

                {mintTxResponse.effects?.gasUsed && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-400 font-medium">Gas Used:</span>
                    <span className="col-span-2 font-mono text-yellow-400">
                      {(mintTxResponse.effects.gasUsed.computationCost || 0) +
                        (mintTxResponse.effects.gasUsed.storageCost || 0)}{" "}
                      MIST
                    </span>
                  </div>
                )}

                {mintTxResponse.effects?.created && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-400 font-medium">
                      Created Objects:
                    </span>
                    <div className="col-span-2">
                      {mintTxResponse.effects.created.map(
                        (obj: any, idx: number) => (
                          <div key={idx} className="mb-1">
                            <div className="font-mono text-purple-400 text-xs break-all">
                              {"https://testnet.suivision.xyz/object/" +
                                (obj.reference?.objectId || obj.objectId)}
                            </div>
                            <div className="text-gray-500 text-xs">
                              Type: {obj.reference?.type || obj.type || "NFT"}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-3 mt-3">
                  <details className="cursor-pointer">
                    <summary className="text-gray-400 font-medium hover:text-gray-300">
                      View Full Response
                    </summary>
                    <pre className="mt-2 text-xs text-gray-500 bg-gray-800 p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(mintTxResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {mintError && (
        <div className="mt-2 text-sm text-red-500">NFT Error: {mintError}</div>
      )}
    </>
  );
}
