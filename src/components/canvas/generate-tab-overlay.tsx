"use client";

import { Sparkles } from "lucide-react";
import { AiBuildingOverlay } from "@/components/sketch/ai-building-overlay";
import { PIPELINE_TABS, type PipelineTab } from "@/components/canvas/canvas-pipeline-bar";

const TAB_DESCRIPTIONS: Partial<Record<PipelineTab, string>> = {
  prototype: "Turn your screens into an interactive prototype",
  wireframe: "Generate a low-fidelity wireframe of your screens",
  userflow: "Map how users move through your screens",
  sitemap: "Structure your screens into a sitemap",
  code: "Generate real, working code from your screens",
};

// The Start-with-your-design entry unlocks AI mode + Design immediately (the
// imported file already has real content to show there), but every other
// pipeline tab is something AI derives FROM that content — so each one gates
// behind its own small "Generate X" prompt the first time it's opened
// (Figma's Desktop - 127 reference), reusing the exact same AiBuildingOverlay
// every other flow's own generation step already plays.
export function GenerateTabOverlay({
  tab,
  generating,
  onGenerate,
  onGenerated,
}: {
  tab: PipelineTab;
  generating: boolean;
  onGenerate: () => void;
  onGenerated: () => void;
}) {
  const meta = PIPELINE_TABS.find((t) => t.id === tab);
  const Icon = meta?.icon ?? Sparkles;
  const label = meta?.label ?? tab;
  const description = TAB_DESCRIPTIONS[tab] ?? `Generate ${label.toLowerCase()} from your screens`;

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background">
      {!generating && (
        <div className="flex w-[280px] flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/50 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <button
            onClick={onGenerate}
            className="mt-1 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            Generate {label}
          </button>
        </div>
      )}
      {generating && <AiBuildingOverlay onComplete={onGenerated} />}
    </div>
  );
}
