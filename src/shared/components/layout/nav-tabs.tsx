"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAV_ITEMS, type TabId } from "@/shared/constants";
import { cn } from "@/shared/utils/utils";

interface NavTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pill, setPill] = useState({ width: 0, left: 0 });

  useLayoutEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeTab);
    const button = buttonRefs.current[activeIndex];
    if (!button) return;
    setPill({ width: button.offsetWidth, left: button.offsetLeft });
  }, [activeTab]);

  useEffect(() => {
    function remeasure() {
      const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeTab);
      const button = buttonRefs.current[activeIndex];
      if (!button) return;
      setPill({ width: button.offsetWidth, left: button.offsetLeft });
    }
    window.addEventListener("resize", remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [activeTab]);

  return (
    <nav className="relative flex items-center rounded-full border border-border bg-card p-1">
      <div
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-out",
          pill.width === 0 && "opacity-0",
        )}
        style={{
          width: pill.width,
          transform: `translateX(${pill.left}px)`,
          left: 0,
        }}
      />

      {NAV_ITEMS.map((item, i) => {
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "relative z-10 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
