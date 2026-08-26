"use client";

import type { HealthScreenId } from "./screens";

const LIGHT = "#E4E4E7";
const MED = "#D4D4D8";
const DARK = "#A1A1AA";

function Bar({ w, h = 8, className = "" }: { w: number | string; h?: number; className?: string }) {
  return <div className={`shrink-0 rounded-full ${className}`} style={{ width: w, height: h, background: LIGHT }} />;
}

function Block({ w, h, radius = 10, dark = false, className = "" }: { w: number | string; h: number; radius?: number; dark?: boolean; className?: string }) {
  return <div className={`shrink-0 ${className}`} style={{ width: w, height: h, borderRadius: radius, background: dark ? MED : LIGHT }} />;
}

function Circle({ size, dark = false, className = "" }: { size: number; dark?: boolean; className?: string }) {
  return <div className={`shrink-0 rounded-full ${className}`} style={{ width: size, height: size, background: dark ? MED : LIGHT }} />;
}

function SolidBar({ w, h = 32, className = "" }: { w: number | string; h?: number; className?: string }) {
  return <div className={`shrink-0 rounded-[10px] ${className}`} style={{ width: w, height: h, background: DARK }} />;
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-2 pb-1">
      <Bar w={24} h={7} />
      <div className="flex items-center gap-1">
        <Block w={11} h={7} radius={1} />
        <Circle size={7} />
      </div>
    </div>
  );
}

function BackHeader({ titleW }: { titleW: number }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
      <Circle size={14} />
      <Bar w={titleW} h={10} />
    </div>
  );
}

function BottomNav() {
  return (
    <div className="absolute right-0 bottom-0 left-0 flex items-center justify-around border-t py-2.5" style={{ borderColor: "#F0F0F1" }}>
      <Circle size={16} dark />
      <Circle size={16} />
      <Circle size={16} />
    </div>
  );
}

function WireframeSplash() {
  return (
    <div className="flex h-full w-full flex-col items-center bg-white">
      <StatusBar />
      <div className="flex w-full flex-1 flex-col items-center px-5 pt-8">
        <div className="flex items-center gap-1.5">
          <Circle size={14} />
          <Bar w={64} h={10} />
        </div>
        <Block w={56} h={56} radius={14} className="mt-8" />
        <Bar w={80} h={14} className="mt-4" />
        <Bar w={150} h={8} className="mt-3" />
        <Bar w={110} h={8} className="mt-1.5" />
        <div className="mt-6 w-full space-y-2">
          <SolidBar w="100%" />
          <Block w="100%" h={32} radius={999} />
        </div>
        <Bar w={70} h={8} className="mt-4" />
        <div className="mt-2 flex items-center gap-3">
          <Circle size={16} />
          <Circle size={16} />
          <Circle size={16} />
        </div>
      </div>
    </div>
  );
}

function WireframeSignUp() {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <StatusBar />
      <BackHeader titleW={90} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Block w="100%" h={34} />
        <Block w="100%" h={34} />
        <Block w="100%" h={34} />
        <div className="pt-2">
          <SolidBar w="100%" />
        </div>
        <div className="flex justify-center pt-1">
          <Bar w={150} h={8} />
        </div>
      </div>
    </div>
  );
}

function WireframeSignIn() {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <StatusBar />
      <BackHeader titleW={50} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Block w="100%" h={34} />
        <Block w="100%" h={34} />
        <div className="flex justify-end">
          <Bar w={70} h={8} />
        </div>
        <div className="pt-1">
          <SolidBar w="100%" />
        </div>
        <div className="flex justify-center pt-1">
          <Bar w={160} h={8} />
        </div>
      </div>
    </div>
  );
}

function WireframeDashboard() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      <div className="h-full pb-14">
        <div className="flex items-center justify-between px-5 pt-3">
          <div className="space-y-1.5">
            <Bar w={50} h={7} />
            <Bar w={80} h={10} />
          </div>
          <Circle size={22} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 px-5">
          <Block w="100%" h={44} />
          <Block w="100%" h={44} />
        </div>
        <div className="mx-5 mt-3">
          <SolidBar w="100%" h={48} />
        </div>
        <div className="px-5 pt-4">
          <Bar w={90} h={9} />
          <div className="mt-2 space-y-1.5">
            <Block w="100%" h={30} />
            <Block w="100%" h={30} />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function WireframeAppointment() {
  return (
    <div className="relative h-full w-full bg-white">
      <StatusBar />
      <BackHeader titleW={110} />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2.5 p-3">
          <Circle size={36} dark />
          <div className="space-y-1.5">
            <Bar w={80} h={9} />
            <Bar w={70} h={7} />
          </div>
        </div>
        <Bar w={90} h={9} className="mt-4" />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} w="100%" h={26} dark={i === 1} />
          ))}
        </div>
        <div className="pt-5">
          <SolidBar w="100%" />
        </div>
      </div>
    </div>
  );
}

function WireframeProfile() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      <div className="h-full pb-14">
        <div className="flex flex-col items-center px-5 pt-4">
          <Circle size={48} dark />
          <Bar w={80} h={10} className="mt-2" />
          <Bar w={100} h={7} className="mt-1.5" />
        </div>
        <div className="mt-4 space-y-1.5 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} w="100%" h={34} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export const WIREFRAME_SCREENS: Record<HealthScreenId, () => React.ReactNode> = {
  splash: WireframeSplash,
  signup: WireframeSignUp,
  signin: WireframeSignIn,
  dashboard: WireframeDashboard,
  appointment: WireframeAppointment,
  profile: WireframeProfile,
};
