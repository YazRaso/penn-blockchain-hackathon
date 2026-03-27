import { describe, it, expect, beforeEach } from "vitest";
import { CheckpointPolicy } from "@sdk/policy";
import { PolicyViolationError, UnknownTriggerError } from "@sdk/errors";

describe("CheckpointPolicy", () => {
  describe("constructor", () => {
    it("throws PolicyViolationError when config.after is empty", () => {
      expect(() => new CheckpointPolicy({ after: [] })).toThrow(
        PolicyViolationError
      );
    });

    it("throws PolicyViolationError when config.after is missing", () => {
      expect(() => new CheckpointPolicy({ after: undefined as any })).toThrow(
        PolicyViolationError
      );
    });

    it("always includes default triggers regardless of config.after", () => {
      const policy = new CheckpointPolicy({ after: ["my_event"] });
      // Default triggers must not throw
      expect(() => policy.validate("task_complete")).not.toThrow();
      expect(() => policy.validate("payment")).not.toThrow();
    });

    it("merges config.after and config.custom with defaults", () => {
      const policy = new CheckpointPolicy({
        after: ["my_event"],
        custom: ["custom_event"],
      });
      expect(() => policy.validate("my_event")).not.toThrow();
      expect(() => policy.validate("custom_event")).not.toThrow();
      expect(() => policy.validate("task_complete")).not.toThrow();
      expect(() => policy.validate("payment")).not.toThrow();
    });
  });

  describe("validate()", () => {
    let policy: CheckpointPolicy;

    beforeEach(() => {
      policy = new CheckpointPolicy({ after: ["my_event"] });
    });

    it("passes for a trigger declared in config.after", () => {
      expect(() => policy.validate("my_event")).not.toThrow();
    });

    it("passes for default triggers even if not in config.after", () => {
      expect(() => policy.validate("task_complete")).not.toThrow();
      expect(() => policy.validate("payment")).not.toThrow();
    });

    it("throws UnknownTriggerError for an unknown trigger", () => {
      expect(() => policy.validate("unknown_trigger")).toThrow(
        UnknownTriggerError
      );
    });

    it("includes the unknown trigger name in the error message", () => {
      expect(() => policy.validate("ghost")).toThrowError(
        /Unknown checkpoint trigger 'ghost'/
      );
    });

    it("lists all registered triggers in the error message", () => {
      try {
        policy.validate("ghost");
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(UnknownTriggerError);
        expect((e as Error).message).toContain("task_complete");
        expect((e as Error).message).toContain("payment");
        expect((e as Error).message).toContain("my_event");
      }
    });
  });

  describe("shouldCheckpointOnCount()", () => {
    it("returns false for the first N-1 calls", () => {
      const policy = new CheckpointPolicy({ after: ["e"], every: 5 });
      for (let i = 0; i < 4; i++) {
        expect(policy.shouldCheckpointOnCount()).toBe(false);
      }
    });

    it("returns true on the Nth call and resets the counter", () => {
      const policy = new CheckpointPolicy({ after: ["e"], every: 5 });
      for (let i = 0; i < 4; i++) policy.shouldCheckpointOnCount();
      expect(policy.shouldCheckpointOnCount()).toBe(true);
    });

    it("resets the counter after triggering so it fires every N calls", () => {
      const policy = new CheckpointPolicy({ after: ["e"], every: 3 });
      // First cycle
      expect(policy.shouldCheckpointOnCount()).toBe(false); // 1
      expect(policy.shouldCheckpointOnCount()).toBe(false); // 2
      expect(policy.shouldCheckpointOnCount()).toBe(true);  // 3 — fires
      // Second cycle
      expect(policy.shouldCheckpointOnCount()).toBe(false); // 1
      expect(policy.shouldCheckpointOnCount()).toBe(false); // 2
      expect(policy.shouldCheckpointOnCount()).toBe(true);  // 3 — fires again
    });

    it("defaults everyN to 10 when config.every is not provided", () => {
      const policy = new CheckpointPolicy({ after: ["e"] });
      for (let i = 0; i < 9; i++) {
        expect(policy.shouldCheckpointOnCount()).toBe(false);
      }
      expect(policy.shouldCheckpointOnCount()).toBe(true);
    });
  });
});
