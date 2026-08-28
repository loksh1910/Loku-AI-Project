"use client";

import { LayoutGrid, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoMenu } from "@/components/logo-menu";
import { Tip } from "@/components/ui/tip";

export function SketchLeftRail({
  onScreensClick,
  screensActive,
}: {
  onScreensClick?: () => void;
  screensActive?: boolean;
}) {
  const router = useRouter();

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-14 shrink-0 flex-col items-center gap-4 border-r border-border/60 bg-background py-4">
      <LogoMenu />
      <Tip label="Dashboard" side="right">
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Dashboard"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
      </Tip>
      <Tip label="Screens" side="right">
        <button
          onClick={onScreensClick}
          className={`rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground ${
            screensActive ? "bg-primary/15 text-primary" : ""
          }`}
          aria-label="Screens"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </Tip>
    </aside>
  );
}
