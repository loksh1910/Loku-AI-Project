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
  { id: "manualedit", label: "Design", icon: SquarePen },
  { id: "code", label: "Code", icon: Code2 },
];

export function CanvasPipelineBar({
  tab,
  onTabChange,
  tabs,
}: {
  tab: PipelineTab;
  onTabChange: (tab: PipelineTab) => void;
  /** Restricts which tabs render, in order — e.g. the Design/Prototype (Start
   * from Scratch) entry only ever offers Design + Prototype, no AI-generated
   * modes. Defaults to the full 7-tab pipeline. */
  tabs?: PipelineTab[];
}) {
  const items = tabs ? PIPELINE_TABS.filter((t) => tabs.includes(t.id)) : PIPELINE_TABS;
  return <SegmentedPillBar items={items} active={tab} onChange={onTabChange} />;
}
