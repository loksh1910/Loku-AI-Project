"use client";

import { useEffect, useState } from "react";

function Sparkle({ x, y, size, opacity = 0.7 }: { x: number; y: number; size: number; opacity?: number }) {
  return (
    <path
      d={`M${x} ${y - size} L${x + size * 0.3} ${y - size * 0.3} L${x + size} ${y} L${x + size * 0.3} ${y + size * 0.3} L${x} ${y + size} L${x - size * 0.3} ${y + size * 0.3} L${x - size} ${y} L${x - size * 0.3} ${y - size * 0.3} Z`}
      fill="#B9A6FF"
      opacity={opacity}
    />
  );
}

function IllustrationShell({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <defs>
        <linearGradient id="building-illustration-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8E51FF" />
          <stop offset="1" stopColor="#6C5CE7" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

function ReadingSketchIllustration() {
  return (
    <IllustrationShell>
      <Sparkle x={52} y={54} size={5} />
      <Sparkle x={150} y={140} size={4} opacity={0.5} />
      <rect x="48" y="60" width="104" height="80" rx="12" fill="url(#building-illustration-gradient)" opacity="0.9" />
      <circle cx="63" cy="75" r="2.5" fill="white" opacity="0.6" />
      <circle cx="72" cy="75" r="2.5" fill="white" opacity="0.6" />
      <circle cx="81" cy="75" r="2.5" fill="white" opacity="0.6" />
      <path
        d="M60 100 Q75 88 90 100 T120 96"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 7"
        fill="none"
        opacity="0.85"
      />
      <rect x="60" y="115" width="70" height="5" rx="2.5" fill="white" opacity="0.3" />
      <rect x="60" y="126" width="45" height="5" rx="2.5" fill="white" opacity="0.3" />
    </IllustrationShell>
  );
}

function ShapingDesignIllustration() {
  return (
    <IllustrationShell>
      <Sparkle x={146} y={56} size={5} />
      <Sparkle x={50} y={144} size={4} opacity={0.5} />
      <rect x="40" y="70" width="90" height="66" rx="10" fill="url(#building-illustration-gradient)" opacity="0.55" transform="rotate(-6 85 103)" />
      <rect x="55" y="58" width="90" height="72" rx="10" fill="url(#building-illustration-gradient)" />
      <rect x="68" y="72" width="64" height="24" rx="4" fill="white" opacity="0.18" />
      <rect x="68" y="102" width="40" height="5" rx="2.5" fill="white" opacity="0.35" />
      <rect x="68" y="112" width="28" height="5" rx="2.5" fill="white" opacity="0.35" />
    </IllustrationShell>
  );
}

function ApplyingStyleIllustration() {
  const swatches = ["#FFFFFF", "#C9B8FF", "#8E51FF", "#6C5CE7", "#4B2FAE"];
  return (
    <IllustrationShell>
      <Sparkle x={54} y={52} size={5} />
      <Sparkle x={148} y={128} size={4} opacity={0.5} />
      <circle cx="100" cy="88" r="46" fill="url(#building-illustration-gradient)" opacity="0.25" />
      <path
        d="M100 52a36 36 0 1 0 21 65c4-3 1-9-4-9h-6a10 10 0 0 1-10-10c0-3 1-5 3-7a10 10 0 0 0-4-18 36 36 0 0 0-0-21Z"
        fill="url(#building-illustration-gradient)"
      />
      {swatches.map((color, i) => (
        <circle key={color} cx={78 + i * 12} cy={i % 2 === 0 ? 78 : 92} r="6" fill={color} />
      ))}
    </IllustrationShell>
  );
}

function FinalizingComponentsIllustration() {
  return (
    <IllustrationShell>
      <Sparkle x={148} y={58} size={5} />
      <Sparkle x={50} y={134} size={4} opacity={0.5} />
      <rect x="52" y="56" width="36" height="36" rx="8" fill="url(#building-illustration-gradient)" />
      <rect x="94" y="56" width="36" height="36" rx="8" fill="url(#building-illustration-gradient)" opacity="0.5" />
      <rect x="52" y="98" width="36" height="36" rx="8" fill="url(#building-illustration-gradient)" opacity="0.5" />
      <rect x="94" y="98" width="36" height="36" rx="8" fill="url(#building-illustration-gradient)" />
      <path
        d="M104 112l6 6 12-12"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </IllustrationShell>
  );
}

const PHASES: { message: string; Illustration: () => React.ReactNode }[] = [
  { message: "Reading your sketch…", Illustration: ReadingSketchIllustration },
  { message: "Shaping your idea into a design…", Illustration: ShapingDesignIllustration },
  { message: "Applying your style…", Illustration: ApplyingStyleIllustration },
  { message: "Finalizing your components…", Illustration: FinalizingComponentsIllustration },
];

const PHASE_DURATION_MS = 1800;

export function AiBuildingOverlay({ onComplete }: { onComplete?: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (phaseIndex >= PHASES.length - 1) {
      const timer = setTimeout(() => onComplete?.(), PHASE_DURATION_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setPhaseIndex((i) => Math.min(i + 1, PHASES.length - 1)), PHASE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phaseIndex, onComplete]);

  const phase = PHASES[phaseIndex];
  const Illustration = phase.Illustration;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background">
      <div className="flex w-[254px] flex-col items-center gap-5 rounded-[20px] border border-dashed border-primary p-5">
        <div className="flex h-[240px] w-[240px] items-center justify-center">
          <Illustration />
        </div>
        <p key={phase.message} className="w-full text-center text-xs text-muted-foreground">
          {phase.message}
        </p>
      </div>
    </div>
  );
}
