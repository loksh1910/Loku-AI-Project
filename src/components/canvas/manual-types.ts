import type { SketchDevice } from "@/lib/sketch-devices";
import type { FlowNodeShape } from "@/components/canvas/flow-types";

// Reuses the same shape vocabulary (and therefore the same shape-picker UI)
// already built for User Flow / Sitemap, plus "image" which only makes sense here.
export type ManualElementKind = FlowNodeShape | "image" | "path";
export type StrokePosition = "inside" | "outside" | "center";
export type StrokeCap = "none" | "round" | "square";
export type ManualTextAlign = "left" | "center" | "right";
export type ManualVerticalAlign = "top" | "middle" | "bottom";
export type BlendMode = "normal" | "multiply" | "screen" | "overlay";
export type FlowDirection = "none" | "horizontal" | "vertical";
export type FillType = "solid" | "gradient";
export type EffectType = "dropShadow" | "innerShadow";

export type ManualElement = {
  id: string;
  frameId: string;
  kind: ManualElementKind;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  fillType: FillType;
  fill: string;
  fillTo: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokePosition: StrokePosition;
  strokeCap: StrokeCap;
  opacity: number;
  cornerRadius: number;
  cornerRadiusTL: number;
  cornerRadiusTR: number;
  cornerRadiusBL: number;
  cornerRadiusBR: number;
  blendMode: BlendMode;
  text: string;
  textColor: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: ManualTextAlign;
  verticalAlign: ManualVerticalAlign;
  hasShadow: boolean;
  effectType: EffectType;
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowX: number;
  shadowY: number;
  src?: string;
  points?: { x: number; y: number }[];
  isComponent?: boolean;
  isMask?: boolean;
};

export type ManualFrame = {
  id: string;
  name: string;
  device: SketchDevice;
  x: number;
  y: number;
  fill: string;
  cornerRadius: number;
  paddingH: number;
  paddingV: number;
  spacing: number;
  clipContent: boolean;
  flow: FlowDirection;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_ELEMENT_STYLE = {
  rotation: 0,
  flipH: false,
  flipV: false,
  fillType: "solid" as FillType,
  fillTo: "#8E51FF",
  fillOpacity: 100,
  stroke: "#6C5CE7",
  strokeWidth: 0,
  strokePosition: "inside" as StrokePosition,
  strokeCap: "none" as StrokeCap,
  opacity: 100,
  cornerRadius: 0,
  cornerRadiusTL: 0,
  cornerRadiusTR: 0,
  cornerRadiusBL: 0,
  cornerRadiusBR: 0,
  blendMode: "normal" as BlendMode,
  textColor: "#111111",
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 20,
  letterSpacing: 0,
  textAlign: "left" as ManualTextAlign,
  verticalAlign: "middle" as ManualVerticalAlign,
  hasShadow: false,
  effectType: "dropShadow" as EffectType,
  shadowColor: "#000000",
  shadowOpacity: 25,
  shadowBlur: 8,
  shadowSpread: 0,
  shadowX: 0,
  shadowY: 4,
};

export function newManualElement(
  frameId: string,
  kind: ManualElementKind,
  x: number,
  y: number,
  w: number,
  h: number,
): ManualElement {
  const cornerRadius = kind === "roundedRect" ? 8 : 0;
  return {
    id: uid("el"),
    frameId,
    kind,
    name:
      kind === "text"
        ? "Text"
        : kind === "circle"
          ? "Ellipse"
          : kind === "image"
            ? "Image"
            : kind === "diamond"
              ? "Diamond"
              : kind === "triangle"
                ? "Triangle"
                : "Rectangle",
    x,
    y,
    w,
    h,
    ...DEFAULT_ELEMENT_STYLE,
    fill: kind === "text" ? "transparent" : "#D9D9D9",
    cornerRadius,
    cornerRadiusTL: cornerRadius,
    cornerRadiusTR: cornerRadius,
    cornerRadiusBL: cornerRadius,
    cornerRadiusBR: cornerRadius,
    text: "Text",
  };
}

export function newManualFrame(device: SketchDevice, x: number, name: string): ManualFrame {
  return { id: uid("frame"), name, device, x, y: 0, fill: "#FFFFFF", cornerRadius: 0, paddingH: 16, paddingV: 16, spacing: 12, clipContent: true, flow: "none" };
}

export function newManualPath(frameId: string, points: { x: number; y: number }[]): ManualElement {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {
    id: uid("el"),
    frameId,
    kind: "path",
    name: "Path",
    x,
    y,
    w: Math.max(...xs) - x,
    h: Math.max(...ys) - y,
    ...DEFAULT_ELEMENT_STYLE,
    fill: "#D9D9D9",
    text: "",
    points,
  };
}

// Places one already-built ManualElement's remaining fields as an override —
// used by the seed builder below, which authors screens by only specifying
// what differs from the defaults.
export function manualElement(
  frameId: string,
  kind: ManualElementKind,
  x: number,
  y: number,
  w: number,
  h: number,
  overrides: Partial<ManualElement> = {},
): ManualElement {
  return { ...newManualElement(frameId, kind, x, y, w, h), ...overrides };
}
