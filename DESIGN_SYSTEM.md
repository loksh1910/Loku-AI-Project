# Loku AI — Design System & Brand Guidelines

Extracted from the live Figma file via the Figma MCP connection on 2026-08-23. Sources: `get_variable_defs` (raw token dump, ~500 values), `get_metadata` (structure), and direct screenshots of the Dashboard, empty AI Mode canvas, populated Present Mode, the Manual Edit toolbar panels, and the Components library section.

**Scope honesty**: the file's full page metadata alone is 14M+ characters across ~150+ frames. This document is built from a representative, deliberately chosen sample (Dashboard, AI Mode empty/populated states, Present Mode, Manual Edit panels, Components section) — not a frame-by-frame read of the entire file. It's enough to extract the design system with confidence and validate the core concept; flows not directly screenshotted (Sketch Flow canvas itself, Prototype "show all flows" wires, Code Mode's two-pane layout, User Flow/Sitemap pipeline tabs specifically) should be spot-checked before implementation if precision matters there.

## 1. Brand Identity

- Logo mark: a stylized "L" (violet/purple), top-left of every screen.
- **Two separate design systems coexist by design**: (1) Loku's own app chrome — dark theme, violet/purple accent, fixed — and (2) the *generated content* inside a user's project, which can be any theme the user asks for (confirmed: a generated "HealthVisor" healthcare app rendered in a clean light theme with blue branding, inside Loku's dark chrome). Don't conflate the two when building the design system — the tokens below describe **Loku's own product UI**, not a constraint on what AI can generate for users.

## 2. Color System (Loku app chrome)

### Core brand palette
| Role | Name (source) | Hex |
|---|---|---|
| Primary / brand accent | Royal Blue | `#6C5CE7` |
| Primary variant | Cornflower Blue | `#6C4CF5` |
| Secondary accent | Heliotrope | `#8E51FF` |
| Secondary accent (alt) | Electric Violet | `#7C3AED` |
| Success | Caribbean Green | `#00D68F` |
| Success (alt) | Mountain Meadow | `#10B981` |
| Warning | Energy Yellow | `#F5D547` |
| Danger | Carnation | `#F43F5E` |
| Info | (standard blue) | `#3B82F6` |

The primary purple (`#6C5CE7` family) is used consistently for: active/selected states (selected pipeline tab, selected screen in the Screens list, selected variation card border), primary buttons (Export, chat send button), the "Present" mode pill, and the "L" logo mark.

### Neutrals / dark surfaces
The chrome is near-black, not pure black in most surfaces:
- Base background: `#000000`–`#0A0A0F` range
- Card/panel surfaces: `#0B0D1B`–`#161233` range (e.g. `#0E0B20`, `#121422`, `#13112A`, `#1E2235`)
- These form a dark navy-black scale rather than a flat single dark grey — panels sit slightly lighter than the base canvas.

### Extended ramps (for generated-content theming / color pickers)
The file defines full ~5–10 step ramps for red, orange, yellow, spring-green, cyan, azure/blue, violet, and rose/magenta (each with a light/mid/dark step and several opacity variants). These are almost certainly the palette exposed in the Fill panel's color picker/swatch grid (confirmed visually — a full preset color grid appears at the bottom of the Fill panel) for **user-generated content**, not chrome color choices.

### Opacity / overlay scale
White and black overlays at fixed steps: 0%, 3–10% (fine increments for hover/subtle states), 18–25%, 38%, 45–55%, 60–70%, 80%, 90%. Used for scrims, disabled states, hover states, and dividers over the dark background.

## 3. Typography

**Caveat**: the raw variable dump resolved font family names to `Segoe UI Symbol` — this is a Windows fallback substitution because the true fonts aren't installed/embedded on this machine, not the real declared typeface. The style *aliases* strongly suggest the real fonts are:
- **Inter** — primary UI font (aliases: `Inter/Bold`, `Inter/Medium`, `Inter/Regular`, `Inter/Italic`)
- **Consolas** — monospace, almost certainly for Code Mode (`Consolas/Bold` alias present)

Confirm the exact font family directly in Figma (Text properties panel) before locking this into a build — don't trust the fallback value.

**Weights**: 400 (Regular), 500 (Medium), 700 (Bold).

**Size scale observed** (px): 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 24, 26, 34, 36, 38, 40, 42, 44, 48, 50, 56, 60.5, 64, 68, 76. Not every value is a deliberate scale step — some are one-off computed sizes from specific headlines — but the clustering suggests a practical scale of roughly **12/13/14/16/18/20/24/32/36/40/48/56/64+** for body → display sizes.

**Line height & tracking**: large display sizes (56px+) use tight or negative letter-spacing (down to `-3.8`) with line-height near 1.0–1.05× the font size — typical large-headline compression. Body-size text (13–16px) uses looser, positive tracking and line-height around 1.4–1.5× font size for readability.

## 4. Spacing System

A clean t-shirt-size scale is defined as named tokens (the rest of the "item spacing" values in the raw dump are one-off computed gaps between specific elements, not part of the system):

| Token | Value |
|---|---|
| `xxxs` | 2px |
| `xxs` | 4px |
| `xs` | 8px |
| `s` | 16px |
| `s+` | 24px |
| `m` | 32px |
| `l` | 48px |
| `xl` | 64px |

## 5. Corner Radius Scale

Named/systematic values: **4, 8, 10, 12, 13, 14, 16, 20, 22, 24, 26, 28, 36, 40, 100, 125, 150, 200**, plus a "full/pill" sentinel (`999` / a very large number used for fully-rounded elements like avatars, pills, and toggle switches).

Visually confirmed usage: pill-shaped fully-rounded buttons and chips (AI prompt bar, suggestion chips, the App/Web toggle, the Present/Canvas switch, the send button), medium radius (~12–16px) on cards and panels, smaller radius (~8–10px) on buttons and input fields.

## 6. Stroke / Border Widths

Observed weights: 1, 1.25, 1.5, 1.6, 1.67, 1.7, 1.8, 1.83, 2, 2.2, 2.67, 3. In practice this is mostly a two-step system — **1px** hairline borders (cards, panels, dividers) and **~2px** emphasis borders (selected/active states, e.g. the purple ring around a selected variation card or active tool icon) — the other values are likely incidental/computed rather than deliberate tokens.

## 7. Component Patterns (visually confirmed)

- **Floating control panel pattern**: clicking a toolbar icon opens a small floating panel anchored near that icon, dark surface, rounded corners, with grouped controls inside (labeled sections, icon-button rows, numeric fields). Used identically across Position/Layout/Appearance/Fill/Typography/Stroke/Effects in Manual Edit Mode, **and reused in Sketch Mode** for the pencil/line tool's "Style" panel (Position/Weight/End points/Color/Corner Radius) — this floating-panel pattern is a system-wide primitive, not specific to one mode.
- **Low-fidelity wireframe placeholder language** (Sketch Mode, confirmed via screenshot): dashed/dotted horizontal bars = text placeholders; rounded-rectangle outline + dashed line inside = button; rounded-rectangle outline + short line = input field; plain circles in a row = icon/avatar/dot placeholders; an envelope glyph = generic icon/image placeholder. Consistent, deliberate system rather than arbitrary primitive shapes.
- **Contextual tool hints**: small dismissible pill tooltips appear inline on the canvas near the top when a tool has a non-obvious modifier (e.g. "Hold Shift to draw a straight line" while the pencil tool is active), with an × to dismiss.
- **AI edit ⇄ Manual edit toggle pattern**: the same overlay/panel switches between a structured form (labeled fields, dropdowns) and a free-text AI box (prompt input + suggestion chips), via a button at the bottom ("Back to AI edit" / "Edit Manually"). Confirmed on the Prototype Mode Interaction overlay (`Component 30`); likely a system-wide pattern for anywhere both AI and manual editing apply to the same target.
- **Live progress checklist**: the AI Assistant panel shows a step checklist under its response (e.g. Understanding requirements → User flow and structure → Wireframing key screens → Applying design system → UI polishing), each step rendered as a filled/solid check-circle when done vs. an outline/lighter circle when pending — a reusable "AI is working" progress indicator, not just a static plan list.
- **Reusable Screens panel**: the exact same panel (grouped scrollable list, search, per-row "…"/eye icons) appears both as an on-demand floating overlay (AI Mode, via the left-rail Screens icon) and inline-by-default (Present Mode) — one component, two placements.
- **Resizable split panels**: a visible grip-dot divider (seen between Code Mode's file tree and code editor) indicates draggable-resizable panel boundaries are part of the system, not just fixed layouts.
- **Shared "Flow" summary panel**: User Flow Mode and Sitemap Mode reuse the identical top-left panel (Start/End legend + Total Steps/Decisions/Connections counts) — one component serving two different graph visualizations of the same underlying structure.
- **Segmented pill controls**: two-option toggles rendered as a rounded pill with one side highlighted in the primary purple (e.g. App/Web toggle on the dashboard, the Canvas/Present switch in-project).
- **Card pattern**: project/template cards use a dark surface, rounded corners (~12px), a preview thumbnail area (which can be any color/theme — it's showing generated content), and a metadata footer row (owner avatar, title, "Edited X ago").
- **Icon-only vertical toolbar**: consistent 5-icon pattern in AI Mode (hand, pointer, group-select, quick-edit/pencil, add-files/+), positioned center-right, icons stacked in a narrow rounded-rect capsule.
- **Suggestion chips**: pill-shaped, outlined (not filled), placed below the AI chat input, offering contextual quick prompts.

## 8. UI Chrome — Confirmed Layout Reference

Differences/refinements found versus the original PRD description, from direct screenshots:

- **Top bar (Canvas Mode)**: left-to-right — logo + project name (far left) → undo/redo icons → pipeline tab bar (center, icon+label on the active tab, icon-only on the rest) → right side: Canvas/Present segmented switch (icon-based, not literal spelled-out words alone) → Play icon (▶, likely a quick Present-mode preview trigger, separate from the switch) → theme toggle → share → Export button (filled purple) → profile avatar.
- **Left rail**: logo, then a stack of icons (dashboard/screens/share/duplicate-style icons — exact icon-to-function mapping needs a closer pass), settings gear pinned to the bottom.
- **Bottom-center AI chat**: a collapse chevron sits just above the chat box. The placeholder text is **context-sensitive** — "Describe your app to start designing" in empty AI Mode vs. "Select a screen or specific element to refine..." in Present Mode. Row controls: attach (+), palette/style icon, device-type toggle (phone/desktop icons), Model dropdown, mic, send (filled purple circle).
- **Bottom-right**: zoom percentage indicator and a help (?) icon — not previously documented.
- **Present Mode specifics**: the Screens panel renders **inline/expanded by default** (not just as an on-demand floating overlay like in AI Mode) — a searchable, grouped list of every screen with visibility/eye icons per row. The right side shows a **variation comparison rail**: a "Compare" button plus stacked variation cards, each labeled with both a number and a **descriptive style name** (e.g. "Variation 1 — Bold," "— Playful," "— Minimal") rather than plain "Variation 1/2/3" — the style name likely comes straight from the generation questionnaire's design-style answer.
- **Dashboard entry cards — exact labels confirmed**: "Start from Template," "Sketch to UI," "Sitemap/user flow to UI," "Start with your design," "Start from Scratch." (Minor label differences from the PRD's phrasing — PRD should be updated to match these exact strings.)

## 9. Open / Unverified

- Sketch Mode's left rail has fewer icons (2) than Canvas Mode's (4) — unexplained difference, not yet confirmed why.
- Code Mode's "API" tab content is unspecified (PRD §12).
- Sitemap's red node color-coding rule isn't confirmed (PRD §12).
- The full set of dropdown *options* inside the Prototype Interaction overlay (all Triggers/Animations/Easing curves, not just the one sampled combination) isn't enumerated yet.
- ~~Sketch Mode's own canvas~~ — **confirmed 2026-08-23**: freeform draw + snap-to-library tools, frame-adjacent "+" handles, contextual tool hints, and the reused floating-panel pattern for stroke styling. See PRD §7.
- ~~Prototype Mode's "show all flows" view~~ — **confirmed 2026-08-23**: curved purple/blue connector wires arcing between screens, a "Show all flow" toggle, a reduced 2-icon toolbar, and an AI edit panel with an explicit "Apply on: All Actions / Selected Actions (N)" scope control. See PRD §8.2.
- ~~Single-wire click detail overlay~~ — **confirmed 2026-08-23**: the "Interaction" overlay (Figma component `Component 30`), toggling between a structured Manual edit form (Trigger/Action/Animation/Duration/Easing dropdowns) and a free-text AI edit box with suggestion chips. See PRD §8.2.
- ~~Left-rail icon-to-function mapping~~ — **confirmed 2026-08-23**: Dashboard, AI chat screen, Screens, Split (Figma `Component 18`). See PRD §5.
- ~~Code Mode's two-pane layout~~ — **confirmed 2026-08-23**: screen preview + UI Code/API/Assets tabs, framework selector, file tree, resizable divider. See PRD §8.7.
- ~~User Flow / Sitemap pipeline-tab canvases~~ — **confirmed 2026-08-23**: node/connector diagrams with a shared "Flow" summary panel (Start/End legend, Total Steps/Decisions/Connections counts). See PRD §8.4–8.5.
