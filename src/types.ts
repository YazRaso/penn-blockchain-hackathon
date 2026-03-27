/**
 * Configuration passed to `CheckpointPolicy` constructor.
 * Declares which named events trigger checkpoints and the count-based cadence.
 */
interface CheckpointPolicyConfig {
  /** Named event triggers. Must have at least one entry. */
  after: string[];
  /** Create a checkpoint every N calls (count-based fallback). Defaults to 10. */
  every?: number;
  /** Additional custom trigger names to register alongside `after`. */
  custom?: string[];
}

/**
 * Configures wallet limits and low-budget notification behavior.
 */
interface WalletConfiguration {
  /** Maximum allowed cost for a single operation. */
  maxTransactionCost?: bigint;
  /** Threshold below which low-budget handling should run. */
  lowBudgetThreshold: bigint;
  /** Optional callback executed when balance drops below threshold. */
  onLowBudget?: () => Promise<void>;
}

/**
 * Envelope wrapping a checkpoint's state with versioning and chain metadata.
 */
interface CheckpointEnvelope {
  /** Unix timestamp (ms) at save time — used as a monotonic version. */
  version: number;
  /** ISO 8601 timestamp of when this checkpoint was created. */
  updated_at: string;
  /** pieceCid of the previous checkpoint, or null for the first checkpoint. */
  previous_pieceCid: string | null;
  /** The agent's world state at this point in time. */
  state: Record<string, unknown>;
}

/**
 * A single entry in the append-only log buffer.
 */
interface LogEntry {
  /** ISO 8601 timestamp when the entry was appended. */
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Snapshot of SDK operational status returned by `checkHealth`.
 */
interface HealthReport {
  /** Health/readiness status for checkpoint state. */
  checkpoints: {
    /** Whether at least one checkpoint is available. */
    hasState: boolean;
    /** Whether the checkpoint subsystem is healthy. */
    healthy: boolean;
  };
  /** Health/readiness status for buffered logs. */
  logs: {
    /** Number of currently buffered log entries. */
    buffered: number;
    /** Whether the log subsystem is healthy. */
    healthy: boolean;
  };
  /** Health/readiness status for wallet funding. */
  wallet: {
    /** Current wallet balance in atto-USDFC. */
    balance: bigint;
    /** Whether the wallet has a positive spendable balance. */
    healthy: boolean;
  };
}

export {
  CheckpointPolicyConfig,
  WalletConfiguration,
  CheckpointEnvelope,
  LogEntry,
  HealthReport,
};
