import { tool } from "ai";
import { z } from "zod";
import type AgentStorage from "@sdk/AgentStorage.js";

/**
 * Creates a set of Vercel AI SDK tools that expose `AgentStorage` capabilities
 * to AI agents.
 *
 * Agents call these tools to persist state, restore previous runs, log actions,
 * and verify storage health — all without touching the SDK internals.
 *
 * @param storage - A configured `AgentStorage` instance.
 * @returns An object containing four tools: `checkpoint`, `resumeState`,
 *   `logAction`, and `checkHealth`.
 *
 * @example
 * ```typescript
 * const storage = await AgentStorage.create(config);
 * const tools = createAgentStorageTools(storage);
 *
 * // Pass to generateText / streamText
 * const result = await generateText({ model, tools, prompt });
 * ```
 */
export function createAgentStorageTools(storage: AgentStorage) {
  return {
    /**
     * Save the current agent state as a checkpoint on Filecoin.
     * Call this after completing significant work so it can be recovered on restart.
     */
    checkpoint: tool({
      description:
        "Save the current agent state as a checkpoint to Filecoin. " +
        "Call this after completing significant work to ensure it can be recovered after a crash or restart. " +
        "Provide the full world state and a short name for the event that triggered this save.",
      parameters: z.object({
        state: z.record(z.unknown()).describe(
          "The agent world state to persist. Include all data needed to resume work.",
        ),
        trigger: z.string().describe(
          "Short name for the event that caused this checkpoint (e.g. 'task_complete', 'tool_call').",
        ),
      }),
      execute: async ({ state, trigger }) => {
        const pieceCid = await storage.checkpoints.save(state, { trigger });
        return { pieceCid };
      },
    }),

    /**
     * Retrieve the most recent checkpoint state from Filecoin.
     * Call this on startup to restore the previous world state.
     */
    resumeState: tool({
      description:
        "Retrieve the most recent checkpoint state from Filecoin. " +
        "Call this on startup to check whether a previous run exists and restore its world state. " +
        "Returns found: false if no checkpoint has been saved yet.",
      parameters: z.object({}),
      execute: async () => {
        const state = await storage.checkpoints.latest();
        return { found: state !== null, state };
      },
    }),

    /**
     * Append a tool call or event to the append-only audit log on Filecoin.
     * Use this after every significant action to maintain a tamper-proof audit trail.
     */
    logAction: tool({
      description:
        "Append a tool call or event to the audit log stored on Filecoin. " +
        "Use this after every significant action to maintain a tamper-proof record. " +
        "Include the action name, inputs, and outputs in the event object.",
      parameters: z.object({
        event: z.record(z.unknown()).describe(
          "Event data to log. Should include action name, inputs, and outputs.",
        ),
      }),
      execute: async ({ event }) => {
        await storage.logs.append(event);
        return { logged: true };
      },
    }),

    /**
     * Check the storage health and return the latest checkpoint pointer.
     * Use this to verify the SDK is connected and operating correctly.
     */
    checkHealth: tool({
      description:
        "Check the storage health and return the latest checkpoint pointer. " +
        "Use this to verify the SDK is connected and that previous checkpoints are accessible.",
      parameters: z.object({}),
      execute: async () => {
        const latestPieceCid = storage.getLatestPieceCid();
        return {
          hasCheckpoint: latestPieceCid !== null,
          latestPieceCid,
        };
      },
    }),
  };
}
