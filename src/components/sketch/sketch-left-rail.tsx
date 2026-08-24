"use client";

import { LayoutGrid, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";

export function SketchLeftRail({
  onScreensClick,
  screensActive,
}: {
  onScreensClick?: () => void;
  screensActive?: boolean;
}) {
  const router = useRouter();

  return (
    <aside className="sticky top-0 flex h-screen w-14 shrink-0 flex-col items-center gap-4 border-r border-border/60 py-4">
      <LogoMark className="h-8 w-8" />
      <button
        onClick={() => router.push("/dashboard")}
        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Dashboard"
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={onScreensClick}
        className={`rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground ${
          screensActive ? "bg-primary/15 text-primary" : ""
        }`}
        aria-label="Screens"
      >
        <Copy className="h-[18px] w-[18px]" />
      </button>
    </aside>
  );
}
