"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Plus,
  LayoutTemplate,
  PencilRuler,
  Share2,
  UploadCloud,
  Sparkles,
  MapPin,
} from "lucide-react";
import { LeftRail } from "@/components/left-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import { AiPromptBar } from "@/components/ai-prompt-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateDetailDialog } from "@/components/templates/template-detail-dialog";
import { TemplateSearchRow } from "@/components/templates/template-search-row";
import { FilterDialog } from "@/components/templates/filter-dialog";
import { templates, type Template, type TemplateDevice } from "@/lib/templates-data";
import { templateMatchesFilters } from "@/lib/filter-match";
import { useAppState } from "@/components/providers/app-state-provider";
import { toast } from "sonner";

type EntryCard = {
  label: string;
  icon: typeof LayoutTemplate;
  href?: string;
};

const ENTRY_CARDS: EntryCard[] = [
  { label: "Start from Template", icon: LayoutTemplate, href: "/templates" },
  { label: "Sketch to UI", icon: PencilRuler, href: "/sketch" },
  { label: "Sitemap/user flow to UI", icon: Share2, href: "/flow" },
  { label: "Start with your design", icon: UploadCloud },
  { label: "Start from Scratch", icon: Plus },
];

const SUGGESTIONS = [
  "e-commerce app for selling shoes",
  "Build a muti language learning app",
  "marketplace for…",
];

export default function DashboardPage() {
  const { isSignedIn, hydrated, userName, recentProjects } = useAppState();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [detailTemplate, setDetailTemplate] = useState<Template | null>(null);
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateDevice, setTemplateDevice] = useState<TemplateDevice>("web");
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  useEffect(() => {
    if (hydrated && !isSignedIn) router.replace("/");
  }, [hydrated, isSignedIn, router]);

  if (!isSignedIn) return null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-1">
      <LeftRail />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 px-[60px] py-4">
          <button
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={() => toast("No new notifications.")}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Profile menu" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {userName?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>{userName}</DropdownMenuItem>
              <SignOutItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1320px] flex-1 px-[60px] pb-16">
          <section className="pt-6 text-center">
            <h1 className="text-3xl font-semibold">
              {greeting}, <span className="text-primary">{userName}!</span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              What do you want to design today?
            </p>

            <AiPromptBar
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => toast("AI generation is coming soon.")}
              className="mx-auto mt-6 max-w-2xl"
            />

            <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-border/60 p-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-5">
            {ENTRY_CARDS.map(({ label, icon: Icon, href }) => {
              const card = (
                <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-card px-2 text-center text-xs hover:border-primary/50">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </div>
              );
              return href ? (
                <Link key={label} href={href}>
                  {card}
                </Link>
              ) : (
                <button
                  key={label}
                  className="text-left"
                  onClick={() => toast(`${label} is coming soon.`)}
                >
                  {card}
                </button>
              );
            })}
          </section>

          <section className="mt-14">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Continue working</h2>
              <button className="text-sm text-primary hover:underline">
                Browse all →
              </button>
            </div>
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-14 text-center text-muted-foreground">
                <Sparkles className="h-6 w-6 text-primary" />
                <p className="text-sm">
                  No projects yet — start from a template or a prompt above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href="/sketch/canvas"
                    className="overflow-hidden rounded-xl border border-border/60 bg-card hover:border-primary/50"
                  >
                    <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-[#1c2b5e] to-[#0f1b3d]">
                      <PencilRuler className="h-6 w-6 text-white/60" />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Edited {new Date(p.editedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-14">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Templates</h2>
              <Link href="/templates" className="text-sm text-primary hover:underline">
                Explore more templates →
              </Link>
            </div>
            <TemplateSearchRow
              query={templateQuery}
              onQueryChange={setTemplateQuery}
              device={templateDevice}
              onDeviceChange={setTemplateDevice}
              onFilterClick={() => setFilterOpen(true)}
              activeFilterCount={appliedFilters.length}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {templates
                .filter(
                  (t) =>
                    t.device === templateDevice &&
                    (t.title.toLowerCase().includes(templateQuery.toLowerCase()) ||
                      t.subtitle.toLowerCase().includes(templateQuery.toLowerCase())) &&
                    templateMatchesFilters(t, appliedFilters),
                )
                .slice(0, 4)
                .map((t) => (
                  <TemplateCard key={t.slug} template={t} onOpenDetail={setDetailTemplate} />
                ))}
            </div>
          </section>
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

function SignOutItem() {
  const { signOut } = useAppState();
  const router = useRouter();
  return (
    <DropdownMenuItem
      onClick={() => {
        signOut();
        router.push("/");
      }}
    >
      Sign out
    </DropdownMenuItem>
  );
}
