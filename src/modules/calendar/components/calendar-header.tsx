"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { CalendarView } from "../types";
import {
  formatMonthYear,
  formatWeekRange,
  isSameDay,
  startOfWeek,
} from "../utils";

interface CalendarHeaderProps {
  view: CalendarView;
  reference: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (view: CalendarView) => void;
  onSelectDate: (date: Date) => void;
}

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

export function CalendarHeader({
  view,
  reference,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onSelectDate,
}: CalendarHeaderProps) {
  const title =
    view === "week" ? formatWeekRange(reference) : formatMonthYear(reference);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(reference.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(reference.getMonth());
  const [hoverWeekStartIso, setHoverWeekStartIso] = useState<string | null>(
    null,
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  // Sync the picker to whatever the calendar is currently showing each time it opens.
  useEffect(() => {
    if (pickerOpen) {
      setPickerYear(reference.getFullYear());
      setPickerMonth(reference.getMonth());
      setHoverWeekStartIso(null);
    }
  }, [pickerOpen, reference]);

  // Close on outside click or Escape.
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

  // Step the picker's *internal* month independently of the calendar's reference.
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

  function handlePick(date: Date) {
    onSelectDate(date);
    setPickerOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onPrev} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="rounded-md px-2 py-1 text-base font-semibold hover:bg-accent transition-colors sm:text-lg"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
          >
            {title}
          </button>

          {pickerOpen && (
            <div
              className={cn(
                "absolute left-0 top-full z-50 mt-2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg",
                view === "month" ? "w-64" : "w-72",
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
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold">{pickerYear}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPickerYear((y) => y + 1)}
                      aria-label="Next year"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_LABELS.map((label, i) => {
                      const isActive =
                        i === reference.getMonth() &&
                        pickerYear === reference.getFullYear();
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handlePick(new Date(pickerYear, i, 1))}
                          className={cn(
                            "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
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
                    const refStart = startOfWeek(reference);
                    return (
                      <div className="grid grid-cols-7 gap-0.5">
                        {cells.map((d, i) => {
                          const inMonth = d.getMonth() === pickerMonth;
                          const isToday = isSameDay(d, today);
                          const cellWeekStart = startOfWeek(d);
                          const cellWeekIso = cellWeekStart.toISOString();

                          const isActiveDay = false;
                          const isActiveWeek =
                            view === "week" &&
                            isSameDay(cellWeekStart, refStart);
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
                              onClick={() => handlePick(cellWeekStart)}
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

        <Button size="icon" variant="ghost" onClick={onNext} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-md border bg-card/40 p-0.5">
        {(["week", "month"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChangeView(v)}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
              view === v
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
