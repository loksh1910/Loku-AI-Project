"use client";

import { Bell, Calendar, ChevronLeft, Heart, Home, Shield, User } from "lucide-react";
import type { VariationTheme } from "./theme";

export type HealthScreenId = "splash" | "signup" | "signin" | "dashboard" | "appointment" | "profile";

export type HealthScreenProps = {
  theme: VariationTheme;
  onNavigate: (id: HealthScreenId) => void;
};

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
      className="w-full py-3 text-sm font-semibold transition-opacity hover:opacity-90"
      style={{
        borderRadius: theme.buttonRadius,
        background: variant === "solid" ? theme.primary : "transparent",
        color: variant === "solid" ? theme.primaryText : theme.primary,
        border: variant === "outline" ? `1.5px solid ${theme.primary}` : "none",
        fontFamily: theme.fontFamily,
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
      className="w-full px-4 py-3 text-sm outline-none"
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
    <div className="flex items-center gap-3 px-5 pt-6 pb-2">
      <button onClick={onBack} style={{ color: theme.text }} aria-label="Back">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="text-sm font-semibold" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
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
      className="absolute right-0 bottom-0 left-0 flex items-center justify-around border-t py-3"
      style={{ borderColor: theme.border, background: theme.bg }}
    >
      {items.map(({ id, icon: Icon }) => (
        <button key={id} onClick={() => onNavigate(id)} style={{ color: active === id ? theme.primary : theme.muted }}>
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}

export function SplashScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center px-6 pt-16" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <div className="flex items-center gap-1.5">
        <Shield className="h-6 w-6" style={{ color: theme.primary }} fill={theme.primary} fillOpacity={0.15} />
        <span className="text-lg font-bold" style={{ color: theme.primary }}>
          HealthVisor
        </span>
      </div>
      <div
        className="mt-10 flex h-24 w-24 items-center justify-center"
        style={{ background: theme.surface, borderRadius: theme.radius }}
      >
        <Heart className="h-10 w-10" style={{ color: theme.primary }} fill={theme.primary} fillOpacity={0.3} />
      </div>
      <p className="mt-6 text-2xl font-bold" style={{ color: theme.text, fontWeight: theme.headingWeight }}>
        Welcome!
      </p>
      <div className="mt-8 w-full space-y-3">
        <Button theme={theme} onClick={() => onNavigate("signup")}>
          Create Account
        </Button>
        <Button theme={theme} variant="outline" onClick={() => onNavigate("signin")}>
          Login
        </Button>
      </div>
      <p className="mt-6 text-xs" style={{ color: theme.muted }}>
        Sign-in through
      </p>
      <div className="mt-3 flex items-center gap-4">
        <span className="flex h-5 w-5 items-center justify-center text-sm font-bold" style={{ color: "#EA4335" }}>
          G
        </span>
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "#1877F2" }}
        >
          f
        </span>
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "#1DA1F2" }}
        >
          t
        </span>
      </div>
    </div>
  );
}

export function SignUpScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <BackHeader theme={theme} title="Create Account" onBack={() => onNavigate("splash")} />
      <div className="flex-1 space-y-3 px-6 pt-4">
        <Field theme={theme} placeholder="Full name" />
        <Field theme={theme} placeholder="Email address" type="email" />
        <Field theme={theme} placeholder="Password" type="password" />
        <div className="pt-3">
          <Button theme={theme} onClick={() => onNavigate("dashboard")}>
            Create Account
          </Button>
        </div>
        <button className="w-full pt-2 text-center text-xs" style={{ color: theme.muted }} onClick={() => onNavigate("signin")}>
          Already have an account? <span style={{ color: theme.primary }}>Log in</span>
        </button>
      </div>
    </div>
  );
}

