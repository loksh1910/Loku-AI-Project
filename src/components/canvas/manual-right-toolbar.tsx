"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignVerticalJustifyCenter,
  BoxSelect,
  Crosshair,
  FlipHorizontal2,
  FlipVertical2,
  LayoutPanelTop,
  Droplet,
  Diamond,
  Star,
  Pin,
  Type as TypeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_SWATCHES, FONT_FAMILIES, FONT_SIZES } from "@/components/canvas/flow-types";
import {
  newManualElement,
  newManualFrame,
  type BlendMode,
  type EffectType,
  type FillType,
  type FlowDirection,
  type ManualElement,
  type ManualFrame,
  type ManualVerticalAlign,
  type StrokeCap,
  type StrokePosition,
} from "@/components/canvas/manual-types";

export type PanelKey = "position" | "layout" | "appearance" | "fill" | "typography" | "stroke" | "effects";

export const PANELS: { id: PanelKey; icon: typeof Crosshair; label: string }[] = [
  { id: "position", icon: Crosshair, label: "Position" },
  { id: "layout", icon: LayoutPanelTop, label: "Layout" },
  { id: "appearance", icon: Droplet, label: "Appearance" },
  { id: "fill", icon: Diamond, label: "Fill" },
  { id: "typography", icon: TypeIcon, label: "Typography" },
  { id: "stroke", icon: BoxSelect, label: "Stroke" },
  { id: "effects", icon: Star, label: "Effects" },
];

const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay"];
const STROKE_POSITIONS: StrokePosition[] = ["inside", "outside", "center"];
const STROKE_CAPS: StrokeCap[] = ["none", "round", "square"];
const EFFECT_TYPES: { id: EffectType; label: string }[] = [
  { id: "dropShadow", label: "Drop Shadow" },
  { id: "innerShadow", label: "Inner Shadow" },
];
const FILL_TYPES: { id: FillType; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradient" },
];

const DEFAULT_ELEMENT: ManualElement = newManualElement("", "rect", 0, 0, 100, 100);
const DEFAULT_FRAME: ManualFrame = newManualFrame({ label: "Frame", width: 241, height: 500 }, 0, "Frame");

export function ManualRightToolbar({
  frame,
  directFrame,
  element,
  onUpdateFrame,
  onUpdateElement,
  onDistribute,
  panel,
  onPanelChange,
}: {
  frame: ManualFrame | null;
  /** Non-null only when a frame itself (not an element's parent) is selected — gates Fill/Appearance's frame mode. */
  directFrame: ManualFrame | null;
  element: ManualElement | null;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  onDistribute: (direction: Exclude<FlowDirection, "none">) => void;
  panel: PanelKey | null;
  onPanelChange: (panel: PanelKey | null) => void;
}) {
  const el = element ?? DEFAULT_ELEMENT;
  const fr = frame ?? DEFAULT_FRAME;
  const [pinned, setPinned] = useState<Set<PanelKey>>(new Set());
  const openPanels = panel ? new Set([...pinned, panel]) : pinned;

  function togglePin(p: PanelKey) {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  return (
    <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
      <div className="relative flex flex-col gap-1 rounded-full border border-border/60 bg-popover p-1.5 shadow-lg">
        {openPanels.size > 0 && (
          <div className="absolute top-1/2 right-full mr-3 flex -translate-y-1/2 flex-col gap-2">
            {PANELS.filter((p) => openPanels.has(p.id)).map((p) => (
              <div key={p.id}>
                {p.id === "position" && <PositionPanel frame={fr} element={element ? el : null} onUpdateFrame={onUpdateFrame} onUpdateElement={onUpdateElement} pinned={pinned.has("position")} onTogglePin={() => togglePin("position")} />}
                {p.id === "layout" && <LayoutPanel frame={fr} onUpdateFrame={onUpdateFrame} onDistribute={onDistribute} pinned={pinned.has("layout")} onTogglePin={() => togglePin("layout")} />}
                {p.id === "appearance" &&
                  (element ? (
                    <AppearancePanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("appearance")} onTogglePin={() => togglePin("appearance")} />
                  ) : directFrame ? (
                    <FrameAppearancePanel frame={directFrame} onUpdateFrame={onUpdateFrame} pinned={pinned.has("appearance")} onTogglePin={() => togglePin("appearance")} />
                  ) : (
                    <AppearancePanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("appearance")} onTogglePin={() => togglePin("appearance")} />
                  ))}
                {p.id === "fill" &&
                  (element ? (
                    <FillPanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("fill")} onTogglePin={() => togglePin("fill")} />
                  ) : directFrame ? (
                    <FrameFillPanel frame={directFrame} onUpdateFrame={onUpdateFrame} pinned={pinned.has("fill")} onTogglePin={() => togglePin("fill")} />
                  ) : (
                    <FillPanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("fill")} onTogglePin={() => togglePin("fill")} />
                  ))}
                {p.id === "typography" && <TypographyPanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("typography")} onTogglePin={() => togglePin("typography")} />}
                {p.id === "stroke" && <StrokePanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("stroke")} onTogglePin={() => togglePin("stroke")} />}
                {p.id === "effects" && <EffectsPanel element={el} onUpdateElement={onUpdateElement} pinned={pinned.has("effects")} onTogglePin={() => togglePin("effects")} />}
              </div>
            ))}
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

