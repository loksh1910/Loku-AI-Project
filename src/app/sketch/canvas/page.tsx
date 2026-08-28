"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Undo2, Redo2, Share2, Sparkles, HelpCircle, ExternalLink } from "lucide-react";
import { SketchLeftRail } from "@/components/sketch/sketch-left-rail";
import { ScreensPanel } from "@/components/sketch/screens-panel";
import { RightSketchTools } from "@/components/sketch/right-sketch-tools";
import { BottomToolbar } from "@/components/sketch/bottom-toolbar";
import { SketchCanvasView } from "@/components/sketch/sketch-canvas-view";
import { ConnectorInteractionBox } from "@/components/sketch/connector-interaction-box";
import { GenerateQuestionsOverlay, type GenerateAnswers } from "@/components/sketch/generate-questions-overlay";
import { AiBuildingOverlay } from "@/components/sketch/ai-building-overlay";
import { PresentModeView } from "@/components/present/present-mode-view";
import { ModeSwitch, type ViewMode } from "@/components/present/mode-switch";
import { PresentLeftRail, type PresentPanel } from "@/components/present/present-left-rail";
import { PresentTopToolbar, type PresentTool } from "@/components/present/present-top-toolbar";
import type { DeviceMode } from "@/components/present/device-frame";
import type { HealthScreenId } from "@/components/present/health-app/screens";
import { CanvasModeView } from "@/components/canvas/canvas-mode-view";
import { CanvasPipelineBar, PIPELINE_TABS, type PipelineTab } from "@/components/canvas/canvas-pipeline-bar";
import { defaultVariationRow, type CanvasItem } from "@/components/canvas/canvas-types";
import { UserFlowView } from "@/components/canvas/user-flow-view";
import { buildDefaultFlow, buildDefaultSitemap, buildEmptyFlow, type FlowEdge, type FlowNode } from "@/components/canvas/flow-types";
import { ManualEditView } from "@/components/canvas/manual-edit-view";
import { ManualPrototypeView } from "@/components/canvas/manual-prototype-view";
import { ManualPresentView } from "@/components/canvas/manual-present-view";
import { newManualFrame, buildEmptyManual, type ManualElement, type ManualFrame } from "@/components/canvas/manual-types";
import type { ManualInteraction } from "@/components/canvas/manual-prototype-types";
import { buildHealthScreensManual } from "@/components/canvas/manual-health-seed";
import { CodeModeView } from "@/components/canvas/code-mode-view";
import { GenerateTabOverlay } from "@/components/canvas/generate-tab-overlay";
import { ExportMenu, type ExportScreen } from "@/components/canvas/export-menu";
import { PublishMenu } from "@/components/present/publish-menu";
import { SCREEN_ORDER, SCREEN_SPECS } from "@/components/canvas/code-types";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tip } from "@/components/ui/tip";
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

