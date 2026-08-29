"use client";

import type { AlignLine, GapSegment } from "@/lib/alignment-guides";

// A saturated, high-contrast blue (never Figma's orange, per an explicit
// design request) — every line/badge below is drawn with a white halo
// behind it too, so it stays readable whether it's crossing a near-black
// canvas, a plain white frame, or a colorful fill in between.
const GUIDE_COLOR = "#2F6BFF";

// A 0×0 SVG that relies purely on `overflow: visible` to paint content
// outside its own box (the pattern the connector-wire SVGs elsewhere in this
// codebase use) turns out not to reliably paint in this environment — the
// content exists in the DOM with correct geometry and topmost stacking, but
// never actually gets composited to the screen. The robust fix (same idea
// as CanvasModeView's WIRE_CANVAS_PAD-based wire layer) is to give the SVG a
// real, generously oversized box, offset so coordinate (0,0) sits at its
// center — every drawn coordinate below adds PAD before use, so it always
// lands inside the SVG's own explicit bounds instead of past its edge.
const PAD = 20000;

function HaloLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <>
      <line x1={x1 + PAD} y1={y1 + PAD} x2={x2 + PAD} y2={y2 + PAD} stroke="white" strokeOpacity={0.9} strokeWidth={3} />
      <line x1={x1 + PAD} y1={y1 + PAD} x2={x2 + PAD} y2={y2 + PAD} stroke={GUIDE_COLOR} strokeWidth={1.4} />
    </>
  );
}

function GapBadge({ gap, zoom }: { gap: GapSegment; zoom: number }) {
  const text = Math.max(0, Math.round(gap.distance)).toString();
  const padX = 4;
  const charW = 5.6;
  const boxW = text.length * charW + padX * 2;
  const boxH = 14;
  if (gap.axis === "x") {
    const a = gap.a * zoom;
    const b = gap.b * zoom;
    const cross = gap.cross * zoom;
    const midX = (a + b) / 2 + PAD;
    return (
      <g>
        <HaloLine x1={a} y1={cross} x2={b} y2={cross} />
        <HaloLine x1={a} y1={cross - 4} x2={a} y2={cross + 4} />
        <HaloLine x1={b} y1={cross - 4} x2={b} y2={cross + 4} />
        <rect x={midX - boxW / 2} y={cross + PAD - boxH / 2} width={boxW} height={boxH} rx={3} fill={GUIDE_COLOR} />
        <text x={midX} y={cross + PAD + 3} fontSize={9} fontWeight={600} fill="white" textAnchor="middle">
          {text}
        </text>
      </g>
    );
  }
  const a = gap.a * zoom;
  const b = gap.b * zoom;
  const cross = gap.cross * zoom;
  const midY = (a + b) / 2 + PAD;
  return (
    <g>
      <HaloLine x1={cross} y1={a} x2={cross} y2={b} />
      <HaloLine x1={cross - 4} y1={a} x2={cross + 4} y2={a} />
      <HaloLine x1={cross - 4} y1={b} x2={cross + 4} y2={b} />
      <rect x={cross + PAD - boxW / 2} y={midY - boxH / 2} width={boxW} height={boxH} rx={3} fill={GUIDE_COLOR} />
      <text x={cross + PAD} y={midY + 3} fontSize={9} fontWeight={600} fill="white" textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/** Renders Figma-style alignment lines + gap-distance badges. Callers pass
 * raw canvas-unit geometry (the exact same space their own drag-delta math
 * already uses) plus their current `zoom` — this component does the only
 * multiplication, so every caller's math stays in its own native units.
 * Meant to be rendered as a sibling of the view's own items/marquee, inside
 * whatever div already carries that view's pan transform. */
export function AlignmentGuidesOverlay({ lines, gaps, zoom }: { lines: AlignLine[]; gaps: GapSegment[]; zoom: number }) {
  if (lines.length === 0 && gaps.length === 0) return null;
  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -PAD, top: -PAD, width: PAD * 2, height: PAD * 2 }}
    >
      {lines.map((l, i) =>
        l.axis === "v" ? (
          <HaloLine key={`v${i}`} x1={l.pos * zoom} y1={l.start * zoom} x2={l.pos * zoom} y2={l.end * zoom} />
        ) : (
          <HaloLine key={`h${i}`} x1={l.start * zoom} y1={l.pos * zoom} x2={l.end * zoom} y2={l.pos * zoom} />
        ),
      )}
      {gaps.map((g, i) => (
        <GapBadge key={i} gap={g} zoom={zoom} />
      ))}
    </svg>
  );
}
