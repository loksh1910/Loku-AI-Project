"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SketchDevice } from "@/lib/sketch-devices";
import { CanvasRightToolbar } from "@/components/canvas/canvas-right-toolbar";
import type { CanvasTool } from "@/components/canvas/canvas-types";
import { ManualElementView } from "@/components/canvas/manual-edit-view";
import { ManualScreensPanel } from "@/components/canvas/manual-screens-panel";
import type { ManualElement, ManualFrame } from "@/components/canvas/manual-types";
import { PrototypeInteractionBox } from "@/components/canvas/prototype-interaction-box";
import { newManualInteraction, type ManualInteraction } from "@/components/canvas/manual-prototype-types";
import { Tip } from "@/components/ui/tip";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const WIRE_PAD = 4000;

type Selection = { kind: "frame" | "element"; id: string } | null;
type ConnectorDrag = {
  fromFrameId: string;
  fromElementId: string | null;
  fromLabel: string;
  fromType: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};
type DragState = { kind: "frame" | "element"; id: string; startX: number; startY: number; startClientX: number; startClientY: number };
type ResizeState = {
  kind: "frame" | "element";
  id: string;
  corner: "nw" | "ne" | "sw" | "se";
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startClientX: number;
  startClientY: number;
};
type Box = { x: number; y: number; w: number; h: number };

function frameBoxOf(f: ManualFrame): Box {
  return { x: f.x, y: f.y, w: f.device.width, h: f.device.height };
}

function elementBoxOf(el: ManualElement, frames: ManualFrame[]): Box | null {
  const parent = frames.find((f) => f.id === el.frameId);
  if (!parent) return null;
  return { x: parent.x + el.x, y: parent.y + el.y, w: el.w, h: el.h };
}

function resizeBox(r: ResizeState, e: { clientX: number; clientY: number }, zoom: number, minSize: number) {
  const dx = (e.clientX - r.startClientX) / zoom;
  const dy = (e.clientY - r.startClientY) / zoom;
  let x = r.startX;
  let y = r.startY;
  let w = r.startW;
  let h = r.startH;
  if (r.corner === "se") {
    w = Math.max(minSize, r.startW + dx);
    h = Math.max(minSize, r.startH + dy);
  } else if (r.corner === "sw") {
    w = Math.max(minSize, r.startW - dx);
    h = Math.max(minSize, r.startH + dy);
    x = r.startX + (r.startW - w);
  } else if (r.corner === "ne") {
    w = Math.max(minSize, r.startW + dx);
    h = Math.max(minSize, r.startH - dy);
    y = r.startY + (r.startH - h);
  } else {
    w = Math.max(minSize, r.startW - dx);
    h = Math.max(minSize, r.startH - dy);
    x = r.startX + (r.startW - w);
    y = r.startY + (r.startH - h);
  }
  return { x, y, w, h };
}