// Start-with-your-design's own pipeline tabs — everything AI would derive
// from the imported file, each gated behind its own one-time "Generate X" prompt.
const LOCKABLE_TABS: PipelineTab[] = ["prototype", "wireframe", "userflow", "sitemap", "code"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Snapshot = { frames: SketchFrame[]; elements: SketchElement[] };

function SketchCanvasPage() {
  const { isSignedIn, hydrated, userName, touchRecentProject } = useAppState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryParam = searchParams.get("entry");
  // "Start from Template" reuses this exact page — same Present/Canvas modes,
  // same pipeline tabs — it just skips Sketch mode entirely and boots straight
  // into Present with the template's screens already "generated". Every other
  // piece of state below is untouched by this: the health-app screens are the
  // same seeded content Sketch-to-UI itself generates.
  const fromTemplate = entryParam === "template";
  // "Sitemap/User Flow to UI" also reuses this exact page and skips Sketch —
  // but unlike the template entry, nothing's generated yet: it boots into the
  // "flow" mode (a blank User Flow or Sitemap canvas, picked on /flow) and the
  // user draws their own structure before clicking Generate UI.
  const flowKind: "userflow" | "sitemap" | null =
    entryParam === "userflow" ? "userflow" : entryParam === "sitemap" ? "sitemap" : null;
  // "Start from Scratch" has two distinct entries sharing this same page:
  // - "design": the manual, Figma-style entry — an empty canvas, Design +
  //   Prototype pipeline tabs only, no AI generation at all, ever.
  // - "scratch": the AI-prompt entry (typed in the Dashboard's own AI bar) —
  //   an empty AI-mode canvas that opens straight into the same 7-question
  //   overlay used everywhere else, using the typed prompt as the answer.
  const isDesignEntry = entryParam === "design";
  const aiScratch = entryParam === "scratch";
  const initialPromptParam = searchParams.get("prompt") ?? "";
  // "Start with your design" (Figma/Markdown import) — boots straight into
  // Canvas Mode's AI tab with the same real seeded content Template/Sketch
  // already generate (there's no real file parsing behind this, so the mock
  // import always "produces" the same HealthVisor app). AI mode and Design
  // are usable immediately; every other pipeline tab (Prototype, Wireframe,
  // User Flow, Sitemap, Code) is something AI would derive FROM the import,
  // so each gates behind its own one-time "Generate X" prompt — see
  // unlockedTabs below.
  const fromDesignImport = entryParam === "import";
  // Neither entry has a sketch of its own to switch back to.
  const noSketchMode = fromTemplate || flowKind !== null || isDesignEntry || aiScratch || fromDesignImport;

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
  const [projectName, setProjectName] = useState(
    fromTemplate
      ? "HealthVisor App"
      : flowKind === "sitemap"
        ? "Sitemap Project"
        : flowKind === "userflow"
          ? "User Flow Project"
          : isDesignEntry
            ? "Untitled Design"
            : aiScratch
              ? "New Project"
              : fromDesignImport
                ? "Healthcare App Design"
                : "Project name",
  );
  const [editingName, setEditingName] = useState(false);
  const [flowStage, setFlowStage] = useState<"idle" | "questions" | "building">(
    aiScratch && initialPromptParam ? "questions" : "idle",
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    fromTemplate ? "present" : flowKind ? "flow" : isDesignEntry || aiScratch || fromDesignImport ? "canvas" : "sketch",
  );
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [maxVariations, setMaxVariations] = useState(3);
  const [presentPanel, setPresentPanel] = useState<PresentPanel>("screens");
  // The Design/Prototype and Start-with-your-design entries never gate behind
  // a generation step the way Sketch/Scratch do — they want the Canvas/Present
  // switch available from the very first frame.
  const [hasGenerated, setHasGenerated] = useState(fromTemplate || isDesignEntry || fromDesignImport);
  // Start-with-your-design only: which pipeline tabs have had their one-time
  // "Generate X" prompt completed. AI mode + Design need no such gate.
  const [unlockedTabs, setUnlockedTabs] = useState<Set<PipelineTab>>(
    () => new Set<PipelineTab>(fromDesignImport ? ["ai", "manualedit"] : []),
  );
  const [generatingTab, setGeneratingTab] = useState<PipelineTab | null>(null);
  const [presentTool, setPresentTool] = useState<PresentTool>("pointer");
  const [presentDeviceMode, setPresentDeviceMode] = useState<DeviceMode>("mobile");
  const [presentActiveScreen, setPresentActiveScreen] = useState<HealthScreenId>("splash");
  const [presentPast, setPresentPast] = useState<HealthScreenId[]>([]);
  const [presentFuture, setPresentFuture] = useState<HealthScreenId[]>([]);
  const [canvasPipelineTab, setCanvasPipelineTab] = useState<PipelineTab>(isDesignEntry ? "manualedit" : "ai");
  // PresentScreensPanel always lists the fixed 6-screen HealthVisor set (it has
  // no notion of "no screens yet") — correct once something's actually
  // generated, misleading before that, so the aiScratch entry starts with it
  // closed rather than showing a "6 screens" list against a genuinely empty canvas.
  const [canvasPanel, setCanvasPanel] = useState<PresentPanel>(aiScratch ? null : "screens");
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>(() => (aiScratch ? [] : defaultVariationRow("bold", 0)));
  const [canvasPast, setCanvasPast] = useState<CanvasItem[][]>([]);
  const [canvasFuture, setCanvasFuture] = useState<CanvasItem[][]>([]);
  const [flowGraph, setFlowGraph] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }>(() =>
    flowKind === "userflow" ? buildEmptyFlow() : buildDefaultFlow(),
  );
  const [flowPast, setFlowPast] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const [flowFuture, setFlowFuture] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const [sitemapGraph, setSitemapGraph] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }>(() =>
    flowKind === "sitemap" ? buildEmptyFlow() : buildDefaultSitemap(),
  );
  const [sitemapPast, setSitemapPast] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const [sitemapFuture, setSitemapFuture] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }[]>([]);
  const [manualScreensOpen, setManualScreensOpen] = useState(true);
  const [manualGraph, setManualGraph] = useState<{ frames: ManualFrame[]; elements: ManualElement[] }>(() =>
    isDesignEntry ? buildEmptyManual() : buildHealthScreensManual(),
  );
  const [manualPast, setManualPast] = useState<{ frames: ManualFrame[]; elements: ManualElement[] }[]>([]);
  const [manualFuture, setManualFuture] = useState<{ frames: ManualFrame[]; elements: ManualElement[] }[]>([]);
  const [manualInteractions, setManualInteractions] = useState<ManualInteraction[]>([]);
  // The Prototype tab can now drag/resize the same frames/elements Design mode
  // edits AND create/edit/delete wires, so its one Undo/Redo button needs a
  // single history spanning both kinds of change, in the order they actually
  // happened — two separate stacks (graph vs interactions) can't interleave
  // correctly. Design tab keeps its own separate manualPast/manualFuture.
  type ProtoSnapshot = { frames: ManualFrame[]; elements: ManualElement[]; interactions: ManualInteraction[] };
  const [protoPast, setProtoPast] = useState<ProtoSnapshot[]>([]);
  const [protoFuture, setProtoFuture] = useState<ProtoSnapshot[]>([]);
  // Present Mode's own screen-to-screen navigation history for the Design/
  // Prototype entry — mirrors presentPast/presentFuture above, just keyed to
  // freeform frame ids instead of the fixed HealthScreenId union.
  const [manualPresentActiveFrameIdRaw, setManualPresentActiveFrameIdRaw] = useState<string | null>(null);
  const [manualPresentPast, setManualPresentPast] = useState<string[]>([]);
  const [manualPresentFuture, setManualPresentFuture] = useState<string[]>([]);

  function presentNavigate(id: HealthScreenId) {
    setPresentPast((p) => [...p, presentActiveScreen]);
    setPresentFuture([]);
    setPresentActiveScreen(id);
  }

  function presentUndo() {
    if (presentPast.length === 0) return;
    const prev = presentPast[presentPast.length - 1];
    setPresentPast((p) => p.slice(0, -1));
    setPresentFuture((f) => [presentActiveScreen, ...f]);
    setPresentActiveScreen(prev);
  }

  function presentRedo() {
    if (presentFuture.length === 0) return;
    const next = presentFuture[0];
    setPresentFuture((f) => f.slice(1));
    setPresentPast((p) => [...p, presentActiveScreen]);
    setPresentActiveScreen(next);
  }

  const canvasCommit = useCallback(
    (updater: (prev: CanvasItem[]) => CanvasItem[]) => {
      setCanvasPast((p) => [...p, canvasItems].slice(-50));
      setCanvasFuture([]);
      setCanvasItems(updater(canvasItems));
    },
    [canvasItems],
  );

  const canvasBeginChange = useCallback(() => {
    setCanvasPast((p) => [...p, canvasItems].slice(-50));
    setCanvasFuture([]);
  }, [canvasItems]);

  const canvasUndo = useCallback(() => {
    if (canvasPast.length === 0) return;
    const prev = canvasPast[canvasPast.length - 1];
    setCanvasPast((p) => p.slice(0, -1));
    setCanvasFuture((f) => [canvasItems, ...f]);
    setCanvasItems(prev);
  }, [canvasPast, canvasItems]);

  const canvasRedo = useCallback(() => {
    if (canvasFuture.length === 0) return;
    const next = canvasFuture[0];
    setCanvasFuture((f) => f.slice(1));
    setCanvasPast((p) => [...p, canvasItems]);
    setCanvasItems(next);
  }, [canvasFuture, canvasItems]);

  const flowCommit = useCallback(
    (updater: (prev: { nodes: FlowNode[]; edges: FlowEdge[] }) => { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      setFlowPast((p) => [...p, flowGraph].slice(-50));
      setFlowFuture([]);
      setFlowGraph(updater(flowGraph));
    },
    [flowGraph],
  );

  const flowBeginChange = useCallback(() => {
    setFlowPast((p) => [...p, flowGraph].slice(-50));
    setFlowFuture([]);
  }, [flowGraph]);

  const flowUndo = useCallback(() => {
    if (flowPast.length === 0) return;
    const prev = flowPast[flowPast.length - 1];
    setFlowPast((p) => p.slice(0, -1));
    setFlowFuture((f) => [flowGraph, ...f]);
    setFlowGraph(prev);
  }, [flowPast, flowGraph]);

  const flowRedo = useCallback(() => {
    if (flowFuture.length === 0) return;
    const next = flowFuture[0];
    setFlowFuture((f) => f.slice(1));
    setFlowPast((p) => [...p, flowGraph]);
    setFlowGraph(next);
  }, [flowFuture, flowGraph]);

  const sitemapCommit = useCallback(
    (updater: (prev: { nodes: FlowNode[]; edges: FlowEdge[] }) => { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      setSitemapPast((p) => [...p, sitemapGraph].slice(-50));
      setSitemapFuture([]);
      setSitemapGraph(updater(sitemapGraph));
    },
    [sitemapGraph],
  );

  const sitemapBeginChange = useCallback(() => {
    setSitemapPast((p) => [...p, sitemapGraph].slice(-50));
    setSitemapFuture([]);
  }, [sitemapGraph]);

  const sitemapUndo = useCallback(() => {
    if (sitemapPast.length === 0) return;
    const prev = sitemapPast[sitemapPast.length - 1];
    setSitemapPast((p) => p.slice(0, -1));
    setSitemapFuture((f) => [sitemapGraph, ...f]);
    setSitemapGraph(prev);
  }, [sitemapPast, sitemapGraph]);

  const sitemapRedo = useCallback(() => {
    if (sitemapFuture.length === 0) return;
    const next = sitemapFuture[0];
    setSitemapFuture((f) => f.slice(1));
    setSitemapPast((p) => [...p, sitemapGraph]);
    setSitemapGraph(next);
  }, [sitemapFuture, sitemapGraph]);

  const manualCommit = useCallback(
    (updater: (prev: { frames: ManualFrame[]; elements: ManualElement[] }) => { frames: ManualFrame[]; elements: ManualElement[] }) => {
      setManualPast((p) => [...p, manualGraph].slice(-50));
      setManualFuture([]);
      setManualGraph(updater(manualGraph));
    },
    [manualGraph],
  );

  const manualBeginChange = useCallback(() => {
    setManualPast((p) => [...p, manualGraph].slice(-50));
    setManualFuture([]);
  }, [manualGraph]);

  const manualUndo = useCallback(() => {
    if (manualPast.length === 0) return;
    const prev = manualPast[manualPast.length - 1];
    setManualPast((p) => p.slice(0, -1));
    setManualFuture((f) => [manualGraph, ...f]);
    setManualGraph(prev);
  }, [manualPast, manualGraph]);

  const manualRedo = useCallback(() => {
    if (manualFuture.length === 0) return;
    const next = manualFuture[0];
    setManualFuture((f) => f.slice(1));
    setManualPast((p) => [...p, manualGraph]);
    setManualGraph(next);
  }, [manualFuture, manualGraph]);

  const protoSnapshot = useCallback(
    (): ProtoSnapshot => ({ frames: manualGraph.frames, elements: manualGraph.elements, interactions: manualInteractions }),
    [manualGraph, manualInteractions],
  );

  // Continuous drag/resize in Prototype tab snapshots once at gesture-start
  // (matching every other view's onBeginChange), then mutates manualGraph
  // directly per pointer move — no history entry per pixel.
  const protoBeginChange = useCallback(() => {
    setProtoPast((p) => [...p, protoSnapshot()].slice(-50));
    setProtoFuture([]);
  }, [protoSnapshot]);

  // Discrete wire operations (create on drop, field edits, delete) commit in
  // one shot, same shape as every other pipeline's xCommit.
  const protoCommitInteractions = useCallback(
    (updater: (prev: ManualInteraction[]) => ManualInteraction[]) => {
      setProtoPast((p) => [...p, protoSnapshot()].slice(-50));
      setProtoFuture([]);
      setManualInteractions(updater(manualInteractions));
    },
    [protoSnapshot, manualInteractions],
  );

  const protoUndo = useCallback(() => {
    if (protoPast.length === 0) return;
    const prev = protoPast[protoPast.length - 1];
    setProtoPast((p) => p.slice(0, -1));
    setProtoFuture((f) => [protoSnapshot(), ...f]);
    setManualGraph({ frames: prev.frames, elements: prev.elements });
    setManualInteractions(prev.interactions);
  }, [protoPast, protoSnapshot]);

  const protoRedo = useCallback(() => {
    if (protoFuture.length === 0) return;
    const next = protoFuture[0];
    setProtoFuture((f) => f.slice(1));
    setProtoPast((p) => [...p, protoSnapshot()]);
    setManualGraph({ frames: next.frames, elements: next.elements });
    setManualInteractions(next.interactions);
  }, [protoFuture, protoSnapshot]);

  // Reactive rather than a plain default value: falls back to the first frame
  // whenever nothing's been visited yet, or whatever was active got deleted
  // back in Design mode while Present wasn't looking.
  const manualPresentActiveFrameId =
    manualPresentActiveFrameIdRaw && manualGraph.frames.some((f) => f.id === manualPresentActiveFrameIdRaw)
      ? manualPresentActiveFrameIdRaw
      : (manualGraph.frames[0]?.id ?? null);

  function manualPresentNavigate(frameId: string) {
    if (manualPresentActiveFrameId) setManualPresentPast((p) => [...p, manualPresentActiveFrameId]);
    setManualPresentFuture([]);
    setManualPresentActiveFrameIdRaw(frameId);
  }

  function manualPresentUndo() {
    if (manualPresentPast.length === 0) return;
    const prev = manualPresentPast[manualPresentPast.length - 1];
    setManualPresentPast((p) => p.slice(0, -1));
    if (manualPresentActiveFrameId) setManualPresentFuture((f) => [manualPresentActiveFrameId, ...f]);
    setManualPresentActiveFrameIdRaw(prev);
  }

  function manualPresentRedo() {
    if (manualPresentFuture.length === 0) return;
    const next = manualPresentFuture[0];
    setManualPresentFuture((f) => f.slice(1));
    if (manualPresentActiveFrameId) setManualPresentPast((p) => [...p, manualPresentActiveFrameId]);
    setManualPresentActiveFrameIdRaw(next);
  }

  function generateTab(tab: PipelineTab) {
    setGeneratingTab(tab);
  }

  function completeGenerateTab() {
    setUnlockedTabs((prev) => {
      if (!generatingTab) return prev;
      return new Set([...prev, generatingTab]);
    });
    setGeneratingTab(null);
  }

  function addManualFrame(device: SketchDevice) {
    const lastX = manualGraph.frames.length
      ? Math.max(...manualGraph.frames.map((f) => f.x + f.device.width)) + 80
      : 0;
    const frame = newManualFrame(device, lastX, `Screen ${manualGraph.frames.length + 1}`);
    manualCommit((prev) => ({ frames: [...prev.frames, frame], elements: prev.elements }));
  }

  function renameManualFrame(id: string, name: string) {
    setManualGraph((g) => ({ ...g, frames: g.frames.map((f) => (f.id === id ? { ...f, name } : f)) }));
  }

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

  const isDesignPrototypeTab = isDesignEntry && canvasPipelineTab === "prototype";
  const canvasPipelineUndo = isDesignPrototypeTab
    ? protoUndo
    : canvasPipelineTab === "userflow"
      ? flowUndo
      : canvasPipelineTab === "sitemap"
        ? sitemapUndo
        : canvasPipelineTab === "manualedit"
          ? manualUndo
          : canvasUndo;
  const canvasPipelineRedo = isDesignPrototypeTab
    ? protoRedo
    : canvasPipelineTab === "userflow"
      ? flowRedo
      : canvasPipelineTab === "sitemap"
        ? sitemapRedo
        : canvasPipelineTab === "manualedit"
          ? manualRedo
          : canvasRedo;
  const canvasPipelineCanUndo = isDesignPrototypeTab
    ? protoPast.length > 0
    : canvasPipelineTab === "userflow"
      ? flowPast.length > 0
      : canvasPipelineTab === "sitemap"
        ? sitemapPast.length > 0
        : canvasPipelineTab === "manualedit"
          ? manualPast.length > 0
          : canvasPast.length > 0;
  const canvasPipelineCanRedo = isDesignPrototypeTab
    ? protoFuture.length > 0
    : canvasPipelineTab === "userflow"
      ? flowFuture.length > 0
      : canvasPipelineTab === "sitemap"
        ? sitemapFuture.length > 0
        : canvasPipelineTab === "manualedit"
          ? manualFuture.length > 0
          : canvasFuture.length > 0;

  // What "Export" operates on depends entirely on which pipeline tab is
  // active — the AI-generated tabs share the fixed health-app screen set,
  // while Manual Edit/Design-Prototype and Sketch mode export whatever real
  // frames the user has actually drawn. Flow modes (User Flow/Sitemap) have
  // no "screens" of their own yet, so they just get an empty list — Export
  // stays in its normal empty state rather than doing something fake.
  const healthScreens: ExportScreen[] = SCREEN_ORDER.map((id) => ({ id, label: SCREEN_SPECS[id].name }));
  const exportScreens: ExportScreen[] =
    viewMode === "sketch"
      ? frames.map((f) => ({ id: f.id, label: f.name }))
      : viewMode === "canvas"
        ? isDesignPrototypeTab || canvasPipelineTab === "manualedit"
          ? manualGraph.frames.map((f) => ({ id: f.id, label: f.name }))
          : canvasPipelineTab === "userflow" || canvasPipelineTab === "sitemap"
            ? []
            : healthScreens
        : [];

  if (!isSignedIn) return null;

  const activeFrame = frames.find((f) => f.id === activeFrameId) ?? null;
  const selectedElement = elements.find((el) => el.id === selectedElementId) ?? null;
  const styleMode = bottomTool === "text" || selectedElement?.kind === "text" ? "text" : "stroke";

  const fromFrame = activeConnector ? frames.find((f) => f.id === activeConnector.connector.fromFrameId) : null;
  const toFrame = activeConnector ? frames.find((f) => f.id === activeConnector.connector.toFrameId) : null;

  return (
    <div className="relative flex h-screen overflow-hidden">
      {viewMode === "sketch" && (
        <SketchLeftRail
          onScreensClick={() => setScreensOpen((v) => !v)}
          screensActive={screensOpen}
        />
      )}
      {viewMode === "flow" && <SketchLeftRail />}
      {viewMode === "present" && isDesignEntry && (
        <SketchLeftRail onScreensClick={() => setManualScreensOpen((v) => !v)} screensActive={manualScreensOpen} />
      )}
      {viewMode === "present" && !isDesignEntry && <PresentLeftRail panel={presentPanel} onPanelChange={setPresentPanel} />}
      {viewMode === "canvas" && (canvasPipelineTab === "manualedit" || isDesignPrototypeTab) && (
        <SketchLeftRail onScreensClick={() => setManualScreensOpen((v) => !v)} screensActive={manualScreensOpen} />
      )}
      {viewMode === "canvas" && canvasPipelineTab !== "manualedit" && !isDesignPrototypeTab && (
        <PresentLeftRail panel={canvasPanel} onPanelChange={setCanvasPanel} />
      )}

      {viewMode === "present" && hasGenerated && (isDesignEntry ? manualGraph.frames.length > 0 : true) && (
        <div className="absolute top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
          <PresentTopToolbar
            tool={presentTool}
            onToolChange={setPresentTool}
            deviceMode={presentDeviceMode}
            onDeviceModeChange={setPresentDeviceMode}
            onUndo={isDesignEntry ? manualPresentUndo : presentUndo}
            onRedo={isDesignEntry ? manualPresentRedo : presentRedo}
            canUndo={isDesignEntry ? manualPresentPast.length > 0 : presentPast.length > 0}
            canRedo={isDesignEntry ? manualPresentFuture.length > 0 : presentFuture.length > 0}
            tools={isDesignEntry ? ["pointer"] : undefined}
            showDeviceToggle={!isDesignEntry}
          />
        </div>
      )}

      {viewMode === "canvas" && (
        <div className="absolute top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
            <Tip label="Undo" side="bottom">
              <button
                onClick={canvasPipelineUndo}
                disabled={!canvasPipelineCanUndo}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                aria-label="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
            <Tip label="Redo" side="bottom">
              <button
                onClick={canvasPipelineRedo}
                disabled={!canvasPipelineCanRedo}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                aria-label="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
          </div>
          <CanvasPipelineBar
            tab={canvasPipelineTab}
            tabs={isDesignEntry ? ["manualedit", "prototype"] : aiScratch && !hasGenerated ? ["ai"] : undefined}
            onTabChange={(t) => {
              if (t !== "ai" && t !== "prototype" && t !== "wireframe" && t !== "userflow" && t !== "sitemap" && t !== "manualedit" && t !== "code") {
                const label = PIPELINE_TABS.find((p) => p.id === t)?.label ?? t;
                toast(`${label} is coming soon.`);
                return;
              }
              setCanvasPipelineTab(t);
            }}
          />
        </div>
      )}

      {viewMode === "sketch" && (
        <>
          <div className="absolute top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
            <Tip label="Undo" side="bottom">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                aria-label="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
            <Tip label="Redo" side="bottom">
              <button
                onClick={redo}
                disabled={future.length === 0}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                aria-label="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
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
        </>
      )}

      {viewMode === "flow" && (
        <div className="absolute top-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
          <Tip label="Undo" side="bottom">
            <button
              onClick={flowKind === "sitemap" ? sitemapUndo : flowUndo}
              disabled={flowKind === "sitemap" ? sitemapPast.length === 0 : flowPast.length === 0}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
              aria-label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          </Tip>
          <Tip label="Redo" side="bottom">
            <button
              onClick={flowKind === "sitemap" ? sitemapRedo : flowRedo}
              disabled={flowKind === "sitemap" ? sitemapFuture.length === 0 : flowFuture.length === 0}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
              aria-label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </Tip>
        </div>
      )}

      {/* min-w-0 matters here: without it, this column refuses to shrink below
          its content's intrinsic width (a flex item's default min-width is
          "auto", not 0) — Code Mode's own unwrapped code lines are wide enough
          to hit that, stretching this column (and the header riding along
          inside it) past the viewport, clipped invisibly by the root's own
          overflow-hidden rather than made scrollable. */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
            {((viewMode === "sketch" && frames.length > 0) ||
              (viewMode === "flow" && (flowKind === "sitemap" ? sitemapGraph.nodes.length : flowGraph.nodes.length) > 2)) && (
              <button
                onClick={() => setFlowStage("questions")}
                className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate UI
              </button>
            )}
            {hasGenerated && (
              <ModeSwitch mode={viewMode} onModeChange={setViewMode} modes={noSketchMode ? ["present", "canvas"] : undefined} />
            )}
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-1.5 py-1">
              <ThemeToggle />
              <Tip label="Share" side="bottom">
                <button
                  onClick={() => toast("Share coming soon.")}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </Tip>
            </div>
            {viewMode === "present" ? (
              <>
                <Tip label="Open in new tab" side="bottom">
                  <button
                    onClick={() => window.open(window.location.href, "_blank")}
                    className="rounded-full border border-border/60 p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </Tip>
                <PublishMenu />
              </>
            ) : (
              <ExportMenu screens={exportScreens} />
            )}
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                {userName?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {viewMode === "flow" ? (
          <div className="relative flex flex-1 overflow-hidden">
            <UserFlowView
              nodes={flowKind === "sitemap" ? sitemapGraph.nodes : flowGraph.nodes}
              edges={flowKind === "sitemap" ? sitemapGraph.edges : flowGraph.edges}
              onNodesChange={(nodes) =>
                flowKind === "sitemap" ? setSitemapGraph((g) => ({ ...g, nodes })) : setFlowGraph((g) => ({ ...g, nodes }))
              }
              onCommit={flowKind === "sitemap" ? sitemapCommit : flowCommit}
              onBeginChange={flowKind === "sitemap" ? sitemapBeginChange : flowBeginChange}
              onUndo={flowKind === "sitemap" ? sitemapUndo : flowUndo}
              onRedo={flowKind === "sitemap" ? sitemapRedo : flowRedo}
              enableAutoArrange={flowKind === "sitemap"}
            />

            {flowStage === "building" && (
              <AiBuildingOverlay
                onComplete={() => {
                  setFlowStage("idle");
                  setHasGenerated(true);
                  setViewMode("present");
                }}
              />
            )}

            {flowStage === "questions" && (
              <GenerateQuestionsOverlay
                onClose={() => setFlowStage("idle")}
                onComplete={(answers: GenerateAnswers) => {
                  setGenerationPrompt(answers.extraNotes || answers.selections.type || "Build my app");
                  const count = Number(answers.selections.optionsCount);
                  setMaxVariations(count >= 1 && count <= 3 ? count : 3);
                  setFlowStage("building");
                }}
              />
            )}
          </div>
        ) : viewMode === "present" && isDesignEntry ? (
          <ManualPresentView
            frames={manualGraph.frames}
            elements={manualGraph.elements}
            interactions={manualInteractions}
            activeFrameId={manualPresentActiveFrameId}
            onNavigate={manualPresentNavigate}
            screensOpen={manualScreensOpen}
          />
        ) : viewMode === "present" ? (
          <PresentModeView
            generationPrompt={generationPrompt}
            maxVariations={maxVariations}
            panel={presentPanel}
            onPanelChange={setPresentPanel}
            tool={presentTool}
            deviceMode={presentDeviceMode}
            activeScreen={presentActiveScreen}
            onNavigate={presentNavigate}
            showVariations={!fromDesignImport}
            interactive={!fromDesignImport || unlockedTabs.has("prototype")}
          />
        ) : viewMode === "canvas" && fromDesignImport && LOCKABLE_TABS.includes(canvasPipelineTab) && !unlockedTabs.has(canvasPipelineTab) ? (
          <GenerateTabOverlay
            tab={canvasPipelineTab}
            generating={generatingTab === canvasPipelineTab}
            onGenerate={() => generateTab(canvasPipelineTab)}
            onGenerated={completeGenerateTab}
          />
        ) : viewMode === "canvas" && canvasPipelineTab === "userflow" ? (
          <UserFlowView
            nodes={flowGraph.nodes}
            edges={flowGraph.edges}
            onNodesChange={(nodes) => setFlowGraph((g) => ({ ...g, nodes }))}
            onCommit={flowCommit}
            onBeginChange={flowBeginChange}
            onUndo={flowUndo}
            onRedo={flowRedo}
          />
        ) : viewMode === "canvas" && canvasPipelineTab === "sitemap" ? (
          <UserFlowView
            nodes={sitemapGraph.nodes}
            edges={sitemapGraph.edges}
            onNodesChange={(nodes) => setSitemapGraph((g) => ({ ...g, nodes }))}
            onCommit={sitemapCommit}
            onBeginChange={sitemapBeginChange}
            onUndo={sitemapUndo}
            onRedo={sitemapRedo}
            enableAutoArrange
          />
        ) : viewMode === "canvas" && canvasPipelineTab === "manualedit" ? (
          <ManualEditView
            frames={manualGraph.frames}
            elements={manualGraph.elements}
            onFramesChange={(frames) => setManualGraph((g) => ({ ...g, frames }))}
            onElementsChange={(elements) => setManualGraph((g) => ({ ...g, elements }))}
            onCommit={manualCommit}
            onBeginChange={manualBeginChange}
            onUndo={manualUndo}
            onRedo={manualRedo}
            screensOpen={manualScreensOpen}
            onScreensOpenChange={setManualScreensOpen}
            showVariations={!isDesignEntry}
          />
        ) : viewMode === "canvas" && isDesignPrototypeTab ? (
          <ManualPrototypeView
            frames={manualGraph.frames}
            elements={manualGraph.elements}
            interactions={manualInteractions}
            onFramesChange={(frames) => setManualGraph((g) => ({ ...g, frames }))}
            onElementsChange={(elements) => setManualGraph((g) => ({ ...g, elements }))}
            onCommitInteractions={protoCommitInteractions}
            onBeginChange={protoBeginChange}
            onUndo={protoUndo}
            onRedo={protoRedo}
            onAddFrame={addManualFrame}
            onRenameFrame={renameManualFrame}
            screensOpen={manualScreensOpen}
            onScreensOpenChange={setManualScreensOpen}
          />
        ) : viewMode === "canvas" && canvasPipelineTab === "code" ? (
          <CodeModeView />
        ) : viewMode === "canvas" ? (
          <CanvasModeView
            generationPrompt={generationPrompt}
            panel={canvasPanel}
            onPanelChange={setCanvasPanel}
            items={canvasItems}
            onItemsChange={setCanvasItems}
            onCommitItems={canvasCommit}
            onBeginItemsChange={canvasBeginChange}
            onUndo={canvasUndo}
            onRedo={canvasRedo}
            pipelineTab={canvasPipelineTab}
            overlay={
              aiScratch && !hasGenerated ? (
                <>
                  {flowStage === "building" && (
                    <AiBuildingOverlay
                      onComplete={() => {
                        setFlowStage("idle");
                        setHasGenerated(true);
                        setViewMode("present");
                        // Present Mode's own rendering never reads canvasItems (it
                        // has its own hardcoded HealthVisor content) — every other
                        // entry seeds this from the start regardless, so Canvas
                        // Mode's AI tab isn't left empty once the user switches to it.
                        setCanvasItems(defaultVariationRow("bold", 0));
                        setCanvasPanel("screens");
                      }}
                    />
                  )}
                  {flowStage === "questions" && (
                    <GenerateQuestionsOverlay
                      onClose={() => setFlowStage("idle")}
                      onComplete={(answers: GenerateAnswers) => {
                        setGenerationPrompt(answers.extraNotes || initialPromptParam || answers.selections.type || "Build my app");
                        const count = Number(answers.selections.optionsCount);
                        setMaxVariations(count >= 1 && count <= 3 ? count : 3);
                        setFlowStage("building");
                      }}
                    />
                  )}
                </>
              ) : undefined
            }
          />
        ) : (
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

          {flowStage === "building" && (
            <AiBuildingOverlay
              onComplete={() => {
                setFlowStage("idle");
                setHasGenerated(true);
                setViewMode("present");
              }}
            />
          )}

          {flowStage === "questions" && (
            <GenerateQuestionsOverlay
              onClose={() => setFlowStage("idle")}
              onComplete={(answers: GenerateAnswers) => {
                setGenerationPrompt(answers.extraNotes || answers.selections.type || "Build my app");
                const count = Number(answers.selections.optionsCount);
                setMaxVariations(count >= 1 && count <= 3 ? count : 3);
                setFlowStage("building");
              }}
            />
          )}

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
            <Tip label="Help" side="top">
              <button
                className="rounded-full border border-border/60 bg-card p-1.5 hover:text-foreground"
                aria-label="Help"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </Tip>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default function SketchCanvasPageRoute() {
  // useSearchParams() requires a Suspense boundary above it in the App Router.
  return (
    <Suspense fallback={null}>
      <SketchCanvasPage />
    </Suspense>
  );
}
