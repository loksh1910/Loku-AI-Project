"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import type { Template } from "@/lib/templates-data";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

export function TemplateDetailDialog({
  template,
  onOpenChange,
}: {
  template: Template | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [screenIndex, setScreenIndex] = useState(0);
  const router = useRouter();
  const { isSignedIn, openAuth } = useAppState();

  if (!template) return null;
  const isMobile = template.device === "mobile";

  return (
    <Dialog
      open={!!template}
      onOpenChange={(open) => {
        if (!open) setScreenIndex(0);
        onOpenChange(open);
      }}
    >
      <DialogContent
        showCloseButton
        className="w-full max-w-[1024px] gap-0 rounded-2xl border border-primary/40 bg-popover p-0 sm:max-w-[1024px]"
      >
        <div className="flex items-start justify-between border-b border-border/60 px-8 py-6">
          <div>
            <DialogTitle className="text-xl font-semibold">
              {template.title} — {template.subtitle}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {template.about.split(".")[0]}.
            </p>
          </div>
          <Button
            className="shrink-0 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
            onClick={() => {
              if (template.slug === "healthvisor-app") {
                // The one template with a real app behind it — skip straight
                // to Present Mode with it already "generated", same as
                // finishing the Sketch-to-UI flow, just without sketching.
                onOpenChange(false);
                if (!isSignedIn) {
                  openAuth("signin");
                  return;
                }
                router.push("/sketch/canvas?entry=template");
                return;
              }
              toast.success(`"${template.title}" is ready to use (mock).`);
              onOpenChange(false);
            }}
          >
            Use Template
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 px-8 py-6 sm:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              {template.screens} screens
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setScreenIndex((i) => (i - 1 + template.screens) % template.screens)
                }
                className="rounded-full border border-border/60 p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Previous screen"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border border-border/60",
                  isMobile ? "h-[420px] w-[220px]" : "h-[280px] w-[380px]",
                )}
              >
                <TemplateThumbnail template={template} />
                <div className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-1.5 text-center text-xs font-medium text-white backdrop-blur-sm">
                  Screen {screenIndex + 1} of {template.screens}
                </div>
                <button
                  type="button"
                  onClick={() => toast("Downloaded preview (mock).")}
                  className="absolute top-2 right-2 rounded-md bg-black/30 p-1.5 text-white"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setScreenIndex((i) => (i + 1) % template.screens)}
                className="rounded-full border border-border/60 p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Next screen"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: template.screens }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i === screenIndex ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Array.from({ length: template.screens }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setScreenIndex(i)}
                  className={cn(
                    "h-14 w-9 shrink-0 overflow-hidden rounded-md border",
                    i === screenIndex ? "border-primary" : "border-border/60",
                  )}
                  aria-label={`Screen ${i + 1}`}
                >
                  <TemplateThumbnail template={template} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-primary">
                About this template:
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {template.about}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/40 p-3">
                <h4 className="mb-2 text-sm font-semibold text-primary">
                  Key Feature:
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {template.keyFeatures.map((f) => (
                    <li key={f} className="flex gap-1.5">
                      <span className="text-primary">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 p-3">
                <h4 className="mb-2 text-sm font-semibold text-primary">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
