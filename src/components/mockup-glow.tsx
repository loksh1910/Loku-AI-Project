import { Sparkles, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The small "UI mockup card with a purple glow" graphic — confirmed via
 * Figma MCP to be the exact same asset reused in both the Landing Page hero
 * (large, diffuse glow) and the Sign In overlay's illustration slot (smaller,
 * tighter glow). One component, sized via className, so both stay in sync.
 */
export function MockupGlow({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="absolute inset-0 rounded-full bg-[#8E51FF] opacity-30 blur-[50px]" />
      <div className="relative aspect-square w-full max-w-[220px] rounded-2xl border border-white/5 bg-[#0d0d14] p-4 shadow-2xl">
        <Sparkles className="absolute top-3 right-3 h-4 w-4 text-[#8E51FF]/70" />
        <div className="aspect-square w-[42%] rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#3d2b90]" />
        <div className="mt-3 h-2 w-[85%] rounded-full bg-[#6C5CE7]/70" />
        <div className="mt-2 h-2 w-[55%] rounded-full bg-[#6C5CE7]/40" />
        <div className="mt-4 h-2.5 w-[35%] rounded-full bg-[#6C5CE7]" />
        <MousePointer2 className="absolute bottom-4 left-[38%] h-4 w-4 -rotate-12 text-white/70" />
      </div>
    </div>
  );
}
