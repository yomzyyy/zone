import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerDisplay } from "@/modules/timer/components/timer-display";

describe("TimerDisplay", () => {
  it("shows elapsed time in stopwatch mode", () => {
    render(<TimerDisplay elapsed={3661000} remaining={0} mode="stopwatch" />);
    expect(screen.getByText("01:01:01")).toBeInTheDocument();
  });

  it("shows remaining time in pomodoro mode", () => {
    render(
      <TimerDisplay elapsed={60000} remaining={1440000} mode="pomodoro" />
    );
    // 1440000ms = 24 minutes remaining
    expect(screen.getByText("00:24:00")).toBeInTheDocument();
  });

  it("shows 00:00:00 when idle", () => {
    render(<TimerDisplay elapsed={0} remaining={0} mode="stopwatch" />);
    expect(screen.getByText("00:00:00")).toBeInTheDocument();
  });
});
