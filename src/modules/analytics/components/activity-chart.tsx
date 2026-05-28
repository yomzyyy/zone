"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { CompletedSession } from "@/modules/timer/types";
import {
  computeDayChart,
  computeMonthChart,
  computeWeekChart,
  formatMs,
  startOfWeekDate,
  type ChartBar,
} from "../utils";

type View = "day" | "week" | "month";

interface ActivityChartProps {
  sessions: CompletedSession[];
}

const NAV_COOLDOWN_MS = 280;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const FULL_MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function buildCalendarGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - start.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function isSameDayLocal(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const VB_W = 1000;
const VB_H = 300;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

export function ActivityChart({ sessions }: ActivityChartProps) {
  const [view, setView] = useState<View>("week");
  const [reference, setReference] = useState<Date>(() => new Date());
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(() => new Date().getMonth());
  const [hoverWeekStartIso, setHoverWeekStartIso] = useState<string | null>(
    null,
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastNavAt = useRef(0);

  useEffect(() => {
    if (pickerOpen) {
      setPickerYear(reference.getFullYear());
      setPickerMonth(reference.getMonth());
      setHoverWeekStartIso(null);
    }
  }, [pickerOpen, reference]);

  useEffect(() => {
    if (!pickerOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [pickerOpen]);

  function handlePickMonth(year: number, month: number) {
    setReference(new Date(year, month, 1));
    setPickerOpen(false);
  }

  function handlePickDay(date: Date) {
    setReference(new Date(date));
    setPickerOpen(false);
  }

  function handlePickWeek(weekStart: Date) {
    setReference(new Date(weekStart));
    setPickerOpen(false);
  }

  function stepPickerMonth(delta: number) {
    setPickerMonth((m) => {
      const next = m + delta;
      if (next < 0) {
        setPickerYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setPickerYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  }

  const bars: ChartBar[] = useMemo(() => {
    if (view === "day") return computeDayChart(sessions, reference);
    if (view === "week")
      return computeWeekChart(sessions, startOfWeekDate(reference));
    return computeMonthChart(sessions, reference);
  }, [view, reference, sessions]);

  const max = Math.max(...bars.map((b) => b.totalMs), 1);
  const total = bars.reduce((sum, b) => sum + b.totalMs, 0);

  function navigate(direction: "prev" | "next") {
    const delta = direction === "prev" ? -1 : 1;
    setReference((prev) => {
      const next = new Date(prev);
      if (view === "day") next.setDate(next.getDate() + delta);
      else if (view === "week") next.setDate(next.getDate() + delta * 7);
      else next.setMonth(next.getMonth() + delta);
      return next;
    });
  }

  function tryNavigate(direction: "prev" | "next") {
    const now = Date.now();
    if (now - lastNavAt.current < NAV_COOLDOWN_MS) return;
    lastNavAt.current = now;
    navigate(direction);
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(e.deltaX) < 30) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    tryNavigate(e.deltaX > 0 ? "next" : "prev");
  }

  const touchStartX = useRef<number | null>(null);
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 60) return;
    tryNavigate(deltaX < 0 ? "next" : "prev");
  }

  const periodLabel = useMemo(() => {
    if (view === "day") {
      return reference.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = startOfWeekDate(reference);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        const month = start.toLocaleDateString(undefined, { month: "short" });
        return `${month} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return reference.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [view, reference]);

  const labelStride =
    view === "day" ? 3 : view === "month" ? bars.length > 20 ? 5 : 1 : 1;

  function xAt(i: number) {
    if (bars.length <= 1) return VB_W / 2;
    const inner = VB_W - PAD_X * 2;
    return PAD_X + (i / (bars.length - 1)) * inner;
  }
  function yAt(value: number) {
    const inner = VB_H - PAD_TOP - PAD_BOTTOM;
    const ratio = value / max;
    return PAD_TOP + inner - ratio * inner;
  }

  const linePath = bars
    .map((b, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(b.totalMs)}`)
    .join(" ");
  const areaPath =
    bars.length === 0
      ? ""
      : `${linePath} L ${xAt(bars.length - 1)} ${VB_H - PAD_BOTTOM} L ${xAt(0)} ${VB_H - PAD_BOTTOM} Z`;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-md border bg-card/40 p-0.5">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
                view === v
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("prev")}
            aria-label="Previous"
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="rounded-md px-2 py-0.5 text-xs font-medium tabular-nums hover:bg-accent transition-colors"
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
            >
              {periodLabel}
            </button>

            {pickerOpen && (
              <div
                className={cn(
                  "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
                  view === "month" ? "w-56" : "w-64",
                )}
              >
                {view === "month" ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPickerYear((y) => y - 1)}
                        aria-label="Previous year"
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-semibold">{pickerYear}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPickerYear((y) => y + 1)}
                        aria-label="Next year"
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {MONTH_LABELS.map((label, i) => {
                        const isActive =
                          i === reference.getMonth() &&
                          pickerYear === reference.getFullYear();
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handlePickMonth(pickerYear, i)}
                            className={cn(
                              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                              isActive
                                ? "bg-foreground text-background"
                                : "hover:bg-accent",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => stepPickerMonth(-1)}
                        aria-label="Previous month"
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-semibold">
                        {FULL_MONTH_LABELS[pickerMonth]} {pickerYear}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => stepPickerMonth(1)}
                        aria-label="Next month"
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mb-1">
                      {WEEKDAY_INITIALS.map((d, i) => (
                        <span key={i} className="py-0.5">
                          {d}
                        </span>
                      ))}
                    </div>

                    {(() => {
                      const cells = buildCalendarGrid(pickerYear, pickerMonth);
                      const today = new Date();
                      const refStart = startOfWeekDate(reference);
                      return (
                        <div className="grid grid-cols-7 gap-0.5">
                          {cells.map((d, i) => {
                            const inMonth = d.getMonth() === pickerMonth;
                            const isToday = isSameDayLocal(d, today);
                            const cellWeekStart = startOfWeekDate(d);
                            const cellWeekIso = cellWeekStart.toISOString();

                            const isActiveDay =
                              view === "day" && isSameDayLocal(d, reference);
                            const isActiveWeek =
                              view === "week" &&
                              isSameDayLocal(cellWeekStart, refStart);
                            const isHoveredWeek =
                              view === "week" &&
                              hoverWeekStartIso === cellWeekIso;

                            return (
                              <button
                                key={i}
                                type="button"
                                onMouseEnter={() => {
                                  if (view === "week")
                                    setHoverWeekStartIso(cellWeekIso);
                                }}
                                onMouseLeave={() => {
                                  if (view === "week")
                                    setHoverWeekStartIso(null);
                                }}
                                onClick={() => {
                                  if (view === "day") handlePickDay(d);
                                  else handlePickWeek(cellWeekStart);
                                }}
                                className={cn(
                                  "aspect-square rounded text-xs font-medium transition-colors",
                                  !inMonth && "text-muted-foreground/50",
                                  inMonth &&
                                    !isActiveDay &&
                                    !isActiveWeek &&
                                    "text-foreground",
                                  isToday &&
                                    !isActiveDay &&
                                    !isActiveWeek &&
                                    "ring-1 ring-foreground/40",
                                  (isActiveDay || isActiveWeek) &&
                                    "bg-foreground text-background",
                                  !isActiveDay &&
                                    !isActiveWeek &&
                                    isHoveredWeek &&
                                    "bg-accent",
                                  !isActiveDay &&
                                    !isActiveWeek &&
                                    !isHoveredWeek &&
                                    "hover:bg-accent",
                                )}
                              >
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("next")}
            aria-label="Next"
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Total:{" "}
          <span className="font-medium text-foreground">{formatMs(total)}</span>
        </div>
      </div>

      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex flex-1 min-h-40 flex-col touch-pan-y select-none"
      >
        <div className="relative flex-1">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="activity-area" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.18"
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <line
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={VB_H - PAD_BOTTOM}
              y2={VB_H - PAD_BOTTOM}
              className="stroke-border"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />

            <path
              d={areaPath}
              fill="url(#activity-area)"
              className="text-foreground"
            />

            <path
              d={linePath}
              fill="none"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-foreground"
            />

            {bars.map((bar, i) => {
              const cx = xAt(i);
              const cy = yAt(bar.totalMs);
              const visible =
                bar.totalMs > 0 || bar.isHighlight || hoverIdx === i;
              if (!visible) return null;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={hoverIdx === i ? 4 : bar.isHighlight ? 3.5 : 2.5}
                  className={cn(
                    bar.isHighlight
                      ? "fill-foreground"
                      : "fill-background stroke-foreground",
                  )}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {bars.map((_, i) => {
              const colW = (VB_W - PAD_X * 2) / Math.max(bars.length - 1, 1);
              const cx = xAt(i);
              return (
                <rect
                  key={`hit-${i}`}
                  x={cx - colW / 2}
                  y={0}
                  width={colW}
                  height={VB_H}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              );
            })}
          </svg>

          {hoverIdx !== null && bars[hoverIdx] && bars[hoverIdx].totalMs > 0 && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-popover px-2 py-0.5 text-[10px] text-popover-foreground ring-1 ring-foreground/10 z-10"
              style={{
                left: `${(xAt(hoverIdx) / VB_W) * 100}%`,
                top: `${(yAt(bars[hoverIdx].totalMs) / VB_H) * 100}%`,
                marginTop: -6,
              }}
            >
              {bars[hoverIdx].label} · {formatMs(bars[hoverIdx].totalMs)}
            </div>
          )}
        </div>

        <div className="flex gap-1 pt-1.5">
          {bars.map((bar, i) => {
            const showLabel = i % labelStride === 0;
            return (
              <span
                key={i}
                className={cn(
                  "flex-1 truncate text-center text-[10px] tabular-nums min-w-0",
                  bar.isHighlight
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                  !showLabel && "invisible",
                )}
              >
                {bar.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
