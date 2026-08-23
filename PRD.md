# Loku AI — Product Requirements Document

## 1. Overview

Loku AI is a unified UI/UX design platform for designers who already understand UI/UX fundamentals. It combines AI-driven screen generation, prototyping, wireframing, flow mapping, manual design editing, and code export into a single application — eliminating the need to move work between separate tools.

## 2. Problem Statement

Existing AI UI tools (Google Stitch, Lovable, Banani, Figma Make, and others) generate screens but stop short of a complete design workflow. Designers must export the AI output and re-import it into Figma to refine the design, build proper prototypes, or produce final specs. This context-switch between platforms breaks flow, loses fidelity, and duplicates work.

## 3. Core Value Proposition

One application covers the entire pipeline:
- AI-generated UI screens (from sketch, prompt, template, flow, or imported design)
- AI-generated prototypes with interactive flow
- Manual, Figma-grade design editing
- AI-generated wireframes, user flows, and sitemaps
- Full code export, app-wide or screen-by-screen

No handoff between tools is required at any stage.

## 4. User Journey Overview

1. User signs in → lands on **Dashboard**.
2. User starts a project via one of **5 entry methods** (Section 6).
3. User works through a **pipeline of canvas modes** (Section 8) to generate, prototype, wireframe, flow-map, manually edit, and export code for their screens.
4. User can switch freely between **Sketch** (if applicable), **Canvas**, and **Present** at any point.

## 5. Global UI Chrome (persistent across all modes)

These elements are always present regardless of which pipeline tab or top-level mode the user is in:

- **Top-left**: narrow vertical bar containing, in this confirmed order (verified via Figma MCP, `Component 18`/node `318:5383`, plus the user's own labeled screenshot, 2026-08-23):
  1. **Dashboard** (2×2 grid icon) — returns to dashboard at any time
  2. **AI chat screen** (chat-bubble-with-sparkle icon) — opens a floating "AI Assistant" panel anchored next to this icon
  3. **Screens** (overlapping-squares/copy icon) — opens a floating "Screens" panel anchored next to this icon
  4. **Split** (bracket/split icon) — stacks the Screens panel (top) and AI Assistant panel (bottom) together near the icons, both visible at once
  
  **Confirmed panel contents**:
  - **AI Assistant panel**: header ("✨ AI Assistant" + ×), the conversation history (user prompt bubble, right-aligned purple; AI response bubble, left-aligned dark), and — critically — a **live progress checklist** under the AI's response, e.g. "Got it! Here's the plan I follow to design your app:" followed by steps (Understanding requirements → User flow and structure → Wireframing key screens → Applying design system → UI polishing), each with a check-circle that's filled/solid purple when done and outline/lighter when still pending. Below that, a **"Suggested for you"** proactive suggestion card (e.g. "Add money tracking page for sellers") with a chevron to act on it.
  - **Screens panel**: header ("Screens" + add "+" + search), then a grouped, scrollable list (e.g. "User Flow — 14 screens": 01 Splash Screen, 02 Onboarding, 03 Sign In, … each row with "…" and an eye/visibility icon). This is the **same component** used inline-by-default in Present Mode (Section 8, "Present Mode difference" note) — confirms it's one reusable Screens panel, just displayed as an overlay here vs. inline there.
- **Top, next to logo**: current project file name.
- **Top-right**: horizontal bar, present on every screen, containing:
  - Theme toggle (light/dark background)
  - Share
  - Export
  - Profile
- **Top-right, next to the export/share bar**: Sketch / Canvas / Present mode switch (tab bar). Sketch tab only appears for projects started via "Start from Sketch." This switch is present in every mode.
- **Below the top-right bar**: Variations selector. Appears once AI has generated multiple variations (the count the user requested during the generation Q&A). Lets the user jump between variations from any pipeline tab, so the same tab (e.g. Wireframe) can be viewed per-variation.
- **Bottom-center**: floating AI chat box, closeable/reopenable (a collapse chevron sits just above it, confirmed via screenshot), available in AI Mode, Prototype Mode, Wireframe Mode, User Flow Mode, Sitemap Mode, and Present Mode (not in Manual Edit Mode or Code Mode, which have their own interaction models — see Sections 8.6–8.7). **Confirmed**: the placeholder text is context-sensitive — e.g. "Describe your app to start designing" in an empty AI Mode canvas vs. "Select a screen or specific element to refine..." in Present Mode.

**Present Mode difference — Screens panel**: unlike AI Mode (where the Screens panel is an on-demand floating overlay, Section 5 above), in Present Mode it renders **inline/expanded by default** on the left — a searchable, grouped, scrollable list of every screen with a visibility (eye) icon per row. Confirmed via screenshot (node `369:2955`).

**Canvas-Mode-only element — Pipeline Tab Bar**: unlike the elements above, the pipeline tab bar (AI Mode / Prototype / Wireframe / User Flow / Sitemap / Manual Edit / Code) is docked top-center and only appears in Canvas Mode — it is not shown in Present Mode or Sketch Mode. Each tab is a clean vector icon only; the currently-selected tab expands to icon + label (e.g. the AI Mode icon shows "AI Mode" text next to it), while all other tabs stay icon-only. Switching tabs animates the newly-selected tab to icon+label and collapses the previously-selected one back to icon-only. This keeps the bar compact despite having 7 modes.

**Confirmed via Figma MCP screenshot (empty AI Mode canvas, node `261:2146`, 2026-08-23)** — the full top bar, left to right: logo + project name → **undo/redo icons** (not previously documented) → the 7-tab pipeline bar exactly as described above → a **Canvas/Present segmented switch** (icon-based pill, not literal spelled-out text alone) → a separate **Play (▶) icon** next to it (likely a quick Present-mode preview trigger) → theme toggle → share → filled purple Export button → profile avatar. Bottom-right of the canvas also has a **zoom percentage indicator and a help (?) icon**, not previously documented. Full detail in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) §8.

