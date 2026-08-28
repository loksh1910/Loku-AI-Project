"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Pencil, Smartphone, Sparkles, Trash2, X } from "lucide-react";
import { ModelDropdown } from "@/components/ai/model-dropdown";
import { Tip } from "@/components/ui/tip";

const TRIGGERS = ["On Click", "On Hover", "After Delay", "All Actions"];
const ACTIONS = ["Navigate to", "Open Overlay", "Scroll to"];
const ANIMATIONS = ["Slide right", "Slide left", "Slide up", "Slide down", "Fade", "None"];
const DURATIONS = ["150ms", "250ms", "300ms", "500ms"];
const EASINGS = ["Ease in out", "Ease in", "Ease out", "Linear"];
const AI_SUGGESTIONS = ["Make it smoother", "Add slight delay", "Use fade animation"];

// The editable fields every interaction shares, regardless of what system of
// screens it points into — kept generic so this one box serves both the fixed
// HealthVisor Prototype flow (PrototypeInteraction) and the Design/Prototype
// entry's freeform ManualInteraction, rather than forking the component.
export type InteractionCoreFields = {
  sourceElementName: string;
  sourceElementType: string;
  trigger: string;
  action: string;
  animation: string;
  duration: string;
  easing: string;
};

// Only the fields this box's own Manual-edit dropdowns ever patch — narrower
// than InteractionCoreFields on purpose. sourceElementType is a plain `string`
// here but a closed union on PrototypeInteraction (its concrete caller); typing
// onChange over the wider InteractionCoreFields would force every caller's
// state to widen sourceElementType to `string` too, just from this callback's
// shape, even though it's never one of the fields actually written back.
type InteractionEditableFields = Pick<InteractionCoreFields, "trigger" | "action" | "animation" | "duration" | "easing">;

export function PrototypeInteractionBox<T extends InteractionCoreFields>({
  interaction,
  targetLabel,
  targetOptions,
  x,
  y,
  initialMode = "ai",
  onChange,
  onTargetChange,
  onClose,
  onDelete,
}: {
  interaction: T;
  /** Resolved display name of the interaction's current target. */
  targetLabel: string;
  /** Every screen the target dropdown can switch to. */
  targetOptions: { id: string; label: string }[];
  x: number;
  y: number;
  /** The Design/Prototype entry opens straight into Manual edit — every other
   * caller keeps the original AI-edit-first default. */
  initialMode?: "ai" | "manual";
  onChange: (patch: Partial<InteractionEditableFields>) => void;
  onTargetChange: (id: string) => void;
  onClose: () => void;
  /** Removes the interaction entirely — omit to leave the box delete-less
   * (the original HealthVisor Prototype flow's wires are template-derived,
   * not something a user builds by hand, so it doesn't pass this). */
  onDelete?: () => void;
}) {
  const [mode, setMode] = useState<"ai" | "manual">(initialMode);
  const [prompt, setPrompt] = useState("");
  const [targetOpen, setTargetOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute z-40 w-[280px] rounded-2xl border border-primary/40 bg-popover p-4 shadow-2xl"
      style={{
        left: `max(8px, min(${x}px, calc(100% - 288px)))`,
        // 520px clears Manual edit's full height (5 selects + header + back
        // button) — taller than AI edit's, but this one clamp constant has to
        // cover whichever mode the box opens in, and openers picking
        // initialMode="manual" (the Design/Prototype entry) are a real path
        // now, not just a toggle a user might reach mid-session.
        top: `max(8px, min(${y}px, calc(100% - 520px)))`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Interaction
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <Tip label="Delete interaction">
              <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Delete interaction">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Tip>
          )}
          <Tip label="Close">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </Tip>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-2 py-1.5 text-[11px]">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{interaction.sourceElementName}</p>
          <p className="text-[10px] text-muted-foreground">{interaction.sourceElementType}</p>
        </div>
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <div className="relative min-w-0 flex-1">
          <button
            onClick={() => setTargetOpen((v) => !v)}
            className="flex w-full items-center gap-1 text-left hover:opacity-80"
          >
            <Smartphone className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <p className="truncate font-medium">{targetLabel}</p>
              <p className="text-[10px] text-muted-foreground">Screen</p>
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
          {targetOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-[160px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
              {targetOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onTargetChange(opt.id);
                    setTargetOpen(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {mode === "ai" ? (
        <>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI edit
          </p>
          <div className="mb-2.5 rounded-xl border border-border/60 bg-secondary/40 p-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the change you want to make..."
              rows={2}
              className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-end gap-1.5">
              <ModelDropdown className="px-2 py-1 text-[10px]" />
              <Tip label="Submit">
                <button
                  aria-label="Submit"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Tip>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="border-t border-border/60 pt-3">
            <button
              onClick={() => setMode("manual")}
              className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Manually
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
            <Pencil className="h-3.5 w-3.5 text-primary" />
            Manual edit
          </p>
          <Select label="Trigger" value={interaction.trigger} options={TRIGGERS} onChange={(v) => onChange({ trigger: v })} />
          <Select label="Action" value={interaction.action} options={ACTIONS} onChange={(v) => onChange({ action: v })} />
          <Select label="Animation" value={interaction.animation} options={ANIMATIONS} onChange={(v) => onChange({ animation: v })} />
          <Select label="Duration" value={interaction.duration} options={DURATIONS} onChange={(v) => onChange({ duration: v })} />
          <Select label="Easing" value={interaction.easing} options={EASINGS} onChange={(v) => onChange({ easing: v })} />
          <div className="border-t border-border/60 pt-3">
            <button
              onClick={() => setMode("ai")}
              className="flex items-center gap-1.5 rounded-full border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Edit with AI
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="mb-2.5 block text-xs">
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
