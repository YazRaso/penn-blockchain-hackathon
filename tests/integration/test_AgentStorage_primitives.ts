import assert from "node:assert/strict";

import AgentStorage from "../../src/AgentStorage.ts";
import type { CheckpointPolicy } from "../../src/types.ts";

async function main() {
  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.PRIVATE_KEY!;

  const checkpointPolicy: CheckpointPolicy = {
    after: ["task_complete"],
    every: 10,
  };

  const storage = await AgentStorage.create(privateKey, null, checkpointPolicy);

  const inputData =
    "This is an integration test payload for AgentStorage primitives. " +
    "It intentionally exceeds one hundred and twenty-seven bytes so Synapse upload requirements are satisfied.";

  const pieceCid = await (storage as any)._store(inputData);
  const retrievedRaw = await (storage as any)._retrieve(pieceCid);
  const retrievedData = JSON.parse(retrievedRaw);

  assert.equal(retrievedData, inputData);
}

await main();
