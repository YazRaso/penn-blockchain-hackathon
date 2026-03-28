/**
 * AgentIdentity — ERC-8004 compliant agent identity module.
 *
 * Replaces the retired OnchainRegistry. Instead of a custom contract that maps
 * agentId → latestPieceCid, this module:
 *
 * 1. Creates an ERC-8004 agent card JSON on first run
 * 2. Uploads the agent card to Filecoin via Synapse SDK
 * 3. Registers the agent as an NFT on Base (calibnet or mainnet) using
 *    the network-specific ERC-8004 Identity Registry
 * 4. Updates the agent card with the latest pieceCid on every checkpoint
 *
 * The agent card includes a custom `latestPieceCid` field that points to the
 * most recent checkpoint. The agent card on Filecoin becomes the source of
 * truth for the latest checkpoint pointer.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Hex,
  parseAbi,
  decodeEventLog,
  type Log,
  zeroAddress,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { type Synapse } from "@filoz/synapse-sdk";
import {
  NETWORK_CONSTANTS,
  type NetworkConstants,
  type NetworkName,
} from "@sdk/constants.js";
import { AgentStorageError } from "@sdk/errors.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimal ABI surface we need from the ERC-8004 Identity Registry.
 *
 * `register(string tokenURI) → mints an ERC-721 NFT for the caller`
 * `setAgentURI(uint256 agentId, string newURI) → updates the stored agent URI`
 * `tokenURI(uint256 tokenId) → returns the tokenURI string`
 * `Transfer` event used to extract the minted tokenId
 */
