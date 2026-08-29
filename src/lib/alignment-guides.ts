/** Figma-style smart-alignment geometry — shared by every canvas surface
 * that lets you drag a frame/element/screen (Sketch mode, Canvas mode,
 * Design/Manual Edit). Pure functions only; each view supplies its own
 * rects in whatever "canvas unit" space it already uses internally (the
 * same space its drag-delta math already works in) and renders the result
 * through <AlignmentGuidesOverlay>, which multiplies by that view's zoom.
 *
 * Two independent features live here:
 * - computeAlignSnap + computeNeighborGaps: run continuously while dragging
 *   — edge/center snapping against nearby siblings, plus the gap distance
 *   to whatever's nearest in each of the 4 directions.
 * - gapBetween: a single pairwise measurement between two specific rects,
 *   used by the Alt-hover "measure from my selection to whatever I'm
 *   hovering" mode (no dragging, no snapping involved).
 */

export type GuideRect = { x: number; y: number; w: number; h: number };

export type AlignLine = { axis: "v" | "h"; pos: number; start: number; end: number };

export type GapSegment = { axis: "x" | "y"; a: number; b: number; cross: number; distance: number };

/** On-screen pixels of snap tolerance — divide by the view's current zoom
 * before passing as `threshold` so the tolerance feels constant at any zoom. */
export const DEFAULT_SNAP_PX = 6;

function xEdges(r: GuideRect) {
  return [r.x, r.x + r.w / 2, r.x + r.w];
}
function yEdges(r: GuideRect) {
  return [r.y, r.y + r.h / 2, r.y + r.h];
}

/** Snaps `moving` to the nearest edge/center alignment among `others` within
 * `threshold` canvas units (independently on each axis), and returns the
 * lines to draw through every rect that lines up on the winning position. */
export function computeAlignSnap(moving: GuideRect, others: GuideRect[], threshold: number): { dx: number; dy: number; lines: AlignLine[] } {
  const mX = xEdges(moving);
  const mY = yEdges(moving);
  let dx = 0;
  let dxAbs = threshold;
  let dy = 0;
  let dyAbs = threshold;

  others.forEach((other) => {
    xEdges(other).forEach((ox) => {
      mX.forEach((mx) => {
        const abs = Math.abs(ox - mx);
        if (abs < dxAbs) {
          dxAbs = abs;
          dx = ox - mx;
        }
      });
    });
    yEdges(other).forEach((oy) => {
      mY.forEach((my) => {
        const abs = Math.abs(oy - my);
        if (abs < dyAbs) {
          dyAbs = abs;
          dy = oy - my;
        }
      });
    });
  });

  const snapped: GuideRect = { x: moving.x + dx, y: moving.y + dy, w: moving.w, h: moving.h };
  const snapX = xEdges(snapped);
  const snapY = yEdges(snapped);
  const EPS = 0.5;
  const EXTEND = 20;
  const lines: AlignLine[] = [];

  others.forEach((other) => {
    xEdges(other).forEach((ox) => {
      if (snapX.some((sx) => Math.abs(sx - ox) < EPS)) {
        const start = Math.min(other.y, snapped.y) - EXTEND;
        const end = Math.max(other.y + other.h, snapped.y + snapped.h) + EXTEND;
        lines.push({ axis: "v", pos: ox, start, end });
      }
    });
    yEdges(other).forEach((oy) => {
      if (snapY.some((sy) => Math.abs(sy - oy) < EPS)) {
        const start = Math.min(other.x, snapped.x) - EXTEND;
        const end = Math.max(other.x + other.w, snapped.x + snapped.w) + EXTEND;
        lines.push({ axis: "h", pos: oy, start, end });
      }
    });
  });

  return { dx, dy, lines };
}

function overlap1D(a0: number, a1: number, b0: number, b1: number): [number, number] | null {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  return hi > lo ? [lo, hi] : null;
}

/** Nearest facing neighbor of `moving` in one cardinal direction, provided
 * the two rects actually overlap on the cross-axis (otherwise there's no
 * single well-defined gap to draw). */
