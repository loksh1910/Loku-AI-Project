"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHAPE_OPTIONS, type FlowNodeShape } from "@/components/canvas/flow-types";

const SHAPE_LABELS: Record<FlowNodeShape, string> = {
  roundedRect: "Rounded rectangle",
  rect: "Rectangle",
  diamond: "Diamond",
  circle: "Circle",
  triangle: "Triangle",
  text: "Text",
};

export function ShapeGlyph({ shape, className }: { shape: FlowNodeShape; className?: string }) {
  const base = cn("h-[18px] w-[18px] border-[1.5px] border-current", className);
  if (shape === "circle") return <span className={cn(base, "rounded-full")} />;
  if (shape === "roundedRect") return <span className={cn(base, "rounded-[4px]")} />;
  if (shape === "rect") return <span className={base} />;
  if (shape === "diamond") return <span className={base} style={{ transform: "rotate(45deg) scale(0.72)" }} />;
  if (shape === "triangle")
    return <span className={cn(base, "border-t-0 border-r-0")} style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />;
  return <span className="text-xs font-semibold">T</span>;
}

export function ShapePickerGrid({
  selected,
  onSelect,
}: {
  selected?: FlowNodeShape;
  onSelect: (shape: FlowNodeShape) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = SHAPE_OPTIONS.filter((s) => SHAPE_LABELS[s].toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="w-[200px] p-3">
      <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for shapes..."
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">No shapes found</p>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {filtered.map((s) => (
            <button
              key={s}
              onClick={() => onSelect(s)}
              title={SHAPE_LABELS[s]}
              aria-label={SHAPE_LABELS[s]}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                selected === s
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-foreground",
              )}
            >
              <ShapeGlyph shape={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
