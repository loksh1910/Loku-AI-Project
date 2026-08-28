"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    // Every caller places this in a top header bar — the tooltip opens
    // downward so it isn't clipped above the viewport.
    <Tip label="Toggle theme" side="bottom">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="hidden h-[18px] w-[18px] dark:block" />
        <Moon className="block h-[18px] w-[18px] dark:hidden" />
      </Button>
    </Tip>
  );
}
