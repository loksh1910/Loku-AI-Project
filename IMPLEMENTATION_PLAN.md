# Loku AI — Implementation Plan

Companion to [PRD.md](PRD.md). This plan sequences building the **actual functioning product** (frontend + backend), not just replicating the Figma screens visually. Section references below point back to the PRD.

## 0. Architecture Decisions That Gate Everything Else

These need to be settled before Phase 0 starts, because later phases assume them.

**0.1 — The Design Document is the single source of truth.**
Every part of the product (AI generation, manual editing, wireframe/flow/sitemap derivation, code export, Figma import) must read and write the *same* structured schema — a JSON scene graph (frames, groups, text, image, component instance nodes, each with position/size/style/constraints/auto-layout data). Nothing should operate on raw pixels or ad-hoc per-feature formats. Get this schema right early; it's the hardest thing to change later.

**0.2 — Manual Edit Mode is a property-editing surface, not a vector-authoring engine (scope corrected 2026-08-23).**
PRD §8.6 does *not* require replicating Figma's drawing tools (no pen tool, no freeform path editing). It requires: a canvas that can render and select existing nodes (placed there via AI generation, sketch conversion, or Figma import), plus a toolbar → floating-panel interaction where each icon (Position, Layout, Appearance, Fill, Typography, Stroke, Effects) opens a control panel that edits that node's properties. This is a much smaller build than "clone Figma's editor" — it's a selection/inspector UI on top of the Phase 1 rendering layer, not a rendering *engine* project in its own right. A general-purpose canvas rendering library (e.g. Konva, Fabric.js, or a lightweight custom renderer over the Phase 1 schema) is sufficient; there's no need to adopt or fork a full design-tool codebase like Penpot for this.

**0.3 — Use a CRDT-backed document store even though v1 is single-user (PRD §11.8).**
A CRDT (e.g. Yjs) gives you undo/redo, versioning, and offline-safe editing for free, and keeps real-time collaboration cheap to add later instead of requiring a rewrite.

**0.4 — Service split:**
- **Web app** (frontend, canvas rendering + all pipeline-tab UIs)
- **Core API** (auth, projects, documents, sharing, export orchestration)
- **AI service** (prompt/sketch → Design Document generation, chat-driven edits, wireframe/flow/sitemap derivation — all via Claude API with structured/tool-call output so results are always valid documents, never raw pixels)
- **Codegen service** (Design Document → frontend code)
- **Figma import service** (Figma API → Design Document translation)

## Phase 0 — Foundation
**Goal:** empty but real, deployable skeleton.
- Repo/monorepo structure (web app, core API, AI service, shared schema package)
- Auth (sign in/up)
- Dashboard shell + routing (empty states for all 5 entry points, PRD §6)
- Database schema: users, projects, documents, variations, assets
- Asset storage (images, thumbnails, exports)
- CI/CD + staging environment

**Exit criteria:** user can sign in and land on an empty dashboard.

## Phase 1 — Design Document Schema & Read-Only Canvas
**Goal:** define the schema from §0.1 and render it.
- Finalize the Design Document schema (versioned, since every later phase depends on it)
- Integrate the chosen canvas engine (§0.2); render a hand-authored sample document
- Multi-screen canvas layout (Figma-style side-by-side frames), pan/zoom, selection
- Screens panel / layers list (PRD §5)

**Exit criteria:** a sample document renders correctly and elements are selectable — no editing or AI yet.

## Phase 2 — Manual Edit Mode
**Goal:** PRD §8.6 — a property-editing surface (§0.2), not a vector-authoring engine. Meaningfully smaller than originally scoped; no pen tool, no freeform path drawing.
- Selection, multi-select, group/ungroup on existing nodes
- Toolbar icon → floating control panel pattern: Position, Layout (incl. Auto Layout), Appearance, Fill, Typography, Stroke, Effects — each panel edits properties of the selected node(s)
- Components, Variants, Boolean operations as grouping/combination operations on existing shapes (not freeform vector drawing)
- Undo/redo (via the CRDT from §0.3)

**Exit criteria:** every property a selected element can have is editable through the toolbar/panel pattern. Screens are still authored by AI/sketch/import (Phases 3–4, 8) — this mode edits what already exists, it doesn't need to create shapes from nothing.

