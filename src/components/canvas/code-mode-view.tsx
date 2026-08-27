"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BoxSelect,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileCode2,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Monitor,
  MousePointer2,
  Palette,
  PlugZap,
  Smartphone,
  Type as TypeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeviceFrame, type DeviceMode } from "@/components/present/device-frame";
import type { HealthScreenId } from "@/components/present/health-app/screens";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";
import {
  CODE_FRAMEWORKS,
  CODE_TABS,
  SCREEN_ORDER,
  SCREEN_SPECS,
  buildFileTree,
  type CodeFramework,
  type CodeTab,
  type FileNode,
} from "@/components/canvas/code-types";
import { SHARED_FILES, generateScreenCode, type CodeLine } from "@/components/canvas/code-generators";
import { HighlightedLine } from "@/components/canvas/code-highlight";
import { BOX_MODEL_BY_TYPE, getComputedStyleByType, ScreenPreview, findNode } from "@/components/canvas/code-screen-preview";

const VARIATION_IDS: VariationId[] = ["bold", "playful", "minimal"];

function FileTree({
  nodes,
  depth,
  collapsedFolders,
  onToggleFolder,
  selectedFileId,
  onSelectFile,
}: {
  nodes: FileNode[];
  depth: number;
  collapsedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  selectedFileId: string;
  onSelectFile: (node: FileNode) => void;
}) {
  return (
    <>
      {nodes.map((node) =>
        node.kind === "folder" ? (
          <div key={node.id}>
            <button
              onClick={() => onToggleFolder(node.id)}
              style={{ paddingLeft: depth * 12 + 8 }}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-secondary"
            >
              {collapsedFolders.has(node.id) ? <Folder className="h-3.5 w-3.5 shrink-0" /> : <FolderOpen className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{node.name}</span>
            </button>
            {!collapsedFolders.has(node.id) && node.children && (
              <FileTree
                nodes={node.children}
                depth={depth + 1}
                collapsedFolders={collapsedFolders}
                onToggleFolder={onToggleFolder}
                selectedFileId={selectedFileId}
                onSelectFile={onSelectFile}
              />
            )}
          </div>
        ) : (
          <button
            key={node.id}
            onClick={() => onSelectFile(node)}
            style={{ paddingLeft: depth * 12 + 8 }}
            className={cn(
              "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs",
              selectedFileId === node.id ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary",
            )}
          >
            <FileCode2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
        ),
      )}
    </>
  );
}

function BoxModelDiagram({ box }: { box: { margin: string; border: string; padding: string; content: string } }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "#2c2013" }}>
      <div className="relative rounded border border-dashed border-[#c9a06c]/40 pt-6 pr-4 pb-4 pl-4" style={{ background: "#8a6238" }}>
        <span className="absolute top-1.5 left-2 text-[10px]" style={{ color: "#f2e2c8" }}>
          margin
        </span>
        <span className="absolute top-1.5 right-2 text-[10px]" style={{ color: "#f2e2c8" }}>
          {box.margin}
        </span>
        <div className="relative mt-1 rounded border border-dashed border-[#e4cda2]/40 pt-6 pr-4 pb-4 pl-4" style={{ background: "#c9a06c" }}>
          <span className="absolute top-1.5 left-2 text-[10px]" style={{ color: "#3a2a1a" }}>
            border
          </span>
          <span className="absolute top-1.5 right-2 text-[10px]" style={{ color: "#3a2a1a" }}>
            {box.border}
          </span>
          <div className="relative mt-1 rounded border border-dashed border-[#c7dfb8]/50 pt-6 pr-4 pb-4 pl-4" style={{ background: "#a8c99a" }}>
            <span className="absolute top-1.5 left-2 text-[10px]" style={{ color: "#233018" }}>
              padding
            </span>
            <span className="absolute top-1.5 right-2 text-[10px]" style={{ color: "#233018" }}>
              {box.padding}
            </span>
            <div className="mt-1 flex items-center justify-center rounded border border-dashed border-[#7fb3d5] py-5" style={{ background: "#6fa8c9" }}>
              <span className="text-[11px] font-medium text-white">{box.content}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CodeModeView() {
  const [activeScreen, setActiveScreen] = useState<HealthScreenId>("splash");
  const [framework, setFramework] = useState<CodeFramework>("react-native");
  // Single-select, unlike Manual Edit's Variations menu (which can show several
  // rows at once) — Code Mode only ever previews/generates one variation's
  // worth of code at a time, chosen right next to the framework it's shown in.
  const [variation, setVariation] = useState<VariationId>("bold");
  const [variationMenuOpen, setVariationMenuOpen] = useState(false);
  const [tab, setTab] = useState<CodeTab>("ui");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [pickerActive, setPickerActive] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState("screen-splash");
  const [screenMenuOpen, setScreenMenuOpen] = useState(false);
  const [frameworkMenuOpen, setFrameworkMenuOpen] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [leftPct, setLeftPct] = useState(42);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  // Manual edits, kept per file+framework so switching languages or files never
  // clobbers what you typed elsewhere. Once a file has been hand-edited its
  // generated node→line mapping is no longer trustworthy, so click-to-select
  // and the preview highlight naturally stop applying to it (see `lines` below).
  const [editedCode, setEditedCode] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lineRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const theme = VARIATION_THEMES[variation];
  const fileTree = useMemo(() => buildFileTree(framework), [framework]);
  const isScreenFile = selectedFileId.startsWith("screen-");
  const codeScreenId = isScreenFile ? (selectedFileId.slice("screen-".length) as HealthScreenId) : activeScreen;

  const codeLines: CodeLine[] = useMemo(() => {
    if (isScreenFile) return generateScreenCode(SCREEN_SPECS[codeScreenId], framework, theme);
    const raw = SHARED_FILES[selectedFileId]?.[framework]?.(theme);
    if (raw) return raw.split("\n").map((text) => ({ nodeId: null, text }));
    const frameworkLabel = CODE_FRAMEWORKS.find((f) => f.id === framework)?.label;
    return [{ nodeId: null, text: `// No ${frameworkLabel} code generated yet for this file.` }];
  }, [isScreenFile, codeScreenId, framework, selectedFileId, theme]);

  const codeKey = `${framework}::${variation}::${selectedFileId}`;
  const baselineText = useMemo(() => codeLines.map((l) => l.text).join("\n"), [codeLines]);
  const isEdited = codeKey in editedCode;
  const displayText = isEdited ? editedCode[codeKey] : baselineText;
  // While unedited, every line still carries its generating node's id (so
  // clicking the preview can find and highlight it); once you start typing,
  // line numbers keep tracking what's actually in the box, but the node
  // mapping is dropped since edited lines no longer correspond to it.
  const lines: CodeLine[] = isEdited ? displayText.split("\n").map((text) => ({ nodeId: null, text })) : codeLines;

  useEffect(() => {
    if (!selectedNodeId) return;
    const el = lineRefs.current.get(selectedNodeId);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selectedNodeId, selectedFileId]);

  function selectScreen(id: HealthScreenId) {
    setActiveScreen(id);
    setSelectedNodeId(null);
    setSelectedFileId((prev) => (prev.startsWith("screen-") ? `screen-${id}` : prev));
    setScreenMenuOpen(false);
  }

  function stepScreen(dir: 1 | -1) {
    const idx = SCREEN_ORDER.indexOf(activeScreen);
    selectScreen(SCREEN_ORDER[(idx + dir + SCREEN_ORDER.length) % SCREEN_ORDER.length]);
  }

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFile(node: FileNode) {
    if (node.kind !== "file") return;
    if (node.screenId) {
      // Unlike selectScreen (used by the dropdown/arrows, which only follows
      // the active screen into the file tree if it was already showing one),
      // an explicit click on a screen file in the tree must always switch to
      // it — otherwise, once you've opened a components/assets file, clicking
      // a screen file back in the tree would silently do nothing.
      setActiveScreen(node.screenId);
      setSelectedNodeId(null);
      setSelectedFileId(node.id);
      setScreenMenuOpen(false);
    } else {
      setSelectedFileId(node.id);
    }
  }

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(displayText).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDividerPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function handleDividerPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(75, Math.max(22, pct)));
  }
  function handleDividerPointerUp() {
    draggingRef.current = false;
  }

  const selectedNode = selectedNodeId ? findNode(SCREEN_SPECS[activeScreen], selectedNodeId) : null;
  const selectedScreenAssetNode = SCREEN_SPECS[activeScreen].nodes.find((n) => n.type === "image" || n.type === "avatar");

  return (
    <div ref={containerRef} className="relative flex min-h-0 flex-1 overflow-hidden bg-background">
      {/* Left — device-framed, click-to-select screen preview */}
      <div className="flex min-h-0 min-w-0 flex-col border-r border-border/60" style={{ width: `${leftPct}%` }}>
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <div className="relative">
            <button
              onClick={() => setScreenMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              {SCREEN_SPECS[activeScreen].name}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {screenMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setScreenMenuOpen(false)} />
                <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                  <p className="px-2 pt-1 pb-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">{SCREEN_ORDER.length} screens</p>
                  <div className="max-h-64 overflow-y-auto">
                    {SCREEN_ORDER.map((id, i) => (
                      <button
                        key={id}
                        onClick={() => selectScreen(id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs",
                          activeScreen === id ? "bg-primary/20 text-primary" : "hover:bg-secondary",
                        )}
                      >
                        <span className="w-5 shrink-0 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                        {SCREEN_SPECS[id].name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
            <button
              onClick={() => setDeviceMode("mobile")}
              aria-label="Mobile preview"
              className={cn("flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground", deviceMode === "mobile" && "bg-primary/15 text-primary")}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode("web")}
              aria-label="Desktop preview"
              className={cn("flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground", deviceMode === "web" && "bg-primary/15 text-primary")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
            <button
              onClick={() => setPickerActive(false)}
              aria-label="Pointer"
              className={cn("flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground", !pickerActive && "bg-primary/15 text-primary")}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPickerActive(true)}
              aria-label="Select element"
              className={cn("flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground", pickerActive && "bg-primary/15 text-primary")}
            >
              <BoxSelect className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0c0c0e] p-6">
          <button
            onClick={() => stepScreen(-1)}
            aria-label="Previous screen"
            className="absolute left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <DeviceFrame mode={deviceMode}>
            <ScreenPreview spec={SCREEN_SPECS[activeScreen]} theme={theme} selectMode={pickerActive} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
          </DeviceFrame>

          <button
            onClick={() => stepScreen(1)}
            aria-label="Next screen"
            className="absolute right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="border-t border-border/60 p-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change you want to make…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => {
                if (!prompt.trim()) return;
                toast("AI code edits are coming soon.");
                setPrompt("");
              }}
              aria-label="Submit"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Draggable splitter with quick expand-left / expand-right nudges */}
      <div
        onPointerDown={handleDividerPointerDown}
        onPointerMove={handleDividerPointerMove}
        onPointerUp={handleDividerPointerUp}
        className="group relative z-10 w-1 shrink-0 cursor-col-resize bg-border/60 hover:bg-primary/50"
      >
        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1 rounded-full border border-border/60 bg-card p-1 opacity-0 group-hover:opacity-100">
          <button onClick={() => setLeftPct(70)} aria-label="Expand left panel" className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </button>
          <button onClick={() => setLeftPct(22)} aria-label="Expand right panel" className="rounded p-0.5 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3 w-3 rotate-180" />
          </button>
        </div>
      </div>

      {/* Right — tabs, framework switch, file tree, code/assets/API/inspect */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-border/60 px-3">
          {CODE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "border-b-2 px-0.5 py-2.5 text-xs font-medium",
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "ui" && (
          <>
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setFrameworkMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    {CODE_FRAMEWORKS.find((f) => f.id === framework)?.label}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {frameworkMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setFrameworkMenuOpen(false)} />
                      <div className="absolute top-full left-0 z-50 mt-1.5 w-44 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                        {CODE_FRAMEWORKS.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setFramework(f.id);
                              setFrameworkMenuOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs",
                              framework === f.id ? "bg-primary/20 text-primary" : "hover:bg-secondary",
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Single-select, unlike Manual Edit's multi-row Variations menu —
                    Code Mode only ever shows one variation's code/preview at a time. */}
                <div className="relative">
                  <button
                    onClick={() => setVariationMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    {theme.label}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {variationMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setVariationMenuOpen(false)} />
                      <div className="absolute top-full left-0 z-50 mt-1.5 w-36 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                        {VARIATION_IDS.map((v) => (
                          <button
                            key={v}
                            onClick={() => {
                              setVariation(v);
                              setVariationMenuOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs",
                              variation === v ? "bg-primary/20 text-primary" : "hover:bg-secondary",
                            )}
                          >
                            {VARIATION_THEMES[v].label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex min-h-0 flex-1">
              <div className="w-44 shrink-0 overflow-y-auto border-r border-border/60 py-2">
                <p className="px-3 pb-1 text-[10px] tracking-wide text-muted-foreground uppercase">Files</p>
                <FileTree
                  nodes={fileTree}
                  depth={0}
                  collapsedFolders={collapsedFolders}
                  onToggleFolder={toggleFolder}
                  selectedFileId={selectedFileId}
                  onSelectFile={selectFile}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[#1e1e1e] font-mono text-[12px] leading-5">
                <div className="relative min-w-full">
                  <div>
                    {lines.map((l, i) => (
                      <div
                        key={i}
                        ref={(el) => {
                          if (el && l.nodeId) lineRefs.current.set(l.nodeId, el);
                        }}
                        className={cn("flex px-3 whitespace-pre", l.nodeId && l.nodeId === selectedNodeId && "bg-primary/20")}
                      >
                        <span className="w-8 shrink-0 select-none pr-3 text-right text-[#6e7681]">{i + 1}</span>
                        <span>
                          <HighlightedLine text={l.text} />
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Transparent textarea laid exactly over the highlighted lines above —
                      same font/line-height/gutter offset — so typing edits the real text
                      while what's visible underneath still looks syntax-highlighted. */}
                  <textarea
                    key={codeKey}
                    value={displayText}
                    onChange={(e) => setEditedCode((prev) => ({ ...prev, [codeKey]: e.target.value }))}
                    spellCheck={false}
                    wrap="off"
                    className="absolute inset-0 resize-none overflow-hidden border-0 bg-transparent pl-11 pr-3 font-mono text-[12px] leading-5 whitespace-pre text-transparent caret-white outline-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "api" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/60">
              <PlugZap className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No API endpoints yet</p>
            <p className="max-w-[280px] text-xs text-muted-foreground">This project doesn&apos;t call any backend yet. Once you wire one up, its requests and endpoints will show up here.</p>
            <button
              onClick={() => toast("Generating an API is coming soon.")}
              className="mt-1 rounded-full border border-primary px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Generate API
            </button>
          </div>
        )}

        {tab === "assets" && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
              <ImageIcon className="h-3 w-3" /> Images
            </p>
            <div className="mb-5 flex flex-wrap gap-3">
              {selectedScreenAssetNode ? (
                <div className="flex w-28 flex-col gap-1.5 rounded-xl border border-border/60 p-2.5">
                  <div className="flex h-14 items-center justify-center rounded-lg bg-secondary/60">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="truncate text-[10px] text-muted-foreground">{selectedScreenAssetNode.label.toLowerCase()}.png</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No images used on this screen.</p>
              )}
            </div>

            <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
              <Palette className="h-3 w-3" /> Colors
            </p>
            <div className="mb-5 flex flex-wrap gap-3">
              {[
                { name: "Primary", hex: theme.primary },
                { name: "Text", hex: theme.text },
                { name: "Muted", hex: theme.muted },
                { name: "Surface", hex: theme.surface },
                { name: "Border", hex: theme.border },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(c.hex).catch(() => {});
                    toast(`Copied ${c.hex}`);
                  }}
                  className="flex w-28 flex-col gap-1.5 rounded-xl border border-border/60 p-2.5 text-left hover:bg-secondary/40"
                >
                  <div className="h-10 rounded-lg" style={{ background: c.hex }} />
                  <p className="text-[10px] font-medium">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.hex}</p>
                </button>
              ))}
            </div>

            <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-wide text-muted-foreground uppercase">
              <TypeIcon className="h-3 w-3" /> Typography
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border border-border/60 p-2.5 text-left">
                <p className="text-sm font-bold">Inter</p>
                <p className="text-[10px] text-muted-foreground">Heading / Body / Label</p>
              </div>
            </div>
          </div>
        )}

        {tab === "inspect" && (
          <div className="flex-1 overflow-y-auto p-4">
            {selectedNode ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{selectedNode.label}</p>
                  <BoxModelDiagram box={BOX_MODEL_BY_TYPE[selectedNode.type]} />
                </div>
                <div className="rounded-xl border border-border/60">
                  {Object.entries(getComputedStyleByType(theme)[selectedNode.type]).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-xs last:border-b-0">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <BoxSelect className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Turn on the select tool and click an element in the preview to inspect it.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
