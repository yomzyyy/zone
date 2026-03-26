"use client";

import { NAV_ITEMS, type TabId } from "@/shared/constants";
import { cn } from "@/shared/utils/utils";

interface NavTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

// Renders the Focus | Tasks | Calendar tabs in the top center.
// Highlights the active tab based on state (not URL).
export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
