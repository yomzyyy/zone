"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Stats } from "@/modules/analytics/components/stats";

export function AnalyticsClient() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => router.push("/")}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Back to Zone</span>
      </div>

      <Stats />
    </div>
  );
}
