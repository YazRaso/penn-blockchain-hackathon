/**
 * Defines checkpoint trigger events and interval-based checkpoint cadence.
 */
type CheckpointPolicy = {
  /** Event names that should trigger checkpoint creation. */
  after: string[];
  /** Create a checkpoint every N relevant calls. */
  every: number;
};

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

export { CheckpointPolicy, WalletConfiguration };
