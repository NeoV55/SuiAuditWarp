// Update this with your deployed Sui NFT package ID
export const NFT_PACKAGE_ID =
  "0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914"; // Replace with your actual deployed package ID

export const IPFS_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs/";

export const DEVNET_COUNTER_PACKAGE_ID =
  "0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914";
export const TESTNET_COUNTER_PACKAGE_ID =
  "0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914   ";
export const MAINNET_COUNTER_PACKAGE_ID =
  "0x0d865f8b0ca4c353fbc142af6b74d88c4ec49d28c970b58c48b5599e1d314914";
// Default ETH amount for bridging
export const DEFAULT_ETH_AMOUNT = "0.01";

// IPFS Gateway URLs
export const IPFS_GATEWAYS = {
  primary: "https://ipfs.io/ipfs/",
  secondary: "https://gateway.pinata.cloud/ipfs/",
  fallback: "https://cloudflare-ipfs.com/ipfs/",
};

// Sample contract for demo purposes
export const SAMPLE_CONTRACT = `module hello_blockchain::message {
    use std::error;
    use std::signer;
    use std::string;
    use aptos_framework::event;

    //:!:>resource
    struct MessageHolder has key {
        message: string::String,
    }
    //<:!:resource

    #[event]
    struct MessageChange has drop, store {
        account: address,
        from_message: string::String,
        to_message: string::String,
    }

    /// There is no message present
    const ENO_MESSAGE: u64 = 0;

    #[view]
    public fun get_message(addr: address): string::String acquires MessageHolder {
        assert!(exists<MessageHolder>(addr), error::not_found(ENO_MESSAGE));
        borrow_global<MessageHolder>(addr).message
    }

    public entry fun set_message(account: signer, message: string::String)
    acquires MessageHolder {
        let account_addr = signer::address_of(&account);
        if (!exists<MessageHolder>(account_addr)) {
            move_to(&account, MessageHolder {
                message,
            })
        } else {
            let old_message_holder = borrow_global_mut<MessageHolder>(account_addr);
            let from_message = old_message_holder.message;
            event::emit(MessageChange {
                account: account_addr,
                from_message,
                to_message: copy message,
            });
            old_message_holder.message = message;
        }
    }

    #[test(account = @0x1)]
    public entry fun sender_can_set_message(account: signer) acquires MessageHolder {
        let addr = signer::address_of(&account);
        aptos_framework::account::create_account_for_test(addr);
        set_message(account, string::utf8(b"Hello, Blockchain"));

        assert!(
            get_message(addr) == string::utf8(b"Hello, Blockchain"),
            ENO_MESSAGE
        );
    }
}`;

// Audit pricing information
export const AUDIT_PRICING = {
  baseAuditFee: "0.005",
  wormholeBridgeFee: "0.002",
  nftMintingFee: "0.001", // in SUI
  totalEthCost: "0.007",
};

// Blockchain logos
export const BLOCKCHAIN_LOGOS = {
  ethereum:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/480px-Ethereum-icon-purple.svg.png",
  sui: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjU2IDBDMzk3LjQgMCA1MTIgMTE0LjYgNTEyIDI1NkM1MTIgMzk3LjQgMzk3LjQgNTEyIDI1NiA1MTJDMTE0LjYgNTEyIDAgMzk3LjQgMCAyNTZDMCAxMTQuNiAxMTQuNiAwIDI1NiAwWiIgZmlsbD0iIzZCQkVGRiIvPjxwYXRoIGQ9Ik0yNTYgNTBDMzY5LjcgNTAgNDYyIDE0Mi4zIDQ2MiAyNTZDNDYyIDM2OS43IDM2OS43IDQ2MiAyNTYgNDYyQzE0Mi4zIDQ2MiA1MCAzNjkuNyA1MCAyNTZDNTAgMTQyLjMgMTQyLjMgNTAgMjU2IDUwWiIgZmlsbD0iIzRCQTNFRiIvPjxwYXRoIGQ9Ik0xMzUgMzEyLjFMMjU2IDE5My4xTDM3NiAzMTIuMUwyNTYgMTI5LjFMMTM1IDMxMi4xWiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMjU2IDM1Ni45TDE3NSAyNzYuOUwyNTYgMjM2LjlMMzM2IDI3Ni45TDI1NiAzNTYuOVoiIGZpbGw9IndoaXRlIi8+PC9zdmc+",
};

// Chain IDs for Ethereum networks
export const ETHEREUM_NETWORKS = {
  mainnet: 1,
  goerli: 5,
  sepolia: 11155111,
};

// Supported blockchain networks
export const SUPPORTED_BLOCKCHAINS = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/480px-Ethereum-icon-purple.svg.png",
  },
  {
    id: "sui",
    name: "Sui",
    icon: "https://cryptologos.cc/logos/sui-sui-logo.png",
  },
  {
    id: "solana",
    name: "Solana",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    icon: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
  },
];

// Hero section image URLs
export const HERO_IMAGES = {
  aiAnalysis:
    "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64",
  crossChain:
    "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64",
  nftCertification:
    "https://images.unsplash.com/photo-1556742031-c6961e8560b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64",
};

// Feature description cards
export const FEATURE_CARDS = {
  aiAudit: {
    title: "About AI Audits",
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    items: [
      {
        icon: "shield",
        title: "Advanced Security Analysis",
        description:
          "Our AI audit system powered by Google Gemini analyzes your smart contract for common vulnerabilities and logic errors.",
      },
      {
        icon: "description",
        title: "Comprehensive Reports",
        description:
          "Receive a detailed PDF report with vulnerability assessments, risk levels, and recommended fixes.",
      },
      {
        icon: "storage",
        title: "Decentralized Storage",
        description:
          "Your audit report is stored on IPFS for permanent, decentralized access and verification.",
      },
      {
        icon: "verified",
        title: "On-Chain Certification",
        description:
          "Mint an NFT certificate on Sui blockchain that proves your contract has been audited.",
      },
    ],
  },
  crossChain: {
    title: "About Cross-Chain Bridging",
    imageUrl:
      "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    items: [
      {
        icon: "swap_horiz",
        title: "Wormhole Protocol",
        description:
          "AuditWarp uses Wormhole's secure cross-chain messaging protocol to verify audits across different blockchains.",
      },
      {
        icon: "lock",
        title: "ETH Locking",
        description:
          "By locking ETH, you create a verifiable on-chain record of your audit commitment that can be validated on the Sui blockchain.",
      },
      {
        icon: "verified_user",
        title: "Verified Action Approval",
        description:
          "The VAA (Verified Action Approval) serves as cryptographic proof of your audit across chains.",
      },
    ],
  },
  nft: {
    title: "About Audit NFTs",
    imageUrl:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    items: [
      {
        icon: "verified",
        title: "On-Chain Verification",
        description:
          "Your NFT provides cryptographic proof that your smart contract has undergone a professional security audit.",
      },
      {
        icon: "link",
        title: "Permanent Record",
        description:
          "The NFT links to your IPFS-stored audit report, ensuring the audit details are immutably preserved.",
      },
      {
        icon: "share",
        title: "Shareable Proof",
        description:
          "Share your audit NFT with investors, users, and other stakeholders to demonstrate your commitment to security.",
      },
    ],
  },
};
