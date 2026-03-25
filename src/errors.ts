/**
 * Base error type for all SDK-specific failures.
 */
class AgentStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Aggregates one or more wallet policy violations into a single throw.
 */
class WalletAssertionError extends AgentStorageError {
  /**
   * Collected wallet policy violations discovered during a single assertion.
   */
  public readonly failures: AgentStorageError[];

  constructor(failures: AgentStorageError[]) {
    super(failures.map((e) => e.message).join("\n"));
    this.name = this.constructor.name;
    this.failures = failures;
  }
}

/**
 * Indicates the requested operation cost is greater than available balance.
 */
class InsufficientFundsError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Indicates the requested operation cost exceeded the configured transaction cap.
 */
class MaxTransactionCostExceededError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Indicates execution failed while running the low-budget callback.
 */
class LowBudgetCallbackError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export {
  AgentStorageError,
  WalletAssertionError,
  InsufficientFundsError,
  MaxTransactionCostExceededError,
  LowBudgetCallbackError,
};
