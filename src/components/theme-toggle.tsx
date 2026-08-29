"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    // Every caller places this near the right edge of a top header bar (on
    // some pages it's the very last/rightmost control) — opening the tooltip
    // to the left keeps it inside the viewport instead of poking out past
    // the right edge and forcing a page-wide horizontal scrollbar.
    <Tip label="Toggle theme" side="left">
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
