"use client";

import { Frame, Pencil, Play } from "lucide-react";
import { SegmentedPillBar, type PillTabItem } from "@/components/ui/segmented-pill-bar";

export type ViewMode = "sketch" | "canvas" | "present";

const MODES: PillTabItem<ViewMode>[] = [
  { id: "sketch", label: "Sketch", icon: Pencil },
  { id: "canvas", label: "Canvas", icon: Frame },
  { id: "present", label: "Present", icon: Play },
];

export function ModeSwitch({ mode, onModeChange }: { mode: ViewMode; onModeChange: (mode: ViewMode) => void }) {
  return <SegmentedPillBar items={MODES} active={mode} onChange={onModeChange} />;
}
