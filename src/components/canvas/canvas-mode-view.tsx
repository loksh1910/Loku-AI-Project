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
import { HEALTH_SCREENS, type HealthScreenId } from "@/components/present/health-app/screens";
import { WIREFRAME_SCREENS } from "@/components/present/health-app/wireframe-screens";
import { CanvasRightToolbar } from "@/components/canvas/canvas-right-toolbar";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import { CANVAS_DEVICE_W, SCREEN_ORDER, defaultVariationRow, type CanvasItem, type CanvasTool } from "@/components/canvas/canvas-types";
import type { PipelineTab } from "@/components/canvas/canvas-pipeline-bar";
import { ShowAllFlowToggle } from "@/components/canvas/show-all-flow-toggle";
import { PrototypePromptBar } from "@/components/canvas/prototype-prompt-bar";
import { PrototypeInteractionBox } from "@/components/canvas/prototype-interaction-box";
import { INTERACTION_TEMPLATES, type ApplyOn, type PrototypeInteraction } from "@/components/canvas/prototype-types";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ALL_VARIATIONS: VariationId[] = ["bold", "playful", "minimal"];
// The wire layer is a sibling of the pannable content, itself anchored at a
// 0-size point (top-1/2 left-1/2) — giving it a real, generously oversized
// box (rather than relying on an svg's own overflow-visible) means wire arcs
// never get silently clipped regardless of where screens sit in the canvas.
const WIRE_CANVAS_PAD = 4000;

type DragState = { instanceId: string; startX: number; startY: number; startClientX: number; startClientY: number };
type ScreenItem = Extract<CanvasItem, { kind: "screen" }>;

