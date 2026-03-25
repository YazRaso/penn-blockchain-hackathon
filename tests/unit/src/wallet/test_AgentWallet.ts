import { describe, beforeEach, it, vi, expect } from "vitest";
import { AgentWallet } from "@sdk/wallet/AgentWallet";
import { WalletConfiguration } from "@sdk/types";
import { WalletAssertionError } from "@sdk/errors";

describe("AgentWallet.assertSufficientFunds", () => {
  let mockWallet: AgentWallet;
  let mockConfig: WalletConfiguration;
  let mockSynapse: any;

  beforeEach(() => {
    mockSynapse = {
      payments: {
        walletBalance: vi.fn(async () => 50n),
      },
    };

    mockConfig = {
      maxTransactionCost: 100n,
      lowBudgetThreshold: 20n,
      onLowBudget: vi.fn(async () => {}),
    };

    mockWallet = new AgentWallet(mockSynapse, mockConfig);
  });

  it("happy path: cost < balance && cost < maxTransactionCost && balance > lowBudgetThreshold", async () => {
    await expect(mockWallet.assertSufficientFunds(10n)).resolves.not.toThrow();
  });

  it("insufficient funds: cost > balance", async () => {
    await expect(mockWallet.assertSufficientFunds(60n)).rejects.toThrow(
      WalletAssertionError,
    );
  });

  it("max transaction cost exceeded: cost > maxTransactionCost", async () => {
    await expect(mockWallet.assertSufficientFunds(150n)).rejects.toThrow(
      WalletAssertionError,
    );
  });

  it("low budget warning: balance < lowBudgetThreshold, should not throw but fires callback", async () => {
    mockSynapse.payments.walletBalance = vi.fn(async () => 15n);
    await expect(mockWallet.assertSufficientFunds(5n)).resolves.not.toThrow();
    expect(mockConfig.onLowBudget).toHaveBeenCalled();
  });
});
