// Format milliseconds into HH:MM:SS display string
// Example: 3661000 → "01:01:01" (1 hour, 1 minute, 1 second)
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

// Format milliseconds into a human-readable string
// Example: 4980000 → "1h 23m"
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Convert minutes to milliseconds
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}
