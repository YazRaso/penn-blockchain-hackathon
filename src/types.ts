// Types
type CheckpointPolicy = {
  after: string[];
  every: number;
};

// Interfaces
interface WalletConfiguration {
  maxTransactionCost: number;
  lowBudgetThreshold: number;
  onLowBudget?: () => Promise<void>;
}

export { CheckpointPolicy, WalletConfiguration };
