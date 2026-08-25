import { HEALTH_SCREENS, type HealthScreenId } from "@/components/present/health-app/screens";
import type { VariationId } from "@/components/present/health-app/theme";

export type CanvasTool = "pointer" | "hand" | "select" | "edit";

export type CanvasItem = { instanceId: string; x: number; y: number; name: string } & (
  | { kind: "screen"; screenId: HealthScreenId; variation: VariationId }
  | { kind: "image"; src: string; w: number; h: number }
);

export const CANVAS_DEVICE_W = 241;
export const CANVAS_DEVICE_H = 500;
const COL_GAP = 60;
export const ROW_GAP = 90;

export const SCREEN_ORDER: HealthScreenId[] = ["splash", "signup", "signin", "dashboard", "appointment", "profile"];

export function defaultVariationRow(variation: VariationId, rowIndex: number): CanvasItem[] {
  return SCREEN_ORDER.map((screenId, col) => ({
    instanceId: `${variation}-${screenId}`,
    kind: "screen",
    screenId,
    variation,
    name: HEALTH_SCREENS[screenId].name,
    x: col * (CANVAS_DEVICE_W + COL_GAP),
    y: rowIndex * (CANVAS_DEVICE_H + ROW_GAP),
  }));
}
