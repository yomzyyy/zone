"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TAG_PALETTE } from "../constants";
import type { Tag } from "../types";
import { TagChip } from "./tag-chip";

interface TagInputProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onAdd: (name: string, color: string) => Tag;
  onAttach: (tagId: string) => void;
  onDetach: (tagId: string) => void;
}

export function TagInput({
  allTags,
  selectedTagIds,
  onAdd,
  onAttach,
  onDetach,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState<string>(TAG_PALETTE[0]);

  const selected = allTags.filter((t) => selectedTagIds.includes(t.id));
  const available = allTags.filter((t) => !selectedTagIds.includes(t.id));

  const trimmed = draft.trim();
  const matchExisting = available.find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
  );

  function commit() {
    if (!trimmed) return;
    if (matchExisting) {
      onAttach(matchExisting.id);
    } else {
      const created = onAdd(trimmed, color);
      onAttach(created.id);
    }
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selected.map((tag) => (
          <TagChip key={tag.id} tag={tag} onRemove={() => onDetach(tag.id)} />
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-muted-foreground">No tags yet</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          placeholder="Add tag..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={commit}
          disabled={!trimmed}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {!matchExisting && trimmed && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Color:</span>
          <div className="flex gap-1">
            {TAG_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className="h-5 w-5 rounded-full border-2"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "white" : "transparent",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground self-center">
            Existing:
          </span>
          {available.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onClick={() => onAttach(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
