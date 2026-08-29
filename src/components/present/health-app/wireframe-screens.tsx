"use client";

import { cn } from "@/lib/utils";
import type { HealthScreenId } from "./screens";

const LIGHT = "#E4E4E7";
const MED = "#D4D4D8";
const DARK = "#A1A1AA";

/** Shared hover-to-select affordance — same convention as the AI-mode
 * (health-app) screens' SELECT_HOVER_CLASS, so both surfaces the "Select
 * element" tool covers look and behave identically. */
const SELECT_HOVER_CLASS =
  "cursor-pointer outline-dashed outline-1 outline-transparent transition-colors hover:outline-primary hover:bg-primary/10";

function selectHandlers(label: string, selectable: boolean | undefined, onSelectElement: ((label: string) => void) | undefined) {
  if (!selectable) return {};
  return {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectElement?.(label);
    },
  };
}

export type WireframeScreenProps = {
  /** Whether AI mode's "Select element" tool is active — every labeled
   * placeholder below becomes click-to-tag (hover outline) while true. */
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
};

type SelectableProps = { label?: string } & WireframeScreenProps;

function Bar({ w, h = 8, className = "", label, selectable, onSelectElement }: { w: number | string; h?: number; className?: string } & SelectableProps) {
  const active = selectable && !!label;
  return (
    <div
      className={cn("shrink-0 rounded-full", className, active && SELECT_HOVER_CLASS)}
      style={{ width: w, height: h, background: LIGHT }}
      {...(label ? selectHandlers(label, selectable, onSelectElement) : {})}
    />
  );
}

function Block({
  w,
  h,
  radius = 10,
  dark = false,
  className = "",
  label,
  selectable,
  onSelectElement,
}: { w: number | string; h: number; radius?: number; dark?: boolean; className?: string } & SelectableProps) {
  const active = selectable && !!label;
  return (
    <div
      className={cn("shrink-0", className, active && SELECT_HOVER_CLASS)}
      style={{ width: w, height: h, borderRadius: radius, background: dark ? MED : LIGHT }}
      {...(label ? selectHandlers(label, selectable, onSelectElement) : {})}
    />
  );
}

function Circle({ size, dark = false, className = "", label, selectable, onSelectElement }: { size: number; dark?: boolean; className?: string } & SelectableProps) {
  const active = selectable && !!label;
  return (
    <div
      className={cn("shrink-0 rounded-full", className, active && SELECT_HOVER_CLASS)}
      style={{ width: size, height: size, background: dark ? MED : LIGHT }}
      {...(label ? selectHandlers(label, selectable, onSelectElement) : {})}
    />
  );
}

function SolidBar({ w, h = 32, className = "", label, selectable, onSelectElement }: { w: number | string; h?: number; className?: string } & SelectableProps) {
  const active = selectable && !!label;
  return (
    <div
      className={cn("shrink-0 rounded-[10px]", className, active && SELECT_HOVER_CLASS)}
      style={{ width: w, height: h, background: DARK }}
      {...(label ? selectHandlers(label, selectable, onSelectElement) : {})}
    />
  );
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

function BackHeader({ titleW, selectable, onSelectElement }: { titleW: number } & WireframeScreenProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
      <Circle size={14} label="Back icon" selectable={selectable} onSelectElement={onSelectElement} />
      <Bar w={titleW} h={10} label="Title text" selectable={selectable} onSelectElement={onSelectElement} />
    </div>
  );
}

function BottomNav({ selectable, onSelectElement }: WireframeScreenProps) {
  return (
    <div className="absolute right-0 bottom-0 left-0 flex items-center justify-around border-t py-2.5" style={{ borderColor: "#F0F0F1" }}>
      <Circle size={16} dark label="Dashboard nav icon" selectable={selectable} onSelectElement={onSelectElement} />
      <Circle size={16} label="Appointment nav icon" selectable={selectable} onSelectElement={onSelectElement} />
      <Circle size={16} label="Profile nav icon" selectable={selectable} onSelectElement={onSelectElement} />
    </div>
  );
}

