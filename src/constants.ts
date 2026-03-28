import { base, baseSepolia, type Chain } from "viem/chains";

/** Supported SDK runtime networks. */
export type NetworkName = "calibnet" | "mainnet";

/** Network-specific constants used across the SDK. */
export interface NetworkConstants {
  rpcUrls: {
    base: string;
  };
  contractAddresses: {
    erc8004Registry: `0x${string}`;
  };
  /** Convenience alias for the ERC-8004 registry contract address. */
  erc8004RegistryAddress: `0x${string}`;
  chain: Chain;
  chainNamespace: `eip155:${number}`;
}

/**
 * Centralized network map. Keep all network-specific values here.
 */
export const NETWORK_CONSTANTS: Record<NetworkName, NetworkConstants> = {
  calibnet: {
    rpcUrls: {
      base: "https://sepolia.base.org",
    },
    contractAddresses: {
      erc8004Registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    },
    erc8004RegistryAddress: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    chain: baseSepolia,
    chainNamespace: "eip155:84532",
  },
  mainnet: {
    rpcUrls: {
      base: "https://mainnet.base.org",
    },
    contractAddresses: {
      erc8004Registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    },
    erc8004RegistryAddress: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    chain: base,
    chainNamespace: "eip155:8453",
  },
};
