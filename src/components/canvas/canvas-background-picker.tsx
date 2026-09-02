"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

// A handful of practical neutral canvas colors (Figma-style) — white/light
// greys for working on dark content, dark greys/black for light content —
// plus a native color input for anything else.
const PRESETS = ["#FFFFFF", "#F0F0F3", "#E4E4E7", "#52525B", "#27272A", "#000000"];

// Split diagonally light/dark — reads as "follows the app theme" rather than
// any one specific color, which is what "Default" actually means here.
const DEFAULT_SWATCH_BG = "linear-gradient(135deg, #ffffff 50%, #18181b 50%)";

/** Figma-style canvas background color control — sits at the bottom-right of
 * every pannable/zoomable canvas (Sketch mode, Canvas mode's AI/Wireframe/
 * Prototype/Design/User Flow/Sitemap tabs), just left of the zoom-percent
 * pill. `value: null` means "use the app's own light/dark background" —
 * the actual default state — anything else is a manual override so a white
 * screen doesn't disappear into a white canvas in light mode (or vice versa). */
export function CanvasBackgroundPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <Tip label="Canvas color" side="top">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Canvas color"
          className="h-6 w-6 shrink-0 rounded-full border border-border/60"
          style={{ background: value ?? DEFAULT_SWATCH_BG }}
        />
      </Tip>
      {open && (
        <div className="absolute right-0 bottom-full z-40 mb-2 w-[190px] rounded-2xl border border-border/60 bg-popover p-3 shadow-2xl">
          <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Canvas color</p>
          <div className="flex flex-wrap gap-2">
            <Tip label="Default (theme)">
              <button
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                aria-label="Default (theme)"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border border-border",
                  value === null && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                )}
                style={{ background: DEFAULT_SWATCH_BG }}
              >
                {value === null && <Check className="h-3.5 w-3.5 text-primary drop-shadow" />}
              </button>
            </Tip>
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                aria-label={c}
                className={cn(
                  "h-7 w-7 rounded-full border border-border",
                  value === c && "ring-2 ring-primary ring-offset-2 ring-offset-popover",
                )}
                style={{ background: c }}
              />
            ))}
            <label
              className={cn(
                "relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border",
                value && !PRESETS.includes(value) ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "border-primary/60",
              )}
              style={value && !PRESETS.includes(value) ? { background: value } : undefined}
            >
              {!(value && !PRESETS.includes(value)) && (
                <span
                  aria-hidden
                  className="h-full w-full"
                  style={{ background: "conic-gradient(#f43f5e,#f5d547,#00d68f,#3b82f6,#8e51ff,#f43f5e)" }}
                />
              )}
              <input
                type="color"
                aria-label="Custom canvas color"
                value={value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#808080"}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
