"use client";

import { useState } from "react";
import { Plus, Palette, Mic, ArrowRight, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ModelDropdown } from "@/components/ai/model-dropdown";
import { Tip } from "@/components/ui/tip";

const MODES = [
  { id: "App" as const, icon: Smartphone },
  { id: "Web" as const, icon: Monitor },
];

// The notch on either side of the App/Web pill — anchored to the pill's own
// edges (not the outer box), so it tracks the pill's content-driven width
// automatically instead of needing a hardcoded offset. Each is a quarter
// circle of the box's own background color, cut with a radial gradient, that
// smoothly flows the pill's rounded corner into the box's flat top edge —
// the same "inverted corner" trick used for tooltip/speech-bubble tails.
function PillNotch({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-full h-3.5 w-3.5",
        side === "left" ? "right-full" : "left-full",
      )}
      style={{
        background:
          side === "left"
            ? "radial-gradient(circle at top right, transparent 13.5px, var(--card) 14px)"
            : "radial-gradient(circle at top left, transparent 13.5px, var(--card) 14px)",
      }}
    />
  );
}

export function AiPromptBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Create a healthcare monitoring app with clean UX…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<"App" | "Web">("App");

  return (
    <div className={cn("relative", className)}>
      {/* The App/Web pill straddles the box's own top border rather than
          sitting above it — matches the Figma reference exactly, including
          the notch where the box's flat edge curves up into the pill. */}
      <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center gap-0.5 rounded-full border-t border-r border-l border-primary/40 bg-[#1e1e1e] p-1">
          <PillNotch side="left" />
          <PillNotch side="right" />
          {MODES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap",
                mode === id
                  ? "bg-gradient-to-r from-[#6C5CE7] to-[#3d248c] text-white"
                  : "text-white/60 hover:text-white/80",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-primary/40 bg-card px-4 pt-7 pb-3 shadow-[0_0_0_1px_rgba(108,92,231,0.08)]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center justify-between px-1 pt-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Tip label="Attach">
              <button
                className="rounded-md p-1.5 hover:bg-secondary"
                onClick={() => toast("Attach files coming soon.")}
                aria-label="Attach"
              >
                <Plus className="h-4 w-4" />
              </button>
            </Tip>
            <Tip label="Style">
              <button
                className="rounded-md p-1.5 hover:bg-secondary"
                onClick={() => toast("Style picker coming soon.")}
                aria-label="Style"
              >
                <Palette className="h-4 w-4" />
              </button>
            </Tip>
          </div>

          <div className="flex items-center gap-2">
            <ModelDropdown />
            <Tip label="Voice input">
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                onClick={() => toast("Voice input coming soon.")}
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
            </Tip>
            <Tip label="Submit">
              <button
                onClick={onSubmit}
                className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90"
                aria-label="Submit"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </Tip>
          </div>
        </div>
      </div>
    </div>
  );
}
