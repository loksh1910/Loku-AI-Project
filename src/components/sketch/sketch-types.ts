import type { SketchDevice } from "@/lib/sketch-devices";

export type SketchFrame = {
  id: string;
  name: string;
  device: SketchDevice;
  x: number;
  y: number;
  autoLayout: { enabled: boolean; spacing: number; padding: number };
  showGrid: boolean;
  /** Toggled from the Screens panel's eye icon — hidden frames (and every
   * element inside them) are skipped from canvas rendering entirely, same as
   * a hidden layer in Figma. Undefined/false = visible. */
  hidden?: boolean;
};

export type BasicElementType = "container" | "textline" | "button" | "image" | "divider";
export type ShapeType = "rect" | "circle" | "line";

export type PathElement = {
  id: string;
  frameId: string;
  kind: "path";
  /** "freehand" = pencil tool (open stroke). "vector" = pen tool (straight
   * segments between clicked anchor points; can be closed into a filled shape). */
  mode: "freehand" | "vector";
  points: { x: number; y: number }[];
  closed?: boolean;
  stroke: { weight: number; color: string; opacity: number; radius: number };
  fill?: string;
};

export type BoxElement = {
  id: string;
  frameId: string;
  kind: "box";
  type: BasicElementType | ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
};

export type ImageElement = {
  id: string;
  frameId: string;
  kind: "image";
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
};

export type TextElement = {
  id: string;
  frameId: string;
  kind: "text";
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number;
};

export type SketchElement = PathElement | BoxElement | ImageElement | TextElement;

export type SketchConnector = {
  id: string;
  fromFrameId: string;
  toFrameId: string;
  trigger: string;
  action: string;
  animation: string;
  duration: string;
  easing: string;
};

export type BottomTool =
  | "pointer"
  | "hand"
  | "frame"
  | "shapes"
  | "pencil"
  | "line"
  | "vectorpen"
  | "connector"
  | "text";

export type RightPanelKey =
  | "search"
  | "components"
  | "layout"
  | "style"
  | "properties"
  | "addfiles"
  | null;

export const DEFAULT_STROKE = { weight: 2, color: "#FFFFFF", opacity: 100, radius: 0 };
export const DEFAULT_TEXT_STYLE = { color: "#FFFFFF", fontSize: 14, fontWeight: 400 };
