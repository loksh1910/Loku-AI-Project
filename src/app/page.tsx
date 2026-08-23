"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { AiPromptBar } from "@/components/ai-prompt-bar";
import { FeatureBlock } from "@/components/landing/feature-block";
import {
  SketchToUiIllustration,
  FlowsIllustration,
  VariationsIllustration,
  AiManualIllustration,
} from "@/components/landing/feature-illustrations";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateDetailDialog } from "@/components/templates/template-detail-dialog";
import { TemplateSearchRow } from "@/components/templates/template-search-row";
import { templates, type Template, type TemplateDevice } from "@/lib/templates-data";
import { useAppState } from "@/components/providers/app-state-provider";

const FEATURE_BLOCKS = [
  {
    title: "Turn rough ideas into real interfaces",
    description:
      "Upload a sketch or draw your concept — Loku instantly transforms it into structured, editable UI.",
    ctaLabel: "From sketch to interface",
    illustration: <SketchToUiIllustration />,
  },
  {
    title: "Design experiences, not just screens",
    description: "Because great design starts before the first screen.",
    ctaLabel: "See how designs connect and flow",
    illustration: <FlowsIllustration />,
    reverse: true,
  },
  {
    title: "Explore more. Decide faster.",
    description:
      "Generate multiple design variations and compare them side by side to find what works best.",
    ctaLabel: "See everything at once",
    illustration: <VariationsIllustration />,
  },
  {
    title: "AI when you want it. Control when you need it.",
    description:
      "Edit designs manually or refine them using AI — in both design mode and review mode.",
    ctaLabel: "AI editing or manual control",
    illustration: <AiManualIllustration />,
    reverse: true,
  },
];

const START_FROM = [
  { label: "Sketch", to: "UI" },
  { label: "Wireframe", to: "UI" },
  { label: "Sitemap", to: "UI" },
  { label: "UI", to: "UX Flow" },
];

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState<TemplateDevice>("web");
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const { isSignedIn, openAuth } = useAppState();
  const router = useRouter();

  const filtered = useMemo(
    () =>
      templates
        .filter(
          (t) =>
            t.device === device &&
            (t.title.toLowerCase().includes(query.toLowerCase()) ||
              t.subtitle.toLowerCase().includes(query.toLowerCase())),
        )
        .slice(0, 4),
    [device, query],
  );

  function handleStart() {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      openAuth("signin");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Logo markClassName="h-7 w-7" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => openAuth("signin")}>
            Sign In
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
            onClick={handleStart}
          >
            Start designing
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        {/* Hero */}
        <section className="pt-10 text-center sm:pt-14">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            From idea to interface –{" "}
            <span className="bg-gradient-to-r from-[#8E51FF] to-[#3B82F6] bg-clip-text text-transparent">
              Instantly
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Plan UI, generate wireframes, build design systems, and create full
            UI — all in one place with AI.
          </p>

          <AiPromptBar
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleStart}
            className="mx-auto mt-6 max-w-xl"
          />
        </section>

        {/* Explore Templates */}
        <section className="mt-14 sm:mt-16">
          <h2 className="mb-4 text-xl font-semibold">
            Explore <span className="text-primary">Templates</span>
          </h2>

          <TemplateSearchRow
            query={query}
            onQueryChange={setQuery}
            device={device}
            onDeviceChange={setDevice}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filtered.map((t) => (
              <TemplateCard key={t.slug} template={t} onOpenDetail={setDetailTemplate} />
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Link
              href="/templates"
              className="text-sm font-medium text-primary hover:underline"
            >
              Explore more templates →
            </Link>
          </div>
        </section>

        {/* Everything. One flow. */}
        <section className="mt-20 sm:mt-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Everything. <span className="text-primary">One flow.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Turn ideas into complete designs — instantly.
            </p>
          </div>
          <div className="space-y-14">
            {FEATURE_BLOCKS.map((f) => (
              <FeatureBlock key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* Start from anywhere */}
        <section className="mt-20 grid grid-cols-1 items-center gap-8 rounded-3xl border border-border/60 bg-card px-6 py-10 sm:mt-24 sm:grid-cols-2 sm:px-10">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Start from <span className="text-primary">anywhere</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              However your idea starts, Loku meets you there.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {START_FROM.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full border border-border/60 bg-secondary px-4 py-2 text-sm"
                >
                  {item.label} <span className="text-primary">→</span> {item.to}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/templates">
                <Button variant="outline" className="rounded-full">
                  Explore Templates
                </Button>
              </Link>
              <Button
                className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-8 text-white hover:opacity-90"
                onClick={handleStart}
              >
                Start designing
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#0a0a0f]">
            <Image
              src="/images/start-from-anywhere.png"
              alt="Sketch, wireframe, sitemap, and UX flow all connecting into one continuous design process"
              fill
              loading="eager"
              className="object-cover"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 text-sm text-muted-foreground">
          <Logo className="opacity-70" markClassName="h-6 w-6" />
          <span>© {new Date().getFullYear()} Loku AI</span>
        </div>
      </footer>

      <TemplateDetailDialog
        template={detailTemplate}
        onOpenChange={(open) => !open && setDetailTemplate(null)}
      />
    </div>
  );
}
