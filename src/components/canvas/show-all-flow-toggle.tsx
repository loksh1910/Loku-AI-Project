"use client";

import { cn } from "@/lib/utils";

export function ShowAllFlowToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex h-8 w-fit shrink-0 items-center gap-2 self-start rounded-full border border-border/60 bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
    >
      Show all flow
      <span
        className={cn(
          "relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 block h-3 w-3 rounded-full bg-white transition-transform",
            checked ? "translate-x-3" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
