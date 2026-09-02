"use client";

import { Eye, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManualElementView } from "@/components/canvas/manual-edit-view";
import type { ManualElement, ManualFrame } from "@/components/canvas/manual-types";
import type { ManualInteraction } from "@/components/canvas/manual-prototype-types";

// A phone-shaped frame gets the notch treatment; anything wider/flatter (a
// tablet, desktop, or watch face) just gets a plain rounded bezel — a rough
// but honest read of "this looks like a phone" from the frame's own aspect
// ratio, since freeform Design-mode frames carry no explicit device category.
const MAX_BOX_W = 460;
const MAX_BOX_H = 640;

function DesignedDeviceFrame({ frame, children }: { frame: ManualFrame; children: React.ReactNode }) {
  const scale = Math.min(1, MAX_BOX_W / frame.device.width, MAX_BOX_H / frame.device.height);
  const w = frame.device.width * scale;
  const h = frame.device.height * scale;
  const looksLikePhone = frame.device.height > frame.device.width * 1.5;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[32px] border-[6px] border-black bg-black shadow-2xl"
      style={{ width: w, height: h }}
    >
      {looksLikePhone && (
        <div className="absolute top-0 left-1/2 z-10 h-[16px] w-[80px] -translate-x-1/2 rounded-b-[12px] bg-black" />
      )}
      <div className="relative h-full w-full overflow-hidden" style={{ background: frame.fill }}>
        {children}
      </div>
    </div>
  );
}

export function ManualPresentView({
  frames,
  elements,
  interactions,
  activeFrameId,
  onNavigate,
  screensOpen,
}: {
  frames: ManualFrame[];
  elements: ManualElement[];
  interactions: ManualInteraction[];
  activeFrameId: string | null;
  onNavigate: (frameId: string) => void;
  screensOpen: boolean;
}) {
  const activeFrame = frames.find((f) => f.id === activeFrameId) ?? null;

  if (!activeFrame) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden bg-background text-center">
        <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Design a screen to present</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Switch to Canvas → Design and add your first screen — it&apos;ll show up here once something exists.
        </p>
      </div>
    );
  }

  const activeElements = elements.filter((el) => el.frameId === activeFrame.id);
  const scale = Math.min(1, MAX_BOX_W / activeFrame.device.width, MAX_BOX_H / activeFrame.device.height);

  function handleElementClick(el: ManualElement) {
    const wire = interactions.find((it) => it.sourceElementId === el.id && it.action === "Navigate to");
    if (wire) onNavigate(wire.targetFrameId);
  }

  function handleScreenClick() {
    const wire = interactions.find(
      (it) => it.sourceFrameId === activeFrame!.id && it.sourceElementId === null && it.action === "Navigate to",
    );
    if (wire) onNavigate(wire.targetFrameId);
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <div className="flex h-full items-center justify-center">
        <div onPointerDown={handleScreenClick}>
          <DesignedDeviceFrame frame={activeFrame}>
            {activeElements.map((el) => (
              <ManualElementView
                key={el.id}
                el={el}
                zoom={scale}
                originX={0}
                originY={0}
                selected={false}
                editing={false}
                onPointerDownDrag={(e) => {
                  e.stopPropagation();
                  handleElementClick(el);
                }}
                onStartResize={() => {}}
                onDoubleClickText={() => {}}
                onCommitText={() => {}}
              />
            ))}
          </DesignedDeviceFrame>
        </div>
      </div>

      {screensOpen && frames.length > 0 && (
        <div className="absolute top-6 left-6 z-30 w-[280px] rounded-2xl bg-popover p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Screens</h3>
          </div>
          <p className="mb-1 px-1 text-[10px] tracking-wide text-muted-foreground uppercase">{frames.length} screens</p>
          <div className="max-h-[280px] overflow-y-auto">
            {frames.map((f, i) => (
              <button
                key={f.id}
                onClick={() => onNavigate(f.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-secondary",
                  activeFrame.id === f.id && "bg-primary/30",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground">{f.name}</span>
                </span>
                <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
