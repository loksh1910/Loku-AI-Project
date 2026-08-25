"use client";

import { BoxSelect, Hand, MousePointer2, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasTool } from "@/components/canvas/canvas-types";

const TOOLS: { id: CanvasTool; icon: typeof MousePointer2; label: string }[] = [
  { id: "pointer", icon: MousePointer2, label: "Pointer" },
  { id: "hand", icon: Hand, label: "Hand tool" },
  { id: "select", icon: BoxSelect, label: "Select element" },
  { id: "edit", icon: Pencil, label: "Edit" },
];

export function CanvasRightToolbar({
  tool,
  onToolChange,
  onAddFiles,
}: {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onAddFiles: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-full border border-border/60 bg-card px-1 py-1.5">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === t.id && "bg-primary/15 text-primary",
          )}
          aria-label={t.label}
        >
          <t.icon className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        onClick={onAddFiles}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Add files to canvas"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
