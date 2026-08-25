"use client";

import { Code2, LogIn, Network, Rows3, Sparkles, SquarePen, Waypoints } from "lucide-react";
import { SegmentedPillBar, type PillTabItem } from "@/components/ui/segmented-pill-bar";

export type PipelineTab = "ai" | "prototype" | "wireframe" | "userflow" | "sitemap" | "manualedit" | "code";

export const PIPELINE_TABS: PillTabItem<PipelineTab>[] = [
  { id: "ai", label: "AI mode", icon: Sparkles },
  { id: "prototype", label: "Prototype", icon: LogIn },
  { id: "wireframe", label: "Wireframe", icon: Rows3 },
  { id: "userflow", label: "User Flow", icon: Waypoints },
  { id: "sitemap", label: "Sitemap", icon: Network },
  { id: "manualedit", label: "Manual Edit", icon: SquarePen },
  { id: "code", label: "Code", icon: Code2 },
];

export function CanvasPipelineBar({ tab, onTabChange }: { tab: PipelineTab; onTabChange: (tab: PipelineTab) => void }) {
  return <SegmentedPillBar items={PIPELINE_TABS} active={tab} onChange={onTabChange} />;
}
