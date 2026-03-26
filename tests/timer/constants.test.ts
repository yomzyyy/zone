import { describe, it, expect } from "vitest";
import { DEFAULT_TIMER_SETTINGS, STORAGE_KEYS } from "@/modules/timer/constants";

// ============================================================
// Constants — make sure defaults are sane
// ============================================================
describe("DEFAULT_TIMER_SETTINGS", () => {
  it("defaults to stopwatch mode", () => {
    expect(DEFAULT_TIMER_SETTINGS.mode).toBe("stopwatch");
  });

  it("has 25 minute focus duration", () => {
    expect(DEFAULT_TIMER_SETTINGS.focusDuration).toBe(25);
  });

  it("has 5 minute break duration", () => {
    expect(DEFAULT_TIMER_SETTINGS.breakDuration).toBe(5);
  });

  it("has 15 minute long break duration", () => {
    expect(DEFAULT_TIMER_SETTINGS.longBreakDuration).toBe(15);
  });

  it("triggers long break after 4 sessions", () => {
    expect(DEFAULT_TIMER_SETTINGS.sessionsUntilLongBreak).toBe(4);
  });

  it("has sound enabled by default", () => {
    expect(DEFAULT_TIMER_SETTINGS.soundEnabled).toBe(true);
  });
});

describe("STORAGE_KEYS", () => {
  it("has unique keys for each storage item", () => {
    const keys = Object.values(STORAGE_KEYS);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length); // no duplicates
  });

  it("all keys start with 'zone-' prefix", () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(key).toMatch(/^zone-/);
    });
  });
});
