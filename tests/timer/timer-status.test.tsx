import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimerStatus } from "@/modules/timer/components/timer-status";

describe("TimerStatus", () => {
  it("shows 'Ready to enter the zone' when idle", () => {
    render(<TimerStatus timerState="idle" elapsed={0} currentCycle={1} />);
    expect(screen.getByText("Ready to enter the zone")).toBeInTheDocument();
  });

  it("shows 'You're in the zone' when running", () => {
    render(<TimerStatus timerState="running" elapsed={5000} currentCycle={1} />);
    expect(screen.getByText("You're in the zone")).toBeInTheDocument();
  });

  it("shows 'Paused' when paused", () => {
    render(<TimerStatus timerState="paused" elapsed={5000} currentCycle={1} />);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("shows break message with cycle number", () => {
    render(<TimerStatus timerState="break" elapsed={0} currentCycle={3} />);
    expect(screen.getByText("Break time — cycle 2 complete")).toBeInTheDocument();
  });

  it("shows completion message with duration", () => {
    render(
      <TimerStatus timerState="completed" elapsed={4980000} currentCycle={1} />
    );
    expect(screen.getByText("Zone session complete — 1h 23m")).toBeInTheDocument();
  });
});
