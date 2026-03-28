---
sidebar_position: 3
---

# Vercel AI Adapter

Use `createAgentStorageTools()` to expose SDK capabilities as AI tools.

## What this adapter gives you

- `checkpoint`: save world state to Filecoin
- `resumeState`: restore latest saved state
- `logAction`: append audit events
- `checkHealth`: return checkpoint availability

## Example usage

```ts
import { generateText } from "ai";
import AgentStorage from "../src/AgentStorage.ts";
import { createAgentStorageTools } from "../src/adapters/vercel-ai.ts";

const storage = await AgentStorage.create({
  privateKey: process.env.AGENT_PRIVATE_KEY!,
  wallet: { lowBudgetThreshold: 0n },
  checkpointPolicy: { after: ["task_complete"], every: 10 },
  identity: {
    name: "vercel-ai-agent",
    description: "Agent with persistent memory + audit trail",
  },
});

const tools = createAgentStorageTools(storage);

const result = await generateText({
  model: /* your provider model */,
  prompt: "Plan my next deploy steps and save state when complete.",
  tools,
});

console.log(result.text);
```