const ERC8004_ABI = parseAbi([
  "function register(string tokenURI) external",
  "function setAgentURI(uint256 agentId, string newURI) external",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of an ERC-8004 agent card stored on Filecoin. */
export interface AgentCard {
  type: string;
  name: string;
  description: string;
  image?: string;
  endpoints: AgentEndpoint[];
  registrations: AgentRegistration[];
  supportedTrust: string[];
  /** Custom field: points to the latest checkpoint pieceCid on Filecoin. */
  latestPieceCid: string | null;
}

/** Declares an addressable endpoint exposed by the agent. */
export interface AgentEndpoint {
  name: string;
  endpoint: string;
  version?: string;
  capabilities?: Record<string, unknown>;
}

/** Records an on-chain registration where the agent is represented as an NFT. */
export interface AgentRegistration {
  chain: string;
  contractAddress: string;
  tokenId: string;
}

/** Configuration required to initialize AgentIdentity. */
export interface AgentIdentityConfig {
  /** Agent's human-readable name (used in the agent card). */
  name: string;
  /** Short description of the agent's capabilities. */
  description: string;
  /** Optional image / logo URL. */
  image?: string;
  /** MCP or other service endpoints the agent exposes. */
  endpoints?: AgentEndpoint[];
  /** Trust mechanisms. Defaults to `['reputation']`. */
  supportedTrust?: string[];
}

// ---------------------------------------------------------------------------
// AgentIdentity class
// ---------------------------------------------------------------------------

/**
 * Manages ERC-8004 identity lifecycle and keeps the on-chain tokenURI aligned
 * with the latest uploaded agent card.
 */
export class AgentIdentity {
  private agentCard: AgentCard;
  private tokenId: bigint | null = null;
  private cardPieceCid: string | null = null;

  private constructor(
    private readonly filecoinClient: Synapse,
    private readonly publicClient: PublicClient,
    private readonly walletClient: WalletClient,
    private readonly account: PrivateKeyAccount,
    private readonly networkConstants: NetworkConstants,
    agentCard: AgentCard,
    tokenId: bigint | null,
    cardPieceCid: string | null,
  ) {
    this.agentCard = agentCard;
    this.tokenId = tokenId;
    this.cardPieceCid = cardPieceCid;
  }

  // -----------------------------------------------------------------------
  // Factory
  // -----------------------------------------------------------------------

  /**
   * Create and initialise an `AgentIdentity` instance.
   *
   * On first run (no existing tokenId supplied) the method will:
   *  1. Build the agent card JSON
   *  2. Upload it to Filecoin via Synapse
  *  3. Register the agent on the ERC-8004 Identity Registry for the selected network
   *
   * On subsequent runs supply the `existingTokenId` returned from a previous
   * run so the module skips re-registration.
   */
  static async create(
    privateKey: string,
    filecoinClient: Synapse,
    config: AgentIdentityConfig,
    network: NetworkName = "calibnet",
    existingTokenId?: bigint,
  ): Promise<AgentIdentity> {
    const account = privateKeyToAccount(`0x${privateKey}` as Hex);
    const networkConstants = NETWORK_CONSTANTS[network];

    const publicClient = createPublicClient({
      chain: networkConstants.chain,
      transport: http(networkConstants.rpcUrls.base),
    });

    const walletClient = createWalletClient({
      chain: networkConstants.chain,
      transport: http(networkConstants.rpcUrls.base),
      account,
    });

    // -- Build agent card ---------------------------------------------------
    const walletEndpoint: AgentEndpoint = {
      name: "agentWallet",
      endpoint: `${networkConstants.chainNamespace}:${account.address}`,
    };

    const agentCard: AgentCard = {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: config.name,
      description: config.description,
      ...(config.image ? { image: config.image } : {}),
      endpoints: [...(config.endpoints ?? []), walletEndpoint],
      registrations: [],
      supportedTrust: config.supportedTrust ?? ["reputation"],
      latestPieceCid: null,
    };

    const detectedTokenId =
      existingTokenId ??
      (await AgentIdentity._findExistingTokenId(
        publicClient,
        account.address,
        networkConstants.erc8004RegistryAddress,
      ));

    // If we already have a tokenId, just look up the on-chain card and restore
    if (detectedTokenId !== undefined) {
      const identity = new AgentIdentity(
        filecoinClient,
        publicClient,
        walletClient,
        account,
        networkConstants,
        agentCard,
        detectedTokenId,
        null,
      );

      // Try to recover latestPieceCid from the stored agent card
      await identity._recoverFromChain();
      return identity;
    }

    // -- First run: upload card + register on-chain -------------------------
    const identity = new AgentIdentity(
      filecoinClient,
      publicClient,
      walletClient,
      account,
      networkConstants,
      agentCard,
      null,
      null,
    );

    await identity._uploadAndRegister();
    return identity;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Returns the latest checkpoint pieceCid as recorded on the agent card.
   * Equivalent to the old `OnchainRegistry.lookup()`.
   */
  getLatestPieceCid(): string | null {
    return this.agentCard.latestPieceCid;
  }

  /**
   * Returns the ERC-721 token ID assigned during registration.
   */
  getTokenId(): bigint | null {
    return this.tokenId;
  }

  /**
   * Returns the current in-memory agent card.
   */
  getAgentCard(): Readonly<AgentCard> {
    return Object.freeze({ ...this.agentCard });
  }

  /**
   * Update the agent card's `latestPieceCid`, re-upload to Filecoin, and
   * update the on-chain tokenURI so recovery works after restart.
   *
   * Called after every successful checkpoint save. This replaces the old
   * `OnchainRegistry.update()` call.
   */
  async updateLatestPieceCid(pieceCid: string): Promise<void> {
    this.agentCard.latestPieceCid = pieceCid;
    const newCardCid = await this._uploadAgentCard();
    await this._updateTokenURIOnChain(newCardCid);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Upload the current agent card JSON to Filecoin via Synapse.
   * Updates `this.cardPieceCid` with the new CID.
   */
  private async _uploadAgentCard(): Promise<string> {
    try {
      const bytes = Buffer.from(JSON.stringify(this.agentCard, null, 2));
      const result = await this.filecoinClient.storage.upload(bytes);
      this.cardPieceCid = result.pieceCid.toString();
      return this.cardPieceCid;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(`Failed to upload agent card: ${msg}`);
    }
  }

  /**
   * Update the on-chain tokenURI to point to the latest uploaded agent card.
   *
   * No-op if the agent is not yet registered (tokenId is null). Errors are
   * logged as warnings rather than thrown — if the chain update fails after a
   * successful Filecoin upload, the card data is still safe on Filecoin and
   * can be retried on the next checkpoint.
   */
  private async _updateTokenURIOnChain(cardCid: string): Promise<void> {
    if (this.tokenId === null) return;

    const tokenURI = `filecoin://${cardCid}`;
    try {
      const hash = await this.walletClient.writeContract({
        address: this.networkConstants.erc8004RegistryAddress,
        abi: ERC8004_ABI,
        functionName: "setAgentURI",
        args: [this.tokenId, tokenURI],
        account: this.account,
        chain: this.networkConstants.chain,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status !== "success") {
        console.warn(
          `AgentIdentity: setAgentURI transaction reverted for tokenId ${this.tokenId}`,
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`AgentIdentity: Failed to update on-chain tokenURI: ${msg}`);
    }
  }

  /**
   * Upload agent card then register on ERC-8004 Identity Registry.
   */
  private async _uploadAndRegister(): Promise<void> {
    // 1. Upload agent card to Filecoin
    const cardCid = await this._uploadAgentCard();

    // 2. Build tokenURI — use the pieceCid as a direct identifier
    //    (In production you'd use an IPFS gateway CID; here pieceCid works for
    //    Filecoin-native resolution.)
    const tokenURI = `filecoin://${cardCid}`;

    // 3. Register on Base Sepolia
    try {
      const hash = await this.walletClient.writeContract({
        address: this.networkConstants.erc8004RegistryAddress,
        abi: ERC8004_ABI,
        functionName: "register",
        args: [tokenURI],
        account: this.account,
        chain: this.networkConstants.chain,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
      });

      if (receipt.status !== "success") {
        throw new AgentStorageError("Registration transaction reverted");
      }

      // 4. Extract tokenId from Transfer event
      this.tokenId = this._extractTokenId(receipt.logs);

      // 5. Record the on-chain registration in the agent card
      this.agentCard.registrations = [
        {
          chain: this.networkConstants.chainNamespace,
          contractAddress: this.networkConstants.erc8004RegistryAddress,
          tokenId: this.tokenId!.toString(),
        },
      ];

      // 6. Re-upload agent card with registration info included
      await this._uploadAgentCard();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(
        `Failed to register agent on ERC-8004 Identity Registry: ${msg}`,
      );
    }
  }

  /**
   * Recover the `latestPieceCid` from the on-chain tokenURI.
   *
   * Reads the tokenURI, downloads the agent card from Filecoin, and restores
   * the `latestPieceCid` pointer.
   */
  private async _recoverFromChain(): Promise<void> {
    if (this.tokenId === null) return;

    try {
      // Read tokenURI from on-chain
      const tokenURI = (await this.publicClient.readContract({
        address: this.networkConstants.erc8004RegistryAddress,
        abi: ERC8004_ABI,
        functionName: "tokenURI",
        args: [this.tokenId],
      })) as string;

      if (!tokenURI) return;

      // Extract pieceCid from the tokenURI
      const pieceCid = tokenURI.replace("filecoin://", "");
      if (!pieceCid) return;

      // Download the agent card from Filecoin
      const bytes = await this.filecoinClient.storage.download({ pieceCid });
      const raw = new TextDecoder().decode(bytes);
      const storedCard = JSON.parse(raw) as AgentCard;

      // Restore the agent card state
      this.agentCard = storedCard;
      this.cardPieceCid = pieceCid;
    } catch (e: unknown) {
      // Recovery is best-effort — if it fails, we start with a fresh card
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`AgentIdentity: Failed to recover from chain: ${msg}`);
    }
  }

  /**
   * Detect an existing ERC-8004 token previously minted to this wallet.
   *
   * Returns the latest minted tokenId for the account, or `undefined` if no
   * prior registration exists.
   */
  private static async _findExistingTokenId(
    publicClient: PublicClient,
    owner: Hex,
    erc8004RegistryAddress: `0x${string}`,
  ): Promise<bigint | undefined> {
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const chunkSize = 9_999n;

      for (
        let toBlock = latestBlock;
        toBlock >= 0n;
        toBlock = toBlock > chunkSize ? toBlock - chunkSize - 1n : -1n
      ) {
        const fromBlock = toBlock > chunkSize ? toBlock - chunkSize : 0n;

        const transferEvents = await publicClient.getContractEvents({
          address: erc8004RegistryAddress,
          abi: ERC8004_ABI,
          eventName: "Transfer",
          args: {
            to: owner,
          },
          fromBlock,
          toBlock,
        });

        for (let i = transferEvents.length - 1; i >= 0; i--) {
          const event = transferEvents[i];
          if (event.args.from?.toLowerCase() === zeroAddress.toLowerCase()) {
            const tokenId = event.args.tokenId;
            if (tokenId === undefined) continue;

            try {
              const currentOwner = (await publicClient.readContract({
                address: erc8004RegistryAddress,
                abi: ERC8004_ABI,
                functionName: "ownerOf",
                args: [tokenId],
              })) as Hex;

              if (currentOwner.toLowerCase() === owner.toLowerCase()) {
                return tokenId;
              }
            } catch {
              // Token may be burned/nonexistent on some implementations.
              // Continue scanning older mint events.
            }
          }
        }

        if (fromBlock === 0n) break;
      }

      return undefined;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        `AgentIdentity: Failed to detect existing registration token: ${msg}`,
      );
      return undefined;
    }
  }

  /**
   * Extract the minted tokenId from the ERC-721 Transfer event logs.
   */
  private _extractTokenId(logs: Log[]): bigint {
    // Transfer event topic0
    const TRANSFER_TOPIC =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    for (const log of logs) {
      if (
        log.address.toLowerCase() ===
          this.networkConstants.erc8004RegistryAddress.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC
      ) {
        // tokenId is the 4th topic (index 3) in the Transfer event
        const decoded = decodeEventLog({
          abi: ERC8004_ABI,
          data: log.data,
          topics: log.topics as [Hex, ...Hex[]],
        });
        if (decoded.eventName === "Transfer" && "tokenId" in decoded.args) {
          return decoded.args.tokenId;
        }
      }
    }

    throw new AgentStorageError(
      "Could not extract tokenId from registration transaction logs",
    );
  }
}
