"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { LeftRail } from "@/components/left-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateDetailDialog } from "@/components/templates/template-detail-dialog";
import { TemplateSearchRow } from "@/components/templates/template-search-row";
import { FilterDialog } from "@/components/templates/filter-dialog";
import { templates, type Template, type TemplateDevice } from "@/lib/templates-data";
import { templateMatchesFilters } from "@/lib/filter-match";
import { useAppState } from "@/components/providers/app-state-provider";

// Same shell/search/grid as /templates — just sourced from the user's own
// saved slugs instead of the full catalog, reached via the Dashboard rail's
// "Saved" item rather than being a public marketing-site page.
export default function SavedPage() {
  const { isSignedIn, hydrated, userName, savedTemplateSlugs } = useAppState();
  const router = useRouter();
  const [device, setDevice] = useState<TemplateDevice>("mobile");
  const [query, setQuery] = useState("");
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  useEffect(() => {
    if (hydrated && !isSignedIn) router.replace("/");
  }, [hydrated, isSignedIn, router]);

  if (!isSignedIn) return null;

  const saved = templates.filter((t) => savedTemplateSlugs.includes(t.slug));
  const filtered = saved.filter(
    (t) =>
      t.device === device &&
      (t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(query.toLowerCase())) &&
      templateMatchesFilters(t, appliedFilters),
  );

  return (
    <div className="flex flex-1">
      <LeftRail />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 px-[60px] py-4">
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {userName?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-[60px] pb-16">
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Saved <span className="text-primary">Templates</span>
            </h1>
          </div>

          <TemplateSearchRow
            query={query}
            onQueryChange={setQuery}
            device={device}
            onDeviceChange={setDevice}
            onFilterClick={() => setFilterOpen(true)}
            activeFilterCount={appliedFilters.length}
          />

          {saved.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-16 text-center text-muted-foreground">
              <Bookmark className="h-6 w-6 text-primary" />
              <p className="text-sm">
                No saved templates yet — save one from its detail page to find it here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No saved templates match your search or filters.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
              {filtered.map((t) => (
                <TemplateCard key={t.slug} template={t} onOpenDetail={setDetailTemplate} />
              ))}
            </div>
          )}
        </main>
      </div>

      <TemplateDetailDialog
        template={detailTemplate}
        onOpenChange={(open) => !open && setDetailTemplate(null)}
      />
      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        selected={appliedFilters}
        onApply={setAppliedFilters}
      />
    </div>
  );
}
