"use client";

import { LayoutGrid, MessagesSquare, Layers, Columns2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RailItem = {
  key: string;
  label: string;
  icon: typeof LayoutGrid;
  href?: string;
};

const RAIL_ITEMS: RailItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "ai-chat", label: "AI chat screen", icon: MessagesSquare },
  { key: "screens", label: "Screens", icon: Layers },
  { key: "split", label: "Split", icon: Columns2 },
];

export function LeftRail() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-6 border-r border-border/60 py-4">
      <LogoMark className="h-9 w-9" />

      <nav className="flex flex-col items-center gap-2">
        {RAIL_ITEMS.map(({ key, label, icon: Icon, href }) => {
          const active = href ? pathname === href : false;
          return (
            <Tooltip key={key}>
              <TooltipTrigger
                onClick={() =>
                  href ? router.push(href) : toast(`${label} is coming soon.`)
                }
                className={cn(
                  "rounded-lg p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground",
                  active && "bg-primary/15 text-primary",
                )}
                aria-label={label}
              >
                <Icon className="h-[18px] w-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
