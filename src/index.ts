/**
 * Agent Storage SDK — public API surface.
 *
 * Import everything consumers need from this single entry point.
 * Internal types (CheckpointStoreDeps, LogStoreDeps, etc.) are intentionally
 * not exported here.
 */

// Main entry point
export { default as AgentStorage } from "@sdk/AgentStorage.js";
export type { AgentStorageConfig } from "@sdk/AgentStorage.js";

// Storage modules
export { CheckpointStore } from "@sdk/storage/CheckpointStore.js";
export { LogStore } from "@sdk/storage/LogStore.js";

// Identity
export { AgentIdentity } from "@sdk/identity/AgentIdentity.js";
export type {
  AgentCard,
  AgentEndpoint,
  AgentRegistration,
  AgentIdentityConfig,
} from "@sdk/identity/AgentIdentity.js";

// Wallet
export { AgentWallet } from "@sdk/wallet/AgentWallet.js";

// Policy
export { CheckpointPolicy } from "@sdk/policy.js";

// Shared types
export type {
  CheckpointPolicyConfig,
  WalletConfiguration,
  CheckpointEnvelope,
  LogEntry,
  HealthReport,
} from "@sdk/types.js";

// Error hierarchy
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
} from "@sdk/errors.js";

// Vercel AI adapter
export { createAgentStorageTools } from "@sdk/adapters/vercel-ai.js";
