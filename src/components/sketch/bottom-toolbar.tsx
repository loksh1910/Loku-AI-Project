"use client";

import { useState } from "react";
import { MousePointer2, Hand, Frame, Scissors, Layers, Shapes, Pencil, X } from "lucide-react";
import type { BottomTool, ShapeType } from "@/components/sketch/sketch-types";
import { cn } from "@/lib/utils";

const SHAPES: { type: ShapeType; label: string; icon: typeof Shapes }[] = [
  { type: "rect", label: "Rectangle", icon: Frame },
  { type: "circle", label: "Circle", icon: Shapes },
  { type: "line", label: "Line", icon: Scissors },
];

export function BottomToolbar({
  tool,
  onToolChange,
  onPickShape,
}: {
  tool: BottomTool;
  onToolChange: (tool: BottomTool) => void;
  onPickShape: (shape: ShapeType) => void;
}) {
  const [frameSubOpen, setFrameSubOpen] = useState(false);
  const [showPenHint, setShowPenHint] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);

  function select(next: BottomTool) {
    onToolChange(next);
    setFrameSubOpen(next === "frame");
    setShapesOpen(next === "shapes");
    setShowPenHint(next === "pen");
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      {frameSubOpen && (
        <div className="mb-2 flex items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 shadow-xl">
          {[
            { label: "Frame", icon: Frame },
            { label: "Section", icon: Layers },
            { label: "Slice", icon: Scissors },
          ].map((o) => (
            <button
              key={o.label}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <o.icon className="h-3.5 w-3.5" />
              {o.label}
            </button>
          ))}
        </div>
      )}

      {shapesOpen && (
        <div className="mb-2 flex items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 shadow-xl">
          {SHAPES.map((s) => (
            <button
              key={s.type}
              onClick={() => onPickShape(s.type)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {showPenHint && (
        <div className="mb-2 flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5 text-center text-xs text-primary">
          <Pencil className="h-3 w-3" />
          Connect a drawing tablet or pad for more precise sketching
          <button onClick={() => setShowPenHint(false)} aria-label="Dismiss hint">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 shadow-xl">
        <ToolButton
          icon={MousePointer2}
          label="Pointer"
          active={tool === "pointer"}
          onClick={() => select("pointer")}
        />
        <ToolButton icon={Hand} label="Hand tool" active={tool === "hand"} onClick={() => select("hand")} />
        <ToolButton icon={Frame} label="Frame" active={tool === "frame"} onClick={() => select("frame")} />
        <ToolButton icon={Shapes} label="Shapes" active={tool === "shapes"} onClick={() => select("shapes")} />
        <ToolButton icon={Pencil} label="Pen" active={tool === "pen"} onClick={() => select("pen")} />
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MousePointer2;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
