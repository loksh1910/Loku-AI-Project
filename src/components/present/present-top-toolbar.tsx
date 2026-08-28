"use client";

import { BoxSelect, Monitor, MousePointer2, Pencil, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { Tip } from "@/components/ui/tip";
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
  tools,
  showDeviceToggle = true,
}: {
  tool: PresentTool;
  onToolChange: (tool: PresentTool) => void;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Restricts which tool buttons render — e.g. the Design/Prototype entry has
   * no AI to tag elements for, so it only offers Pointer. Defaults to all three. */
  tools?: PresentTool[];
  /** The Design/Prototype entry derives its device chrome from each screen's
   * own designed size rather than a free toggle — hide the cycle button there. */
  showDeviceToggle?: boolean;
}) {
  const DeviceIcon = DEVICE_ICON[deviceMode];
  const showTool = (t: PresentTool) => !tools || tools.includes(t);

  function cycleDevice() {
    const idx = DEVICE_CYCLE.indexOf(deviceMode);
    onDeviceModeChange(DEVICE_CYCLE[(idx + 1) % DEVICE_CYCLE.length]);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
        <Tip label="Undo" side="bottom">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
            aria-label="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </Tip>
        <Tip label="Redo" side="bottom">
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
            aria-label="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </Tip>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
        {showTool("pointer") && (
          <Tip label="Pointer" side="bottom">
            <button
              onClick={() => onToolChange("pointer")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
                tool === "pointer" && "bg-primary/15 text-primary",
              )}
              aria-label="Pointer"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
          </Tip>
        )}
        {showTool("select") && (
          <Tip label="Select element" side="bottom">
            <button
              onClick={() => onToolChange("select")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
                tool === "select" && "bg-primary/15 text-primary",
              )}
              aria-label="Select element"
            >
              <BoxSelect className="h-3.5 w-3.5" />
            </button>
          </Tip>
        )}
        {showTool("edit") && (
          <Tip label="Edit text" side="bottom">
            <button
              onClick={() => onToolChange("edit")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
                tool === "edit" && "bg-primary/15 text-primary",
              )}
              aria-label="Edit text"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Tip>
        )}
        {showDeviceToggle && (
          <Tip label="Device mode" side="bottom">
            <button
              onClick={cycleDevice}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Device mode"
            >
              <DeviceIcon className="h-3.5 w-3.5" />
            </button>
          </Tip>
        )}
      </div>
    </div>
  );
}
