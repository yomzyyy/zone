"use client";

import { useState } from "react";
import { addDays, addMonths } from "../utils";
import type { CalendarView } from "../types";

export function useCalendar(initialView: CalendarView = "month") {
  const [view, setView] = useState<CalendarView>(initialView);
  const [reference, setReference] = useState<Date>(() => new Date());

  function next() {
    if (view === "week") setReference((d) => addDays(d, 7));
    else setReference((d) => addMonths(d, 1));
  }

  function prev() {
    if (view === "week") setReference((d) => addDays(d, -7));
    else setReference((d) => addMonths(d, -1));
  }

  function today() {
    setReference(new Date());
  }

  return { view, setView, reference, setReference, next, prev, today };
}
