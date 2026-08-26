"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Pencil, Smartphone, Sparkles, X } from "lucide-react";
import { HEALTH_SCREENS } from "@/components/present/health-app/screens";
import { SCREEN_ORDER } from "@/components/canvas/canvas-types";
import type { PrototypeInteraction } from "@/components/canvas/prototype-types";

const TRIGGERS = ["On Click", "On Hover", "After Delay", "All Actions"];
const ACTIONS = ["Navigate to", "Open Overlay", "Scroll to"];
const ANIMATIONS = ["Slide right", "Slide left", "Slide up", "Slide down", "Fade", "None"];
const DURATIONS = ["150ms", "250ms", "300ms", "500ms"];
const EASINGS = ["Ease in out", "Ease in", "Ease out", "Linear"];
const AI_SUGGESTIONS = ["Make it smoother", "Add slight delay", "Use fade animation"];

export function PrototypeInteractionBox({
  interaction,
  x,
  y,
  onChange,
  onClose,
}: {
  interaction: PrototypeInteraction;
  x: number;
  y: number;
  onChange: (patch: Partial<PrototypeInteraction>) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
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
        top: `max(8px, min(${y}px, calc(100% - 420px)))`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Interaction
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
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
              <p className="truncate font-medium">{HEALTH_SCREENS[interaction.targetScreenId].name}</p>
              <p className="text-[10px] text-muted-foreground">Screen</p>
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
          {targetOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-[160px] rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl">
              {SCREEN_ORDER.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    onChange({ targetScreenId: id });
                    setTargetOpen(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary"
                >
                  {HEALTH_SCREENS[id].name}
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
            <div className="flex justify-end">
              <button
                aria-label="Submit"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
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
              Back to AI edit
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
