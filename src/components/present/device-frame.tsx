"use client";

export type DeviceMode = "mobile" | "tablet" | "web";

const FRAME_DIMENSIONS: Record<DeviceMode, { w: number; h: number }> = {
  mobile: { w: 241, h: 500 },
  tablet: { w: 380, h: 500 },
  web: { w: 620, h: 420 },
};

export function DeviceFrame({ mode, children }: { mode: DeviceMode; children: React.ReactNode }) {
  const { w, h } = FRAME_DIMENSIONS[mode];
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[36px] border-[6px] border-black bg-black shadow-2xl"
      style={{ width: w, height: h }}
    >
      {mode === "mobile" && (
        <div className="absolute top-0 left-1/2 z-10 h-[18px] w-[90px] -translate-x-1/2 rounded-b-[14px] bg-black" />
      )}
      <div className="h-full w-full overflow-hidden bg-white">
        <div className="mx-auto h-full w-[241px]">{children}</div>
      </div>
    </div>
  );
}
