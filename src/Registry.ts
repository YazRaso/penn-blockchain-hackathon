import AgentRegistry from "@sdk/artifacts/contracts/OnchainRegistry.sol/AgentRegistry.json" with { type: "json" };
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { filecoinCalibration } from "viem/chains";

class OnchainRegistry {
  private contractAddress: `0x${string}`;
  private publicClient;
  private walletClient;

  private constructor(
    contractAddress: `0x${string}`,
    publicClient,
    walletClient,
  ) {
    this.contractAddress = contractAddress;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  static async create(privateKey: string): Promise<OnchainRegistry> {
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: filecoinCalibration,
      transport: http(),
    });

    const walletClient = createWalletClient({
      chain: filecoinCalibration,
      transport: http(),
      account,
    });

    const hash = await walletClient.deployContract({
      abi: AgentRegistry.abi,
      bytecode: AgentRegistry.bytecode as `0x${string}`,
      account,
      chain: null,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return new OnchainRegistry(
      receipt.contractAddress!,
      publicClient,
      walletClient,
    );
  }
}
