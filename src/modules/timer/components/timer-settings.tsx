"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import type { TimerSettings } from "../types";

// Clamp a number between min and max — prevents invalid durations.
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface TimerSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TimerSettings;
  onUpdateSettings: (updates: Partial<TimerSettings>) => void;
}

// Local string state for numeric inputs so the user can clear / type
// intermediate values without the field snapping back to a default.
// Commits to the settings store only when a valid number is parsed.
interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  fallback: number;
  onCommit: (n: number) => void;
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  fallback,
  onCommit,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));

  // Re-sync when the canonical value changes (e.g. settings loaded from
  // storage or set elsewhere) so the field doesn't show stale text.
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          // Only commit when the typed value parses to a valid in-range
          // integer. Empty / partial / out-of-range values stay local until
          // the user finishes editing.
          const parsed = parseInt(next, 10);
          if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
            onCommit(parsed);
          }
        }}
        onBlur={() => {
          // On blur, snap to a sensible value: if empty/invalid use fallback,
          // otherwise clamp into range.
          const parsed = parseInt(draft, 10);
          const finalValue = Number.isNaN(parsed)
            ? fallback
            : clamp(parsed, min, max);
          setDraft(String(finalValue));
          onCommit(finalValue);
        }}
      />
    </div>
  );
}

// The settings modal — opened by clicking the gear button.
export function TimerSettingsModal({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
}: TimerSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
          <DialogDescription className="sr-only">
            Configure timer mode, focus and break durations, and sound preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Mode */}
          <div className="space-y-2">
            <Label>Timer Mode</Label>
            <Select
              value={settings.mode}
              onValueChange={(value) =>
                onUpdateSettings({ mode: value as "stopwatch" | "pomodoro" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stopwatch">Zone</SelectItem>
                <SelectItem value="pomodoro">Pomodoro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pomodoro settings — only show when pomodoro mode is selected */}
          {settings.mode === "pomodoro" && (
            <>
              <NumberField
                id="focus-duration"
                label="Focus Duration (minutes)"
                value={settings.focusDuration}
                min={1}
                max={120}
                fallback={25}
                onCommit={(n) => onUpdateSettings({ focusDuration: n })}
              />

              <NumberField
                id="break-duration"
                label="Break Duration (minutes)"
                value={settings.breakDuration}
                min={1}
                max={30}
                fallback={5}
                onCommit={(n) => onUpdateSettings({ breakDuration: n })}
              />
            </>
          )}

          {/* Sound toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle">Sound notifications</Label>
            <Switch
              id="sound-toggle"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ soundEnabled: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
