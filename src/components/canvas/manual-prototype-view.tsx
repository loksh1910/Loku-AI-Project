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
type Box = { x: number; y: number; w: number; h: number };

function frameBoxOf(f: ManualFrame): Box {
  return { x: f.x, y: f.y, w: f.device.width, h: f.device.height };
}

function elementBoxOf(el: ManualElement, frames: ManualFrame[]): Box | null {
  const parent = frames.find((f) => f.id === el.frameId);
  if (!parent) return null;
  return { x: parent.x + el.x, y: parent.y + el.y, w: el.w, h: el.h };
}

// The Design/Prototype (Start from Scratch) entry's own Prototype tab — wires
// interactions between whatever screens/elements the user drew in Design mode.
// A parallel to CanvasModeView's Prototype pipeline tab, but built against
// freeform ManualFrame/ManualElement content instead of the fixed HealthVisor
// screen set, and against genuinely user-created connections (drag a handle to
// a target screen) instead of a pre-authored INTERACTION_TEMPLATES table.
export function ManualPrototypeView({
  frames,
  elements,
  interactions,
  onCommit,
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
  onCommit: (updater: (prev: ManualInteraction[]) => ManualInteraction[]) => void;
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

  const [tool, setTool] = useState<CanvasTool>("pointer");
  const [selection, setSelection] = useState<Selection>(null);
  const [connectorDrag, setConnectorDrag] = useState<ConnectorDrag | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<{ id: string; x: number; y: number } | null>(null);

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
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo]);

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

  function handleViewportPointerDown(e: React.PointerEvent) {
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
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
  }

  function handleViewportPointerUp(e: React.PointerEvent) {
    panStart.current = null;
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
        onCommit((prev) => [...prev, wire]);
        setActiveInteraction({ id: wire.id, x: connectorDrag.currentX + 16, y: connectorDrag.currentY });
      }
      setConnectorDrag(null);
    }
  }

  function startConnectorDrag(e: React.PointerEvent) {
    if (!selection) return;
    e.stopPropagation();
    onBeginChange();
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
          {frames.map((f) => (
            <div
              key={f.id}
              data-frame-id={f.id}
              onPointerDown={(e) => {
                if (tool === "hand") return;
                e.stopPropagation();
                selectFrame(f);
              }}
              className={cn(
                "absolute touch-none",
                selection?.kind === "frame" && selection.id === f.id ? "ring-2 ring-primary" : "border border-border/40",
              )}
              style={{
                left: f.x * zoom,
                top: f.y * zoom,
                width: f.device.width * zoom,
                height: f.device.height * zoom,
                background: f.fill,
                borderRadius: f.cornerRadius * zoom,
              }}
            />
          ))}

          {elements.map((el) => (
            <ManualElementView
              key={el.id}
              el={el}
              zoom={zoom}
              originX={frames.find((f) => f.id === el.frameId)?.x ?? 0}
              originY={frames.find((f) => f.id === el.frameId)?.y ?? 0}
              selected={false}
              editing={false}
              dataFrameId={el.frameId}
              onPointerDownDrag={(e) => {
                if (tool === "hand") return;
                e.stopPropagation();
                selectElement(el);
              }}
              onStartResize={() => {}}
              onDoubleClickText={() => {}}
              onCommitText={() => {}}
            />
          ))}

          {selectedBox && tool !== "hand" && (
            <div
              className="absolute"
              style={{ left: selectedBox.x * zoom, top: selectedBox.y * zoom, width: selectedBox.w * zoom, height: selectedBox.h * zoom }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-sm ring-2 ring-primary" />
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
            onCommit((prev) => prev.map((it) => (it.id === activeInteractionData.id ? { ...it, ...patch } : it)))
          }
          onTargetChange={(id) =>
            onCommit((prev) => prev.map((it) => (it.id === activeInteractionData.id ? { ...it, targetFrameId: id } : it)))
          }
          onClose={() => setActiveInteraction(null)}
        />
      )}

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">{zoomPct}%</span>
        <button className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
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
        "absolute z-30 flex h-5 w-5 cursor-crosshair items-center justify-center rounded-full border border-primary bg-popover text-primary hover:bg-primary/10",
        posClass,
      )}
      aria-label={`Connect from ${dir}`}
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}