export function SignInScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <BackHeader theme={theme} title="Sign In" onBack={() => onNavigate("splash")} />
      <div className="flex-1 space-y-3 px-6 pt-4">
        <Field theme={theme} placeholder="Email address" type="email" />
        <Field theme={theme} placeholder="Password" type="password" />
        <button className="block text-right text-xs" style={{ color: theme.primary, marginLeft: "auto" }}>
          Forgot password?
        </button>
        <div className="pt-3">
          <Button theme={theme} onClick={() => onNavigate("dashboard")}>
            Login
          </Button>
        </div>
        <button className="w-full pt-2 text-center text-xs" style={{ color: theme.muted }} onClick={() => onNavigate("signup")}>
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
    <div className="relative h-full w-full" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <p className="text-xs" style={{ color: theme.muted }}>
            Good morning
          </p>
          <p className="text-base font-bold" style={{ color: theme.text, fontWeight: theme.headingWeight }}>
            Alex Carter
          </p>
        </div>
        <Bell className="h-5 w-5" style={{ color: theme.text }} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 px-6">
        {stats.map((s) => (
          <div key={s.label} className="p-3" style={{ background: theme.surface, borderRadius: theme.radius }}>
            <p className="text-[10px]" style={{ color: theme.muted }}>
              {s.label}
            </p>
            <p className="text-sm font-bold" style={{ color: theme.text }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate("appointment")}
        className="mx-6 mt-4 flex w-[calc(100%-48px)] items-center justify-between p-4 text-left"
        style={{ background: theme.primary, borderRadius: theme.radius, boxShadow: theme.shadow }}
      >
        <div>
          <p className="text-xs" style={{ color: theme.primaryText, opacity: 0.8 }}>
            Upcoming
          </p>
          <p className="text-sm font-semibold" style={{ color: theme.primaryText }}>
            Book an Appointment
          </p>
        </div>
        <Calendar className="h-5 w-5" style={{ color: theme.primaryText }} />
      </button>
      <div className="px-6 pt-5">
        <p className="text-xs font-semibold" style={{ color: theme.text }}>
          Recent Activity
        </p>
        <div className="mt-2 space-y-2">
          {["Morning walk — 32 min", "Water intake — 6 glasses"].map((item) => (
            <div key={item} className="p-3 text-xs" style={{ background: theme.surface, borderRadius: theme.radius, color: theme.muted }}>
              {item}
            </div>
          ))}
        </div>
      </div>
      <BottomNav theme={theme} active="dashboard" onNavigate={onNavigate} />
    </div>
  );
}

export function AppointmentScreen({ theme, onNavigate }: HealthScreenProps) {
  return (
    <div className="relative h-full w-full" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <BackHeader theme={theme} title="Book Appointment" onBack={() => onNavigate("dashboard")} />
      <div className="px-6 pt-2">
        <div className="flex items-center gap-3 p-4" style={{ background: theme.surface, borderRadius: theme.radius }}>
          <div
            className="flex h-12 w-12 items-center justify-center text-sm font-bold"
            style={{ background: theme.primary, color: theme.primaryText, borderRadius: theme.buttonRadius }}
          >
            DR
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>
              Dr. Ramirez
            </p>
            <p className="text-xs" style={{ color: theme.muted }}>
              General Physician
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold" style={{ color: theme.text }}>
          Available slots
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["9:00 AM", "11:30 AM", "2:00 PM", "4:15 PM", "5:30 PM", "6:45 PM"].map((slot, i) => (
            <div
              key={slot}
              className="p-2 text-center text-xs"
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
        <div className="pt-6">
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
    <div className="relative h-full w-full" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <div className="flex flex-col items-center px-6 pt-8">
        <div
          className="flex h-16 w-16 items-center justify-center text-lg font-bold"
          style={{ background: theme.primary, color: theme.primaryText, borderRadius: "999px" }}
        >
          AC
        </div>
        <p className="mt-3 text-sm font-bold" style={{ color: theme.text }}>
          Alex Carter
        </p>
        <p className="text-xs" style={{ color: theme.muted }}>
          alex.carter@email.com
        </p>
      </div>
      <div className="mt-6 space-y-2 px-6">
        {["Personal information", "Notifications", "Privacy & security", "Help & support"].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-3 text-xs"
            style={{ background: theme.surface, borderRadius: theme.radius, color: theme.text }}
          >
            {item}
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" style={{ color: theme.muted }} />
          </div>
        ))}
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
