export type FlowNodeShape = "roundedRect" | "rect" | "diamond" | "circle" | "triangle" | "text";
export type FlowNodeKind = "start" | "end" | "step" | "decision";
export type StrokeStyle = "solid" | "dashed" | "dotted";
export type TextAlign = "left" | "center" | "right";

export type FlowStyle = {
  stroke: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  align: TextAlign;
  bulleted: boolean;
};

export type FlowNode = FlowStyle & {
  id: string;
  shape: FlowNodeShape;
  kind: FlowNodeKind;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
};

export type FlowEdge = FlowStyle & {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
};

export const FONT_FAMILIES = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Jakarta", value: "'Plus Jakarta Sans', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Mono", value: "'Courier New', monospace" },
];
export const FONT_SIZES = [10, 12, 14, 16, 20, 24];
export const SHAPE_OPTIONS: FlowNodeShape[] = ["roundedRect", "rect", "diamond", "circle", "triangle"];
export const COLOR_SWATCHES = ["#6C5CE7", "#8E51FF", "#2ECC71", "#FF6584", "#3B6EDC", "#F5A623", "#FFFFFF", "#A1A1AA"];

const DEFAULT_STYLE: FlowStyle = {
  stroke: "#6C5CE7",
  strokeWidth: 1.5,
  strokeStyle: "solid",
  textColor: "#FFFFFF",
  fontFamily: "Inter, sans-serif",
  fontSize: 12,
  bold: false,
  align: "center",
  bulleted: false,
};

const NODE_W = 140;
const NODE_H = 44;

function makeNode(id: string, label: string, x: number, y: number, kind: FlowNodeKind = "step"): FlowNode {
  const isTerminal = kind === "start" || kind === "end";
  const isDecision = kind === "decision";
  return {
    id,
    shape: isDecision ? "diamond" : "roundedRect",
    kind,
    label,
    x,
    y,
    w: isTerminal ? 110 : isDecision ? 150 : NODE_W,
    h: isTerminal ? NODE_H : isDecision ? 110 : NODE_H,
    ...DEFAULT_STYLE,
    fontSize: isDecision ? 11 : DEFAULT_STYLE.fontSize,
    fill: kind === "start" ? "#1F7A54" : kind === "end" ? "#7A1F3D" : isDecision ? "#2E2245" : "#18181A",
    stroke: kind === "start" ? "#2ECC71" : kind === "end" ? "#FF6584" : isDecision ? "#8E51FF" : DEFAULT_STYLE.stroke,
  };
}

function makeEdge(id: string, fromId: string, toId: string, label?: string): FlowEdge {
  return { id, fromId, toId, label, ...DEFAULT_STYLE, fontSize: 10 };
}

// Derives a default flow honestly from the app's own screens — the branch
// points below (account choice, login outcome, dashboard action) are real
// forks already present in the generated screens' own button wiring, just
// expressed as decision diamonds instead of flat parallel edges, so the flow
// reads as an actual user flow rather than a sitemap of rectangles.
export function buildDefaultFlow(): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const COL = 190;
  const ROW = 130;
  const nodes: FlowNode[] = [
    makeNode("splash", "Splash Screen", 0, 0, "start"),
    makeNode("decision-account", "Have account?", 0, ROW, "decision"),
    makeNode("signup", "Sign Up", -COL, ROW * 2),
    makeNode("signin", "Sign In", COL, ROW * 2),
    makeNode("decision-login", "Login OK?", COL, ROW * 3, "decision"),
    makeNode("dashboard", "Dashboard", 0, ROW * 4),
    makeNode("decision-next", "What next?", 0, ROW * 5, "decision"),
    makeNode("appointment", "Book Appointment", -COL, ROW * 6),
    makeNode("profile", "Profile", COL, ROW * 6),
    makeNode("end", "End", 0, ROW * 7, "end"),
  ];
  const edges: FlowEdge[] = [
    makeEdge("e-splash-decision", "splash", "decision-account"),
    makeEdge("e-decision-signup", "decision-account", "signup", "No"),
    makeEdge("e-decision-signin", "decision-account", "signin", "Yes"),
    makeEdge("e-signup-dashboard", "signup", "dashboard"),
    makeEdge("e-signup-signin", "signup", "signin"),
    makeEdge("e-signin-decision", "signin", "decision-login"),
    makeEdge("e-decision-login-yes", "decision-login", "dashboard", "Yes"),
    makeEdge("e-decision-login-no", "decision-login", "signin", "No"),
    makeEdge("e-signin-signup", "signin", "signup"),
    makeEdge("e-dashboard-decision", "dashboard", "decision-next"),
    makeEdge("e-decision-appointment", "decision-next", "appointment", "Book"),
    makeEdge("e-decision-profile", "decision-next", "profile", "Profile"),
    makeEdge("e-appointment-dashboard", "appointment", "dashboard"),
    makeEdge("e-profile-end", "profile", "end"),
  ];
  return { nodes, edges };
}

