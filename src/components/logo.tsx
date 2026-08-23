import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="/images/logo-mark.png"
        alt="Loku"
        fill
        className="object-contain"
        sizes="40px"
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
