"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ListFilter, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FILTER_GROUPS, type FilterCategoryKey } from "@/lib/filters-data";
import { StylePreview, ComplexityPreview } from "@/components/templates/filter-illustrations";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

export function FilterDialog({
  open,
  onOpenChange,
  selected,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onApply: (selected: string[]) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<FilterCategoryKey>("categories");
  const [draft, setDraft] = useState<string[]>(selected);

  // Re-sync the draft to the currently-applied filters every time the
  // overlay opens, so Cancel/backdrop-click always discards unsaved edits.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraft(selected);
  }, [open, selected]);

  // Hard-unmount on close instead of relying on Base UI's own
  // animate-out-then-unmount timing, which gets stuck (element stays
  // mounted and visible with data-closed/data-ending-style stuck forever) —
  // matches the pattern used by TemplateDetailDialog/AuthDialog elsewhere.
  if (!open) return null;

  const group = FILTER_GROUPS.find((g) => g.key === activeGroup)!;

  function toggle(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function labelFor(value: string) {
    for (const g of FILTER_GROUPS) {
      const opt = g.options.find((o) => o.value === value);
      if (opt) return opt.label;
    }
    return value;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[550px] w-[880px] max-w-[880px] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 bg-popover p-0 sm:max-w-[880px]"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ListFilter className="h-4 w-4 text-primary" />
            Filters
          </DialogTitle>
          <Tip label="Close">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Tip>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className="flex w-[210px] shrink-0 flex-col border-r border-border/60 p-4">
            <nav className="flex flex-col gap-1">
              {FILTER_GROUPS.map((g) => {
                const active = g.key === activeGroup;
                const count = g.options.filter((o) => draft.includes(o.value)).length;
                return (
                  <button
                    key={g.key}
                    onClick={() => setActiveGroup(g.key)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
                      active && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    <g.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{g.label}</span>
                    {count > 0 && !active && (
                      <span className="rounded-full bg-primary/20 px-1.5 text-[10px] text-primary">
                        {count}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            <Button
              variant="outline"
              className="mt-auto w-full rounded-full"
              onClick={() => setDraft([])}
            >
              Reset All
            </Button>
          </div>

          {/* Options */}
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <h3 className="mb-4 shrink-0 text-lg font-semibold">{group.label}</h3>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-3">
                {group.options.map((opt) => {
                  const active = draft.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(opt.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border/60 bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {group.key === "style" && (
                        <div className="h-14 w-full">
                          <StylePreview style={opt.value} />
                        </div>
                      )}
                      {group.key === "complexity" && (
                        <div className="h-20 w-full">
                          <ComplexityPreview
                            level={(group.options.findIndex((o) => o.value === opt.value) +
                              1) as 1 | 2 | 3}
                          />
                        </div>
                      )}
                      {opt.icon && group.key !== "style" && group.key !== "complexity" && (
                        <opt.icon
                          className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")}
                        />
                      )}
                      {opt.swatch && (
                        <span
                          className="h-6 w-6 rounded-full border border-border"
                          style={{ backgroundColor: opt.swatch }}
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected tags + actions */}
            <div className="mt-4 flex shrink-0 items-stretch gap-3">
              <div className="flex min-h-[64px] flex-1 flex-wrap content-start gap-1.5 rounded-xl bg-secondary/60 p-3">
                {draft.length === 0 ? (
                  <span className="self-center text-xs text-muted-foreground">
                    No filters selected yet.
                  </span>
                ) : (
                  draft.map((value) => (
                    <span
                      key={value}
                      className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs"
                    >
                      {labelFor(value)}
                      <button
                        onClick={() => toggle(value)}
                        aria-label={`Remove ${labelFor(value)}`}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="flex w-40 shrink-0 flex-col justify-center gap-2">
                <Button
                  className="w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
                  onClick={() => {
                    onApply(draft);
                    onOpenChange(false);
                  }}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
