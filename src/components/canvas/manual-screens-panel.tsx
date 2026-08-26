"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Search, Square, Circle, Triangle, Diamond, Spline, Type as TypeIcon, ImageIcon } from "lucide-react";
import {
  DEVICE_CATALOG,
  DEVICE_CATEGORIES,
  type SketchDevice,
  type SketchDeviceCategory,
} from "@/lib/sketch-devices";
import type { ManualElement, ManualFrame } from "@/components/canvas/manual-types";
import { cn } from "@/lib/utils";

type View = "empty" | "categories" | "devices" | "list";

const KIND_ICON = {
  rect: Square,
  roundedRect: Square,
  diamond: Diamond,
  circle: Circle,
  triangle: Triangle,
  text: TypeIcon,
  image: ImageIcon,
  path: Spline,
};

export function ManualScreensPanel({
  frames,
  elements,
  selectedElementId,
  onAddFrame,
  onClose,
  onRenameFrame,
  onSelectElement,
}: {
  frames: ManualFrame[];
  elements: ManualElement[];
  selectedElementId: string | null;
  onAddFrame: (device: SketchDevice) => void;
  onClose: () => void;
  onRenameFrame: (id: string, name: string) => void;
  onSelectElement: (id: string) => void;
}) {
  const [view, setView] = useState<View>(frames.length > 0 ? "list" : "empty");
  const [category, setCategory] = useState<SketchDeviceCategory>("Mobile");
  const [hoveredDevice, setHoveredDevice] = useState<SketchDevice | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
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
              <button onClick={() => setView("categories")} aria-label="Add screen">
                <Plus className="h-4 w-4" />
              </button>
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
            <p className="mt-1 text-xs text-muted-foreground">Add your first screen to start editing</p>
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
            <div className="flex items-center gap-2 py-1.5 text-sm font-medium text-primary">{category}</div>
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
                onClick={() => setCategory(cat)}
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
                style={{ width: Math.min(70, hoveredDevice.width / 5.5), height: Math.min(150, hoveredDevice.height / 5.5) }}
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
              <button onClick={() => setView("categories")} aria-label="Add screen">
                <Plus className="h-4 w-4" />
              </button>
              <Search className="h-4 w-4" />
            </div>
          </div>
          <p className="mb-1 px-1 text-[10px] tracking-wide text-muted-foreground uppercase">
            {frames.length} screens
          </p>
          <div className="max-h-[380px] overflow-y-auto">
            {frames.map((f, i) => {
              const layers = elements.filter((el) => el.frameId === f.id);
              const expanded = expandedFrameId === f.id;
              return (
                <div key={f.id}>
                  <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary">
                    <button
                      onClick={() => setExpandedFrameId(expanded ? null : f.id)}
                      className="shrink-0 text-muted-foreground"
                      aria-label="Toggle layers"
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !expanded && "-rotate-90")} />
                    </button>
                    <span className="w-5 shrink-0 text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
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
                      <span onDoubleClick={() => setRenamingId(f.id)} className="flex-1 truncate" title="Double-click to rename">
                        {f.name}
                      </span>
                    )}
                  </div>
                  {expanded && (
                    <div className="ml-6 space-y-0.5 border-l border-border/60 pl-2">
                      {layers.length === 0 ? (
                        <p className="py-1 text-xs text-muted-foreground">No layers yet</p>
                      ) : (
                        layers.map((el) => {
                          const Icon = KIND_ICON[el.kind];
                          return (
                            <button
                              key={el.id}
                              onClick={() => onSelectElement(el.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs hover:bg-secondary",
                                selectedElementId === el.id && "bg-primary/15 text-primary",
                              )}
                            >
                              <Icon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{el.name}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
