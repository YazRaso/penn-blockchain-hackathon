/**
 * Enforces wallet funding policy for storage operations.
 */
import { Synapse } from "@filoz/synapse-sdk";
import { WalletConfiguration } from "@sdk/types.js";
import {
  AgentStorageError,
  InsufficientFundsError,
  MaxTransactionCostExceededError,
  LowBudgetCallbackError,
  WalletAssertionError,
} from "@sdk/errors.js";

export class AgentWallet {
  /**
   * Creates a wallet policy wrapper over the Synapse payments client.
   *
   * @param filecoinClient Synapse client used to query wallet balance.
   * @param walletConfig Funding policy constraints and callbacks.
   */
  constructor(
    private filecoinClient: Synapse,
    private walletConfig: WalletConfiguration,
  ) {}

  /**
   * Returns the current wallet balance.
   *
   * @returns The available balance in base units.
   * @throws AgentStorageError If the balance query fails.
   */
  async getBalance(): Promise<bigint> {
    try {
      return await this.filecoinClient.payments.walletBalance();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(`Failed to get wallet balance: ${msg}`);
    }
  }

  /**
   * Validates that a transaction cost satisfies the configured wallet policy.
   *
   * @param cost Estimated transaction cost to validate.
   * @throws WalletAssertionError If one or more policy checks fail.
   */
  async assertSufficientFunds(cost: bigint): Promise<void> {
    const errors: AgentStorageError[] = [];
    const balance = await this.getBalance();

    if (cost > balance) {
      errors.push(
        new InsufficientFundsError(
          `Transaction cost of ${cost} exceeds wallet balance of ${balance}`,
        ),
      );
    }

    if (
      this.walletConfig.maxTransactionCost !== undefined &&
      cost > this.walletConfig.maxTransactionCost
    ) {
      errors.push(
        new MaxTransactionCostExceededError(
          `Transaction cost of ${cost} exceeds the maximum allowance of ${this.walletConfig.maxTransactionCost}`,
        ),
      );
    }

    if (balance < this.walletConfig.lowBudgetThreshold) {
      try {
        await this.walletConfig.onLowBudget?.();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const stack = e instanceof Error ? e.stack : undefined;
        errors.push(
          new LowBudgetCallbackError(
            `Low budget callback failed: ${msg}${stack ? `, this was caused by ${stack}` : ""}`,
          ),
        );
      }
    }

    if (errors.length > 0) {
      throw new WalletAssertionError(errors);
    }
  }
}
