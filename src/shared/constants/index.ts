export const APP_NAME = "Zone";

export type TabId = "focus" | "tasks" | "calendar" | "stats";

export const NAV_ITEMS = [
  { label: "Focus", id: "focus" },
  { label: "Tasks", id: "tasks" },
  { label: "Calendar", id: "calendar" },
  { label: "Stats", id: "stats" },
] as const satisfies readonly { label: string; id: TabId }[];
