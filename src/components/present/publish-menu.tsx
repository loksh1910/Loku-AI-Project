"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Present mode's equivalent of Export — there's no real hosting behind this,
// so "publishing" surfaces the URL the prototype is already reachable at
// (this same present-mode page, run through localhost during dev) rather
// than fabricating a fake domain — clicking Open genuinely opens it.
export function PublishMenu() {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const [phase, setPhase] = useState<"publishing" | "ready">("publishing");
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open || phase !== "publishing") return;
    const t = setTimeout(() => setPhase("ready"), 1100);
    return () => clearTimeout(t);
  }, [open, phase]);

  function toggleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      setPhase("publishing");
      setCopied(false);
    }
    setOpen((v) => !v);
  }

  const url = typeof window !== "undefined" ? window.location.href : "";

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    toast("Link copied!");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
      >
        Publish
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="z-[9999] w-60 overflow-hidden rounded-2xl border border-border/60 bg-[#18181a] shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Publish</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="border-t border-border/60" />
            <div className="p-4">
              {phase === "publishing" ? (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-xs font-medium text-foreground">Publishing your prototype…</p>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">Your prototype is live at:</p>
                  <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{url}</span>
                    <button
                      onClick={handleCopy}
                      aria-label="Copy link"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => window.open(url, "_blank")}
                    className={cn(
                      "flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2 text-xs font-semibold text-white hover:opacity-90",
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in new tab
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
