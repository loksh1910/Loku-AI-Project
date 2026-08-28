"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = ["Claude Sonnet 5", "Claude Opus 5", "Claude Fable 5", "GPT-5", "Gemini 3 Pro"];

// The one "Model" control shared by every AI prompt bar in the app (Landing,
// Dashboard, Present/Prototype floating bars, Code Mode, the Interaction
// box's AI edit) — previously each had its own dead, toast-only button.
// The trigger shows whichever model is currently selected.
export function ModelDropdown({
  variant = "light",
  align = "end",
  className,
}: {
  /** "light" for cards on the app's own bg/border tokens, "dark" for the
   * floating white/opacity-on-black prompt bars (Present/Prototype). */
  variant?: "light" | "dark";
  /** Which side the popup opens from — most callers sit at the right edge of
   * their row, so the menu should open leftward from there. */
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap",
          variant === "dark"
            ? "border-white/70 text-white/70 hover:text-white"
            : "border-border/60 text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        {model}
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute bottom-full z-50 mb-2 w-44 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {MODELS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModel(m);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-secondary",
                  model === m ? "text-primary" : "text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
