import type { LogEntry } from "@sdk/types.js";
import { AgentStorageError } from "@sdk/errors.js";

interface LogStoreDeps {
  store: (data: unknown) => Promise<string>;
  flushThreshold: number;
}

/**
 * Buffers tool call log entries in memory and flushes them to Filecoin in batches.
 *
 * Logs are human-facing audit trails — agents write to them but never read from them.
 * Buffered entries are lost on crash; always call `flush()` before agent shutdown.
 */
export class LogStore {
  private buffer: LogEntry[] = [];

  /**
   * Creates a log store with batch upload behavior.
   *
   * @param deps Store dependency and flush threshold configuration.
   */
  constructor(private deps: LogStoreDeps) {}

  /**
   * Appends a timestamped entry to the in-memory buffer.
   * Automatically flushes to Filecoin when the buffer reaches `flushThreshold`.
   */
  async append(event: Record<string, unknown>): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.buffer.push(entry);

    if (this.buffer.length >= this.deps.flushThreshold) {
      await this.flush();
    }
  }

  /**
   * Uploads the entire buffer as a single batch to Filecoin and clears it.
   * Returns the pieceCid of the uploaded batch, or `null` if the buffer was empty.
   */
  async flush(): Promise<string | null> {
    if (this.buffer.length === 0) return null;

    const batch = {
      flushed_at: new Date().toISOString(),
      count: this.buffer.length,
      entries: this.buffer,
    };

    let pieceCid: string;
    try {
      pieceCid = await this.deps.store(batch);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new AgentStorageError(`Failed to flush log batch: ${msg}`);
    }

    this.buffer = [];
    return pieceCid;
  }

  /**
   * Returns a copy of the current in-memory buffer without mutating it.
   */
  async all(): Promise<LogEntry[]> {
    return [...this.buffer];
  }

  /**
   * Returns the number of entries currently buffered.
   */
  bufferSize(): number {
    return this.buffer.length;
  }
}
