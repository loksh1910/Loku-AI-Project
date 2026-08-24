"use client";

import { BoxSelect, Monitor, MousePointer2, Pencil, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceMode } from "@/components/present/device-frame";

export type PresentTool = "pointer" | "select" | "edit";

const DEVICE_CYCLE: DeviceMode[] = ["mobile", "web", "tablet"];
const DEVICE_ICON: Record<DeviceMode, typeof Smartphone> = { mobile: Smartphone, web: Monitor, tablet: Tablet };

export function PresentTopToolbar({
  tool,
  onToolChange,
  deviceMode,
  onDeviceModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  tool: PresentTool;
  onToolChange: (tool: PresentTool) => void;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const DeviceIcon = DEVICE_ICON[deviceMode];

  function cycleDevice() {
    const idx = DEVICE_CYCLE.indexOf(deviceMode);
    onDeviceModeChange(DEVICE_CYCLE[(idx + 1) % DEVICE_CYCLE.length]);
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-full bg-[#1a191f] p-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Undo"
        >
          <Undo2 className="h-5 w-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Redo"
        >
          <Redo2 className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2.5 rounded-full bg-[#1a191f] p-1.5">
        <button
          onClick={() => onToolChange("pointer")}
          className={cn(
            "rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === "pointer" && "bg-primary/15 text-primary",
          )}
          aria-label="Pointer"
        >
          <MousePointer2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onToolChange("select")}
          className={cn(
            "rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === "select" && "bg-primary/15 text-primary",
          )}
          aria-label="Select element"
        >
          <BoxSelect className="h-[15px] w-[15px]" />
        </button>
        <button
          onClick={() => onToolChange("edit")}
          className={cn(
            "rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            tool === "edit" && "bg-primary/15 text-primary",
          )}
          aria-label="Edit text"
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          onClick={cycleDevice}
          className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Device mode"
        >
          <DeviceIcon className="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>
  );
}