## 6. Dashboard — 5 Ways to Start a Project

**Confirmed exact card labels (from the live Dashboard screen, `203:1447`, via Figma MCP 2026-08-23)**: "Start from Template," "Sketch to UI," "Sitemap/user flow to UI," "Start with your design," "Start from Scratch." Section headings below keep the earlier descriptive names; treat the labels above as the literal UI copy.

### 6.1 Start from Template
User browses a library of pre-built, interactive templates — can preview all screens in a template and use it as a base to redesign/edit. Leads directly into Canvas Mode (AI Mode tab) with the template's screens loaded.

### 6.2 Start from Sketch ("Sketch to UI")
See Section 7 (Sketch Mode) in full. Directs the user to a dedicated sketching canvas before any AI generation happens.

### 6.3 Start from Scratch
No sketch step. User is dropped directly into Canvas Mode → AI Mode with an empty canvas, and generates the first screen(s) via the bottom AI chat box prompt. Confirmed via screenshot: the empty state shows the AI Mode tab pre-selected, an empty canvas, and the floating chat box centered at the bottom with placeholder "Describe your app to start designing" plus contextual suggestion chips ("Try a different style," "Change the overall color theme," "Add a new page").

### 6.4 Start from User Flow / Sitemap ("Sitemap/user flow to UI")
User starts in the User Flow or Sitemap pipeline tab and builds that structure first (manually or with AI), then generates the corresponding screens/app from it. Proceeds into the same pipeline afterward.

### 6.5 Start from Your Design (Figma Import)
User imports an existing Figma file. AI converts the import into an editable Loku file/format, landing in Canvas Mode → AI Mode, after which the standard pipeline applies. (Adobe XD import was considered and dropped from scope — Adobe has deprecated XD in favor of Figma, so only Figma import is supported.)

**Mode availability by entry point**: Only "Start from Sketch" includes the Sketch mode/tab. The other four entry methods only expose the Present / Canvas mode switch (no Sketch tab) — they skip straight to Canvas Mode.

## 7. Sketch Mode (Start-from-Sketch only)

A dedicated digital sketching canvas, used before any UI is generated:

