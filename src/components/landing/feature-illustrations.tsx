import { Sparkles, MousePointer2, GitBranch, LayoutGrid } from "lucide-react";

/**
 * CSS/SVG approximations of the four feature illustrations from the Figma
 * landing page — not exported Figma assets (the MCP tools available don't
 * support raster asset export, only whole-node screenshots), but built to
 * match the composition described: sketch-to-UI phone, a sitemap-like
 * collage, stacked comparison phones, and an editable dashboard mockup.
 */

export function SketchToUiIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#6C5CE7]/20 via-[#8E51FF]/10 to-transparent">
      <div className="relative h-40 w-24 rounded-2xl border-2 border-dashed border-[#8E51FF]/50 bg-card/60 p-2">
        <div className="h-2 w-1/2 rounded-full bg-[#8E51FF]/40" />
        <div className="mt-2 h-10 rounded-md border border-dashed border-[#8E51FF]/40" />
        <div className="mt-2 h-2 w-full rounded-full bg-[#8E51FF]/30" />
        <div className="mt-1.5 h-2 w-3/4 rounded-full bg-[#8E51FF]/20" />
      </div>
      <Sparkles className="absolute top-6 right-10 h-5 w-5 text-[#8E51FF]" />
      <MousePointer2 className="absolute bottom-8 left-10 h-5 w-5 text-[#6C5CE7]" />
    </div>
  );
}

export function FlowsIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-3 bg-gradient-to-br from-[#00D68F]/15 via-[#3B82F6]/10 to-transparent p-6">
      {[0, 1, 2].map((col) => (
        <div key={col} className="flex flex-col gap-2">
          {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-10 rounded-md border border-[#00D68F]/40 bg-card/70"
            />
          ))}
        </div>
      ))}
      <GitBranch className="absolute top-4 left-4 h-5 w-5 text-[#00D68F]" />
    </div>
  );
}

export function VariationsIllustration() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-gradient-to-br from-[#F5D547]/15 via-[#8E51FF]/10 to-transparent p-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-32 w-16 rounded-xl border border-[#8E51FF]/30 bg-card/70 p-1.5"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <div className="h-1.5 w-2/3 rounded-full bg-[#8E51FF]/40" />
          <div className="mt-2 h-6 rounded-md bg-[#F5D547]/30" />
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#8E51FF]/20" />
        </div>
      ))}
    </div>
  );
}

export function AiManualIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F43F5E]/15 via-[#6C5CE7]/15 to-transparent">
      <div className="h-32 w-44 rounded-xl border border-border/60 bg-card/70 p-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <LayoutGrid className="h-3 w-3 text-[#6C5CE7]" />
          <div className="h-1.5 w-1/3 rounded-full bg-[#6C5CE7]/40" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-10 rounded-md bg-[#6C5CE7]/20" />
          <div className="h-10 rounded-md bg-[#F43F5E]/20" />
          <div className="h-10 rounded-md bg-[#6C5CE7]/20" />
        </div>
      </div>
      <MousePointer2 className="absolute bottom-6 right-10 h-5 w-5 text-[#F43F5E]" />
    </div>
  );
}
