"use client";

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
              <div className="space-y-2">
                <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
                <Input
                  id="focus-duration"
                  type="number"
                  min={1}
                  max={120}
                  value={settings.focusDuration}
                  onChange={(e) =>
                    onUpdateSettings({
                      focusDuration: clamp(parseInt(e.target.value) || 25, 1, 120),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  min={1}
                  max={30}
                  value={settings.breakDuration}
                  onChange={(e) =>
                    onUpdateSettings({
                      breakDuration: clamp(parseInt(e.target.value) || 5, 1, 30),
                    })
                  }
                />
              </div>

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
