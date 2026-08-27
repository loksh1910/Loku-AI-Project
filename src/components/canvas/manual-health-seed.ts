import { CANVAS_DEVICE_W, CANVAS_DEVICE_H } from "@/components/canvas/canvas-types";
import { manualElement, newManualFrame, type ManualElement, type ManualFrame } from "@/components/canvas/manual-types";

const COL_GAP = 60;
const PRIMARY = "#3B6EDC";
const TEXT = "#12203D";
const MUTED = "#5B6B8C";
const SURFACE = "#F2F5FF";
const BORDER = "#DCE3F5";

// A hand-authored, fully-editable ManualElement reconstruction of the same 6
// AI-generated screens shown elsewhere in the app — same layout/copy, but as
// real selectable/movable/resizable elements instead of hardcoded JSX, since
// Manual Edit needs to let the user select and change anything on the page.
export function buildHealthScreensManual(): { frames: ManualFrame[]; elements: ManualElement[] } {
  const names = ["Splash Screen", "Sign Up", "Sign In", "Dashboard", "Book Appointment", "Profile"];
  const frames = names.map((name, i) => ({ ...newManualFrame({ label: "Mobile", width: CANVAS_DEVICE_W, height: CANVAS_DEVICE_H }, i * (CANVAS_DEVICE_W + COL_GAP), name) }));
  const [splash, signup, signin, dashboard, appointment, profile] = frames;

  const elements: ManualElement[] = [
    // Splash
    manualElement(splash.id, "text", 20, 24, 140, 16, { name: "Logo", text: "HealthVisor", fontWeight: 700, fontSize: 13, textColor: PRIMARY }),
    manualElement(splash.id, "roundedRect", 92, 60, 56, 56, { name: "Icon", text: "", fill: SURFACE, cornerRadius: 16, cornerRadiusTL: 16, cornerRadiusTR: 16, cornerRadiusBL: 16, cornerRadiusBR: 16 }),
    manualElement(splash.id, "text", 20, 132, 201, 26, { name: "Heading", text: "Welcome!", fontWeight: 800, fontSize: 19, textColor: TEXT, textAlign: "center" }),
    manualElement(splash.id, "text", 20, 162, 201, 32, { name: "Subtext", text: "Your personal companion for clinical precision and empathetic care.", fontSize: 10, textColor: MUTED, textAlign: "center" }),
    manualElement(splash.id, "roundedRect", 20, 214, 201, 40, { name: "Create Account Button", text: "Create Account", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(splash.id, "roundedRect", 20, 262, 201, 40, { name: "Login Button", text: "Login", fill: "#FFFFFF", stroke: PRIMARY, strokeWidth: 1.5, textColor: PRIMARY, fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(splash.id, "text", 20, 316, 201, 12, { name: "Social label", text: "Sign-in through", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Sign Up
    manualElement(signup.id, "text", 50, 26, 141, 18, { name: "Header", text: "Create Account", fontWeight: 700, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(signup.id, "roundedRect", 20, 70, 201, 36, { name: "Full name field", text: "Full name", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10, textAlign: "left" }),
    manualElement(signup.id, "roundedRect", 20, 114, 201, 36, { name: "Email field", text: "Email address", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(signup.id, "roundedRect", 20, 158, 201, 36, { name: "Password field", text: "Password", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(signup.id, "roundedRect", 20, 210, 201, 40, { name: "Create Account Button", text: "Create Account", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(signup.id, "text", 20, 260, 201, 14, { name: "Login link", text: "Already have an account? Log in", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Sign In
    manualElement(signin.id, "text", 85, 26, 80, 18, { name: "Header", text: "Sign In", fontWeight: 700, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(signin.id, "roundedRect", 20, 70, 201, 36, { name: "Email field", text: "Email address", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(signin.id, "roundedRect", 20, 114, 201, 36, { name: "Password field", text: "Password", fill: SURFACE, stroke: BORDER, strokeWidth: 1, textColor: MUTED, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(signin.id, "text", 140, 162, 81, 14, { name: "Forgot password", text: "Forgot password?", fontSize: 9, textColor: PRIMARY, textAlign: "right" }),
    manualElement(signin.id, "roundedRect", 20, 190, 201, 40, { name: "Login Button", text: "Login", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(signin.id, "text", 20, 244, 201, 14, { name: "Sign up link", text: "Don't have an account? Sign up", fontSize: 9, textColor: MUTED, textAlign: "center" }),

    // Dashboard
    manualElement(dashboard.id, "text", 20, 24, 120, 12, { name: "Greeting", text: "Good morning", fontSize: 9, textColor: MUTED }),
    manualElement(dashboard.id, "text", 20, 38, 120, 18, { name: "Name", text: "Alex Carter", fontWeight: 700, fontSize: 13, textColor: TEXT }),
    manualElement(dashboard.id, "circle", 197, 22, 24, 24, { name: "Bell icon", text: "", fill: SURFACE }),
    manualElement(dashboard.id, "roundedRect", 20, 70, 96, 50, { name: "Heart Rate card", text: "Heart Rate\n72 bpm", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(dashboard.id, "roundedRect", 125, 70, 96, 50, { name: "Sleep card", text: "Sleep\n7h 40m", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(dashboard.id, "roundedRect", 20, 132, 201, 48, { name: "Book Appointment CTA", text: "Upcoming\nBook an Appointment", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 600, fontSize: 10, cornerRadius: 14, cornerRadiusTL: 14, cornerRadiusTR: 14, cornerRadiusBL: 14, cornerRadiusBR: 14 }),
    manualElement(dashboard.id, "text", 20, 192, 120, 14, { name: "Recent Activity label", text: "Recent Activity", fontWeight: 600, fontSize: 11, textColor: TEXT }),
    manualElement(dashboard.id, "roundedRect", 20, 212, 201, 30, { name: "Activity item", text: "Morning walk — 32 min", fill: SURFACE, textColor: MUTED, fontSize: 9, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),

    // Book Appointment
    manualElement(appointment.id, "text", 55, 26, 151, 18, { name: "Header", text: "Book Appointment", fontWeight: 700, fontSize: 12, textColor: TEXT, textAlign: "center" }),
    manualElement(appointment.id, "roundedRect", 20, 70, 201, 50, { name: "Doctor card", text: "Dr. Ramirez\nGeneral Physician", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),
    manualElement(appointment.id, "text", 20, 132, 120, 14, { name: "Slots label", text: "Available slots", fontWeight: 600, fontSize: 11, textColor: TEXT }),
    manualElement(appointment.id, "roundedRect", 20, 152, 201, 70, { name: "Slot grid", text: "", fill: SURFACE, stroke: BORDER, strokeWidth: 1, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(appointment.id, "roundedRect", 20, 240, 201, 40, { name: "Confirm Button", text: "Confirm Appointment", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 600, fontSize: 11, textAlign: "center", cornerRadius: 12, cornerRadiusTL: 12, cornerRadiusTR: 12, cornerRadiusBL: 12, cornerRadiusBR: 12 }),

    // Profile
    manualElement(profile.id, "circle", 96, 28, 48, 48, { name: "Avatar", text: "AC", fill: PRIMARY, textColor: "#FFFFFF", fontWeight: 700, fontSize: 13, textAlign: "center" }),
    manualElement(profile.id, "text", 70, 82, 100, 18, { name: "Name", text: "Alex Carter", fontWeight: 700, fontSize: 13, textColor: TEXT, textAlign: "center" }),
    manualElement(profile.id, "text", 55, 102, 130, 14, { name: "Email", text: "alex.carter@email.com", fontSize: 9, textColor: MUTED, textAlign: "center" }),
    manualElement(profile.id, "roundedRect", 20, 140, 201, 36, { name: "Personal information", text: "Personal information", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(profile.id, "roundedRect", 20, 182, 201, 36, { name: "Notifications", text: "Notifications", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
    manualElement(profile.id, "roundedRect", 20, 224, 201, 36, { name: "Privacy & security", text: "Privacy & security", fill: SURFACE, textColor: TEXT, fontSize: 10, cornerRadius: 10, cornerRadiusTL: 10, cornerRadiusTR: 10, cornerRadiusBL: 10, cornerRadiusBR: 10 }),
  ];

  return { frames, elements };
}
