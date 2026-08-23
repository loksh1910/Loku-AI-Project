# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Loku AI — see [PRD.md](PRD.md) for the full product spec, [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the phased roadmap, and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the extracted Figma design tokens. What's built so far is **Phase-0-equivalent but scoped narrower**: a pixel-matched, frontend-only replica of the Figma "Home & Dashboard" section (Landing → Sign In/Up → Dashboard → Explore Templates → Filter overlay), with **no real backend** — auth, AI generation, and template filtering are all mocked/client-side. Do not assume any API routes, database, or server logic exist; they don't yet.

## Commands

```bash
npm run dev      # start dev server (Turbopack, http://localhost:3000)
npm run build    # production build — also runs the TypeScript check
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

There is no test suite yet. Always run `npm run build` (not just `dev`) before considering a change done — it catches TypeScript errors that `dev` doesn't surface until you touch the page.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui. shadcn here is configured on **Base UI** (`@base-ui/react`), not Radix — component primitives (`Dialog`, `Tooltip`, `DropdownMenu`, etc. in `src/components/ui/`) use Base UI's API, which differs from Radix in two ways that matter:
- No `asChild` prop. `TooltipTrigger`/`DialogTrigger`/`DropdownMenuTrigger` render their own focusable element — put content directly as children, don't wrap in a nested `<button>`.
- State/animation hooks use boolean-presence attributes (`data-open`, `data-closed`), not Radix's `data-state="open"`.

Auth/user state is a client-only mock (`src/components/providers/app-state-provider.tsx`) backed by `localStorage`, wrapping the whole app in `layout.tsx`. There is no Supabase/database wiring despite earlier planning docs mentioning it — that's future-phase work, not present in the code.

## Architecture

- `src/app/page.tsx` — Landing (`/`)
- `src/app/dashboard/page.tsx` — Dashboard (`/dashboard`, redirects to `/` if not "signed in")
- `src/app/templates/page.tsx` — Explore Templates (`/templates`)
- `src/components/templates/` — the template card/detail-overlay/search-row/filter-overlay system, shared across all three pages above. Changes here propagate everywhere; there is no per-page copy.
- `src/components/auth/auth-dialog.tsx` — Sign In/Sign Up overlay, opened via `useAppState().openAuth()` from anywhere.
- `src/lib/templates-data.ts` — the 6 seed templates (3 web, 3 mobile) with real Figma-exported preview images. `src/lib/filters-data.ts` — the 6 filter categories. `src/lib/filter-match.ts` — approximate text-based matching between selected filters and a template's `tags` array (no real category/style/complexity metadata exists per template yet — this is intentionally loose).
- `src/components/left-rail.tsx` — Dashboard-only left nav, with its own collapsed/expanded state (click the logo to expand). This is **not** the same icon set as a future in-project/canvas rail (Dashboard/AI-chat/Screens/Split) described in `PRD.md` — that's a different, not-yet-built context.
- Real image assets pulled from Figma live in `public/images/` (logos, feature illustrations, template screenshots). Everything else visual (Style filter cards, the sketch-mode-style mockup glow, complexity dots) is hand-built CSS/SVG approximation — the Figma MCP tools available here only export whole-node screenshots and raster fills, not arbitrary per-layer vector assets, so some things aren't literal exports.

## Design tokens

All Loku brand tokens (dark theme verified against Figma, light theme is an unverified derivation) live in `src/app/globals.css` as CSS custom properties, consumed via Tailwind's `@theme inline`. Don't hardcode hex colors in components — use `bg-primary`, `text-muted-foreground`, etc., or the documented brand hex values in `DESIGN_SYSTEM.md` if a one-off is genuinely needed (e.g. gradient stops like `from-[#6C5CE7] to-[#8E51FF]`, which recur across buttons/CTAs and should stay consistent if you add new ones).

Page-level horizontal margin is a fixed `px-[60px]` with `max-w-[1320px]` containers (not Tailwind's default `max-w-6xl`/`max-w-5xl`) — this matches the Figma frame's actual 1440px-wide / 60px-margin convention. Keep new pages consistent with this rather than reaching for Tailwind's default max-w scale.

## Known gotchas (already hit once — don't rediscover these)

1. **shadcn's base `DialogContent` has `sm:max-w-sm` baked in.** Overriding width with an unprefixed `max-w-[…]` loses to it at `sm:` breakpoints and up due to Tailwind's cascade — you must match the prefix, e.g. `sm:max-w-[880px]`, or the dialog silently renders at 384px wide no matter what you pass. This caused a real, hard-to-spot bug (a two-column dialog rendering squeezed into 384px).
2. **Don't rely on Base UI Dialog's own animate-out-then-unmount.** In this app it gets stuck: the element ends up with `data-closed`/`data-ending-style` attributes set (logically closed) but stays fully visible and mounted indefinitely. Every dialog in this codebase (`AuthDialog`, `TemplateDetailDialog`, `FilterDialog`) works around it by hard-unmounting from the *parent's* conditional instead of trusting the animation lifecycle (e.g. `if (!template) return null`, `if (!open) return null`). Follow that pattern for any new dialog.
3. **`next/image` with `loading="lazy"` (the default) silently never loads** in this dev environment — a framework-level console error (`Failed to construct 'Image'`, traced into Next's bundled React DOM, not this app's code) breaks the IntersectionObserver-driven lazy path specifically. Every `<Image>` in this codebase is explicitly `loading="eager"` (or `priority` for the one above-the-fold logo) to route around it. Keep doing this for new images — the console error itself is harmless noise once eager-loaded.
4. **Reading `localStorage` on mount races with a page's own redirect-guard effect.** Child components' effects fire before parent provider effects on mount, so a page checking `isSignedIn` in its own `useEffect` can redirect before `AppStateProvider` has read `localStorage`. Use the provider's `hydrated` flag and gate redirects on it (`if (hydrated && !isSignedIn) router.replace("/")`) — see `dashboard/page.tsx`.
5. **`react-hooks/set-state-in-effect` (a stricter-than-usual ESLint rule here) flags the standard "sync prop into local draft state on mount / on external trigger" pattern** as an error. Where that pattern is genuinely correct (reading `localStorage` once, resetting a dialog's draft state when it opens), an inline `eslint-disable-next-line` with a comment explaining why is the established approach in this codebase — not a rewrite to avoid the effect.

## Figma MCP asset workflow

When pulling more real assets from Figma (vs. hand-building an approximation): `download_assets` (fileKey + nodeId) returns an `export` (whole-node PNG), `rawImages` (raster fills found in the subtree, capped at 20), and `svgAssets` (vector layers, capped at 20). Raw image results come back as ambiguous numbered URLs with no per-item labels — download them all to a scratch folder and open each to identify which is which before copying the right ones into `public/images/` with a descriptive name. There's no shortcut around eyeballing them.
