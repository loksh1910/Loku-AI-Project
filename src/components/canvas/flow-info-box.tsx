"use client";

import { useRef, useState } from "react";
import { Pencil, Search } from "lucide-react";
import type { FlowEdge, FlowNode } from "@/components/canvas/flow-types";

export function FlowInfoBox({
  nodes,
  edges,
  search,
  onSearchChange,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const [pos, setPos] = useState({ x: 24, y: 96 });
  const dragRef = useRef<{ startX: number; startY: number; px: number; py: number } | null>(null);

  const start = nodes.find((n) => n.kind === "start");
  const end = nodes.find((n) => n.kind === "end");
  const decisions = nodes.filter((n) => n.kind === "decision").length;

  function handleHeaderPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, px: pos.x, py: pos.y };
    function handleMove(ev: PointerEvent) {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.px + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.py + (ev.clientY - dragRef.current.startY),
      });
    }
    function handleUp() {
      dragRef.current = null;
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    }
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      className="absolute z-40 w-[220px] rounded-2xl border border-border/60 bg-popover p-3.5 shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div onPointerDown={handleHeaderPointerDown} className="mb-2 flex cursor-grab items-center justify-between active:cursor-grabbing">
        <span className="text-sm font-semibold">Flow</span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for elements..."
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mb-3 space-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2ECC71]" />
          <span className="text-muted-foreground">Start —</span>
          <span className="truncate font-medium">{start?.label ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6584]" />
          <span className="text-muted-foreground">End —</span>
          <span className="truncate font-medium">{end?.label ?? "—"}</span>
        </div>
      </div>

      <div className="border-t border-border/60 pt-2.5">
        <p className="mb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Summary</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Steps</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Decisions</span>
            <span className="font-medium">{decisions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connections</span>
            <span className="font-medium">{edges.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
