import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-[#8E51FF] via-[#6C5CE7] to-[#3B82F6]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none">
        <path
          d="M7 4v13a3 3 0 0 0 3 3h7"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17.5" cy="6.5" r="1.4" fill="white" />
      </svg>
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
