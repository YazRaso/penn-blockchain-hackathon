import assert from "node:assert/strict";

import AgentStorage, { type AgentStorageConfig } from "../../src/AgentStorage.ts";
import { CheckpointPolicy } from "../../src/policy.ts";

async function main() {
  const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.PRIVATE_KEY!;

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
      name: "integration-test-agent",
      description: "Agent used for integration testing of storage primitives",
    },
  };

  const storage = await AgentStorage.create(config);

  const inputData =
    "This is an integration test payload for AgentStorage primitives. " +
    "It intentionally exceeds one hundred and twenty-seven bytes so Synapse upload requirements are satisfied.";

  // Test checkpoint round-trip via the public CheckpointStore API
  const policy = new CheckpointPolicy(config.checkpointPolicy);
  policy.validate("task_complete"); // ensure policy is wired correctly

  const pieceCid = await storage.checkpoints.save(
    { payload: inputData },
    { trigger: "task_complete" },
  );
  assert.ok(pieceCid, "Expected a pieceCid from checkpoints.save()");

  const recovered = await storage.checkpoints.latest();
  assert.ok(recovered, "Expected recovered state to be non-null");
  assert.equal(recovered.payload, inputData, "Recovered payload should match input");
}

await main();
