import { describe, it, expect } from "vitest";
import { formatTime, formatDuration, minutesToMs } from "@/modules/timer/utils";

// ============================================================
// formatTime — converts milliseconds to "HH:MM:SS"
// ============================================================
describe("formatTime", () => {
  it("shows 00:00:00 for zero", () => {
    expect(formatTime(0)).toBe("00:00:00");
  });

  it("formats seconds correctly", () => {
    expect(formatTime(5000)).toBe("00:00:05"); // 5 seconds
  });

  it("formats minutes and seconds", () => {
    expect(formatTime(65000)).toBe("00:01:05"); // 1 min 5 sec
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatTime(3661000)).toBe("01:01:01"); // 1h 1m 1s
  });

  it("pads single digits with leading zeros", () => {
    expect(formatTime(1000)).toBe("00:00:01");
    expect(formatTime(60000)).toBe("00:01:00");
    expect(formatTime(3600000)).toBe("01:00:00");
  });

  it("handles large values", () => {
    expect(formatTime(86399000)).toBe("23:59:59"); // 23h 59m 59s
  });

  it("treats negative values as zero", () => {
    expect(formatTime(-5000)).toBe("00:00:00");
  });

  it("ignores sub-second precision (floors to seconds)", () => {
    expect(formatTime(1500)).toBe("00:00:01"); // 1.5s → shows 1s
    expect(formatTime(999)).toBe("00:00:00");  // 999ms → shows 0s
  });
});

// ============================================================
// formatDuration — converts milliseconds to "Xh Ym" or "Ym"
// ============================================================
describe("formatDuration", () => {
  it("shows minutes only when under 1 hour", () => {
    expect(formatDuration(300000)).toBe("5m"); // 5 minutes
  });

  it("shows hours and minutes for longer durations", () => {
    expect(formatDuration(4980000)).toBe("1h 23m");
  });

  it("shows 0m for zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("shows hours with 0 minutes", () => {
    expect(formatDuration(7200000)).toBe("2h 0m"); // exactly 2 hours
  });
});

// ============================================================
// minutesToMs — converts minutes to milliseconds
// ============================================================
describe("minutesToMs", () => {
  it("converts 1 minute to 60000ms", () => {
    expect(minutesToMs(1)).toBe(60000);
  });

  it("converts 25 minutes to 1500000ms", () => {
    expect(minutesToMs(25)).toBe(1500000);
  });

  it("converts 0 minutes to 0ms", () => {
    expect(minutesToMs(0)).toBe(0);
  });
});
