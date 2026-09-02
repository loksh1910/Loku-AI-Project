import type { PresetStyleId } from "@/lib/design-style-data";

/** Everything the 6-step "Create your own" flow can set. Each field is
 * independently nullable — "Skip this" leaves a step's field(s) null, and
 * each step's own "Let AI decide" toggle is tracked alongside so the summary
 * can say "AI decides" instead of showing nothing. */
export type CustomDesignStyleDraft = {
  defineStyle: string | null;
  defineStyleAi: boolean;
  primaryColor: string | null;
  secondaryColor: string | null;
  colorsAi: boolean;
  primaryFont: string | null;
  secondaryFont: string | null;
  typographyAi: boolean;
  borderRadius: string | null;
  shadows: string | null;
  buttons: string | null;
  componentAi: boolean;
  spacing: string | null;
  structure: string | null;
  layoutAi: boolean;
  motion: string | null;
  motionAi: boolean;
};

export const EMPTY_CUSTOM_DRAFT: CustomDesignStyleDraft = {
  defineStyle: null,
  defineStyleAi: false,
  primaryColor: null,
  secondaryColor: null,
  colorsAi: false,
  primaryFont: null,
  secondaryFont: null,
  typographyAi: false,
  borderRadius: null,
  shadows: null,
  buttons: null,
  componentAi: false,
  spacing: null,
  structure: null,
  layoutAi: false,
  motion: null,
  motionAi: false,
};

/** The single choice active in the main overlay's "Choose a Style" /
 * "Import Style" panel — picking one clears the other two, since only one
 * source can back the final applied style. */
export type ImportChoice = { kind: "preset"; id: PresetStyleId } | { kind: "url"; value: string } | { kind: "image"; name: string } | null;

/** The design style actually applied — what the AI chat box's chip reflects. */
export type DesignStyle =
  | { kind: "preset"; id: PresetStyleId; label: string }
  | { kind: "import"; label: string }
  | ({ kind: "custom"; label: string } & CustomDesignStyleDraft);
