"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Network, Waypoints } from "lucide-react";
import { SketchLeftRail } from "@/components/sketch/sketch-left-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppState } from "@/components/providers/app-state-provider";

const OPTIONS = [
  {
    id: "userflow" as const,
    icon: Waypoints,
    title: "User Flow",
    description: "Map how users move through your product",
    cta: "Start Mapping",
  },
  {
    id: "sitemap" as const,
    icon: Network,
    title: "Sitemap",
    description: "Structure your app or website pages",
    cta: "Start Structuring",
  },
];

// The Figma-matched entry point (node 1138:19587) for "Sitemap/user flow to
// UI" — picking either card drops straight into the same UserFlowView the
// Canvas pipeline's own User Flow/Sitemap tabs use, just as a blank starting
// canvas instead of a tab, with a Generate UI button once something's drawn.
export default function FlowEntryPage() {
  const { isSignedIn, hydrated } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isSignedIn) router.replace("/");
  }, [hydrated, isSignedIn, router]);

  if (!isSignedIn) return null;

  return (
    <div className="flex flex-1">
      <SketchLeftRail />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          <p className="text-sm font-medium text-muted-foreground">Project name</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center gap-4 px-6 pb-16">
          {OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className="flex w-56 flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card px-6 py-8 text-center"
            >
              <opt.icon className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-semibold">{opt.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <button
                onClick={() => router.push(`/sketch/canvas?entry=${opt.id}`)}
                className="mt-2 w-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2 text-xs font-medium text-white hover:opacity-90"
              >
                {opt.cta}
              </button>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
