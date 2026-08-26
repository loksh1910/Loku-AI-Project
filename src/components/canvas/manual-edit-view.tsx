"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SketchDevice } from "@/lib/sketch-devices";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import type { VariationId } from "@/components/present/health-app/theme";
import { ManualScreensPanel } from "@/components/canvas/manual-screens-panel";
import { ManualBottomToolbar, type ManualTool } from "@/components/canvas/manual-bottom-toolbar";
import { ManualRightToolbar, type PanelKey } from "@/components/canvas/manual-right-toolbar";
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
  }

  function handleViewportPointerUp() {
    panStart.current = null;
    dragRef.current = null;
    resizeRef.current = null;
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
      let cursor = frame.padding;
      const updated = children.map((el) => {
        const patch = direction === "horizontal" ? { x: cursor, y: frame.padding } : { x: frame.padding, y: cursor };
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
            const frameElements = elements.filter((el) => el.frameId === frame.id);
            const isSelected = selection?.kind === "frame" && selection.id === frame.id;
            return (
              <div key={frame.id} className="absolute" style={{ left: frame.x * zoom, top: frame.y * zoom, width: w }}>
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
                    className="mb-1 w-32 rounded bg-secondary px-1 py-0.5 text-[11px] outline-none"
                  />
                ) : (
                  <p onDoubleClick={() => setRenamingId(frame.id)} className="mb-1 w-fit max-w-full truncate text-[11px] text-muted-foreground">
                    {frame.name}
                  </p>
                )}
                <div
                  onPointerDown={(e) => handleFramePointerDown(e, frame)}
                  onDoubleClick={(e) => handleFrameDoubleClick(e, frame)}
                  className={cn(
                    "relative touch-none bg-white",
                    frame.clipContent && "overflow-hidden",
                    isSelected ? "ring-2 ring-primary" : "border border-border/40",
                  )}
                  style={{ width: w, height: h }}
                >
                  {frameElements.map((el) => (
                    <ManualElementView
                      key={el.id}
                      el={el}
                      zoom={zoom}
                      selected={selectedIds.includes(el.id)}
                      editing={editingTextId === el.id}
                      onPointerDownDrag={(e) => startElementDrag(e, el)}
                      onStartResize={(e, corner) => startResize(e, el, corner)}
                      onDoubleClickText={() => el.kind === "text" && setEditingTextId(el.id)}
                      onCommitText={(text) => {
                        onCommit((prev) => ({ frames: prev.frames, elements: prev.elements.map((e2) => (e2.id === el.id ? { ...e2, text } : e2)) }));
                        setEditingTextId(null);
                      }}
                    />
                  ))}
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
              </div>
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
        <CanvasVariationsMenu variationIds={VARIATION_IDS} active={variations} onApply={setVariations} />
      </div>

      <ManualRightToolbar
        frame={parentFrame}
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

      {!screensOpen && (
        <button
          onClick={() => onScreensOpenChange(true)}
          className="absolute top-14 left-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:bg-secondary"
          aria-label="Open Screens"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ManualElementView({
  el,
  zoom,
  selected,
  editing,
  onPointerDownDrag,
  onStartResize,
  onDoubleClickText,
  onCommitText,
}: {
  el: ManualElement;
  zoom: number;
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
  const shapeStyle: React.CSSProperties = {
    left: el.x * zoom,
    top: el.y * zoom,
    width: el.w * zoom,
    height: el.h * zoom,
    transform: `rotate(${el.rotation}deg) scale(${scaleX}, ${scaleY})`,
    opacity: el.opacity / 100,
    mixBlendMode: el.blendMode === "normal" ? undefined : el.blendMode,
  };

  if (el.kind === "path" && el.points) {
    const minX = el.x;
    const minY = el.y;
    return (
      <svg className="absolute" style={{ left: minX * zoom, top: minY * zoom, width: el.w * zoom || 1, height: el.h * zoom || 1, opacity: el.opacity / 100 }}>
        <polygon
          points={el.points.map((p) => `${(p.x - minX) * zoom},${(p.y - minY) * zoom}`).join(" ")}
          fill={el.fill}
          fillOpacity={el.fillOpacity / 100}
          stroke={el.strokeWidth > 0 ? el.stroke : "none"}
          strokeWidth={el.strokeWidth}
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

  const boxStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: el.kind === "text" ? "transparent" : el.fill,
    opacity: el.kind === "text" ? 1 : el.fillOpacity / 100,
    border: el.strokeWidth > 0 && el.kind !== "text" ? `${el.strokeWidth}px solid ${el.stroke}` : undefined,
    borderRadius: el.kind === "roundedRect" ? el.cornerRadius : el.kind === "circle" ? 999 : el.kind === "rect" ? el.cornerRadius : undefined,
    clipPath,
    boxShadow: el.hasShadow ? `${el.shadowX}px ${el.shadowY}px ${el.shadowBlur}px rgba(0,0,0,0)` : undefined,
  };
  if (el.hasShadow) {
    const c = el.shadowColor;
    const alpha = el.shadowOpacity / 100;
    boxStyle.boxShadow = `${el.shadowX}px ${el.shadowY}px ${el.shadowBlur}px ${hexToRgba(c, alpha)}`;
  }

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDownDrag(e);
      }}
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
            style={{ color: el.fill === "transparent" ? "#111111" : el.fill, fontSize: el.fontSize * zoom, fontFamily: el.fontFamily, fontWeight: el.fontWeight, textAlign: el.textAlign }}
            className="h-full w-full bg-transparent outline-none"
          />
        ) : (
          <span
            onDoubleClick={onDoubleClickText}
            style={{
              display: "block",
              color: "#111111",
              fontSize: el.fontSize * zoom,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              lineHeight: `${el.lineHeight * zoom}px`,
              letterSpacing: el.letterSpacing,
              textAlign: el.textAlign,
            }}
            className="pointer-events-none block h-full w-full truncate"
          >
            {el.text}
          </span>
        )
      ) : (
        <div style={boxStyle} />
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
