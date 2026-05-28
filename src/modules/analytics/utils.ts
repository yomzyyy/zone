import type { CompletedSession } from "@/modules/timer/types";
import type { Task } from "@/modules/tasks/types";

export interface AnalyticsTotals {
  todayMs: number;
  weekMs: number;
  monthMs: number;
  todaySessions: number;
  weekSessions: number;
  monthSessions: number;
}

export interface ProductivityInsight {
  topDay: string | null;
  topHourLabel: string | null;
}

export interface WeeklyBar {
  dayLabel: string;
  dateKey: string;
  totalMs: number;
}

export interface TopTask {
  taskId: string;
  title: string;
  totalSeconds: number;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

export function computeTotals(
  sessions: CompletedSession[],
  now: Date = new Date(),
): AnalyticsTotals {
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  let todayMs = 0,
    weekMs = 0,
    monthMs = 0;
  let todaySessions = 0,
    weekSessions = 0,
    monthSessions = 0;

  for (const s of sessions) {
    const start = new Date(s.startedAt);
    if (start >= today) {
      todayMs += s.duration;
      todaySessions += 1;
    }
    if (start >= weekStart) {
      weekMs += s.duration;
      weekSessions += 1;
    }
    if (start >= monthStart) {
      monthMs += s.duration;
      monthSessions += 1;
    }
  }

  return {
    todayMs,
    weekMs,
    monthMs,
    todaySessions,
    weekSessions,
    monthSessions,
  };
}

export function computeStreak(
  sessions: CompletedSession[],
  now: Date = new Date(),
  minimumSeconds = 300,
): number {
  const dayTotals = new Map<string, number>();
  for (const s of sessions) {
    const key = dateKey(new Date(s.startedAt));
    dayTotals.set(key, (dayTotals.get(key) ?? 0) + s.duration / 1000);
  }

  let streak = 0;
  const cursor = startOfDay(now);
  if ((dayTotals.get(dateKey(cursor)) ?? 0) < minimumSeconds) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while ((dayTotals.get(dateKey(cursor)) ?? 0) >= minimumSeconds) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function computeAverageSessionMs(
  sessions: CompletedSession[],
): number {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce((sum, s) => sum + s.duration, 0);
  return Math.round(total / sessions.length);
}

export function computeProductivityInsight(
  sessions: CompletedSession[],
): ProductivityInsight {
  if (sessions.length === 0) {
    return { topDay: null, topHourLabel: null };
  }

  const dayTotals = Array(7).fill(0) as number[];
  const hourTotals = Array(24).fill(0) as number[];

  for (const s of sessions) {
    const start = new Date(s.startedAt);
    dayTotals[start.getDay()] += s.duration;
    hourTotals[start.getHours()] += s.duration;
  }

  const topDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
  const topHour = hourTotals.indexOf(Math.max(...hourTotals));

  const period = topHour < 12 ? "AM" : "PM";
  const h = topHour % 12 === 0 ? 12 : topHour % 12;
  const next = (topHour + 2) % 24;
  const periodEnd = next < 12 ? "AM" : "PM";
  const hEnd = next % 12 === 0 ? 12 : next % 12;

  return {
    topDay: DAY_NAMES[topDayIdx] + "s",
    topHourLabel: `${h}:00 ${period} – ${hEnd}:00 ${periodEnd}`,
  };
}

export function computeWeeklyChart(
  sessions: CompletedSession[],
  now: Date = new Date(),
): WeeklyBar[] {
  const buckets: WeeklyBar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    buckets.push({
      dayLabel: SHORT_DAY_NAMES[d.getDay()],
      dateKey: key,
      totalMs: 0,
    });
  }
  const map = new Map(buckets.map((b) => [b.dateKey, b]));
  for (const s of sessions) {
    const key = dateKey(new Date(s.startedAt));
    const bucket = map.get(key);
    if (bucket) bucket.totalMs += s.duration;
  }
  return buckets;
}

export interface ChartBar {
  label: string;
  totalMs: number;
  isHighlight?: boolean;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekDate(d: Date): Date {
  const copy = startOfDay(d);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function computeDayChart(
  sessions: CompletedSession[],
  reference: Date,
  now: Date = new Date(),
): ChartBar[] {
  const dayStart = startOfDay(reference);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const totals = new Array(24).fill(0) as number[];
  for (const s of sessions) {
    const start = new Date(s.startedAt);
    if (start < dayStart || start >= dayEnd) continue;
    totals[start.getHours()] += s.duration;
  }

  const showCurrentHour = isSameDay(reference, now);
  const bars: ChartBar[] = [];
  for (let h = 0; h < 24; h++) {
    const period = h < 12 ? "a" : "p";
    const hh = h % 12 === 0 ? 12 : h % 12;
    bars.push({
      label: `${hh}${period}`,
      totalMs: totals[h],
      isHighlight: showCurrentHour && h === now.getHours(),
    });
  }
  return bars;
}

export function computeWeekChart(
  sessions: CompletedSession[],
  weekStart: Date,
  now: Date = new Date(),
): ChartBar[] {
  const bars: ChartBar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    let total = 0;
    for (const s of sessions) {
      const start = new Date(s.startedAt);
      if (isSameDay(start, d)) total += s.duration;
    }
    bars.push({
      label: SHORT_DAY_NAMES[d.getDay()],
      totalMs: total,
      isHighlight: isSameDay(d, now),
    });
  }
  return bars;
}

export function computeMonthChart(
  sessions: CompletedSession[],
  reference: Date,
  now: Date = new Date(),
): ChartBar[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const bars: ChartBar[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    let total = 0;
    for (const s of sessions) {
      const start = new Date(s.startedAt);
      if (isSameDay(start, d)) total += s.duration;
    }
    bars.push({
      label: String(day),
      totalMs: total,
      isHighlight: isSameDay(d, now),
    });
  }
  return bars;
}

export function computeTopTasks(tasks: Task[], limit = 5): TopTask[] {
  const ranked = tasks
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      totalSeconds: task.timeLog.reduce(
        (sum, log) => sum + log.durationSeconds,
        0,
      ),
    }))
    .filter((t) => t.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
  return ranked.slice(0, limit);
}

export function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}