## Phase 3 — AI Generation Layer (AI Mode)
**Goal:** PRD §8.1.
- AI service: prompt (+ optional reference images) → Design Document JSON via Claude, constrained to the Phase 1 schema
- Generation questionnaire flow (PRD §7): style/inspiration/variation-count Q&A, feeds AI context
- Variations system (PRD §9): generate N independent variants, switcher UI, per-variation storage
- Chat-driven targeted edits: pointer-tool tagged selection, group-select prompts (uniform vs per-screen based on phrasing, PRD §11.3)
- Quick Edit tool (text + resize only, PRD §8.1)
- AI chat panel with progress/task-flow/plan visibility (PRD §5)

**Exit criteria:** prompt → real, editable screen; AI-driven edits work against existing documents.

## Phase 4 — Sketch Mode
**Goal:** PRD §7.
- Digital sketch canvas: freeform drawing + snap-to-library components (CTA, image box, input, etc.) — a structured builder, not freehand computer-vision recognition, which keeps this far more tractable
- Frame/device size selection
- "Generate Screen" passes the sketch's structured layout (component list + rough positions) into the Phase 3 pipeline as a strong layout prior

**Exit criteria:** sketch → generate → lands in AI Mode with real screens (PRD §6.2), Manual Edit unavailable until after generation (PRD §11.1).

## Phase 5 — Prototype Mode
**Goal:** PRD §8.2.
- Interaction model: triggers and transitions (enumerate exact set from Figma source once pulled, PRD §12)
- "Show all flows" wire visualization
- Manual + AI editing of interactions
- Present Mode runtime: an actual interactive player, separate from the editable canvas

**Exit criteria:** prototypes are genuinely clickable/navigable in Present Mode.

## Phase 6 — Wireframe, User Flow, Sitemap Modes
**Goal:** PRD §8.3–8.5.
- Wireframe generation (reuses Phase 3 pipeline, low-fidelity style target)
- User Flow generation: AI derives a flow graph from screens + prototype connections; diagram rendering; summary panel + search
- Sitemap generation: AI derives app-wide hierarchy
- Cross-mode edit propagation (PRD §8.8): confirmation-dialog-driven sync

**Exit criteria:** the full pipeline tab bar (PRD §5) works end-to-end for at least one entry flow.

## Phase 7 — Code Mode
**Goal:** PRD §8.7.
- Codegen service: Design Document → frontend code (pick one framework target first, e.g. React)
- Screen-by-screen and app-wide export
- Bidirectional element ↔ code selection mapping
- Inspect panel (padding/spacing)
- AI chat for code Q&A/edits

**Exit criteria:** real, exportable code from any screen.

## Phase 8 — Figma Import ("Start with your design")
**Goal:** PRD §6.5.
- Figma import service: Figma API → Design Document translation
- Because this lands in the same schema as everything else (§0.1), no separate editing path is needed once translated

**Exit criteria:** importing a Figma file drops the user into a fully editable AI Mode canvas.

## Phase 9 — Remaining Entry Points
**Goal:** PRD §6.1, §6.4.
- Start from Template: curated Design Document library, browse/preview/clone
- Start from User Flow/Sitemap: author a flow/sitemap first (Phase 6 editors, empty graph), then generate matching screens (Phase 3)

**Exit criteria:** all 5 entry points (PRD §6) functional.

## Phase 10 — Sharing, Export, Polish
- Share links (single-user scope, PRD §11.8)
- Export formats (image/PDF/code bundle)
- Theme toggle, profile, remaining chrome
- Performance pass (many screens/variations on one canvas)

## Explicitly Deferred
- Real-time multiplayer collaboration (PRD §11.8) — kept cheap to add later by the §0.3 CRDT choice
- Adobe XD import — dropped (PRD §6.5)

## Sequencing Notes
- Phases 1–2 (schema + manual edit panels) and Phase 3 (AI generation) can partially run in parallel once the schema (§0.1) is frozen — AI generation just needs to emit valid documents; it doesn't need the full manual-edit UI to exist first.
- With Manual Edit scoped as a property-editing surface (§0.2), Phase 3 (AI generation) is now the bigger lift in the early phases, not Phase 2 — Phase 2 is largely UI/panel work once Phase 1's rendering and selection model exists.
- Everything from Phase 4 onward is comparatively fast *if* Phases 0–3 are solid, since they're all variations on "AI reads/writes the Design Document" or "render a different view of the same document."
