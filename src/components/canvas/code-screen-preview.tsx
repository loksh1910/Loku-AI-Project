"use client";

import { Bell, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenNode, ScreenNodeType, ScreenSpec } from "@/components/canvas/code-types";
import type { VariationTheme } from "@/components/present/health-app/theme";

// Representative box-model numbers per node type — this preview has no real layout
// engine to measure from, so these are hand-picked stand-ins good enough for the
// Inspect tab's box diagram, not a claim of pixel-exact computed layout. Sizes are
// generic across variations (only colors/radii differ, handled below).
export const BOX_MODEL_BY_TYPE: Record<ScreenNodeType, { margin: string; border: string; padding: string; content: string }> = {
  brand: { margin: "0 0 8 0", border: "0", padding: "0", content: "96×16" },
  heading: { margin: "0 0 6 0", border: "0", padding: "0", content: "140×22" },
  subtext: { margin: "0 0 16 0", border: "0", padding: "0", content: "201×28" },
  muted: { margin: "0 0 4 0", border: "0", padding: "0", content: "160×12" },
  label: { margin: "0 0 6 0", border: "0", padding: "0", content: "120×14" },
  button: { margin: "0 0 8 0", border: "0", padding: "12 20", content: "161×16" },
  outlineButton: { margin: "0 0 8 0", border: "1.5", padding: "12 20", content: "158×16" },
  field: { margin: "0 0 10 0", border: "1", padding: "10 14", content: "173×16" },
  card: { margin: "0 0 12 0", border: "0", padding: "14", content: "173×32" },
  image: { margin: "0 0 12 0", border: "0", padding: "0", content: "56×56" },
  avatar: { margin: "0", border: "0", padding: "0", content: "24×24" },
  row: { margin: "0 0 12 0", border: "0", padding: "0", content: "201×50" },
};

// A function of the current variation, not a static table, so the Inspect tab's
// computed-style list always matches what's actually on screen right now.
export function getComputedStyleByType(theme: VariationTheme): Record<ScreenNodeType, Record<string, string>> {
  return {
    brand: { color: theme.primary, "font-weight": "700", "font-size": "13px" },
    heading: { color: theme.text, "font-weight": String(theme.headingWeight), "font-size": "19px" },
    subtext: { color: theme.muted, "font-size": "10px", "text-align": "center" },
    muted: { color: theme.muted, "font-size": "9px" },
    label: { color: theme.text, "font-weight": "600", "font-size": "11px" },
    button: { background: theme.primary, color: theme.primaryText, "border-radius": theme.buttonRadius, "font-weight": "600" },
    outlineButton: { background: "transparent", color: theme.primary, border: `1.5px solid ${theme.primary}`, "border-radius": theme.buttonRadius },
    field: { background: theme.surface, border: `1px solid ${theme.border}`, "border-radius": theme.radius, color: theme.muted },
    card: { background: theme.surface, "border-radius": theme.radius, color: theme.text },
    image: { "border-radius": theme.radius, background: theme.surface },
    avatar: { "border-radius": "999px", background: theme.surface },
    row: { display: "flex", gap: "9px" },
  };
}

