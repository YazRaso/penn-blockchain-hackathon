import { UnknownTriggerError, PolicyViolationError } from "@sdk/errors.js";
import type { CheckpointPolicyConfig } from "@sdk/types.js";

const DEFAULT_TRIGGERS = ["task_complete", "payment"];

/**
 * Validates checkpoint triggers at save time and provides a count-based
 * fallback trigger for periodic checkpointing.
 *
 * @throws {PolicyViolationError} if constructed with an empty `after` array.
 */
export class CheckpointPolicy {
  private readonly triggers: Set<string>;
  private callCount: number = 0;
  private readonly everyN: number;

  /**
   * Creates a checkpoint trigger policy.
   *
   * @param config Declares allowed trigger names and optional count cadence.
   */
  constructor(config: CheckpointPolicyConfig) {
    if (!config.after || config.after.length === 0) {
      throw new PolicyViolationError(
        `checkpointPolicy.after must have at least one trigger. ` +
          `Default triggers are: ['task_complete', 'payment'].`
      );
    }

    this.triggers = new Set([
      ...DEFAULT_TRIGGERS,
      ...config.after,
      ...(config.custom ?? []),
    ]);
    this.everyN = config.every ?? 10;
  }

  /**
   * Assert that `trigger` was declared at init time.
   *
   * @throws {UnknownTriggerError} if `trigger` is not a registered trigger.
   */
  validate(trigger: string): void {
    if (!this.triggers.has(trigger)) {
      throw new UnknownTriggerError(
        `Unknown checkpoint trigger '${trigger}'. ` +
          `Registered triggers: [${[...this.triggers]
            .map((t) => `'${t}'`)
            .join(", ")}]. ` +
          `Add it to checkpointPolicy.after if intentional.`
      );
    }
  }

  /**
   * Increment an internal counter and return `true` every `everyN` calls,
   * resetting the counter on each trigger.
   *
   * This is a count-based fallback that fires independently of named events.
   */
  shouldCheckpointOnCount(): boolean {
    this.callCount++;
    if (this.callCount >= this.everyN) {
      this.callCount = 0;
      return true;
    }
    return false;
  }
}
