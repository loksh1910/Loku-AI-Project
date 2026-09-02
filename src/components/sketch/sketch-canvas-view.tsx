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
import { cn, rectsIntersect } from "@/lib/utils";
import { computeAlignSnap, computeNeighborGaps, gapBetween, unionRect, DEFAULT_SNAP_PX, type AlignLine, type GapSegment, type GuideRect } from "@/lib/alignment-guides";
import { AlignmentGuidesOverlay } from "@/components/canvas/alignment-guides-overlay";

type HoverEntity = { kind: "frame" | "element"; id: string };

function frameGuideRect(f: SketchFrame): GuideRect {
  return { x: f.x, y: f.y, w: f.device.width * FRAME_SCALE, h: f.device.height * FRAME_SCALE };
}

/** Non-path elements only — paths aren't draggable/selectable as a single
 * rect in this view, so they're excluded from the guide system entirely. */
function elementCanvasRect(el: Exclude<SketchElement, PathElement>, frame: SketchFrame): GuideRect {
  return { x: frame.x + el.x * FRAME_SCALE, y: frame.y + el.y * FRAME_SCALE, w: el.w * FRAME_SCALE, h: el.h * FRAME_SCALE };
}

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
  onMoveFrame,
  onDeleteFrames,
  onPasteFrames,
  onCreateConnector,
  onZoomChange,
  canvasBg,
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
  onMoveFrame: (id: string, patch: Partial<{ x: number; y: number }>) => void;
  onDeleteFrames: (ids: string[]) => void;
  onPasteFrames: (frames: SketchFrame[], elements: SketchElement[]) => void;
  onCreateConnector: (fromFrameId: string, toFrameId: string, anchor: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  /** null = follow the app's own light/dark background. */
  canvasBg?: string | null;
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

  // Marquee (drag-to-select) + shift-click multi-select of whole screens,
  // draggable as a group (frameDragRef) once selected.
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const frameDragRef = useRef<{ startClientX: number; startClientY: number; frames: { id: string; startX: number; startY: number }[] } | null>(null);
  const frameClipboardRef = useRef<{ frames: SketchFrame[]; elements: SketchElement[] }>({ frames: [], elements: [] });

  // Figma-style smart guides. Frame drags snap against other frames (open
  // canvas, "zoom-only" units); element drags snap against sibling elements
  // within the same frame (frame-local, "scale" units, and clipped to that
  // frame like the elements themselves already are). Alt-hover measurement
  // is unified across both — a frame and an element are both just a rect in
  // canvas space once elementCanvasRect converts one into the other's units.
  const [frameDragGuides, setFrameDragGuides] = useState<{ lines: AlignLine[]; gaps: GapSegment[] }>({ lines: [], gaps: [] });
  const [elementDragGuides, setElementDragGuides] = useState<{ lines: AlignLine[]; gaps: GapSegment[] }>({ lines: [], gaps: [] });
  const [elementDragFrameId, setElementDragFrameId] = useState<string | null>(null);
  const [altPressed, setAltPressed] = useState(false);
  const [hoverEntity, setHoverEntity] = useState<HoverEntity | null>(null);
  // Tracked as state (not read from drag/frameDragRef.current during render)
  // since a lint rule here forbids accessing ref values at render time —
  // this only needs to gate the Alt-hover computation below.
  const [isDragging, setIsDragging] = useState(false);

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

  // Element copy/paste/delete is already handled by the page-level keydown
  // listener (it owns selectedElementId/elements) — this only covers the
  // frame-multi-select state, which is local to this component.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isEditable) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedFrameIds.length > 0) {
        e.preventDefault();
        onDeleteFrames(selectedFrameIds);
        setSelectedFrameIds([]);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedFrameIds.length === 0) return;
        e.preventDefault();
        frameClipboardRef.current = {
          frames: frames.filter((f) => selectedFrameIds.includes(f.id)),
          elements: elements.filter((el) => selectedFrameIds.includes(el.frameId)),
        };
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        const clip = frameClipboardRef.current;
        if (clip.frames.length === 0) return;
        e.preventDefault();
        const idMap = new Map(clip.frames.map((f) => [f.id, `frame-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`]));
        const newFrames = clip.frames.map((f) => ({ ...f, id: idMap.get(f.id)!, x: f.x + 30, y: f.y + 30 }));
        const newElements = clip.elements.map((el) => ({
          ...el,
          id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          frameId: idMap.get(el.frameId) ?? el.frameId,
        }));
        onPasteFrames(newFrames, newElements);
        setSelectedFrameIds(newFrames.map((f) => f.id));
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedFrameIds, frames, elements, onDeleteFrames, onPasteFrames]);

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
    // Scroll-wheel (middle) button always pans — left button is reserved for
    // picking/marquee-selecting.
    if (tool === "hand" || e.button === 1) {
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (e.button !== 0) return;
    if (tool === "pointer" && e.target === e.currentTarget) {
      if (!e.shiftKey) {
        setSelectedFrameIds([]);
        // Clicking empty canvas outside every frame should drop whatever
        // element selection is active too, same as clicking a frame's own
        // empty background already does.
        onSelectElement(null);
      }
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const p = { x: (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom, y: (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom };
        marqueeStartRef.current = p;
        setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
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
        // frame.x/y are already in "layout" units matching the `zoom`-only
        // math above, but frame.device.width/height are real device pixels —
        // FRAME_SCALE is the missing factor that puts them in the same space
        // (mirrors how the frame itself is rendered: width * FRAME_SCALE * zoom).
        const hits = frames
          .filter((f) => !f.hidden && rectsIntersect(x, y, w, h, f.x, f.y, f.device.width * FRAME_SCALE, f.device.height * FRAME_SCALE))
          .map((f) => f.id);
        setSelectedFrameIds(hits);
      }
    }
    if (frameDragRef.current) {
      const d = frameDragRef.current;
      const rawDx = (e.clientX - d.startClientX) / zoom;
      const rawDy = (e.clientY - d.startClientY) / zoom;
      const draggedIds = new Set(d.frames.map((f) => f.id));
      const others = frames.filter((f) => !f.hidden && !draggedIds.has(f.id)).map(frameGuideRect);
      const movingBox = unionRect(
        d.frames
          .map((f) => {
            const full = frames.find((ff) => ff.id === f.id);
            return full ? { x: f.startX + rawDx, y: f.startY + rawDy, w: full.device.width * FRAME_SCALE, h: full.device.height * FRAME_SCALE } : null;
          })
          .filter((r): r is GuideRect => !!r),
      );
      let dx = rawDx;
      let dy = rawDy;
      if (movingBox) {
        const snap = computeAlignSnap(movingBox, others, DEFAULT_SNAP_PX / zoom);
        dx = rawDx + snap.dx;
        dy = rawDy + snap.dy;
        setFrameDragGuides({ lines: snap.lines, gaps: computeNeighborGaps({ ...movingBox, x: movingBox.x + snap.dx, y: movingBox.y + snap.dy }, others) });
      }
      d.frames.forEach((f) => onMoveFrame(f.id, { x: f.startX + dx, y: f.startY + dy }));
    }
    if (drag.current) {
      const d = drag.current;
      const rawDx = (e.clientX - d.startClientX) / scale;
      const rawDy = (e.clientY - d.startClientY) / scale;
      if (d.kind === "element") {
        const el = elements.find((it) => it.id === d.id);
        const siblings = el && el.kind !== "path" ? (elements.filter((it) => it.id !== d.id && it.frameId === el.frameId && it.kind !== "path") as Exclude<SketchElement, PathElement>[]) : [];
        let dx = rawDx;
        let dy = rawDy;
        if (el && el.kind !== "path") {
          const movingRect: GuideRect = { x: d.startX + rawDx, y: d.startY + rawDy, w: el.w, h: el.h };
          const others = siblings.map((s) => ({ x: s.x, y: s.y, w: s.w, h: s.h }));
          const snap = computeAlignSnap(movingRect, others, DEFAULT_SNAP_PX / scale);
          dx = rawDx + snap.dx;
          dy = rawDy + snap.dy;
          setElementDragGuides({ lines: snap.lines, gaps: computeNeighborGaps({ ...movingRect, x: movingRect.x + snap.dx, y: movingRect.y + snap.dy }, others) });
          setElementDragFrameId(el.frameId);
        }
        onUpdateElement(d.id, { x: d.startX + dx, y: d.startY + dy });
      } else {
        let { startX: x, startY: y, startW: w, startH: h } = d;
        if (d.corner === "se") {
          w = Math.max(10, d.startW + rawDx);
          h = Math.max(10, d.startH + rawDy);
        } else if (d.corner === "sw") {
          w = Math.max(10, d.startW - rawDx);
          h = Math.max(10, d.startH + rawDy);
          x = d.startX + (d.startW - w);
        } else if (d.corner === "ne") {
          w = Math.max(10, d.startW + rawDx);
          h = Math.max(10, d.startH - rawDy);
          y = d.startY + (d.startH - h);
        } else {
          w = Math.max(10, d.startW - rawDx);
          h = Math.max(10, d.startH - rawDy);
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
    frameDragRef.current = null;
    marqueeStartRef.current = null;
    setMarquee(null);
    setFrameDragGuides({ lines: [], gaps: [] });
    setElementDragGuides({ lines: [], gaps: [] });
    setElementDragFrameId(null);
    setIsDragging(false);
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
    // Scroll-wheel (middle) button always pans, even over a frame.
    if (tool === "hand" || e.button === 1) return;
    if (e.button !== 0) return;
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
      const nextIds = e.shiftKey
        ? selectedFrameIds.includes(frame.id)
          ? selectedFrameIds.filter((id) => id !== frame.id)
          : [...selectedFrameIds, frame.id]
        : selectedFrameIds.includes(frame.id) && selectedFrameIds.length > 1
          ? selectedFrameIds
          : [frame.id];
      setSelectedFrameIds(nextIds);
      onBeginElementChange();
      // A click that never turns into a drag just leaves every dragged frame
      // exactly where it started (delta 0), so this doubles safely as the
      // plain "select frame" gesture too — no separate handling needed.
      setIsDragging(true);
      frameDragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        frames: frames.filter((f) => nextIds.includes(f.id)).map((f) => ({ id: f.id, startX: f.x, startY: f.y })),
      };
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
    // Element and frame selection are mutually exclusive — otherwise a stale
    // frame selection from earlier would also get deleted by the same
    // Delete/Backspace press meant for this element.
    setSelectedFrameIds([]);
    onBeginElementChange();
    setIsDragging(true);
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
    setIsDragging(true);
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

  // Alt-hover measurement: selected can be a frame or an element; hovered
  // can be either too, in the same or a different frame — both get
  // converted into the same canvas-space rect via frameGuideRect /
  // elementCanvasRect so the comparison doesn't care which kind either is.
  const selectedEntityRects: GuideRect[] = (() => {
    if (selectedFrameIds.length > 0) return frames.filter((f) => selectedFrameIds.includes(f.id)).map(frameGuideRect);
    if (selectedElementId) {
      const el = elements.find((it) => it.id === selectedElementId);
      const parent = el ? frames.find((f) => f.id === el.frameId) : null;
      if (el && el.kind !== "path" && parent) return [elementCanvasRect(el, parent)];
    }
    return [];
  })();
  const hoverEntityRect: GuideRect | null = (() => {
    if (!hoverEntity) return null;
    if (hoverEntity.kind === "frame") {
      const f = frames.find((x) => x.id === hoverEntity.id);
      return f ? frameGuideRect(f) : null;
    }
    const el = elements.find((x) => x.id === hoverEntity.id);
    const parent = el ? frames.find((f) => f.id === el.frameId) : null;
    return el && el.kind !== "path" && parent ? elementCanvasRect(el, parent) : null;
  })();
  const isHoveringSelection =
    !!hoverEntity && ((hoverEntity.kind === "frame" && selectedFrameIds.includes(hoverEntity.id)) || (hoverEntity.kind === "element" && selectedElementId === hoverEntity.id));
  const altGaps: GapSegment[] = (() => {
    if (!altPressed || isDragging || isHoveringSelection) return [];
    const selBox = unionRect(selectedEntityRects);
    if (!selBox || !hoverEntityRect) return [];
    const res = gapBetween(selBox, hoverEntityRect);
    return [res.x, res.y].filter((g): g is GapSegment => !!g);
  })();

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-background select-none",
        tool === "hand" ? "cursor-grab active:cursor-grabbing" : "",
      )}
      style={canvasBg ? { background: canvasBg } : undefined}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
      onPointerLeave={handleViewportPointerUp}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {frames.filter((f) => !f.hidden).map((frame) => {
          const w = frame.device.width * scale;
          const h = frame.device.height * scale;
          const frameElements = elements.filter((el) => el.frameId === frame.id);
          const isDrawingHere = drawing?.frameId === frame.id;
          const isVectorHere = vectorPath?.frameId === frame.id;
          const isFrameSelected = selectedFrameIds.includes(frame.id);

          return (
            <div
              key={frame.id}
              data-frame-id={frame.id}
              className="absolute"
              style={{ left: frame.x * zoom, top: frame.y * zoom, width: w }}
              onPointerEnter={(e) => {
                setHoverEntity({ kind: "frame", id: frame.id });
                if (e.altKey !== altPressed) setAltPressed(e.altKey);
              }}
              onPointerLeave={() => setHoverEntity((h) => (h?.kind === "frame" && h.id === frame.id ? null : h))}
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
                className={cn(
                  "relative touch-none overflow-hidden rounded-[10px] border-2 bg-black",
                  isFrameSelected ? "border-primary ring-2 ring-primary" : "border-white",
                )}
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
                      onHoverChange={(hovering, altKey) => {
                        setHoverEntity((prev) => (hovering ? { kind: "element", id: el.id } : prev?.kind === "element" && prev.id === el.id ? null : prev));
                        if (hovering && altKey !== undefined && altKey !== altPressed) setAltPressed(altKey);
                      }}
                    />
                  ),
                )}

                {elementDragFrameId === frame.id && (
                  <AlignmentGuidesOverlay lines={elementDragGuides.lines} gaps={elementDragGuides.gaps} zoom={scale} />
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

        {marquee && (
          <div
            className="pointer-events-none absolute border border-primary bg-primary/10"
            style={{ left: marquee.x * zoom, top: marquee.y * zoom, width: marquee.w * zoom, height: marquee.h * zoom }}
          />
        )}

        <AlignmentGuidesOverlay lines={frameDragGuides.lines} gaps={frameDragGuides.gaps} zoom={zoom} />
        <AlignmentGuidesOverlay lines={[]} gaps={altGaps} zoom={zoom} />

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
  onHoverChange,
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
  onHoverChange?: (hovering: boolean, altKey?: boolean) => void;
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
      onPointerEnter={(e) => onHoverChange?.(true, e.altKey)}
      onPointerLeave={() => onHoverChange?.(false)}
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
