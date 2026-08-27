import type { HealthScreenId } from "@/components/present/health-app/screens";

// Code Mode's five target languages/frameworks — matching the Figma "Component 69"
// dropdown exactly. Switching this regenerates every screen's code (and the file
// tree's extensions/paths) via the generators in code-generators.ts.
export type CodeFramework = "react-native" | "flutter" | "html-css" | "swiftui" | "jetpack-compose";

export const CODE_FRAMEWORKS: { id: CodeFramework; label: string }[] = [
  { id: "react-native", label: "React Native" },
  { id: "flutter", label: "Flutter" },
  { id: "html-css", label: "HTML & CSS" },
  { id: "swiftui", label: "Swift UI" },
  { id: "jetpack-compose", label: "Jetpack Compose" },
];

export type CodeTab = "ui" | "api" | "assets" | "inspect";

export const CODE_TABS: { id: CodeTab; label: string }[] = [
  { id: "ui", label: "UI Code" },
  { id: "api", label: "API" },
  { id: "assets", label: "Assets" },
  { id: "inspect", label: "Inspect" },
];

// One shared node vocabulary that both the Code-Mode preview renderer AND every
// per-framework code generator walk — this is what guarantees "click an element in
// the preview" and "highlight its code" stay in lockstep, since both sides read the
// exact same node list keyed by `id` rather than two independently-authored copies.
export type ScreenNodeType =
  | "brand"
  | "heading"
  | "subtext"
  | "muted"
  | "label"
  | "button"
  | "outlineButton"
  | "field"
  | "card"
  | "image"
  | "avatar"
  | "row";

export type ScreenNode = {
  id: string;
  type: ScreenNodeType;
  label: string;
  sublabel?: string;
  children?: ScreenNode[];
};

export type ScreenSpec = {
  id: HealthScreenId;
  name: string;
  fileBase: string;
  nodes: ScreenNode[];
};

function n(type: ScreenNodeType, label: string, extra?: Partial<ScreenNode>): ScreenNode {
  return { id: `${type}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`, type, label, ...extra };
}

// Compact, code-gen-oriented content specs — same copy as the AI-generated screens
// (health-app/screens.tsx, manual-health-seed.ts) but trimmed to top-level nodes,
// since Code Mode's job is to demonstrate real generated source per element, not
// reproduce every pixel of the polished Present Mode render.
export const SCREEN_SPECS: Record<HealthScreenId, ScreenSpec> = {
  splash: {
    id: "splash",
    name: "Splash Screen",
    fileBase: "SplashScreen",
    nodes: [
      n("image", "Logo"),
      n("brand", "HealthVisor"),
      n("heading", "Welcome!"),
      n("subtext", "Your personal companion for clinical precision and empathetic care."),
      n("button", "Create Account"),
      n("outlineButton", "Login"),
      n("muted", "Sign-in through"),
    ],
  },
  signup: {
    id: "signup",
    name: "Sign Up",
    fileBase: "SignUpScreen",
    nodes: [
      n("heading", "Create Account"),
      n("field", "Full name"),
      n("field", "Email address"),
      n("field", "Password"),
      n("button", "Create Account"),
      n("muted", "Already have an account? Log in"),
    ],
  },
  signin: {
    id: "signin",
    name: "Sign In",
    fileBase: "SignInScreen",
    nodes: [
      n("heading", "Sign In"),
      n("field", "Email address"),
      n("field", "Password"),
      n("label", "Forgot password?"),
      n("button", "Login"),
      n("muted", "Don't have an account? Sign up"),
    ],
  },
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    fileBase: "DashboardScreen",
    nodes: [
      n("muted", "Good morning"),
      n("heading", "Alex Carter"),
      n("avatar", "Bell"),
      n("row", "Stats", {
        children: [n("card", "Heart Rate", { sublabel: "72 bpm" }), n("card", "Sleep", { sublabel: "7h 40m" })],
      }),
      n("card", "Upcoming", { sublabel: "Book an Appointment" }),
      n("label", "Recent Activity"),
      n("card", "Morning walk", { sublabel: "32 min" }),
    ],
  },
  appointment: {
    id: "appointment",
    name: "Book Appointment",
    fileBase: "AppointmentScreen",
    nodes: [
      n("heading", "Book Appointment"),
      n("card", "Dr. Ramirez", { sublabel: "General Physician" }),
      n("label", "Available slots"),
      n("field", "9:00 AM"),
      n("button", "Confirm Appointment"),
    ],
  },
  profile: {
    id: "profile",
    name: "Profile",
    fileBase: "ProfileScreen",
    nodes: [
      n("avatar", "AC"),
      n("heading", "Alex Carter"),
      n("muted", "alex.carter@email.com"),
      n("card", "Personal information"),
      n("card", "Notifications"),
      n("card", "Privacy & security"),
    ],
  },
};

