"use client";

import { useEffect, useRef, useState } from "react";
import { BoxSelect, Hand, MousePointer2, Pencil, Shapes, Spline, Type } from "lucide-react";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";
import type { FlowNodeShape } from "@/components/canvas/flow-types";
import { ShapePickerGrid } from "@/components/canvas/flow-shape-picker";

export type FlowTool = "pointer" | "hand" | "select" | "edit" | "text" | "connector";

const TOOLS: { id: FlowTool; icon: typeof MousePointer2; label: string }[] = [
  { id: "pointer", icon: MousePointer2, label: "Pointer" },
  { id: "hand", icon: Hand, label: "Hand tool" },
  { id: "select", icon: BoxSelect, label: "Group select" },
  { id: "edit", icon: Pencil, label: "Edit" },
];

export function FlowRightToolbar({
  tool,
  onToolChange,
  onAddShape,
}: {
  tool: FlowTool;
  onToolChange: (tool: FlowTool) => void;
  onAddShape: (shape: FlowNodeShape) => void;
}) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setShapesOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative flex flex-col items-center gap-1 rounded-full border border-border/60 bg-card px-1 py-1.5">
      {TOOLS.map((t) => (
        <Tip key={t.id} label={t.label} side="left">
          <button
            onClick={() => onToolChange(t.id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              tool === t.id && "bg-primary/15 text-primary",
            )}
            aria-label={t.label}
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        </Tip>
      ))}

      <div className="relative">
        <Tip label="Shapes" side="left">
          <button
            onClick={() => setShapesOpen((v) => !v)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              shapesOpen && "bg-primary/15 text-primary",
            )}
            aria-label="Shapes"
          >
            <Shapes className="h-3.5 w-3.5" />
          </button>
        </Tip>
        {shapesOpen && (
          <div className="absolute top-1/2 right-full z-10 mr-3 -translate-y-1/2 rounded-2xl border border-border/60 bg-popover shadow-2xl">
            <ShapePickerGrid
              onSelect={(s) => {
                onAddShape(s);
                setShapesOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <Tip label="Text" side="left">
        <button
          onClick={() => onToolChange("text")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === "text" && "bg-primary/15 text-primary",
          )}
          aria-label="Text"
        >
          <Type className="h-3.5 w-3.5" />
        </button>
      </Tip>

      <Tip label="Connector" side="left">
        <button
          onClick={() => onToolChange("connector")}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === "connector" && "bg-primary/15 text-primary",
          )}
          aria-label="Connector"
        >
          <Spline className="h-3.5 w-3.5" />
        </button>
      </Tip>
    </div>
  );
}
