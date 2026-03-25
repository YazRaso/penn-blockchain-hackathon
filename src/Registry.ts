import AgentRegistry from "@sdk/artifacts/artifacts/contracts/OnchainRegistry.sol/AgentRegistry.json";
import {
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { filecoin, filecoinCalibration } from "viem/chains";

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

  static async create(
    privateKey: string,
    network: "mainnet" | "calibration" = "mainnet",
  ): Promise<OnchainRegistry> {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const networkChain = network === "mainnet" ? filecoin : filecoinCalibration;
    const publicClient = createPublicClient({
      chain: networkChain,
      transport: http(),
    });

    const walletClient = createWalletClient({
      chain: networkChain,
      transport: http(),
      account,
    });

    const hash = await walletClient.deployContract({
      abi: AgentRegistry.abi,
      bytecode: AgentRegistry.bytecode as `0x${string}`,
      account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return new OnchainRegistry(
      receipt.contractAddress!,
      publicClient,
      walletClient,
    );
  }
}
