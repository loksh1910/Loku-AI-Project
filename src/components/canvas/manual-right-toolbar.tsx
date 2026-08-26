"use client";

import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  Crosshair,
  FlipHorizontal2,
  FlipVertical2,
  LayoutPanelTop,
  Droplet,
  Diamond,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, FONT_FAMILIES, FONT_SIZES } from "@/components/canvas/flow-types";
import type { BlendMode, FlowDirection, ManualElement, ManualFrame, StrokePosition } from "@/components/canvas/manual-types";

export type PanelKey = "position" | "layout" | "appearance" | "fill" | "typography" | "stroke" | "effects";

const PANELS: { id: PanelKey; icon: typeof Crosshair; label: string }[] = [
  { id: "position", icon: Crosshair, label: "Position" },
  { id: "layout", icon: LayoutPanelTop, label: "Layout" },
  { id: "appearance", icon: Droplet, label: "Appearance" },
  { id: "fill", icon: Diamond, label: "Fill" },
  { id: "typography", icon: TypeIcon, label: "Typography" },
  { id: "stroke", icon: AlignHorizontalJustifyCenter, label: "Stroke" },
  { id: "effects", icon: Sparkles, label: "Effects" },
];

const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay"];
const STROKE_POSITIONS: StrokePosition[] = ["inside", "outside", "center"];

export function ManualRightToolbar({
  frame,
  element,
  onUpdateFrame,
  onUpdateElement,
  onDistribute,
  panel,
  onPanelChange,
}: {
  frame: ManualFrame | null;
  element: ManualElement | null;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  onDistribute: (direction: Exclude<FlowDirection, "none">) => void;
  panel: PanelKey | null;
  onPanelChange: (panel: PanelKey | null) => void;
}) {

  return (
    <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
      <div className="relative flex flex-col gap-1 rounded-full border border-border/60 bg-popover p-1.5 shadow-lg">
        {panel && (
          <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2">
            {panel === "position" && <PositionPanel frame={frame} element={element} onUpdateFrame={onUpdateFrame} onUpdateElement={onUpdateElement} />}
            {panel === "layout" && <LayoutPanel frame={frame} onUpdateFrame={onUpdateFrame} onDistribute={onDistribute} />}
            {panel === "appearance" && element && <AppearancePanel element={element} onUpdateElement={onUpdateElement} />}
            {panel === "fill" && element && <FillPanel element={element} onUpdateElement={onUpdateElement} />}
            {panel === "typography" && element && <TypographyPanel element={element} onUpdateElement={onUpdateElement} />}
            {panel === "stroke" && element && <StrokePanel element={element} onUpdateElement={onUpdateElement} />}
            {panel === "effects" && element && <EffectsPanel element={element} onUpdateElement={onUpdateElement} />}
            {panel !== "position" && panel !== "layout" && !element && <EmptyPanel />}
          </div>
        )}

        {PANELS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPanelChange(panel === p.id ? null : p.id)}
            aria-label={p.label}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
              panel === p.id && "bg-primary/15 text-primary",
            )}
          >
            <p.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-[220px] rounded-2xl border border-border/60 bg-popover p-3.5 shadow-2xl">
      <p className="mb-2.5 text-xs font-semibold">{title}</p>
      {children}
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="w-[200px] rounded-2xl border border-border/60 bg-popover p-3.5 text-center text-xs text-muted-foreground shadow-2xl">
      Select an element to edit its properties
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
      />
    </label>
  );
}

