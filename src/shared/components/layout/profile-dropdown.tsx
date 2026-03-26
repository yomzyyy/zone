"use client";

import { useTheme } from "next-themes";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/shared/components/ui/dropdown-menu";

// For now, we always show the "guest" version.
// When we build the Auth module (ZONE-003), we'll add the logged-in version.
export function ProfileDropdown() {
  const { theme, setTheme } = useTheme();
  // useTheme() gives us the current theme and a function to change it.
  // This hook works because we wrapped our app in ThemeProvider.

  return (
    <DropdownMenu>
      {/* Trigger — the button that opens the dropdown on click */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="text-lg">👤</span>
        </Button>
      </DropdownMenuTrigger>

      {/* Content — the dropdown panel */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          Guest
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Theme toggle */}
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <span>{theme === "dark" ? "🌙" : "☀️"}</span>
          <span>Theme</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Auth links — these will become real links in ZONE-003 */}
        <DropdownMenuItem>🔑 Log in</DropdownMenuItem>
        <DropdownMenuItem>✏️ Sign up</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
