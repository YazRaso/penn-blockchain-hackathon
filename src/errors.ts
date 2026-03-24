class AgentStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// WalletAssertionErrors
class WalletAssertionError extends AgentStorageError {
  constructor(public readonly failures: AgentStorageError[]) {
    super(failures.map((e) => e.message).join("\n"));
    this.name = this.constructor.name;
  }
}

class InsufficientFundsError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class MaxTransactionCostExceededError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

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