// The Design/Prototype (Start from Scratch) entry's own Prototype tab — wires
// interactions between whatever screens/elements the user drew in Design mode.
// Screens and elements stay fully draggable/resizable here too (same direct-
// manipulation model as Design mode, minus its creation tools — the toolbar
// stays pointer+hand only), so a screen doesn't have to be laid out perfectly
// before you can start prototyping it.
export function ManualPrototypeView({
  frames,
  elements,
  interactions,
  onFramesChange,
  onElementsChange,
  onCommitInteractions,
  onBeginChange,
  onUndo,
  onRedo,
  onAddFrame,
  onRenameFrame,
  screensOpen,
  onScreensOpenChange,
}: {
  frames: ManualFrame[];
  elements: ManualElement[];
  interactions: ManualInteraction[];
  onFramesChange: (frames: ManualFrame[]) => void;
  onElementsChange: (elements: ManualElement[]) => void;
  onCommitInteractions: (updater: (prev: ManualInteraction[]) => ManualInteraction[]) => void;
  onBeginChange: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddFrame: (device: SketchDevice) => void;
  onRenameFrame: (id: string, name: string) => void;
  screensOpen: boolean;
  onScreensOpenChange: (open: boolean) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomPct, setZoomPct] = useState(100);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const zoomRef = useRef(zoom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  // Separate refs per concern (frame vs element, drag vs resize) rather than
  // one polymorphic ref each — matches ManualEditView's own drag/resize refs.
  const frameDragRef = useRef<DragState | null>(null);
  const elementDragRef = useRef<DragState | null>(null);
  const frameResizeRef = useRef<ResizeState | null>(null);
  const elementResizeRef = useRef<ResizeState | null>(null);

  const [tool, setTool] = useState<CanvasTool>("pointer");
  const [selection, setSelection] = useState<Selection>(null);
  const [connectorDrag, setConnectorDrag] = useState<ConnectorDrag | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<{ id: string; x: number; y: number } | null>(null);
  const clipboardRef = useRef<{ kind: "frame"; frame: ManualFrame } | { kind: "element"; element: ManualElement } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => setViewportSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
        setSelection(null);
        setConnectorDrag(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (!selection) return;
        e.preventDefault();
        if (selection.kind === "frame") {
          const f = frames.find((fr) => fr.id === selection.id);
          if (f) clipboardRef.current = { kind: "frame", frame: f };
        } else {
          const el = elements.find((e2) => e2.id === selection.id);
          if (el) clipboardRef.current = { kind: "element", element: el };
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        const clip = clipboardRef.current;
        if (!clip) return;
        e.preventDefault();
        if (clip.kind === "frame") {
          const id = `frame-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newFrame = { ...clip.frame, id, x: clip.frame.x + 30, y: clip.frame.y + 30 };
          onFramesChange([...frames, newFrame]);
          selectFrame(newFrame);
        } else {
          const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const newElement = { ...clip.element, id, x: clip.element.x + 30, y: clip.element.y + 30 };
          onElementsChange([...elements, newElement]);
          selectElement(newElement);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // selectFrame/selectElement aren't memoized (they're plain functions
    // redefined every render), so listing them here would just re-subscribe
    // this listener on every render for no behavioral difference — the
    // listener always calls whatever the latest render defined anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, frames, elements, onFramesChange, onElementsChange, onUndo, onRedo]);

  function toViewport(canvasX: number, canvasY: number) {
    return { x: viewportSize.width / 2 + pan.x + canvasX * zoom, y: viewportSize.height / 2 + pan.y + canvasY * zoom };
  }

  function openAutoInteraction(outgoing: ManualInteraction[], box: Box | null) {
    if (outgoing.length !== 1 || !box) {
      return;
    }
    const p = toViewport(box.x + box.w / 2, box.y + box.h);
    setActiveInteraction({ id: outgoing[0].id, x: p.x + 16, y: p.y });
  }

  function selectFrame(f: ManualFrame) {
    setSelection({ kind: "frame", id: f.id });
    const outgoing = interactions.filter((it) => it.sourceFrameId === f.id && it.sourceElementId === null);
    openAutoInteraction(outgoing, frameBoxOf(f));
  }

  function selectElement(el: ManualElement) {
    setSelection({ kind: "element", id: el.id });
    const outgoing = interactions.filter((it) => it.sourceElementId === el.id);
    openAutoInteraction(outgoing, elementBoxOf(el, frames));
  }

  function handleFramePointerDown(e: React.PointerEvent, f: ManualFrame) {
    // Scroll-wheel (middle) button always pans, even over a frame — let it
    // bubble to the viewport's own pan handler instead of selecting here.
    if (tool === "hand" || e.button === 1) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    selectFrame(f);
    onBeginChange();
    frameDragRef.current = { kind: "frame", id: f.id, startX: f.x, startY: f.y, startClientX: e.clientX, startClientY: e.clientY };
  }

  function handleElementPointerDown(e: React.PointerEvent, el: ManualElement) {
    if (tool === "hand" || e.button === 1) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    selectElement(el);
    onBeginChange();
    elementDragRef.current = { kind: "element", id: el.id, startX: el.x, startY: el.y, startClientX: e.clientX, startClientY: e.clientY };
  }

  function startFrameResize(e: React.PointerEvent, f: ManualFrame, corner: "nw" | "ne" | "sw" | "se") {
    e.stopPropagation();
    onBeginChange();
    frameResizeRef.current = {
      kind: "frame",
      id: f.id,
      corner,
      startX: f.x,
      startY: f.y,
      startW: f.device.width,
      startH: f.device.height,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  }

  function startElementResize(e: React.PointerEvent, el: ManualElement, corner: "nw" | "ne" | "sw" | "se") {
    e.stopPropagation();
    onBeginChange();
    elementResizeRef.current = {
      kind: "element",
      id: el.id,
      corner,
      startX: el.x,
      startY: el.y,
      startW: el.w,
      startH: el.h,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  }

  function handleViewportPointerDown(e: React.PointerEvent) {
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (e.button !== 0) return;
    if (e.target === e.currentTarget) setSelection(null);
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
    if (connectorDrag) {
      const rect = viewportRef.current?.getBoundingClientRect();
      setConnectorDrag({ ...connectorDrag, currentX: e.clientX - (rect?.left ?? 0), currentY: e.clientY - (rect?.top ?? 0) });
    }
    const frameDrag = frameDragRef.current;
    if (frameDrag) {
      const dx = (e.clientX - frameDrag.startClientX) / zoom;
      const dy = (e.clientY - frameDrag.startClientY) / zoom;
      onFramesChange(frames.map((f) => (f.id === frameDrag.id ? { ...f, x: frameDrag.startX + dx, y: frameDrag.startY + dy } : f)));
    }
    const elementDrag = elementDragRef.current;
    if (elementDrag) {
      const dx = (e.clientX - elementDrag.startClientX) / zoom;
      const dy = (e.clientY - elementDrag.startClientY) / zoom;
      onElementsChange(
        elements.map((el) => (el.id === elementDrag.id ? { ...el, x: elementDrag.startX + dx, y: elementDrag.startY + dy } : el)),
      );
    }
    const frameResize = frameResizeRef.current;
    if (frameResize) {
      const { x, y, w, h } = resizeBox(frameResize, e, zoom, 60);
      onFramesChange(
        frames.map((f) => (f.id === frameResize.id ? { ...f, x, y, device: { ...f.device, width: w, height: h } } : f)),
      );
    }
    const elementResize = elementResizeRef.current;
    if (elementResize) {
      const { x, y, w, h } = resizeBox(elementResize, e, zoom, 8);
      onElementsChange(elements.map((el) => (el.id === elementResize.id ? { ...el, x, y, w, h } : el)));
    }
  }

  function handleViewportPointerUp(e: React.PointerEvent) {
    panStart.current = null;
    frameDragRef.current = null;
    elementDragRef.current = null;
    frameResizeRef.current = null;
    elementResizeRef.current = null;
    if (connectorDrag) {
      const dropTarget = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
        "[data-frame-id]",
      ) as HTMLElement | null;
      const targetFrameId = dropTarget?.dataset.frameId;
      if (targetFrameId && targetFrameId !== connectorDrag.fromFrameId) {
        const wire = newManualInteraction(
          connectorDrag.fromFrameId,
          connectorDrag.fromElementId,
          connectorDrag.fromLabel,
          connectorDrag.fromType,
          targetFrameId,
        );
        onCommitInteractions((prev) => [...prev, wire]);
        setActiveInteraction({ id: wire.id, x: connectorDrag.currentX + 16, y: connectorDrag.currentY });
      }
      setConnectorDrag(null);
    }
  }

  function startConnectorDrag(e: React.PointerEvent) {
    if (!selection) return;
    e.stopPropagation();
    const sourceFrameId = selectedFrame ? selectedFrame.id : selectedElement!.frameId;
    const sourceLabel = selectedFrame ? selectedFrame.name : selectedElement!.name;
    const rect = viewportRef.current?.getBoundingClientRect();
    const vx = e.clientX - (rect?.left ?? 0);
    const vy = e.clientY - (rect?.top ?? 0);
    setConnectorDrag({
      fromFrameId: sourceFrameId,
      fromElementId: selectedElement?.id ?? null,
      fromLabel: sourceLabel,
      fromType: selectedFrame ? "Screen" : "Element",
      startX: vx,
      startY: vy,
      currentX: vx,
      currentY: vy,
    });
  }

  function deleteInteraction(id: string) {
    onCommitInteractions((prev) => prev.filter((it) => it.id !== id));
    setActiveInteraction(null);
  }

  const selectedFrame = selection?.kind === "frame" ? (frames.find((f) => f.id === selection.id) ?? null) : null;
  const selectedElement = selection?.kind === "element" ? (elements.find((el) => el.id === selection.id) ?? null) : null;
  const selectedBox = selectedFrame ? frameBoxOf(selectedFrame) : selectedElement ? elementBoxOf(selectedElement, frames) : null;
  const activeInteractionData = activeInteraction ? (interactions.find((it) => it.id === activeInteraction.id) ?? null) : null;

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
          {frames.filter((f) => !f.hidden).map((f) => {
            const isSelected = selection?.kind === "frame" && selection.id === f.id;
            const w = f.device.width * zoom;
            const h = f.device.height * zoom;
            return (
              <div key={f.id} className="absolute" style={{ left: f.x * zoom, top: f.y * zoom, width: w, height: h }}>
                <div
                  data-frame-id={f.id}
                  onPointerDown={(e) => handleFramePointerDown(e, f)}
                  className={cn("absolute inset-0 touch-none", isSelected ? "ring-2 ring-primary" : "border border-border/40")}
                  style={{ background: f.fill, borderRadius: f.cornerRadius * zoom }}
                />
                {isSelected && tool !== "hand" && (
                  <>
                    {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={(e) => startFrameResize(e, f, corner)}
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

          {elements.map((el) => {
            const parent = frames.find((f) => f.id === el.frameId);
            if (parent?.hidden) return null;
            const isSelected = selection?.kind === "element" && selection.id === el.id;
            return (
              <ManualElementView
                key={el.id}
                el={el}
                zoom={zoom}
                originX={parent?.x ?? 0}
                originY={parent?.y ?? 0}
                selected={isSelected && tool !== "hand"}
                editing={false}
                dataFrameId={el.frameId}
                onPointerDownDrag={(e) => handleElementPointerDown(e, el)}
                onStartResize={(e, corner) => startElementResize(e, el, corner)}
                onDoubleClickText={() => {}}
                onCommitText={() => {}}
              />
            );
          })}

          {selectedBox && tool !== "hand" && (
            <div
              className="pointer-events-none absolute"
              style={{ left: selectedBox.x * zoom, top: selectedBox.y * zoom, width: selectedBox.w * zoom, height: selectedBox.h * zoom }}
            >
              <ConnectHandle dir="top" onPointerDown={startConnectorDrag} />
              <ConnectHandle dir="right" onPointerDown={startConnectorDrag} />
              <ConnectHandle dir="bottom" onPointerDown={startConnectorDrag} />
              <ConnectHandle dir="left" onPointerDown={startConnectorDrag} />
            </div>
          )}

          {interactions.length > 0 && (
            <svg
              className="pointer-events-none absolute overflow-visible"
              style={{ left: -WIRE_PAD, top: -WIRE_PAD, width: WIRE_PAD * 2, height: WIRE_PAD * 2 }}
            >
              {interactions.map((it) => {
                const sourceEl = it.sourceElementId ? elements.find((e) => e.id === it.sourceElementId) : null;
                const sourceFrame = frames.find((f) => f.id === it.sourceFrameId);
                const sourceBox = sourceEl ? elementBoxOf(sourceEl, frames) : sourceFrame ? frameBoxOf(sourceFrame) : null;
                const targetFrame = frames.find((f) => f.id === it.targetFrameId);
                if (!sourceBox || !targetFrame) return null;
                const targetBox = frameBoxOf(targetFrame);
                const fx = (sourceBox.x + sourceBox.w / 2) * zoom + WIRE_PAD;
                const fy = (sourceBox.y + sourceBox.h) * zoom + WIRE_PAD;
                const tx = (targetBox.x + targetBox.w / 2) * zoom + WIRE_PAD;
                const ty = targetBox.y * zoom + WIRE_PAD;
                const archHeight = Math.min(60, Math.abs(tx - fx) * 0.15) + 24;
                const d = `M ${fx} ${fy} C ${fx} ${fy + archHeight}, ${tx} ${ty - archHeight}, ${tx} ${ty}`;
                const isActive = activeInteraction?.id === it.id;
                return (
                  <g key={it.id}>
                    <path d={d} fill="none" stroke="#8E51FF" strokeWidth={isActive ? 2.5 : 1.5} opacity={0.9} />
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = viewportRef.current?.getBoundingClientRect();
                        setActiveInteraction({ id: it.id, x: e.clientX - (rect?.left ?? 0) + 16, y: e.clientY - (rect?.top ?? 0) });
                      }}
                    />
                    <rect x={fx - 3} y={fy - 3} width={6} height={6} fill="#8E51FF" />
                    <rect x={tx - 3} y={ty - 3} width={6} height={6} fill="#8E51FF" />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {connectorDrag && (
        <svg className="pointer-events-none absolute inset-0">
          <line
            x1={connectorDrag.startX}
            y1={connectorDrag.startY}
            x2={connectorDrag.currentX}
            y2={connectorDrag.currentY}
            stroke="#8E51FF"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>
      )}

      {frames.length < 2 && (
        <div className="absolute top-16 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-lg">
          Design more than one screen to prototype
        </div>
      )}

      {screensOpen && (
        <ManualScreensPanel
          frames={frames}
          elements={elements}
          selectedElementId={selectedElement?.id ?? null}
          onAddFrame={onAddFrame}
          onClose={() => onScreensOpenChange(false)}
          onRenameFrame={onRenameFrame}
          onSelectElement={(id) => {
            const el = elements.find((e) => e.id === id);
            if (el) selectElement(el);
          }}
          onToggleHidden={(id) => onFramesChange(frames.map((f) => (f.id === id ? { ...f, hidden: !f.hidden } : f)))}
        />
      )}

      <div className="absolute top-1/2 right-5 z-30 -translate-y-1/2">
        <CanvasRightToolbar tool={tool} onToolChange={setTool} tools={["pointer", "hand"]} />
      </div>

      {activeInteraction && activeInteractionData && (
        <PrototypeInteractionBox
          interaction={activeInteractionData}
          targetLabel={frames.find((f) => f.id === activeInteractionData.targetFrameId)?.name ?? "Screen"}
          targetOptions={frames.filter((f) => f.id !== activeInteractionData.sourceFrameId).map((f) => ({ id: f.id, label: f.name }))}
          x={activeInteraction.x}
          y={activeInteraction.y}
          initialMode="manual"
          onChange={(patch) =>
            onCommitInteractions((prev) => prev.map((it) => (it.id === activeInteractionData.id ? { ...it, ...patch } : it)))
          }
          onTargetChange={(id) =>
            onCommitInteractions((prev) => prev.map((it) => (it.id === activeInteractionData.id ? { ...it, targetFrameId: id } : it)))
          }
          onClose={() => setActiveInteraction(null)}
          onDelete={() => deleteInteraction(activeInteractionData.id)}
        />
      )}

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <Tip label="Help">
          <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </Tip>
      </div>
    </div>
  );
}

function ConnectHandle({ dir, onPointerDown }: { dir: "top" | "right" | "bottom" | "left"; onPointerDown: (e: React.PointerEvent) => void }) {
  const posClass = {
    top: "-top-3 left-1/2 -translate-x-1/2",
    bottom: "-bottom-3 left-1/2 -translate-x-1/2",
    left: "-left-3 top-1/2 -translate-y-1/2",
    right: "-right-3 top-1/2 -translate-y-1/2",
  }[dir];
  return (
    <button
      onPointerDown={onPointerDown}
      className={cn(
        "pointer-events-auto absolute z-30 flex h-5 w-5 cursor-crosshair items-center justify-center rounded-full border border-primary bg-popover text-primary hover:bg-primary/10",
        posClass,
      )}
      aria-label={`Connect from ${dir}`}
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}
