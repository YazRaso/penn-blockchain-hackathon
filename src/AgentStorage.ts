import { Synapse } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";

import { CheckpointPolicy } from "@sdk/types";

/**
 * Creates and holds the Synapse client used by SDK storage primitives.
 */
export default class AgentStorage {
  private constructor(
    private readonly filecoinClient: ReturnType<typeof Synapse.create>,
    _privateKey: string,
    _wallet: unknown,
    _checkpointPolicy: CheckpointPolicy,
  ) {}

  /**
   * Builds an `AgentStorage` instance from runtime wallet and checkpoint policy inputs.
   *
    * @param privateKey - Hex private key without the `0x` prefix.
   * @returns A configured `AgentStorage` instance.
   */
  static async create(
    privateKey: string,
    wallet: unknown,
    checkpointPolicy: CheckpointPolicy,
  ) {
    // setup synapase instance
    const filecoinClient = Synapse.create({
      account: privateKeyToAccount(`0x${privateKey}`),
      source: "agent-storage",
    });

    return new AgentStorage(
      filecoinClient,
      privateKey,
      wallet,
      checkpointPolicy,
    );
  }

  private async _store(data: unknown): Promise<string> {
    const bytes = Buffer.from(JSON.stringify(data));
    const result = await this.filecoinClient.storage.upload(bytes);
    return result.pieceCid.toString();
  }

  private async _retrieve(pieceCid: string): Promise<string> {
    const bytes = await this.filecoinClient.storage.download({ pieceCid });
    const decodedText = new TextDecoder().decode(bytes);
    return decodedText;
  }
}
