import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAgentStorageTools } from "../../../../src/adapters/vercel-ai.ts";
import type AgentStorage from "../../../../src/AgentStorage.ts";

// ---------------------------------------------------------------------------
// Mock AgentStorage
// ---------------------------------------------------------------------------

function makeMockStorage() {
  return {
    saveCheckpoint: vi.fn<[unknown], Promise<string>>(),
    getLatestPieceCid: vi.fn<[], string | null>(),
    _retrieve: vi.fn<[string], Promise<string>>(),
    _store: vi.fn<[unknown], Promise<string>>(),
  } as unknown as AgentStorage;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createAgentStorageTools", () => {
  let storage: AgentStorage;

  beforeEach(() => {
    storage = makeMockStorage();
  });

  // -------------------------------------------------------------------------
  // checkpoint
  // -------------------------------------------------------------------------

  describe("checkpoint", () => {
    it("calls saveCheckpoint with state and trigger wrapped together", async () => {
      vi.mocked(storage.saveCheckpoint).mockResolvedValue("bafy_chk");
      const { checkpoint } = createAgentStorageTools(storage);

      await checkpoint.execute(
        { state: { counter: 1 }, trigger: "task_complete" },
        { messages: [], toolCallId: "t1" },
      );

      expect(storage.saveCheckpoint).toHaveBeenCalledWith({
        state: { counter: 1 },
        trigger: "task_complete",
      });
    });

    it("returns the pieceCid from saveCheckpoint", async () => {
      vi.mocked(storage.saveCheckpoint).mockResolvedValue("bafy_chk");
      const { checkpoint } = createAgentStorageTools(storage);

      const result = await checkpoint.execute(
        { state: {}, trigger: "startup" },
        { messages: [], toolCallId: "t2" },
      );

      expect(result).toEqual({ pieceCid: "bafy_chk" });
    });
  });

  // -------------------------------------------------------------------------
  // resumeState
  // -------------------------------------------------------------------------

  describe("resumeState", () => {
    it("returns found: false when no checkpoint exists", async () => {
      vi.mocked(storage.getLatestPieceCid).mockReturnValue(null);
      const { resumeState } = createAgentStorageTools(storage);

      const result = await resumeState.execute(
        {},
        { messages: [], toolCallId: "t3" },
      );

      expect(result).toEqual({ found: false, state: null });
      expect(storage._retrieve).not.toHaveBeenCalled();
    });

    it("calls _retrieve with the latest pieceCid when one exists", async () => {
      vi.mocked(storage.getLatestPieceCid).mockReturnValue("bafy_latest");
      vi.mocked(storage._retrieve).mockResolvedValue(
        JSON.stringify({ state: { counter: 5 }, trigger: "shutdown" }),
      );
      const { resumeState } = createAgentStorageTools(storage);

      await resumeState.execute({}, { messages: [], toolCallId: "t4" });

      expect(storage._retrieve).toHaveBeenCalledWith("bafy_latest");
    });

    it("returns found: true and the state from the checkpoint", async () => {
      vi.mocked(storage.getLatestPieceCid).mockReturnValue("bafy_latest");
      vi.mocked(storage._retrieve).mockResolvedValue(
        JSON.stringify({ state: { counter: 42 }, trigger: "task_complete" }),
      );
      const { resumeState } = createAgentStorageTools(storage);

      const result = await resumeState.execute(
        {},
        { messages: [], toolCallId: "t5" },
      );

      expect(result).toEqual({ found: true, state: { counter: 42 } });
    });
  });

  // -------------------------------------------------------------------------
  // logAction
  // -------------------------------------------------------------------------

  describe("logAction", () => {
    it("calls _store with a timestamped event", async () => {
      vi.mocked(storage._store).mockResolvedValue("bafy_log");
      const { logAction } = createAgentStorageTools(storage);

      await logAction.execute(
        { event: { action: "web_search", query: "climate change" } },
        { messages: [], toolCallId: "t6" },
      );

      expect(storage._store).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "web_search",
          query: "climate change",
          timestamp: expect.any(String),
        }),
      );
    });

    it("returns logged: true on success", async () => {
      vi.mocked(storage._store).mockResolvedValue("bafy_log");
      const { logAction } = createAgentStorageTools(storage);

      const result = await logAction.execute(
        { event: { action: "noop" } },
        { messages: [], toolCallId: "t7" },
      );

      expect(result).toEqual({ logged: true });
    });
  });

  // -------------------------------------------------------------------------
  // checkHealth
  // -------------------------------------------------------------------------

  describe("checkHealth", () => {
    it("returns hasCheckpoint: false when no checkpoint exists", async () => {
      vi.mocked(storage.getLatestPieceCid).mockReturnValue(null);
      const { checkHealth } = createAgentStorageTools(storage);

      const result = await checkHealth.execute(
        {},
        { messages: [], toolCallId: "t8" },
      );

      expect(result).toEqual({ hasCheckpoint: false, latestPieceCid: null });
    });

    it("returns hasCheckpoint: true and the pieceCid when one exists", async () => {
      vi.mocked(storage.getLatestPieceCid).mockReturnValue("bafy_health");
      const { checkHealth } = createAgentStorageTools(storage);

      const result = await checkHealth.execute(
        {},
        { messages: [], toolCallId: "t9" },
      );

      expect(result).toEqual({
        hasCheckpoint: true,
        latestPieceCid: "bafy_health",
      });
    });
  });
});
