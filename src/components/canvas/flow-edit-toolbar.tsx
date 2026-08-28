"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  ChevronDown,
  List,
  Shapes,
  Sparkles,
  Spline,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLOR_SWATCHES,
  FONT_FAMILIES,
  FONT_SIZES,
  type FlowNodeShape,
  type FlowStyle,
  type StrokeStyle,
  type TextAlign,
} from "@/components/canvas/flow-types";
import { ShapePickerGrid } from "@/components/canvas/flow-shape-picker";
import { Tip } from "@/components/ui/tip";

const STROKE_STYLES: StrokeStyle[] = ["solid", "dashed", "dotted"];
const STROKE_WIDTHS = [1, 1.5, 2, 3, 4];
const ALIGNS: { id: TextAlign; icon: typeof AlignLeft }[] = [
  { id: "left", icon: AlignLeft },
  { id: "center", icon: AlignCenter },
  { id: "right", icon: AlignRight },
];

type EditableStyle = FlowStyle & { fill?: string; shape?: FlowNodeShape };
type Popover = "shape" | "stroke" | "color" | "typography" | "size" | "align" | null;

export function FlowEditToolbar({
  style,
  onChange,
  x,
  y,
}: {
  style: EditableStyle;
  onChange: (patch: Partial<EditableStyle>) => void;
  x: number;
  y: number;
}) {
  const [popover, setPopover] = useState<Popover>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [colorTarget, setColorTarget] = useState<"fill" | "text" | "stroke">(style.fill !== undefined ? "fill" : "stroke");
  const [prompt, setPrompt] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPopover(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggle(p: Exclude<Popover, null>) {
    setPopover((prev) => (prev === p ? null : p));
  }

  const AlignIcon = ALIGNS.find((a) => a.id === style.align)?.icon ?? AlignCenter;
  const colorValue = colorTarget === "fill" ? (style.fill ?? style.stroke) : colorTarget === "text" ? style.textColor : style.stroke;

  return (
    <div
      ref={rootRef}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-40 flex flex-col items-center gap-2"
      style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}
    >
      <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-card px-1.5 py-1 shadow-xl">
        <IconButton label="AI edit" active={aiOpen} onClick={() => setAiOpen((v) => !v)}>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </IconButton>

        {style.shape && (
          <div className="relative">
            <IconButton label="Shape" active={popover === "shape"} onClick={() => toggle("shape")}>
              <Shapes className="h-3.5 w-3.5" />
            </IconButton>
            {popover === "shape" && (
              <Flyout>
                <ShapePickerGrid
                  selected={style.shape}
                  onSelect={(s) => {
                    onChange({ shape: s });
                    setPopover(null);
                  }}
                />
              </Flyout>
            )}
          </div>
        )}

        <div className="relative">
          <IconButton label="Stroke" active={popover === "stroke"} onClick={() => toggle("stroke")}>
            <Spline className="h-3.5 w-3.5" />
          </IconButton>
          {popover === "stroke" && (
            <Flyout>
              <div className="w-[180px] space-y-2.5 p-3">
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Style</p>
                  <div className="flex gap-1">
                    {STROKE_STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => onChange({ strokeStyle: s })}
                        className={cn(
                          "flex-1 rounded-md border px-1.5 py-1 text-[10px] capitalize",
                          style.strokeStyle === s ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Weight</p>
                  <div className="flex gap-1">
                    {STROKE_WIDTHS.map((w) => (
                      <button
                        key={w}
                        onClick={() => onChange({ strokeWidth: w })}
                        className={cn(
                          "flex-1 rounded-md border py-1 text-[10px]",
                          style.strokeWidth === w ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-secondary",
                        )}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Flyout>
          )}
        </div>

        <div className="relative">
          <IconButton label="Color" active={popover === "color"} onClick={() => toggle("color")}>
            <span className="h-3.5 w-3.5 rounded-full border border-white/30" style={{ background: colorValue }} />
          </IconButton>
          {popover === "color" && (
            <Flyout>
              <div className="w-[190px] p-3">
                <div className="mb-2 flex gap-1 rounded-lg bg-secondary/50 p-0.5">
                  {(["fill", "text", "stroke"] as const)
                    .filter((t) => t !== "fill" || style.fill !== undefined)
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => setColorTarget(t)}
                        className={cn(
                          "flex-1 rounded-md py-1 text-[10px] capitalize",
                          colorTarget === t ? "bg-primary text-white" : "text-muted-foreground",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        onChange(colorTarget === "fill" ? { fill: c } : colorTarget === "text" ? { textColor: c } : { stroke: c })
                      }
                      className="h-5 w-5 rounded-full border border-white/20"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) =>
                    onChange(
                      colorTarget === "fill" ? { fill: e.target.value } : colorTarget === "text" ? { textColor: e.target.value } : { stroke: e.target.value },
                    )
                  }
                  className="mt-2 h-6 w-full cursor-pointer rounded"
                />
              </div>
            </Flyout>
          )}
        </div>

        <div className="relative">
          <IconButton label="Font" active={popover === "typography"} onClick={() => toggle("typography")}>
            <span className="text-[11px] font-semibold">Aa</span>
          </IconButton>
          {popover === "typography" && (
            <Flyout>
              <div className="w-[150px] p-1.5">
                {FONT_FAMILIES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      onChange({ fontFamily: f.value });
                      setPopover(null);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary",
                      style.fontFamily === f.value && "text-primary",
                    )}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Flyout>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => toggle("size")}
            className="flex h-8 items-center gap-0.5 rounded-full px-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {style.fontSize}
            <ChevronDown className="h-3 w-3" />
          </button>
          {popover === "size" && (
            <Flyout>
              <div className="w-[70px] p-1">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onChange({ fontSize: s });
                      setPopover(null);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-secondary",
                      style.fontSize === s && "text-primary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Flyout>
          )}
        </div>

        <IconButton label="Bold" active={style.bold} onClick={() => onChange({ bold: !style.bold })}>
          <Bold className="h-3.5 w-3.5" />
        </IconButton>

        <div className="relative">
          <IconButton label="Align" active={popover === "align"} onClick={() => toggle("align")}>
            <AlignIcon className="h-3.5 w-3.5" />
          </IconButton>
          {popover === "align" && (
            <Flyout>
              <div className="flex gap-0.5 p-1">
                {ALIGNS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onChange({ align: a.id });
                      setPopover(null);
                    }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      style.align === a.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <a.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </Flyout>
          )}
        </div>

        <IconButton label="Bullets" active={style.bulleted} onClick={() => onChange({ bulleted: !style.bulleted })}>
          <List className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      {aiOpen && (
        <div className="w-[260px] rounded-2xl bg-[#18181a] p-2.5 shadow-xl">
          <div className="flex items-center gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change you want to make..."
              className="w-full bg-transparent text-xs text-white/80 outline-none placeholder:text-white/50"
            />
            <Tip label="Submit">
              <button
                aria-label="Submit"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Tip>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
          active && "bg-primary/15 text-primary",
        )}
      >
        {children}
      </button>
    </Tip>
  );
}

function Flyout({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-2xl border border-border/60 bg-popover shadow-2xl">
      {children}
    </div>
  );
}

