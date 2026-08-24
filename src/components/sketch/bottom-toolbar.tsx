"use client";

import { useState } from "react";
import {
  MousePointer2,
  Hand,
  Frame,
  Scissors,
  Layers,
  Shapes,
  Pencil,
  Minus,
  PenTool,
  Spline,
  Type,
  X,
} from "lucide-react";
import type { BottomTool, ShapeType } from "@/components/sketch/sketch-types";
import { cn } from "@/lib/utils";

const SHAPES: { type: ShapeType; label: string; icon: typeof Shapes }[] = [
  { type: "rect", label: "Rectangle", icon: Frame },
  { type: "circle", label: "Circle", icon: Shapes },
  { type: "line", label: "Line", icon: Scissors },
];

const TOOLS: { key: BottomTool; icon: typeof MousePointer2; label: string }[] = [
  { key: "pointer", icon: MousePointer2, label: "Pointer" },
  { key: "hand", icon: Hand, label: "Hand tool" },
  { key: "frame", icon: Frame, label: "Frame" },
  { key: "shapes", icon: Shapes, label: "Shapes" },
  { key: "pencil", icon: Pencil, label: "Pencil" },
  { key: "line", icon: Minus, label: "Line" },
  { key: "vectorpen", icon: PenTool, label: "Pen" },
  { key: "connector", icon: Spline, label: "Connector" },
  { key: "text", icon: Type, label: "Text" },
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
  const [showPenHint, setShowPenHint] = useState(false);

  function select(next: BottomTool) {
    onToolChange(next);
    setShowPenHint(next === "pencil");
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      {/* Fixed-size bar — popups below never change this element's box. */}
      <div className="relative flex items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 shadow-xl">
        {tool === "frame" && (
          <Popup>
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
          </Popup>
        )}

        {tool === "shapes" && (
          <Popup>
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
          </Popup>
        )}

        {showPenHint && (
          <Popup>
            <div className="flex items-center gap-2 px-2 py-1 text-xs whitespace-nowrap text-primary">
              <Pencil className="h-3 w-3" />
              Connect a drawing tablet or pad for more precise sketching
              <button onClick={() => setShowPenHint(false)} aria-label="Dismiss hint">
                <X className="h-3 w-3" />
              </button>
            </div>
          </Popup>
        )}

        {TOOLS.map((t) => (
          <ToolButton
            key={t.key}
            icon={t.icon}
            label={t.label}
            active={tool === t.key}
            onClick={() => select(t.key)}
          />
        ))}
      </div>
    </div>
  );
}

function Popup({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 whitespace-nowrap shadow-xl">
      {children}
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
