import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogStore } from "../../../../src/storage/LogStore.ts";

describe("LogStore", () => {
  let store: ReturnType<typeof vi.fn>;
  let logStore: LogStore;

  beforeEach(() => {
    store = vi.fn().mockResolvedValue("bafy123");
    logStore = new LogStore({ store, flushThreshold: 3 });
  });

  it("append() adds entry to buffer with correct timestamp", async () => {
    const before = new Date().toISOString();
    await logStore.append({ tool: "search", query: "hello" });
    const after = new Date().toISOString();

    const entries = await logStore.all();
    expect(entries).toHaveLength(1);
    expect(entries[0].tool).toBe("search");
    expect(entries[0].query).toBe("hello");
    expect(entries[0].timestamp >= before).toBe(true);
    expect(entries[0].timestamp <= after).toBe(true);
  });

  it("append() does not flush when buffer is below threshold", async () => {
    await logStore.append({ tool: "a" });
    await logStore.append({ tool: "b" });

    expect(store).not.toHaveBeenCalled();
    expect(logStore.bufferSize()).toBe(2);
  });

  it("append() automatically flushes when buffer reaches threshold", async () => {
    await logStore.append({ tool: "a" });
    await logStore.append({ tool: "b" });
    await logStore.append({ tool: "c" }); // threshold = 3

    expect(store).toHaveBeenCalledOnce();
    expect(logStore.bufferSize()).toBe(0);
  });

  it("flush() calls store with correct batch structure", async () => {
    await logStore.append({ tool: "x" });
    await logStore.append({ tool: "y" });

    const pieceCid = await logStore.flush();

    expect(pieceCid).toBe("bafy123");
    expect(store).toHaveBeenCalledOnce();

    const batch = store.mock.calls[0][0] as Record<string, unknown>;
    expect(batch.count).toBe(2);
    expect(Array.isArray(batch.entries)).toBe(true);
    expect((batch.entries as unknown[]).length).toBe(2);
    expect(typeof batch.flushed_at).toBe("string");
  });

  it("flush() clears buffer after successful flush", async () => {
    await logStore.append({ tool: "x" });
    expect(logStore.bufferSize()).toBe(1);

    await logStore.flush();
    expect(logStore.bufferSize()).toBe(0);
  });

  it("flush() returns null when buffer is empty", async () => {
    const result = await logStore.flush();
    expect(result).toBeNull();
    expect(store).not.toHaveBeenCalled();
  });

  it("all() returns copy of buffer without mutating it", async () => {
    await logStore.append({ tool: "a" });
    await logStore.append({ tool: "b" });

    const snapshot = await logStore.all();
    snapshot.push({ timestamp: "fake", tool: "injected" });

    expect(logStore.bufferSize()).toBe(2);
  });

  it("bufferSize() returns correct count", async () => {
    expect(logStore.bufferSize()).toBe(0);
    await logStore.append({ tool: "a" });
    expect(logStore.bufferSize()).toBe(1);
    await logStore.append({ tool: "b" });
    expect(logStore.bufferSize()).toBe(2);
  });
});
