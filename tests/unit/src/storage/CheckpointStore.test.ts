import { describe, it, expect, vi, beforeEach } from "vitest";
import { CheckpointStore } from "@sdk/storage/CheckpointStore";
import { UnknownTriggerError, AgentStorageError } from "@sdk/errors";
import type { CheckpointEnvelope } from "@sdk/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnvelope(
  state: Record<string, unknown>,
  previous_pieceCid: string | null = null,
): CheckpointEnvelope {
  return {
    version: Date.now(),
    updated_at: new Date().toISOString(),
    previous_pieceCid,
    state,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CheckpointStore", () => {
  let store: ReturnType<typeof vi.fn>;
  let retrieve: ReturnType<typeof vi.fn>;
  let identity: { updateLatestPieceCid: ReturnType<typeof vi.fn> };
  let policy: { validate: ReturnType<typeof vi.fn> };
  let checkpointStore: CheckpointStore;

  beforeEach(() => {
    store = vi.fn().mockResolvedValue("bafy_new");
    retrieve = vi.fn();
    identity = { updateLatestPieceCid: vi.fn().mockResolvedValue(undefined) };
    policy = { validate: vi.fn() }; // no-op by default

    checkpointStore = new CheckpointStore({
      store,
      retrieve,
      identity,
      policy,
      agentId: "agent-1",
    });
  });

  // -------------------------------------------------------------------------
  // save() — happy path
  // -------------------------------------------------------------------------

  describe("save()", () => {
    it("validates the trigger before uploading", async () => {
      await checkpointStore.save({ x: 1 }, { trigger: "task_complete" });
      expect(policy.validate).toHaveBeenCalledWith("task_complete");
    });

    it("returns the pieceCid from store()", async () => {
      const pieceCid = await checkpointStore.save({ x: 1 }, { trigger: "task_complete" });
      expect(pieceCid).toBe("bafy_new");
    });

    it("uploads a CheckpointEnvelope with the given state", async () => {
      const state = { counter: 42 };
      await checkpointStore.save(state, { trigger: "task_complete" });

      const uploaded = store.mock.calls[0][0] as CheckpointEnvelope;
      expect(uploaded.state).toEqual(state);
      expect(typeof uploaded.version).toBe("number");
      expect(typeof uploaded.updated_at).toBe("string");
    });

    it("sets previous_pieceCid to null on the first checkpoint", async () => {
      await checkpointStore.save({ x: 1 }, { trigger: "task_complete" });

      const uploaded = store.mock.calls[0][0] as CheckpointEnvelope;
      expect(uploaded.previous_pieceCid).toBeNull();
    });

    it("sets previous_pieceCid to the prior pieceCid on subsequent saves", async () => {
      store
        .mockResolvedValueOnce("bafy_first")
        .mockResolvedValueOnce("bafy_second");

      await checkpointStore.save({ step: 1 }, { trigger: "task_complete" });
      await checkpointStore.save({ step: 2 }, { trigger: "task_complete" });

      const second = store.mock.calls[1][0] as CheckpointEnvelope;
      expect(second.previous_pieceCid).toBe("bafy_first");
    });

    it("calls identity.updateLatestPieceCid() with the new pieceCid", async () => {
      await checkpointStore.save({ x: 1 }, { trigger: "task_complete" });
      expect(identity.updateLatestPieceCid).toHaveBeenCalledWith("bafy_new");
    });

    it("updates the in-memory pointer so latest() returns the new state", async () => {
      const state = { k: "v" };
      store.mockResolvedValue("bafy_abc");
      retrieve.mockResolvedValue(JSON.stringify(makeEnvelope(state)));

      await checkpointStore.save(state, { trigger: "task_complete" });
      const result = await checkpointStore.latest();
      expect(result).toEqual(state);
    });

    // --- error paths ---

    it("throws when policy.validate() throws UnknownTriggerError", async () => {
      policy.validate.mockImplementation(() => {
        throw new UnknownTriggerError("Unknown checkpoint trigger 'bad'.");
      });

      await expect(
        checkpointStore.save({ x: 1 }, { trigger: "bad" }),
      ).rejects.toThrow(UnknownTriggerError);
    });

    it("does not call store() when the trigger is rejected by policy", async () => {
      policy.validate.mockImplementation(() => {
        throw new UnknownTriggerError("bad");
      });

      await expect(
        checkpointStore.save({ x: 1 }, { trigger: "bad" }),
      ).rejects.toThrow();
      expect(store).not.toHaveBeenCalled();
    });

    it("wraps store() failures in AgentStorageError", async () => {
      store.mockRejectedValue(new Error("network timeout"));
      await expect(
        checkpointStore.save({ x: 1 }, { trigger: "task_complete" }),
      ).rejects.toThrow(AgentStorageError);
    });

    it("wraps identity update failures in AgentStorageError", async () => {
      identity.updateLatestPieceCid.mockRejectedValue(new Error("chain error"));
      await expect(
        checkpointStore.save({ x: 1 }, { trigger: "task_complete" }),
      ).rejects.toThrow(AgentStorageError);
    });
  });

  // -------------------------------------------------------------------------
  // latest()
  // -------------------------------------------------------------------------

  describe("latest()", () => {
    it("returns null when no checkpoint exists", async () => {
      const result = await checkpointStore.latest();
      expect(result).toBeNull();
      expect(retrieve).not.toHaveBeenCalled();
    });

    it("returns the correct state after a save()", async () => {
      const state = { task: "done", score: 99 };
      store.mockResolvedValue("bafy_latest");
      retrieve.mockResolvedValue(JSON.stringify(makeEnvelope(state)));

      await checkpointStore.save(state, { trigger: "task_complete" });
      const result = await checkpointStore.latest();
      expect(result).toEqual(state);
    });

    it("calls retrieve() with the current latestPieceCid", async () => {
      store.mockResolvedValue("bafy_xyz");
      retrieve.mockResolvedValue(JSON.stringify(makeEnvelope({ a: 1 })));

      await checkpointStore.save({ a: 1 }, { trigger: "task_complete" });
      await checkpointStore.latest();

      expect(retrieve).toHaveBeenCalledWith("bafy_xyz");
    });
  });

  // -------------------------------------------------------------------------
  // setLatestPieceCid()
  // -------------------------------------------------------------------------

  describe("setLatestPieceCid()", () => {
    it("sets the pointer used by latest()", async () => {
      const state = { restored: true };
      retrieve.mockResolvedValue(JSON.stringify(makeEnvelope(state)));

      checkpointStore.setLatestPieceCid("bafy_restored");
      const result = await checkpointStore.latest();
      expect(result).toEqual(state);
    });

    it("setting null makes latest() return null", async () => {
      checkpointStore.setLatestPieceCid("bafy_something");
      checkpointStore.setLatestPieceCid(null);
      expect(await checkpointStore.latest()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // history()
  // -------------------------------------------------------------------------

  describe("history()", () => {
    it("yields nothing when no checkpoint exists", async () => {
      const results: Record<string, unknown>[] = [];
      for await (const state of checkpointStore.history()) {
        results.push(state);
      }
      expect(results).toHaveLength(0);
    });

    it("walks the back-pointer chain in order from latest to oldest", async () => {
      const envA = makeEnvelope({ step: "a" }, null);
      const envB = makeEnvelope({ step: "b" }, "cid_a");
      const envC = makeEnvelope({ step: "c" }, "cid_b");

      retrieve.mockImplementation(async (cid: string) => {
        if (cid === "cid_a") return JSON.stringify(envA);
        if (cid === "cid_b") return JSON.stringify(envB);
        if (cid === "cid_c") return JSON.stringify(envC);
        throw new Error(`Unknown cid: ${cid}`);
      });

      checkpointStore.setLatestPieceCid("cid_c");

      const results: Record<string, unknown>[] = [];
      for await (const state of checkpointStore.history()) {
        results.push(state);
      }

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ step: "c" });
      expect(results[1]).toEqual({ step: "b" });
      expect(results[2]).toEqual({ step: "a" });
    });

    it("stops at maxDepth before reaching the end of the chain", async () => {
      const cids = ["c5", "c4", "c3", "c2", "c1"];
      retrieve.mockImplementation(async (cid: string) => {
        const idx = cids.indexOf(cid);
        const prev = idx + 1 < cids.length ? cids[idx + 1] : null;
        return JSON.stringify(makeEnvelope({ cid }, prev));
      });

      checkpointStore.setLatestPieceCid("c5");

      const results: Record<string, unknown>[] = [];
      for await (const state of checkpointStore.history(2)) {
        results.push(state);
      }
      expect(results).toHaveLength(2);
    });
  });
});
