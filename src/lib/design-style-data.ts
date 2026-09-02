// Data for the Design Style overlay (Figma: Component 63, node 1252:33614) —
// the 8 ready-made presets shown as illustrated cards, and the option lists
// used by each step of the 6-step "Create your own" custom flow.

export type PresetStyleId =
  | "minimal"
  | "dark"
  | "light"
  | "neomorphism"
  | "modern"
  | "playful"
  | "brutalism"
  | "glassmorphism";

// Order matches the Figma layout exactly: row 1 (Minimal/Dark/Light), row 2
// (Neomorphism/Modern/Playful), row 3 (Brutalism/Glassmorphism).
export const PRESET_STYLES: { id: PresetStyleId; label: string; image: string }[] = [
  { id: "minimal", label: "Minimal", image: "/images/design-style/style-minimal.png" },
  { id: "dark", label: "Dark", image: "/images/design-style/style-dark.png" },
  { id: "light", label: "Light", image: "/images/design-style/style-light.png" },
  { id: "neomorphism", label: "Neomorphism", image: "/images/design-style/style-neomorphism.png" },
  { id: "modern", label: "Modern", image: "/images/design-style/style-modern.png" },
  { id: "playful", label: "Playful", image: "/images/design-style/style-playful.png" },
  { id: "brutalism", label: "Brutalism", image: "/images/design-style/style-brutalism.png" },
  { id: "glassmorphism", label: "Glassmorphism", image: "/images/design-style/style-glassmorphism.png" },
];

// Flat accent colors matching the swatch row shown in the Figma "Choose your
// colors" step — a 6th, custom option opens a real color picker.
export const COLOR_SWATCHES = ["#FF3B30", "#FFCC00", "#34C759", "#32ADE6", "#000000"];

// The Figma frame shows a closed dropdown ("Modern Sans") — the open option
// list isn't part of the exported static frame, so this is a reasonable,
// clearly-labeled set covering the same ground (sans/serif/rounded/mono).
export const FONT_OPTIONS = ["Modern Sans", "Classic Serif", "Playful Rounded", "Clean Mono", "Elegant Serif"];

export type CustomStepId = 1 | 2 | 3 | 4 | 5 | 6;

export const CUSTOM_STEPS: { id: CustomStepId; title: string; subtitle: string }[] = [
  { id: 1, title: "Define your style", subtitle: "Choose the overall look and feel of your interface" },
  { id: 2, title: "Choose your colors", subtitle: "Set the primary colors that define your visual identity" },
  { id: 3, title: "Select typography", subtitle: "Choose how your content will be read and perceived" },
  { id: 4, title: "Define component style", subtitle: "Control how UI elements like buttons and cards appear" },
  { id: 5, title: "Adjust layout feel", subtitle: "Define spacing, density, and structure of your UI" },
  { id: 6, title: "Set motion style", subtitle: "Control how elements animate and respond to interaction" },
];

export const STYLE_KEYWORDS = ["Clean & Minimal", "Bold & Modern", "Playful", "Premium", "Professional", "Futuristic"];
export const RADIUS_OPTIONS = ["Sharp", "Medium", "Rounded"];
export const SHADOW_OPTIONS = ["None", "Soft", "Strong"];
export const BUTTON_STYLE_OPTIONS = ["Filled", "Outline", "Mixed"];
export const SPACING_OPTIONS = ["Spacious", "Compact"];
export const STRUCTURE_OPTIONS = ["Grid-based", "Free-flow"];
export const MOTION_OPTIONS = ["Subtle", "Smooth", "Snappy", "None"];
