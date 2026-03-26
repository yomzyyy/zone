import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimerControls } from "@/modules/timer/components/timer-controls";

// vi.fn() creates a mock function — it records if/when it was called
// so we can verify button clicks trigger the right callbacks.
const defaultProps = {
  timerState: "idle" as const,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onReset: vi.fn(),
  onSkipBreak: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe("TimerControls", () => {
  it("shows Start button when idle", () => {
    render(<TimerControls {...defaultProps} />);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("calls onStart when Start is clicked", () => {
    const onStart = vi.fn();
    render(<TimerControls {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText("Start"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("shows Pause button when running", () => {
    render(<TimerControls {...defaultProps} timerState="running" />);
    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows Resume and Stop when paused", () => {
    render(<TimerControls {...defaultProps} timerState="paused" />);
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("shows Reset when paused", () => {
    render(<TimerControls {...defaultProps} timerState="paused" />);
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("shows Reset when completed", () => {
    render(<TimerControls {...defaultProps} timerState="completed" />);
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("shows Skip Break during break state", () => {
    render(
      <TimerControls {...defaultProps} timerState="break" />
    );
    expect(screen.getByText("Skip Break")).toBeInTheDocument();
  });

  it("disables settings when timer is running", () => {
    render(<TimerControls {...defaultProps} timerState="running" />);
    // Settings button is the one with just an icon, no text
    const buttons = screen.getAllByRole("button");
    const settingsButton = buttons.find((btn) => btn.hasAttribute("disabled"));
    expect(settingsButton).toBeTruthy();
  });

  it("settings button is enabled when idle", () => {
    render(<TimerControls {...defaultProps} timerState="idle" />);
    const buttons = screen.getAllByRole("button");
    const disabledButtons = buttons.filter((btn) =>
      btn.hasAttribute("disabled")
    );
    expect(disabledButtons).toHaveLength(0);
  });
});
