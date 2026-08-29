"use client";

import { Bell, Calendar, ChevronLeft, Heart, Home, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariationTheme } from "./theme";

export type HealthScreenId = "splash" | "signup" | "signin" | "dashboard" | "appointment" | "profile";

/** Text edited via Present Mode's / AI mode's Edit tool, keyed by a stable id
 * per text node (e.g. "splash.welcome") — kept separate from the screen
 * content itself so switching variations/themes never touches an edit, and
 * an edit never has to know which theme it was made under. */
export type TextOverrides = Record<string, string>;

export type HealthScreenProps = {
  theme: VariationTheme;
  onNavigate: (id: HealthScreenId) => void;
  /** Whether the Edit tool (pencil icon, Present Mode's top toolbar / AI
   * mode's right toolbar) is active — every editable text node in these
   * screens only turns into a contentEditable field while this is true, so
   * normal rendering (pointer/select/hand tools) is exactly as before. */
  editable?: boolean;
  overrides?: TextOverrides;
  onTextChange?: (id: string, text: string) => void;
  /** Whether AI mode's "Select element" tool is active — every taggable node
   * in these screens (buttons, text, icons, cards) becomes click-to-tag
   * (with a hover outline) while this is true, calling `onSelectElement`
   * with a short human label (e.g. "Create Account button") instead of
   * performing its normal action. In practice mutually exclusive with
   * `editable` — the two tools are never both active at once. */
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
};

/** Shared hover-to-select affordance for every taggable node below — a
 * dashed outline that only appears on hover (unlike `editable`'s always-on
 * outline) since dozens of these exist per screen and an always-on outline
 * on all of them at once would be too noisy. */
const SELECT_HOVER_CLASS =
  "cursor-pointer rounded-sm outline-dashed outline-1 outline-transparent transition-colors hover:outline-primary hover:bg-primary/10";

/** pointerdown must be stopped too (not just click) since the screen's outer
 * wrapper listens on pointerdown for its own whole-item drag/select — same
 * reasoning as EditableText's existing editable-mode stopPropagation. */
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

/** Editable/selectable-text passthrough shared by every screen below — one
 * small isolated leaf per text node (never wrapping other React-managed
 * children), which is what keeps this safe: React never has to reconcile
 * DOM that contentEditable mutated out from under it. */
function EditableText({
  id,
  value,
  editable,
  overrides,
  onTextChange,
  selectable,
  onSelectElement,
  elementLabel,
  as: Tag = "span",
  className,
  style,
}: {
  id: string;
  value: string;
  editable?: boolean;
  overrides?: TextOverrides;
  onTextChange?: (id: string, text: string) => void;
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
  /** Tag sent to onSelectElement — defaults to the node's own text. */
  elementLabel?: string;
  as?: "span" | "p";
  className?: string;
  style?: React.CSSProperties;
}) {
  const text = overrides?.[id] ?? value;
  if (editable) {
    return (
      <Tag
        className={cn(className, "cursor-text rounded-sm outline-dashed outline-1 outline-primary outline-offset-2")}
        style={style}
        contentEditable
        suppressContentEditableWarning
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => onTextChange?.(id, e.currentTarget.textContent ?? "")}
      >
        {text}
      </Tag>
    );
  }
  if (selectable) {
    return (
      <Tag
        className={cn(className, SELECT_HOVER_CLASS)}
        style={style}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement?.(elementLabel ?? text);
        }}
      >
        {text}
      </Tag>
    );
  }
  return (
    <Tag className={className} style={style}>
      {text}
    </Tag>
  );
}

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
  textId,
  editable,
  overrides,
  onTextChange,
  selectable,
  onSelectElement,
}: {
  theme: VariationTheme;
  variant?: "solid" | "outline";
  children: string;
  onClick?: () => void;
  textId: string;
  editable?: boolean;
  overrides?: TextOverrides;
  onTextChange?: (id: string, text: string) => void;
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
}) {
  return (
    <button
      onClick={(e) => {
        if (selectable) {
          e.stopPropagation();
          onSelectElement?.(`${overrides?.[textId] ?? children} button`);
          return;
        }
        onClick?.();
      }}
      onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
      className={cn("w-full py-2.5 text-[11px] font-semibold transition-opacity hover:opacity-90", selectable && SELECT_HOVER_CLASS)}
      style={{
        borderRadius: theme.buttonRadius,
        background: variant === "solid" ? theme.primary : "transparent",
        color: variant === "solid" ? theme.primaryText : theme.primary,
        border: variant === "outline" ? `1.5px solid ${theme.primary}` : "none",
        fontFamily: theme.fontFamily,
        boxShadow: variant === "solid" ? theme.shadow : "none",
      }}
    >
      <EditableText id={textId} value={children} editable={editable} overrides={overrides} onTextChange={onTextChange} />
    </button>
  );
}

