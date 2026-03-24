import { Synapse } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";

import { CheckpointPolicy } from "./types.ts";

/**
 * AgentStorage is a singleton class responsible for managing the storage
 * of an agent's state and checkpoints on Filecoin Onchain Cloud using the Synapse SDK.
 */
export default class AgentStorage {
  private constructor(
    private readonly filecoinClient: ReturnType<typeof Synapse.create>,
    _privateKey: string,
    _wallet: unknown,
    _checkpointPolicy: CheckpointPolicy,
  ) {}

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

  /** primitive methods for storing and retrieving data
   * Note: These are internal methods and not exposed as part of the public API.
   * They are used for internal library use.
   */
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
