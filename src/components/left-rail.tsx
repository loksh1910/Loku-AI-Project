"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderOpen,
  LayoutTemplate,
  Bookmark,
  PanelLeftClose,
  Settings,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tip } from "@/components/ui/tip";
import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  icon: typeof LayoutGrid;
  href?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "my-projects", label: "My Projects", icon: FolderOpen },
  { key: "templates", label: "Templates", icon: LayoutTemplate, href: "/templates" },
  { key: "saved", label: "Saved", icon: Bookmark, href: "/saved" },
];

const RECENTS = [
  { label: "AI Company Landing Page" },
  { label: "AI Company Landing Page" },
  { label: "AI Company Landing Page" },
];

export function LeftRail() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { userName } = useAppState();

  // A single persistent <aside> whose width itself transitions (≤200ms) —
  // rather than two conditionally-mounted return blocks (the old shape),
  // which snapped instantly since CSS can't animate between two unrelated
  // subtrees. Inner content still swaps at the same tick, but the box's own
  // width now visibly slides instead of popping.
  return (
    <aside
      className={cn(
        // No overflow-hidden here: the collapsed rail's own Tip tooltips
        // (side="right") render outside this box's width on purpose, and
        // clipping would hide them entirely, not just during the transition.
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-border/60 bg-background transition-[width] duration-200 ease-out",
        expanded ? "w-64 p-4" : "w-16 items-center gap-6 py-4",
      )}
    >
      {!expanded ? (
        <>
          <Tip label="Expand sidebar" side="right">
            <button onClick={() => setExpanded(true)} aria-label="Expand sidebar">
              <LogoMark className="h-7 w-7" />
            </button>
          </Tip>

          <nav className="flex flex-col items-center gap-2">
            {NAV_ITEMS.map(({ key, label, icon: Icon, href }) => {
              const active = href ? pathname === href : false;
              return (
                <Tip key={key} label={label} side="right">
                  <button
                    onClick={() =>
                      href ? router.push(href) : toast(`${label} is coming soon.`)
                    }
                    className={cn(
                      "rounded-lg p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground",
                      active && "bg-primary/15 text-primary",
                    )}
                    aria-label={label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                </Tip>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col items-center gap-3">
            <Tip label="Settings" side="right">
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={() => toast("Settings coming soon.")}
                aria-label="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </Tip>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                {userName?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <LogoMark className="h-7 w-7" />
            <Tip label="Collapse sidebar" side="bottom">
              <button
                onClick={() => setExpanded(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </Tip>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ key, label, icon: Icon, href }) => {
              const active = href ? pathname === href : false;
              return (
                <button
                  key={key}
                  onClick={() =>
                    href ? router.push(href) : toast(`${label} is coming soon.`)
                  }
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
                    active && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">Recents</span>
              <button
                className="flex items-center text-xs text-primary hover:underline"
                onClick={() => toast("Recents coming soon.")}
              >
                view all
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {RECENTS.map((r, i) => (
                <button
                  key={i}
                  onClick={() => toast("Coming soon.")}
                  className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <span className="h-6 w-6 shrink-0 rounded bg-gradient-to-br from-[#0f1b3d] to-[#1c2b5e]" />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-3 pt-4">
            <button
              onClick={() => toast("Upgrade coming soon.")}
              className="flex w-full items-center gap-3 rounded-xl bg-primary/15 p-3 text-left hover:bg-primary/20"
            >
              <Rocket className="h-6 w-6 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium text-primary">
                  Upgrade to Pro
                </span>
                <span className="block text-xs text-muted-foreground">
                  Work without limitations
                </span>
              </span>
            </button>

            <div className="flex items-center justify-between px-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                  {userName?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <Tip label="Settings">
                <button
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => toast("Settings coming soon.")}
                  aria-label="Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </Tip>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
