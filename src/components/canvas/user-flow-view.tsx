"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PresentPromptBar } from "@/components/present/present-prompt-bar";
import { FlowInfoBox } from "@/components/canvas/flow-info-box";
import { FlowEditToolbar } from "@/components/canvas/flow-edit-toolbar";
import { FlowRightToolbar, type FlowTool } from "@/components/canvas/flow-right-toolbar";
import { CanvasVariationsMenu } from "@/components/canvas/canvas-variations-menu";
import type { VariationId } from "@/components/present/health-app/theme";
import {
  autoArrangeNodes,
  newFlowNode,
  type ArrangeDirection,
  type FlowEdge,
  type FlowNode,
  type FlowNodeShape,
} from "@/components/canvas/flow-types";
import { Tip } from "@/components/ui/tip";

const VARIATION_IDS: VariationId[] = ["bold", "playful", "minimal"];

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const WIRE_PAD = 4000;

type Selection = { kind: "node"; id: string } | { kind: "edge"; id: string } | null;
type DragState = { id: string; startX: number; startY: number; startClientX: number; startClientY: number };
type ConnectorDrag = { fromId: string; startX: number; startY: number; currentX: number; currentY: number };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function UserFlowView({
  nodes,
  edges,
  onNodesChange,
  onCommit,
  onBeginChange,
  onUndo,
  onRedo,
  enableAutoArrange = false,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onCommit: (updater: (prev: { nodes: FlowNode[]; edges: FlowEdge[] }) => { nodes: FlowNode[]; edges: FlowEdge[] }) => void;
  onBeginChange: () => void;
  onUndo: () => void;
  onRedo: () => void;
  /** Sitemap-only per the Figma reference — User Flow doesn't show this button. */
  enableAutoArrange?: boolean;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomPct, setZoomPct] = useState(100);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const zoomRef = useRef(zoom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [tool, setTool] = useState<FlowTool>("pointer");
  const [selection, setSelection] = useState<Selection>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [connectorDrag, setConnectorDrag] = useState<ConnectorDrag | null>(null);
  const [variations, setVariations] = useState<VariationId[]>(["bold"]);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const arrangeRef = useRef<HTMLDivElement>(null);
  // Tracked in state (rather than read from viewportRef during render) so the
  // toolbar/edge-midpoint position math below never touches a ref outside an
  // effect or event handler.
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

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
    function handlePointerDown(e: PointerEvent) {
      if (arrangeRef.current && !arrangeRef.current.contains(e.target as Node)) setArrangeOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleAutoArrange(direction: ArrangeDirection) {
    onCommit((prev) => ({ nodes: autoArrangeNodes(prev.nodes, prev.edges, direction), edges: prev.edges }));
    setArrangeOpen(false);
  }

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
        setTool("pointer");
        setConnectorDrag(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        if (selection.kind === "node") {
          onCommit((prev) => ({
            nodes: prev.nodes.filter((n) => n.id !== selection.id),
            edges: prev.edges.filter((ed) => ed.fromId !== selection.id && ed.toId !== selection.id),
          }));
        } else {
          onCommit((prev) => ({ nodes: prev.nodes, edges: prev.edges.filter((ed) => ed.id !== selection.id) }));
        }
        setSelection(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selection, onUndo, onRedo, onCommit]);

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
    if (dragRef.current) {
      const d = dragRef.current;
      const dx = (e.clientX - d.startClientX) / zoom;
      const dy = (e.clientY - d.startClientY) / zoom;
      onNodesChange(nodes.map((n) => (n.id === d.id ? { ...n, x: d.startX + dx, y: d.startY + dy } : n)));
    }
    if (connectorDrag && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const vx = e.clientX - rect.left;
      const vy = e.clientY - rect.top;
      setConnectorDrag({
        ...connectorDrag,
        currentX: vx - rect.width / 2 - pan.x + WIRE_PAD,
        currentY: vy - rect.height / 2 - pan.y + WIRE_PAD,
      });
    }
  }

  function handleViewportPointerUp(e: React.PointerEvent) {
    panStart.current = null;
    dragRef.current = null;
    if (connectorDrag) {
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-node-id]") as HTMLElement | null;
      const toId = target?.dataset.nodeId;
      if (toId && toId !== connectorDrag.fromId) {
        onCommit((prev) => ({
          nodes: prev.nodes,
          edges: [...prev.edges, { id: uid("edge"), fromId: connectorDrag.fromId, toId, stroke: "#6C5CE7", strokeWidth: 1.5, strokeStyle: "solid", textColor: "#FFFFFF", fontFamily: "Inter, sans-serif", fontSize: 10, bold: false, align: "center", bulleted: false }],
        }));
      }
      setConnectorDrag(null);
    }
  }

  function handleNodePointerDown(e: React.PointerEvent, node: FlowNode) {
    if (tool === "hand") return;
    e.stopPropagation();

    if (tool === "connector") {
      const rect = viewportRef.current?.getBoundingClientRect();
      const vx = e.clientX - (rect?.left ?? 0);
      const vy = e.clientY - (rect?.top ?? 0);
      const svgX = vx - (rect?.width ?? 0) / 2 - pan.x + WIRE_PAD;
      const svgY = vy - (rect?.height ?? 0) / 2 - pan.y + WIRE_PAD;
      setConnectorDrag({ fromId: node.id, startX: svgX, startY: svgY, currentX: svgX, currentY: svgY });
      return;
    }

    if (tool === "select") {
      setSelection((prev) =>
        prev?.kind === "node" && prev.id === node.id ? null : { kind: "node", id: node.id },
      );
      return;
    }

    setSelection({ kind: "node", id: node.id });
    onBeginChange();
    dragRef.current = { id: node.id, startX: node.x, startY: node.y, startClientX: e.clientX, startClientY: e.clientY };
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (tool !== "text") return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const localY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;
    const id = uid("text");
    onCommit((prev) => ({
      nodes: [...prev.nodes, { ...newFlowNode(id, "Text", localX, localY), shape: "text", w: 100, h: 24 }],
      edges: prev.edges,
    }));
    setSelection({ kind: "node", id });
    setTool("pointer");
  }

  function handleAddShape(shape: FlowNodeShape) {
    const id = uid("shape");
    const isSquareish = shape === "circle" || shape === "diamond" || shape === "triangle";
    onCommit((prev) => ({
      nodes: [
        ...prev.nodes,
        { ...newFlowNode(id, "New Step", 0, -220), shape, w: isSquareish ? 90 : 140, h: isSquareish ? 90 : 44 },
      ],
      edges: prev.edges,
    }));
    setSelection({ kind: "node", id });
  }

  function duplicateNode(node: FlowNode, dir: "top" | "right" | "bottom" | "left") {
    const gap = 40;
    const offset =
      dir === "right"
        ? { x: node.w + gap, y: 0 }
        : dir === "left"
          ? { x: -(node.w + gap), y: 0 }
          : dir === "bottom"
            ? { x: 0, y: node.h + gap }
            : { x: 0, y: -(node.h + gap) };
    const id = uid("dup");
    onCommit((prev) => ({
      nodes: [...prev.nodes, { ...node, id, x: node.x + offset.x, y: node.y + offset.y }],
      edges: prev.edges,
    }));
    setSelection({ kind: "node", id });
  }

  function updateSelectedStyle(patch: Record<string, unknown>) {
    if (!selection) return;
    if (selection.kind === "node") {
      onCommit((prev) => ({ nodes: prev.nodes.map((n) => (n.id === selection.id ? { ...n, ...patch } : n)), edges: prev.edges }));
    } else {
      onCommit((prev) => ({ nodes: prev.nodes, edges: prev.edges.map((ed) => (ed.id === selection.id ? { ...ed, ...patch } : ed)) }));
    }
  }

  const selectedNode = selection?.kind === "node" ? nodes.find((n) => n.id === selection.id) : null;
  const selectedEdge = selection?.kind === "edge" ? edges.find((e) => e.id === selection.id) : null;
  const matchedIds = new Set(
    search.trim() ? nodes.filter((n) => n.label.toLowerCase().includes(search.trim().toLowerCase())).map((n) => n.id) : [],
  );

  function edgeGroupInfo(edge: FlowEdge) {
    const siblings = edges.filter((e) => e.fromId === edge.fromId && e.toId === edge.toId);
    const idx = siblings.findIndex((e) => e.id === edge.id);
    return { idx, size: siblings.length };
  }

  function nodeCenterScreen(node: FlowNode) {
    return {
      x: viewportSize.width / 2 + pan.x + (node.x + node.w / 2) * zoom,
      y: viewportSize.height / 2 + pan.y + node.y * zoom,
    };
  }

  const toolbarTarget = selectedNode
    ? { style: selectedNode, screen: nodeCenterScreen(selectedNode) }
    : selectedEdge
      ? {
          style: selectedEdge,
          screen: (() => {
            const from = nodes.find((n) => n.id === selectedEdge.fromId);
            const to = nodes.find((n) => n.id === selectedEdge.toId);
            if (!from || !to) return { x: 0, y: 0 };
            const midX = ((from.x + from.w / 2 + to.x + to.w / 2) / 2) * zoom;
            const midY = ((from.y + from.h + to.y) / 2) * zoom;
            return { x: viewportSize.width / 2 + pan.x + midX, y: viewportSize.height / 2 + pan.y + midY };
          })(),
        }
      : null;

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <div
        ref={viewportRef}
        className={cn("absolute inset-0 select-none", tool === "hand" ? "cursor-grab active:cursor-grabbing" : tool === "text" ? "cursor-text" : "")}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerLeave={handleViewportPointerUp}
        onClick={handleCanvasClick}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          <svg
            className="pointer-events-none absolute overflow-visible"
            style={{ left: -WIRE_PAD, top: -WIRE_PAD, width: WIRE_PAD * 2, height: WIRE_PAD * 2 }}
          >
            <defs>
              <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="context-stroke" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.fromId);
              const to = nodes.find((n) => n.id === edge.toId);
              if (!from || !to) return null;
              const { idx, size } = edgeGroupInfo(edge);
              const bend = (idx - (size - 1) / 2) * 34;
              const fx = (from.x + from.w / 2) * zoom + WIRE_PAD;
              const fy = (from.y + from.h) * zoom + WIRE_PAD;
              const tx = (to.x + to.w / 2) * zoom + WIRE_PAD;
              const ty = to.y * zoom + WIRE_PAD;
              const midY = (fy + ty) / 2;
              const d = `M ${fx} ${fy} C ${fx + bend} ${midY}, ${tx + bend} ${midY}, ${tx} ${ty}`;
              const isSelected = selection?.kind === "edge" && selection.id === edge.id;
              return (
                <g key={edge.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={edge.stroke}
                    strokeWidth={isSelected ? edge.strokeWidth + 1 : edge.strokeWidth}
                    strokeDasharray={edge.strokeStyle === "dashed" ? "6 4" : edge.strokeStyle === "dotted" ? "1.5 4" : undefined}
                    markerEnd="url(#flow-arrow)"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelection({ kind: "edge", id: edge.id });
                    }}
                  />
                  {edge.label && (
                    <text
                      x={(fx + tx) / 2}
                      y={midY - 6}
                      textAnchor="middle"
                      fontSize={edge.fontSize}
                      fontWeight={edge.bold ? 700 : 400}
                      fill={edge.textColor}
                      fontFamily={edge.fontFamily}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
            {connectorDrag && (
              <line
                x1={connectorDrag.startX}
                y1={connectorDrag.startY}
                x2={connectorDrag.currentX}
                y2={connectorDrag.currentY}
                stroke="#8E51FF"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {nodes.map((node) => {
            const isSelected = selection?.kind === "node" && selection.id === node.id;
            const isMatched = matchedIds.has(node.id);
            const shapeStyle: React.CSSProperties = {
              width: node.w,
              height: node.h,
              background: node.shape === "text" ? "transparent" : node.fill,
              border: node.shape === "text" ? "none" : `${node.strokeWidth}px ${node.strokeStyle} ${node.stroke}`,
              borderRadius: node.shape === "roundedRect" ? 12 : node.shape === "rect" ? 2 : node.shape === "circle" ? 999 : 0,
              clipPath:
                node.shape === "diamond"
                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                  : node.shape === "triangle"
                    ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                    : undefined,
            };
            return (
              <div
                key={node.id}
                data-node-id={node.id}
                className="absolute"
                style={{ left: node.x * zoom, top: node.y * zoom, transform: `scale(${zoom})`, transformOrigin: "top left" }}
              >
                <div
                  onPointerDown={(e) => handleNodePointerDown(e, node)}
                  onDoubleClick={() => setRenamingId(node.id)}
                  className={cn(
                    "relative flex touch-none items-center justify-center px-2 text-center",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    isMatched && !isSelected && "ring-2 ring-[#F5A623]",
                  )}
                  style={shapeStyle}
                >
                  {renamingId === node.id ? (
                    <input
                      autoFocus
                      defaultValue={node.label}
                      onPointerDown={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        updateSelectedStyleFor(node.id, e.target.value.trim() || node.label);
                        setRenamingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="w-full bg-transparent text-center text-xs outline-none"
                      style={{ color: node.textColor }}
                    />
                  ) : (
                    <span
                      className="pointer-events-none block w-full truncate"
                      style={{
                        color: node.textColor,
                        fontFamily: node.fontFamily,
                        fontSize: node.fontSize,
                        fontWeight: node.bold ? 700 : 500,
                        textAlign: node.align,
                      }}
                    >
                      {node.bulleted ? "• " : ""}
                      {node.label}
                    </span>
                  )}

                  {isSelected && tool !== "hand" && (
                    <>
                      <PlusHandle dir="top" onClick={() => duplicateNode(node, "top")} />
                      <PlusHandle dir="right" onClick={() => duplicateNode(node, "right")} />
                      <PlusHandle dir="bottom" onClick={() => duplicateNode(node, "bottom")} />
                      <PlusHandle dir="left" onClick={() => duplicateNode(node, "left")} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FlowInfoBox nodes={nodes} edges={edges} search={search} onSearchChange={setSearch} />

      <div className="absolute top-4 right-5 z-30 flex items-center gap-2">
        {enableAutoArrange && (
          <div ref={arrangeRef} className="relative">
            <button
              onClick={() => setArrangeOpen((v) => !v)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary",
                arrangeOpen && "border-primary text-primary",
              )}
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              Auto Arrange
            </button>
            {arrangeOpen && (
              <div className="absolute top-full right-0 z-10 mt-2 w-[150px] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                <button
                  onClick={() => handleAutoArrange("vertical")}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  Vertical
                </button>
                <button
                  onClick={() => handleAutoArrange("horizontal")}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  Horizontal
                </button>
              </div>
            )}
          </div>
        )}
        <CanvasVariationsMenu variationIds={VARIATION_IDS} active={variations} onApply={setVariations} />
      </div>

      <div className="absolute top-1/2 right-5 z-30 -translate-y-1/2">
        <FlowRightToolbar tool={tool} onToolChange={setTool} onAddShape={handleAddShape} />
      </div>

      {toolbarTarget && (
        <FlowEditToolbar
          style={selectedNode ? { ...selectedNode, fill: selectedNode.fill } : (selectedEdge as FlowEdge)}
          onChange={updateSelectedStyle}
          x={toolbarTarget.screen.x}
          y={toolbarTarget.screen.y - 14}
        />
      )}

      <PresentPromptBar taggedElement={selectedNode?.label ?? selectedEdge?.label ?? null} onClearTag={() => setSelection(null)} />

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

  function updateSelectedStyleFor(nodeId: string, label: string) {
    onCommit((prev) => ({ nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, label } : n)), edges: prev.edges }));
  }
}

function PlusHandle({ dir, onClick }: { dir: "top" | "right" | "bottom" | "left"; onClick: () => void }) {
  const posClass = {
    top: "-top-7 left-1/2 -translate-x-1/2",
    bottom: "-bottom-7 left-1/2 -translate-x-1/2",
    left: "-left-7 top-1/2 -translate-y-1/2",
    right: "-right-7 top-1/2 -translate-y-1/2",
  }[dir];
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "absolute flex h-5 w-5 items-center justify-center rounded-full border border-primary/60 bg-popover text-primary hover:bg-primary/10",
        posClass,
      )}
      aria-label={`Duplicate ${dir}`}
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}
