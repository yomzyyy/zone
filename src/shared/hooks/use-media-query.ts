"use client";

import { useState, useEffect } from "react";

// Detects if a CSS media query matches. Used for responsive behavior in JS.
// Example: const isMobile = useMediaQuery("(max-width: 768px)");
//
// Why not just use Tailwind's responsive classes (md:, lg:)?
// Sometimes you need to know the screen size in JS (e.g., to render different
// components entirely, not just style them differently).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // window.matchMedia is a browser API that evaluates CSS media queries in JS
    const media = window.matchMedia(query);
    setMatches(media.matches);

    // Listen for changes (e.g., user resizes the window)
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);

    // Cleanup: remove the listener when the component unmounts.
    // Without this, you'd have a "memory leak" — the listener keeps running forever.
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
