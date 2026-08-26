"use client";

import { useEffect, useRef, useState } from "react";
import { BoxSelect, Frame as FrameIcon, Hand, Layers, MousePointer2, PenTool, Scissors, Type, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShapePickerGrid } from "@/components/canvas/flow-shape-picker";
import { COLOR_SWATCHES, type FlowNodeShape } from "@/components/canvas/flow-types";

export type ManualTool = "pointer" | "hand" | "select" | "frame" | "pen" | "text";

const TOOLS: { id: ManualTool; icon: typeof MousePointer2; label: string }[] = [
  { id: "pointer", icon: MousePointer2, label: "Pointer" },
  { id: "hand", icon: Hand, label: "Hand tool" },
  { id: "select", icon: BoxSelect, label: "Group select" },
];

const FRAME_TYPES = [
  { id: "Frame", icon: FrameIcon },
  { id: "Section", icon: Layers },
  { id: "Slice", icon: Scissors },
];

export function ManualBottomToolbar({
  tool,
  onToolChange,
  onAddShape,
  defaultColor,
  onDefaultColorChange,
}: {
  tool: ManualTool;
  onToolChange: (tool: ManualTool) => void;
  onAddShape: (shape: FlowNodeShape) => void;
  defaultColor: string;
  onDefaultColorChange: (color: string) => void;
}) {
  const [openPopup, setOpenPopup] = useState<"frame" | "shapes" | "color" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenPopup(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="relative flex items-center gap-1 rounded-full border border-border/60 bg-popover px-2 py-1.5 shadow-xl">
        {openPopup === "frame" && (
          <Popup>
            {FRAME_TYPES.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  onToolChange("frame");
                  setOpenPopup(null);
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.id}
              </button>
            ))}
          </Popup>
        )}

        {openPopup === "shapes" && (
          <Popup>
            <ShapePickerGrid
              onSelect={(s) => {
                onAddShape(s);
                setOpenPopup(null);
              }}
            />
          </Popup>
        )}

        {openPopup === "color" && (
          <Popup>
            <div className="w-[190px] p-2.5">
              <p className="mb-2 text-[10px] text-muted-foreground">Default color for new shapes</p>
              <div className="grid grid-cols-8 gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => onDefaultColorChange(c)}
                    className={cn("h-5 w-5 rounded-full border", defaultColor === c ? "border-primary ring-1 ring-primary" : "border-white/20")}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={defaultColor}
                onChange={(e) => onDefaultColorChange(e.target.value)}
                className="mt-2 h-6 w-full cursor-pointer rounded"
              />
            </div>
          </Popup>
        )}

        {TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={tool === t.id}
            onClick={() => {
              onToolChange(t.id);
              setOpenPopup(null);
            }}
          />
        ))}

        <ToolButton
          icon={FrameIcon}
          label="Frame"
          active={tool === "frame"}
          onClick={() => setOpenPopup(openPopup === "frame" ? null : "frame")}
        />
        <ToolButton
          icon={Layers}
          label="Shapes"
          active={openPopup === "shapes"}
          onClick={() => setOpenPopup(openPopup === "shapes" ? null : "shapes")}
        />
        <ToolButton icon={PenTool} label="Pen" active={tool === "pen"} onClick={() => { onToolChange("pen"); setOpenPopup(null); }} />
        <ToolButton icon={Type} label="Text" active={tool === "text"} onClick={() => { onToolChange("text"); setOpenPopup(null); }} />
        <ToolButton
          icon={Palette}
          label="Color"
          active={openPopup === "color"}
          onClick={() => setOpenPopup(openPopup === "color" ? null : "color")}
        />
      </div>
    </div>
  );
}

function Popup({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-border/60 bg-popover shadow-xl">
      {children}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MousePointer2;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
