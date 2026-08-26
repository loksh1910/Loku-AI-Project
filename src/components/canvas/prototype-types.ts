import type { HealthScreenId } from "@/components/present/health-app/screens";

export type ApplyOn = "actions" | "elements" | "selected";

export type InteractionTemplate = {
  id: string;
  sourceScreenId: HealthScreenId;
  sourceElementName: string;
  sourceElementType: "Button" | "Link" | "Icon";
  targetScreenId: HealthScreenId;
  trigger: string;
  action: string;
  animation: string;
  duration: string;
  easing: string;
};

export type PrototypeInteraction = InteractionTemplate & {
  sourceInstanceId: string;
  targetInstanceId: string;
};

// Mirrors the onNavigate() wiring already hardcoded into the health-app
// screen components — this is the editable "prototype" representation of
// those same links, not a second source of truth that drives real navigation.
export const INTERACTION_TEMPLATES: InteractionTemplate[] = [
  { id: "splash-create", sourceScreenId: "splash", sourceElementName: "Create Account", sourceElementType: "Button", targetScreenId: "signup", trigger: "On Click", action: "Navigate to", animation: "Slide right", duration: "300ms", easing: "Ease in out" },
  { id: "splash-login", sourceScreenId: "splash", sourceElementName: "Login", sourceElementType: "Button", targetScreenId: "signin", trigger: "On Click", action: "Navigate to", animation: "Slide right", duration: "300ms", easing: "Ease in out" },
  { id: "signup-create", sourceScreenId: "signup", sourceElementName: "Create Account", sourceElementType: "Button", targetScreenId: "dashboard", trigger: "On Click", action: "Navigate to", animation: "Fade", duration: "250ms", easing: "Ease in out" },
  { id: "signup-login-link", sourceScreenId: "signup", sourceElementName: "Log in", sourceElementType: "Link", targetScreenId: "signin", trigger: "On Click", action: "Navigate to", animation: "Slide left", duration: "250ms", easing: "Ease in out" },
  { id: "signin-login", sourceScreenId: "signin", sourceElementName: "Login", sourceElementType: "Button", targetScreenId: "dashboard", trigger: "On Click", action: "Navigate to", animation: "Fade", duration: "250ms", easing: "Ease in out" },
  { id: "signin-signup-link", sourceScreenId: "signin", sourceElementName: "Sign up", sourceElementType: "Link", targetScreenId: "signup", trigger: "On Click", action: "Navigate to", animation: "Slide right", duration: "250ms", easing: "Ease in out" },
  { id: "dashboard-book", sourceScreenId: "dashboard", sourceElementName: "Book an Appointment", sourceElementType: "Button", targetScreenId: "appointment", trigger: "On Click", action: "Navigate to", animation: "Slide up", duration: "300ms", easing: "Ease in out" },
  { id: "dashboard-nav-appointment", sourceScreenId: "dashboard", sourceElementName: "Appointment", sourceElementType: "Icon", targetScreenId: "appointment", trigger: "On Click", action: "Navigate to", animation: "None", duration: "150ms", easing: "Linear" },
  { id: "dashboard-nav-profile", sourceScreenId: "dashboard", sourceElementName: "Profile", sourceElementType: "Icon", targetScreenId: "profile", trigger: "On Click", action: "Navigate to", animation: "None", duration: "150ms", easing: "Linear" },
  { id: "appointment-confirm", sourceScreenId: "appointment", sourceElementName: "Confirm Appointment", sourceElementType: "Button", targetScreenId: "dashboard", trigger: "On Click", action: "Navigate to", animation: "Slide down", duration: "300ms", easing: "Ease in out" },
];
