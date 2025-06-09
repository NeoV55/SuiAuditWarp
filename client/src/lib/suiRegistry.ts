import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Sui client configuration
const suiClient = new SuiClient({
  url: getFullnodeUrl('testnet'), // Change to 'mainnet' for production
});

// Contract addresses - these should be set after deployment
export const AUDIT_REGISTRY_PACKAGE_ID = import.meta.env.VITE_AUDIT_REGISTRY_PACKAGE_ID || "";
export const USER_REGISTRY_PACKAGE_ID = import.meta.env.VITE_USER_REGISTRY_PACKAGE_ID || "";
export const AUDIT_REGISTRY_OBJECT_ID = import.meta.env.VITE_AUDIT_REGISTRY_OBJECT_ID || "";
export const USER_REGISTRY_OBJECT_ID = import.meta.env.VITE_USER_REGISTRY_OBJECT_ID || "";

export interface AuditRecord {
  id: string;
  nft_id: string;
  ipfs_hash: string;
  audited_by: string;
  target_contract: string;
  timestamp: number;
  role: string;
  name: string;
  profile_link: string;
  is_verified: boolean;
  verified_by?: string;
}

export interface UserProfile {
  id: string;
  owner: string;
  role: string;
  name: string;
  link: string;
  is_verified: boolean;
  verified_by?: string;
  email?: string;
  discord?: string;
  zoom?: string;
  credential_link?: string;
}

/**
 * Fetch all audit records from the registry
 */
export async function fetchAuditRecords(): Promise<AuditRecord[]> {
  try {
    if (!AUDIT_REGISTRY_PACKAGE_ID || !AUDIT_REGISTRY_OBJECT_ID) {
      console.warn("Audit registry configuration missing. Using mock data for development.");
      return generateMockAuditRecords();
    }

    // Query all AuditRecord objects
    const response = await suiClient.getOwnedObjects({
      owner: AUDIT_REGISTRY_OBJECT_ID,
      filter: {
        StructType: `${AUDIT_REGISTRY_PACKAGE_ID}::audit_registry::AuditRecord`
      },
      options: {
        showContent: true,
        showType: true
      }
    });

    const records: AuditRecord[] = [];
    
    for (const item of response.data) {
      if (item.data?.content && 'fields' in item.data.content) {
        const fields = item.data.content.fields as any;
        records.push({
          id: fields.id.id,
          nft_id: fields.nft_id,
          ipfs_hash: fields.ipfs_hash,
          audited_by: fields.audited_by,
          target_contract: fields.target_contract,
          timestamp: parseInt(fields.timestamp),
          role: fields.role,
          name: fields.name,
          profile_link: fields.profile_link,
          is_verified: fields.is_verified,
          verified_by: fields.verified_by
        });
      }
    }

    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching audit records:", error);
    return generateMockAuditRecords();
  }
}

/**
 * Fetch all verified user profiles
 */
export async function fetchUserProfiles(): Promise<UserProfile[]> {
  try {
    if (!USER_REGISTRY_PACKAGE_ID || !USER_REGISTRY_OBJECT_ID) {
      console.warn("User registry configuration missing. Using mock data for development.");
      return generateMockUserProfiles();
    }

    // Query all UserProfile objects
    const response = await suiClient.getOwnedObjects({
      owner: USER_REGISTRY_OBJECT_ID,
      filter: {
        StructType: `${USER_REGISTRY_PACKAGE_ID}::user_role_registry::UserProfile`
      },
      options: {
        showContent: true,
        showType: true
      }
    });

    const profiles: UserProfile[] = [];
    
    for (const item of response.data) {
      if (item.data?.content && 'fields' in item.data.content) {
        const fields = item.data.content.fields as any;
        
        // Only include verified profiles
        if (fields.is_verified) {
          profiles.push({
            id: fields.id.id,
            owner: fields.owner,
            role: fields.role,
            name: fields.name,
            link: fields.link,
            is_verified: fields.is_verified,
            verified_by: fields.verified_by,
            email: fields.email,
            discord: fields.discord,
            zoom: fields.zoom,
            credential_link: fields.credential_link
          });
        }
      }
    }

    return profiles;
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return generateMockUserProfiles();
  }
}

/**
 * Check if a user is verified
 */
export async function isUserVerified(address: string): Promise<boolean> {
  try {
    if (!USER_REGISTRY_OBJECT_ID) {
      return false;
    }

    const registryObject = await suiClient.getObject({
      id: USER_REGISTRY_OBJECT_ID,
      options: { showContent: true }
    });

    if (registryObject.data?.content && 'fields' in registryObject.data.content) {
      const fields = registryObject.data.content.fields as any;
      const verifiedAddresses = fields.verified_addresses || [];
      return verifiedAddresses.includes(address);
    }

    return false;
  } catch (error) {
    console.error("Error checking user verification:", error);
    return false;
  }
}

