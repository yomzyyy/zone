"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { useSessions } from "@/modules/timer/components/sessions-provider";
import { useBoard } from "@/modules/tasks/hooks/use-board";
import {
  computeAverageSessionMs,
  computeProductivityInsight,
  computeStreak,
  computeTopTasks,
  computeTotals,
  formatMs,
} from "../utils";
import { TopTasks } from "./top-tasks";
import { ActivityChart } from "./activity-chart";

export function Stats() {
  const { sessions } = useSessions();
  const board = useBoard();

  const totals = useMemo(() => computeTotals(sessions), [sessions]);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const avg = useMemo(() => computeAverageSessionMs(sessions), [sessions]);
  const insight = useMemo(
    () => computeProductivityInsight(sessions),
    [sessions],
  );
  const top = useMemo(() => computeTopTasks(board.tasks), [board.tasks]);

  return (
    <div className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Your Zone Stats</h1>
        <p className="text-sm text-muted-foreground">
          Time, sessions, and the patterns behind your focus
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Today</p>
          <p className="text-xl font-bold">{formatMs(totals.todayMs)}</p>
          <p className="text-xs text-muted-foreground">
            {totals.todaySessions} session{totals.todaySessions === 1 ? "" : "s"}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">This week</p>
          <p className="text-xl font-bold">{formatMs(totals.weekMs)}</p>
          <p className="text-xs text-muted-foreground">
            {totals.weekSessions} session{totals.weekSessions === 1 ? "" : "s"}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">This month</p>
          <p className="text-xl font-bold">{formatMs(totals.monthMs)}</p>
          <p className="text-xs text-muted-foreground">
            {totals.monthSessions} session
            {totals.monthSessions === 1 ? "" : "s"}
          </p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">Streak</p>
          <p className="text-xl font-bold flex items-center gap-1.5">
            <Flame className="h-5 w-5 text-orange-400" />
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">5+ minutes per day</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">
            Avg session
          </p>
          <p className="text-xl font-bold">
            {avg === 0 ? "—" : formatMs(avg)}
          </p>
          <p className="text-xs text-muted-foreground">across all sessions</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs uppercase text-muted-foreground">
            Most productive
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Day:</span>{" "}
            <span className="font-medium">{insight.topDay ?? "—"}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Time:</span>{" "}
            <span className="font-medium">{insight.topHourLabel ?? "—"}</span>
          </p>
        </Card>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col p-4 space-y-3 lg:col-span-2">
          <p className="text-xs uppercase text-muted-foreground">Activity</p>
          <ActivityChart sessions={sessions} />
        </Card>

        <Card className="p-4 space-y-3">
          <p className="text-xs uppercase text-muted-foreground">
            Top tasks by time
          </p>
          <TopTasks tasks={top} />
        </Card>
      </div>
    </div>
  );
}
