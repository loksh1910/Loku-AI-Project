"use client";

import { Frame, Pencil, Play } from "lucide-react";
import { SegmentedPillBar, type PillTabItem } from "@/components/ui/segmented-pill-bar";

// "flow" is the Sitemap/User-Flow-to-UI entry's own pre-generation drawing
// canvas — never a switchable pill (MODES below never lists it), just a valid
// state for pages that boot straight into it, the same way "sketch" is.
export type ViewMode = "sketch" | "flow" | "canvas" | "present";

const MODES: PillTabItem<ViewMode>[] = [
  { id: "sketch", label: "Sketch", icon: Pencil },
  { id: "canvas", label: "Canvas", icon: Frame },
  { id: "present", label: "Present", icon: Play },
];

export function ModeSwitch({
  mode,
  onModeChange,
  modes,
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  /** Restricts which modes are switchable to — e.g. the "Start from Template"
   * entry has no sketch of its own to go back to, so it only ever offers
   * Present/Canvas. Defaults to all three (the Sketch-to-UI flow's own case). */
  modes?: ViewMode[];
}) {
  const items = modes ? MODES.filter((m) => modes.includes(m.id)) : MODES;
  return <SegmentedPillBar items={items} active={mode} onChange={onModeChange} />;
}
