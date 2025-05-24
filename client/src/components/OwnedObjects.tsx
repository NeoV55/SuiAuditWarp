import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Container, Box, Flex, Text, Card } from "@radix-ui/themes";
import { NFT_PACKAGE_ID } from "../constants";

export function OwnedObjects() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchObjects() {
      if (!account) return;
      
      try {
        setLoading(true);
        // Query owned objects from the specific package
        const { data } = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            MatchAll: [
              { Package: NFT_PACKAGE_ID }
            ]
          },
          options: {
            showContent: true,
            showDisplay: true,
          }
        });
        
        console.log("Owned objects:", data);
        setObjects(data);
      } catch (error) {
        console.error("Error fetching owned objects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchObjects();
  }, [account, suiClient]);

  if (!account) {
    return null;
  }

  return (
    <Box mt="4">
      <Text size="3" weight="bold">Your NFT Certificates</Text>
      
      {loading ? (
        <Text color="gray" size="2" mt="2">Loading certificates...</Text>
      ) : objects.length > 0 ? (
        <Flex direction="column" gap="2" mt="2">
          {objects.map((object, index) => (
            <Card key={index} size="1">
              <Text size="2" weight="bold">{object?.data?.content?.fields?.name || "Certificate"}</Text>
              <Text size="1" color="gray" style={{ wordBreak: 'break-word' }}>
                {object?.data?.content?.fields?.description || "No description"}
              </Text>
              <Text size="1" color="blue" style={{ wordBreak: 'break-word' }}>
                {object?.data?.objectId}
              </Text>
            </Card>
          ))}
        </Flex>
      ) : (
        <Text color="gray" size="2" mt="2">No certificates found. Mint one!</Text>
      )}
    </Box>
  );
}