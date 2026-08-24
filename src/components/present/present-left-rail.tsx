"use client";

import { Columns2, LayoutGrid, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { ChatAiIcon } from "@/components/present/icons";
import { cn } from "@/lib/utils";

export type PresentPanel = "screens" | "aichat" | "split" | null;

export function PresentLeftRail({
  panel,
  onPanelChange,
}: {
  panel: PresentPanel;
  onPanelChange: (panel: PresentPanel) => void;
}) {
  const router = useRouter();

  function toggle(next: Exclude<PresentPanel, null>) {
    onPanelChange(panel === next ? null : next);
  }

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
        onClick={() => toggle("aichat")}
        className={cn(
          "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
          panel === "aichat" && "bg-primary/15 text-primary",
        )}
        aria-label="AI Assistant"
      >
        <ChatAiIcon className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={() => toggle("screens")}
        className={cn(
          "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
          panel === "screens" && "bg-primary/15 text-primary",
        )}
        aria-label="Screens"
      >
        <Layers className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={() => toggle("split")}
        className={cn(
          "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
          panel === "split" && "bg-primary/15 text-primary",
        )}
        aria-label="Split view"
      >
        <Columns2 className="h-[18px] w-[18px]" />
      </button>
    </aside>
  );
}
