"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Plus } from "lucide-react";
import { SketchLeftRail } from "@/components/sketch/sketch-left-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppState } from "@/components/providers/app-state-provider";

export default function SketchEntryPage() {
  const { isSignedIn, hydrated } = useAppState();
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);

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

        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-16">
          <div className="relative h-56 w-72 overflow-hidden rounded-2xl border border-border/60 bg-[#0a0a0f]">
            <Image
              src="/images/feature-sketch-to-ui.png"
              alt="A sketch transforming into a generated UI"
              fill
              loading="eager"
              className="object-cover"
              sizes="288px"
            />
          </div>

          <div className="flex w-64 flex-col items-center gap-2.5">
            <button
              onClick={() => router.push("/sketch/canvas")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Sketch / Wireframe
            </button>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                router.push("/sketch/canvas");
              }}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-medium ${
                dragOver
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/50 text-primary hover:bg-primary/10"
              }`}
            >
              <Upload className="h-4 w-4" />
              Import Sketch
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={() => router.push("/sketch/canvas")}
              />
            </label>
          </div>
        </main>
      </div>
    </div>
  );
}
