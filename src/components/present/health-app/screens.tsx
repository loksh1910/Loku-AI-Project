"use client";

import { Bell, Calendar, ChevronLeft, Heart, Home, Shield, User } from "lucide-react";
import type { VariationTheme } from "./theme";

export type HealthScreenId = "splash" | "signup" | "signin" | "dashboard" | "appointment" | "profile";

export type HealthScreenProps = {
  theme: VariationTheme;
  onNavigate: (id: HealthScreenId) => void;
};

function StatusBar({ theme }: { theme: VariationTheme }) {
  return (
    <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[9px] font-semibold" style={{ color: theme.text }}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="h-[7px] w-[11px] rounded-[1px] border" style={{ borderColor: theme.text }} />
        <div className="h-[7px] w-[7px] rounded-full border" style={{ borderColor: theme.text }} />
      </div>
    </div>
  );
}

function Button({
  theme,
  variant = "solid",
  children,
  onClick,
}: {
  theme: VariationTheme;
  variant?: "solid" | "outline";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 text-[11px] font-semibold transition-opacity hover:opacity-90"
      style={{
        borderRadius: theme.buttonRadius,
        background: variant === "solid" ? theme.primary : "transparent",
        color: variant === "solid" ? theme.primaryText : theme.primary,
        border: variant === "outline" ? `1.5px solid ${theme.primary}` : "none",
        fontFamily: theme.fontFamily,
        boxShadow: variant === "solid" ? theme.shadow : "none",
      }}
    >
      {children}
    </button>
  );
}

function Field({ theme, placeholder, type = "text" }: { theme: VariationTheme; placeholder: string; type?: string }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-[11px] outline-none"
      style={{
        borderRadius: theme.buttonRadius,
        border: `1px solid ${theme.border}`,
        background: theme.surface,
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
    />
  );
}

function BackHeader({ theme, title, onBack }: { theme: VariationTheme; title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
      <button onClick={onBack} style={{ color: theme.text }} aria-label="Back">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <p className="text-xs font-semibold" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
        {title}
      </p>
    </div>
  );
}

function BottomNav({ theme, active, onNavigate }: { theme: VariationTheme; active: HealthScreenId; onNavigate: (id: HealthScreenId) => void }) {
  const items: { id: HealthScreenId; icon: typeof Home }[] = [
    { id: "dashboard", icon: Home },
    { id: "appointment", icon: Calendar },
    { id: "profile", icon: User },
  ];
  return (
    <div
      className="absolute right-0 bottom-0 left-0 flex items-center justify-around border-t py-2.5"
      style={{ borderColor: theme.border, background: theme.bg }}
    >
      {items.map(({ id, icon: Icon }) => (
        <button key={id} onClick={() => onNavigate(id)} style={{ color: active === id ? theme.primary : theme.muted }}>
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export function SplashScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="flex w-full flex-1 flex-col items-center px-5 pt-8">
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" style={{ color: theme.primary }} fill={theme.primary} fillOpacity={0.15} />
          <span className="text-[11px] font-bold" style={{ color: theme.primary }}>
            HealthVisor
          </span>
        </div>
        <div
          className="mt-8 flex h-14 w-14 items-center justify-center"
          style={{ background: theme.surface, borderRadius: theme.radius }}
        >
          <Heart className="h-6 w-6" style={{ color: theme.primary }} fill={theme.primary} fillOpacity={0.3} />
        </div>
        <p className="mt-4 text-base font-bold" style={{ color: theme.text, fontWeight: theme.headingWeight }}>
          Welcome!
        </p>
        <p className="mt-1 text-center text-[10px]" style={{ color: theme.muted }}>
          Your personal companion for clinical precision and empathetic care.
        </p>
        <div className="mt-6 w-full space-y-2">
          <Button theme={theme} onClick={() => onNavigate("signup")}>
            Create Account
          </Button>
          <Button theme={theme} variant="outline" onClick={() => onNavigate("signin")}>
            Login
          </Button>
        </div>
        <p className="mt-4 text-[9px]" style={{ color: theme.muted }}>
          Sign-in through
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold" style={{ color: "#EA4335" }}>
            G
          </span>
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: "#1877F2" }}
          >
            f
          </span>
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
            style={{ background: "#1DA1F2" }}
          >
            t
          </span>
        </div>
      </div>
    </div>
  );
}

export function SignUpScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader theme={theme} title="Create Account" onBack={() => onNavigate("splash")} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Field theme={theme} placeholder="Full name" />
        <Field theme={theme} placeholder="Email address" type="email" />
        <Field theme={theme} placeholder="Password" type="password" />
        <div className="pt-2">
          <Button theme={theme} onClick={() => onNavigate("dashboard")}>
            Create Account
          </Button>
        </div>
        <button className="w-full pt-1 text-center text-[10px]" style={{ color: theme.muted }} onClick={() => onNavigate("signin")}>
          Already have an account? <span style={{ color: theme.primary }}>Log in</span>
        </button>
      </div>
    </div>
  );
}

