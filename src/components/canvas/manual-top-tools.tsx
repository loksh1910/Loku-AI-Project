"use client";

import { useEffect, useRef, useState } from "react";
import { Component, Layers2, SquareDashedMousePointer, ArrowDownToLine } from "lucide-react";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

const BOOLEAN_OPS = [
  { id: "union", label: "Union" },
  { id: "subtract", label: "Subtract" },
  { id: "intersect", label: "Intersect" },
  { id: "exclude", label: "Exclude" },
] as const;

export type BooleanOp = (typeof BOOLEAN_OPS)[number]["id"] | "flatten";

function BooleanGlyph({ op }: { op: BooleanOp }) {
  const back = "absolute h-3 w-3 rounded-[2px] bg-current opacity-40";
  const front = "absolute h-3 w-3 translate-x-1 translate-y-1 rounded-[2px] bg-current";
  if (op === "flatten") return <ArrowDownToLine className="h-4 w-4" />;
  return (
    <span className="relative block h-4 w-4">
      <span className={back} style={{ left: 0, top: 0 }} />
      <span
        className={front}
        style={
          op === "intersect"
            ? { clipPath: "inset(30% 0 0 30%)" }
            : op === "exclude"
              ? { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: 0.7, mixBlendMode: "difference" as const }
              : undefined
        }
      />
    </span>
  );
}

export function ManualTopTools({
  onCreateComponent,
  onCreateVariant,
  onToggleMask,
  masked,
  onBooleanOp,
}: {
  onCreateComponent: () => void;
  onCreateVariant: () => void;
  onToggleMask: () => void;
  masked: boolean;
  onBooleanOp: (op: BooleanOp) => void;
}) {
  const [open, setOpen] = useState<"components" | "boolean" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
      <div className="relative">
        <Tip label="Components" side="bottom">
          <button
            onClick={() => setOpen(open === "components" ? null : "components")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              open === "components" && "bg-primary/15 text-primary",
            )}
            aria-label="Components"
          >
            <Component className="h-3.5 w-3.5" />
          </button>
        </Tip>
        {open === "components" && (
          <div className="absolute top-full right-0 z-10 mt-2 w-[170px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-2xl">
            <button
              onClick={() => {
                onCreateComponent();
                setOpen(null);
              }}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
            >
              Create Component
            </button>
            <button
              onClick={() => {
                onCreateVariant();
                setOpen(null);
              }}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
            >
              Create Variant
            </button>
          </div>
        )}
      </div>

      <Tip label="Mask" side="bottom">
        <button
          onClick={onToggleMask}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
            masked && "bg-primary/15 text-primary",
          )}
          aria-label="Mask"
        >
          <SquareDashedMousePointer className="h-3.5 w-3.5" />
        </button>
      </Tip>

      <div className="relative">
        <Tip label="Boolean operations" side="bottom">
          <button
            onClick={() => setOpen(open === "boolean" ? null : "boolean")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              open === "boolean" && "bg-primary/15 text-primary",
            )}
            aria-label="Boolean operations"
          >
            <Layers2 className="h-3.5 w-3.5" />
          </button>
        </Tip>
        {open === "boolean" && (
          <div className="absolute top-full right-0 z-10 mt-2 w-[160px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-2xl">
            {BOOLEAN_OPS.map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  onBooleanOp(op.id);
                  setOpen(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
              >
                <BooleanGlyph op={op.id} />
                {op.label}
              </button>
            ))}
            <button
              onClick={() => {
                onBooleanOp("flatten");
                setOpen(null);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
            >
              <BooleanGlyph op="flatten" />
              Flatten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
