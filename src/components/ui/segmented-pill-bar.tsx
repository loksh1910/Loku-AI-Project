"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type PillTabItem<T extends string> = {
  id: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

// Fixed left-to-right order for all items; only the active one expands to
// icon+label with a primary border, in its own position — it never jumps to
// the end of the row the way a "sort active last" layout would.
export function SegmentedPillBar<T extends string>({
  items,
  active,
  onChange,
}: {
  items: PillTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-1.5 py-1">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex h-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              isActive
                ? "gap-1.5 border border-primary px-2.5 text-white hover:bg-transparent hover:text-white"
                : "w-8",
            )}
            aria-label={item.label}
          >
            <item.icon className="h-3.5 w-3.5" />
            {isActive && <p className="text-xs font-medium">{item.label}</p>}
          </button>
        );
      })}
    </div>
  );
}
