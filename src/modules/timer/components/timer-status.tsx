import type { TimerState } from "../types";
import { formatDuration } from "../utils";

interface TimerStatusProps {
  timerState: TimerState;
  elapsed: number;
  currentCycle: number;
}

export function TimerStatus({
  timerState,
  elapsed,
  currentCycle,
}: TimerStatusProps) {
  const getMessage = (): string => {
    switch (timerState) {
      case "idle":
        return "Ready to enter the zone";
      case "running":
        return "You're in the zone";
      case "paused":
        return "Paused";
      case "break":
        return `Break time — cycle ${currentCycle - 1} complete`;
      case "completed":
        return `Zone session complete — ${formatDuration(elapsed)}`;
      default:
        return "";
    }
  };

  return (
    <p className="text-lg text-muted-foreground">{getMessage()}</p>
  );
}
