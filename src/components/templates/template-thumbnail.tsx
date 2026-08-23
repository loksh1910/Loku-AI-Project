import Image from "next/image";
import type { Template } from "@/lib/templates-data";

/** Real screenshots downloaded from the Figma file via download_assets — one per template. */
const REAL_SCREENSHOTS: Record<Template["slug"], string> = {
  "enterprise-data-ai": "/images/template-enterprise-data.png",
  "hiring-platform": "/images/template-hiring-platform.png",
  "ecommerce-platform": "/images/template-ecommerce.png",
  "hybrid-shopping": "/images/template-hybrid-shopping.png",
  "vidnio-notes": "/images/template-vidnio.png",
  "health-management": "/images/template-health-management.png",
};

export function TemplateThumbnail({ template }: { template: Template }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <Image
        src={REAL_SCREENSHOTS[template.slug]}
        alt={`${template.title} preview`}
        fill
        loading="eager"
        className="object-cover object-top"
        sizes="(min-width: 640px) 25vw, 50vw"
      />
    </div>
  );
}
