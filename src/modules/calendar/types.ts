export type CalendarView = "week" | "month";

export interface CalendarDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD in local time
  inCurrentMonth: boolean;
  isToday: boolean;
}