function PositionPanel({
  frame,
  element,
  onUpdateFrame,
  onUpdateElement,
}: {
  frame: ManualFrame | null;
  element: ManualElement | null;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
}) {
  if (element && frame) {
    const ALIGN = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 0.5 },
      { x: 0, y: 1 },
      { x: 0.5, y: 1 },
      { x: 1, y: 1 },
    ];
    return (
      <PanelShell title="Position">
        <p className="mb-1 text-[10px] text-muted-foreground">Alignment</p>
        <div className="mb-3 grid grid-cols-3 gap-1">
          {ALIGN.map((a, i) => (
            <button
              key={i}
              onClick={() =>
                onUpdateElement({
                  x: a.x * (frame.device.width - element.w),
                  y: a.y * (frame.device.height - element.h),
                })
              }
              className="flex h-6 items-center justify-center rounded-md border border-border/60 hover:border-primary hover:bg-primary/15"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </button>
          ))}
        </div>
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <NumberField label="X" value={element.x} onChange={(x) => onUpdateElement({ x })} />
          <NumberField label="Y" value={element.y} onChange={(y) => onUpdateElement({ y })} />
        </div>
        <NumberField label="Rotation" value={element.rotation} onChange={(rotation) => onUpdateElement({ rotation })} />
        <div className="mt-2.5 flex gap-1.5">
          <button
            onClick={() => onUpdateElement({ flipH: !element.flipH })}
            className={cn("flex h-7 flex-1 items-center justify-center rounded-lg border", element.flipH ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground")}
          >
            <FlipHorizontal2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onUpdateElement({ flipV: !element.flipV })}
            className={cn("flex h-7 flex-1 items-center justify-center rounded-lg border", element.flipV ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground")}
          >
            <FlipVertical2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </PanelShell>
    );
  }
  if (frame) {
    return (
      <PanelShell title="Position">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={frame.x} onChange={(x) => onUpdateFrame({ x })} />
          <NumberField label="Y" value={frame.y} onChange={(y) => onUpdateFrame({ y })} />
        </div>
      </PanelShell>
    );
  }
  return <EmptyPanel />;
}

function LayoutPanel({
  frame,
  onUpdateFrame,
  onDistribute,
}: {
  frame: ManualFrame | null;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onDistribute: (direction: Exclude<FlowDirection, "none">) => void;
}) {
  if (!frame) return <EmptyPanel />;
  return (
    <PanelShell title="Layout">
      <p className="mb-1 text-[10px] text-muted-foreground">Flow</p>
      <div className="mb-3 flex gap-1">
        {(["none", "horizontal", "vertical"] as FlowDirection[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              onUpdateFrame({ flow: f });
              if (f !== "none") onDistribute(f);
            }}
            className={cn(
              "flex-1 rounded-lg border py-1.5 text-[10px] capitalize",
              frame.flow === f ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-secondary",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Dimensions</p>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="W" value={frame.device.width} onChange={(width) => onUpdateFrame({ device: { ...frame.device, width } })} />
        <NumberField label="H" value={frame.device.height} onChange={(height) => onUpdateFrame({ device: { ...frame.device, height } })} />
      </div>
      <NumberField label="Spacing" value={frame.spacing} onChange={(spacing) => onUpdateFrame({ spacing })} />
      <p className="mt-2.5 mb-1 text-[10px] text-muted-foreground">Padding</p>
      <NumberField label="Padding" value={frame.padding} onChange={(padding) => onUpdateFrame({ padding })} />
      <label className="mt-2.5 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={frame.clipContent} onChange={(e) => onUpdateFrame({ clipContent: e.target.checked })} className="accent-primary" />
        Clip Content
      </label>
    </PanelShell>
  );
}

function AppearancePanel({ element, onUpdateElement }: { element: ManualElement; onUpdateElement: (patch: Partial<ManualElement>) => void }) {
  return (
    <PanelShell title="Appearance">
      <NumberField label="Opacity %" value={element.opacity} onChange={(opacity) => onUpdateElement({ opacity: Math.max(0, Math.min(100, opacity)) })} />
      <div className="mt-2.5">
        <NumberField label="Corner Radius" value={element.cornerRadius} onChange={(cornerRadius) => onUpdateElement({ cornerRadius })} />
      </div>
      <label className="mt-2.5 block">
        <span className="mb-1 block text-[10px] text-muted-foreground">Blend mode</span>
        <select
          value={element.blendMode}
          onChange={(e) => onUpdateElement({ blendMode: e.target.value as BlendMode })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none capitalize"
        >
          {BLEND_MODES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
    </PanelShell>
  );
}

function FillPanel({ element, onUpdateElement }: { element: ManualElement; onUpdateElement: (patch: Partial<ManualElement>) => void }) {
  return (
    <PanelShell title="Fill">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(element.fill) ? element.fill : "#000000"}
        onChange={(e) => onUpdateElement({ fill: e.target.value })}
        className="mb-2.5 h-24 w-full cursor-pointer rounded-lg"
      />
      <div className="mb-2.5 flex items-center gap-2">
        <input
          value={element.fill}
          onChange={(e) => onUpdateElement({ fill: e.target.value })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
        />
        <NumberField label="" value={element.fillOpacity} onChange={(fillOpacity) => onUpdateElement({ fillOpacity })} />
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {COLOR_SWATCHES.map((c) => (
          <button key={c} onClick={() => onUpdateElement({ fill: c })} className="h-5 w-5 rounded-full border border-white/20" style={{ background: c }} />
        ))}
      </div>
    </PanelShell>
  );
}

function TypographyPanel({ element, onUpdateElement }: { element: ManualElement; onUpdateElement: (patch: Partial<ManualElement>) => void }) {
  return (
    <PanelShell title="Typography">
      <label className="mb-2.5 block">
        <span className="mb-1 block text-[10px] text-muted-foreground">Font Family</span>
        <select
          value={element.fontFamily}
          onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted-foreground">Weight</span>
          <select
            value={element.fontWeight}
            onChange={(e) => onUpdateElement({ fontWeight: Number(e.target.value) })}
            className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
          >
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted-foreground">Size</span>
          <select
            value={element.fontSize}
            onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
            className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="Line height" value={element.lineHeight} onChange={(lineHeight) => onUpdateElement({ lineHeight })} />
        <NumberField label="Letter spacing" value={element.letterSpacing} onChange={(letterSpacing) => onUpdateElement({ letterSpacing })} />
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Alignment</p>
      <div className="flex gap-1">
        {[
          { id: "left", icon: AlignLeft },
          { id: "center", icon: AlignCenter },
          { id: "right", icon: AlignRight },
        ].map((a) => (
          <button
            key={a.id}
            onClick={() => onUpdateElement({ textAlign: a.id as ManualElement["textAlign"] })}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-lg border",
              element.textAlign === a.id ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
            )}
          >
            <a.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

function StrokePanel({ element, onUpdateElement }: { element: ManualElement; onUpdateElement: (patch: Partial<ManualElement>) => void }) {
  return (
    <PanelShell title="Stroke">
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted-foreground">Position</span>
          <select
            value={element.strokePosition}
            onChange={(e) => onUpdateElement({ strokePosition: e.target.value as StrokePosition })}
            className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none capitalize"
          >
            {STROKE_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <NumberField label="Weight" value={element.strokeWidth} onChange={(strokeWidth) => onUpdateElement({ strokeWidth })} />
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={element.stroke} onChange={(e) => onUpdateElement({ stroke: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded" />
        <div className="grid grid-cols-8 gap-1.5">
          {COLOR_SWATCHES.map((c) => (
            <button key={c} onClick={() => onUpdateElement({ stroke: c })} className="h-5 w-5 rounded-full border border-white/20" style={{ background: c }} />
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

function EffectsPanel({ element, onUpdateElement }: { element: ManualElement; onUpdateElement: (patch: Partial<ManualElement>) => void }) {
  return (
    <PanelShell title="Effects">
      <label className="mb-2.5 flex items-center gap-2 text-xs">
        <input type="checkbox" checked={element.hasShadow} onChange={(e) => onUpdateElement({ hasShadow: e.target.checked })} className="accent-primary" />
        Drop shadow
      </label>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.shadowX} onChange={(shadowX) => onUpdateElement({ shadowX })} />
        <NumberField label="Y" value={element.shadowY} onChange={(shadowY) => onUpdateElement({ shadowY })} />
      </div>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="Blur" value={element.shadowBlur} onChange={(shadowBlur) => onUpdateElement({ shadowBlur })} />
        <NumberField label="Opacity %" value={element.shadowOpacity} onChange={(shadowOpacity) => onUpdateElement({ shadowOpacity })} />
      </div>
      <input type="color" value={element.shadowColor} onChange={(e) => onUpdateElement({ shadowColor: e.target.value })} className="h-8 w-full cursor-pointer rounded" />
    </PanelShell>
  );
}
