"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type {
  BottomTool,
  BoxElement,
  PathElement,
  SketchConnector,
  SketchElement,
  SketchFrame,
} from "@/components/sketch/sketch-types";
import { FRAME_SCALE } from "@/components/sketch/sketch-constants";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const HANDLE_SIZE = 8;

type DragState =
  | { kind: "element"; id: string; startX: number; startY: number; startClientX: number; startClientY: number }
  | {
      kind: "resize";
      id: string;
      corner: "nw" | "ne" | "sw" | "se";
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      startClientX: number;
      startClientY: number;
    };

export function SketchCanvasView({
  frames,
  elements,
  connectors,
  tool,
  stroke,
  armedShape,
  selectedElementId,
  onSelectElement,
  onAddPath,
  onAddAdjacentFrame,
  onPlaceShape,
  onPlaceText,
  onSelectFrame,
  onUpdateElement,
  onBeginElementChange,
  onRenameFrame,
  onCreateConnector,
  onZoomChange,
}: {
  frames: SketchFrame[];
  elements: SketchElement[];
  connectors: SketchConnector[];
  tool: BottomTool;
  stroke: { weight: number; color: string; opacity: number; radius: number };
  armedShape: string | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddPath: (frameId: string, points: { x: number; y: number }[], mode: "freehand" | "vector", closed?: boolean) => void;
  onAddAdjacentFrame: (afterFrameId: string) => void;
  onPlaceShape: (frameId: string, x: number, y: number) => void;
  onPlaceText: (frameId: string, x: number, y: number) => void;
  onSelectFrame: (id: string) => void;
  onUpdateElement: (id: string, patch: Partial<{ x: number; y: number; w: number; h: number; text: string }>) => void;
  onBeginElementChange: () => void;
  onRenameFrame: (id: string, name: string) => void;
  onCreateConnector: (fromFrameId: string, toFrameId: string, anchor: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [drawing, setDrawing] = useState<{ frameId: string; points: { x: number; y: number }[] } | null>(
    null,
  );
  const [vectorPath, setVectorPath] = useState<{ frameId: string; points: { x: number; y: number }[] } | null>(
    null,
  );
  // Coordinates here are already viewport-local (computed once at drag start
  // from the ref, inside the event handler — never read from the ref during
  // render, which the lint rule for refs disallows).
  const [connectorDrag, setConnectorDrag] = useState<{
    fromFrameId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  // Switching tools mid-draw (e.g. pressing Escape while a vector-pen path
  // has points placed but isn't closed yet) would otherwise leave that
  // in-progress preview stuck on screen with no way to finish or cancel it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting in-progress draw state on an external tool-change trigger, not syncing derived state
    if (tool !== "vectorpen") setVectorPath(null);
    if (tool !== "connector") setConnectorDrag(null);
  }, [tool]);

  const [renamingFrameId, setRenamingFrameId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const scale = FRAME_SCALE * zoom;

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // React's synthetic onWheel handler is registered as a passive listener,
  // so e.preventDefault() silently fails there (and warns). A native
  // listener with { passive: false } is required to actually stop the
  // page from scrolling while zooming the canvas.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current - e.deltaY * 0.001));
      setZoom(next);
      onZoomChange(next);
    }
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [onZoomChange]);

  function handleViewportPointerDown(e: React.PointerEvent) {
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    }
  }

  function handleViewportPointerMove(e: React.PointerEvent) {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
    }
    if (drag.current) {
      const d = drag.current;
      const dx = (e.clientX - d.startClientX) / scale;
      const dy = (e.clientY - d.startClientY) / scale;
      if (d.kind === "element") {
        onUpdateElement(d.id, { x: d.startX + dx, y: d.startY + dy });
      } else {
        let { startX: x, startY: y, startW: w, startH: h } = d;
        if (d.corner === "se") {
          w = Math.max(10, d.startW + dx);
          h = Math.max(10, d.startH + dy);
        } else if (d.corner === "sw") {
          w = Math.max(10, d.startW - dx);
          h = Math.max(10, d.startH + dy);
          x = d.startX + (d.startW - w);
        } else if (d.corner === "ne") {
          w = Math.max(10, d.startW + dx);
          h = Math.max(10, d.startH - dy);
          y = d.startY + (d.startH - h);
        } else {
          w = Math.max(10, d.startW - dx);
          h = Math.max(10, d.startH - dy);
          x = d.startX + (d.startW - w);
          y = d.startY + (d.startH - h);
        }
        onUpdateElement(d.id, { x, y, w, h });
      }
    }
    if (connectorDrag && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setConnectorDrag({ ...connectorDrag, currentX: e.clientX - rect.left, currentY: e.clientY - rect.top });
    }
  }

  function handleViewportPointerUp(e: React.PointerEvent) {
    panStart.current = null;
    drag.current = null;
    if (connectorDrag) {
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-frame-id]") as HTMLElement | null;
      const toFrameId = target?.dataset.frameId;
      if (toFrameId && toFrameId !== connectorDrag.fromFrameId) {
        onCreateConnector(connectorDrag.fromFrameId, toFrameId, {
          x: connectorDrag.currentX,
          y: connectorDrag.currentY,
        });
      }
      setConnectorDrag(null);
    }
  }

  function frameLocalPoint(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function handleFramePointerDown(e: React.PointerEvent, frame: SketchFrame) {
    if (tool === "hand") return;
    onSelectFrame(frame.id);

    if (tool === "connector") {
      e.stopPropagation();
      const rect = viewportRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left ?? 0);
      const y = e.clientY - (rect?.top ?? 0);
      setConnectorDrag({
        fromFrameId: frame.id,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      return;
    }
    if (tool === "pencil") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      setDrawing({ frameId: frame.id, points: [p] });
    } else if (tool === "line") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      setDrawing({ frameId: frame.id, points: [p, p] });
    } else if (tool === "vectorpen") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      setVectorPath((prev) =>
        prev && prev.frameId === frame.id ? { ...prev, points: [...prev.points, p] } : { frameId: frame.id, points: [p] },
      );
    } else if (tool === "shapes" && armedShape) {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      onPlaceShape(frame.id, p.x, p.y);
    } else if (tool === "text") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      onPlaceText(frame.id, p.x, p.y);
    } else if (tool === "pointer") {
      onSelectElement(null);
    }
  }

  function handleFrameDoubleClick(e: React.MouseEvent, frame: SketchFrame) {
    if (tool === "vectorpen" && vectorPath && vectorPath.frameId === frame.id) {
      e.stopPropagation();
      if (vectorPath.points.length > 2) {
        onAddPath(frame.id, vectorPath.points, "vector", true);
      }
      setVectorPath(null);
    }
  }

  function handleFramePointerMove(e: React.PointerEvent, frame: SketchFrame) {
    if (drawing && drawing.frameId === frame.id) {
      const p = frameLocalPoint(e);
      if (tool === "line") {
        setDrawing({ frameId: frame.id, points: [drawing.points[0], p] });
      } else {
        setDrawing({ ...drawing, points: [...drawing.points, p] });
      }
    }
  }

  function handleFramePointerUp() {
    if (drawing && drawing.points.length > 1) {
      onAddPath(drawing.frameId, drawing.points, "freehand");
    }
    setDrawing(null);
  }

  function startElementDrag(e: React.PointerEvent, el: SketchElement) {
    if (tool !== "pointer" || el.kind === "path") return;
    e.stopPropagation();
    onSelectElement(el.id);
    onBeginElementChange();
    drag.current = {
      kind: "element",
      id: el.id,
      startX: el.x,
      startY: el.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
  }

  function startResize(
    e: React.PointerEvent,
    el: Exclude<SketchElement, PathElement>,
    corner: "nw" | "ne" | "sw" | "se",
  ) {
    e.stopPropagation();
    onBeginElementChange();
    drag.current = {
      kind: "resize",
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

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-background select-none",
        tool === "hand" ? "cursor-grab active:cursor-grabbing" : "",
      )}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
      onPointerLeave={handleViewportPointerUp}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {frames.map((frame) => {
          const w = frame.device.width * scale;
          const h = frame.device.height * scale;
          const frameElements = elements.filter((el) => el.frameId === frame.id);
          const isDrawingHere = drawing?.frameId === frame.id;
          const isVectorHere = vectorPath?.frameId === frame.id;

          return (
            <div
              key={frame.id}
              data-frame-id={frame.id}
              className="absolute"
              style={{ left: frame.x * zoom, top: frame.y * zoom, width: w }}
            >
              {renamingFrameId === frame.id ? (
                <input
                  autoFocus
                  defaultValue={frame.name}
                  onBlur={(e) => {
                    onRenameFrame(frame.id, e.target.value.trim() || frame.name);
                    setRenamingFrameId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setRenamingFrameId(null);
                  }}
                  className="mb-1 w-32 rounded bg-secondary px-1 py-0.5 text-[11px] outline-none"
                />
              ) : (
                <p
                  onDoubleClick={() => setRenamingFrameId(frame.id)}
                  className="mb-1 w-fit max-w-full truncate text-[11px] text-muted-foreground"
                  title="Double-click to rename"
                >
                  {frame.name}
                </p>
              )}

              <Tip label="Add adjacent screen" className="absolute -left-7 -translate-y-1/2" style={{ top: h / 2 + 12 }}>
                <button
                  onClick={() => onAddAdjacentFrame(frame.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/60 bg-popover text-primary hover:bg-primary/10"
                  aria-label="Add adjacent screen"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </Tip>
              <Tip label="Add adjacent screen" className="absolute -right-7 -translate-y-1/2" style={{ top: h / 2 + 12 }}>
                <button
                  onClick={() => onAddAdjacentFrame(frame.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/60 bg-popover text-primary hover:bg-primary/10"
                  aria-label="Add adjacent screen"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </Tip>

              <div
                onPointerDown={(e) => handleFramePointerDown(e, frame)}
                onPointerMove={(e) => handleFramePointerMove(e, frame)}
                onPointerUp={handleFramePointerUp}
                onDoubleClick={(e) => handleFrameDoubleClick(e, frame)}
                className="relative touch-none overflow-hidden rounded-[10px] border-2 border-white bg-black"
                style={{ width: w, height: h }}
              >
                {frame.showGrid && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #6C5CE7 1px, transparent 1px), linear-gradient(to bottom, #6C5CE7 1px, transparent 1px)",
                      backgroundSize: `${10 * scale}px ${10 * scale}px`,
                    }}
                  />
                )}

                {frameElements.map((el) =>
                  el.kind === "path" ? null : (
                    <ElementView
                      key={el.id}
                      el={el}
                      scale={scale}
                      selected={el.id === selectedElementId}
                      editing={el.kind === "text" && editingTextId === el.id}
                      onSelect={() => tool === "pointer" && onSelectElement(el.id)}
                      onPointerDownDrag={(e) => startElementDrag(e, el)}
                      onStartResize={(e, corner) => startResize(e, el, corner)}
                      onCommitText={(text) => {
                        if (el.kind === "text" && text !== el.text) {
                          onBeginElementChange();
                          onUpdateElement(el.id, { text });
                        }
                        setEditingTextId(null);
                      }}
                      onDoubleClickText={() => el.kind === "text" && setEditingTextId(el.id)}
                    />
                  ),
                )}

                <svg className="pointer-events-none absolute inset-0" width={w} height={h}>
                  {frameElements
                    .filter((el): el is PathElement => el.kind === "path")
                    .map((el) => (
                      <polyline
                        key={el.id}
                        points={el.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
                        fill={el.closed ? el.fill ?? el.stroke.color : "none"}
                        fillOpacity={el.closed ? 0.15 : 0}
                        stroke={el.stroke.color}
                        strokeOpacity={el.stroke.opacity / 100}
                        strokeWidth={el.stroke.weight}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  {isDrawingHere && (
                    <polyline
                      points={drawing!.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
                      fill="none"
                      stroke={stroke.color}
                      strokeOpacity={stroke.opacity / 100}
                      strokeWidth={stroke.weight}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {isVectorHere && (
                    <>
                      <polyline
                        points={vectorPath!.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
                        fill="none"
                        stroke={stroke.color}
                        strokeOpacity={stroke.opacity / 100}
                        strokeWidth={stroke.weight}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {vectorPath!.points.map((p, i) => (
                        <circle key={i} cx={p.x * scale} cy={p.y * scale} r={3} fill={stroke.color} />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </div>
          );
        })}

        <svg className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-visible">
          {connectors.map((c) => {
            const from = frames.find((f) => f.id === c.fromFrameId);
            const to = frames.find((f) => f.id === c.toFrameId);
            if (!from || !to) return null;
            const fw = from.device.width * scale;
            const fh = from.device.height * scale;
            const tw = to.device.width * scale;
            const th = to.device.height * scale;
            return (
              <line
                key={c.id}
                x1={from.x * zoom + fw / 2}
                y1={from.y * zoom + fh / 2}
                x2={to.x * zoom + tw / 2}
                y2={to.y * zoom + th / 2}
                stroke="#6C5CE7"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#6C5CE7" />
            </marker>
          </defs>
        </svg>
      </div>

      {connectorDrag && (
        <svg className="pointer-events-none absolute inset-0 z-40">
          <line
            x1={connectorDrag.startX}
            y1={connectorDrag.startY}
            x2={connectorDrag.currentX}
            y2={connectorDrag.currentY}
            stroke="#6C5CE7"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>
      )}
    </div>
  );
}

function ElementView({
  el,
  scale,
  selected,
  editing,
  onSelect,
  onPointerDownDrag,
  onStartResize,
  onCommitText,
  onDoubleClickText,
}: {
  el: Exclude<SketchElement, PathElement>;
  scale: number;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onPointerDownDrag: (e: React.PointerEvent) => void;
  onStartResize: (e: React.PointerEvent, corner: "nw" | "ne" | "sw" | "se") => void;
  onCommitText: (text: string) => void;
  onDoubleClickText: () => void;
}) {
  const style: React.CSSProperties = {
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: `rotate(${el.rotation}deg)`,
  };

  const handles: { corner: "nw" | "ne" | "sw" | "se"; style: React.CSSProperties }[] = [
    { corner: "nw", style: { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 } },
    { corner: "ne", style: { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 } },
    { corner: "sw", style: { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 } },
    { corner: "se", style: { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 } },
  ];

  const wrapperContent =
    el.kind === "image" ? (
      // el.src is a local blob: URL from the user's file upload — next/image's
      // optimizer can't fetch/transform blob URLs, so a plain <img> is required.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={el.src} className="pointer-events-none h-full w-full object-cover" alt="" />
    ) : el.kind === "text" ? (
      editing ? (
        <input
          autoFocus
          defaultValue={el.text}
          onBlur={(e) => onCommitText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ color: el.color, fontSize: el.fontSize * scale * 2.5, fontWeight: el.fontWeight }}
          className="h-full w-full bg-transparent outline-none"
        />
      ) : (
        <span
          onDoubleClick={onDoubleClickText}
          style={{ color: el.color, fontSize: el.fontSize * scale * 2.5, fontWeight: el.fontWeight }}
          className="pointer-events-none block truncate"
        >
          {el.text}
        </span>
      )
    ) : (
      <BoxInner el={el} />
    );

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
        onPointerDownDrag(e);
      }}
      className={cn(
        "absolute cursor-move border border-dashed border-white/60",
        el.kind === "box" && el.type === "button" && "flex items-center justify-center rounded-full",
        el.kind === "box" && el.type === "circle" && "rounded-full",
        selected && "ring-2 ring-primary",
      )}
      style={style}
    >
      {wrapperContent}
      {selected &&
        handles.map((h) => (
          <div
            key={h.corner}
            onPointerDown={(e) => onStartResize(e, h.corner)}
            className="absolute rounded-sm border border-primary bg-background"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: `${h.corner}-resize`, ...h.style }}
          />
        ))}
    </div>
  );
}

function BoxInner({ el }: { el: BoxElement }) {
  switch (el.type) {
    case "textline":
      return <div className="mt-[45%] h-[2px] w-full bg-white/60" />;
    case "button":
      return <div className="h-[2px] w-2/3 bg-white/60" />;
    case "image":
      return (
        <svg className="absolute inset-0 h-full w-full">
          <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeOpacity={0.4} />
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="white" strokeOpacity={0.4} />
        </svg>
      );
    case "divider":
      return <div className="mt-[45%] h-px w-full bg-white/40" />;
    case "line":
      return <div className="mt-[45%] h-[2px] w-full bg-white/60" />;
    default:
      return null;
  }
}
