"use client";

import { useState } from "react";
import { Navbar } from "@/shared/components/layout/navbar";
import { TimerPage } from "@/modules/timer/components/timer-page";
import type { TabId } from "@/shared/constants";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("focus");

  return (
    <>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1">
        {activeTab === "focus" && <TimerPage />}

        {activeTab === "tasks" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Tasks — coming in ZONE-004</p>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Calendar — coming soon</p>
          </div>
        )}
      </div>
    </>
  );
}