export function newFlowNode(id: string, label: string, x: number, y: number): FlowNode {
  return makeNode(id, label, x, y, "step");
}

// A sitemap is a page-hierarchy tree, not an interaction flow — no decisions
// or loops, just the app's own 6 real screens as parent/child pages.
export function buildDefaultSitemap(): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const COL = 170;
  const ROW = 130;
  const nodes: FlowNode[] = [
    makeNode("root", "HealthVisor", 0, 0, "start"),
    makeNode("m-splash", "Splash Screen", -COL * 1.5, ROW),
    makeNode("m-signup", "Sign Up", -COL * 0.5, ROW),
    makeNode("m-signin", "Sign In", COL * 0.5, ROW),
    makeNode("m-dashboard", "Dashboard", COL * 1.5, ROW),
    makeNode("m-appointment", "Book Appointment", COL, ROW * 2),
    makeNode("m-profile", "Profile", COL * 2, ROW * 2),
  ];
  const edges: FlowEdge[] = [
    makeEdge("s-root-splash", "root", "m-splash"),
    makeEdge("s-root-signup", "root", "m-signup"),
    makeEdge("s-root-signin", "root", "m-signin"),
    makeEdge("s-root-dashboard", "root", "m-dashboard"),
    makeEdge("s-dashboard-appointment", "m-dashboard", "m-appointment"),
    makeEdge("s-dashboard-profile", "m-dashboard", "m-profile"),
  ];
  return { nodes, edges };
}

export type ArrangeDirection = "vertical" | "horizontal";

// Layers nodes by BFS depth from whichever nodes have no incoming edge (the
// tree's roots), then spreads each layer evenly along the cross-axis — the
// standard auto-layout approach for a hierarchy/flow diagram.
export function autoArrangeNodes(nodes: FlowNode[], edges: FlowEdge[], direction: ArrangeDirection): FlowNode[] {
  const incoming = new Map<string, number>();
  nodes.forEach((n) => incoming.set(n.id, 0));
  edges.forEach((e) => incoming.set(e.toId, (incoming.get(e.toId) ?? 0) + 1));
  const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);

  const levelOf = new Map<string, number>();
  const queue: { id: string; level: number }[] = roots.map((r) => ({ id: r.id, level: 0 }));
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    if (levelOf.has(next.id)) continue;
    levelOf.set(next.id, next.level);
    edges.filter((e) => e.fromId === next.id).forEach((e) => queue.push({ id: e.toId, level: next.level + 1 }));
  }
  nodes.forEach((n) => {
    if (!levelOf.has(n.id)) levelOf.set(n.id, 0);
  });

  const byLevel = new Map<number, FlowNode[]>();
  nodes.forEach((n) => {
    const level = levelOf.get(n.id) ?? 0;
    byLevel.set(level, [...(byLevel.get(level) ?? []), n]);
  });

  const MAIN_GAP = 150;
  const CROSS_GAP = 190;
  const updated = new Map<string, FlowNode>();
  byLevel.forEach((levelNodes, level) => {
    const span = (levelNodes.length - 1) * CROSS_GAP;
    levelNodes.forEach((n, i) => {
      const cross = i * CROSS_GAP - span / 2;
      updated.set(n.id, direction === "vertical" ? { ...n, x: cross, y: level * MAIN_GAP } : { ...n, x: level * (MAIN_GAP + 60), y: cross });
    });
  });
  return nodes.map((n) => updated.get(n.id) ?? n);
}
