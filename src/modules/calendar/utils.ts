import type { CalendarDay } from "./types";

export function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfWeek(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay(); // 0 = Sunday
  copy.setDate(copy.getDate() - day);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(d: Date, months: number): Date {
  const copy = new Date(d);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function startOfMonth(d: Date): Date {
  const copy = startOfDay(d);
  copy.setDate(1);
  return copy;
}

export function endOfMonth(d: Date): Date {
  const copy = startOfMonth(d);
  copy.setMonth(copy.getMonth() + 1);
  copy.setDate(0);
  return copy;
}

export function buildMonthGrid(reference: Date): CalendarDay[] {
  const today = new Date();
  const monthStart = startOfMonth(reference);
  const gridStart = startOfWeek(monthStart);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    days.push({
      date,
      dateKey: dateKey(date),
      inCurrentMonth: date.getMonth() === reference.getMonth(),
      isToday: isSameDay(date, today),
    });
  }
  return days;
}

export function buildWeekDays(reference: Date): CalendarDay[] {
  const today = new Date();
  const weekStart = startOfWeek(reference);
  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    days.push({
      date,
      dateKey: dateKey(date),
      inCurrentMonth: date.getMonth() === reference.getMonth(),
      isToday: isSameDay(date, today),
    });
  }
  return days;
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function formatWeekRange(d: Date): string {
  const start = startOfWeek(d);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, {
      month: "long",
    })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function formatDayHeader(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function hourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${period}`;
}
