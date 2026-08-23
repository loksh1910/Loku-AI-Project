import { Home, PieChart, User, Image as ImageIcon, Smile } from "lucide-react";

/** Small style-preview mockups matching the Figma "Style" filter cards (node 117:933). */
export function StylePreview({ style }: { style: string }) {
  switch (style) {
    case "minimal":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-lg bg-white p-2.5">
          <div className="h-1 w-3/4 rounded-full bg-gray-300" />
          <div className="h-1 w-1/2 rounded-full bg-gray-200" />
          <div className="mt-1 h-1.5 w-2/5 rounded-full bg-[#6C5CE7]" />
          <div className="mt-1 flex gap-1">
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span className="h-1 w-1 rounded-full bg-gray-300" />
          </div>
        </div>
      );
    case "dark":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-lg bg-[#0d0d14] p-2.5">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8E51FF]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#6C5CE7]" />
          </div>
          <div className="h-1 w-2/3 rounded-full bg-[#6C5CE7]" />
          <div className="mt-1 flex items-end gap-0.5">
            {[40, 70, 50, 90].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-sm bg-[#8E51FF]"
                style={{ height: `${h * 0.16}px` }}
              />
            ))}
          </div>
        </div>
      );
    case "light":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-lg bg-white p-2.5">
          <div className="h-1 w-2/3 rounded-full bg-blue-100" />
          <div className="flex h-8 items-center justify-center rounded-md bg-gradient-to-br from-sky-200 to-blue-300">
            <ImageIcon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      );
    case "glassmorphism":
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-300 to-indigo-400 p-2.5">
          <div className="absolute inset-2 rounded-lg bg-white/25 backdrop-blur-sm" />
          <div className="relative z-10 h-full w-full space-y-1 pt-1">
            <div className="h-1 w-1/2 rounded-full bg-white/70" />
            <div className="h-1 w-1/3 rounded-full bg-white/50" />
          </div>
        </div>
      );
    case "neomorphism":
      return (
        <div className="flex h-full w-full items-center justify-center gap-2 rounded-lg bg-[#e6e7ee] p-2.5">
          {[Home, PieChart, User].map((Icon, i) => (
            <span
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e6e7ee] text-[#6C5CE7] shadow-[3px_3px_6px_#c8c9d1,-3px_-3px_6px_#ffffff]"
            >
              <Icon className="h-3 w-3" />
            </span>
          ))}
        </div>
      );
    case "modern":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#8E51FF] to-[#3d2b90] p-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
            <ImageIcon className="h-3 w-3 text-white" />
          </div>
          <div className="h-1 w-2/3 rounded-full bg-white/70" />
          <div className="h-1 w-1/3 rounded-full bg-white/40" />
        </div>
      );
    case "playful":
      return (
        <div className="relative flex h-full w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-pink-100 via-sky-100 to-yellow-100 p-2.5">
          <svg viewBox="0 0 40 20" className="h-4 w-8 text-sky-400">
            <path
              d="M0 10 Q10 0 20 10 T40 10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <Smile className="h-5 w-5 text-yellow-500" />
        </div>
      );
    case "brutalism":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-1 rounded-lg border-2 border-black bg-white p-2.5">
          <div className="h-1.5 w-3/4 bg-gray-800" />
          <div className="h-3 w-full bg-yellow-300" />
          <div className="flex justify-end">
            <div className="h-1.5 w-1.5 bg-black" />
          </div>
        </div>
      );
    default:
      return <div className="h-full w-full rounded-lg bg-secondary" />;
  }
}

/** Complexity dot+line mockup matching the Figma "Complexity" filter card (node 132:771). */
export function ComplexityPreview({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-border/60 p-3">
      <div className="flex gap-1">
        {Array.from({ length: level }).map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-primary" />
        ))}
      </div>
      <div className="w-full space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1 w-full rounded-full bg-primary/70" />
        ))}
      </div>
    </div>
  );
}
