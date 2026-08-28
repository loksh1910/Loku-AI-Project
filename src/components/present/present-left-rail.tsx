"use client";

import { Columns2, LayoutGrid, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoMenu } from "@/components/logo-menu";
import { ChatAiIcon } from "@/components/present/icons";
import { Tip } from "@/components/ui/tip";
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
      <Tip label="AI Assistant" side="right">
        <button
          onClick={() => toggle("aichat")}
          className={cn(
            "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            panel === "aichat" && "bg-primary/15 text-primary",
          )}
          aria-label="AI Assistant"
        >
          <ChatAiIcon className="h-3.5 w-3.5" />
        </button>
      </Tip>
      <Tip label="Screens" side="right">
        <button
          onClick={() => toggle("screens")}
          className={cn(
            "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            panel === "screens" && "bg-primary/15 text-primary",
          )}
          aria-label="Screens"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      </Tip>
      <Tip label="Split view" side="right">
        <button
          onClick={() => toggle("split")}
          className={cn(
            "rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground",
            panel === "split" && "bg-primary/15 text-primary",
          )}
          aria-label="Split view"
        >
          <Columns2 className="h-3.5 w-3.5" />
        </button>
      </Tip>
    </aside>
  );
}
