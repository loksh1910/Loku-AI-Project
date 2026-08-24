"use client";

import { useRef, useState } from "react";
import {
  Search,
  LayoutGrid as ComponentsIcon,
  PanelTop,
  Spline,
  SlidersHorizontal,
  Plus,
  Square,
  Baseline,
  RectangleHorizontal,
  ImageIcon,
  Minus,
  Eye,
  Pin,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlipHorizontal2,
  FlipVertical2,
  Grid3x3,
  StretchHorizontal,
  StretchVertical,
} from "lucide-react";
import type {
  BasicElementType,
  RightPanelKey,
  SketchElement,
  SketchFrame,
} from "@/components/sketch/sketch-types";

const BASICS: { type: BasicElementType; label: string; icon: typeof Square }[] = [
  { type: "container", label: "Container", icon: Square },
  { type: "textline", label: "Text Line", icon: Baseline },
  { type: "button", label: "Button", icon: RectangleHorizontal },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "divider", label: "Divider", icon: Minus },
];

const INPUTS = ["Text Field", "Checkbox", "Radio", "Toggle", "Dropdown"];
const SECTIONS = ["Header", "Footer", "Hero", "Card Grid"];

const TOOLS: { key: Exclude<RightPanelKey, null>; icon: typeof Search; label: string }[] = [
  { key: "search", icon: Search, label: "Search" },
  { key: "components", icon: ComponentsIcon, label: "Components" },
  { key: "layout", icon: PanelTop, label: "Layout" },
  { key: "style", icon: Spline, label: "Style" },
  { key: "properties", icon: SlidersHorizontal, label: "Properties" },
  { key: "addfiles", icon: Plus, label: "Add files to canvas" },
];

