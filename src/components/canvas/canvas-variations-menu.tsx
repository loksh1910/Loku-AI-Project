"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";

export function CanvasVariationsMenu({
  variationIds,
  active,
  onApply,
}: {
  variationIds: VariationId[];
  active: VariationId[];
  onApply: (ids: VariationId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VariationId[]>(active);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the draft selection from the external `active` prop when the dropdown opens, not deriving state every render
    if (open) setDraft(active);
  }, [open, active]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggle(id: VariationId) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
      >
        <Layers className="h-3.5 w-3.5" />
        Variations
      </button>
      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-[170px] rounded-2xl border border-border/60 bg-popover p-3">
          <div className="space-y-1">
            {variationIds.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs text-foreground hover:bg-secondary"
              >
                <input type="checkbox" checked={draft.includes(id)} onChange={() => toggle(id)} className="accent-primary" />
                {VARIATION_THEMES[id].label}
              </label>
            ))}
          </div>
          <button
            disabled={draft.length === 0}
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            className="mt-2.5 w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Show
          </button>
        </div>
      )}
    </div>
  );
}
