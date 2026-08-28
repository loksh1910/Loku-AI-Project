"use client";

import { useState } from "react";
import type { SketchConnector, SketchFrame } from "@/components/sketch/sketch-types";
import { Tip } from "@/components/ui/tip";

const TRIGGERS = ["All Actions", "On Click", "On Hover", "After Delay"];
const ACTIONS = ["Navigate to", "Open Overlay", "Swap Screen", "Scroll to"];
const ANIMATIONS = ["Instant", "Slide right", "Slide left", "Fade", "Dissolve"];
const DURATIONS = ["100ms", "200ms", "300ms", "500ms"];
const EASINGS = ["Ease in out", "Ease in", "Ease out", "Linear"];

export function ConnectorInteractionBox({
  connector,
  fromFrame,
  toFrame,
  x,
  y,
  onChange,
  onClose,
}: {
  connector: SketchConnector;
  fromFrame: SketchFrame;
  toFrame: SketchFrame;
  x: number;
  y: number;
  onChange: (patch: Partial<SketchConnector>) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div
      className="absolute z-40 w-[260px] rounded-2xl border border-primary/40 bg-popover p-4 shadow-2xl"
      style={{
        left: `max(8px, min(${x}px, calc(100% - 268px)))`,
        top: `max(8px, min(${y}px, calc(100% - 420px)))`,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Interaction
        </div>
        <Tip label="Close">
          <button
            onClick={() => {
              setOpen(false);
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </Tip>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-dashed border-border/60 px-2 py-1.5 text-xs">
        <span className="truncate">{fromFrame.name}</span>
        <span className="text-muted-foreground">→</span>
        <span className="truncate">{toFrame.name}</span>
      </div>

      <Select label="Trigger" value={connector.trigger} options={TRIGGERS} onChange={(v) => onChange({ trigger: v })} />
      <Select label="Action" value={connector.action} options={ACTIONS} onChange={(v) => onChange({ action: v })} />
      <Select label="Animation" value={connector.animation} options={ANIMATIONS} onChange={(v) => onChange({ animation: v })} />
      <Select label="Duration" value={connector.duration} options={DURATIONS} onChange={(v) => onChange({ duration: v })} />
      <Select label="Easing" value={connector.easing} options={EASINGS} onChange={(v) => onChange({ easing: v })} />
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
