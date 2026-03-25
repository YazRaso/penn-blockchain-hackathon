/**
 * AgentWallet is responsible for enforcing an agent policy based on WalletConfiguration.
 *
 */
import { Synapse } from "@filoz/synapse-sdk";
import { WalletConfiguration } from "@sdk/types";
import {
  AgentStorageError,
  InsufficientFundsError,
  MaxTransactionCostExceededError,
  LowBudgetCallbackError,
  WalletAssertionError,
} from "@sdk/errors";

export class AgentWallet {
  constructor(
    private filecoinClient: Synapse,
    private walletConfig: WalletConfiguration,
  ) {}

  // getBalance gets the balance of the agent's wallet
  async getBalance(): Promise<bigint> {
    try {
      return await this.filecoinClient.payments.walletBalance();
    } catch (e) {
      throw new AgentStorageError(`Failed to get wallet balance: ${e.message}`);
    }
  }

  // assertSufficientFunds checks if a wallet has sufficient funds based on walletConfig
  async assertSufficientFunds(cost: bigint): Promise<void> {
    let errors = [];
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
      } catch (e) {
        errors.push(
          new LowBudgetCallbackError(
            `Low budget callback failed: ${e.message}, this was caused by ${e.stack}`,
          ),
        );
      }
    }

    if (errors.length > 0) {
      throw new WalletAssertionError(errors);
    }
  }
}
