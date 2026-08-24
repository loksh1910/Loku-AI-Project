"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Redo2, Share2, Sparkles, HelpCircle } from "lucide-react";
import { SketchLeftRail } from "@/components/sketch/sketch-left-rail";
import { ScreensPanel } from "@/components/sketch/screens-panel";
import { RightSketchTools } from "@/components/sketch/right-sketch-tools";
import { BottomToolbar } from "@/components/sketch/bottom-toolbar";
import { SketchCanvasView } from "@/components/sketch/sketch-canvas-view";
import { ConnectorInteractionBox } from "@/components/sketch/connector-interaction-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/components/providers/app-state-provider";
import type { SketchDevice } from "@/lib/sketch-devices";
import { FRAME_SCALE } from "@/components/sketch/sketch-constants";
import {
  DEFAULT_STROKE,
  DEFAULT_TEXT_STYLE,
  type BasicElementType,
  type BottomTool,
  type RightPanelKey,
  type ShapeType,
  type SketchConnector,
  type SketchElement,
  type SketchFrame,
} from "@/components/sketch/sketch-types";
import { toast } from "sonner";

const FRAME_GAP = 60;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Snapshot = { frames: SketchFrame[]; elements: SketchElement[] };

export default function SketchCanvasPage() {
  const { isSignedIn, hydrated, userName, touchRecentProject } = useAppState();
  const router = useRouter();

  const [frames, setFrames] = useState<SketchFrame[]>([]);
  const [elements, setElements] = useState<SketchElement[]>([]);
  const [connectors, setConnectors] = useState<SketchConnector[]>([]);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const [screensOpen, setScreensOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanelKey>(null);
  const [bottomTool, setBottomTool] = useState<BottomTool>("pointer");
  const [armedShape, setArmedShape] = useState<ShapeType | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [stroke, setStroke] = useState(DEFAULT_STROKE);
  const [textStyle, setTextStyle] = useState(DEFAULT_TEXT_STYLE);
  const [zoomPct, setZoomPct] = useState(100);
  const [activeConnector, setActiveConnector] = useState<{
    connector: SketchConnector;
    x: number;
    y: number;
  } | null>(null);
  const [projectName, setProjectName] = useState("Project name");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (hydrated && !isSignedIn) router.replace("/");
  }, [hydrated, isSignedIn, router]);

  const commit = useCallback(
    (updater: (prev: Snapshot) => Snapshot) => {
      setPast((p) => [...p, { frames, elements }].slice(-50));
      setFuture([]);
      const next = updater({ frames, elements });
      setFrames(next.frames);
      setElements(next.elements);
    },
    [frames, elements],
  );

  // Dragging/resizing/text-editing an element fires onUpdateElement continuously
  // (every pointermove) via plain setElements, deliberately NOT pushing a history
  // entry per move — that would flood undo with one step per pixel. Instead this
  // snapshots the pre-change state once, when the interaction begins, so the
  // whole drag/resize/edit becomes a single undoable step.
  const beginElementChange = useCallback(() => {
    setPast((p) => [...p, { frames, elements }].slice(-50));
    setFuture([]);
  }, [frames, elements]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ frames, elements }, ...f]);
    setFrames(prev.frames);
    setElements(prev.elements);
  }, [past, frames, elements]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { frames, elements }]);
    setFrames(next.frames);
    setElements(next.elements);
  }, [future, frames, elements]);

  function addFrame(device: SketchDevice) {
    const id = uid();
    const isFirst = frames.length === 0;
    const w = device.width * FRAME_SCALE;
    const h = device.height * FRAME_SCALE;
    const lastX = frames.length
      ? Math.max(...frames.map((f) => f.x + f.device.width * FRAME_SCALE)) + FRAME_GAP
      : 0;
    const newFrame: SketchFrame = {
      id,
      name: `Screen${frames.length + 1}`,
      device,
      // First frame centers on the pan origin (viewport center); later
      // frames line up to the right of the last one.
      x: isFirst ? -w / 2 : lastX,
      y: isFirst ? -h / 2 : -h / 2,
      autoLayout: { enabled: false, spacing: 12, padding: 16 },
      showGrid: false,
    };
    commit((prev) => ({ frames: [...prev.frames, newFrame], elements: prev.elements }));
    setActiveFrameId(id);
    if (isFirst) {
      touchRecentProject("sketch-project-1", projectName);
    }
  }

  function addAdjacentFrame(afterFrameId: string) {
    const source = frames.find((f) => f.id === afterFrameId);
    if (!source) return;
    const id = uid();
    const newFrame: SketchFrame = {
      id,
      name: `Screen${frames.length + 1}`,
      device: source.device,
      x: source.x + source.device.width * FRAME_SCALE + FRAME_GAP,
      y: source.y,
      autoLayout: { enabled: false, spacing: 12, padding: 16 },
      showGrid: false,
    };
    commit((prev) => ({ frames: [...prev.frames, newFrame], elements: prev.elements }));
    setActiveFrameId(id);
  }

  function renameFrame(id: string, name: string) {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  }

  function addBasic(type: BasicElementType) {
    if (!activeFrameId) {
      toast("Select or create a screen first.");
      return;
    }
    const frame = frames.find((f) => f.id === activeFrameId);
    if (!frame) return;

    const defaults: Record<BasicElementType, { w: number; h: number }> = {
      container: { w: 160, h: 100 },
      textline: { w: 140, h: 12 },
      button: { w: 120, h: 36 },
      image: { w: 140, h: 90 },
      divider: { w: 200, h: 2 },
    };
    const { w, h } = defaults[type];

    let x = frame.device.width / 2 - w / 2;
    let y = frame.device.height / 2 - h / 2;

    if (frame.autoLayout.enabled) {
      const existing = elements.filter((el) => el.frameId === frame.id && el.kind !== "path");
      const { padding, spacing } = frame.autoLayout;
      const stackTop =
        existing.reduce(
          (acc, el) => (el.kind !== "path" ? Math.max(acc, el.y + el.h) : acc),
          padding - spacing,
        ) + spacing;
      x = padding;
      y = stackTop;
    }

    const el: SketchElement = { id: uid(), frameId: frame.id, kind: "box", type, x, y, w, h, rotation: 0 };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
  }

  function addPath(frameId: string, points: { x: number; y: number }[], mode: "freehand" | "vector", closed?: boolean) {
    const el: SketchElement = {
      id: uid(),
      frameId,
      kind: "path",
      mode,
      points,
      closed,
      stroke: { ...stroke },
      fill: closed ? stroke.color : undefined,
    };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
  }

  function placeShape(frameId: string, x: number, y: number) {
    if (!armedShape) return;
    const size = armedShape === "line" ? { w: 100, h: 2 } : { w: 80, h: 80 };
    const el: SketchElement = {
      id: uid(),
      frameId,
      kind: "box",
      type: armedShape,
      x: x - size.w / 2,
      y: y - size.h / 2,
      ...size,
      rotation: 0,
    };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
  }

  function placeText(frameId: string, x: number, y: number) {
    const id = uid();
    const el: SketchElement = {
      id,
      frameId,
      kind: "text",
      x,
      y,
      w: 120,
      h: 24,
      rotation: 0,
      text: "Text",
      color: textStyle.color,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
    };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
    setSelectedElementId(id);
  }

  function addImage(file: File) {
    if (!activeFrameId) {
      toast("Select or create a screen first.");
      return;
    }
    const frame = frames.find((f) => f.id === activeFrameId);
    if (!frame) return;
    const src = URL.createObjectURL(file);
    const w = 160;
    const h = 120;
    const el: SketchElement = {
      id: uid(),
      frameId: frame.id,
      kind: "image",
      src,
      x: frame.device.width / 2 - w / 2,
      y: frame.device.height / 2 - h / 2,
      w,
      h,
      rotation: 0,
    };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
  }

  function updateElement(id: string, patch: Partial<{ x: number; y: number; w: number; h: number; rotation: number; text: string }>) {
    setElements((prev) =>
      prev.map((el) => (el.id === id && el.kind !== "path" ? { ...el, ...patch } : el)),
    );
  }

  function updateSelectedElement(patch: Partial<{ x: number; y: number; w: number; h: number; rotation: number }>) {
    if (!selectedElementId) return;
    commit((prev) => ({
      frames: prev.frames,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId && el.kind !== "path" ? { ...el, ...patch } : el,
      ),
    }));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (isEditable) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (isEditable) return;
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Escape") {
        if (isEditable) return;
        setBottomTool("pointer");
        setArmedShape(null);
        return;
      }

      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (isEditable) return;
      if (!selectedElementId) return;
      e.preventDefault();
      commit((prev) => ({
        frames: prev.frames,
        elements: prev.elements.filter((el) => el.id !== selectedElementId),
      }));
      setSelectedElementId(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, commit, undo, redo]);

  function updateFrameLayout(patch: Partial<SketchFrame["autoLayout"] & { showGrid: boolean }>) {
    if (!activeFrameId) return;
    setFrames((prev) =>
      prev.map((f) =>
        f.id === activeFrameId
          ? {
              ...f,
              showGrid: patch.showGrid ?? f.showGrid,
              autoLayout: {
                enabled: patch.enabled ?? f.autoLayout.enabled,
                spacing: patch.spacing ?? f.autoLayout.spacing,
                padding: patch.padding ?? f.autoLayout.padding,
              },
            }
          : f,
      ),
    );
  }

  function pickShape(shape: ShapeType) {
    setArmedShape(shape);
  }

  function createConnector(fromFrameId: string, toFrameId: string, anchor: { x: number; y: number }) {
    const connector: SketchConnector = {
      id: uid(),
      fromFrameId,
      toFrameId,
      trigger: "On Click",
      action: "Navigate to",
      animation: "Slide right",
      duration: "300ms",
      easing: "Ease in out",
    };
    setConnectors((prev) => [...prev, connector]);
    setActiveConnector({ connector, x: anchor.x + 16, y: anchor.y });
  }

  if (!isSignedIn) return null;

  const activeFrame = frames.find((f) => f.id === activeFrameId) ?? null;
  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const styleMode = bottomTool === "text" || selectedElement?.kind === "text" ? "text" : "stroke";

  const fromFrame = activeConnector ? frames.find((f) => f.id === activeConnector.connector.fromFrameId) : null;
  const toFrame = activeConnector ? frames.find((f) => f.id === activeConnector.connector.toFrameId) : null;

  return (
    <div className="relative flex flex-1">
      <SketchLeftRail
        onScreensClick={() => setScreensOpen((v) => !v)}
        screensActive={screensOpen}
      />

      <div className="absolute top-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
          aria-label="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <BottomToolbar
        tool={bottomTool}
        onToolChange={(t) => {
          setBottomTool(t);
          if (t === "pencil" || t === "text") setRightPanel("style");
          if (t !== "shapes") setArmedShape(null);
        }}
        onPickShape={pickShape}
      />

      <div className="relative flex flex-1 flex-col">
        <header className="z-40 flex items-center justify-between px-4 py-3">
          {editingName ? (
            <input
              autoFocus
              defaultValue={projectName}
              onBlur={(e) => {
                setProjectName(e.target.value.trim() || projectName);
                setEditingName(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="rounded bg-secondary px-2 py-1 text-sm font-medium outline-none"
            />
          ) : (
            <button
              onDoubleClick={() => setEditingName(true)}
              className="text-left text-sm font-medium text-muted-foreground hover:text-foreground"
              title="Double-click to rename"
            >
              {projectName}
            </button>
          )}

          <div className="flex items-center gap-2">
            {frames.length > 0 && (
              <button
                onClick={() => toast("AI generation is coming soon.")}
                className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate UI
              </button>
            )}
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
              <ThemeToggle />
              <button
                onClick={() => toast("Share coming soon.")}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => toast("Export coming soon.")}
              className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              Export
            </button>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                {userName?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <SketchCanvasView
            frames={frames}
            elements={elements}
            connectors={connectors}
            tool={bottomTool}
            stroke={stroke}
            armedShape={armedShape}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onAddPath={addPath}
            onAddAdjacentFrame={addAdjacentFrame}
            onPlaceShape={placeShape}
            onPlaceText={placeText}
            onSelectFrame={setActiveFrameId}
            onUpdateElement={updateElement}
            onBeginElementChange={beginElementChange}
            onRenameFrame={renameFrame}
            onCreateConnector={createConnector}
            onZoomChange={(z) => setZoomPct(Math.round(z * 100))}
          />

          {activeConnector && fromFrame && toFrame && (
            <ConnectorInteractionBox
              connector={activeConnector.connector}
              fromFrame={fromFrame}
              toFrame={toFrame}
              x={activeConnector.x}
              y={activeConnector.y}
              onChange={(patch) => {
                setConnectors((prev) =>
                  prev.map((c) => (c.id === activeConnector.connector.id ? { ...c, ...patch } : c)),
                );
                setActiveConnector((prev) => (prev ? { ...prev, connector: { ...prev.connector, ...patch } } : prev));
              }}
              onClose={() => setActiveConnector(null)}
            />
          )}

          {screensOpen && (
            <ScreensPanel
              frames={frames}
              onAddFrame={addFrame}
              onClose={() => setScreensOpen(false)}
              onRenameFrame={renameFrame}
            />
          )}

          <RightSketchTools
            activePanel={rightPanel}
            onPanelChange={setRightPanel}
            stroke={stroke}
            onStrokeChange={(patch) => setStroke((s) => ({ ...s, ...patch }))}
            textStyle={textStyle}
            onTextStyleChange={(patch) => {
              setTextStyle((s) => ({ ...s, ...patch }));
              if (selectedElement?.kind === "text") updateElement(selectedElement.id, patch as never);
            }}
            styleMode={styleMode}
            onAddBasic={addBasic}
            activeFrame={activeFrame}
            onFrameLayoutChange={updateFrameLayout}
            selectedElement={selectedElement}
            onElementPropsChange={updateSelectedElement}
            onAddImage={addImage}
          />

          <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">
              {zoomPct}%
            </span>
            <button
              className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
