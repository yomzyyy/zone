"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Back button used by the signup / login / verify pages. Uses browser history
// (router.back) so it returns to wherever the user came from — not always home.
// Falls back to "/" when there's no history (e.g. user opened the page directly
// in a fresh tab) so we don't leave them with a no-op button.
export function BackToHome() {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  );
}