// Mock data generators for development
function generateMockAuditRecords(): AuditRecord[] {
  return [
    {
      id: "0x1234567890abcdef",
      nft_id: "0xabcdef1234567890",
      ipfs_hash: "QmZ9nj7Tz4Jm8gK5q2K4B8fJaPgZm4xkFVSW8k3P",
      audited_by: "0x742d35cc6c29f3f9c66e5c8e6d5e1e2e3e4e5e6e",
      target_contract: "0x456789abcdef0123",
      timestamp: Date.now() - 3600000, // 1 hour ago
      role: "Senior Security Auditor",
      name: "Alex Smith",
      profile_link: "https://github.com/alexsmith",
      is_verified: true,
      verified_by: "0x123456789abcdef0"
    },
    {
      id: "0x2345678901bcdef0",
      nft_id: "0xbcdef0123456789a",
      ipfs_hash: "QmR8kl6Pz3Im7fJ4q1K3B7eJaPfZl3wkEVRW7j2N",
      audited_by: "0x853e46dd7d40g4g0d77f6d9f7e6f2f3f4f5f6f7f",
      target_contract: "0x567890bcdef01234",
      timestamp: Date.now() - 7200000, // 2 hours ago
      role: "Blockchain Security Expert",
      name: "Sarah Johnson",
      profile_link: "https://linkedin.com/in/sarah-johnson",
      is_verified: true,
      verified_by: "0x123456789abcdef0"
    },
    {
      id: "0x3456789012cdef01",
      nft_id: "0xcdef0123456789ab",
      ipfs_hash: "QmT7mj5Qz2Il6eI3p0J2B6dIaOeYk2vjDVQW6i1M",
      audited_by: "0x964f57ee8e51h5h1e88g7e0g8f7g3g4g5g6g7g8g",
      target_contract: "0x67890cdef0123456",
      timestamp: Date.now() - 14400000, // 4 hours ago
      role: "Smart Contract Auditor",
      name: "Michael Chen",
      profile_link: "https://twitter.com/michaelchen_sec",
      is_verified: true,
      verified_by: "0x123456789abcdef0"
    }
  ];
}

function generateMockUserProfiles(): UserProfile[] {
  return [
    {
      id: "0x1111111111111111",
      owner: "0x742d35cc6c29f3f9c66e5c8e6d5e1e2e3e4e5e6e",
      role: "Senior Security Auditor",
      name: "Alex Smith",
      link: "https://github.com/alexsmith",
      is_verified: true,
      verified_by: "0x123456789abcdef0",
      email: "alex@securityfirm.com",
      discord: "alexsmith#1234"
    },
    {
      id: "0x2222222222222222",
      owner: "0x853e46dd7d40g4g0d77f6d9f7e6f2f3f4f5f6f7f",
      role: "Blockchain Security Expert",
      name: "Sarah Johnson",
      link: "https://linkedin.com/in/sarah-johnson",
      is_verified: true,
      verified_by: "0x123456789abcdef0",
      email: "sarah@blockchain-security.io",
      credential_link: "https://certificates.blockchain-security.io/sarah"
    },
    {
      id: "0x3333333333333333",
      owner: "0x964f57ee8e51h5h1e88g7e0g8f7g3g4g5g6g7g8g",
      role: "Smart Contract Auditor",
      name: "Michael Chen",
      link: "https://twitter.com/michaelchen_sec",
      is_verified: true,
      verified_by: "0x123456789abcdef0",
      discord: "mchen_auditor#5678",
      zoom: "https://zoom.us/j/1234567890"
    },
    {
      id: "0x4444444444444444",
      owner: "0xa75f68ff9f62i6i2f99h8f1h9g8h4h5h6h7h8h9h",
      role: "DeFi Security Specialist",
      name: "Emma Rodriguez",
      link: "https://emmaaudits.com",
      is_verified: true,
      verified_by: "0x123456789abcdef0",
      email: "emma@emmaaudits.com",
      credential_link: "https://emmaaudits.com/credentials"
    },
    {
      id: "0x5555555555555555",
      owner: "0xb86g79gg0g73j7j3g00i9g2i0h9i5i6i7i8i9i0i",
      role: "Web3 Security Researcher",
      name: "David Kim",
      link: "https://davidkim.dev",
      is_verified: true,
      verified_by: "0x123456789abcdef0",
      discord: "davidkim_sec#9012",
      zoom: "https://zoom.us/j/0987654321"
    }
  ];
}

export { suiClient };