function isScreenItem(item: CanvasItem): item is ScreenItem {
  return item.kind === "screen";
}

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
  pipelineTab,
  overlay,
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
  pipelineTab: PipelineTab;
  /** The Start from Scratch (AI prompt) entry's own pre-generation questions/building
   * overlays — rendered inside this component's already-correctly-sized root instead
   * of wrapping it from outside, which would break its flex-1 sizing (see the
   * Sitemap/User-Flow "flow" viewMode fix for why that wrapping is a real footgun here). */
  overlay?: React.ReactNode;
}) {
  const isPrototype = pipelineTab === "prototype";
  const isWireframe = pipelineTab === "wireframe";
  // The wire/interaction system (Show all flow, connector wires, the
  // Interaction float box) is shared by Prototype and Wireframe — only the
  // toolbar restriction and the bottom bar swap are Prototype-only.
  const hasFlowWires = isPrototype || isWireframe;

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
    const present = new Set(items.filter(isScreenItem).map((i) => i.variation));
    const ordered = ALL_VARIATIONS.filter((v) => present.has(v));
    return ordered.length > 0 ? ordered : ["bold"];
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Prototype-mode state
  const [showAllFlow, setShowAllFlow] = useState(false);
  const [focusedInstanceId, setFocusedInstanceId] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<PrototypeInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<{ id: string; x: number; y: number } | null>(null);
  const [applyOn, setApplyOn] = useState<ApplyOn>("actions");
  const [selectingPending, setSelectingPending] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);
  const [confirmedSelection, setConfirmedSelection] = useState<string[]>([]);

  useEffect(() => {
    // Prototype's toolbar only exposes pointer + hand — if the user had
    // "select" or "edit" active in AI/Wireframe mode and switches into
    // Prototype, fall back to pointer since that tool no longer exists.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to a valid tool when entering a mode whose toolbar no longer includes the current tool, not deriving per-render state
    if (isPrototype && tool !== "pointer" && tool !== "hand") setTool("pointer");
  }, [isPrototype, tool]);

  // Reconciles the editable interaction list against whatever screen instances
  // currently exist (drag/delete/variation changes don't touch this — only
  // membership does), while preserving any interaction the user has edited.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived interactions to the current set of screen instances, not per-render state
    setInteractions((prev) => {
      const screenItems = items.filter(isScreenItem);
      const presentIds = new Set(screenItems.map((i) => i.instanceId));
      const kept = prev.filter((it) => presentIds.has(it.sourceInstanceId) && presentIds.has(it.targetInstanceId));
      const keptIds = new Set(kept.map((it) => it.id));
      const added: PrototypeInteraction[] = [];
      screenItems.forEach((item) => {
        INTERACTION_TEMPLATES.filter((t) => t.sourceScreenId === item.screenId).forEach((t) => {
          const targetItem = screenItems.find((i) => i.variation === item.variation && i.screenId === t.targetScreenId);
          if (!targetItem) return;
          const id = `${item.instanceId}->${t.id}`;
          if (keptIds.has(id)) return;
          added.push({ ...t, id, sourceInstanceId: item.instanceId, targetInstanceId: targetItem.instanceId });
        });
      });
      if (added.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...added];
    });
  }, [items]);

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
    if (e.target === e.currentTarget) {
      setSelectedIds([]);
      setFocusedInstanceId(null);
    }
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

    if (isPrototype && selectingPending) {
      setPendingSelection((prev) =>
        prev.includes(item.instanceId) ? prev.filter((id) => id !== item.instanceId) : [...prev, item.instanceId],
      );
      return;
    }

    if (tool === "select") {
      setSelectedIds((prev) =>
        prev.includes(item.instanceId) ? prev.filter((id) => id !== item.instanceId) : [...prev, item.instanceId],
      );
      return;
    }

    setSelectedIds([item.instanceId]);
    if (hasFlowWires) {
      setFocusedInstanceId(item.instanceId);
      const outgoing = interactions.filter((it) => it.sourceInstanceId === item.instanceId);
      if (outgoing.length === 1) {
        const rect = viewportRef.current?.getBoundingClientRect();
        setActiveInteraction({
          id: outgoing[0].id,
          x: (rect?.width ?? 0) / 2 + pan.x + (item.x + CANVAS_DEVICE_W / 2) * zoom + 16,
          y: (rect?.height ?? 0) / 2 + pan.y + item.y * zoom,
        });
      } else {
        setActiveInteraction(null);
      }
    }
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
      const keptVariations = new Set(kept.filter(isScreenItem).map((i) => i.variation));
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

  function handleApplyOnChange(next: ApplyOn) {
    setApplyOn(next);
    setActiveInteraction(null);
    if (next === "actions") {
      setShowAllFlow(true);
      setSelectingPending(false);
    } else if (next === "elements") {
      setShowAllFlow(false);
      setSelectingPending(false);
    } else {
      setShowAllFlow(false);
      setPendingSelection([]);
      setSelectingPending(true);
    }
  }

  function confirmPendingSelection() {
    setConfirmedSelection(pendingSelection);
    setSelectingPending(false);
  }

  const screenItemsList = items.filter(isScreenItem);
  const anchorFor = (instanceId: string, indexInGroup: number, groupSize: number) => {
    const item = screenItemsList.find((i) => i.instanceId === instanceId);
    if (!item) return null;
    const spread = (indexInGroup - (groupSize - 1) / 2) * 16;
    return {
      x: (item.x + CANVAS_DEVICE_W / 2) * zoom + spread + WIRE_CANVAS_PAD,
      y: item.y * zoom + WIRE_CANVAS_PAD,
    };
  };

  const visibleInteractions = showAllFlow
    ? interactions
    : interactions.filter((it) => it.sourceInstanceId === focusedInstanceId);

  const outgoingCountByScreen = new Map<string, number>();
  const outgoingIndexByInteraction = new Map<string, number>();
  visibleInteractions.forEach((it) => {
    const n = outgoingCountByScreen.get(it.sourceInstanceId) ?? 0;
    outgoingIndexByInteraction.set(it.id, n);
    outgoingCountByScreen.set(it.sourceInstanceId, n + 1);
  });

  const selectedItems = items.filter((i) => selectedIds.includes(i.instanceId));
  const taggedElement =
    selectedItems.length === 0
      ? null
      : selectedItems.length === 1
        ? selectedItems[0].kind === "screen"
          ? `${selectedItems[0].name} (${VARIATION_THEMES[selectedItems[0].variation].label})`
          : selectedItems[0].name
        : `${selectedItems.length} screens selected`;

  const prototypeTag =
    applyOn === "selected"
      ? confirmedSelection.length > 0
        ? `${confirmedSelection.length} selected`
        : null
      : null;

  const screensActive = screenItemsList[0]?.screenId ?? "splash";

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
            const dimmed =
              isPrototype &&
              selectingPending &&
              item.kind === "screen" &&
              !pendingSelection.includes(item.instanceId);
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
                    "origin-top-left touch-none transition-opacity",
                    isSelected && (item.kind === "screen" ? "rounded-[36px] ring-2 ring-primary" : "rounded-lg ring-2 ring-primary"),
                    dimmed && "opacity-25",
                    isPrototype && selectingPending && pendingSelection.includes(item.instanceId) && "rounded-[36px] ring-2 ring-primary",
                  )}
                  style={{ transform: `scale(${zoom})` }}
                >
                  {item.kind === "screen" ? (
                    (() => {
                      if (isWireframe) {
                        const WireframeComponent = WIREFRAME_SCREENS[item.screenId];
                        return (
                          <DeviceFrame mode="mobile">
                            <WireframeComponent />
                          </DeviceFrame>
                        );
                      }
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

          {hasFlowWires && visibleInteractions.length > 0 && (
            <svg
              className="pointer-events-none absolute overflow-visible"
              style={{ left: -WIRE_CANVAS_PAD, top: -WIRE_CANVAS_PAD, width: WIRE_CANVAS_PAD * 2, height: WIRE_CANVAS_PAD * 2 }}
            >
              {visibleInteractions.map((it) => {
                const groupSize = outgoingCountByScreen.get(it.sourceInstanceId) ?? 1;
                const idx = outgoingIndexByInteraction.get(it.id) ?? 0;
                const from = anchorFor(it.sourceInstanceId, idx, groupSize);
                const to = anchorFor(it.targetInstanceId, 0, 1);
                if (!from || !to) return null;
                const archHeight = Math.min(60, Math.abs(to.x - from.x) * 0.15) + 24;
                const d = `M ${from.x} ${from.y} C ${from.x} ${from.y - archHeight}, ${to.x} ${to.y - archHeight}, ${to.x} ${to.y}`;
                const isActive = activeInteraction?.id === it.id;
                return (
                  <g key={it.id}>
                    <path
                      d={d}
                      fill="none"
                      stroke="#8E51FF"
                      strokeWidth={isActive ? 2.5 : 1.5}
                      opacity={activeInteraction && !isActive ? 0.35 : 0.9}
                    />
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        const rect = viewportRef.current?.getBoundingClientRect();
                        setActiveInteraction({
                          id: it.id,
                          x: e.clientX - (rect?.left ?? 0) + 16,
                          y: e.clientY - (rect?.top ?? 0),
                        });
                      }}
                    />
                    <rect x={from.x - 3} y={from.y - 3} width={6} height={6} fill="#8E51FF" />
                    <rect x={to.x - 3} y={to.y - 3} width={6} height={6} fill="#8E51FF" />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-5 z-30">
        <CanvasVariationsMenu variationIds={ALL_VARIATIONS} active={variations} onApply={applyVariations} />
      </div>

      <div
        className="absolute top-1/2 right-5 z-30 -translate-y-1/2"
      >
        <CanvasRightToolbar
          tool={tool}
          onToolChange={setTool}
          onAddFiles={() => fileInputRef.current?.click()}
          tools={isPrototype ? ["pointer", "hand"] : undefined}
        />
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilesSelected} />

      <div className="absolute top-6 left-6 z-30 flex flex-col items-start gap-3">
        {hasFlowWires && <ShowAllFlowToggle checked={showAllFlow} onChange={setShowAllFlow} />}
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

      {isPrototype && selectingPending && (
        <div className="absolute top-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/60 bg-card py-1.5 pr-1.5 pl-4 text-xs">
          Select elements or interactions to apply changes
          <button
            onClick={confirmPendingSelection}
            className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Select ({pendingSelection.length})
          </button>
        </div>
      )}

      {hasFlowWires && activeInteraction && (
        <PrototypeInteractionBox
          interaction={interactions.find((it) => it.id === activeInteraction.id)!}
          targetLabel={HEALTH_SCREENS[interactions.find((it) => it.id === activeInteraction.id)!.targetScreenId].name}
          targetOptions={SCREEN_ORDER.map((id) => ({ id, label: HEALTH_SCREENS[id].name }))}
          x={activeInteraction.x}
          y={activeInteraction.y}
          onChange={(patch) =>
            setInteractions((prev) => prev.map((it) => (it.id === activeInteraction.id ? { ...it, ...patch } : it)))
          }
          onTargetChange={(id) =>
            setInteractions((prev) =>
              prev.map((it) => (it.id === activeInteraction.id ? { ...it, targetScreenId: id as HealthScreenId } : it)),
            )
          }
          onClose={() => setActiveInteraction(null)}
        />
      )}

      {isPrototype ? (
        <PrototypePromptBar
          applyOn={applyOn}
          onApplyOnChange={handleApplyOnChange}
          totalCount={INTERACTION_TEMPLATES.length}
          selectedCount={confirmedSelection.length}
          taggedElement={prototypeTag}
          onClearTag={() => setConfirmedSelection([])}
        />
      ) : (
        <PresentPromptBar taggedElement={taggedElement} onClearTag={() => setSelectedIds([])} />
      )}

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

      {overlay}
    </div>
  );
}