function nearestGap(moving: GuideRect, others: GuideRect[], dir: "left" | "right" | "top" | "bottom", maxDist: number): GapSegment | null {
  let best: GapSegment | null = null;
  others.forEach((other) => {
    if (dir === "left" || dir === "right") {
      const ov = overlap1D(moving.y, moving.y + moving.h, other.y, other.y + other.h);
      if (!ov) return;
      const cross = (ov[0] + ov[1]) / 2;
      if (dir === "left" && other.x + other.w <= moving.x) {
        const distance = moving.x - (other.x + other.w);
        if (distance >= 0 && distance <= maxDist && (!best || distance < best.distance)) {
          best = { axis: "x", a: other.x + other.w, b: moving.x, cross, distance };
        }
      }
      if (dir === "right" && moving.x + moving.w <= other.x) {
        const distance = other.x - (moving.x + moving.w);
        if (distance >= 0 && distance <= maxDist && (!best || distance < best.distance)) {
          best = { axis: "x", a: moving.x + moving.w, b: other.x, cross, distance };
        }
      }
    } else {
      const ov = overlap1D(moving.x, moving.x + moving.w, other.x, other.x + other.w);
      if (!ov) return;
      const cross = (ov[0] + ov[1]) / 2;
      if (dir === "top" && other.y + other.h <= moving.y) {
        const distance = moving.y - (other.y + other.h);
        if (distance >= 0 && distance <= maxDist && (!best || distance < best.distance)) {
          best = { axis: "y", a: other.y + other.h, b: moving.y, cross, distance };
        }
      }
      if (dir === "bottom" && moving.y + moving.h <= other.y) {
        const distance = other.y - (moving.y + moving.h);
        if (distance >= 0 && distance <= maxDist && (!best || distance < best.distance)) {
          best = { axis: "y", a: moving.y + moving.h, b: other.y, cross, distance };
        }
      }
    }
  });
  return best;
}

/** Distance to whatever's closest in each of the 4 directions — the little
 * "30" badges Figma shows next to whatever you're dragging near. */
export function computeNeighborGaps(moving: GuideRect, others: GuideRect[], maxDist = 4000): GapSegment[] {
  return (["left", "right", "top", "bottom"] as const)
    .map((dir) => nearestGap(moving, others, dir, maxDist))
    .filter((g): g is GapSegment => g !== null);
}

/** Pairwise measurement between two specific rects, regardless of distance —
 * used by Alt-hover, which is a deliberate "measure these two" gesture, not
 * a nearest-neighbor search. Only returns an axis when the rects don't
 * overlap on it (an overlapping axis has no single meaningful gap to show). */
export function gapBetween(a: GuideRect, b: GuideRect): { x?: GapSegment; y?: GapSegment } {
  const result: { x?: GapSegment; y?: GapSegment } = {};
  if (a.x + a.w <= b.x || b.x + b.w <= a.x) {
    const left = a.x < b.x ? a : b;
    const right = a.x < b.x ? b : a;
    const ov = overlap1D(a.y, a.y + a.h, b.y, b.y + b.h);
    const cross = ov ? (ov[0] + ov[1]) / 2 : (Math.min(a.y, b.y) + Math.max(a.y + a.h, b.y + b.h)) / 2;
    result.x = { axis: "x", a: left.x + left.w, b: right.x, cross, distance: right.x - (left.x + left.w) };
  }
  if (a.y + a.h <= b.y || b.y + b.h <= a.y) {
    const top = a.y < b.y ? a : b;
    const bottom = a.y < b.y ? b : a;
    const ov = overlap1D(a.x, a.x + a.w, b.x, b.x + b.w);
    const cross = ov ? (ov[0] + ov[1]) / 2 : (Math.min(a.x, b.x) + Math.max(a.x + a.w, b.x + b.w)) / 2;
    result.y = { axis: "y", a: top.y + top.h, b: bottom.y, cross, distance: bottom.y - (top.y + top.h) };
  }
  return result;
}

/** Union bounding box of several rects — used to treat a multi-selection
 * being dragged as one shape for alignment purposes (matches Figma: a
 * group drag snaps by its collective bounds, not each member separately). */
export function unionRect(rects: GuideRect[]): GuideRect | null {
  if (rects.length === 0) return null;
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
