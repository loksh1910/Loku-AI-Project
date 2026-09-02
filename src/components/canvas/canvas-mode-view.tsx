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
import { HEALTH_SCREENS, type HealthScreenId, type TextOverrides } from "@/components/present/health-app/screens";
import { WIREFRAME_SCREENS } from "@/components/present/health-app/wireframe-screens";
import { CanvasRightToolbar } from "@/components/canvas/canvas-right-toolbar";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import { CANVAS_DEVICE_W, CANVAS_DEVICE_H, SCREEN_ORDER, defaultVariationRow, type CanvasItem, type CanvasTool } from "@/components/canvas/canvas-types";
import type { PipelineTab } from "@/components/canvas/canvas-pipeline-bar";
import { ShowAllFlowToggle } from "@/components/canvas/show-all-flow-toggle";
import { PrototypePromptBar } from "@/components/canvas/prototype-prompt-bar";
import { PrototypeInteractionBox } from "@/components/canvas/prototype-interaction-box";
import { CanvasBackgroundPicker } from "@/components/canvas/canvas-background-picker";
import { INTERACTION_TEMPLATES, type ApplyOn, type PrototypeInteraction } from "@/components/canvas/prototype-types";
import { Tip } from "@/components/ui/tip";
import { rectsIntersect } from "@/lib/utils";
import { computeAlignSnap, computeNeighborGaps, gapBetween, unionRect, DEFAULT_SNAP_PX, type AlignLine, type GapSegment, type GuideRect } from "@/lib/alignment-guides";
import { AlignmentGuidesOverlay } from "@/components/canvas/alignment-guides-overlay";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ALL_VARIATIONS: VariationId[] = ["bold", "playful", "minimal"];
// The wire layer is a sibling of the pannable content, itself anchored at a
// 0-size point (top-1/2 left-1/2) — giving it a real, generously oversized
// box (rather than relying on an svg's own overflow-visible) means wire arcs
// never get silently clipped regardless of where screens sit in the canvas.
const WIRE_CANVAS_PAD = 4000;

type DragState = { startClientX: number; startClientY: number; items: { instanceId: string; startX: number; startY: number }[] };
type ScreenItem = Extract<CanvasItem, { kind: "screen" }>;

function isScreenItem(item: CanvasItem): item is ScreenItem {
  return item.kind === "screen";
}

