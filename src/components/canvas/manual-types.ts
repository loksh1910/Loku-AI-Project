import type { SketchDevice } from "@/lib/sketch-devices";
import type { FlowNodeShape } from "@/components/canvas/flow-types";

// Reuses the same shape vocabulary (and therefore the same shape-picker UI)
// already built for User Flow / Sitemap, plus "image" which only makes sense here.
export type ManualElementKind = FlowNodeShape | "image" | "path";
export type StrokePosition = "inside" | "outside" | "center";
export type ManualTextAlign = "left" | "center" | "right";
export type BlendMode = "normal" | "multiply" | "screen" | "overlay";
export type FlowDirection = "none" | "horizontal" | "vertical";

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
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokePosition: StrokePosition;
  opacity: number;
  cornerRadius: number;
  blendMode: BlendMode;
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: ManualTextAlign;
  hasShadow: boolean;
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
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
  padding: number;
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
  fillOpacity: 100,
  stroke: "#6C5CE7",
  strokeWidth: 0,
  strokePosition: "inside" as StrokePosition,
  opacity: 100,
  cornerRadius: 0,
  blendMode: "normal" as BlendMode,
  fontFamily: "Inter, sans-serif",
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 20,
  letterSpacing: 0,
  textAlign: "left" as ManualTextAlign,
  hasShadow: false,
  shadowColor: "#000000",
  shadowOpacity: 25,
  shadowBlur: 8,
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
    fill: kind === "text" ? "#111111" : "#D9D9D9",
    cornerRadius: kind === "roundedRect" ? 8 : 0,
    text: "Text",
  };
}

export function newManualFrame(device: SketchDevice, x: number, name: string): ManualFrame {
  return { id: uid("frame"), name, device, x, y: 0, padding: 16, spacing: 12, clipContent: true, flow: "none" };
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
