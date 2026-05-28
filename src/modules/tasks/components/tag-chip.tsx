import { X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { Tag } from "../types";

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function TagChip({
  tag,
  onRemove,
  onClick,
  active,
  className,
}: TagChipProps) {
  const baseClass = cn(
    "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
    onClick && "cursor-pointer hover:opacity-80",
    active && "ring-2 ring-offset-1 ring-offset-background",
    className,
  );
  const baseStyle = {
    borderColor: tag.color,
    color: tag.color,
    backgroundColor: `${tag.color}1f`,
  };

  const removeButton = onRemove ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      aria-label={`Remove ${tag.name}`}
      className="rounded-full hover:bg-foreground/10"
    >
      <X className="h-3 w-3" />
    </button>
  ) : null;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
        style={baseStyle}
        aria-pressed={active ? true : undefined}
      >
        <span className="min-w-0 truncate">{tag.name}</span>
        {removeButton}
      </button>
    );
  }

  return (
    <span className={baseClass} style={baseStyle}>
      <span>{tag.name}</span>
      {removeButton}
    </span>
  );
}