function Field({
  theme,
  placeholder,
  type = "text",
  selectable,
  onSelectElement,
}: {
  theme: VariationTheme;
  placeholder: string;
  type?: string;
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      readOnly={selectable}
      className={cn("w-full px-3.5 py-2.5 text-[11px] outline-none", selectable && SELECT_HOVER_CLASS)}
      style={{
        borderRadius: theme.buttonRadius,
        border: `1px solid ${theme.border}`,
        background: theme.surface,
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
      onFocus={selectable ? (e) => e.currentTarget.blur() : undefined}
      {...selectHandlers(`${placeholder} field`, selectable, onSelectElement)}
    />
  );
}

function BackHeader({
  theme,
  title,
  titleId,
  onBack,
  editable,
  overrides,
  onTextChange,
  selectable,
  onSelectElement,
}: {
  theme: VariationTheme;
  title: string;
  titleId: string;
  onBack: () => void;
  editable?: boolean;
  overrides?: TextOverrides;
  onTextChange?: (id: string, text: string) => void;
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3 pb-1">
      <button
        onClick={(e) => {
          if (selectable) {
            e.stopPropagation();
            onSelectElement?.("Back icon");
            return;
          }
          onBack();
        }}
        onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
        style={{ color: theme.text }}
        aria-label="Back"
        className={cn(selectable && SELECT_HOVER_CLASS)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <EditableText
        id={titleId}
        value={title}
        editable={editable}
        overrides={overrides}
        onTextChange={onTextChange}
        selectable={selectable}
        onSelectElement={onSelectElement}
        as="p"
        className="text-xs font-semibold"
        style={{ color: theme.text, fontFamily: theme.fontFamily }}
      />
    </div>
  );
}

function BottomNav({
  theme,
  active,
  onNavigate,
  selectable,
  onSelectElement,
}: {
  theme: VariationTheme;
  active: HealthScreenId;
  onNavigate: (id: HealthScreenId) => void;
  selectable?: boolean;
  onSelectElement?: (label: string) => void;
}) {
  const items: { id: HealthScreenId; icon: typeof Home; label: string }[] = [
    { id: "dashboard", icon: Home, label: "Dashboard nav icon" },
    { id: "appointment", icon: Calendar, label: "Appointment nav icon" },
    { id: "profile", icon: User, label: "Profile nav icon" },
  ];
  return (
    <div
      className="absolute right-0 bottom-0 left-0 flex items-center justify-around border-t py-2.5"
      style={{ borderColor: theme.border, background: theme.bg }}
    >
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={(e) => {
            if (selectable) {
              e.stopPropagation();
              onSelectElement?.(label);
              return;
            }
            onNavigate(id);
          }}
          onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
          style={{ color: active === id ? theme.primary : theme.muted }}
          className={cn(selectable && SELECT_HOVER_CLASS)}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export function SplashScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="flex w-full flex-1 flex-col items-center px-5 pt-8">
        <div className="flex items-center gap-1">
          <Shield
            className={cn("h-3.5 w-3.5", selectable && SELECT_HOVER_CLASS)}
            style={{ color: theme.primary }}
            fill={theme.primary}
            fillOpacity={0.15}
            {...selectHandlers("Shield icon", selectable, onSelectElement)}
          />
          <EditableText
            id="splash.brand"
            value="HealthVisor"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
            className="text-[11px] font-bold"
            style={{ color: theme.primary }}
          />
        </div>
        <div
          className="mt-8 flex h-14 w-14 items-center justify-center"
          style={{ background: theme.surface, borderRadius: theme.radius }}
        >
          <Heart
            className={cn("h-6 w-6", selectable && SELECT_HOVER_CLASS)}
            style={{ color: theme.primary }}
            fill={theme.primary}
            fillOpacity={0.3}
            {...selectHandlers("Heart icon", selectable, onSelectElement)}
          />
        </div>
        <EditableText
          id="splash.welcome"
          value="Welcome!"
          editable={editable}
          overrides={overrides}
          onTextChange={onTextChange}
          selectable={selectable}
          onSelectElement={onSelectElement}
          as="p"
          className="mt-4 text-base font-bold"
          style={{ color: theme.text, fontWeight: theme.headingWeight }}
        />
        <EditableText
          id="splash.subtext"
          value="Your personal companion for clinical precision and empathetic care."
          editable={editable}
          overrides={overrides}
          onTextChange={onTextChange}
          selectable={selectable}
          onSelectElement={onSelectElement}
          as="p"
          className="mt-1 text-center text-[10px]"
          style={{ color: theme.muted }}
        />
        <div className="mt-6 w-full space-y-2">
          <Button
            theme={theme}
            onClick={() => onNavigate("signup")}
            textId="splash.createAccount"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
          >
            Create Account
          </Button>
          <Button
            theme={theme}
            variant="outline"
            onClick={() => onNavigate("signin")}
            textId="splash.login"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
          >
            Login
          </Button>
        </div>
        <EditableText
          id="splash.signinThrough"
          value="Sign-in through"
          editable={editable}
          overrides={overrides}
          onTextChange={onTextChange}
          selectable={selectable}
          onSelectElement={onSelectElement}
          as="p"
          className="mt-4 text-[9px]"
          style={{ color: theme.muted }}
        />
        <div className="mt-2 flex items-center gap-3">
          <span
            className={cn("flex h-4 w-4 items-center justify-center text-[10px] font-bold", selectable && SELECT_HOVER_CLASS)}
            style={{ color: "#EA4335" }}
            {...selectHandlers("Google icon", selectable, onSelectElement)}
          >
            G
          </span>
          <span
            className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white", selectable && SELECT_HOVER_CLASS)}
            style={{ background: "#1877F2" }}
            {...selectHandlers("Facebook icon", selectable, onSelectElement)}
          >
            f
          </span>
          <span
            className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white", selectable && SELECT_HOVER_CLASS)}
            style={{ background: "#1DA1F2" }}
            {...selectHandlers("Twitter icon", selectable, onSelectElement)}
          >
            t
          </span>
        </div>
      </div>
    </div>
  );
}

export function SignUpScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader
        theme={theme}
        title="Create Account"
        titleId="signup.title"
        onBack={() => onNavigate("splash")}
        editable={editable}
        overrides={overrides}
        onTextChange={onTextChange}
        selectable={selectable}
        onSelectElement={onSelectElement}
      />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Field theme={theme} placeholder="Full name" selectable={selectable} onSelectElement={onSelectElement} />
        <Field theme={theme} placeholder="Email address" type="email" selectable={selectable} onSelectElement={onSelectElement} />
        <Field theme={theme} placeholder="Password" type="password" selectable={selectable} onSelectElement={onSelectElement} />
        <div className="pt-2">
          <Button
            theme={theme}
            onClick={() => onNavigate("dashboard")}
            textId="signup.createAccount"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
          >
            Create Account
          </Button>
        </div>
        <button
          className={cn("w-full pt-1 text-center text-[10px]", selectable && SELECT_HOVER_CLASS)}
          style={{ color: theme.muted }}
          onClick={(e) => {
            if (selectable) {
              e.stopPropagation();
              onSelectElement?.("Log in link");
              return;
            }
            onNavigate("signin");
          }}
          onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
        >
          Already have an account? <span style={{ color: theme.primary }}>Log in</span>
        </button>
      </div>
    </div>
  );
}

export function SignInScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader
        theme={theme}
        title="Sign In"
        titleId="signin.title"
        onBack={() => onNavigate("splash")}
        editable={editable}
        overrides={overrides}
        onTextChange={onTextChange}
        selectable={selectable}
        onSelectElement={onSelectElement}
      />
      <div className="flex-1 space-y-2.5 px-5 pt-3">
        <Field theme={theme} placeholder="Email address" type="email" selectable={selectable} onSelectElement={onSelectElement} />
        <Field theme={theme} placeholder="Password" type="password" selectable={selectable} onSelectElement={onSelectElement} />
        <EditableText
          id="signin.forgot"
          value="Forgot password?"
          editable={editable}
          overrides={overrides}
          onTextChange={onTextChange}
          selectable={selectable}
          onSelectElement={onSelectElement}
          className="block text-right text-[10px]"
          style={{ color: theme.primary, marginLeft: "auto" }}
        />
        <div className="pt-2">
          <Button
            theme={theme}
            onClick={() => onNavigate("dashboard")}
            textId="signin.login"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
          >
            Login
          </Button>
        </div>
        <button
          className={cn("w-full pt-1 text-center text-[10px]", selectable && SELECT_HOVER_CLASS)}
          style={{ color: theme.muted }}
          onClick={(e) => {
            if (selectable) {
              e.stopPropagation();
              onSelectElement?.("Sign up link");
              return;
            }
            onNavigate("signup");
          }}
          onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
        >
          Don&rsquo;t have an account? <span style={{ color: theme.primary }}>Sign up</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  const stats = [
    { label: "Heart Rate", value: "72 bpm" },
    { label: "Sleep", value: "7h 40m" },
  ];
  const activity = ["Morning walk — 32 min", "Water intake — 6 glasses"];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="h-full overflow-y-auto pb-14">
        <div className="flex items-center justify-between px-5 pt-3">
          <div>
            <EditableText
              id="dashboard.greeting"
              value="Good morning"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              selectable={selectable}
              onSelectElement={onSelectElement}
              as="p"
              className="text-[9px]"
              style={{ color: theme.muted }}
            />
            <EditableText
              id="dashboard.name"
              value="Alex Carter"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              selectable={selectable}
              onSelectElement={onSelectElement}
              as="p"
              className="text-xs font-bold"
              style={{ color: theme.text, fontWeight: theme.headingWeight }}
            />
          </div>
          <div className="flex h-6 w-6 items-center justify-center" style={{ background: theme.surface, borderRadius: "999px" }}>
            <Bell
              className={cn("h-3 w-3", selectable && SELECT_HOVER_CLASS)}
              style={{ color: theme.text }}
              {...selectHandlers("Notifications icon", selectable, onSelectElement)}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 px-5">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn("p-2.5", selectable && SELECT_HOVER_CLASS)}
              style={{ background: theme.surface, borderRadius: theme.radius }}
              {...selectHandlers(`${s.label} card`, selectable, onSelectElement)}
            >
              <EditableText
                id={`dashboard.stat.${i}.label`}
                value={s.label}
                editable={editable}
                overrides={overrides}
                onTextChange={onTextChange}
                selectable={selectable}
                onSelectElement={onSelectElement}
                as="p"
                className="text-[8px]"
                style={{ color: theme.muted }}
              />
              <EditableText
                id={`dashboard.stat.${i}.value`}
                value={s.value}
                editable={editable}
                overrides={overrides}
                onTextChange={onTextChange}
                selectable={selectable}
                onSelectElement={onSelectElement}
                as="p"
                className="text-[11px] font-bold"
                style={{ color: theme.text }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={(e) => {
            if (selectable) {
              e.stopPropagation();
              onSelectElement?.("Book an Appointment button");
              return;
            }
            onNavigate("appointment");
          }}
          onPointerDown={selectable ? (e) => e.stopPropagation() : undefined}
          className={cn("mx-5 mt-3 flex w-[calc(100%-40px)] items-center justify-between p-3 text-left", selectable && SELECT_HOVER_CLASS)}
          style={{ background: theme.primary, borderRadius: theme.radius, boxShadow: theme.shadow }}
        >
          <div>
            <EditableText
              id="dashboard.upcoming"
              value="Upcoming"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              as="p"
              className="text-[8px]"
              style={{ color: theme.primaryText, opacity: 0.8 }}
            />
            <EditableText
              id="dashboard.bookAppointment"
              value="Book an Appointment"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              as="p"
              className="text-[10px] font-semibold"
              style={{ color: theme.primaryText }}
            />
          </div>
          <Calendar
            className={cn("h-4 w-4", selectable && SELECT_HOVER_CLASS)}
            style={{ color: theme.primaryText }}
            {...selectHandlers("Calendar icon", selectable, onSelectElement)}
          />
        </button>
        <div className="px-5 pt-4">
          <EditableText
            id="dashboard.recentActivity"
            value="Recent Activity"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
            as="p"
            className="text-[10px] font-semibold"
            style={{ color: theme.text }}
          />
          <div className="mt-1.5 space-y-1.5">
            {activity.map((item, i) => (
              <div
                key={item}
                className={cn("p-2.5 text-[9px]", selectable && SELECT_HOVER_CLASS)}
                style={{ background: theme.surface, borderRadius: theme.radius, color: theme.muted }}
                {...selectHandlers(`${item} card`, selectable, onSelectElement)}
              >
                <EditableText
                  id={`dashboard.activity.${i}`}
                  value={item}
                  editable={editable}
                  overrides={overrides}
                  onTextChange={onTextChange}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav theme={theme} active="dashboard" onNavigate={onNavigate} selectable={selectable} onSelectElement={onSelectElement} />
    </div>
  );
}

export function AppointmentScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  return (
    <div className="relative h-full w-full" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <BackHeader
        theme={theme}
        title="Book Appointment"
        titleId="appointment.title"
        onBack={() => onNavigate("dashboard")}
        editable={editable}
        overrides={overrides}
        onTextChange={onTextChange}
        selectable={selectable}
        onSelectElement={onSelectElement}
      />
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2.5 p-3" style={{ background: theme.surface, borderRadius: theme.radius }}>
          <div
            className={cn("flex h-9 w-9 shrink-0 items-center justify-center text-[10px] font-bold", selectable && SELECT_HOVER_CLASS)}
            style={{ background: theme.primary, color: theme.primaryText, borderRadius: theme.buttonRadius }}
            {...selectHandlers("Doctor avatar", selectable, onSelectElement)}
          >
            DR
          </div>
          <div>
            <EditableText
              id="appointment.doctorName"
              value="Dr. Ramirez"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              selectable={selectable}
              onSelectElement={onSelectElement}
              as="p"
              className="text-[11px] font-semibold"
              style={{ color: theme.text }}
            />
            <EditableText
              id="appointment.doctorRole"
              value="General Physician"
              editable={editable}
              overrides={overrides}
              onTextChange={onTextChange}
              selectable={selectable}
              onSelectElement={onSelectElement}
              as="p"
              className="text-[9px]"
              style={{ color: theme.muted }}
            />
          </div>
        </div>
        <EditableText
          id="appointment.availableSlots"
          value="Available slots"
          editable={editable}
          overrides={overrides}
          onTextChange={onTextChange}
          selectable={selectable}
          onSelectElement={onSelectElement}
          as="p"
          className="mt-4 text-[10px] font-semibold"
          style={{ color: theme.text }}
        />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {["9:00 AM", "11:30 AM", "2:00 PM", "4:15 PM", "5:30 PM", "6:45 PM"].map((slot, i) => (
            <div
              key={slot}
              className={cn("p-1.5 text-center text-[9px]", selectable && SELECT_HOVER_CLASS)}
              style={{
                borderRadius: theme.buttonRadius,
                border: `1px solid ${i === 1 ? theme.primary : theme.border}`,
                color: i === 1 ? theme.primary : theme.muted,
                background: i === 1 ? theme.surface : "transparent",
              }}
              {...selectHandlers(`${slot} slot`, selectable, onSelectElement)}
            >
              {slot}
            </div>
          ))}
        </div>
        <div className="pt-5">
          <Button
            theme={theme}
            onClick={() => onNavigate("dashboard")}
            textId="appointment.confirm"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
          >
            Confirm Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ theme, onNavigate, editable, overrides, onTextChange, selectable, onSelectElement }: HealthScreenProps) {
  const items = ["Personal information", "Notifications", "Privacy & security", "Help & support"];
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: theme.bg, fontFamily: theme.fontFamily }}>
      <StatusBar theme={theme} />
      <div className="h-full overflow-y-auto pb-14">
        <div className="flex flex-col items-center px-5 pt-4">
          <div
            className={cn("flex h-12 w-12 items-center justify-center text-xs font-bold", selectable && SELECT_HOVER_CLASS)}
            style={{ background: theme.primary, color: theme.primaryText, borderRadius: "999px" }}
            {...selectHandlers("Profile avatar", selectable, onSelectElement)}
          >
            AC
          </div>
          <EditableText
            id="profile.name"
            value="Alex Carter"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
            as="p"
            className="mt-2 text-[11px] font-bold"
            style={{ color: theme.text }}
          />
          <EditableText
            id="profile.email"
            value="alex.carter@email.com"
            editable={editable}
            overrides={overrides}
            onTextChange={onTextChange}
            selectable={selectable}
            onSelectElement={onSelectElement}
            as="p"
            className="text-[9px]"
            style={{ color: theme.muted }}
          />
        </div>
        <div className="mt-4 space-y-1.5 px-5">
          {items.map((item, i) => (
            <div
              key={item}
              className={cn("flex items-center justify-between p-2.5 text-[10px]", selectable && SELECT_HOVER_CLASS)}
              style={{ background: theme.surface, borderRadius: theme.radius, color: theme.text }}
              {...selectHandlers(`${item} row`, selectable, onSelectElement)}
            >
              <EditableText id={`profile.item.${i}`} value={item} editable={editable} overrides={overrides} onTextChange={onTextChange} />
              <ChevronLeft
                className={cn("h-3 w-3 rotate-180", selectable && SELECT_HOVER_CLASS)}
                style={{ color: theme.muted }}
                {...selectHandlers(`${item} arrow icon`, selectable, onSelectElement)}
              />
            </div>
          ))}
        </div>
      </div>
      <BottomNav theme={theme} active="profile" onNavigate={onNavigate} selectable={selectable} onSelectElement={onSelectElement} />
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
