"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, ChevronRight, Eye, MoreHorizontal } from "lucide-react";
import {
  DEVICE_CATALOG,
  DEVICE_CATEGORIES,
  type SketchDevice,
  type SketchDeviceCategory,
} from "@/lib/sketch-devices";
import type { SketchFrame } from "@/components/sketch/sketch-types";
import { Tip } from "@/components/ui/tip";

type View = "empty" | "categories" | "devices" | "list";

export function ScreensPanel({
  frames,
  onAddFrame,
  onClose,
  onRenameFrame,
}: {
  frames: SketchFrame[];
  onAddFrame: (device: SketchDevice) => void;
  onClose: () => void;
  onRenameFrame: (id: string, name: string) => void;
}) {
  const [view, setView] = useState<View>(frames.length > 0 ? "list" : "empty");
  const [category, setCategory] = useState<SketchDeviceCategory>("Mobile");
  const [hoveredDevice, setHoveredDevice] = useState<SketchDevice | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="absolute top-14 left-3 z-30 flex overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-2xl"
    >
      {view === "empty" && (
        <div className="w-[280px] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Screens</h3>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tip label="Add screen">
                <button onClick={() => setView("categories")} aria-label="Add screen">
                  <Plus className="h-4 w-4" />
                </button>
              </Tip>
              <Search className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="relative mb-4 h-16 w-20">
              <div className="absolute top-2 left-0 h-16 w-12 -rotate-6 rounded-md border border-primary/50 bg-primary/10" />
              <div className="absolute top-0 left-4 h-16 w-12 rotate-3 rounded-md border border-primary/60 bg-primary/20" />
              <div className="absolute top-1 left-8 flex h-16 w-12 items-center justify-center rounded-md border border-dashed border-primary bg-card">
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium">No screens yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first screen to start Sketching
            </p>
            <button
              onClick={() => setView("categories")}
              className="mt-4 flex items-center gap-1.5 rounded-full border border-primary/50 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first screen
            </button>
          </div>
        </div>
      )}

      {view === "categories" && (
        <div className="w-[280px] p-4">
          <h3 className="mb-3 text-sm font-semibold">Screens</h3>
          <nav className="flex flex-col">
            {DEVICE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setView("devices");
                }}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm hover:bg-secondary"
              >
                {cat}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </nav>
        </div>
      )}

      {view === "devices" && (
        <>
          <div className="w-[280px] p-4">
            <h3 className="mb-1 text-sm font-semibold">Screens</h3>
            <button
              onClick={() => setView("categories")}
              className="mb-2 text-left text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 py-1.5 text-sm font-medium text-primary">
              {category}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {DEVICE_CATALOG[category].map((d) => (
                <button
                  key={d.label}
                  onMouseEnter={() => setHoveredDevice(d)}
                  onMouseLeave={() => setHoveredDevice(null)}
                  onClick={() => {
                    onAddFrame(d);
                    setView("list");
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
                >
                  {d.label}
                  <span className="text-xs text-muted-foreground">
                    {d.width} x {d.height}
                  </span>
                </button>
              ))}
            </div>
            {DEVICE_CATEGORIES.filter((c) => c !== category).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary"
              >
                {cat}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          {hoveredDevice && (
            <div className="flex w-[160px] flex-col items-center justify-center gap-2 border-l border-border/60 bg-card p-4">
              <div
                className="rounded-xl border-2 border-foreground bg-background"
                style={{
                  width: Math.min(70, hoveredDevice.width / 5.5),
                  height: Math.min(150, hoveredDevice.height / 5.5),
                }}
              />
              <p className="text-center text-xs font-medium">{hoveredDevice.label}</p>
              <p className="text-center text-[10px] text-muted-foreground">
                {hoveredDevice.width} x {hoveredDevice.height}
              </p>
            </div>
          )}
        </>
      )}

      {view === "list" && (
        <div className="w-[280px] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Screens</h3>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tip label="Add screen">
                <button onClick={() => setView("categories")} aria-label="Add screen">
                  <Plus className="h-4 w-4" />
                </button>
              </Tip>
              <Search className="h-4 w-4" />
            </div>
          </div>
          <p className="mb-1 px-1 text-[10px] tracking-wide text-muted-foreground uppercase">
            User Flow · {frames.length} screens
          </p>
          <div className="max-h-[320px] overflow-y-auto">
            {frames.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
              >
                <span className="w-5 shrink-0 text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {renamingId === f.id ? (
                  <input
                    autoFocus
                    defaultValue={f.name}
                    onBlur={(e) => {
                      onRenameFrame(f.id, e.target.value.trim() || f.name);
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="flex-1 rounded bg-secondary px-1 py-0.5 text-sm outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={() => setRenamingId(f.id)}
                    className="flex-1 truncate"
                    title="Double-click to rename"
                  >
                    {f.name}
                  </span>
                )}
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
