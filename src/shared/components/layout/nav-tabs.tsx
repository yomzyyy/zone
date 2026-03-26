"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/shared/constants";
import { cn } from "@/shared/utils/utils";

// This component renders the Focus | Tasks | Calendar tabs in the top center.
// It highlights the active tab based on the current URL path.
export function NavTabs() {
  // usePathname() returns the current URL path (e.g., "/board").
  // We use it to highlight which tab is active.
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
