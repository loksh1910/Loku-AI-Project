"use client";

import { Eye, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEALTH_SCREENS, type HealthScreenId } from "@/components/present/health-app/screens";

const ORDER: HealthScreenId[] = ["splash", "signup", "signin", "dashboard", "appointment", "profile"];

export function PresentScreensPanel({
  active,
  onSelect,
}: {
  active: HealthScreenId;
  onSelect: (id: HealthScreenId) => void;
}) {
  return (
    <div className="w-[280px] rounded-2xl bg-popover p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Screens</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          <Search className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mb-1 px-1 text-[10px] tracking-wide text-muted-foreground uppercase">
        User Flow &middot; {ORDER.length} screens
      </p>
      <div className="max-h-[280px] overflow-y-auto">
        {ORDER.map((id, i) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary",
              active === id && "bg-primary/30",
            )}
          >
            <span className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-white">{HEALTH_SCREENS[id].name}</span>
            </span>
            <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
