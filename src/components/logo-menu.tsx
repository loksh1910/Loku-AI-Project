"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, Rocket } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Tip } from "@/components/ui/tip";
import { cn } from "@/lib/utils";

type SubmenuItem = { label: string; onClick: () => void };
type SubmenuKey = "file" | "open" | "recents" | "credits";

const RECENT_PROJECTS = [
  { label: "AI Company Landing Page" },
  { label: "AI Company Landing Page" },
  { label: "AI Company Landing Page" },
];

// The floating "Loku menu" every in-project rail (Sketch/Present left rails)
// opens from its logo — matches the Figma reference (node 1299-34402) for the
// top-level list; the per-item flyout submenus aren't in that frame, so
// they're hand-designed in the same dark, rounded-card language used by every
// other floating panel in this codebase. Only "Go to Dashboard" is a real
// action for this pass — everything else is a mocked toast, same as
// Settings/Recents/Upgrade elsewhere in the app. Settings and Help and
// Account are plain nav rows (no submenu) since they're meant to eventually
// route to their own pages rather than expand in place.
//
// Rendered through a portal to document.body (fixed-positioned at the
// logo's own on-screen coordinates) rather than as a normal absolutely-
// positioned descendant of the rail. The rail (<aside>) is itself a
// `position: sticky` element with its own z-index, which makes it establish
// its own stacking context — so a z-index on something nested *inside* it
// only ever wins against other things inside that same context, never
// against sibling content elsewhere on the page (like the canvas header's
// project-name text), no matter how high that nested z-index is set. A
// portal sidesteps the whole ancestor-stacking-context problem by escaping
// the rail's DOM subtree entirely.
export function LogoMenu() {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<SubmenuKey | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setSubmenu(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function toggleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right + 8 });
    }
    setOpen((v) => !v);
    setSubmenu(null);
  }

  function comingSoon(label: string) {
    return () => toast(`${label} is coming soon.`);
  }

  function closeAll() {
    setOpen(false);
    setSubmenu(null);
  }

  const SUBMENUS: Record<Exclude<SubmenuKey, "credits">, SubmenuItem[]> = {
    file: [
      { label: "New Project / File", onClick: comingSoon("Creating a new project") },
      { label: "Import from Figma / Markdown", onClick: comingSoon("Importing a file") },
      { label: "Rename Project", onClick: comingSoon("Renaming") },
      { label: "Duplicate Project", onClick: comingSoon("Duplicating") },
    ],
    open: [
      { label: "Open Recent", onClick: comingSoon("Open Recent") },
      { label: "Browse All Projects", onClick: comingSoon("Browsing projects") },
    ],
    recents: RECENT_PROJECTS.map((r) => ({ label: r.label, onClick: comingSoon(r.label) })),
  };

  const SUBMENU_ITEMS: { key: Exclude<SubmenuKey, "credits">; label: string }[] = [
    { key: "file", label: "File" },
    { key: "open", label: "Open" },
    { key: "recents", label: "Recent Projects" },
  ];

  function toggleSubmenu(key: SubmenuKey) {
    setSubmenu((prev) => (prev === key ? null : key));
  }

  function SubmenuRow({ item }: { item: { key: Exclude<SubmenuKey, "credits">; label: string } }) {
    return (
      <div className="relative">
        <button
          onClick={() => toggleSubmenu(item.key)}
          className={cn(
            "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60",
            submenu === item.key && "bg-secondary/60",
          )}
        >
          {item.label}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
        {submenu === item.key && (
          <div className="absolute top-0 left-full ml-2 w-52 rounded-xl border border-border/60 bg-popover p-1.5 shadow-2xl">
            {SUBMENUS[item.key].map((sub) => (
              <button
                key={sub.label}
                onClick={() => {
                  sub.onClick();
                  closeAll();
                }}
                className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-secondary"
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Tip label="Menu" side="right">
        <button ref={triggerRef} onClick={toggleOpen} aria-label="Menu">
          <LogoMark className="h-7 w-7" />
        </button>
      </Tip>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            // z-[9999]: portaled straight to <body>, so this only has to beat
            // other body-level layers (there aren't any at this level in this
            // app) — not tuned against the rail's own stacking context at all.
            // No overflow-hidden: the per-item flyout submenus are nested
            // inside this panel and intentionally extend past its right edge
            // (left-full) — clipping would hide every one of them, not just
            // round the corners this was meant for.
            className="z-[9999] w-56 rounded-2xl border border-border/60 bg-popover py-1.5 shadow-2xl"
          >
            <button
              onClick={() => {
                router.push("/dashboard");
                closeAll();
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
            >
              Go to Dashboard
            </button>
            <div className="border-t border-border/60" />
            {SUBMENU_ITEMS.map((item) => (
              <SubmenuRow key={item.key} item={item} />
            ))}
            <button
              onClick={() => {
                comingSoon("Settings")();
                closeAll();
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
            >
              Settings
            </button>
            <div className="border-t border-border/60" />
            <button
              onClick={() => {
                comingSoon("Help and Account")();
                closeAll();
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60"
            >
              Help and Account
            </button>
            <div className="relative">
              <button
                onClick={() => toggleSubmenu("credits")}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60",
                  submenu === "credits" && "bg-secondary/60",
                )}
              >
                AI Credits
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
              {submenu === "credits" && (
                <div className="absolute top-0 left-full ml-2 w-52 rounded-xl border border-border/60 bg-popover p-3 shadow-2xl">
                  <p className="text-xs font-semibold">128 AI credits left</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Credits refill monthly on the free plan.
                  </p>
                  <button
                    onClick={comingSoon("Upgrade")}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <Rocket className="h-3 w-3" />
                    Upgrade to Pro
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
