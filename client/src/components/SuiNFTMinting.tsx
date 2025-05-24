import { useState } from "react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions"; // Correct import!
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { NFT_PACKAGE_ID } from "../constants";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

interface SuiNFTMintingProps {
  reportUrl: string;
  contractName: string;
  disabled?: boolean;
}

export default function SuiNFTMinting({
  reportUrl,
  contractName,
  disabled = false,
}: SuiNFTMintingProps) {
  // Local state for loading, transaction response, and errors.
  const nftPackageId =
    "0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914"; // Replace with your actual package ID.
  // Get the SUI client.
  const suiClient = useSuiClient();

  // Configure the mutation function to sign and execute transactions.
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

  const [mintLoading, setMintLoading] = useState<boolean>(false);
  const [mintTxResponse, setMintTxResponse] = useState<any>(null);
  const [mintError, setMintError] = useState<string>("");

  // Get toast functions.

  // Function to initiate NFT minting.
  const mintNFT = () => {
    if (!reportUrl) {
      toast.error("No report URL available to mint NFT.");
      return;
    }
    setMintLoading(true);
    const tx = new Transaction();
    tx.moveCall({
      target: `${NFT_PACKAGE_ID}::nft::mint_to_sender`,
      arguments: [tx.pure.string((`AuditWarp: ${contractName} Certificate`)), // NFT name
        tx.pure.string((`AuditWarp: Smart contract audit certificate for ${contractName}`)), // NFT description
        tx.pure.string(reportUrl),
      ],
      typeArguments: [],
    });
    mintSignAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          setMintTxResponse(result);
          toast.success("NFT minted successfully!");
          setMintLoading(false);
        },
        onError: (err: any) => {
          const msg = err.message || "Minting NFT failed";
          setMintError(msg);
          toast.error(msg);
          setMintLoading(false);
        },
      },
    );
  };

  return (
    <>
      <Button
        onClick={mintNFT}
        disabled={disabled || mintLoading}
        className="w-full mt-4"
      >
        {mintLoading ? (
          <div className="flex items-center justify-center">
            <ClipLoader size={20} className="mr-2" />
            Minting...
          </div>
        ) : (
          "Mint NFT Certificate"
        )}
      </Button>

      {mintTxResponse && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-green-400">
            ✅ NFT Minted Successfully!
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Transaction Details:</h4>
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
                      {mintTxResponse.effects.gasUsed.computationCost + mintTxResponse.effects.gasUsed.storageCost} MIST
                    </span>
                  </div>
                )}

                {mintTxResponse.effects?.created && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-400 font-medium">Created Objects:</span>
                    <div className="col-span-2">
                      {mintTxResponse.effects.created.map((obj: any, idx: number) => (
                        <div key={idx} className="mb-1">
                          <div className="font-mono text-purple-400 text-xs break-all">
                            {obj.reference.objectId}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Type: {obj.reference.type || 'NFT'}
                          </div>
                        </div>
                      ))}
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
        <div className="mt-2 text-sm text-red-500">
          <strong>Error:</strong> {mintError}
        </div>
      )}
    </>
  );
}
