"use client";

import { useContext } from "react";
import {
  BoardContext,
  type BoardContextValue,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "../components/board-provider";

export type { CreateTaskInput, UpdateTaskInput };

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (ctx === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return ctx;
}