function WireframeSplash({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  return (
    <div className="flex h-full w-full flex-col items-center bg-white">
      <StatusBar />
      <div className="flex w-full flex-1 flex-col items-center px-5 pt-8">
        <div className="flex items-center gap-1.5">
          <Circle size={14} label="Shield icon" {...p} />
          <Bar w={64} h={10} label="HealthVisor text" {...p} />
        </div>
        <Block w={56} h={56} radius={14} className="mt-8" label="Heart icon" {...p} />
        <Bar w={80} h={14} className="mt-4" label="Welcome! text" {...p} />
        <Bar w={150} h={8} className="mt-3" label="Subtext" {...p} />
        <Bar w={110} h={8} className="mt-1.5" label="Subtext" {...p} />
        <div className="mt-6 w-full space-y-2">
          <SolidBar w="100%" label="Create Account button" {...p} />
          <Block w="100%" h={32} radius={999} label="Login button" {...p} />
        </div>
        <Bar w={70} h={8} className="mt-4" label="Sign-in through text" {...p} />
        <div className="mt-2 flex items-center gap-3">
          <Circle size={16} label="Google icon" {...p} />
          <Circle size={16} label="Facebook icon" {...p} />
          <Circle size={16} label="Twitter icon" {...p} />
        </div>
      </div>
    </div>
  );
}

function WireframeSignUp({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <StatusBar />
      <BackHeader titleW={90} {...p} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Block w="100%" h={34} label="Full name field" {...p} />
        <Block w="100%" h={34} label="Email address field" {...p} />
        <Block w="100%" h={34} label="Password field" {...p} />
        <div className="pt-2">
          <SolidBar w="100%" label="Create Account button" {...p} />
        </div>
        <div className="flex justify-center pt-1">
          <Bar w={150} h={8} label="Log in link" {...p} />
        </div>
      </div>
    </div>
  );
}

function WireframeSignIn({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <StatusBar />
      <BackHeader titleW={50} {...p} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Block w="100%" h={34} label="Email address field" {...p} />
        <Block w="100%" h={34} label="Password field" {...p} />
        <div className="flex justify-end">
          <Bar w={70} h={8} label="Forgot password? text" {...p} />
        </div>
        <div className="pt-1">
          <SolidBar w="100%" label="Login button" {...p} />
        </div>
        <div className="flex justify-center pt-1">
          <Bar w={160} h={8} label="Sign up link" {...p} />
        </div>
      </div>
    </div>
  );
}

function WireframeDashboard({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      <div className="h-full pb-14">
        <div className="flex items-center justify-between px-5 pt-3">
          <div className="space-y-1.5">
            <Bar w={50} h={7} label="Good morning text" {...p} />
            <Bar w={80} h={10} label="Alex Carter text" {...p} />
          </div>
          <Circle size={22} label="Notifications icon" {...p} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 px-5">
          <Block w="100%" h={44} label="Heart Rate card" {...p} />
          <Block w="100%" h={44} label="Sleep card" {...p} />
        </div>
        <div className="mx-5 mt-3">
          <SolidBar w="100%" h={48} label="Book an Appointment button" {...p} />
        </div>
        <div className="px-5 pt-4">
          <Bar w={90} h={9} label="Recent Activity text" {...p} />
          <div className="mt-2 space-y-1.5">
            <Block w="100%" h={30} label="Morning walk — 32 min card" {...p} />
            <Block w="100%" h={30} label="Water intake — 6 glasses card" {...p} />
          </div>
        </div>
      </div>
      <BottomNav {...p} />
    </div>
  );
}

function WireframeAppointment({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  return (
    <div className="relative h-full w-full bg-white">
      <StatusBar />
      <BackHeader titleW={110} {...p} />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2.5 p-3">
          <Circle size={36} dark label="Doctor avatar" {...p} />
          <div className="space-y-1.5">
            <Bar w={80} h={9} label="Dr. Ramirez text" {...p} />
            <Bar w={70} h={7} label="General Physician text" {...p} />
          </div>
        </div>
        <Bar w={90} h={9} className="mt-4" label="Available slots text" {...p} />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {["9:00 AM", "11:30 AM", "2:00 PM", "4:15 PM", "5:30 PM", "6:45 PM"].map((slot, i) => (
            <Block key={slot} w="100%" h={26} dark={i === 1} label={`${slot} slot`} {...p} />
          ))}
        </div>
        <div className="pt-5">
          <SolidBar w="100%" label="Confirm Appointment button" {...p} />
        </div>
      </div>
    </div>
  );
}

function WireframeProfile({ selectable, onSelectElement }: WireframeScreenProps) {
  const p = { selectable, onSelectElement };
  const items = ["Personal information", "Notifications", "Privacy & security", "Help & support"];
  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      <StatusBar />
      <div className="h-full pb-14">
        <div className="flex flex-col items-center px-5 pt-4">
          <Circle size={48} dark label="Profile avatar" {...p} />
          <Bar w={80} h={10} className="mt-2" label="Alex Carter text" {...p} />
          <Bar w={100} h={7} className="mt-1.5" label="alex.carter@email.com text" {...p} />
        </div>
        <div className="mt-4 space-y-1.5 px-5">
          {items.map((item) => (
            <Block key={item} w="100%" h={34} label={`${item} row`} {...p} />
          ))}
        </div>
      </div>
      <BottomNav {...p} />
    </div>
  );
}

export const WIREFRAME_SCREENS: Record<HealthScreenId, (props: WireframeScreenProps) => React.ReactNode> = {
  splash: WireframeSplash,
  signup: WireframeSignUp,
  signin: WireframeSignIn,
  dashboard: WireframeDashboard,
  appointment: WireframeAppointment,
  profile: WireframeProfile,
};
