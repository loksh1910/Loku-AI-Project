"use client";

import { Search, SlidersHorizontal, Smartphone, Monitor } from "lucide-react";
import type { TemplateDevice } from "@/lib/templates-data";
import { cn } from "@/lib/utils";

export function TemplateSearchRow({
  query,
  onQueryChange,
  device,
  onDeviceChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  device: TemplateDevice;
  onDeviceChange: (device: TemplateDevice) => void;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Try "Fitness app", "debt dashboard", "food delivery UI"`}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <button
        className="rounded-full border border-border/60 p-2.5 text-muted-foreground hover:text-foreground"
        aria-label="Filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1 rounded-full border border-border/60 p-1">
        <button
          onClick={() => onDeviceChange("mobile")}
          className={cn(
            "rounded-full p-1.5",
            device === "mobile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground",
          )}
          aria-label="Mobile templates"
        >
          <Smartphone className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDeviceChange("web")}
          className={cn(
            "rounded-full p-1.5",
            device === "web" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
          aria-label="Web templates"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
