"use client";

import { Frame, Pencil, Play } from "lucide-react";

export type ViewMode = "sketch" | "present" | "canvas";

const MODES: { id: ViewMode; label: string; icon: typeof Play }[] = [
  { id: "canvas", label: "Canvas", icon: Frame },
  { id: "sketch", label: "Sketch", icon: Pencil },
  { id: "present", label: "Present", icon: Play },
];

export function ModeSwitch({ mode, onModeChange }: { mode: ViewMode; onModeChange: (mode: ViewMode) => void }) {
  const others = MODES.filter((m) => m.id !== mode);
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="flex items-center gap-3.5 rounded-full bg-[#1a191f] p-1.5">
      {others.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={m.label}
        >
          <m.icon className="h-[18px] w-[18px]" />
        </button>
      ))}
      <div className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-primary px-2.5">
        <active.icon className="h-[15px] w-[15px] text-white" />
        <p className="text-xs font-medium text-white">{active.label}</p>
      </div>
    </div>
  );
}