function NodeShell({
  node,
  selectMode,
  selectedNodeId,
  onSelectNode,
  className,
  style,
  children,
}: {
  node: ScreenNode;
  selectMode: boolean;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const selected = selectedNodeId === node.id;
  return (
    <div
      onClick={(e) => {
        if (!selectMode) return;
        e.stopPropagation();
        onSelectNode(node.id);
      }}
      data-node-id={node.id}
      className={cn(className, selectMode && "cursor-crosshair", selected && "outline outline-2 outline-offset-1 outline-primary")}
      style={style}
    >
      {children}
    </div>
  );
}

function renderNode(
  node: ScreenNode,
  theme: VariationTheme,
  selectMode: boolean,
  selectedNodeId: string | null,
  onSelectNode: (id: string) => void,
): React.ReactNode {
  const cardRadius = theme.radius;
  const btnRadius = theme.buttonRadius;
  switch (node.type) {
    case "image":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center"
          style={{ background: theme.surface, borderRadius: cardRadius }}
        >
          <ShieldCheck className="h-6 w-6" style={{ color: theme.primary }} />
        </NodeShell>
      );
    case "avatar":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
          style={{ background: node.label === "Bell" ? theme.surface : theme.primary, color: node.label === "Bell" ? theme.text : theme.primaryText }}
        >
          {node.label === "Bell" ? <Bell className="h-3 w-3" style={{ color: theme.text }} /> : node.label}
        </NodeShell>
      );
    case "brand":
      return (
        <NodeShell key={node.id} node={node} selectMode={selectMode} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} className="mb-1 text-center text-[13px] font-bold" style={{ color: theme.primary }}>
          {node.label}
        </NodeShell>
      );
    case "heading":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mb-1.5 text-center text-[17px]"
          style={{ color: theme.text, fontWeight: theme.headingWeight }}
        >
          {node.label}
        </NodeShell>
      );
    case "subtext":
      return (
        <NodeShell key={node.id} node={node} selectMode={selectMode} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} className="mb-4 text-center text-[10px] leading-snug" style={{ color: theme.muted }}>
          {node.label}
        </NodeShell>
      );
    case "muted":
      return (
        <NodeShell key={node.id} node={node} selectMode={selectMode} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} className="mb-1 text-[9px]" style={{ color: theme.muted }}>
          {node.label}
        </NodeShell>
      );
    case "label":
      return (
        <NodeShell key={node.id} node={node} selectMode={selectMode} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} className="mb-1.5 text-[11px] font-semibold" style={{ color: theme.text }}>
          {node.label}
        </NodeShell>
      );
    case "field":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mb-2.5 w-full px-3 py-2.5 text-[10px]"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted, borderRadius: cardRadius }}
        >
          {node.label}
        </NodeShell>
      );
    case "button":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mb-2 w-full py-2.5 text-center text-[11px] font-semibold"
          style={{ background: theme.primary, color: theme.primaryText, borderRadius: btnRadius }}
        >
          {node.label}
        </NodeShell>
      );
    case "outlineButton":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mb-2 w-full py-2.5 text-center text-[11px] font-semibold"
          style={{ background: "transparent", border: `1.5px solid ${theme.primary}`, color: theme.primary, borderRadius: btnRadius }}
        >
          {node.label}
        </NodeShell>
      );
    case "card":
      return (
        <NodeShell
          key={node.id}
          node={node}
          selectMode={selectMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          className="mb-2.5 w-full flex-1 p-3"
          style={{ background: theme.surface, borderRadius: cardRadius }}
        >
          <p className="text-[10px] font-semibold" style={{ color: theme.text }}>
            {node.label}
          </p>
          {node.sublabel && (
            <p className="mt-0.5 text-[9px]" style={{ color: theme.muted }}>
              {node.sublabel}
            </p>
          )}
        </NodeShell>
      );
    case "row":
      return (
        <NodeShell key={node.id} node={node} selectMode={selectMode} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} className="mb-2.5 flex gap-2">
          {(node.children ?? []).map((c) => renderNode(c, theme, selectMode, selectedNodeId, onSelectNode))}
        </NodeShell>
      );
  }
}

export function ScreenPreview({
  spec,
  theme,
  selectMode,
  selectedNodeId,
  onSelectNode,
}: {
  spec: ScreenSpec;
  theme: VariationTheme;
  selectMode: boolean;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  // Splash centers everything; every other screen reads top-down like a real app
  // page — matches health-app/screens.tsx's own layout split.
  const centered = spec.id === "splash";
  return (
    <div
      className={cn("flex h-full w-full flex-col overflow-y-auto px-5 pt-6 pb-4", centered && "items-center justify-center text-center")}
      style={{ background: theme.bg, fontFamily: theme.fontFamily }}
    >
      <div className={cn("w-full", centered && "flex flex-col items-center")}>
        {spec.nodes.map((node) => renderNode(node, theme, selectMode, selectedNodeId, onSelectNode))}
      </div>
    </div>
  );
}

export function findNode(spec: ScreenSpec, id: string): ScreenNode | null {
  for (const node of spec.nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const child = node.children.find((c) => c.id === id);
      if (child) return child;
    }
  }
  return null;
}
