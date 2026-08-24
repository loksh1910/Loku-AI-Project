export type VariationId = "bold" | "playful" | "minimal";

export type VariationTheme = {
  id: VariationId;
  label: string;
  bg: string;
  surface: string;
  primary: string;
  primaryText: string;
  text: string;
  muted: string;
  border: string;
  radius: string;
  buttonRadius: string;
  headingWeight: number;
  fontFamily: string;
  shadow: string;
};

export const VARIATION_THEMES: Record<VariationId, VariationTheme> = {
  bold: {
    id: "bold",
    label: "Bold",
    bg: "#FFFFFF",
    surface: "#F2F5FF",
    primary: "#3B6EDC",
    primaryText: "#FFFFFF",
    text: "#12203D",
    muted: "#5B6B8C",
    border: "#DCE3F5",
    radius: "18px",
    buttonRadius: "12px",
    headingWeight: 800,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    shadow: "0 10px 24px rgba(59,110,220,0.25)",
  },
  playful: {
    id: "playful",
    label: "Playful",
    bg: "#FFF9F4",
    surface: "#FFEFE0",
    primary: "#12B0A6",
    primaryText: "#FFFFFF",
    text: "#2B2320",
    muted: "#8A7A6E",
    border: "#F5DFC8",
    radius: "28px",
    buttonRadius: "999px",
    headingWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    shadow: "0 12px 24px rgba(18,176,166,0.2)",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    bg: "#FFFFFF",
    surface: "#FAFAFA",
    primary: "#111111",
    primaryText: "#FFFFFF",
    text: "#111111",
    muted: "#8C8C8C",
    border: "#E5E5E5",
    radius: "4px",
    buttonRadius: "4px",
    headingWeight: 600,
    fontFamily: "'Inter', sans-serif",
    shadow: "none",
  },
};
