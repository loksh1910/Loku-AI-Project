"use client";

import { useEffect, useRef, useState } from "react";
import { Columns2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";
import { SplashScreen } from "@/components/present/health-app/screens";

export function VariationsPanel({
  variationIds,
  selected,
  onSelect,
  compareMode,
  compareSelection,
  onCompareToggle,
  onCompareSelectionChange,
}: {
  variationIds: VariationId[];
  selected: VariationId;
  onSelect: (id: VariationId) => void;
  compareMode: boolean;
  compareSelection: VariationId[];
  onCompareToggle: () => void;
  onCompareSelectionChange: (ids: VariationId[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggleCompareId(id: VariationId) {
    onCompareSelectionChange(
      compareSelection.includes(id) ? compareSelection.filter((v) => v !== id) : [...compareSelection, id],
    );
  }

  return (
    <div ref={rootRef} className="z-30 flex w-[150px] flex-col items-start gap-2.5">
      <div className="relative w-full">
        <button
          onClick={() => (compareMode ? onCompareToggle() : setPickerOpen((v) => !v))}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-2xl bg-card text-xs font-medium text-foreground",
            compareMode && "border border-primary bg-primary/10",
          )}
        >
          <Columns2 className="h-[15px] w-[15px]" />
          Compare
        </button>
        {pickerOpen && (
          <div className="absolute top-full right-0 z-40 mt-2 w-[180px] rounded-2xl border border-border/60 bg-popover p-3">
            <p className="mb-2 text-xs font-medium text-foreground">Compare variations</p>
            <div className="space-y-1.5">
              {variationIds.map((id) => (
                <label key={id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  <input
                    type="checkbox"
                    checked={compareSelection.includes(id)}
                    onChange={() => toggleCompareId(id)}
                    className="accent-primary"
                  />
                  Variation {variationIds.indexOf(id) + 1} &middot; {VARIATION_THEMES[id].label}
                </label>
              ))}
            </div>
            <button
              disabled={compareSelection.length < 2}
              onClick={() => {
                setPickerOpen(false);
                onCompareToggle();
              }}
              className="mt-2.5 w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {variationIds.map((id, i) => {
        const theme = VARIATION_THEMES[id];
        const isSelected = selected === id;
        return (
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(id)}
            className={cn(
              "flex h-[153px] w-full cursor-pointer flex-col items-center gap-2 rounded-2xl bg-card pt-3",
              isSelected && "border border-primary bg-primary/10",
            )}
          >
            <p className={cn("text-[10px] font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>Variation {i + 1}</p>
            <div className="pointer-events-none h-[85px] w-[55px] overflow-hidden rounded-[10px] border border-border">
              <div className="h-full w-full origin-top-left scale-[0.23]" style={{ width: 241, height: 370 }}>
                <SplashScreen theme={theme} onNavigate={() => {}} />
              </div>
            </div>
            <p className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>{theme.label}</p>
          </div>
        );
      })}
    </div>
  );
}
