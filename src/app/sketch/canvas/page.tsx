"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Redo2, Share2, Sparkles, HelpCircle } from "lucide-react";
import { SketchLeftRail } from "@/components/sketch/sketch-left-rail";
import { ScreensPanel } from "@/components/sketch/screens-panel";
import { RightSketchTools } from "@/components/sketch/right-sketch-tools";
import { BottomToolbar } from "@/components/sketch/bottom-toolbar";
import { SketchCanvasView } from "@/components/sketch/sketch-canvas-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/components/providers/app-state-provider";
import type { SketchDevice } from "@/lib/sketch-devices";
import {
  DEFAULT_STROKE,
  type BasicElementType,
  type BottomTool,
  type RightPanelKey,
  type ShapeType,
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
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const [screensOpen, setScreensOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanelKey>(null);
  const [bottomTool, setBottomTool] = useState<BottomTool>("pointer");
  const [armedShape, setArmedShape] = useState<ShapeType | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [stroke, setStroke] = useState(DEFAULT_STROKE);

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

  function undo() {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ frames, elements }, ...f]);
    setFrames(prev.frames);
    setElements(prev.elements);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { frames, elements }]);
    setFrames(next.frames);
    setElements(next.elements);
  }

  function addFrame(device: SketchDevice) {
    const id = uid();
    const lastX = frames.length
      ? Math.max(...frames.map((f) => f.x + f.device.width * 0.4)) + FRAME_GAP
      : 0;
    const newFrame: SketchFrame = {
      id,
      name: `Screen${frames.length + 1}`,
      device,
      x: frames.length ? lastX : 0,
      y: 0,
      autoLayout: { enabled: false, spacing: 12, padding: 16 },
      showGrid: false,
    };
    commit((prev) => ({ frames: [...prev.frames, newFrame], elements: prev.elements }));
    setActiveFrameId(id);
    if (frames.length === 0) {
      touchRecentProject("sketch-project-1", "Project name");
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
      x: source.x + source.device.width * 0.4 + FRAME_GAP,
      y: source.y,
      autoLayout: { enabled: false, spacing: 12, padding: 16 },
      showGrid: false,
    };
    commit((prev) => ({ frames: [...prev.frames, newFrame], elements: prev.elements }));
    setActiveFrameId(id);
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

    const el: SketchElement = {
      id: uid(),
      frameId: frame.id,
      kind: "box",
      type,
      x,
      y,
      w,
      h,
      rotation: 0,
    };
    commit((prev) => ({ frames: prev.frames, elements: [...prev.elements, el] }));
  }

  function addPath(frameId: string, points: { x: number; y: number }[]) {
    const el: SketchElement = {
      id: uid(),
      frameId,
      kind: "path",
      points,
      stroke: { ...stroke },
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

  function updateSelectedElement(patch: Partial<{ x: number; y: number; w: number; h: number; rotation: number }>) {
    if (!selectedElementId) return;
    commit((prev) => ({
      frames: prev.frames,
      elements: prev.elements.map((el) =>
        el.id === selectedElementId && el.kind !== "path" ? { ...el, ...patch } : el,
      ),
    }));
  }

  function updateFrameLayout(
    patch: Partial<SketchFrame["autoLayout"] & { showGrid: boolean }>,
  ) {
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

  if (!isSignedIn) return null;

  const activeFrame = frames.find((f) => f.id === activeFrameId) ?? null;
  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;

  return (
    <div className="flex flex-1">
      <SketchLeftRail
        onScreensClick={() => setScreensOpen((v) => !v)}
        screensActive={screensOpen}
      />

      <div className="relative flex flex-1 flex-col">
        <header className="z-40 flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium text-muted-foreground">Project name</p>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
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

        <div className="relative flex-1">
          <SketchCanvasView
            frames={frames}
            elements={elements}
            tool={bottomTool}
            stroke={stroke}
            armedShape={armedShape}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onAddPath={addPath}
            onAddAdjacentFrame={addAdjacentFrame}
            onPlaceShape={placeShape}
            onSelectFrame={setActiveFrameId}
          />

          {screensOpen && (
            <ScreensPanel
              frames={frames}
              onAddFrame={addFrame}
              onClose={() => setScreensOpen(false)}
            />
          )}

          <RightSketchTools
            activePanel={rightPanel}
            onPanelChange={setRightPanel}
            stroke={stroke}
            onStrokeChange={(patch) => setStroke((s) => ({ ...s, ...patch }))}
            onAddBasic={addBasic}
            activeFrame={activeFrame}
            onFrameLayoutChange={updateFrameLayout}
            selectedElement={selectedElement}
            onElementPropsChange={updateSelectedElement}
            onAddImage={addImage}
          />

          <BottomToolbar
            tool={bottomTool}
            onToolChange={(t) => {
              setBottomTool(t);
              if (t === "pen") setRightPanel("style");
              if (t !== "shapes") setArmedShape(null);
            }}
            onPickShape={pickShape}
          />

          <div className="absolute right-4 bottom-4 z-30 flex items-center gap-2 text-muted-foreground">
            <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs">
              100%
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
