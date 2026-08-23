import {
  LayoutGrid,
  Palette,
  SlidersHorizontal,
  Component,
  PanelLeft,
  SwatchBook,
  Monitor,
  HeartPulse,
  BarChart3,
  Users,
  UtensilsCrossed,
  GraduationCap,
  Plane,
  Sparkles,
  Building2,
  Gem,
  MoreHorizontal,
  Cloud,
  RectangleHorizontal,
  FormInput,
  Menu,
  CreditCard,
  Table,
  AppWindow,
  Shapes,
  Rows3,
  Grid3x3,
  Columns2,
  Maximize,
  LayoutPanelTop,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FilterCategoryKey =
  | "categories"
  | "style"
  | "complexity"
  | "components"
  | "layoutType"
  | "colorTheme";

export type FilterOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
  swatch?: string;
};

export type FilterGroup = {
  key: FilterCategoryKey;
  label: string;
  icon: LucideIcon;
  options: FilterOption[];
};

/**
 * Categories, Style, and Complexity match the exact Figma frames (node
 * 117:935, three states). Components, Layout Type, and Color Theme don't
 * have Figma frames yet — the user asked for these to be designed in the
 * same style/system, so they're original but follow the same option-grid
 * pattern (icon or swatch + label, 4-column grid).
 */
export const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "categories",
    label: "Categories",
    icon: LayoutGrid,
    options: [
      { value: "saas", label: "SaaS", icon: Cloud },
      { value: "ecommerce", label: "E-commerce", icon: Monitor },
      { value: "healthcare", label: "Healthcare", icon: HeartPulse },
      { value: "finance", label: "Finance", icon: BarChart3 },
      { value: "social", label: "Social", icon: Users },
      { value: "food", label: "Food", icon: UtensilsCrossed },
      { value: "education", label: "Education", icon: GraduationCap },
      { value: "travel", label: "Travel", icon: Plane },
      { value: "ai-tools", label: "AI Tools", icon: Sparkles },
      { value: "real-estate", label: "Real Estate", icon: Building2 },
      { value: "crypto", label: "Crypto", icon: Gem },
      { value: "other", label: "Other", icon: MoreHorizontal },
    ],
  },
  {
    key: "style",
    label: "Style",
    icon: Palette,
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "dark", label: "Dark" },
      { value: "light", label: "Light" },
      { value: "glassmorphism", label: "Glassmorphism" },
      { value: "neomorphism", label: "Neomorphism" },
      { value: "modern", label: "Modern" },
      { value: "playful", label: "Playful" },
      { value: "brutalism", label: "Brutalism" },
    ],
  },
  {
    key: "complexity",
    label: "Complexity",
    icon: SlidersHorizontal,
    options: [
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
  {
    key: "components",
    label: "Components",
    icon: Component,
    options: [
      { value: "buttons", label: "Buttons", icon: RectangleHorizontal },
      { value: "forms", label: "Forms", icon: FormInput },
      { value: "navigation", label: "Navigation", icon: Menu },
      { value: "cards", label: "Cards", icon: CreditCard },
      { value: "tables", label: "Tables", icon: Table },
      { value: "modals", label: "Modals", icon: AppWindow },
      { value: "charts", label: "Charts", icon: BarChart3 },
      { value: "icons", label: "Icons", icon: Shapes },
    ],
  },
  {
    key: "layoutType",
    label: "Layout type",
    icon: PanelLeft,
    options: [
      { value: "single-column", label: "Single Column", icon: Rows3 },
      { value: "grid", label: "Grid", icon: Grid3x3 },
      { value: "sidebar", label: "Sidebar", icon: PanelLeft },
      { value: "split-screen", label: "Split Screen", icon: Columns2 },
      { value: "full-width", label: "Full Width", icon: Maximize },
      { value: "card-based", label: "Card-based", icon: LayoutPanelTop },
    ],
  },
  {
    key: "colorTheme",
    label: "Color Theme",
    icon: SwatchBook,
    options: [
      { value: "purple", label: "Purple", swatch: "#6C5CE7" },
      { value: "blue", label: "Blue", swatch: "#3B82F6" },
      { value: "green", label: "Green", swatch: "#00D68F" },
      { value: "orange", label: "Orange", swatch: "#F97316" },
      { value: "pink", label: "Pink", swatch: "#EC4899" },
      { value: "monochrome", label: "Monochrome", swatch: "#9CA3AF" },
      { value: "dark", label: "Dark", swatch: "#0A0A0F" },
      { value: "light", label: "Light", swatch: "#F5F6FA" },
    ],
  },
];
