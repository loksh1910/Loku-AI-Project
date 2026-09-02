"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Mic, Palette, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelDropdown } from "@/components/ai/model-dropdown";
import { Tip } from "@/components/ui/tip";

const SUGGESTIONS = ["Try a different style", "Change the overall color theme", "Add a new page"];

export function PresentPromptBar({ taggedElement, onClearTag }: { taggedElement?: string | null; onClearTag?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [value, setValue] = useState("");

  if (collapsed) {
    return (
      <Tip label="Expand prompt bar" className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand prompt bar"
          className="flex h-6 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF]"
        >
          <ChevronUp className="h-4 w-4 text-white" />
        </button>
      </Tip>
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-30 w-[626px] -translate-x-1/2">
      <Tip label="Collapse prompt bar" className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse prompt bar"
          className="flex h-6 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF]"
        >
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
      </Tip>

      <div className="rounded-3xl bg-popover p-4">
        {taggedElement && (
          <div className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] text-primary">
            {taggedElement}
            <Tip label="Remove tag">
              <button onClick={onClearTag} aria-label="Remove tag">
                <X className="h-3 w-3" />
              </button>
            </Tip>
          </div>
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Select a screen or specific element to refine…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Tip label="Attach">
              <button aria-label="Attach">
                <Plus className="h-4 w-4" />
              </button>
            </Tip>
            <Tip label="Color">
              <button aria-label="Color">
                <Palette className="h-5 w-5" />
              </button>
            </Tip>
          </div>
          <div className="flex items-center gap-3">
            <ModelDropdown />
            <Tip label="Voice input">
              <button aria-label="Voice input" className="text-muted-foreground">
                <Mic className="h-4 w-4" />
              </button>
            </Tip>
            <Tip label="Submit">
              <button
                aria-label="Submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </Tip>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className={cn(
              "rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
