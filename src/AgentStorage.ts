import { Synapse } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";

import { type NetworkName } from "@sdk/constants.js";
import { AgentStorageError } from "@sdk/errors.js";
import { AgentIdentity, type AgentIdentityConfig } from "@sdk/identity/AgentIdentity.js";
import { AgentWallet } from "@sdk/wallet/AgentWallet.js";
import { CheckpointPolicy } from "@sdk/policy.js";
import { CheckpointStore } from "@sdk/storage/CheckpointStore.js";
import { LogStore } from "@sdk/storage/LogStore.js";
import {
  CheckpointPolicyConfig,
  HealthReport,
  WalletConfiguration,
} from "@sdk/types.js";

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

/** Runtime configuration required to initialize `AgentStorage`. */
export interface AgentStorageConfig {
  /** Hex private key without the `0x` prefix. */
  privateKey: string;
  /** Wallet policy: budget caps and low-budget callback. */
  wallet: WalletConfiguration;
  /** Checkpoint trigger policy. */
  checkpointPolicy: CheckpointPolicyConfig;
  /** ERC-8004 agent identity configuration. */
  identity: AgentIdentityConfig;
  /**
   * Runtime network. Defaults to `calibnet`.
   * - `calibnet` uses Base Sepolia
   * - `mainnet` uses Base Mainnet
   */
  network?: NetworkName;
  /**
   * ERC-721 tokenId from a previous run.
   * Supply this on every run after the first to skip re-registration.
   */
  existingTokenId?: bigint;
  /**
   * Number of log entries to buffer before auto-flushing to Filecoin.
   * Defaults to 50.
   */
  logFlushThreshold?: number;
}

// ---------------------------------------------------------------------------
// AgentStorage
// ---------------------------------------------------------------------------

/**
 * Main entry point for the Cleft SDK.
 *
 * Coordinates all storage modules: wallet policy, checkpoint persistence,
 * append-only logging, and ERC-8004 agent identity.
 *
 * Use the public `checkpoints` and `logs` properties to interact with storage.
 * Do not call `_store()` or `_retrieve()` directly — they are private primitives
 * used internally by `CheckpointStore` and `LogStore`.
 */
export default class AgentStorage {
  private constructor(
    private readonly filecoinClient: Synapse,
    /** ERC-8004 identity — source of truth for `latestPieceCid`. */
    public readonly identity: AgentIdentity,
    /** Wallet policy wrapper — call `assertSufficientFunds` before expensive ops. */
    public readonly wallet: AgentWallet,
    /** Versioned world-state checkpoint store. */
    public readonly checkpoints: CheckpointStore,
    /** Append-only audit log store. */
    public readonly logs: LogStore,
  ) {}

  /**
   * Builds an `AgentStorage` instance from runtime config.
   *
   * Initialisation order:
   *  1. Establish Synapse / Filecoin connection
   *  2. Bind `store` / `retrieve` Filecoin primitives as injectable closures
   *  3. Initialise `AgentWallet` with wallet policy
   *  4. Initialise `AgentIdentity` — registers on-chain (first run) or restores
   *     `latestPieceCid` from the ERC-8004 agent card (subsequent runs)
   *  5. Initialise `CheckpointPolicy`
   *  6. Initialise `CheckpointStore` with injected closures, identity, and policy
   *  7. Restore `latestPieceCid` into `CheckpointStore` from identity
   *  8. Initialise `LogStore` with injected store closure
   *
   * @param config - SDK configuration.
   * @returns A fully wired `AgentStorage` instance, ready to use.
   */
  static async create(config: AgentStorageConfig): Promise<AgentStorage> {
    const network = config.network ?? "calibnet";

    // 1. Establish Synapse / Filecoin connection
    const filecoinClient = await Synapse.create({
      account: privateKeyToAccount(`0x${config.privateKey}`),
      source: "cleft",
    });

    // 2. Bind storage primitives as injectable closures.
    //    All Synapse exceptions are caught here and re-thrown as AgentStorageError.
    //    TODO: inspect exception type/message to throw more specific subclasses
    //    (NetworkError, ProviderBusyError, DealRejectedError, etc.) once Synapse
    //    error shapes are documented.
    const store = async (data: unknown): Promise<string> => {
      try {
        const bytes = Buffer.from(JSON.stringify(data));
        const result = await filecoinClient.storage.upload(bytes);
        return result.pieceCid.toString();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new AgentStorageError(`Failed to store data: ${msg}`);
      }
    };

    const retrieve = async (pieceCid: string): Promise<string> => {
      try {
        const bytes = await filecoinClient.storage.download({ pieceCid });
        return new TextDecoder().decode(bytes);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new AgentStorageError(`Failed to retrieve data: ${msg}`);
      }
    };

    // 3. Initialise wallet policy
    const wallet = new AgentWallet(filecoinClient, config.wallet);

    // 4. Initialise ERC-8004 identity (replaces OnchainRegistry)
    const identity = await AgentIdentity.create(
      config.privateKey,
      filecoinClient,
      config.identity,
      network,
      config.existingTokenId,
    );

    // 5. Initialise checkpoint policy
    const policy = new CheckpointPolicy(config.checkpointPolicy);

    // 6. Initialise CheckpointStore with injected dependencies
    const checkpoints = new CheckpointStore({
      store,
      retrieve,
      identity,
      policy,
    });

    // 7. Restore latestPieceCid from the agent card recovered at startup
    checkpoints.setLatestPieceCid(identity.getLatestPieceCid());

    // 8. Initialise LogStore with injected store closure
    const logs = new LogStore({
      store,
      flushThreshold: config.logFlushThreshold ?? 50,
    });

    return new AgentStorage(filecoinClient, identity, wallet, checkpoints, logs);
  }

  // -------------------------------------------------------------------------
  // Convenience accessors
  // -------------------------------------------------------------------------

  /**
   * Returns the wallet balance in atto-USDFC.
   */
  async budget(): Promise<bigint> {
    return this.wallet.getBalance();
  }

  /**
   * Returns an operational health summary for checkpoints, logs, and wallet.
   */
  async health(): Promise<HealthReport> {
    const [balance, latestState] = await Promise.all([
      this.wallet.getBalance(),
      this.checkpoints.latest(),
    ]);

    return {
      checkpoints: {
        hasState: latestState !== null,
        healthy: true,
      },
      logs: {
        buffered: this.logs.bufferSize(),
        healthy: true,
      },
      wallet: {
        balance,
        healthy: balance > 0n,
      },
    };
  }

  /**
   * Returns the latest checkpoint pieceCid, or `null` if no checkpoint exists.
   * Delegates to `identity.getLatestPieceCid()` — the chain is the source of truth.
   */
  getLatestPieceCid(): string | null {
    return this.identity.getLatestPieceCid();
  }
}
