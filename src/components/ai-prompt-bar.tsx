"use client";

import { useState } from "react";
import { Plus, Palette, Mic, ArrowUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "rounded-2xl border border-primary/40 bg-card p-3 shadow-[0_0_0_1px_rgba(108,92,231,0.08)]",
        className,
      )}
    >
      <div className="mb-3 flex justify-center">
        <div className="flex rounded-full bg-secondary p-1 text-sm">
          {(["App", "Web"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground"
                  : "rounded-full px-4 py-1.5 text-muted-foreground"
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

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
        className="w-full resize-none bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
      />

      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            className="rounded-md p-1.5 hover:bg-secondary"
            onClick={() => toast("Attach files coming soon.")}
            aria-label="Attach"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="rounded-md p-1.5 hover:bg-secondary"
            onClick={() => toast("Style picker coming soon.")}
            aria-label="Style"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => toast("Model selection coming soon.")}
          >
            Model
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
            onClick={() => toast("Voice input coming soon.")}
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={onSubmit}
            className="rounded-full bg-primary p-2 text-primary-foreground hover:opacity-90"
            aria-label="Submit"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
