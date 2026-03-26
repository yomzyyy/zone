// Central place for values used across the app.
// If you need to change the app name, you change it here — not in 20 different files.
export const APP_NAME = "Zone";

export const NAV_ITEMS = [
  { label: "Focus", href: "/" },
  { label: "Tasks", href: "/board" },
  { label: "Calendar", href: "/calendar" },
] as const;

// "as const" makes TypeScript treat this as a read-only tuple with exact string types,
// not just a generic string[]. This gives you better autocomplete and type safety.
