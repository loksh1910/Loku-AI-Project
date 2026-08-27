import { CANVAS_DEVICE_W, CANVAS_DEVICE_H, ROW_GAP } from "@/components/canvas/canvas-types";
import { manualElement, newManualFrame, type ManualElement, type ManualFrame } from "@/components/canvas/manual-types";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";

const COL_GAP = 60;

// Identifies a frame as one of the 6 auto-managed seed screens (vs. a freeform
// frame drawn with the Frame tool, or one the user has since renamed) — used by
// the Variations menu to know which frames it's allowed to add/remove/reflow.
export const CANONICAL_SCREEN_NAMES = ["Splash Screen", "Sign Up", "Sign In", "Dashboard", "Book Appointment", "Profile"];

function parseRadius(px: string): number {
  return parseInt(px, 10) || 0;
}

// A hand-authored, fully-editable ManualElement reconstruction of the same 6
// AI-generated screens shown elsewhere in the app — same layout/copy, but as
// real selectable/movable/resizable elements instead of hardcoded JSX, since
// Manual Edit needs to let the user select and change anything on the page.
//
// `variation` restyles every screen using that variation's real theme (colors,
// button/card radius, heading weight, font family — the same tokens Present
// Mode uses), and `rowIndex` stacks this variation's row of 6 screens below
// the others, mirroring how the Variations menu lays things out in AI mode.
export function buildHealthScreensManual(
  variation: VariationId = "bold",
  rowIndex: number = 0,
): { frames: ManualFrame[]; elements: ManualElement[] } {
  const theme = VARIATION_THEMES[variation];
  const PRIMARY = theme.primary;
  const TEXT = theme.text;
  const MUTED = theme.muted;
  const SURFACE = theme.surface;
  const BORDER = theme.border;
  const BTN_R = parseRadius(theme.buttonRadius);
  const CARD_R = parseRadius(theme.radius);
  const HEAD_W = theme.headingWeight;
  const y = rowIndex * (CANVAS_DEVICE_H + ROW_GAP);

  const names = ["Splash Screen", "Sign Up", "Sign In", "Dashboard", "Book Appointment", "Profile"];
  const frames = names.map((name, i) => ({
    ...newManualFrame({ label: "Mobile", width: CANVAS_DEVICE_W, height: CANVAS_DEVICE_H }, i * (CANVAS_DEVICE_W + COL_GAP), name, variation),
    y,
    fill: theme.bg,
  }));
  const [splash, signup, signin, dashboard, appointment, profile] = frames;

  const elements: ManualElement[] = [
    // Splash
    manualElement(splash.id, "text", 20, 24, 140, 16, { name: "Logo", text: "HealthVisor", fontWeight: 700, fontSize: 13, textColor: PRIMARY }),
    manualElement(splash.id, "roundedRect", 92, 60, 56, 56, { name: "Icon", text: "", fill: SURFACE, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(splash.id, "text", 20, 132, 201, 26, { name: "Heading", text: "Welcome!", fontWeight: HEAD_W, fontSize: 19, textColor: TEXT, textAlign: "center" }),
    manualElement(splash.id, "text", 20, 162, 201, 32, { name: "Subtext", text: "Your personal companion for clinical precision and empathetic care.", fontSize: 10, textColor: MUTED, textAlign: "center" }),
    manualElement(splash.id, "roundedRect", 20, 214, 201, 40, { name: "Create Account Button", text: "Create Account", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: BTN_R, cornerRadiusTL: BTN_R, cornerRadiusTR: BTN_R, cornerRadiusBL: BTN_R, cornerRadiusBR: BTN_R }),
    manualElement(splash.id, "roundedRect", 20, 262, 201, 40, { name: "Login Button", text: "Login", fill: "#FFFFFF", stroke: PRIMARY, strokeWidth: 1.5, textColor: PRIMARY, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: BTN_R, cornerRadiusTL: BTN_R, cornerRadiusTR: BTN_R, cornerRadiusBL: BTN_R, cornerRadiusBR: BTN_R }),
    manualElement(splash.id, "text", 20, 316, 201, 12, { name: "Social label", text: "Sign-in through", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Sign Up
    manualElement(signup.id, "text", 50, 26, 141, 18, { name: "Header", text: "Create Account", fontWeight: HEAD_W, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(signup.id, "roundedRect", 20, 70, 201, 36, { name: "Full name field", text: "Full name", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R, textAlign: "left" }),
    manualElement(signup.id, "roundedRect", 20, 114, 201, 36, { name: "Email field", text: "Email address", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(signup.id, "roundedRect", 20, 158, 201, 36, { name: "Password field", text: "Password", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(signup.id, "roundedRect", 20, 210, 201, 40, { name: "Create Account Button", text: "Create Account", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: BTN_R, cornerRadiusTL: BTN_R, cornerRadiusTR: BTN_R, cornerRadiusBL: BTN_R, cornerRadiusBR: BTN_R }),
    manualElement(signup.id, "text", 20, 260, 201, 14, { name: "Login link", text: "Already have an account? Log in", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Sign In
    manualElement(signin.id, "text", 85, 26, 80, 18, { name: "Header", text: "Sign In", fontWeight: HEAD_W, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(signin.id, "roundedRect", 20, 70, 201, 36, { name: "Email field", text: "Email address", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(signin.id, "roundedRect", 20, 114, 201, 36, { name: "Password field", text: "Password", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(signin.id, "text", 140, 162, 81, 14, { name: "Forgot password", text: "Forgot password?", fontSize: 9, textColor: PRIMARY, textAlign: "right" }),
    manualElement(signin.id, "roundedRect", 20, 190, 201, 40, { name: "Login Button", text: "Login", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: BTN_R, cornerRadiusTL: BTN_R, cornerRadiusTR: BTN_R, cornerRadiusBL: BTN_R, cornerRadiusBR: BTN_R }),
    manualElement(signin.id, "text", 20, 244, 201, 14, { name: "Sign up link", text: "Don't have an account? Sign up", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Dashboard
    manualElement(dashboard.id, "text", 20, 24, 120, 12, { name: "Greeting", text: "Good morning", fontSize: 9, textColor: MUTED }),
    manualElement(dashboard.id, "text", 20, 38, 120, 18, { name: "Name", text: "Alex Carter", fontWeight: HEAD_W, fontSize: 13, textColor: TEXT }),
    manualElement(dashboard.id, "circle", 197, 22, 24, 24, { name: "Bell icon", text: "", fill: SURFACE }),
    manualElement(dashboard.id, "roundedRect", 20, 70, 96, 50, { name: "Heart Rate card", text: "Heart Rate\n72 bpm", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(dashboard.id, "roundedRect", 125, 70, 96, 50, { name: "Sleep card", text: "Sleep\n7h 40m", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(dashboard.id, "roundedRect", 20, 132, 201, 48, { name: "Book Appointment CTA", text: "Upcoming\nBook an Appointment", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 600, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(dashboard.id, "text", 20, 192, 120, 14, { name: "Recent Activity label", text: "Recent Activity", fontWeight: 600, fontSize: 11, textColor: TEXT }),
    manualElement(dashboard.id, "roundedRect", 20, 212, 201, 30, { name: "Activity item", text: "Morning walk — 32 min", fill: SURFACE, textColor: MUTED, fontSize: 9, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),

    // Book Appointment
    manualElement(appointment.id, "text", 55, 26, 151, 18, { name: "Header", text: "Book Appointment", fontWeight: HEAD_W, fontSize: 12, textColor: TEXT, textAlign: "center" }),
    manualElement(appointment.id, "roundedRect", 20, 70, 201, 50, { name: "Doctor card", text: "Dr. Ramirez\nGeneral Physician", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(appointment.id, "text", 20, 132, 120, 14, { name: "Slots label", text: "Available slots", fontWeight: 600, fontSize: 11, textColor: TEXT }),
    manualElement(appointment.id, "roundedRect", 20, 152, 201, 70, { name: "Slot grid", text: "", fill: SURFACE, stroke: BORDER, strokeWidth: 1, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(appointment.id, "roundedRect", 20, 240, 201, 40, { name: "Confirm Button", text: "Confirm Appointment", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: BTN_R, cornerRadiusTL: BTN_R, cornerRadiusTR: BTN_R, cornerRadiusBL: BTN_R, cornerRadiusBR: BTN_R }),

    // Profile
    manualElement(profile.id, "circle", 96, 28, 48, 48, { name: "Avatar", text: "AC", fill: PRIMARY, textColor: theme.primaryText, fontWeight: 700, fontSize: 13, textAlign: "center" }),
    manualElement(profile.id, "text", 70, 82, 100, 18, { name: "Name", text: "Alex Carter", fontWeight: HEAD_W, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(profile.id, "text", 55, 102, 130, 14, { name: "Email", text: "alex.carter@email.com", fontSize: 9, textColor: MUTED, textAlign: "center" }),
    manualElement(profile.id, "roundedRect", 20, 140, 201, 36, { name: "Personal information", text: "Personal information", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(profile.id, "roundedRect", 20, 182, 201, 36, { name: "Notifications", text: "Notifications", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
    manualElement(profile.id, "roundedRect", 20, 224, 201, 36, { name: "Privacy & security", text: "Privacy & security", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: CARD_R, cornerRadiusTL: CARD_R, cornerRadiusTR: CARD_R, cornerRadiusBL: CARD_R, cornerRadiusBR: CARD_R }),
  ].map((el) => ({ ...el, fontFamily: theme.fontFamily }));

  return { frames, elements };
}