export const SCREEN_ORDER: HealthScreenId[] = ["splash", "signup", "signin", "dashboard", "appointment", "profile"];

export type FileNode = {
  id: string;
  name: string;
  kind: "folder" | "file";
  screenId?: HealthScreenId;
  children?: FileNode[];
};

// One file tree shape per framework — same screen set, different folder
// conventions/extensions (src/screens/*.tsx vs lib/screens/*.dart vs Views/*.swift, etc).
export function buildFileTree(framework: CodeFramework): FileNode[] {
  const screenFiles = (ext: string, casing: (base: string) => string): FileNode[] =>
    SCREEN_ORDER.map((id) => ({
      id: `screen-${id}`,
      name: `${casing(SCREEN_SPECS[id].fileBase)}.${ext}`,
      kind: "file",
      screenId: id,
    }));

  const pascal = (s: string) => s;
  const snake = (s: string) =>
    s.replace(/Screen$/, "").replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase() + "_screen";

  switch (framework) {
    case "react-native":
      return [
        {
          id: "src",
          name: "src",
          kind: "folder",
          children: [
            { id: "screens", name: "screens", kind: "folder", children: screenFiles("tsx", pascal) },
            {
              id: "components",
              name: "components",
              kind: "folder",
              children: [
                { id: "cmp-button", name: "Button.tsx", kind: "file" },
                { id: "cmp-field", name: "Field.tsx", kind: "file" },
              ],
            },
            { id: "assets", name: "assets", kind: "folder", children: [{ id: "asset-logo", name: "logo.png", kind: "file" }] },
            { id: "app", name: "App.tsx", kind: "file" },
            { id: "nav", name: "navigation.ts", kind: "file" },
          ],
        },
      ];
    case "flutter":
      return [
        {
          id: "lib",
          name: "lib",
          kind: "folder",
          children: [
            { id: "screens", name: "screens", kind: "folder", children: screenFiles("dart", snake) },
            {
              id: "widgets",
              name: "widgets",
              kind: "folder",
              children: [
                { id: "cmp-button", name: "app_button.dart", kind: "file" },
                { id: "cmp-field", name: "app_field.dart", kind: "file" },
              ],
            },
            { id: "main", name: "main.dart", kind: "file" },
          ],
        },
        { id: "pubspec", name: "pubspec.yaml", kind: "file" },
      ];
    case "html-css":
      return [
        { id: "pages", name: "pages", kind: "folder", children: screenFiles("html", (s) => s.replace(/Screen$/, "").toLowerCase()) },
        { id: "styles", name: "styles", kind: "folder", children: [{ id: "global-css", name: "global.css", kind: "file" }] },
        { id: "assets", name: "assets", kind: "folder", children: [{ id: "asset-logo", name: "logo.svg", kind: "file" }] },
      ];
    case "swiftui":
      return [
        { id: "views", name: "Views", kind: "folder", children: screenFiles("swift", (s) => s.replace(/Screen$/, "View")) },
        {
          id: "components",
          name: "Components",
          kind: "folder",
          children: [{ id: "cmp-button", name: "AppButton.swift", kind: "file" }],
        },
        { id: "assets", name: "Assets.xcassets", kind: "folder", children: [{ id: "asset-logo", name: "logo.imageset", kind: "file" }] },
        { id: "app", name: "HealthVisorApp.swift", kind: "file" },
      ];
    case "jetpack-compose":
      return [
        {
          id: "src",
          name: "app/src/main/java/com/healthvisor",
          kind: "folder",
          children: [
            { id: "screens", name: "screens", kind: "folder", children: screenFiles("kt", pascal) },
            {
              id: "components",
              name: "components",
              kind: "folder",
              children: [{ id: "cmp-button", name: "AppButton.kt", kind: "file" }],
            },
          ],
        },
        {
          id: "res",
          name: "app/src/main/res/drawable",
          kind: "folder",
          children: [{ id: "asset-logo", name: "logo.xml", kind: "file" }],
        },
        { id: "main-activity", name: "MainActivity.kt", kind: "file" },
      ];
  }
}