- Freeform sketching via mouse or a connected drawing tablet/pad.
- Ready-made low-fidelity wireframe components (not just primitive shapes): CTA buttons, image boxes (rectangle with diagonal cross), input fields, etc. Drag-and-arrange to rough out a screen.
- User selects target frame size/device per screen (e.g. specific phone or laptop model) before sketching inside it.
- Multiple screens can be roughed out, screen by screen.
- **Generate Screen CTA**: once sketching is done, triggers a generation questionnaire that appears as a floating box directly above the bottom AI chat box — inspiration references, number of variations desired, design style, and other AI-guiding questions. The user must answer these before generation proceeds. (This questionnaire pattern — floating box above the AI chat, answered before generation runs — applies to any entry point that triggers AI generation, not just Sketch.)
- On completion, the app transitions into **Present Mode** with the generated, prototyped UI (up to the number of variations requested).
- Manual Edit Mode is **not** available on the sketch itself. Manual, Figma-grade editing only becomes available after screens have been AI-generated (i.e. once in Canvas Mode → Manual Edit tab, Section 8.6).

**Confirmed via Figma MCP screenshots (Sketch Flow section, nodes `1026:10941` and `1069:11222`, 2026-08-23):**

- **Top bar**: logo + project name → undo/redo → (no pipeline tab bar here — that's Canvas-Mode-only, Section 5) → contextual tool hints appear inline (e.g. "Hold Shift to draw a straight line," dismissible with an ×) → top-right: an outlined **"✨ Generate UI"** pill button (this is the "Generate Screen CTA," rendered as persistent top-bar chrome rather than a one-off button) → theme toggle → share → filled Export button → avatar. Left rail in Sketch Mode has fewer icons than Canvas Mode's (2, not 4) — exact mapping still TBD.
- **Screen frames**: each sketch frame has an editable label above it (default "Screen 1," renamed to e.g. "Welcome Page," "Sign In Page" once meaningful). Each frame has small **"+" circle handles** on its left and right mid-edges — clicking one adds a new blank screen frame directly adjacent, i.e. the mechanism for roughing out "screen by screen."
- **Bottom toolbar** (Sketch Mode's own tool set, distinct from every other mode's toolbar): pointer/select, hand/pan, a **frame/artboard tool** (dropdown — this is where device/frame-size selection happens), a **component-picker tool** (dropdown — this is the "ready-made low-fidelity components" library: CTA buttons, image/icon boxes, input fields, etc., confirmed visually below), pencil (freehand draw, active tool in the sample), straight-line tool, an annotation/connector tool (dropdown), an elbow-connector tool, and a text tool (dropdown).
- **Drawing style panel**: when the pencil/line tool is active, a right-side floating "Style" panel appears — Position (Inside/Outside/Center stroke placement), Weight, End points (line cap), Color + opacity, and Corner Radius (uniform + 4 individual corners). Same floating-panel visual language as Manual Edit Mode's panels (Section 8.6), reused here for stroke styling.
- **Low-fidelity component visual language** (from the populated example screens): dashed/dotted horizontal bars = text placeholders, rounded-rectangle outlines with a dashed line inside = buttons, rounded-rectangle outlines with a short line = input fields, plain circles in a row = icon/avatar/dot placeholders (e.g. social sign-in icons), an envelope glyph = generic icon/image placeholder box. This is a coherent placeholder system, not arbitrary shapes.

## 8. Canvas Mode — Pipeline Tabs

Canvas Mode contains a horizontal pipeline of switchable tabs. The default landing tab (coming from Present Mode, or from Sketch generation) is **AI Mode**. Order: **AI Mode → Prototype → Wireframe → User Flow → Sitemap → Manual Edit → Code**.

### 8.1 AI Mode
- Canvas shows all generated screens arranged side by side (Figma-style multi-screen canvas).
- Bottom-center floating AI chat: select a component, a single screen, or multiple screens, then prompt AI to edit them.
- Center-right vertical toolbar:
  - **Hand tool** — pan the canvas.
  - **Pointer** — select an element; the selected element is tagged/pinned to the bottom AI chat box, and the user types their requested change as a prompt against that tagged selection.
  - **Group-select** — select multiple screens/components at once. Behavior on the following AI prompt depends on how the user phrases it: if the user says something like "change the color of the buttons in these," the prompt applies uniformly across the whole selection; if the user calls out different screens differently, AI treats each screen individually. The tool itself doesn't force one behavior — the AI reads intent from the prompt.
  - **Quick edit** — a deliberately limited manual tool, not a shortcut to full Manual Edit Mode. It only supports: editing text content, and resizing elements. Nothing else (no layout/fill/stroke/effects — those require Manual Edit Mode, Section 8.6).
  - **Add files to canvas** — import images, Figma screens, or Figma components from the user's system directly onto the canvas; once added they can be edited or reused anywhere in the project like any other canvas element.

### 8.2 Prototype Mode
- Same multi-screen canvas. Purpose: refine the AI-generated prototype — change which screen an interaction navigates to, edit the interaction/trigger, via AI or manually.
- Top-left **"Show all flow"** toggle (confirmed exact label, singular "flow," rendered as a pill with an on/off dot): reveals curved connector wires between screens showing all interactions (like Figma's prototype-flow view).
- Selecting a wire shows an **"Interaction" overlay** (confirmed via Figma's `Component 30`, a reusable component with two toggle states) anchored near the source element:
  - Header: "● Interaction" with a close (×).
  - A dashed-border summary row showing the connection itself: source (e.g. "Create account / Button") → arrow → destination (e.g. "Sign Up / Screen", with a dropdown chevron — the destination screen is directly changeable here).
  - **Manual edit state** (pencil icon header): dropdown fields for **Trigger** (e.g. "All Actions"), **Action** (e.g. "Navigate to"), **Animation** (e.g. "Slide right"), **Duration** (e.g. "300ms"), **Easing** (e.g. "Ease in out") — a clean, enumerable interaction model. A "✨ Back to AI edit" button at the bottom toggles to the other state.
  - **AI edit state** (sparkle icon header): a free-text box ("Describe the change you want to make...") with contextual suggestion chips (e.g. "Make it smoother," "Add slight delay," "Use fade animation") and a "🖉 Edit Manually" button to toggle back.
  - The two states are the same overlay toggling between a structured form and a natural-language box — the general "AI edit ⇄ Manual edit" toggle pattern likely generalizes beyond Prototype Mode (worth checking whether other modes' AI/manual boundary works the same way).
- **Confirmed via Figma MCP screenshots (nodes `Desktop - 75`/`Desktop - 76`, 2026-08-23)**: the canvas toolbar in Prototype Mode is reduced to just **2 icons** (pointer, hand) — no group-select/quick-edit/add-files here, unlike AI Mode's 5-icon toolbar (Section 8.1). A **"Variations"** button sits top-right below the Canvas/Present switch (matches Section 9). A bottom-center **"+ Edit Flows"** pill button expands into the AI chat box once wires/screens are selected — the chat's placeholder becomes "Edit interactions across all Actions..." with an explicit scope control: **"Apply on: All Actions / Selected Actions (N)"**, plus contextual suggestion chips (e.g. "make all buttons open as a modal," "Apply slide animation between all screens"). This scope toggle is a Prototype Mode-specific mechanism not previously documented — worth carrying into Section 8.1's group-select behavior discussion (Resolved Decision #3) as the same underlying pattern (explicit scope over ambiguous inference).

### 8.3 Wireframe Mode
- Same canvas/interaction model as Prototype Mode, but shows the AI-generated low-fidelity wireframe ("loading state") versions of the UI screens instead of full-fidelity UI.
- Same editing options: AI, manual, "Show all flows," same center-right toolbar as AI Mode.

### 8.4 User Flow Mode
- Displays the AI-generated user flow for the current screens.
- Bottom AI chat box to edit the flow via prompt.
- Selecting an element shows a small contextual toolbar above it (color, font, shape, etc.) for direct editing.
- Center-right vertical toolbar: pointer, hand tool, group-select, edit, shapes, text, add files to canvas (images/Figma screens/Figma components — see Section 8.1 for exact behavior).
- Top-left floating info panel: flow summary (total steps, decisions, connections, start page, end page) plus a search bar to find specific pages/connections.

**Confirmed via Figma MCP (node `1128:32750`, 2026-08-23)** — real example from a "HealthVisor" app flow:
- Top-left **"Flow" panel** exact fields: header with an edit/pencil icon, a "Search for elements..." search bar, a **Start/End legend** naming the actual start and end nodes (e.g. "● Start — Login Page" / "● End — End"), and a **Summary** block with real counts (e.g. "Total Steps: 18," "Decisions: 4," "Connections: 21").
- The flow itself renders as a node/connector diagram: rounded-rectangle nodes for screens/actions, diamond nodes for decisions (e.g. "Login Successful?", "What are you looking for?"), branching and re-converging (e.g. a Yes/No decision looping back to an Error Message node), fanning out from a central hub node (e.g. "Home Dashboard") into category columns, each with several sub-item nodes stacked beneath it, terminating at an "END" node.
- AI chat placeholder here is **"What do you want to create or improve?..."**, with suggestion chips "Try a different style," "Change the overall color theme," "Add a new flow."
- Canvas toolbar (right side) has 6 icons: pointer, hand, group-select, pencil/edit, shapes, text (matches the description above — now visually confirmed).
- A **"Variations"** button appears top-right, same as other modes.

### 8.5 Sitemap Mode
- Same canvas/interaction model as User Flow Mode, showing the AI-generated sitemap of the entire app instead of a user flow.
- Inspect, edit, or extend the sitemap; same AI + manual editing affordances.

**Confirmed via Figma MCP (node `1128:32849`, 2026-08-23)**:
- Reuses the **same "Flow" panel** (Start/End legend + Summary block) as User Flow Mode — in the sampled example it showed identical numbers to the User Flow view, suggesting the Summary panel may pull from a shared underlying structure regardless of which of the two visualizations is active (worth confirming this isn't a coincidence in the sample data).
- An **"Auto Arrange"** button appears top-right (sitemap-specific, not present in User Flow Mode) — auto-layouts the sitemap tree.
- The sitemap renders as a hierarchical tree from a root app-name node, fanning into pages, with a **consistent red color-coding** on certain nodes (e.g. "Notification," "Emergency Button," "Profile," "Medicines Info" in the sample) distinct from the default purple — likely marking a specific page category (e.g. hub/critical pages) rather than random styling, though the exact semantic rule isn't confirmed yet.
- Same AI chat placeholder and suggestion chips as User Flow Mode ("Add a new flow," etc.).

### 8.6 Manual Edit Mode
- No AI chat box, no AI involvement — pure manual editing.
- **Scope note (corrected 2026-08-23)**: this mode is a *property-editing* surface, not a from-scratch vector-authoring tool. It does not need to replicate Figma's underlying drawing tools (no pen tool, no freeform path editing). What it needs is the toolbar + floating control-panel interaction pattern below, giving the user full control over the properties of elements that already exist on the canvas (placed there via AI generation, sketch conversion, or Figma import).
- Center-right vertical toolbar (icon-driven): Position, Layout, Appearance, Fill, Typography, Stroke, Effects. Clicking an icon opens a floating panel near it containing that category's controls.
  - Example: clicking **Layout** opens a panel with Flow, Auto Layout, Width/Height, Spacing.
- Top-right horizontal bar (below the Present/Canvas switch bar): create Component, create Variant, Boolean operations (as property/grouping operations on existing shapes — not freeform path drawing).
- Goal: full control over every visual property Figma exposes in its panels, surfaced the same way (toolbar icon → floating control box) — not a reimplementation of Figma's drawing/vector engine.
- Only available once screens exist (post-generation) — see Section 7 for why it's excluded from raw Sketch Mode.

### 8.7 Code Mode
- Distinct two-pane layout instead of a free canvas: **Screen preview (left) / Code (right)**.
- Left pane: dropdown to select which screen's code to view; screens can also be viewed app-wide, not just individually.
- Selecting a component/element on the screen highlights the corresponding code on the right (bidirectional selection↔code mapping).
- Inspect panel showing padding/spacing for the selected element.
- Small AI chat box below the screen preview to ask AI to explain or change code.
- Output: exportable frontend code for the whole app or screen-by-screen.

**Confirmed via Figma MCP (node `1128:34723`, 2026-08-23) — full anatomy, richer than originally scoped:**
- **Left pane**: screen-selector dropdown (e.g. "Splash Screen ⌄"), a phone/desktop device-preview toggle, a frame/crop icon, a live phone-mockup preview of the selected screen with ◀ ▶ arrows beside it to step through screens without using the dropdown, and the AI chat box at the bottom ("Describe the change you want to make...").
- **Right pane has three tabs, not just one code view**: **"UI Code"** (the screen's component code), **"API"** (presumably backend/API code — not previously scoped in this PRD, needs definition), and **"Assets"** (the screen's image/font assets). A **framework selector dropdown** (e.g. "React Native ⌄") lets the user pick the export target framework, plus a **"Copy"** button.
- Below the tabs: a **file tree** ("Files" panel) showing the full project structure — e.g. `src/screens/SplashScreen.tsx` (highlighted to match the selected screen), `Onboarding.tsx`, `SignIn.tsx`, etc., a `components/` folder, an `assets/` folder, and root-level files like `App.tsx` and `navigation.ts`.
- The code editor pane shows real, syntax-highlighted framework code (the sample renders working React Native — imports, a functional component, `StyleSheet` usage, `TouchableOpacity` with `onPress={() => navigation.navigate(...)}`).
- A visible **resize handle** (grip-dot divider) sits between the file tree and the code editor — panels are resizable.
- **New scope item**: the "API" tab implies Code Mode isn't purely a frontend-code viewer — it exports some form of backend/API code too. This needs to be defined (Section 12) since it wasn't part of the original concept description.

### 8.8 Cross-Mode Edit Propagation
Whenever the user makes an edit in any pipeline mode, a confirmation dialog appears asking whether the change should be applied across all modes or kept local to the mode it was made in. If the user confirms "apply everywhere," the edit propagates to the corresponding representation in every other pipeline tab (e.g. a Manual Edit change can also update Wireframe/User Flow/Sitemap); if declined, the change stays scoped to the single mode it was made in. This applies uniformly across AI Mode, Prototype, Wireframe, User Flow, Sitemap, and Manual Edit.

## 9. Variations System

- During screen generation (from Sketch, Scratch, Template, etc.), AI asks how many variations the user wants (max 3, per the sketch flow) — via the generation questionnaire described in Section 7.
- All requested variations are generated together.
- The Variations selector (Section 5) is a dropdown (Variation 1, Variation 2, …). Selecting a variation switches the **entire** Canvas Mode and Present Mode to that variation — every pipeline tab reflects the currently selected variation.
- Variations are fully independent: editing Variation 1 does not affect Variation 2 or 3, each is preserved and accessible at any time.
- Variations **cannot be merged**. The only cross-variation operation is copy/paste of individual screens or elements from one variation into another.
- **Confirmed via Figma MCP (Present Mode screenshot, node `369:2955`, 2026-08-23)**: in Present Mode, variations render as a right-side rail of stacked cards under a **"Compare"** button (not previously documented — lets the user view variations side by side). Each card is labeled with both a number and a **descriptive style name** drawn from the generation questionnaire's design-style answer (e.g. "Variation 1 — Bold," "— Playful," "— Minimal") rather than a plain "Variation 1/2/3."

## 10. Entry-Point Comparison Matrix

| Entry method | Starts in | Sketch tab? | Notes |
|---|---|---|---|
| Start from Template | Canvas → AI Mode | No | Loads existing template screens |
| Start from Sketch | Sketch canvas | Yes | Only entry point with Sketch mode |
| Start from Scratch | Canvas → AI Mode (empty) | No | First screen generated via chat prompt |
| Start from User Flow / Sitemap | User Flow or Sitemap tab | No | Screens/app generated from the flow/sitemap afterward |
| Start from Your Design (Figma Import) | Canvas → AI Mode | No | Figma file converted to editable Loku format |

All five converge on the same Canvas pipeline (Section 8) once screens exist.

## 11. Resolved Design Decisions

Clarifications the user provided after the first draft of this PRD, superseding anything that conflicts above:

1. Manual Edit Mode is not available on the raw sketch — only after screens are AI-generated (Section 7).
2. Quick Edit (AI Mode toolbar) is intentionally limited to text-content edits and element resizing — it is not a lightweight version of Manual Edit Mode (Section 8.1).
3. Group-select + AI prompt behavior (apply to all selected uniformly vs. per-screen) is driven entirely by how the user phrases the prompt, not by a separate mode toggle (Section 8.1).
4. Cross-mode edit propagation is opt-in per edit via a confirmation dialog ("apply to all modes?"), not automatic (Section 8.8).
5. Variations are independent, never auto-merged; cross-variation reuse happens only via manual copy/paste of screens or elements (Section 9).
6. The AI generation questionnaire (Section 7) is required before every AI generation step, not just Sketch — same floating-box-above-chat pattern throughout.
7. Adobe XD import is dropped from scope. Only Figma import is supported (Section 6.5).
8. Real-time multiplayer collaboration is out of scope for v1 — single-user only. Revisit later.
9. "Add files to canvas" = importing images, Figma screens, or Figma components from the user's system onto the canvas for reuse/editing anywhere in the project (Section 8.1).
10. Manual Edit Mode is a property-editing surface (toolbar icon → floating control panel, per PRD §8.6), not a rebuild of Figma's drawing engine — no pen tool or freeform vector authoring required. Every property Figma exposes in its side panels should be controllable here, but the underlying tools that create those shapes (pen tool, etc.) are explicitly out of scope. *(Corrected 2026-08-23 — supersedes the original "full Figma tool parity" framing.)*

## 12. Open Items Still Needing Follow-Up

- **Sitemap/User Flow → Screens generation minimum**: not yet specified what a user must define in the User Flow/Sitemap-first entry point (Section 6.4) before AI can generate matching screens.
- **Code Mode's "API" tab**: confirmed to exist (Section 8.7) but not yet defined — what backend/API code does it generate, from what source (inferred from the UI? explicitly modeled by the user?), and in what language/framework(s)?
- **Sitemap's red node color-coding**: observed but not confirmed — appears to mark a specific page category (Section 8.5) but the exact rule isn't verified.
- ~~Pipeline tab bar detail~~ — confirmed (Section 5, 8.1–8.7 screenshots across multiple sessions).
- ~~Prototype interaction model~~ — confirmed for the sampled interaction: Trigger/Action/Animation/Duration/Easing fields (Section 8.2). The full set of dropdown *options* for each field (all available triggers, animations, easing curves) still needs enumeration from the Figma dropdowns directly.

## 13. Reference Assets

The user has existing Figma designs covering all flows described above, intended as the exact visual/interaction spec to replicate — including the pipeline tab bar interaction and the full Manual Edit Mode tool inventory (Sections 5, 8.6, 12). A Figma MCP connection is available and **actively in use** for pulling design context, screenshots, variable definitions, and metadata directly from those files during implementation, and should be treated as authoritative wherever it conflicts with prose descriptions in this document.

**Design system extraction (2026-08-23)**: colors, typography, spacing, corner radius, and component patterns have been extracted from the live file into [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), based on a representative screenshot/metadata sample (Dashboard, AI Mode empty/populated states, Present Mode, Manual Edit panels, Components library) rather than every individual frame. See that document's §9 for what's still unverified (Sketch Mode's own canvas, Prototype's "show all flows" wires, Code Mode's two-pane layout, the dedicated User Flow/Sitemap pipeline-tab canvases).
