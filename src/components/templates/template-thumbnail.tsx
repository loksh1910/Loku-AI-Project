import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import type { Template } from "@/lib/templates-data";
import { cn } from "@/lib/utils";

/** Real screenshots downloaded from the Figma file via download_assets — one per template. */
const REAL_SCREENSHOTS: Record<string, string> = {
  "enterprise-data-ai": "/images/template-enterprise-data.png",
  "hiring-platform": "/images/template-hiring-platform.png",
  "ecommerce-platform": "/images/template-ecommerce.png",
  "hybrid-shopping": "/images/template-hybrid-shopping.png",
  "vidnio-notes": "/images/template-vidnio.png",
};

// HealthVisor has no Figma-exported screenshot (it isn't a Figma mock — it's
// the real generated app), so its cover is a hand-built approximation of its
// actual Splash screen instead, using percentage/flex sizing throughout so it
// scales cleanly at the card's small size, the detail dialog's larger one, and
// the filmstrip's tiny one, without needing a fixed-pixel component scaled down.
function HealthVisorCover() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0a0f] p-[6%]">
      <div className="flex aspect-[241/500] h-full max-w-full flex-col items-center justify-center gap-[6%] rounded-[8%] bg-white px-[8%] text-center">
        <div className="flex aspect-square w-[24%] items-center justify-center rounded-[22%] bg-[#F2F5FF]">
          <ShieldCheck className="h-[55%] w-[55%] text-[#3B6EDC]" />
        </div>
        <p className="text-[8px] leading-none font-extrabold text-[#12203D] sm:text-[11px]">Welcome!</p>
        <div className="mt-[4%] flex w-full flex-col gap-[6%]">
          <div className="w-full rounded-full bg-[#3B6EDC] py-[6%]" />
          <div className="w-full rounded-full border border-[#3B6EDC] py-[6%]" />
        </div>
      </div>
    </div>
  );
}

export function TemplateThumbnail({ template }: { template: Template }) {
  const isMobile = template.device === "mobile";

  if (template.slug === "healthvisor-app") return <HealthVisorCover />;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        isMobile ? "bg-[#0a0a0f]" : "bg-white",
      )}
    >
      <Image
        src={REAL_SCREENSHOTS[template.slug]}
        alt={`${template.title} preview`}
        fill
        loading="eager"
        className={isMobile ? "object-contain p-1.5" : "object-cover object-top"}
        sizes="(min-width: 640px) 25vw, 50vw"
      />
    </div>
  );
}
