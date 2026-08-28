"use client";

import { cn } from "@/lib/utils";

const SIDE_CLASSES = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
  right: "left-full top-1/2 ml-1.5 -translate-y-1/2",
} as const;

// A lightweight, CSS-only hover tooltip — deliberately not the shadcn/Base UI
// Tooltip primitive, which would require restructuring every existing
// icon-only button (TooltipTrigger renders its own focusable element, so it
// can't just wrap one). This instead wraps an existing button completely
// unchanged, so it can be dropped onto every icon/button across the app with
// a purely additive edit. Uses a *named* group (group/tip) so it never
// collides with an unrelated `group` already on an ancestor or descendant
// (e.g. a toolbar's own hover-reveal affordances).
export function Tip({
  label,
  children,
  side = "top",
  className,
  style,
}: {
  label: string;
  children: React.ReactNode;
  side?: keyof typeof SIDE_CLASSES;
  className?: string;
  /** For call sites that need dynamic (JS-computed) positioning alongside the
   * positioning classes already in `className` — e.g. a button placed at a
   * frame-height-dependent offset on the sketch canvas. */
  style?: React.CSSProperties;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)} style={style}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 scale-95 rounded-md bg-popover px-2 py-1 text-[11px] whitespace-nowrap text-foreground opacity-0 shadow-lg ring-1 ring-border/60 transition-[opacity,transform] delay-150 duration-100 group-hover/tip:scale-100 group-hover/tip:opacity-100",
          SIDE_CLASSES[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
