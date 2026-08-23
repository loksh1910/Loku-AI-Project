import Image from "next/image";
import { ShoppingBag, Salad, GraduationCap, HeartPulse } from "lucide-react";
import type { Template } from "@/lib/templates-data";

/**
 * Real screenshots (downloaded from the Figma file via download_assets) for
 * the three web templates that had them. The three mobile templates
 * (hybrid-shopping, vidnio-notes, health-management) don't have exported
 * source images in the Landing Page node, so they fall back to a hand-built
 * CSS approximation — swap these in once real assets are exported for them.
 */
const REAL_SCREENSHOTS: Partial<Record<Template["slug"], string>> = {
  "enterprise-data-ai": "/images/template-enterprise-data.png",
  "hiring-platform": "/images/template-hiring-platform.png",
  "ecommerce-platform": "/images/template-ecommerce.png",
};

export function TemplateThumbnail({ template }: { template: Template }) {
  const realSrc = REAL_SCREENSHOTS[template.slug];
  if (realSrc) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white">
        <Image
          src={realSrc}
          alt={`${template.title} preview`}
          fill
          loading="eager"
          className="object-cover object-top"
          sizes="(min-width: 640px) 25vw, 50vw"
        />
      </div>
    );
  }

  switch (template.slug) {
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
          <p className="text-xs leading-tight font-semibold text-white">Vidnio</p>
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
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br px-6 text-center text-sm font-medium text-white/90 ${template.gradient}`}
        >
          {template.title}
        </div>
      );
  }
}
