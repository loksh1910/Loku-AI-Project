import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image
        // The original export has a huge transparent margin baked in (the "L"
        // glyph occupies well under half the canvas), which made the mark look
        // tiny at any container size — this is the same asset, tightly cropped
        // to the glyph's real bounding box (plus a small margin) via sharp.
        src="/images/logo-mark-tight.png"
        alt="Loku"
        fill
        className="object-contain"
        sizes="48px"
        priority
      />
    </div>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className={cn("h-8 w-8", markClassName)} />
      <span className="text-lg font-semibold tracking-tight">loku</span>
    </div>
  );
}
