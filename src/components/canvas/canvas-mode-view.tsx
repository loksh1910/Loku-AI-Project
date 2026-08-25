"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PresentPanel } from "@/components/present/present-left-rail";
import { PresentScreensPanel } from "@/components/present/present-screens-panel";
import { AiAssistantOverlay } from "@/components/present/ai-assistant-overlay";
import { PresentPromptBar } from "@/components/present/present-prompt-bar";
import { DeviceFrame } from "@/components/present/device-frame";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";
import { HEALTH_SCREENS } from "@/components/present/health-app/screens";
import { CanvasRightToolbar } from "@/components/canvas/canvas-right-toolbar";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import { CANVAS_DEVICE_W, defaultVariationRow, type CanvasItem, type CanvasTool } from "@/components/canvas/canvas-types";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ALL_VARIATIONS: VariationId[] = ["bold", "playful", "minimal"];

type DragState = { instanceId: string; startX: number; startY: number; startClientX: number; startClientY: number };

export function CanvasModeView({
  generationPrompt,
  panel,
  onPanelChange,
  items,
  onItemsChange,
  onCommitItems,
  onBeginItemsChange,
  onUndo,
  onRedo,
}: {
  generationPrompt: string;
  panel: PresentPanel;
  onPanelChange: (panel: PresentPanel) => void;
  items: CanvasItem[];
  onItemsChange: (items: CanvasItem[]) => void;
  onCommitItems: (updater: (prev: CanvasItem[]) => CanvasItem[]) => void;
  onBeginItemsChange: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomPct, setZoomPct] = useState(100);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const zoomRef = useRef(zoom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<CanvasTool>("pointer");
  const [variations, setVariations] = useState<VariationId[]>(() => {
    const present = new Set(
      items.filter((i): i is Extract<CanvasItem, { kind: "screen" }> => i.kind === "screen").map((i) => i.variation),
    );
    const ordered = ALL_VARIATIONS.filter((v) => present.has(v));
    return ordered.length > 0 ? ordered : ["bold"];
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // React's synthetic onWheel handler is passive, so preventDefault() silently
  // fails there — a native listener with { passive: false } is required to
  // stop page scroll while zooming the canvas (same fix as SketchCanvasView).
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current - e.deltaY * 0.001));
      setZoom(next);
      setZoomPct(Math.round(next * 100));
    }
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        onRedo();
        return;
      }
      if (e.key === "Escape") {
        setTool("pointer");
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        onCommitItems((prev) => prev.filter((i) => !selectedIds.includes(i.instanceId)));
        setSelectedIds([]);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, onUndo, onRedo, onCommitItems]);

  function handleViewportPointerDown(e: React.PointerEvent) {
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (e.target === e.currentTarget) setSelectedIds([]);
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = (e.clientX - d.startClientX) / zoom;
      const dy = (e.clientY - d.startClientY) / zoom;
      onItemsChange(
        items.map((it) => (it.instanceId === d.instanceId ? { ...it, x: d.startX + dx, y: d.startY + dy } : it)),
      );
    }
  }

  function handleViewportPointerUp() {
    panStart.current = null;
    dragRef.current = null;
  }

  function handleItemPointerDown(e: React.PointerEvent, item: CanvasItem) {
    if (tool === "hand") return;
    e.stopPropagation();

    if (tool === "select") {
      setSelectedIds((prev) =>
        prev.includes(item.instanceId) ? prev.filter((id) => id !== item.instanceId) : [...prev, item.instanceId],
      );
      return;
    }

    setSelectedIds([item.instanceId]);
    onBeginItemsChange();
    dragRef.current = {
      instanceId: item.instanceId,
      startX: item.x,
      startY: item.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  }

  function applyVariations(newIds: VariationId[]) {
    const orderedNew = ALL_VARIATIONS.filter((v) => newIds.includes(v));
    onCommitItems((prev) => {
      const kept = prev.filter((item) => item.kind !== "screen" || orderedNew.includes(item.variation));
      const keptVariations = new Set(
        kept.filter((i): i is Extract<CanvasItem, { kind: "screen" }> => i.kind === "screen").map((i) => i.variation),
      );
      const missing = orderedNew.filter((v) => !keptVariations.has(v));
      const added = missing.flatMap((v) => defaultVariationRow(v, orderedNew.indexOf(v)));
      return [...kept, ...added];
    });
    setVariations(orderedNew);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const src = URL.createObjectURL(file);
    const w = 220;
    const h = 160;
    const id = `image-${Date.now()}`;
    onCommitItems((prev) => [
      ...prev,
      { instanceId: id, kind: "image", name: file.name.replace(/\.[^.]+$/, ""), src, x: 0, y: -h, w, h },
    ]);
    setSelectedIds([id]);
  }

  const selectedItems = items.filter((i) => selectedIds.includes(i.instanceId));
  const taggedElement =
    selectedItems.length === 0
      ? null
      : selectedItems.length === 1
        ? selectedItems[0].kind === "screen"
          ? `${selectedItems[0].name} (${VARIATION_THEMES[selectedItems[0].variation].label})`
          : selectedItems[0].name
        : `${selectedItems.length} screens selected`;

  const screensActive =
    (items.find((i) => i.kind === "screen") as Extract<CanvasItem, { kind: "screen" }> | undefined)?.screenId ??
    "splash";

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <div
        ref={viewportRef}
        className={cn("absolute inset-0 select-none", tool === "hand" ? "cursor-grab active:cursor-grabbing" : "")}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerLeave={handleViewportPointerUp}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.instanceId);
            const w = item.kind === "screen" ? CANVAS_DEVICE_W : item.w;
            return (
              <div key={item.instanceId} className="absolute" style={{ left: item.x * zoom, top: item.y * zoom }}>
                {renamingId === item.instanceId ? (
                  <input
                    autoFocus
                    defaultValue={item.name}
                    onBlur={(e) => {
                      const name = e.target.value.trim() || item.name;
                      onItemsChange(items.map((i) => (i.instanceId === item.instanceId ? { ...i, name } : i)));
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    style={{ width: Math.max(80, w * zoom) }}
                    className="mb-1 rounded bg-secondary px-1 py-0.5 text-[11px] outline-none"
                  />
                ) : (
                  <p
                    onDoubleClick={() => setRenamingId(item.instanceId)}
                    style={{ width: Math.max(80, w * zoom) }}
                    className="mb-1 truncate text-[11px] text-muted-foreground"
                    title="Double-click to rename"
                  >
                    {item.name}
                  </p>
                )}

                <div
                  onPointerDown={(e) => handleItemPointerDown(e, item)}
                  className={cn(
                    "origin-top-left touch-none",
                    isSelected && (item.kind === "screen" ? "rounded-[36px] ring-2 ring-primary" : "rounded-lg ring-2 ring-primary"),
                  )}
                  style={{ transform: `scale(${zoom})` }}
                >
                  {item.kind === "screen" ? (
                    (() => {
                      const ScreenComponent = HEALTH_SCREENS[item.screenId].Component;
                      return (
                        <DeviceFrame mode="mobile">
                          <ScreenComponent theme={VARIATION_THEMES[item.variation]} onNavigate={() => {}} />
                        </DeviceFrame>
                      );
                    })()
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- item.src is a local blob: URL from file upload, next/image's optimizer can't fetch it
                    <img
                      src={item.src}
                      alt=""
                      className="pointer-events-none rounded-lg object-cover"
                      style={{ width: item.w, height: item.h }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute top-4 right-5 z-30">
        <CanvasVariationsMenu variationIds={ALL_VARIATIONS} active={variations} onApply={applyVariations} />
      </div>

      <div className="absolute top-1/2 right-5 z-30 -translate-y-1/2">
        <CanvasRightToolbar tool={tool} onToolChange={setTool} onAddFiles={() => fileInputRef.current?.click()} />
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilesSelected} />

      <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
        {panel === "screens" && (
          <PresentScreensPanel
            active={screensActive}
            onSelect={(id) => {
              const match = items.find((i) => i.kind === "screen" && i.screenId === id);
              if (match) setSelectedIds([match.instanceId]);
            }}
          />
        )}
        {panel === "aichat" && <AiAssistantOverlay prompt={generationPrompt} onClose={() => onPanelChange(null)} />}
        {panel === "split" && (
          <>
            <PresentScreensPanel
              active={screensActive}
              onSelect={(id) => {
                const match = items.find((i) => i.kind === "screen" && i.screenId === id);
                if (match) setSelectedIds([match.instanceId]);
              }}
            />
            <AiAssistantOverlay prompt={generationPrompt} />
          </>
        )}
      </div>

      <PresentPromptBar taggedElement={taggedElement} onClearTag={() => setSelectedIds([])} />

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