function PanelShell({
  title,
  children,
  pinned,
  onTogglePin,
}: {
  title: string;
  children: React.ReactNode;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <div className="w-[230px] rounded-2xl border border-border/60 bg-popover p-3.5 shadow-2xl">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold">{title}</p>
        <button
          onClick={onTogglePin}
          aria-label={pinned ? "Unpin" : "Pin"}
          className={cn("rounded p-0.5", pinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <Pin className="h-3 w-3" fill={pinned ? "currentColor" : "none"} />
        </button>
      </div>
      {children}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[10px] text-muted-foreground">{label}</span>}
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
      />
    </label>
  );
}

// Matches the alignment-grid pattern already established in Sketch mode's own
// Properties panel — three rows of Left/Center/Right, each row targeting a
// different vertical anchor (top/middle/bottom) — kept functional here.
const ALIGN_GRID: { x: number; y: number; icon: typeof AlignLeft }[] = [
  { x: 0, y: 0, icon: AlignLeft },
  { x: 0.5, y: 0, icon: AlignCenter },
  { x: 1, y: 0, icon: AlignRight },
  { x: 0, y: 0.5, icon: AlignLeft },
  { x: 0.5, y: 0.5, icon: AlignCenter },
  { x: 1, y: 0.5, icon: AlignRight },
  { x: 0, y: 1, icon: AlignLeft },
  { x: 0.5, y: 1, icon: AlignCenter },
  { x: 1, y: 1, icon: AlignRight },
];

function PositionPanel({
  frame,
  element,
  onUpdateFrame,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  frame: ManualFrame;
  element: ManualElement | null;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  if (element) {
    return (
      <PanelShell title="Position" pinned={pinned} onTogglePin={onTogglePin}>
        <p className="mb-1 text-[10px] text-muted-foreground">Alignment</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {ALIGN_GRID.map((a, i) => (
            <button
              key={i}
              onClick={() =>
                onUpdateElement({
                  x: a.x * (frame.device.width - element.w),
                  y: a.y * (frame.device.height - element.h),
                })
              }
              className="flex items-center justify-center rounded-md bg-secondary/60 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <a.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
        <p className="mb-1 text-[10px] text-muted-foreground">Position</p>
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <NumberField label="X" value={element.x} onChange={(x) => onUpdateElement({ x })} />
          <NumberField label="Y" value={element.y} onChange={(y) => onUpdateElement({ y })} />
        </div>
        <p className="mb-1 text-[10px] text-muted-foreground">Dimensions</p>
        <div className="mb-2.5 grid grid-cols-2 gap-2">
          <NumberField label="W" value={element.w} onChange={(w) => onUpdateElement({ w })} />
          <NumberField label="H" value={element.h} onChange={(h) => onUpdateElement({ h })} />
        </div>
        <p className="mb-1 text-[10px] text-muted-foreground">Rotation</p>
        <div className="flex items-center gap-1.5">
          <NumberField label="" value={element.rotation} onChange={(rotation) => onUpdateElement({ rotation })} />
          <button
            onClick={() => onUpdateElement({ flipH: !element.flipH })}
            className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", element.flipH ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground")}
          >
            <FlipHorizontal2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onUpdateElement({ flipV: !element.flipV })}
            className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", element.flipV ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground")}
          >
            <FlipVertical2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </PanelShell>
    );
  }
  return (
    <PanelShell title="Position" pinned={pinned} onTogglePin={onTogglePin}>
      <p className="mb-1 text-[10px] text-muted-foreground">Position</p>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="X" value={frame.x} onChange={(x) => onUpdateFrame({ x })} />
        <NumberField label="Y" value={frame.y} onChange={(y) => onUpdateFrame({ y })} />
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Dimensions</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="W" value={frame.device.width} onChange={(width) => onUpdateFrame({ device: { ...frame.device, width } })} />
        <NumberField label="H" value={frame.device.height} onChange={(height) => onUpdateFrame({ device: { ...frame.device, height } })} />
      </div>
    </PanelShell>
  );
}

function LayoutPanel({
  frame,
  onUpdateFrame,
  onDistribute,
  pinned,
  onTogglePin,
}: {
  frame: ManualFrame;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  onDistribute: (direction: Exclude<FlowDirection, "none">) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Layout" pinned={pinned} onTogglePin={onTogglePin}>
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
      <p className="mb-1 text-[10px] text-muted-foreground">Spacing</p>
      <NumberField label="" value={frame.spacing} onChange={(spacing) => onUpdateFrame({ spacing })} />
      <p className="mt-2.5 mb-1 text-[10px] text-muted-foreground">Auto Layout</p>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="Padding H" value={frame.paddingH} onChange={(paddingH) => onUpdateFrame({ paddingH })} />
        <NumberField label="Padding V" value={frame.paddingV} onChange={(paddingV) => onUpdateFrame({ paddingV })} />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={frame.clipContent} onChange={(e) => onUpdateFrame({ clipContent: e.target.checked })} className="accent-primary" />
        Clip Content
      </label>
    </PanelShell>
  );
}

function AppearancePanel({
  element,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  element: ManualElement;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  function setAllCorners(v: number) {
    onUpdateElement({ cornerRadius: v, cornerRadiusTL: v, cornerRadiusTR: v, cornerRadiusBL: v, cornerRadiusBR: v });
  }
  return (
    <PanelShell title="Appearance" pinned={pinned} onTogglePin={onTogglePin}>
      <p className="mb-1 text-[10px] text-muted-foreground">Opacity</p>
      <NumberField label="" value={element.opacity} onChange={(opacity) => onUpdateElement({ opacity: Math.max(0, Math.min(100, opacity)) })} />
      <p className="mt-2.5 mb-1 text-[10px] text-muted-foreground">Corner Radius</p>
      <NumberField label="" value={element.cornerRadius} onChange={setAllCorners} />
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <NumberField label="Top left" value={element.cornerRadiusTL} onChange={(v) => onUpdateElement({ cornerRadiusTL: v })} />
        <NumberField label="Top right" value={element.cornerRadiusTR} onChange={(v) => onUpdateElement({ cornerRadiusTR: v })} />
        <NumberField label="Bottom left" value={element.cornerRadiusBL} onChange={(v) => onUpdateElement({ cornerRadiusBL: v })} />
        <NumberField label="Bottom right" value={element.cornerRadiusBR} onChange={(v) => onUpdateElement({ cornerRadiusBR: v })} />
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

function FrameAppearancePanel({
  frame,
  onUpdateFrame,
  pinned,
  onTogglePin,
}: {
  frame: ManualFrame;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Appearance" pinned={pinned} onTogglePin={onTogglePin}>
      <p className="mb-1 text-[10px] text-muted-foreground">Corner Radius</p>
      <NumberField label="" value={frame.cornerRadius} onChange={(cornerRadius) => onUpdateFrame({ cornerRadius })} />
    </PanelShell>
  );
}

function FillPanel({
  element,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  element: ManualElement;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Fill" pinned={pinned} onTogglePin={onTogglePin}>
      <div className="mb-2.5 flex gap-1 rounded-lg bg-secondary/50 p-0.5">
        {FILL_TYPES.map((f) => (
          <button
            key={f.id}
            onClick={() => onUpdateElement({ fillType: f.id })}
            className={cn("flex-1 rounded-md py-1 text-[10px]", element.fillType === f.id ? "bg-primary text-white" : "text-muted-foreground")}
          >
            {f.label}
          </button>
        ))}
        {["Pattern", "Image"].map((label) => (
          <button key={label} disabled title="Coming soon" className="flex-1 cursor-not-allowed rounded-md py-1 text-[10px] text-muted-foreground/40">
            {label}
          </button>
        ))}
      </div>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(element.fill) ? element.fill : "#000000"}
        onChange={(e) => onUpdateElement({ fill: e.target.value })}
        className="mb-2.5 h-20 w-full cursor-pointer rounded-lg"
      />
      {element.fillType === "gradient" && (
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(element.fillTo) ? element.fillTo : "#000000"}
          onChange={(e) => onUpdateElement({ fillTo: e.target.value })}
          className="mb-2.5 h-8 w-full cursor-pointer rounded-lg"
        />
      )}
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

function FrameFillPanel({
  frame,
  onUpdateFrame,
  pinned,
  onTogglePin,
}: {
  frame: ManualFrame;
  onUpdateFrame: (patch: Partial<ManualFrame>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Fill" pinned={pinned} onTogglePin={onTogglePin}>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(frame.fill) ? frame.fill : "#FFFFFF"}
        onChange={(e) => onUpdateFrame({ fill: e.target.value })}
        className="mb-2.5 h-20 w-full cursor-pointer rounded-lg"
      />
      <div className="mb-2.5 flex items-center gap-2">
        <input
          value={frame.fill}
          onChange={(e) => onUpdateFrame({ fill: e.target.value })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
        />
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {COLOR_SWATCHES.map((c) => (
          <button key={c} onClick={() => onUpdateFrame({ fill: c })} className="h-5 w-5 rounded-full border border-white/20" style={{ background: c }} />
        ))}
      </div>
    </PanelShell>
  );
}

function TypographyPanel({
  element,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  element: ManualElement;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Typography" pinned={pinned} onTogglePin={onTogglePin}>
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
      <div className="mb-1.5 flex gap-1">
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
      <div className="flex gap-1">
        {[
          { id: "top", icon: AlignStartVertical },
          { id: "middle", icon: AlignVerticalJustifyCenter },
          { id: "bottom", icon: AlignEndVertical },
        ].map((a) => (
          <button
            key={a.id}
            onClick={() => onUpdateElement({ verticalAlign: a.id as ManualVerticalAlign })}
            className={cn(
              "flex h-7 flex-1 items-center justify-center rounded-lg border",
              element.verticalAlign === a.id ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
            )}
          >
            <a.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </PanelShell>
  );
}

function StrokePanel({
  element,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  element: ManualElement;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Stroke" pinned={pinned} onTogglePin={onTogglePin}>
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
      <label className="mb-2.5 block">
        <span className="mb-1 block text-[10px] text-muted-foreground">End points</span>
        <select
          value={element.strokeCap}
          onChange={(e) => onUpdateElement({ strokeCap: e.target.value as StrokeCap })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none capitalize"
        >
          {STROKE_CAPS.map((c) => (
            <option key={c} value={c}>
              {c === "none" ? "None" : c}
            </option>
          ))}
        </select>
      </label>
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

function EffectsPanel({
  element,
  onUpdateElement,
  pinned,
  onTogglePin,
}: {
  element: ManualElement;
  onUpdateElement: (patch: Partial<ManualElement>) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <PanelShell title="Effects" pinned={pinned} onTogglePin={onTogglePin}>
      <div className="mb-2.5 flex items-center gap-1.5">
        <select
          value={element.effectType}
          onChange={(e) => onUpdateElement({ effectType: e.target.value as EffectType })}
          className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
        >
          {EFFECT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onUpdateElement({ hasShadow: !element.hasShadow })}
          aria-label="Toggle effect"
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", element.hasShadow ? "border-primary text-primary" : "border-border/60 text-muted-foreground")}
        >
          <Droplet className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Position</p>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.shadowX} onChange={(shadowX) => onUpdateElement({ shadowX })} />
        <NumberField label="Y" value={element.shadowY} onChange={(shadowY) => onUpdateElement({ shadowY })} />
      </div>
      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <NumberField label="Blur" value={element.shadowBlur} onChange={(shadowBlur) => onUpdateElement({ shadowBlur })} />
        <NumberField label="Spread" value={element.shadowSpread} onChange={(shadowSpread) => onUpdateElement({ shadowSpread })} />
      </div>
      <p className="mb-1 text-[10px] text-muted-foreground">Color</p>
      <div className="flex items-center gap-2">
        <input type="color" value={element.shadowColor} onChange={(e) => onUpdateElement({ shadowColor: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded" />
        <NumberField label="" value={element.shadowOpacity} onChange={(shadowOpacity) => onUpdateElement({ shadowOpacity })} />
      </div>
    </PanelShell>
  );
}
