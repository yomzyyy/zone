// Central place for values used across the app.
// If you need to change the app name, you change it here — not in 20 different files.
export const APP_NAME = "Zone";

export type TabId = "focus" | "tasks" | "calendar" | "stats";

export const NAV_ITEMS = [
  { label: "Focus", id: "focus" },
  { label: "Tasks", id: "tasks" },
  { label: "Calendar", id: "calendar" },
  { label: "Stats", id: "stats" },
] as const satisfies readonly { label: string; id: TabId }[];

// "as const" makes TypeScript treat this as a read-only tuple with exact string types,
// not just a generic string[]. This gives you better autocomplete and type safety.
