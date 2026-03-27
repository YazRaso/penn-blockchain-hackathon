import { AgentStorageError } from "@sdk/errors.js";
import type { CheckpointEnvelope } from "@sdk/types.js";

// ---------------------------------------------------------------------------
// Dependency interfaces — narrow types that keep CheckpointStore testable
// ---------------------------------------------------------------------------

interface ICheckpointPolicy {
  validate(trigger: string): void;
}

interface IAgentIdentity {
  updateLatestPieceCid(pieceCid: string): Promise<void>;
}

interface CheckpointStoreDeps {
  store: (data: unknown) => Promise<string>;
  retrieve: (pieceCid: string) => Promise<string>;
  /** ERC-8004 identity — source of truth for the on-chain checkpoint pointer. */
  identity: IAgentIdentity;
  policy: ICheckpointPolicy;
}

// ---------------------------------------------------------------------------
// CheckpointStore
// ---------------------------------------------------------------------------

/**
 * Persists versioned world-state snapshots to Filecoin and maintains a
 * verifiable linked chain via `previous_pieceCid` back-pointers.
 *
 * Each saved checkpoint updates the agent's ERC-8004 agent card so the
 * latest checkpoint can be recovered after a crash or restart.
 *
 * **Dependency injection**: receives `store`, `retrieve`, `identity`, and
 * `policy` from `AgentStorage.create()` — nothing is constructed internally.
 */
export class CheckpointStore {
  /** In-memory cache of the latest pieceCid. Source of truth is the chain. */
  private latestPieceCid: string | null = null;

  /**
   * Creates a checkpoint store with injected persistence and policy dependencies.
   *
   * @param deps Store, retrieval, identity, and policy dependencies.
   */
  constructor(private deps: CheckpointStoreDeps) {}

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Save a checkpoint to Filecoin and update the on-chain agent card.
   *
   * Steps:
   *  1. Validate `trigger` against the checkpoint policy.
   *  2. Build a `CheckpointEnvelope` with a back-pointer to the previous CID.
   *  3. Upload the envelope to Filecoin via `store()`.
   *  4. Update the ERC-8004 agent card via `identity.updateLatestPieceCid()`.
   *  5. Update the in-memory pointer.
   *
   * @param state    Agent world state to snapshot.
   * @param options  Must include the named `trigger` event.
   * @returns        pieceCid of the uploaded checkpoint.
   * @throws         `UnknownTriggerError` if the trigger is not registered.
   * @throws         `AgentStorageError` if the upload or identity update fails.
   */
  async save(
    state: Record<string, unknown>,
    options: { trigger: string },
  ): Promise<string> {
    // 1. Fail fast on unknown triggers — do not upload anything
    this.deps.policy.validate(options.trigger);

    // 2. Build envelope with back-pointer for verifiable chain
    const envelope: CheckpointEnvelope = {
      version: Date.now(),
      updated_at: new Date().toISOString(),
      previous_pieceCid: this.latestPieceCid,
      state,
    };

    // 3. Upload to Filecoin
    let pieceCid: string;
    try {
      pieceCid = await this.deps.store(envelope);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(`CheckpointStore: failed to upload checkpoint: ${msg}`);
    }

    // 4. Update ERC-8004 agent card so recovery works after restart
    try {
      await this.deps.identity.updateLatestPieceCid(pieceCid);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(
        `CheckpointStore: checkpoint uploaded (${pieceCid}) but identity update failed: ${msg}`,
      );
    }

    // 5. Update in-memory pointer (cache only — chain is the source of truth)
    this.latestPieceCid = pieceCid;

    return pieceCid;
  }

  /**
   * Retrieve the agent's most recent world state.
   *
   * @returns The state from the latest checkpoint, or `null` if none exists.
   */
  async latest(): Promise<Record<string, unknown> | null> {
    if (!this.latestPieceCid) return null;
    const raw = await this.deps.retrieve(this.latestPieceCid);
    const envelope = JSON.parse(raw) as CheckpointEnvelope;
    return envelope.state;
  }

  /**
   * Retrieve the world state from a specific checkpoint by pieceCid.
   *
   * @param pieceCid  Content identifier of the checkpoint to retrieve.
   * @returns         The state stored in that checkpoint.
   */
  async at(pieceCid: string): Promise<Record<string, unknown>> {
    const raw = await this.deps.retrieve(pieceCid);
    const envelope = JSON.parse(raw) as CheckpointEnvelope;
    return envelope.state;
  }

  /**
   * Walk the checkpoint chain backwards from the latest, yielding each state.
   *
   * @param maxDepth  Maximum number of checkpoints to traverse. Defaults to 10.
   */
  async *history(maxDepth = 10): AsyncGenerator<Record<string, unknown>> {
    let pieceCid = this.latestPieceCid;
    let depth = 0;
    while (pieceCid && depth < maxDepth) {
      const raw = await this.deps.retrieve(pieceCid);
      const envelope = JSON.parse(raw) as CheckpointEnvelope;
      yield envelope.state;
      pieceCid = envelope.previous_pieceCid;
      depth++;
    }
  }

  /**
   * Restore the in-memory pointer from the value recovered at startup.
   *
   * Called by `AgentStorage.create()` after reading `latestPieceCid` from the
   * ERC-8004 agent card. The in-memory pointer is a cache — the chain is
   * always the source of truth.
   */
  setLatestPieceCid(pieceCid: string | null): void {
    this.latestPieceCid = pieceCid;
  }
}
