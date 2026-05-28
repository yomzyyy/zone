"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Bold, Italic, Underline as UnderlineIcon } from "lucide-react";
import { cn } from "@/shared/utils/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "p", "div"];
const ALLOWED_ATTRS: string[] = [];

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
  });
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const safe = sanitize(value);
    if (el.innerHTML !== safe) {
      el.innerHTML = safe;
    }
  }, [value]);

  function flush() {
    if (!editorRef.current) return;
    onChange(sanitize(editorRef.current.innerHTML));
  }

  function exec(command: "bold" | "italic" | "underline") {
    document.execCommand(command, false);
    editorRef.current?.focus();
    flush();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b" || k === "i" || k === "u") {
      requestAnimationFrame(flush);
    }
  }

  return (
    <div className="min-w-0 max-w-full rounded-md border bg-transparent dark:bg-input/30">
      <div className="flex gap-1 border-b p-1">
        <ToolbarButton onClick={() => exec("bold")} label="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} label="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exec("underline")}
          label="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={flush}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-24 min-w-0 max-w-full px-3 py-2 text-sm outline-none break-all [overflow-wrap:anywhere]",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
          "[&_strong]:font-bold [&_b]:font-bold",
          "[&_em]:italic [&_i]:italic",
          "[&_u]:underline",
        )}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
      className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}
