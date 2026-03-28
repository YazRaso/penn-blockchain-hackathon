---
sidebar_position: 1
---

# Getting Started

This guide gets you from zero to a working `AgentStorage` run on calibnet.

## Prerequisites

- Node.js 20+
- A funded wallet private key for storage operations (USDFC on Base Sepolia / calibnet flow)
- Project dependencies installed

## Install dependencies

From the project root:

```bash
npm install
```

For docs-only workflows:

```bash
make docs-setup
```

## Configure environment

Create a `.env` file in the project root:

```env
AGENT_PRIVATE_KEY=<your_private_key_without_0x>
```

`PRIVATE_KEY` also works as a fallback.

## Initialize `AgentStorage`

Create a script (for example `examples/quickstart.ts`) and initialize the SDK:

```ts
import AgentStorage, { type AgentStorageConfig } from "../src/AgentStorage.ts";

const privateKeyRaw = process.env.AGENT_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
if (!privateKeyRaw) throw new Error("Missing AGENT_PRIVATE_KEY / PRIVATE_KEY");

const privateKey = privateKeyRaw.startsWith("0x")
	? privateKeyRaw.slice(2)
	: privateKeyRaw;

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
		name: "quickstart-agent",
		description: "Quickstart agent identity",
	},
};

const storage = await AgentStorage.create(config);
console.log("tokenId:", storage.identity.getTokenId()?.toString() ?? "null");
console.log("latestPieceCid:", storage.getLatestPieceCid() ?? "null");
```

## Save and restore state

After initialization, checkpoints and logs are the core workflow:

```ts
// Save resumable world state
const pieceCid = await storage.checkpoints.save(
	{
		task: "first-run",
		status: "task_complete",
		savedAt: new Date().toISOString(),
	},
	{ trigger: "task_complete" },
);

// Restore latest state
const latest = await storage.checkpoints.latest();

// Append + flush audit logs
await storage.logs.append({ action: "tool_call", tool: "search", query: "filecoin docs" });
await storage.logs.append({ action: "tool_call", tool: "write", file: "result.md" });
const logBatchPieceCid = await storage.logs.flush();

console.log({ pieceCid, latest, logBatchPieceCid });
```

## Run examples

Use the Make target to run TypeScript examples:

```bash
make run FILE=examples/hello_world.ts
```

For a full end-to-end usage flow, see [Examples](./examples/index.md).
