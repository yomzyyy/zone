import { cn } from "@/shared/utils/utils";
import { formatMs, type WeeklyBar } from "../utils";

interface WeeklyChartProps {
  bars: WeeklyBar[];
}

export function WeeklyChart({ bars }: WeeklyChartProps) {
  const max = Math.max(...bars.map((b) => b.totalMs), 1);

  return (
    <div className="space-y-2">
      {bars.map((bar) => {
        const pct = (bar.totalMs / max) * 100;
        return (
          <div
            key={bar.dateKey}
            className="grid grid-cols-[40px_1fr_70px] items-center gap-3 text-xs"
          >
            <span className="text-muted-foreground">{bar.dayLabel}</span>
            <div className="relative h-4 rounded bg-muted/40">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded bg-emerald-500/40",
                  bar.totalMs === 0 && "bg-transparent",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-right font-mono">
              {bar.totalMs === 0 ? "—" : formatMs(bar.totalMs)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
