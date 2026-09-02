"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, CheckCircle2, MousePointer2, X } from "lucide-react";
import { toast } from "sonner";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

export type ExportScreen = { id: string; label: string };
type ExportFormat = "figma" | "mcp" | "lovable" | "aistudio" | "png";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "figma", label: "Figma" },
  { id: "mcp", label: "MCP" },
  { id: "lovable", label: "Lovable" },
  { id: "aistudio", label: "AI Studio" },
  { id: "png", label: "PNG" },
];

const CONVERT_CAPTION: Record<Exclude<ExportFormat, "png">, string> = {
  figma: "Your HTML will be sent to code.to.design",
  mcp: "Your screens will be sent to your connected MCP client",
  lovable: "Your screens will be sent to Lovable",
  aistudio: "Your screens will be sent to Google AI Studio",
};
const CONVERTED_CAPTION: Record<Exclude<ExportFormat, "png">, string> = {
  figma: "Paste or use Ctrl + V in your Figma to paste your screens",
  mcp: "Your MCP client can now import these screens",
  lovable: "Open Lovable and paste to continue building",
  aistudio: "Open AI Studio and paste to continue building",
};

// The Export flow (Figma node 1336-33122): screen-select → format → convert/copy
// (or, for PNG, straight to a download). Screen selection here is a compact
// in-panel checklist rather than literal on-canvas clicking — this app's
// canvas views (Canvas Mode, Manual Edit, Manual Prototype, Sketch, User
// Flow) each already own a different, complex click/selection model of their
// own, and layering a second "export selection" mode across all of them
// would be a large, risky change for what is ultimately a mocked export
// destination. The click / shift-click / Ctrl+A interactions the reference
// describes are preserved here, just scoped to this list.
export function ExportMenu({ screens }: { screens: ExportScreen[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [format, setFormat] = useState<ExportFormat | null>(null);
  const [converted, setConverted] = useState(false);
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
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(new Set(screens.map((s) => s.id)));
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, screens]);

  function toggleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      setSelected(new Set());
      setLastIndex(null);
      setFormat(null);
      setConverted(false);
    }
    setOpen((v) => !v);
  }

  function close() {
    setOpen(false);
  }

  function toggleScreen(id: string, index: number, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastIndex !== null) {
        const [a, b] = [lastIndex, index].sort((x, y) => x - y);
        for (let i = a; i <= b; i++) next.add(screens[i].id);
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastIndex(index);
  }

  function handleConvert() {
    setConverted(true);
  }

  function handleExportPng() {
    toast(`Downloaded ${selected.size} screen${selected.size === 1 ? "" : "s"} as PNG (mock).`);
    close();
  }

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${selected.size} screens exported to ${format}`).catch(() => {});
    }
    toast("Copied!");
    close();
  }

  const allSelected = screens.length > 0 && selected.size === screens.length;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
      >
        Export
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="z-[9999] w-60 overflow-hidden rounded-2xl border border-border/60 bg-popover shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Export</p>
              <Tip label="Close">
                <button onClick={close} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </Tip>
            </div>
            <div className="border-t border-border/60" />

            {converted && format && format !== "png" ? (
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" fill="currentColor" fillOpacity={0.15} />
                  <p className="text-xs font-medium text-foreground">All screens Converted</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {CONVERTED_CAPTION[format]}
                </p>
                <button
                  onClick={handleCopy}
                  className="mt-3 w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Copy
                </button>
              </div>
            ) : (
              <>
                <div className="px-4 py-3">
                  {selected.size === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 py-4 text-center">
                      <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">No screens selected</p>
                      <p className="px-3 text-[10px] leading-relaxed text-muted-foreground">
                        Select screens below to include them in the export.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" fill="currentColor" fillOpacity={0.15} />
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {allSelected ? "All screens selected" : `${selected.size} of ${screens.length} screens selected`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Selected screens: {selected.size}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-border/60" />

                <div className="px-4 py-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Screens</p>
                    <button
                      onClick={() => setSelected(new Set(screens.map((s) => s.id)))}
                      className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                    >
                      Select All
                      <span className="rounded border border-border/60 px-1 py-0.5 text-[9px] text-muted-foreground">Ctrl+A</span>
                    </button>
                  </div>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto">
                    {screens.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-muted-foreground">No screens yet.</p>
                    ) : (
                      screens.map((s, i) => {
                        const checked = selected.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={(e) => toggleScreen(s.id, i, e.shiftKey)}
                            className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs hover:bg-secondary"
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                checked ? "border-primary bg-primary" : "border-border/60",
                              )}
                            >
                              {checked && <Check className="h-3 w-3 text-white" />}
                            </span>
                            <span className="truncate text-foreground">{s.label}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {selected.size > 0 && (
                  <>
                    <div className="border-t border-border/60" />
                    <div className="px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Format</p>
                      <div className="space-y-1">
                        {FORMATS.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              setFormat(f.id);
                              setConverted(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-xs hover:bg-secondary"
                          >
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                format === f.id ? "border-primary" : "border-border/60",
                              )}
                            >
                              {format === f.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                            </span>
                            <span className="text-foreground">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="px-4 pb-4">
                  {format && format !== "png" && (
                    <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground">{CONVERT_CAPTION[format]}</p>
                  )}
                  <button
                    disabled={!format}
                    onClick={format === "png" ? handleExportPng : format ? handleConvert : undefined}
                    className="w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:from-secondary disabled:to-secondary disabled:text-muted-foreground disabled:opacity-100"
                  >
                    {format && format !== "png" ? "Convert" : "Export"}
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
