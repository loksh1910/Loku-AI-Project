"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronDown, Link2, Palette, Pipette, Save, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tip } from "@/components/ui/tip";
import {
  PRESET_STYLES,
  COLOR_SWATCHES,
  FONT_OPTIONS,
  CUSTOM_STEPS,
  STYLE_KEYWORDS,
  RADIUS_OPTIONS,
  SHADOW_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  SPACING_OPTIONS,
  STRUCTURE_OPTIONS,
  MOTION_OPTIONS,
  type CustomStepId,
} from "@/lib/design-style-data";
import { EMPTY_CUSTOM_DRAFT, type CustomDesignStyleDraft, type DesignStyle, type ImportChoice } from "@/components/design-style/design-style-types";

type ViewState = "choose" | CustomStepId;

// The gradient CTA buttons are Loku's own established brand gradient (see
// FilterDialog's Apply button, etc.) — kept identical in both themes on
// purpose, per the "don't touch the main design system" instruction below.
const GRADIENT_BUTTON = "flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-5 py-3.5 text-xs font-semibold text-white hover:opacity-90";

export function DesignStyleDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (style: DesignStyle) => void;
}) {
  const [view, setView] = useState<ViewState>("choose");
  const [choice, setChoice] = useState<ImportChoice>(null);
  const [draft, setDraft] = useState<CustomDesignStyleDraft>(EMPTY_CUSTOM_DRAFT);

  // Always land back on the main picker when the overlay is reopened — the
  // in-progress custom draft / import choice is kept, so an accidental close
  // doesn't lose anything.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to the entry view whenever the overlay opens, not deriving per-render state
    if (open) setView("choose");
  }, [open]);

  // Hard-unmount on close instead of relying on Base UI's own
  // animate-out-then-unmount timing, which gets stuck in this app — same
  // pattern as FilterDialog/TemplateDetailDialog/AuthDialog.
  if (!open) return null;

  function close() {
    onOpenChange(false);
  }

  function updateDraft(patch: Partial<CustomDesignStyleDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function applyChoice() {
    if (!choice) {
      toast("Pick a style, or paste a link / upload an image first.");
      return;
    }
    if (choice.kind === "preset") {
      const preset = PRESET_STYLES.find((p) => p.id === choice.id)!;
      onApply({ kind: "preset", id: preset.id, label: preset.label });
    } else if (choice.kind === "url") {
      const domain = choice.value.replace(/^https?:\/\//, "").split("/")[0] || "Imported style";
      onApply({ kind: "import", label: domain });
    } else {
      onApply({ kind: "import", label: choice.name });
    }
    close();
  }

  function applyCustom() {
    const label = draft.defineStyleAi ? "AI-decided style" : (draft.defineStyle ?? "Custom Style");
    onApply({ kind: "custom", label, ...draft });
    close();
  }

  const step = typeof view === "number" ? view : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[550px] w-[880px] max-w-[880px] flex-col gap-0 overflow-hidden rounded-[30px] border border-primary bg-popover p-0 text-foreground sm:max-w-[880px]"
      >
        <DialogTitle className="sr-only">Design Style</DialogTitle>

        <div className="flex shrink-0 items-center justify-between border-b border-border px-[30px] py-[22px]">
          <div className="flex items-center gap-2.5">
            {step !== null && step !== 6 && (
              <button
                onClick={() => setView(step === 1 ? "choose" : ((step - 1) as CustomStepId))}
                aria-label="Back"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Palette className="h-[17px] w-[17px] text-primary" />
            <span className="text-sm font-medium text-foreground">Design Style</span>
          </div>
          <Tip label="Close">
            <button onClick={close} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-[15px] w-[15px]" />
            </button>
          </Tip>
        </div>

        {view === "choose" ? (
          <ChoosePanel choice={choice} onChoiceChange={setChoice} onCreateOwn={() => setView(1)} onApply={applyChoice} />
        ) : (
          <CustomStepPanel
            step={view}
            draft={draft}
            onUpdate={updateDraft}
            onSkip={() => setView(view === 6 ? 6 : ((view + 1) as CustomStepId))}
            onContinue={() => setView(view === 6 ? 6 : ((view + 1) as CustomStepId))}
            onSaveAsPreset={() => toast("Preset saving coming soon.")}
            onApply={applyCustom}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoosePanel({
  choice,
  onChoiceChange,
  onCreateOwn,
  onApply,
}: {
  choice: ImportChoice;
  onChoiceChange: (choice: ImportChoice) => void;
  onCreateOwn: () => void;
  onApply: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-1/2 flex-col overflow-y-auto border-r border-border px-[30px] py-6">
          <h3 className="shrink-0 text-sm font-medium text-foreground">Choose a Style</h3>
          <p className="mt-1 shrink-0 text-xs text-muted-foreground">Start with a ready-made design system</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {PRESET_STYLES.map((style) => {
              const active = choice?.kind === "preset" && choice.id === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => onChoiceChange({ kind: "preset", id: style.id })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[15px] bg-secondary/60 p-2 pb-2.5 transition-colors",
                    active ? "ring-2 ring-primary" : "hover:bg-secondary",
                  )}
                >
                  <div className="relative h-[65px] w-full overflow-hidden rounded-[10px]">
                    <Image src={style.image} alt="" fill loading="eager" className="object-cover" sizes="130px" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{style.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-1/2 flex-col gap-4 px-[30px] py-6">
          <div>
            <h3 className="text-sm font-medium text-foreground">Import Style</h3>
            <p className="mt-1 text-xs text-muted-foreground">Paste a website URL or upload a design/image to extract its design system</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-[46px] border border-border py-2.5 pr-2.5 pl-[15px]">
            <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={choice?.kind === "url" ? choice.value : ""}
              onChange={(e) => onChoiceChange(e.target.value ? { kind: "url", value: e.target.value } : null)}
              placeholder="Paste website URL (e.g. dribbble.com, behance.net)"
              className="w-full min-w-0 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 flex-col items-center justify-center gap-1 rounded-[15px] border border-dashed border-border hover:border-primary/40"
          >
            <Upload className="h-[19px] w-[19px] text-primary" />
            <span className="max-w-[90%] truncate text-xs text-primary">{choice?.kind === "image" ? choice.name : "Upload images"}</span>
            <span className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onChoiceChange({ kind: "image", name: file.name });
            }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border px-[30px] py-5">
        <button
          onClick={onCreateOwn}
          className="flex items-center gap-2.5 rounded-[46px] border border-primary px-[15px] py-2.5 text-xs text-foreground hover:bg-primary/10"
        >
          Create your own
          <ArrowRight className="h-3 w-3" />
        </button>
        <button onClick={onApply} className={GRADIENT_BUTTON}>
          Apply
        </button>
      </div>
    </>
  );
}

function stepAiFlag(step: CustomStepId, draft: CustomDesignStyleDraft): boolean {
  switch (step) {
    case 1:
      return draft.defineStyleAi;
    case 2:
      return draft.colorsAi;
    case 3:
      return draft.typographyAi;
    case 4:
      return draft.componentAi;
    case 5:
      return draft.layoutAi;
    case 6:
      return draft.motionAi;
  }
}

function stepAiPatch(step: CustomStepId, draft: CustomDesignStyleDraft): Partial<CustomDesignStyleDraft> {
  switch (step) {
    case 1:
      return { defineStyleAi: !draft.defineStyleAi };
    case 2:
      return { colorsAi: !draft.colorsAi };
    case 3:
      return { typographyAi: !draft.typographyAi };
    case 4:
      return { componentAi: !draft.componentAi };
    case 5:
      return { layoutAi: !draft.layoutAi };
    case 6:
      return { motionAi: !draft.motionAi };
  }
}

function CustomStepPanel({
  step,
  draft,
  onUpdate,
  onSkip,
  onContinue,
  onSaveAsPreset,
  onApply,
}: {
  step: CustomStepId;
  draft: CustomDesignStyleDraft;
  onUpdate: (patch: Partial<CustomDesignStyleDraft>) => void;
  onSkip: () => void;
  onContinue: () => void;
  onSaveAsPreset: () => void;
  onApply: () => void;
}) {
  const meta = CUSTOM_STEPS.find((s) => s.id === step)!;
  const aiActive = stepAiFlag(step, draft);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-[30px] py-6">
      <div className="h-2 w-full shrink-0 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }} />
      </div>

      <h3 className="mt-5 shrink-0 text-sm font-medium text-foreground">{meta.title}</h3>
      <p className="mt-1 shrink-0 text-xs text-muted-foreground">{meta.subtitle}</p>

      <div className="mt-6 min-h-0 flex-1 space-y-7 overflow-y-auto">
        {step === 1 && (
          <PillGroup options={STYLE_KEYWORDS} value={draft.defineStyle} aiActive={aiActive} onSelect={(v) => onUpdate({ defineStyle: v })} />
        )}
        {step === 2 && (
          <>
            <div>
              <p className="mb-3 text-xs text-foreground">Primary color:</p>
              <ColorSwatchRow value={draft.primaryColor} aiActive={aiActive} onChange={(hex) => onUpdate({ primaryColor: hex })} />
            </div>
            <div>
              <p className="mb-3 text-xs text-foreground">Secondary color:</p>
              <ColorSwatchRow value={draft.secondaryColor} aiActive={aiActive} onChange={(hex) => onUpdate({ secondaryColor: hex })} />
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div>
              <p className="mb-3 text-xs text-foreground">Primary font:</p>
              <FontDropdown value={draft.primaryFont} aiActive={aiActive} onChange={(v) => onUpdate({ primaryFont: v })} />
            </div>
            <div>
              <p className="mb-3 text-xs text-foreground">Secondary font:</p>
              <FontDropdown value={draft.secondaryFont} aiActive={aiActive} onChange={(v) => onUpdate({ secondaryFont: v })} />
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <div>
              <p className="mb-3 text-xs text-foreground">Border radius:</p>
              <PillGroup options={RADIUS_OPTIONS} value={draft.borderRadius} aiActive={aiActive} onSelect={(v) => onUpdate({ borderRadius: v })} />
            </div>
            <div>
              <p className="mb-3 text-xs text-foreground">Shadows:</p>
              <PillGroup options={SHADOW_OPTIONS} value={draft.shadows} aiActive={aiActive} onSelect={(v) => onUpdate({ shadows: v })} />
            </div>
            <div>
              <p className="mb-3 text-xs text-foreground">Buttons:</p>
              <PillGroup options={BUTTON_STYLE_OPTIONS} value={draft.buttons} aiActive={aiActive} onSelect={(v) => onUpdate({ buttons: v })} />
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <div>
              <p className="mb-3 text-xs text-foreground">Spacing</p>
              <PillGroup options={SPACING_OPTIONS} value={draft.spacing} aiActive={aiActive} onSelect={(v) => onUpdate({ spacing: v })} />
            </div>
            <div>
              <p className="mb-3 text-xs text-foreground">Structure</p>
              <PillGroup options={STRUCTURE_OPTIONS} value={draft.structure} aiActive={aiActive} onSelect={(v) => onUpdate({ structure: v })} />
            </div>
          </>
        )}
        {step === 6 && (
          <PillGroup options={MOTION_OPTIONS} value={draft.motion} aiActive={aiActive} onSelect={(v) => onUpdate({ motion: v })} />
        )}
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between">
        <AiDecideToggle active={aiActive} onToggle={() => onUpdate(stepAiPatch(step, draft))} />
        {step < 6 ? (
          <div className="flex items-center gap-6">
            <button onClick={onSkip} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Skip this
            </button>
            <button onClick={onContinue} className={GRADIENT_BUTTON}>
              Continue
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <button onClick={onSaveAsPreset} className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Save className="h-4 w-4" />
              Save as Preset
            </button>
            <button onClick={onApply} className={GRADIENT_BUTTON}>
              Apply Style
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PillGroup({
  options,
  value,
  aiActive,
  onSelect,
}: {
  options: string[];
  value: string | null;
  aiActive: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[15px]">
      {options.map((opt) => {
        const active = !aiActive && value === opt;
        return (
          <button
            key={opt}
            disabled={aiActive}
            onClick={() => onSelect(opt)}
            className={cn(
              "rounded-[15px] border px-[15px] py-[5px] text-xs font-medium whitespace-nowrap transition-colors",
              aiActive
                ? "cursor-not-allowed border-border text-muted-foreground/50"
                : active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ColorSwatchRow({ value, aiActive, onChange }: { value: string | null; aiActive: boolean; onChange: (hex: string) => void }) {
  const isCustom = !!value && !COLOR_SWATCHES.includes(value);
  return (
    <div className={cn("flex items-center gap-3", aiActive && "pointer-events-none opacity-30")}>
      {COLOR_SWATCHES.map((hex) => (
        <button
          key={hex}
          aria-label={hex}
          onClick={() => onChange(hex)}
          className={cn("h-9 w-9 shrink-0 rounded-full transition-all", value === hex ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "hover:opacity-80")}
          style={{ background: hex }}
        />
      ))}
      <label
        className={cn(
          "relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border",
          isCustom ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "border-primary/60",
        )}
        style={isCustom ? { background: value! } : undefined}
      >
        <Pipette className={cn("h-4 w-4", isCustom ? "text-white mix-blend-difference" : "text-primary")} />
        <input
          type="color"
          aria-label="Custom color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={isCustom ? value! : "#6b3ff4"}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

function FontDropdown({ value, aiActive, onChange }: { value: string | null; aiActive: boolean; onChange: (value: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={cn("relative w-[297px]", aiActive && "pointer-events-none opacity-30")}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[46px] border border-border py-2.5 pr-2.5 pl-[15px] text-[11px] text-foreground"
      >
        {value ?? "Modern Sans"}
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </button>
      {menuOpen && (
        <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-popover py-1 shadow-xl">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => {
                onChange(f);
                setMenuOpen(false);
              }}
              className={cn("block w-full px-4 py-2 text-left text-xs hover:bg-secondary", f === value ? "text-primary" : "text-foreground")}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AiDecideToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={active}
      className="flex items-center gap-2.5 rounded-[46px] border border-primary p-[10px] text-xs text-primary"
    >
      <Sparkles className="h-[15px] w-[15px]" />
      Let AI decide
      <span className={cn("relative h-4 w-[29px] shrink-0 rounded-full transition-colors", active ? "bg-primary" : "bg-muted")}>
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform",
            active && "translate-x-[13px]",
          )}
        />
      </span>
    </button>
  );
}