export function RightSketchTools({
  activePanel,
  onPanelChange,
  stroke,
  onStrokeChange,
  textStyle,
  onTextStyleChange,
  styleMode,
  onAddBasic,
  activeFrame,
  onFrameLayoutChange,
  selectedElement,
  onElementPropsChange,
  onAddImage,
}: {
  activePanel: RightPanelKey;
  onPanelChange: (panel: RightPanelKey) => void;
  stroke: { weight: number; color: string; opacity: number; radius: number };
  onStrokeChange: (patch: Partial<typeof stroke>) => void;
  textStyle: { color: string; fontSize: number; fontWeight: number };
  onTextStyleChange: (patch: Partial<typeof textStyle>) => void;
  styleMode: "stroke" | "text";
  onAddBasic: (type: BasicElementType) => void;
  activeFrame: SketchFrame | null;
  onFrameLayoutChange: (patch: Partial<SketchFrame["autoLayout"] & { showGrid: boolean }>) => void;
  selectedElement: SketchElement | null;
  onElementPropsChange: (patch: Partial<{ x: number; y: number; w: number; h: number; rotation: number }>) => void;
  onAddImage: (file: File) => void;
}) {
  const [expanded, setExpanded] = useState<string>("Basics");
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggle(panel: Exclude<RightPanelKey, null>) {
    onPanelChange(activePanel === panel ? null : panel);
    if (panel === "addfiles") fileInputRef.current?.click();
  }

  const filteredBasics = BASICS.filter((b) =>
    b.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    // Fixed position — the icon bar's own position never depends on panel
    // state. The panel anchors to the LEFT of the bar via `right-full`, so
    // opening/closing it can never shift the bar itself.
    <div className="absolute top-1/2 right-4 z-30 -translate-y-1/2">
      <div className="relative flex flex-col gap-1 rounded-full border border-border/60 bg-popover p-1.5 shadow-lg">
        {activePanel && (
          <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2">
            {activePanel === "search" && (
              <Panel title="Search">
                <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col">
                  {filteredBasics.map((b) => (
                    <button
                      key={b.type}
                      onClick={() => onAddBasic(b.type)}
                      className="rounded-lg px-2 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {activePanel === "components" && (
              <Panel title="Components" pinnable>
                {(["Basics", "Inputs", "Sections", "Recent"] as const).map((cat) => (
                  <div key={cat}>
                    <button
                      onClick={() => setExpanded(expanded === cat ? "" : cat)}
                      className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
                    >
                      <span
                        className="text-[10px] text-muted-foreground transition-transform"
                        style={{ transform: expanded === cat ? "rotate(90deg)" : "none" }}
                      >
                        ◂
                      </span>
                      {cat}
                    </button>
                    {expanded === cat && cat === "Basics" && (
                      <div className="ml-2 flex flex-col border-l border-border/60 pl-2">
                        {BASICS.map((b) => (
                          <button
                            key={b.type}
                            onClick={() => onAddBasic(b.type)}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <b.icon className="h-3.5 w-3.5" />
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {expanded === cat && cat === "Inputs" && (
                      <div className="ml-2 flex flex-col border-l border-border/60 pl-2">
                        {INPUTS.map((label) => (
                          <button
                            key={label}
                            onClick={() => onAddBasic("container")}
                            className="rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    {expanded === cat && cat === "Sections" && (
                      <div className="ml-2 flex flex-col border-l border-border/60 pl-2">
                        {SECTIONS.map((label) => (
                          <button
                            key={label}
                            onClick={() => onAddBasic("container")}
                            className="rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                    {expanded === cat && cat === "Recent" && (
                      <p className="ml-2 border-l border-border/60 py-1.5 pl-4 text-xs text-muted-foreground">
                        Nothing used yet.
                      </p>
                    )}
                  </div>
                ))}
              </Panel>
            )}

            {activePanel === "layout" && (
              <Panel title="Layout" pinnable>
                <Field label="Flow">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[StretchHorizontal, StretchVertical, Grid3x3, Grid3x3].map((Icon, i) => (
                      <button
                        key={i}
                        className={`flex items-center justify-center rounded-md p-2 ${
                          i === 0 ? "bg-secondary" : "text-muted-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Spacing">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      value={activeFrame?.autoLayout.spacing ?? 0}
                      onChange={(v) => onFrameLayoutChange({ spacing: v })}
                    />
                    <NumberInput value={0} readOnly />
                  </div>
                </Field>
                <Field label="Layout Guide">
                  <div className="flex items-center gap-2 rounded-lg bg-secondary px-2 py-1.5 text-xs">
                    <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1">Grid 10px</span>
                    <button
                      onClick={() => onFrameLayoutChange({ showGrid: !activeFrame?.showGrid })}
                      aria-label="Toggle grid guide"
                    >
                      <Eye
                        className={`h-3.5 w-3.5 ${activeFrame?.showGrid ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </div>
                </Field>
                <p className="mb-1 text-xs font-semibold">Auto Layout</p>
                <Field label="Padding">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      value={activeFrame?.autoLayout.padding ?? 0}
                      onChange={(v) => onFrameLayoutChange({ padding: v })}
                    />
                    <NumberInput value={activeFrame?.autoLayout.padding ?? 0} readOnly />
                  </div>
                </Field>
                <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={activeFrame?.autoLayout.enabled ?? false}
                    onChange={(e) => onFrameLayoutChange({ enabled: e.target.checked })}
                  />
                  Auto Layout (new elements stack)
                </label>
              </Panel>
            )}

            {activePanel === "style" && styleMode === "stroke" && (
              <Panel title="Style" eyeToggle pinnable>
                <Field label="Weight">
                  <NumberInput value={stroke.weight} onChange={(v) => onStrokeChange({ weight: v })} />
                </Field>
                <Field label="Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stroke.color}
                      onChange={(e) => onStrokeChange({ color: e.target.value })}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border/60 bg-transparent p-0.5"
                    />
                    <NumberInput value={stroke.opacity} onChange={(v) => onStrokeChange({ opacity: v })} suffix="%" />
                  </div>
                </Field>
                <Field label="Corner Radius">
                  <NumberInput value={stroke.radius} onChange={(v) => onStrokeChange({ radius: v })} />
                </Field>
              </Panel>
            )}

            {activePanel === "style" && styleMode === "text" && (
              <Panel title="Style" eyeToggle pinnable>
                <Field label="Color">
                  <input
                    type="color"
                    value={textStyle.color}
                    onChange={(e) => onTextStyleChange({ color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border border-border/60 bg-transparent p-0.5"
                  />
                </Field>
                <Field label="Font Size">
                  <NumberInput value={textStyle.fontSize} onChange={(v) => onTextStyleChange({ fontSize: v })} />
                </Field>
                <Field label="Weight">
                  <select
                    value={textStyle.fontWeight}
                    onChange={(e) => onTextStyleChange({ fontWeight: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
                  >
                    <option value={400}>Regular</option>
                    <option value={500}>Medium</option>
                    <option value={700}>Bold</option>
                  </select>
                </Field>
              </Panel>
            )}

            {activePanel === "properties" && (
              <Panel title="Properties" eyeToggle pinnable>
                <Field label="Alignment">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      AlignLeft,
                      AlignCenter,
                      AlignRight,
                      AlignLeft,
                      AlignCenter,
                      AlignRight,
                      AlignLeft,
                      AlignCenter,
                      AlignRight,
                    ].map((Icon, i) => (
                      <button
                        key={i}
                        className="flex items-center justify-center rounded-md bg-secondary/60 p-2 text-muted-foreground hover:bg-secondary"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Position">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      prefix="X"
                      value={selectedElement && "x" in selectedElement ? selectedElement.x : 0}
                      onChange={(v) => onElementPropsChange({ x: v })}
                      disabled={!selectedElement}
                    />
                    <NumberInput
                      prefix="Y"
                      value={selectedElement && "y" in selectedElement ? selectedElement.y : 0}
                      onChange={(v) => onElementPropsChange({ y: v })}
                      disabled={!selectedElement}
                    />
                  </div>
                </Field>
                <Field label="Dimensions">
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      prefix="W"
                      value={selectedElement && "w" in selectedElement ? selectedElement.w : 0}
                      onChange={(v) => onElementPropsChange({ w: v })}
                      disabled={!selectedElement}
                    />
                    <NumberInput
                      prefix="H"
                      value={selectedElement && "h" in selectedElement ? selectedElement.h : 0}
                      onChange={(v) => onElementPropsChange({ h: v })}
                      disabled={!selectedElement}
                    />
                  </div>
                </Field>
                <Field label="Rotation">
                  <div className="flex items-center gap-2">
                    <NumberInput
                      value={selectedElement && "rotation" in selectedElement ? selectedElement.rotation : 0}
                      onChange={(v) => onElementPropsChange({ rotation: v })}
                      disabled={!selectedElement}
                    />
                    <button className="rounded-md bg-secondary/60 p-1.5 text-muted-foreground hover:bg-secondary">
                      <FlipHorizontal2 className="h-3.5 w-3.5" />
                    </button>
                    <button className="rounded-md bg-secondary/60 p-1.5 text-muted-foreground hover:bg-secondary">
                      <FlipVertical2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Field>
              </Panel>
            )}
          </div>
        )}

        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => toggle(t.key)}
            className={`rounded-full p-2.5 ${
              activePanel === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            aria-label={t.label}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddImage(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Panel({
  title,
  children,
  eyeToggle,
  pinnable,
}: {
  title: string;
  children: React.ReactNode;
  eyeToggle?: boolean;
  pinnable?: boolean;
}) {
  return (
    <div className="w-[260px] rounded-2xl border border-border/60 bg-popover p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          {eyeToggle && <Eye className="h-3.5 w-3.5" />}
          {pinnable && <Pin className="h-3.5 w-3.5" />}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  readOnly,
  disabled,
}: {
  value: number;
  onChange?: (v: number) => void;
  prefix?: string;
  suffix?: string;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs">
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <input
        type="number"
        value={Math.round(value)}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full bg-transparent text-right outline-none disabled:opacity-40"
      />
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </div>
  );
}