export function SignInScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader theme={theme} title="Sign In" onBack={() => onNavigate("splash")} />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Field theme={theme} placeholder="Email address" type="email" />
        <Field theme={theme} placeholder="Password" type="password" />
        <button className="block text-right text-[10px]" style={{ color: theme.primary, marginLeft: "auto" }}>
          Forgot password?
        </button>
        <div className="pt-2">
          <Button theme={theme} onClick={() => onNavigate("dashboard")}>
            Login
          </Button>
        </div>
        <button className="w-full pt-1 text-center text-[10px]" style={{ color: theme.muted }} onClick={() => onNavigate("signup")}>
          Don&rsquo;t have an account? <span style={{ color: theme.primary }}>Sign up</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardScreen({ theme, onNavigate }: HealthScreenProps) {
  const stats = [
    { label: "Heart Rate", value: "72 bpm" },
    { label: "Sleep", value: "7h 40m" },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="h-full overflow-y-auto pb-14">
        <div className="flex items-center justify-between px-5 pt-3">
          <div>
            <p className="text-[9px]" style={{ color: theme.muted }}>
              Good morning
            </p>
            <p className="text-xs font-bold" style={{ color: theme.text, fontWeight: theme.headingWeight }}>
              Alex Carter
            </p>
          </div>
          <div className="flex h-6 w-6 items-center justify-center" style={{ background: theme.surface, borderRadius: "999px" }}>
            <Bell className="h-3 w-3" style={{ color: theme.text }} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 px-5">
          {stats.map((s) => (
            <div key={s.label} className="p-2.5" style={{ background: theme.surface, borderRadius: theme.radius }}>
              <p className="text-[8px]" style={{ color: theme.muted }}>
                {s.label}
              </p>
              <p className="text-[11px] font-bold" style={{ color: theme.text }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate("appointment")}
          className="mx-5 mt-3 flex w-[calc(100%-40px)] items-center justify-between p-3 text-left"
          style={{ background: theme.primary, borderRadius: theme.radius, boxShadow: theme.shadow }}
        >
          <div>
            <p className="text-[8px]" style={{ color: theme.primaryText, opacity: 0.8 }}>
              Upcoming
            </p>
            <p className="text-[10px] font-semibold" style={{ color: theme.primaryText }}>
              Book an Appointment
            </p>
          </div>
          <Calendar className="h-4 w-4" style={{ color: theme.primaryText }} />
        </button>
        <div className="px-5 pt-4">
          <p className="text-[10px] font-semibold" style={{ color: theme.text }}>
            Recent Activity
          </p>
          <div className="mt-1.5 space-y-1.5">
            {["Morning walk — 32 min", "Water intake — 6 glasses"].map((item) => (
              <div key={item} className="p-2.5 text-[9px]" style={{ background: theme.surface, borderRadius: theme.radius, color: theme.muted }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav theme={theme} active="dashboard" onNavigate={onNavigate} />
    </div>
  );
}

export function AppointmentScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="relative h-full w-full" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader theme={theme} title="Book Appointment" onBack={() => onNavigate("dashboard")} />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2.5 p-3" style={{ background: theme.surface, borderRadius: theme.radius }}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center text-[10px] font-bold"
            style={{ background: theme.primary, color: theme.primaryText, borderRadius: theme.buttonRadius }}
          >
            DR
          </div>
          <div>
            <p className="text-[11px] font-semibold" style={{ color: theme.text }}>
              Dr. Ramirez
            </p>
            <p className="text-[9px]" style={{ color: theme.muted }}>
              General Physician
            </p>
          </div>
        </div>
        <p className="mt-4 text-[10px] font-semibold" style={{ color: theme.text }}>
          Available slots
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {["9:00 AM", "11:30 AM", "2:00 PM", "4:15 PM", "5:30 PM", "6:45 PM"].map((slot, i) => (
            <div
              key={slot}
              className="p-1.5 text-center text-[9px]"
              style={{
                borderRadius: theme.buttonRadius,
                border: `1px solid ${i === 1 ? theme.primary : theme.border}`,
                color: i === 1 ? theme.primary : theme.muted,
                background: i === 1 ? theme.surface : "transparent",
              }}
            >
              {slot}
            </div>
          ))}
        </div>
        <div className="pt-5">
          <Button theme={theme} onClick={() => onNavigate("dashboard")}>
            Confirm Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="h-full overflow-y-auto pb-14">
        <div className="flex flex-col items-center px-5 pt-4">
          <div
            className="flex h-12 w-12 items-center justify-center text-xs font-bold"
            style={{ background: theme.primary, color: theme.primaryText, borderRadius: "999px" }}
          >
            AC
          </div>
          <p className="mt-2 text-[11px] font-bold" style={{ color: theme.text }}>
            Alex Carter
          </p>
          <p className="text-[9px]" style={{ color: theme.muted }}>
            alex.carter@email.com
          </p>
        </div>
        <div className="mt-4 space-y-1.5 px-5">
          {["Personal information", "Notifications", "Privacy & security", "Help & support"].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-2.5 text-[10px]"
              style={{ background: theme.surface, borderRadius: theme.radius, color: theme.text }}
            >
              {item}
              <ChevronLeft className="h-3 w-3 rotate-180" style={{ color: theme.muted }} />
            </div>
          ))}
        </div>
      </div>
      <BottomNav theme={theme} active="profile" onNavigate={onNavigate} />
    </div>
  );
}

export const HEALTH_SCREENS: Record<HealthScreenId, { name: string; Component: (props: HealthScreenProps) => React.ReactNode }> = {
  splash: { name: "Splash Screen", Component: SplashScreen },
  signup: { name: "Sign Up", Component: SignUpScreen },
  signin: { name: "Sign In", Component: SignInScreen },
  dashboard: { name: "Dashboard", Component: DashboardScreen },
  appointment: { name: "Book Appointment", Component: AppointmentScreen },
  profile: { name: "Profile", Component: ProfileScreen },
};
