import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureBlock({
  title,
  description,
  ctaLabel,
  reverse,
  illustration,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  reverse?: boolean;
  illustration: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-8 sm:grid-cols-2",
        reverse && "sm:[&>*:first-child]:order-2",
      )}
    >
      <div>
        <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/25">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-secondary/40">
        {illustration}
      </div>
    </div>
  );
}
