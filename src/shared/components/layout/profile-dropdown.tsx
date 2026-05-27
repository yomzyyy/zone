"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { User, Moon, Sun, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/shared/components/ui/dropdown-menu";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { AUTH_ROUTES } from "@/modules/auth/constants";

export function ProfileDropdown() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  const displayName =
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    "Guest";

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex min-w-0 flex-col space-y-1">
            <p className="truncate text-sm font-medium leading-none">
              {displayName}
            </p>
            {isAuthenticated && user?.email && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
            {!isAuthenticated && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                Guest
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span>Theme</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isAuthenticated ? (
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem onClick={() => router.push(AUTH_ROUTES.LOGIN)}>
              <LogIn className="h-4 w-4" />
              <span>Log in</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(AUTH_ROUTES.SIGNUP)}>
              <UserPlus className="h-4 w-4" />
              <span>Sign up</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
