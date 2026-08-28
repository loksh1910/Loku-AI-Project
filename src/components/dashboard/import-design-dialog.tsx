"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Info, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Hand-built approximation of the Figma logomark (four brand-color dots) —
// no literal export available for a tiny decorative badge like this, same
// approach as every other non-exported brand visual in this codebase.
function FigmaMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg bg-[#1e1e1e]", className)}>
      <span className="absolute top-[22%] left-[22%] h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F24E1E]" />
      <span className="absolute top-[22%] right-[22%] h-[32%] w-[32%] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#A259FF]" />
      <span className="absolute bottom-[22%] left-[22%] h-[32%] w-[32%] -translate-x-1/2 translate-y-1/2 rounded-full bg-[#1ABCFE]" />
      <span className="absolute bottom-[22%] right-[22%] h-[32%] w-[32%] translate-x-1/2 translate-y-1/2 rounded-full bg-[#0ACF83]" />
    </div>
  );
}

// Standing in for a real file picker — there's no backend to actually parse a
// dropped .fig/.md file, so "browsing" always resolves to this one mock file:
// the same HealthVisor app already built everywhere else in this app,
// presented as if it just arrived via Figma import.
const MOCK_FILE = { name: "Healthcare App Design.fig", size: "12.4 MB" };

export function ImportDesignDialog({
  open,
  onOpenChange,
  onOpenEditor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEditor: () => void;
}) {
  const [fileSelected, setFileSelected] = useState(false);

  // Hard-unmount rather than trusting Base UI Dialog's own animate-out — see
  // the other dialogs in this codebase for why (CLAUDE.md gotcha #2).
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFileSelected(false);
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton
        className="w-full max-w-[460px] rounded-2xl border border-border/60 bg-popover p-6 sm:max-w-[460px]"
      >
        <div className="flex flex-col items-center text-center">
          <UploadCloud className="h-8 w-8 text-primary" />
          <DialogTitle className="mt-3 text-xl font-semibold">Import your design</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload files from Figma or Markdown to continue editing and generating UI
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFileSelected(true)}
          className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 px-6 py-8 text-center hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/50 text-primary">
            <UploadCloud className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">Drag and drop your file here</span>
          <span className="text-sm text-primary">or click to browse</span>
          <span className="mt-2 flex items-center gap-6">
            <span className="flex flex-col items-center gap-1">
              <FigmaMark className="h-6 w-6" />
              <span className="text-[11px] text-muted-foreground">.fig</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">.md</span>
            </span>
          </span>
        </button>

        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>We&apos;ll convert your design into an editable canvas with AI support</span>
        </div>

        {fileSelected && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3">
            <FigmaMark className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{MOCK_FILE.name}</p>
              <p className="text-xs text-muted-foreground">{MOCK_FILE.size}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          </div>
        )}

        {fileSelected && (
          <button
            onClick={onOpenEditor}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Open in Editor
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
