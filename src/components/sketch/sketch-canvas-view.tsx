"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type {
  BottomTool,
  BoxElement,
  PathElement,
  SketchElement,
  SketchFrame,
} from "@/components/sketch/sketch-types";
import { cn } from "@/lib/utils";

const SCALE = 0.4;

export function SketchCanvasView({
  frames,
  elements,
  tool,
  stroke,
  armedShape,
  selectedElementId,
  onSelectElement,
  onAddPath,
  onAddAdjacentFrame,
  onPlaceShape,
  onSelectFrame,
}: {
  frames: SketchFrame[];
  elements: SketchElement[];
  tool: BottomTool;
  stroke: { weight: number; color: string; opacity: number; radius: number };
  armedShape: string | null;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddPath: (frameId: string, points: { x: number; y: number }[]) => void;
  onAddAdjacentFrame: (afterFrameId: string) => void;
  onPlaceShape: (frameId: string, x: number, y: number) => void;
  onSelectFrame: (id: string) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [drawing, setDrawing] = useState<{ frameId: string; points: { x: number; y: number }[] } | null>(
    null,
  );

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
  }

  function handleViewportPointerUp() {
    panStart.current = null;
  }

  function frameLocalPoint(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / SCALE,
      y: (e.clientY - rect.top) / SCALE,
    };
  }

  function handleFramePointerDown(e: React.PointerEvent, frame: SketchFrame) {
    if (tool === "hand") return;
    onSelectFrame(frame.id);
    if (tool === "pen") {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      setDrawing({ frameId: frame.id, points: [p] });
    } else if (tool === "shapes" && armedShape) {
      e.stopPropagation();
      const p = frameLocalPoint(e);
      onPlaceShape(frame.id, p.x, p.y);
    } else if (tool === "pointer") {
      onSelectElement(null);
    }
  }

  function handleFramePointerMove(e: React.PointerEvent, frame: SketchFrame) {
    if (drawing && drawing.frameId === frame.id) {
      const p = frameLocalPoint(e);
      setDrawing({ ...drawing, points: [...drawing.points, p] });
    }
  }

  function handleFramePointerUp() {
    if (drawing && drawing.points.length > 1) {
      onAddPath(drawing.frameId, drawing.points);
    }
    setDrawing(null);
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#0a0a0f]",
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
          const w = frame.device.width * SCALE;
          const h = frame.device.height * SCALE;
          const frameElements = elements.filter((el) => el.frameId === frame.id);
          const isDrawingHere = drawing?.frameId === frame.id;

          return (
            <div
              key={frame.id}
              className="absolute"
              style={{ left: frame.x, top: frame.y, width: w }}
            >
              <p className="mb-1 truncate text-[11px] text-muted-foreground">{frame.name}</p>

              <button
                onClick={() => onAddAdjacentFrame(frame.id)}
                className="absolute top-1/2 -left-7 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-primary/60 bg-popover text-primary hover:bg-primary/10"
                style={{ top: h / 2 + 12 }}
                aria-label="Add adjacent screen"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onAddAdjacentFrame(frame.id)}
                className="absolute -right-7 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-primary/60 bg-popover text-primary hover:bg-primary/10"
                style={{ top: h / 2 + 12 }}
                aria-label="Add adjacent screen"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>

              <div
                onPointerDown={(e) => handleFramePointerDown(e, frame)}
                onPointerMove={(e) => handleFramePointerMove(e, frame)}
                onPointerUp={handleFramePointerUp}
                className="relative touch-none overflow-hidden rounded-[10px] border-2 border-white bg-black"
                style={{ width: w, height: h }}
              >
                {frame.showGrid && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #6C5CE7 1px, transparent 1px), linear-gradient(to bottom, #6C5CE7 1px, transparent 1px)",
                      backgroundSize: `${10 * SCALE}px ${10 * SCALE}px`,
                    }}
                  />
                )}

                {frameElements.map((el) => (
                  <ElementView
                    key={el.id}
                    el={el}
                    scale={SCALE}
                    selected={el.id === selectedElementId}
                    onSelect={() => tool === "pointer" && onSelectElement(el.id)}
                  />
                ))}

                {(isDrawingHere ||
                  frameElements.some((el) => el.kind === "path")) && (
                  <svg
                    className="pointer-events-none absolute inset-0"
                    width={w}
                    height={h}
                  >
                    {frameElements
                      .filter((el): el is PathElement => el.kind === "path")
                      .map((el) => (
                        <polyline
                          key={el.id}
                          points={el.points.map((p) => `${p.x * SCALE},${p.y * SCALE}`).join(" ")}
                          fill="none"
                          stroke={el.stroke.color}
                          strokeOpacity={el.stroke.opacity / 100}
                          strokeWidth={el.stroke.weight}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                    {isDrawingHere && (
                      <polyline
                        points={drawing!.points.map((p) => `${p.x * SCALE},${p.y * SCALE}`).join(" ")}
                        fill="none"
                        stroke={stroke.color}
                        strokeOpacity={stroke.opacity / 100}
                        strokeWidth={stroke.weight}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ElementView({
  el,
  scale,
  selected,
  onSelect,
}: {
  el: SketchElement;
  scale: number;
  selected: boolean;
  onSelect: () => void;
}) {
  if (el.kind === "path") return null;

  const style: React.CSSProperties = {
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: `rotate(${el.rotation}deg)`,
  };

  if (el.kind === "image") {
    return (
      // el.src is a local blob: URL from the user's file upload — next/image's
      // optimizer can't fetch/transform blob URLs, so a plain <img> is required.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          "absolute cursor-pointer border border-dashed border-white/50 object-cover",
          selected && "ring-2 ring-primary",
        )}
        style={style}
        alt=""
      />
    );
  }

  return <BoxElementView el={el} style={style} selected={selected} onSelect={onSelect} />;
}

function BoxElementView({
  el,
  style,
  selected,
  onSelect,
}: {
  el: BoxElement;
  style: React.CSSProperties;
  selected: boolean;
  onSelect: () => void;
}) {
  const base = "absolute cursor-pointer border border-dashed border-white/60";
  const cls = cn(base, selected && "ring-2 ring-primary");

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  switch (el.type) {
    case "textline":
      return (
        <div onClick={handleClick} className={cn(cls, "flex items-center border-none")} style={style}>
          <div className="h-[2px] w-full bg-white/60" />
        </div>
      );
    case "button":
      return (
        <div
          onClick={handleClick}
          className={cn(cls, "flex items-center justify-center rounded-full")}
          style={style}
        >
          <div className="h-[2px] w-2/3 bg-white/60" />
        </div>
      );
    case "image":
      return (
        <div onClick={handleClick} className={cn(cls, "relative")} style={style}>
          <svg className="absolute inset-0 h-full w-full">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="white" strokeOpacity={0.4} />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="white" strokeOpacity={0.4} />
          </svg>
        </div>
      );
    case "divider":
      return (
        <div onClick={handleClick} className={cn(cls, "border-none")} style={style}>
          <div className="h-px w-full bg-white/40" />
        </div>
      );
    case "circle":
      return <div onClick={handleClick} className={cn(cls, "rounded-full")} style={style} />;
    case "line":
      return (
        <div onClick={handleClick} className={cn(base, "border-none")} style={style}>
          <div className="h-[2px] w-full bg-white/60" />
        </div>
      );
    default:
      return <div onClick={handleClick} className={cls} style={style} />;
  }
}
