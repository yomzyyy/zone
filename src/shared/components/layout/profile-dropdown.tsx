"use client";

import { useTheme } from "next-themes";
import { User, Moon, Sun, LogIn, UserPlus } from "lucide-react";
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
          <User className="h-5 w-5" />
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
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span>Theme</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Auth links — these will become real links in ZONE-003 */}
        <DropdownMenuItem>
          <LogIn className="h-4 w-4" />
          <span>Log in</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <UserPlus className="h-4 w-4" />
          <span>Sign up</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
