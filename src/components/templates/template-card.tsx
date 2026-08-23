"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Template } from "@/lib/templates-data";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
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
  const [hovered, setHovered] = useState(false);
  const [screenIndex, setScreenIndex] = useState(0);

  const isMobile = template.device === "mobile";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card",
        className,
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setScreenIndex(0);
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          isMobile ? "aspect-[3/4]" : "aspect-[16/10]",
        )}
      >
        <TemplateThumbnail template={template} />

        {hovered && <div className="absolute inset-0 bg-black/25" />}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast("Downloaded a preview thumbnail (mock).");
          }}
          className="absolute top-2 right-2 rounded-md bg-black/30 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          aria-label="Download preview"
        >
          <Download className="h-3.5 w-3.5" />
        </button>

        {hovered && (
          <>
            <div className="absolute top-2 left-2 rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {template.screens} screens
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setScreenIndex((i) => (i - 1 + template.screens) % template.screens);
              }}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Previous screen"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setScreenIndex((i) => (i + 1) % template.screens);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm hover:bg-black/60"
              aria-label="Next screen"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute right-0 bottom-3 left-0 flex flex-col items-center gap-1">
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
          </>
        )}
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
