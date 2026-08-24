import type { SketchDevice } from "@/lib/sketch-devices";

export type SketchFrame = {
  id: string;
  name: string;
  device: SketchDevice;
  x: number;
  y: number;
  autoLayout: { enabled: boolean; spacing: number; padding: number };
  showGrid: boolean;
};

export type BasicElementType = "container" | "textline" | "button" | "image" | "divider";
export type ShapeType = "rect" | "circle" | "line";

export type PathElement = {
  id: string;
  frameId: string;
  kind: "path";
  points: { x: number; y: number }[];
  stroke: { weight: number; color: string; opacity: number; radius: number };
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

export type SketchElement = PathElement | BoxElement | ImageElement;

export type BottomTool = "pointer" | "hand" | "frame" | "shapes" | "pen";
export type RightPanelKey =
  | "search"
  | "components"
  | "layout"
  | "style"
  | "properties"
  | "addfiles"
  | null;

export const DEFAULT_STROKE = { weight: 2, color: "#FFFFFF", opacity: 100, radius: 0 };
