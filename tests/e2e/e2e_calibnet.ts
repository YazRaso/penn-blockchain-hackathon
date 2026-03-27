/**
 * E2E test script — calibnet live network test
 * Tests the full AgentStorage SDK flow against the real calibnet network.
 * Usage: make run FILE=tests/e2e/e2e_calibnet.ts
 *
 * Requires: AGENT_PRIVATE_KEY or PRIVATE_KEY env var (or .env file in project root)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env manually (no dotenv dependency assumed)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

import { Synapse } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";
import AgentStorage, { type AgentStorageConfig } from "../../src/AgentStorage.ts";

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

interface StepResult {
  step: number;
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  output?: string;
  error?: string;
  latencyMs?: number;
}

const results: StepResult[] = [];

function record(result: StepResult) {
  results.push(result);
  const icon = result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⏭️ ";
  console.log(`${icon} Step ${result.step}: ${result.name} [${result.status}]`);
  if (result.output) console.log(`   Output: ${result.output}`);
  if (result.error)  console.log(`   Error:  ${result.error}`);
  if (result.latencyMs !== undefined) console.log(`   Latency: ${result.latencyMs}ms`);
}

async function time<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const t0 = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - t0 };
}

// ---------------------------------------------------------------------------
// Test state shared between steps
// ---------------------------------------------------------------------------

let storage: AgentStorage | null = null;
let savedPieceCid: string | null = null;
let tokenId: bigint | undefined = undefined;

// ---------------------------------------------------------------------------
// Step 1: Initialize AgentStorage
// ---------------------------------------------------------------------------

const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
if (!privateKey) {
  record({ step: 1, name: "Initialize AgentStorage", status: "FAIL", error: "No private key in env (AGENT_PRIVATE_KEY / PRIVATE_KEY)" });
  process.exit(1);
}

const config: AgentStorageConfig = {
  privateKey,
  wallet: {
    lowBudgetThreshold: 0n,
  },
  checkpointPolicy: {
    after: ["task_complete"],
    every: 10,
  },
  identity: {
    name: "e2e-test-agent",
    description: "E2E test agent for calibnet SDK verification",
  },
};

try {
  const t0 = Date.now();
  storage = await AgentStorage.create(config);
  const ms = Date.now() - t0;
  // Try to get token id for restart simulation
  tokenId = storage.identity.getTokenId() ?? undefined;
  record({
    step: 1,
    name: "Initialize AgentStorage",
    status: "PASS",
    output: `AgentStorage created. tokenId=${tokenId ?? "none"}, latestPieceCid=${storage.getLatestPieceCid() ?? "null (first run)"}`,
    latencyMs: ms,
  });
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 1, name: "Initialize AgentStorage", status: "FAIL", error: msg });
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2: Verify wallet balance via budget()
// ---------------------------------------------------------------------------

try {
  // AgentStorage.budget() may not be implemented — check first
  if (typeof (storage as any).budget === "function") {
    const { result: balance, ms } = await time(() => (storage as any).budget());
    record({
      step: 2,
      name: "Wallet balance via budget()",
      status: "PASS",
      output: `balance = ${balance}`,
      latencyMs: ms,
    });
  } else {
    // Fallback: call wallet.getBalance() directly
    const { result: balance, ms } = await time(() => storage!.wallet.getBalance());
    record({
      step: 2,
      name: "Wallet balance via budget()",
      status: "FAIL",
      error: `storage.budget() is not implemented. Fell back to storage.wallet.getBalance() = ${balance}`,
      latencyMs: ms,
    });
  }
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 2, name: "Wallet balance via budget()", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 3: Save a checkpoint with trigger 'task_complete'
// ---------------------------------------------------------------------------

const testState = {
  task: "e2e-calibnet-verification",
  iteration: 1,
  timestamp: new Date().toISOString(),
  payload: "This is a test payload for the E2E calibnet verification run. It contains enough data to satisfy upload requirements.",
};

try {
  const { result: pieceCid, ms } = await time(() =>
    storage!.checkpoints.save(testState, { trigger: "task_complete" })
  );
  savedPieceCid = pieceCid;
  record({
    step: 3,
    name: "Save checkpoint (trigger: task_complete)",
    status: "PASS",
    output: `pieceCid = ${pieceCid}`,
    latencyMs: ms,
  });
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 3, name: "Save checkpoint (trigger: task_complete)", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 4: Retrieve the latest checkpoint and verify state matches
// ---------------------------------------------------------------------------

try {
  const { result: recovered, ms } = await time(() => storage!.checkpoints.latest());
  if (recovered === null) {
    record({ step: 4, name: "Retrieve latest checkpoint", status: "FAIL", error: "latest() returned null after save", latencyMs: ms });
  } else {
    const matches = recovered.task === testState.task && recovered.iteration === testState.iteration;
    record({
      step: 4,
      name: "Retrieve latest checkpoint",
      status: matches ? "PASS" : "FAIL",
      output: `recovered.task="${recovered.task}", recovered.iteration=${recovered.iteration}, matches=${matches}`,
      latencyMs: ms,
    });
  }
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 4, name: "Retrieve latest checkpoint", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 5: Append three log entries and verify bufferSize()
// ---------------------------------------------------------------------------

try {
  await storage!.logs.append({ action: "tool_call", tool: "search", query: "filecoin docs" });
  await storage!.logs.append({ action: "tool_call", tool: "write", file: "output.txt" });
  await storage!.logs.append({ action: "tool_call", tool: "read",  file: "config.json" });

  const size = storage!.logs.bufferSize();
  record({
    step: 5,
    name: "Append 3 log entries + verify bufferSize()",
    status: size === 3 ? "PASS" : "FAIL",
    output: `bufferSize() = ${size} (expected 3)`,
  });
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 5, name: "Append 3 log entries + verify bufferSize()", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 6: Flush the log buffer
// ---------------------------------------------------------------------------

try {
  const { result: flushPieceCid, ms } = await time(() => storage!.logs.flush());
  record({
    step: 6,
    name: "Flush log buffer",
    status: flushPieceCid !== null ? "PASS" : "FAIL",
    output: `flushPieceCid = ${flushPieceCid ?? "null"}`,
    latencyMs: ms,
  });
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 6, name: "Flush log buffer", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 7: Call health() and verify all three components report healthy
// ---------------------------------------------------------------------------

try {
  if (typeof (storage as any).health === "function") {
    const { result: report, ms } = await time(() => (storage as any).health());
    const walletHealthy = report?.wallet?.healthy === true;
    const checkpointsHealthy = report?.checkpoints?.healthy === true;
    const logsHealthy = report?.logs?.healthy === true;
    const allHealthy = walletHealthy && checkpointsHealthy && logsHealthy;
    record({
      step: 7,
      name: "health() — all three components healthy",
      status: allHealthy ? "PASS" : "FAIL",
      output: JSON.stringify(report, (_, v) => typeof v === "bigint" ? v.toString() : v),
      latencyMs: ms,
    });
  } else {
    record({
      step: 7,
      name: "health() — all three components healthy",
      status: "FAIL",
      error: "storage.health() is not implemented on AgentStorage",
    });
  }
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 7, name: "health() — all three components healthy", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Step 8: Simulate restart — create new instance, verify checkpoint restored
// ---------------------------------------------------------------------------

try {
  const restartConfig: AgentStorageConfig = {
    ...config,
    existingTokenId: tokenId,
  };

  const { result: storage2, ms: initMs } = await time(() => AgentStorage.create(restartConfig));
  const restoredPieceCid = storage2.getLatestPieceCid();

  if (restoredPieceCid === null) {
    record({
      step: 8,
      name: "Restart simulation — latest checkpoint restored",
      status: "FAIL",
      error: `getLatestPieceCid() returned null after restart. Expected: ${savedPieceCid}`,
      latencyMs: initMs,
    });
  } else {
    const { result: restoredState, ms: retrieveMs } = await time(() => storage2.checkpoints.latest());

    const matches = restoredState?.task === testState.task;
    record({
      step: 8,
      name: "Restart simulation — latest checkpoint restored",
      status: matches ? "PASS" : "FAIL",
      output: `restoredPieceCid=${restoredPieceCid}, savedPieceCid=${savedPieceCid}, matches=${matches}`,
      latencyMs: initMs + retrieveMs,
    });
  }
} catch (e: unknown) {
  const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
  record({ step: 8, name: "Restart simulation — latest checkpoint restored", status: "FAIL", error: msg });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const passed = results.filter(r => r.status === "PASS").length;
const failed = results.filter(r => r.status === "FAIL").length;
const skipped = results.filter(r => r.status === "SKIP").length;

console.log("\n=== SUMMARY ===");
console.log(`Passed: ${passed} / ${results.length}   Failed: ${failed}   Skipped: ${skipped}`);
console.log(failed === 0 ? "✅ ALL STEPS PASSED" : `❌ ${failed} STEP(S) FAILED`);
