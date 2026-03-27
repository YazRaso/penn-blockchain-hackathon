/**
 * Base error type for all SDK-specific failures.
 */
class AgentStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ---------------------------------------------------------------------------
// Transient errors — retriable, SDK handles internally
// ---------------------------------------------------------------------------

/** Base class for transient failures the SDK may retry. */
class TransientError extends AgentStorageError {}

/** Network-level failure (DNS, TCP, timeout). */
class NetworkError extends TransientError {}

/** Storage provider is temporarily overloaded. */
class ProviderBusyError extends TransientError {}

// ---------------------------------------------------------------------------
// Recoverable errors — agent must take action
// ---------------------------------------------------------------------------

/** Base class for errors the agent can act on. */
class RecoverableError extends AgentStorageError {}

/** Storage deal was rejected by the provider. */
class DealRejectedError extends RecoverableError {}

/** Storage deal expired before renewal. */
class DealExpiredError extends RecoverableError {}

/**
 * Indicates the requested operation cost is greater than available balance.
 */
class InsufficientFundsError extends RecoverableError {}

/**
 * Indicates the requested operation cost exceeded the configured transaction cap.
 */
class MaxTransactionCostExceededError extends RecoverableError {}

// ---------------------------------------------------------------------------
// Configuration errors — developer must fix
// ---------------------------------------------------------------------------

/** Base class for misconfiguration that requires a code change. */
class ConfigurationError extends AgentStorageError {}

/** A checkpoint trigger was fired that was never declared in policy. */
class UnknownTriggerError extends ConfigurationError {}

/** A required configuration value is absent. */
class MissingConfigError extends ConfigurationError {}

/** A policy rule was violated (e.g. no triggers registered). */
class PolicyViolationError extends ConfigurationError {}

// ---------------------------------------------------------------------------
// Wallet aggregate error
// ---------------------------------------------------------------------------

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
 * Indicates execution failed while running the low-budget callback.
 */
class LowBudgetCallbackError extends AgentStorageError {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ---------------------------------------------------------------------------
// Fatal errors — data is gone
// ---------------------------------------------------------------------------

/** Base class for unrecoverable data-loss conditions. */
class FatalError extends AgentStorageError {}

/** Data was confirmed stored but can no longer be retrieved. */
class DataLostError extends FatalError {}

/** Retrieved data failed integrity checks. */
class CorruptionError extends FatalError {}

export {
  AgentStorageError,
  TransientError,
  NetworkError,
  ProviderBusyError,
  RecoverableError,
  DealRejectedError,
  DealExpiredError,
  InsufficientFundsError,
  MaxTransactionCostExceededError,
  ConfigurationError,
  UnknownTriggerError,
  MissingConfigError,
  PolicyViolationError,
  WalletAssertionError,
  LowBudgetCallbackError,
  FatalError,
  DataLostError,
  CorruptionError,
};
