import { formatTime } from "../utils";

interface TimerDisplayProps {
  elapsed: number;
  remaining: number;
  mode: "stopwatch" | "pomodoro";
}

// The big timer digits in the center of the screen.
export function TimerDisplay({ elapsed, remaining, mode }: TimerDisplayProps) {
  const displayTime = mode === "pomodoro" ? remaining : elapsed;

  return (
    <div className="select-none">
      <h1 className="text-5xl font-bold tracking-tight tabular-nums sm:text-7xl md:text-8xl lg:text-9xl">
        {formatTime(displayTime)}
      </h1>
    </div>
  );
}
