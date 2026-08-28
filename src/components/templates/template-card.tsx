"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Template } from "@/lib/templates-data";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

export function TemplateCard({
  template,
  onOpenDetail,
  className,
}: {
  template: Template;
  onOpenDetail: (template: Template) => void;
  className?: string;
}) {
  const [screenIndex, setScreenIndex] = useState(0);

  const isMobile = template.device === "mobile";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card",
        className,
      )}
      onMouseLeave={() => setScreenIndex(0)}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          isMobile ? "aspect-[3/4]" : "aspect-[16/10]",
        )}
      >
        <TemplateThumbnail template={template} />

        {/* Always mounted, opacity-toggled on `group-hover` (≤150ms) rather
            than conditionally mounted on `hovered` — a mount/unmount can't
            transition, so that would pop instantly no matter what duration
            class it carried. */}
        <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

        <Tip label="Download preview" className="absolute top-2 right-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast("Downloaded a preview thumbnail (mock).");
            }}
            className="rounded-md bg-black/30 p-1.5 text-white backdrop-blur-sm"
            aria-label="Download preview"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </Tip>

        <div className="absolute top-2 left-2 rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
          {template.screens} screens
        </div>

        <Tip
          label="Previous screen"
          className="absolute top-1/2 left-2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setScreenIndex((i) => (i - 1 + template.screens) % template.screens);
            }}
            className="rounded-full bg-black/40 p-1 text-white backdrop-blur-sm hover:bg-black/60"
            aria-label="Previous screen"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </Tip>
        <Tip
          label="Next screen"
          className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setScreenIndex((i) => (i + 1) % template.screens);
            }}
            className="rounded-full bg-black/40 p-1 text-white backdrop-blur-sm hover:bg-black/60"
            aria-label="Next screen"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </Tip>

        <div className="pointer-events-none absolute right-0 bottom-3 left-0 flex flex-col items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          <span className="text-[10px] font-medium text-white/90">
            screen {screenIndex + 1}
          </span>
          <Button
            size="sm"
            className="rounded-full bg-white text-black shadow hover:bg-white/90"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(template);
            }}
          >
            Choose template
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(template)}
        className="block w-full px-3 py-2.5 text-left text-sm font-medium hover:text-primary"
      >
        {template.title}
      </button>
    </div>
  );
}
