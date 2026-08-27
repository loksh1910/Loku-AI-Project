"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SketchDevice } from "@/lib/sketch-devices";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import type { VariationId } from "@/components/present/health-app/theme";
import { CANVAS_DEVICE_H, ROW_GAP } from "@/components/canvas/canvas-types";
import { buildHealthScreensManual, CANONICAL_SCREEN_NAMES } from "@/components/canvas/manual-health-seed";
import { ManualScreensPanel } from "@/components/canvas/manual-screens-panel";
import { ManualBottomToolbar, type ManualTool } from "@/components/canvas/manual-bottom-toolbar";
import { ManualRightToolbar, PANELS, type PanelKey } from "@/components/canvas/manual-right-toolbar";
import { ManualTopTools, type BooleanOp } from "@/components/canvas/manual-top-tools";
import {
  newManualElement,
  newManualFrame,
  newManualPath,
  type FlowDirection,
  type ManualElement,
  type ManualFrame,
} from "@/components/canvas/manual-types";
import type { FlowNodeShape } from "@/components/canvas/flow-types";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const VARIATION_IDS: VariationId[] = ["bold", "playful", "minimal"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

type Selection = { kind: "frame"; id: string } | { kind: "element"; id: string } | null;
type DragState = { id: string; startX: number; startY: number; startClientX: number; startClientY: number };
type ResizeState = { id: string; corner: "nw" | "ne" | "sw" | "se"; startX: number; startY: number; startW: number; startH: number; startClientX: number; startClientY: number };
type FrameDraft = { startX: number; startY: number; x: number; y: number; w: number; h: number };
type PenDraft = { frameId: string; points: { x: number; y: number }[] };

type Snapshot = { frames: ManualFrame[]; elements: ManualElement[] };

function clientToLocal(clientX: number, clientY: number, rect: DOMRect, pan: { x: number; y: number }, zoom: number) {
  return {
    x: (clientX - rect.left - rect.width / 2 - pan.x) / zoom,
    y: (clientY - rect.top - rect.height / 2 - pan.y) / zoom,
  };
}

export function ManualEditView({
  frames,
  elements,
  onFramesChange,
  onElementsChange,
  onCommit,
  onBeginChange,
  onUndo,
  onRedo,
  screensOpen,
  onScreensOpenChange,
}: {
  frames: ManualFrame[];
  elements: ManualElement[];
  onFramesChange: (frames: ManualFrame[]) => void;
  onElementsChange: (elements: ManualElement[]) => void;
  onCommit: (updater: (prev: Snapshot) => Snapshot) => void;
  onBeginChange: () => void;
  onUndo: () => void;
  onRedo: () => void;
  screensOpen: boolean;
  onScreensOpenChange: (open: boolean) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomPct, setZoomPct] = useState(100);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const zoomRef = useRef(zoom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const frameResizeRef = useRef<ResizeState | null>(null);

  const [tool, setTool] = useState<ManualTool>("pointer");
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelKey | null>(null);
  const [defaultColor, setDefaultColor] = useState("#D9D9D9");
  const [frameDraft, setFrameDraft] = useState<FrameDraft | null>(null);
  const [penDraft, setPenDraft] = useState<PenDraft | null>(null);
  const [variations, setVariations] = useState<VariationId[]>(["bold"]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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
        setPenDraft(null);
        setFrameDraft(null);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0) return;
        e.preventDefault();
        onCommit((prev) => ({
          frames: prev.frames.filter((f) => !selectedIds.includes(f.id)),
          elements: prev.elements.filter((el) => !selectedIds.includes(el.id) && !selectedIds.includes(el.frameId)),
        }));
        setSelectedIds([]);
        setSelection(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, onUndo, onRedo, onCommit]);

  function selectSingle(kind: "frame" | "element", id: string) {
    setSelection({ kind, id });
    setSelectedIds([id]);
  }

  function handleViewportPointerDown(e: React.PointerEvent) {
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (tool === "frame" && e.target === e.currentTarget) {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const p = clientToLocal(e.clientX, e.clientY, rect, pan, zoom);
      setFrameDraft({ startX: p.x, startY: p.y, x: p.x, y: p.y, w: 0, h: 0 });
      return;
    }
    if (e.target === e.currentTarget) {
      setSelection(null);
      setSelectedIds([]);
    }
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
    if (frameDraft) {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const p = clientToLocal(e.clientX, e.clientY, rect, pan, zoom);
      setFrameDraft({
        ...frameDraft,
        x: Math.min(frameDraft.startX, p.x),
        y: Math.min(frameDraft.startY, p.y),
        w: Math.abs(p.x - frameDraft.startX),
        h: Math.abs(p.y - frameDraft.startY),
      });
    }
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = (e.clientX - d.startClientX) / zoom;
      const dy = (e.clientY - d.startClientY) / zoom;
      if (selection?.kind === "frame") {
        onFramesChange(frames.map((f) => (f.id === d.id ? { ...f, x: d.startX + dx, y: d.startY + dy } : f)));
      } else {
        onElementsChange(elements.map((el) => (el.id === d.id ? { ...el, x: d.startX + dx, y: d.startY + dy } : el)));
      }
    }
    if (resizeRef.current) {
      const r = resizeRef.current;
      const dx = (e.clientX - r.startClientX) / zoom;
      const dy = (e.clientY - r.startClientY) / zoom;
      let { startX: x, startY: y, startW: w, startH: h } = r;
      if (r.corner === "se") {
        w = Math.max(8, r.startW + dx);
        h = Math.max(8, r.startH + dy);
      } else if (r.corner === "sw") {
        w = Math.max(8, r.startW - dx);
        h = Math.max(8, r.startH + dy);
        x = r.startX + (r.startW - w);
      } else if (r.corner === "ne") {
        w = Math.max(8, r.startW + dx);
        h = Math.max(8, r.startH - dy);
        y = r.startY + (r.startH - h);
      } else {
        w = Math.max(8, r.startW - dx);
        h = Math.max(8, r.startH - dy);
        x = r.startX + (r.startW - w);
        y = r.startY + (r.startH - h);
      }
      onElementsChange(elements.map((el) => (el.id === r.id ? { ...el, x, y, w, h } : el)));
    }
    if (frameResizeRef.current) {
      const r = frameResizeRef.current;
      const dx = (e.clientX - r.startClientX) / zoom;
      const dy = (e.clientY - r.startClientY) / zoom;
      let { startX: x, startY: y, startW: w, startH: h } = r;
      if (r.corner === "se") {
        w = Math.max(60, r.startW + dx);
        h = Math.max(60, r.startH + dy);
      } else if (r.corner === "sw") {
        w = Math.max(60, r.startW - dx);
        h = Math.max(60, r.startH + dy);
        x = r.startX + (r.startW - w);
      } else if (r.corner === "ne") {
        w = Math.max(60, r.startW + dx);
        h = Math.max(60, r.startH - dy);
        y = r.startY + (r.startH - h);
      } else {
        w = Math.max(60, r.startW - dx);
        h = Math.max(60, r.startH - dy);
        x = r.startX + (r.startW - w);
        y = r.startY + (r.startH - h);
      }
      onFramesChange(frames.map((f) => (f.id === r.id ? { ...f, x, y, device: { ...f.device, width: w, height: h } } : f)));
    }
  }

  function handleViewportPointerUp() {
    panStart.current = null;
    dragRef.current = null;
    resizeRef.current = null;
    frameResizeRef.current = null;
    if (frameDraft && frameDraft.w > 20 && frameDraft.h > 20) {
      const device: SketchDevice = { label: "Frame", width: Math.round(frameDraft.w), height: Math.round(frameDraft.h) };
      const newFrame = { ...newManualFrame(device, frameDraft.x, `Frame ${frames.length + 1}`), y: frameDraft.y };
      onCommit((prev) => ({ frames: [...prev.frames, newFrame], elements: prev.elements }));
      selectSingle("frame", newFrame.id);
      setPanel("layout");
      setTool("pointer");
    }
    setFrameDraft(null);
  }

  function frameLocalPoint(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  }

  function handleFramePointerDown(e: React.PointerEvent, frame: ManualFrame) {
    if (tool === "hand" || tool === "frame") return;

    if (tool === "text") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      const id = uid("el");
      const el = { ...newManualElement(frame.id, "text", p.x, p.y, 120, 24), id, fill: "transparent" };
      onCommit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
      selectSingle("element", el.id);
      setEditingTextId(el.id);
      setTool("pointer");
      return;
    }

    if (tool === "pen") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      setPenDraft((prev) => (prev && prev.frameId === frame.id ? { ...prev, points: [...prev.points, p] } : { frameId: frame.id, points: [p] }));
      return;
    }

    e.stopPropagation();
    selectSingle("frame", frame.id);
    onBeginChange();
    dragRef.current = { id: frame.id, startX: frame.x, startY: frame.y, startClientX: e.clientX, startClientY: e.clientY };
  }

  function handleFrameDoubleClick(e: React.MouseEvent, frame: ManualFrame) {
    if (tool === "pen" && penDraft && penDraft.frameId === frame.id) {
      e.stopPropagation();
      if (penDraft.points.length > 2) {
        const path = newManualPath(frame.id, penDraft.points);
        onCommit((prev) => ({ frames: prev.frames, elements: [...prev.elements, path] }));
      }
      setPenDraft(null);
      setTool("pointer");
    }
  }

  function startElementDrag(e: React.PointerEvent, el: ManualElement) {
    if (tool === "select") {
      e.stopPropagation();
      setSelectedIds((prev) => (prev.includes(el.id) ? prev.filter((id) => id !== el.id) : [...prev, el.id]));
      return;
    }
    if (tool !== "pointer") return;
    e.stopPropagation();
    selectSingle("element", el.id);
    onBeginChange();
    dragRef.current = { id: el.id, startX: el.x, startY: el.y, startClientX: e.clientX, startClientY: e.clientY };
  }

  function startResize(e: React.PointerEvent, el: ManualElement, corner: "nw" | "ne" | "sw" | "se") {
    e.stopPropagation();
    onBeginChange();
    resizeRef.current = { id: el.id, corner, startX: el.x, startY: el.y, startW: el.w, startH: el.h, startClientX: e.clientX, startClientY: e.clientY };
  }

  function startFrameResize(e: React.PointerEvent, frame: ManualFrame, corner: "nw" | "ne" | "sw" | "se") {
    e.stopPropagation();
    onBeginChange();
    frameResizeRef.current = {
      id: frame.id,
      corner,
      startX: frame.x,
      startY: frame.y,
      startW: frame.device.width,
      startH: frame.device.height,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  }

  function addShape(shape: FlowNodeShape) {
    const targetFrame = frames.find((f) => f.id === (selection?.kind === "frame" ? selection.id : elements.find((el) => el.id === selection?.id)?.frameId)) ?? frames[0];
    if (!targetFrame) return;
    const isSquareish = shape === "circle" || shape === "diamond" || shape === "triangle";
    const w = isSquareish ? 100 : 140;
    const h = isSquareish ? 100 : 80;
    const el = newManualElement(targetFrame.id, shape, targetFrame.device.width / 2 - w / 2, targetFrame.device.height / 2 - h / 2, w, h);
    el.fill = defaultColor;
    onCommit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
    selectSingle("element", el.id);
  }

  function addFrame(device: SketchDevice) {
    const lastX = frames.length ? Math.max(...frames.map((f) => f.x + f.device.width)) + 80 : 0;
    const frame = newManualFrame(device, lastX, `Screen ${frames.length + 1}`);
    onCommit((prev) => ({ frames: [...prev.frames, frame], elements: prev.elements }));
    selectSingle("frame", frame.id);
  }

  // Mirrors AI mode's own Variations menu: each checked variation is a full,
  // independently editable row of the 6 seed screens (real theme colors/radii,
  // not just a label) stacked below the others. Only the 6 auto-managed seed
  // frames participate — a freeform frame drawn with the Frame tool, or a
  // screen the user has renamed, is left alone regardless of its variation tag.
  function applyVariations(newIds: VariationId[]) {
    const orderedNew = VARIATION_IDS.filter((v) => newIds.includes(v));
    const isManagedRow = (f: ManualFrame) => CANONICAL_SCREEN_NAMES.includes(f.name);
    onCommit((prev) => {
      const removedFrameIds = new Set(
        prev.frames.filter((f) => isManagedRow(f) && !orderedNew.includes(f.variation)).map((f) => f.id),
      );
      // Re-anchor every kept managed row to its current slot (elements are
      // frame-relative, so only the frame's own y needs to move) — this keeps
      // toggling variations off and back on from ever leaving two rows
      // overlapping at the same y.
      const keptFrames = prev.frames
        .filter((f) => !removedFrameIds.has(f.id))
        .map((f) => (isManagedRow(f) ? { ...f, y: orderedNew.indexOf(f.variation) * (CANVAS_DEVICE_H + ROW_GAP) } : f));
      const keptElements = prev.elements.filter((el) => !removedFrameIds.has(el.frameId));
      const presentVariations = new Set(keptFrames.filter(isManagedRow).map((f) => f.variation));
      const missing = orderedNew.filter((v) => !presentVariations.has(v));
      const added = missing.map((v) => buildHealthScreensManual(v, orderedNew.indexOf(v)));
      return {
        frames: [...keptFrames, ...added.flatMap((a) => a.frames)],
        elements: [...keptElements, ...added.flatMap((a) => a.elements)],
      };
    });
    setVariations(orderedNew);
  }

  function renameFrame(id: string, name: string) {
    onFramesChange(frames.map((f) => (f.id === id ? { ...f, name } : f)));
  }

  function updateSelectedFrame(patch: Partial<ManualFrame>) {
    const frameId = selection?.kind === "frame" ? selection.id : elements.find((el) => el.id === selection?.id)?.frameId;
    if (!frameId) return;
    onCommit((prev) => ({ frames: prev.frames.map((f) => (f.id === frameId ? { ...f, ...patch } : f)), elements: prev.elements }));
  }

  function updateSelectedElement(patch: Partial<ManualElement>) {
    if (selection?.kind !== "element") return;
    onCommit((prev) => ({ frames: prev.frames, elements: prev.elements.map((el) => (el.id === selection.id ? { ...el, ...patch } : el)) }));
  }

  function distributeChildren(direction: Exclude<FlowDirection, "none">) {
    const frameId = selection?.kind === "frame" ? selection.id : elements.find((el) => el.id === selection?.id)?.frameId;
    const frame = frames.find((f) => f.id === frameId);
    if (!frame) return;
    onCommit((prev) => {
      const children = prev.elements.filter((el) => el.frameId === frameId);
      let cursor = direction === "horizontal" ? frame.paddingH : frame.paddingV;
      const updated = children.map((el) => {
        const patch = direction === "horizontal" ? { x: cursor, y: frame.paddingV } : { x: frame.paddingH, y: cursor };
        cursor += (direction === "horizontal" ? el.w : el.h) + frame.spacing;
        return { ...el, ...patch };
      });
      return { frames: prev.frames, elements: prev.elements.map((el) => updated.find((u) => u.id === el.id) ?? el) };
    });
  }

  function selectedElements() {
    return elements.filter((el) => selectedIds.includes(el.id));
  }

  function handleBooleanOp(op: BooleanOp) {
    const sel = selectedElements();
    if (sel.length < 2 && op !== "flatten") return;
    if (sel.length < 1) return;
    const minX = Math.min(...sel.map((e) => e.x));
    const minY = Math.min(...sel.map((e) => e.y));
    const maxX = Math.max(...sel.map((e) => e.x + e.w));
    const maxY = Math.max(...sel.map((e) => e.y + e.h));
    let x = minX;
    let y = minY;
    let w = maxX - minX;
    let h = maxY - minY;
    if (op === "intersect") {
      x = Math.max(...sel.map((e) => e.x));
      y = Math.max(...sel.map((e) => e.y));
      w = Math.max(8, Math.min(...sel.map((e) => e.x + e.w)) - x);
      h = Math.max(8, Math.min(...sel.map((e) => e.y + e.h)) - y);
    }
    const merged = newManualElement(sel[0].frameId, sel[0].kind, x, y, w, h);
    merged.fill = sel[0].fill;
    merged.name = op === "flatten" ? "Flattened" : sel[0].name;
    onCommit((prev) => ({
      frames: prev.frames,
      elements: [...prev.elements.filter((el) => !selectedIds.includes(el.id)), merged],
    }));
    selectSingle("element", merged.id);
  }

  function createComponent() {
    if (selection?.kind !== "element") return;
    onCommit((prev) => ({
      frames: prev.frames,
      elements: prev.elements.map((el) => (el.id === selection.id ? { ...el, isComponent: true, name: el.isComponent ? el.name : `${el.name} (Component)` } : el)),
    }));
  }

  function createVariant() {
    if (selection?.kind !== "element") return;
    const el = elements.find((e) => e.id === selection.id);
    if (!el) return;
    const variant = { ...el, id: uid("el"), x: el.x + el.w + 30, name: `${el.name.replace(" (Component)", "")} Variant` };
    onCommit((prev) => ({ frames: prev.frames, elements: [...prev.elements, variant] }));
    selectSingle("element", variant.id);
  }

  function toggleMask() {
    if (selection?.kind !== "element") return;
    onCommit((prev) => ({
      frames: prev.frames,
      elements: prev.elements.map((el) => (el.id === selection.id ? { ...el, isMask: !el.isMask } : el)),
    }));
  }

  const selectedFrame = selection?.kind === "frame" ? (frames.find((f) => f.id === selection.id) ?? null) : null;
  const selectedElement = selection?.kind === "element" ? (elements.find((el) => el.id === selection.id) ?? null) : null;
  const parentFrame = selectedElement ? (frames.find((f) => f.id === selectedElement.frameId) ?? null) : selectedFrame;

  // Fill/Appearance also work on a directly-selected frame (its own fill/corner
  // radius), so they're only "unmet" when neither an element nor a frame is selected.
  const panelElementOnly = panel === "typography" || panel === "stroke" || panel === "effects";
  const panelElementOrFrame = panel === "appearance" || panel === "fill";
  const panelNeedsTarget = panel === "position" || panel === "layout";
  const noSelectionMessage =
    panel &&
    ((panelElementOnly && !selectedElement) ||
      (panelElementOrFrame && !selectedElement && !selectedFrame) ||
      (panelNeedsTarget && !parentFrame))
      ? `Select ${panelElementOnly ? "an element" : panelElementOrFrame ? "an element or screen" : "a screen or element"} to edit its ${PANELS.find((p) => p.id === panel)?.label}`
      : null;

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <div
        ref={viewportRef}
        className={cn("absolute inset-0 select-none", tool === "hand" ? "cursor-grab active:cursor-grabbing" : tool === "frame" ? "cursor-crosshair" : "")}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerLeave={handleViewportPointerUp}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {frames.map((frame) => {
            const w = frame.device.width * zoom;
            const h = frame.device.height * zoom;
            const isSelected = selection?.kind === "frame" && selection.id === frame.id;
            return (
              <div key={frame.id} className="absolute" style={{ left: frame.x * zoom, top: frame.y * zoom, width: w, height: h }}>
                {/* Absolutely positioned above the frame box (not stacked in normal flow) so
                    the wrapper's own bounds exactly equal the frame's box bounds — otherwise
                    this label's height would silently shift the box down by a constant, unscaled
                    amount, throwing off alignment between the frame and its canvas-absolute
                    elements (which position purely from frame.x/y) more and more as zoom drops. */}
                <div className="absolute bottom-full left-0 mb-1 w-full">
                  {renamingId === frame.id ? (
                    <input
                      autoFocus
                      defaultValue={frame.name}
                      onBlur={(e) => {
                        renameFrame(frame.id, e.target.value.trim() || frame.name);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="w-32 rounded bg-secondary px-1 py-0.5 text-[11px] outline-none"
                    />
                  ) : (
                    <p onDoubleClick={() => setRenamingId(frame.id)} className="w-fit max-w-full truncate text-[11px] text-muted-foreground">
                      {frame.name}
                    </p>
                  )}
                </div>
                <div
                  onPointerDown={(e) => handleFramePointerDown(e, frame)}
                  onDoubleClick={(e) => handleFrameDoubleClick(e, frame)}
                  className={cn("absolute inset-0 touch-none", isSelected ? "ring-2 ring-primary" : "border border-border/40")}
                  style={{ background: frame.fill, borderRadius: frame.cornerRadius * zoom }}
                >
                  {penDraft && penDraft.frameId === frame.id && (
                    <svg className="pointer-events-none absolute inset-0" width={w} height={h}>
                      <polyline
                        points={penDraft.points.map((p) => `${p.x * zoom},${p.y * zoom}`).join(" ")}
                        fill="none"
                        stroke="#6C5CE7"
                        strokeWidth={2}
                      />
                      {penDraft.points.map((p, i) => (
                        <circle key={i} cx={p.x * zoom} cy={p.y * zoom} r={3} fill="#6C5CE7" />
                      ))}
                    </svg>
                  )}
                </div>
                {isSelected && (
                  <>
                    {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={(e) => startFrameResize(e, frame, corner)}
                        className="absolute rounded-sm border border-primary bg-background"
                        style={{
                          width: 9,
                          height: 9,
                          cursor: `${corner}-resize`,
                          left: corner.includes("w") ? -4.5 : undefined,
                          right: corner.includes("e") ? -4.5 : undefined,
                          top: corner.includes("n") ? -4.5 : undefined,
                          bottom: corner.includes("s") ? -4.5 : undefined,
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}

          {/* Elements render in their own flat, canvas-absolute layer — never
              clipped by their origin frame's box — so dragging one out of its
              screen keeps it fully visible anywhere on the canvas. */}
          {elements.map((el) => {
            const parent = frames.find((f) => f.id === el.frameId);
            if (!parent) return null;
            return (
              <ManualElementView
                key={el.id}
                el={el}
                zoom={zoom}
                originX={parent.x}
                originY={parent.y}
                selected={selectedIds.includes(el.id)}
                editing={editingTextId === el.id}
                onPointerDownDrag={(e) => startElementDrag(e, el)}
                onStartResize={(e, corner) => startResize(e, el, corner)}
                onDoubleClickText={() => el.kind !== "path" && setEditingTextId(el.id)}
                onCommitText={(text) => {
                  onCommit((prev) => ({ frames: prev.frames, elements: prev.elements.map((e2) => (e2.id === el.id ? { ...e2, text } : e2)) }));
                  setEditingTextId(null);
                }}
              />
            );
          })}

          {frameDraft && (
            <div
              className="absolute border-2 border-dashed border-primary bg-primary/10"
              style={{ left: frameDraft.x * zoom, top: frameDraft.y * zoom, width: frameDraft.w * zoom, height: frameDraft.h * zoom }}
            />
          )}
        </div>
      </div>

      {noSelectionMessage && (
        <div className="absolute top-16 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-lg">
          {noSelectionMessage}
        </div>
      )}

      {screensOpen && (
        <ManualScreensPanel
          frames={frames}
          elements={elements}
          selectedElementId={selectedElement?.id ?? null}
          onAddFrame={addFrame}
          onClose={() => onScreensOpenChange(false)}
          onRenameFrame={renameFrame}
          onSelectElement={(id) => selectSingle("element", id)}
        />
      )}

      <div className="absolute top-4 right-5 z-30 flex items-center gap-2">
        <ManualTopTools
          onCreateComponent={createComponent}
          onCreateVariant={createVariant}
          onToggleMask={toggleMask}
          masked={!!selectedElement?.isMask}
          onBooleanOp={handleBooleanOp}
        />
        <CanvasVariationsMenu variationIds={VARIATION_IDS} active={variations} onApply={applyVariations} />
      </div>

      <ManualRightToolbar
        frame={parentFrame}
        directFrame={selectedFrame}
        element={selectedElement}
        onUpdateFrame={updateSelectedFrame}
        onUpdateElement={updateSelectedElement}
        onDistribute={distributeChildren}
        panel={panel}
        onPanelChange={setPanel}
      />

      <ManualBottomToolbar
        tool={tool}
        onToolChange={setTool}
        onAddShape={addShape}
        defaultColor={defaultColor}
        onDefaultColorChange={setDefaultColor}
      />

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
}

function ManualElementView({
  el,
  zoom,
  originX,
  originY,
  selected,
  editing,
  onPointerDownDrag,
  onStartResize,
  onDoubleClickText,
  onCommitText,
}: {
  el: ManualElement;
  zoom: number;
  originX: number;
  originY: number;
  selected: boolean;
  editing: boolean;
  onPointerDownDrag: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent, corner: "nw" | "ne" | "sw" | "se") => void;
  onDoubleClickText: () => void;
  onCommitText: (text: string) => void;
}) {
  const HANDLE = 8;
  const scaleX = el.flipH ? -1 : 1;
  const scaleY = el.flipV ? -1 : 1;
  const canvasX = originX + el.x;
  const canvasY = originY + el.y;
  const shapeStyle: React.CSSProperties = {
    left: canvasX * zoom,
    top: canvasY * zoom,
    width: el.w * zoom,
    height: el.h * zoom,
    transform: `rotate(${el.rotation}deg) scale(${scaleX}, ${scaleY})`,
    opacity: el.opacity / 100,
    mixBlendMode: el.blendMode === "normal" ? undefined : el.blendMode,
  };

  if (el.kind === "path" && el.points) {
    return (
      <svg className="absolute" style={{ left: canvasX * zoom, top: canvasY * zoom, width: el.w * zoom || 1, height: el.h * zoom || 1, opacity: el.opacity / 100 }}>
        <polygon
          points={el.points.map((p) => `${(p.x - el.x) * zoom},${(p.y - el.y) * zoom}`).join(" ")}
          fill={el.fill}
          fillOpacity={el.fillOpacity / 100}
          stroke={el.strokeWidth > 0 ? el.stroke : "none"}
          strokeWidth={el.strokeWidth * zoom}
          strokeLinecap={el.strokeCap === "round" ? "round" : el.strokeCap === "square" ? "square" : "butt"}
        />
      </svg>
    );
  }

  const clipPath =
    el.kind === "diamond"
      ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
      : el.kind === "triangle"
        ? "polygon(50% 0%, 0% 100%, 100% 100%)"
        : undefined;

  const radii =
    el.kind === "roundedRect" || el.kind === "rect"
      ? `${el.cornerRadiusTL * zoom}px ${el.cornerRadiusTR * zoom}px ${el.cornerRadiusBR * zoom}px ${el.cornerRadiusBL * zoom}px`
      : el.kind === "circle"
        ? "999px"
        : undefined;

  const boxStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: el.kind === "text" ? "transparent" : el.fillType === "gradient" ? `linear-gradient(135deg, ${el.fill}, ${el.fillTo})` : el.fill,
    opacity: el.kind === "text" ? 1 : el.fillOpacity / 100,
    border: el.strokeWidth > 0 && el.kind !== "text" ? `${Math.max(0.5, el.strokeWidth * zoom)}px solid ${el.stroke}` : undefined,
    borderRadius: radii,
    clipPath,
  };
  if (el.hasShadow) {
    const inset = el.effectType === "innerShadow" ? "inset " : "";
    boxStyle.boxShadow = `${inset}${el.shadowX * zoom}px ${el.shadowY * zoom}px ${el.shadowBlur * zoom}px ${el.shadowSpread * zoom}px ${hexToRgba(el.shadowColor, el.shadowOpacity / 100)}`;
  }

  const justify = el.verticalAlign === "top" ? "flex-start" : el.verticalAlign === "bottom" ? "flex-end" : "center";
  const labelStyle: React.CSSProperties = {
    color: el.textColor,
    fontSize: el.fontSize * zoom,
    fontFamily: el.fontFamily,
    fontWeight: el.fontWeight,
    letterSpacing: el.letterSpacing * zoom,
    textAlign: el.textAlign,
    whiteSpace: "pre-line",
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDownDrag(e);
      }}
      onDoubleClick={onDoubleClickText}
      className={cn("absolute cursor-move", selected && "ring-2 ring-primary", el.isMask && "outline outline-1 outline-dashed outline-[#8E51FF]")}
      style={shapeStyle}
    >
      {el.kind === "text" ? (
        editing ? (
          <input
            autoFocus
            defaultValue={el.text}
            onBlur={(e) => onCommitText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            style={{ ...labelStyle, whiteSpace: undefined }}
            className="h-full w-full bg-transparent outline-none"
          />
        ) : (
          <span style={labelStyle} className="pointer-events-none block h-full w-full truncate">
            {el.text}
          </span>
        )
      ) : (
        <div className="relative h-full w-full" onDoubleClick={onDoubleClickText}>
          <div style={boxStyle} />
          {editing ? (
            <input
              autoFocus
              defaultValue={el.text}
              onBlur={(e) => onCommitText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              style={{ ...labelStyle, textAlign: el.textAlign, padding: `0 ${6 * zoom}px` }}
              className="absolute inset-0 h-full w-full bg-transparent outline-none"
            />
          ) : (
            el.text && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
                style={{
                  justifyContent: el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center",
                  alignItems: justify === "flex-start" ? "flex-start" : justify === "flex-end" ? "flex-end" : "center",
                  padding: `0 ${6 * zoom}px`,
                }}
              >
                <span style={labelStyle}>{el.text}</span>
              </div>
            )
          )}
        </div>
      )}
      {selected && (
        <>
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <div
              key={corner}
              onPointerDown={(e) => onStartResize(e, corner)}
              className="absolute rounded-sm border border-primary bg-background"
              style={{
                width: HANDLE,
                height: HANDLE,
                cursor: `${corner}-resize`,
                left: corner.includes("w") ? -HANDLE / 2 : undefined,
                right: corner.includes("e") ? -HANDLE / 2 : undefined,
                top: corner.includes("n") ? -HANDLE / 2 : undefined,
                bottom: corner.includes("s") ? -HANDLE / 2 : undefined,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
