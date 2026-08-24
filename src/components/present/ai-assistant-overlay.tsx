"use client";

import { CheckCircle2, ChevronRight, Circle, Sparkles, X } from "lucide-react";

const CHECKLIST = [
  { label: "Understanding requirements", done: true },
  { label: "User flow and structure", done: true },
  { label: "Wireframing key screens", done: true },
  { label: "Applying design system", done: true },
  { label: "UI polishing", done: true },
];

export function AiAssistantOverlay({ prompt, onClose }: { prompt: string; onClose?: () => void }) {
  return (
    <div className="flex max-h-[420px] w-[280px] flex-col overflow-hidden rounded-2xl bg-popover">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-white/80" />
          <p className="text-xs font-medium text-white">AI Assistant</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        <div className="ml-auto max-w-[85%] rounded-tl-2xl rounded-br-2xl rounded-bl-2xl bg-primary/50 px-3 py-2">
          <p className="text-[10px] text-white/90">{prompt}</p>
          <p className="mt-1 text-right text-[8px] text-white">10:24 pm</p>
        </div>
        <div className="max-w-[90%] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-[#252525] px-3 py-2">
          <p className="text-[10px] text-white/80">Got it! Here&rsquo;s the plan I follow to design your app:</p>
          <div className="mt-2 space-y-1.5">
            {CHECKLIST.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                {item.done ? (
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-primary" fill="currentColor" fillOpacity={0.25} />
                ) : (
                  <Circle className="h-2.5 w-2.5 shrink-0 text-white/50" />
                )}
                <p className="text-[10px] text-white/80">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-1 text-right text-[8px] text-white/80">10:24 pm</p>
        </div>
      </div>
      <button className="m-3 mt-0 flex items-center justify-between rounded-2xl border border-primary/50 bg-[#252525] px-3 py-2 text-left">
        <div>
          <p className="text-[10px] font-medium text-white/80">Suggested for you</p>
          <p className="text-[8px] text-white/80">Add money tracking page for sellers</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/60" />
      </button>
    </div>
  );
}