function itemRect(item: CanvasItem): GuideRect {
  return { x: item.x, y: item.y, w: item.kind === "screen" ? CANVAS_DEVICE_W : item.w, h: item.kind === "screen" ? CANVAS_DEVICE_H : item.h };
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
  // null = follow the app's own light/dark background — a manual override
  // lets a white-themed screen stay visible against a light canvas, etc.
  const [canvasBg, setCanvasBg] = useState<string | null>(null);
  const [variations, setVariations] = useState<VariationId[]>(() => {
    const present = new Set(items.filter(isScreenItem).map((i) => i.variation));
    const ordered = ALL_VARIATIONS.filter((v) => present.has(v));
    return ordered.length > 0 ? ordered : ["bold"];
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [hiddenScreenIds, setHiddenScreenIds] = useState<Set<HealthScreenId>>(new Set());
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const clipboardRef = useRef<CanvasItem[]>([]);
  // Text edited via the "edit" tool (AI mode only — Wireframe has no real
  // text to edit) and the label tagged via the "select" tool, keyed
  // separately from whole-item selection since picking a sub-element (e.g. a
  // button) is a different concept from selecting the screen instance itself.
  const [textOverrides, setTextOverrides] = useState<TextOverrides>({});
  const [elementTag, setElementTag] = useState<string | null>(null);
  // Figma-style smart guides: dragGuides is live only while a drag is in
  // progress (screen-to-screen alignment + gap distance to the nearest
  // neighbor); altGuides is the separate Alt-hover measurement between the
  // current selection and whatever's under the pointer, with no dragging
  // involved at all.
  const [dragGuides, setDragGuides] = useState<{ lines: AlignLine[]; gaps: GapSegment[] }>({ lines: [], gaps: [] });
  const [altPressed, setAltPressed] = useState(false);
  const [hoverInstanceId, setHoverInstanceId] = useState<string | null>(null);
  // Tracked as state (not read from dragRef.current during render) since a
  // lint rule here forbids accessing ref values at render time — this only
  // needs to gate the Alt-hover computation below.
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    // A sub-element tag only makes sense while the tool that produced it is
    // still active — leaving "select" (switching tools, Escape) clears it.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing a tagged sub-element when leaving the tool that produced it, not deriving per-render state
    if (tool !== "select") setElementTag(null);
  }, [tool]);

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

  // Alt-hover measurement: holding Alt while hovering another screen shows
  // the distance from it to whatever's currently selected. Releasing Alt (or
  // losing window focus mid-hold, which never fires a keyup) always clears
  // the guides so they never get stuck on screen.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // preventDefault stops the browser's own bare-Alt menu-focus shortcut
      // from firing, which can otherwise steal focus mid-hold and cut off
      // the hover's mouse events before Alt is released.
      if (e.key === "Alt") {
        e.preventDefault();
        setAltPressed(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "Alt") setAltPressed(false);
    }
    function handleBlur() {
      setAltPressed(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

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
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        clipboardRef.current = items.filter((i) => selectedIds.includes(i.instanceId));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboardRef.current.length === 0) return;
        e.preventDefault();
        const pasted = clipboardRef.current.map((i) => ({
          ...i,
          instanceId: `${i.instanceId}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          x: i.x + 30,
          y: i.y + 30,
        }));
        onCommitItems((prev) => [...prev, ...pasted]);
        setSelectedIds(pasted.map((i) => i.instanceId));
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, items, onUndo, onRedo, onCommitItems]);

  function handleViewportPointerDown(e: React.PointerEvent) {
    // Scroll-wheel (middle) button always pans — left button is reserved for
    // picking/marquee-selecting.
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (e.button !== 0) return;
    if (e.target === e.currentTarget) {
      if (!e.shiftKey) {
        setSelectedIds([]);
        setFocusedInstanceId(null);
        setElementTag(null);
      }
      if (tool === "pointer") {
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect) {
          const p = { x: (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom, y: (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom };
          marqueeStartRef.current = p;
          setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
        }
      }
    }
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    // The pointer event's own altKey flag is the source of truth for
    // Alt-hover — it always reflects the OS's real modifier state, unlike a
    // separate global keydown/keyup listener for "Alt" alone, which some
    // browsers intercept for their own menu-focus shortcut before it ever
    // reaches the page.
    if (e.altKey !== altPressed) setAltPressed(e.altKey);
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
    if (marqueeStartRef.current) {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const start = marqueeStartRef.current;
        const p = { x: (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom, y: (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom };
        const x = Math.min(start.x, p.x);
        const y = Math.min(start.y, p.y);
        const w = Math.abs(p.x - start.x);
        const h = Math.abs(p.y - start.y);
        setMarquee({ x, y, w, h });
        const hits = items
          .filter((it) => !(it.kind === "screen" && hiddenScreenIds.has(it.screenId)))
          .filter((it) => rectsIntersect(x, y, w, h, it.x, it.y, it.kind === "screen" ? CANVAS_DEVICE_W : it.w, it.kind === "screen" ? CANVAS_DEVICE_H : it.h))
          .map((it) => it.instanceId);
        setSelectedIds(hits);
      }
    }
    if (dragRef.current) {
      const d = dragRef.current;
      const rawDx = (e.clientX - d.startClientX) / zoom;
      const rawDy = (e.clientY - d.startClientY) / zoom;
      const draggedIds = new Set(d.items.map((it) => it.instanceId));
      const others = items.filter((it) => !draggedIds.has(it.instanceId) && !(it.kind === "screen" && hiddenScreenIds.has(it.screenId))).map(itemRect);
      // The whole dragged selection snaps as one shape (its collective bounds),
      // not each screen independently — same as Figma's group-drag behavior.
      const movingBox = unionRect(d.items.map((it) => ({ x: it.startX + rawDx, y: it.startY + rawDy, w: CANVAS_DEVICE_W, h: CANVAS_DEVICE_H })));
      let dx = rawDx;
      let dy = rawDy;
      let lines: AlignLine[] = [];
      let gaps: GapSegment[] = [];
      if (movingBox) {
        const snap = computeAlignSnap(movingBox, others, DEFAULT_SNAP_PX / zoom);
        dx = rawDx + snap.dx;
        dy = rawDy + snap.dy;
        lines = snap.lines;
        gaps = computeNeighborGaps({ ...movingBox, x: movingBox.x + snap.dx, y: movingBox.y + snap.dy }, others);
      }
      setDragGuides({ lines, gaps });
      const byId = new Map(d.items.map((it) => [it.instanceId, it]));
      onItemsChange(
        items.map((it) => (byId.has(it.instanceId) ? { ...it, x: byId.get(it.instanceId)!.startX + dx, y: byId.get(it.instanceId)!.startY + dy } : it)),
      );
    }
  }

  function handleViewportPointerUp() {
    panStart.current = null;
    dragRef.current = null;
    marqueeStartRef.current = null;
    setMarquee(null);
    setDragGuides({ lines: [], gaps: [] });
    setIsDragging(false);
  }

  function handleItemPointerDown(e: React.PointerEvent, item: CanvasItem) {
    if (tool === "hand" || e.button === 1) return;
    if (e.button !== 0) return;
    e.stopPropagation();

    if (isPrototype && selectingPending) {
      setPendingSelection((prev) =>
        prev.includes(item.instanceId) ? prev.filter((id) => id !== item.instanceId) : [...prev, item.instanceId],
      );
      return;
    }

    if (tool === "select") {
      // Clicking a non-tagged spot on the screen (blank canvas within the
      // frame) falls through to here from the sub-element handlers above
      // (which all stopPropagation when they fire) — clear any sub-element
      // tag so it doesn't linger stale while a whole-item selection replaces it.
      setElementTag(null);
      setSelectedIds((prev) =>
        prev.includes(item.instanceId) ? prev.filter((id) => id !== item.instanceId) : [...prev, item.instanceId],
      );
      return;
    }

    const nextSelectedIds = e.shiftKey
      ? selectedIds.includes(item.instanceId)
        ? selectedIds.filter((id) => id !== item.instanceId)
        : [...selectedIds, item.instanceId]
      : selectedIds.includes(item.instanceId) && selectedIds.length > 1
        ? selectedIds
        : [item.instanceId];
    setSelectedIds(nextSelectedIds);
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
    setIsDragging(true);
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      items: items.filter((it) => nextSelectedIds.includes(it.instanceId)).map((it) => ({ instanceId: it.instanceId, startX: it.x, startY: it.y })),
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

  function handleTextChange(id: string, text: string) {
    setTextOverrides((prev) => ({ ...prev, [id]: text }));
  }

  function handleSelectScreenElement(item: CanvasItem, label: string) {
    setElementTag(`${label} (${item.name})`);
    setSelectedIds([]);
  }

  function toggleScreenHidden(id: HealthScreenId) {
    setHiddenScreenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
    elementTag ??
    (selectedItems.length === 0
      ? null
      : selectedItems.length === 1
        ? selectedItems[0].kind === "screen"
          ? `${selectedItems[0].name} (${VARIATION_THEMES[selectedItems[0].variation].label})`
          : selectedItems[0].name
        : `${selectedItems.length} screens selected`);

  const prototypeTag =
    applyOn === "selected"
      ? confirmedSelection.length > 0
        ? `${confirmedSelection.length} selected`
        : null
      : null;

  const screensActive = screenItemsList[0]?.screenId ?? "splash";

  // Alt-hover measurement: only while Alt is held, not mid-drag (that's the
  // drag-time snap guides' job), with something selected and something else
  // hovered. selectedItems is the whole current selection treated as one
  // shape, matching the same "group as one box" convention as drag-snapping.
  const altGaps: GapSegment[] = (() => {
    if (!altPressed || isDragging || selectedItems.length === 0 || !hoverInstanceId) return [];
    if (selectedIds.includes(hoverInstanceId)) return [];
    const hovered = items.find((it) => it.instanceId === hoverInstanceId);
    if (!hovered) return [];
    const selectedBox = unionRect(selectedItems.map(itemRect));
    if (!selectedBox) return [];
    const res = gapBetween(selectedBox, itemRect(hovered));
    return [res.x, res.y].filter((g): g is GapSegment => !!g);
  })();

  return (
    <div className="relative flex-1 overflow-hidden bg-background" style={canvasBg ? { background: canvasBg } : undefined}>
      <div
        ref={viewportRef}
        className={cn("absolute inset-0 select-none", tool === "hand" ? "cursor-grab active:cursor-grabbing" : "")}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerLeave={handleViewportPointerUp}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {items.filter((item) => !(item.kind === "screen" && hiddenScreenIds.has(item.screenId))).map((item) => {
            const isSelected = selectedIds.includes(item.instanceId);
            const w = item.kind === "screen" ? CANVAS_DEVICE_W : item.w;
            const h = item.kind === "screen" ? CANVAS_DEVICE_H : item.h;
            const dimmed =
              isPrototype &&
              selectingPending &&
              item.kind === "screen" &&
              !pendingSelection.includes(item.instanceId);
            return (
              <div
                key={item.instanceId}
                className="absolute"
                style={{ left: item.x * zoom, top: item.y * zoom }}
                onPointerEnter={(e) => {
                  setHoverInstanceId(item.instanceId);
                  if (e.altKey !== altPressed) setAltPressed(e.altKey);
                }}
                onPointerLeave={() => setHoverInstanceId((h) => (h === item.instanceId ? null : h))}
              >
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

                {/* The ring lives on this outer, non-transformed wrapper —
                    sized directly in final (already-zoomed) pixels — rather
                    than on the `scale()`'d element itself. A box-shadow-based
                    ring drawn on a scaled element gets its own thickness
                    scaled too (and can drift a pixel or two off the visible
                    edge at fractional zoom levels); sizing an unscaled box to
                    the same post-zoom dimensions keeps the ring pixel-perfect
                    and a constant 2px at any zoom. */}
                <div
                  className={cn(
                    "relative",
                    isSelected && (item.kind === "screen" ? "rounded-[36px] ring-2 ring-primary" : "rounded-lg ring-2 ring-primary"),
                    isPrototype && selectingPending && pendingSelection.includes(item.instanceId) && "rounded-[36px] ring-2 ring-primary",
                  )}
                  style={{ width: w * zoom, height: h * zoom }}
                >
                  <div
                    onPointerDown={(e) => handleItemPointerDown(e, item)}
                    className={cn("origin-top-left touch-none transition-opacity", dimmed && "opacity-25")}
                    style={{ transform: `scale(${zoom})` }}
                  >
                    {item.kind === "screen" ? (
                      (() => {
                        if (isWireframe) {
                          const WireframeComponent = WIREFRAME_SCREENS[item.screenId];
                          return (
                            <DeviceFrame mode="mobile">
                              <WireframeComponent
                                selectable={tool === "select"}
                                onSelectElement={(label) => handleSelectScreenElement(item, label)}
                              />
                            </DeviceFrame>
                          );
                        }
                        const ScreenComponent = HEALTH_SCREENS[item.screenId].Component;
                        return (
                          <DeviceFrame mode="mobile">
                            <ScreenComponent
                              theme={VARIATION_THEMES[item.variation]}
                              onNavigate={() => {}}
                              editable={tool === "edit"}
                              overrides={textOverrides}
                              onTextChange={handleTextChange}
                              selectable={tool === "select"}
                              onSelectElement={(label) => handleSelectScreenElement(item, label)}
                            />
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
              </div>
            );
          })}

          {marquee && (
            <div
              className="pointer-events-none absolute border border-primary bg-primary/10"
              style={{ left: marquee.x * zoom, top: marquee.y * zoom, width: marquee.w * zoom, height: marquee.h * zoom }}
            />
          )}

          <AlignmentGuidesOverlay lines={dragGuides.lines} gaps={dragGuides.gaps} zoom={zoom} />
          <AlignmentGuidesOverlay lines={[]} gaps={altGaps} zoom={zoom} />

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
            hiddenIds={hiddenScreenIds}
            onToggleHidden={toggleScreenHidden}
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
        <PresentPromptBar
          taggedElement={taggedElement}
          onClearTag={() => {
            setSelectedIds([]);
            setElementTag(null);
          }}
        />
      )}

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <CanvasBackgroundPicker value={canvasBg} onChange={setCanvasBg} />
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <Tip label="Help">
          <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </Tip>
      </div>

      {overlay}
    </div>
  );
}
