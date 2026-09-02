"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Mic, Workflow, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelDropdown } from "@/components/ai/model-dropdown";
import { Tip } from "@/components/ui/tip";
import type { ApplyOn } from "@/components/canvas/prototype-types";

const SUGGESTIONS = ["make all buttons open as modal", "Apply slide animation between all screens"];

const APPLY_ON_OPTIONS: { id: ApplyOn; label: string; noun: string }[] = [
  { id: "actions", label: "All Actions", noun: "Actions" },
  { id: "elements", label: "All Elements", noun: "Elements" },
  { id: "selected", label: "Selected", noun: "Elements" },
];

export function PrototypePromptBar({
  applyOn,
  onApplyOnChange,
  totalCount,
  selectedCount,
  taggedElement,
  onClearTag,
}: {
  applyOn: ApplyOn;
  onApplyOnChange: (applyOn: ApplyOn) => void;
  totalCount: number;
  selectedCount: number;
  taggedElement?: string | null;
  onClearTag?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [value, setValue] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-6 left-1/2 z-30 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-4 text-xs font-medium text-white"
      >
        <Workflow className="h-3.5 w-3.5" />
        Edit Flows
      </button>
    );
  }

  const current = APPLY_ON_OPTIONS.find((o) => o.id === applyOn)!;
  const count = applyOn === "selected" ? selectedCount : totalCount;
  const placeholder =
    applyOn === "actions"
      ? "Edit interactions across all Actions..."
      : applyOn === "elements"
        ? "Edit interactions across all Elements..."
        : "Edit interactions across all selected elements or actions...";

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
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">Apply on:</span>
            <div className="relative">
              <button
                onClick={() => setApplyOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {current.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {applyOpen && (
                <div className="absolute bottom-full left-0 z-10 mb-2 w-[140px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
                  {APPLY_ON_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        onApplyOnChange(o.id);
                        setApplyOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary",
                        applyOn === o.id && "text-primary",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs whitespace-nowrap text-muted-foreground/70">
              Selected {current.noun} ({count})
            </span>
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
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
