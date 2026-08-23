"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateDetailDialog } from "@/components/templates/template-detail-dialog";
import { TemplateSearchRow } from "@/components/templates/template-search-row";
import { templates, type Template, type TemplateDevice } from "@/lib/templates-data";
import { useAppState } from "@/components/providers/app-state-provider";

export default function TemplatesPage() {
  const [device, setDevice] = useState<TemplateDevice>("mobile");
  const [tab, setTab] = useState<"latest" | "popular">("latest");
  const [query, setQuery] = useState("");
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const { isSignedIn, userName, openAuth } = useAppState();

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.device === device &&
          (t.title.toLowerCase().includes(query.toLowerCase()) ||
            t.subtitle.toLowerCase().includes(query.toLowerCase())),
      ),
    [device, query],
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-[60px] py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isSignedIn ? (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {userName?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="ghost" onClick={() => openAuth("signin")}>
              Sign In
            </Button>
          )}
          <Button
            className="rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] text-white hover:opacity-90"
            onClick={() => (isSignedIn ? undefined : openAuth("signin"))}
          >
            Start designing
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-[60px] pb-16">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={isSignedIn ? "/dashboard" : "/"}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-semibold">
            Explore <span className="text-primary">Templates</span>
          </h1>
        </div>

        <TemplateSearchRow
          query={query}
          onQueryChange={setQuery}
          device={device}
          onDeviceChange={setDevice}
        />

        <div className="mb-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="popular">Most popular</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No templates match your search yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {filtered.map((t) => (
              <TemplateCard key={t.slug} template={t} onOpenDetail={setDetailTemplate} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button variant="outline" className="rounded-full">
            Explore more templates →
          </Button>
        </div>
      </main>

      <TemplateDetailDialog
        template={detailTemplate}
        onOpenChange={(open) => !open && setDetailTemplate(null)}
      />
    </div>
  );
}
