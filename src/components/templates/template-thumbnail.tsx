import { BarChart3, PieChart, ShoppingBag, Salad, GraduationCap, HeartPulse } from "lucide-react";
import type { Template } from "@/lib/templates-data";
import { cn } from "@/lib/utils";

/**
 * Renders a closer visual approximation of each template's real preview art
 * (colors/composition observed from the Figma file) rather than a flat
 * gradient block. This is still hand-built CSS, not an exported Figma asset
 * — the Figma MCP tools available don't provide raster asset export, only
 * whole-node screenshots — so treat this as a stand-in until real per-screen
 * thumbnails can be exported and swapped in.
 */
export function TemplateThumbnail({ template }: { template: Template }) {
  switch (template.slug) {
    case "enterprise-data-ai":
      return (
        <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#0c1330] px-5">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-[#3B82F6]/30 blur-xl" />
          <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-[#1c2b5e]/80 to-transparent" />
          <p className="relative text-sm leading-tight font-semibold text-white">
            Enterprise Data
            <br />
            Foundations for AI
          </p>
          <div className="relative mt-2 h-1.5 w-10 rounded-full bg-[#3B82F6]" />
        </div>
      );
    case "hiring-platform":
      return (
        <div className="relative flex h-full w-full flex-col gap-2 bg-[#f3e8ff] p-4">
          <div className="flex gap-1.5">
            <div className="h-8 flex-1 rounded-md bg-white shadow-sm" />
            <div className="h-8 w-8 rounded-md bg-[#6C5CE7]" />
          </div>
          <div className="flex flex-1 items-end gap-1 rounded-md bg-white p-2 shadow-sm">
            {[40, 70, 50, 90, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-[#8E51FF]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
            <PieChart className="h-4 w-4 text-[#6C5CE7]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#e9d5ff]" />
          </div>
        </div>
      );
    case "ecommerce-platform":
      return (
        <div className="relative flex h-full w-full items-center justify-between overflow-hidden bg-white px-4">
          <div>
            <p className="text-sm leading-tight font-bold text-[#1a1a1a]">
              YOUR STORE.
              <br />
              <span className="text-[#c2410c]">THE STRESS.</span>
            </p>
            <div className="mt-2 h-1.5 w-14 rounded-full bg-[#fb923c]" />
          </div>
          <div className="relative h-[85%] w-9 rounded-lg border-2 border-[#1a1a1a] bg-gradient-to-b from-[#fb923c] to-[#c2410c]" />
        </div>
      );
    case "hybrid-shopping":
      return (
        <div className="relative flex h-full w-full flex-col gap-1.5 bg-white p-3">
          <div className="flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2 py-1">
            <ShoppingBag className="h-3 w-3 text-[#f43f5e]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#e5e7eb]" />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {[Salad, ShoppingBag, Salad].map((Icon, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-1 rounded-md bg-[#fef2f2] p-1.5"
              >
                <Icon className="h-4 w-4 text-[#f87171]" />
                <div className="h-1 w-full rounded-full bg-[#fecaca]" />
              </div>
            ))}
          </div>
        </div>
      );
    case "vidnio-notes":
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-[#1a1333] px-4 text-center">
          <GraduationCap className="h-6 w-6 text-[#a78bfa]" />
          <p className="text-xs leading-tight font-semibold text-white">
            Vidnio
          </p>
          <p className="text-[10px] leading-tight text-white/60">
            Notes sharing marketplace
          </p>
        </div>
      );
    case "health-management":
      return (
        <div className="relative flex h-full w-full flex-col gap-1.5 bg-[#eff6ff] p-3">
          <div className="flex items-center gap-1.5 rounded-md bg-white p-1.5 shadow-sm">
            <HeartPulse className="h-3.5 w-3.5 text-[#3b82f6]" />
            <div className="h-1.5 flex-1 rounded-full bg-[#dbeafe]" />
          </div>
          <div className="flex flex-1 gap-1.5">
            <div className="flex-1 rounded-md bg-white shadow-sm" />
            <div className="flex-1 rounded-md bg-[#bfdbfe]" />
          </div>
        </div>
      );
    default:
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-gradient-to-br px-6 text-center text-sm font-medium text-white/90",
            template.gradient,
          )}
        >
          <BarChart3 className="mr-1.5 h-4 w-4" />
          {template.title}
        </div>
      );
  }
}
