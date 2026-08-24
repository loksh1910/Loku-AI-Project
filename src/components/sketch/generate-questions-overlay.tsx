"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Link2, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type IllustrationQuadrant = "q1" | "q2" | "q3" | "q4";

const QUADRANT_POSITION: Record<IllustrationQuadrant, string> = {
  q1: "0% 0%",
  q2: "100% 0%",
  q3: "0% 100%",
  q4: "100% 100%",
};

type PillsStep = {
  kind: "pills";
  options: string[];
  columns?: "wrap" | "stack";
};
type CardsStep = {
  kind: "cards";
  options: { value: string; label: string }[];
};
type LinkUploadStep = { kind: "link-upload" };
type TextareaStep = { kind: "textarea"; placeholder: string };

type QuestionStep = {
  key: string;
  title: string;
  subtitle: string;
  hasAiDecide: boolean;
  illustration?: IllustrationQuadrant;
} & (PillsStep | CardsStep | LinkUploadStep | TextareaStep);

const STEPS: QuestionStep[] = [
  {
    key: "type",
    title: "What are you building?",
    subtitle: "Choose the type of product you want to create.",
    hasAiDecide: true,
    kind: "pills",
    options: ["Mobile App", "Web App", "Website", "Dashboard", "E-commerce", "Other"],
  },
  {
    key: "domain",
    title: "What kind of product is this?",
    subtitle: "Select the domain or industry your product belongs to.",
    hasAiDecide: true,
    kind: "pills",
    options: ["E-commerce", "Fintech", "Social / Community", "Healthcare", "Education", "SaaS / Productivity", "Other"],
  },
  {
    key: "style",
    title: "What style are you going for?",
    subtitle: "Pick a vibe or let AI decide.",
    hasAiDecide: true,
    kind: "pills",
    illustration: "q2",
    options: ["Clean & minimal", "Modern & bold", "Playful", "Professional", "Futuristic"],
  },
  {
    key: "designSystem",
    title: "How should the design system be handled?",
    subtitle: "Control how consistent styling and components are applied.",
    hasAiDecide: true,
    kind: "pills",
    columns: "stack",
    options: ["Use a consistent design system", "Customize later manually"],
  },
  {
    key: "optionsCount",
    title: "How many options do you want?",
    subtitle: "More options = more creative directions.",
    hasAiDecide: true,
    kind: "cards",
    illustration: "q3",
    options: [
      { value: "1", label: "Focused" },
      { value: "2", label: "Balanced" },
      { value: "3", label: "Explore more" },
    ],
  },
  {
    key: "inspiration",
    title: "Do you have any inspiration?",
    subtitle: "Share a link or upload something you like.",
    hasAiDecide: true,
    kind: "link-upload",
    illustration: "q4",
  },
  {
    key: "extra",
    title: "Anything else you want to add?",
    subtitle: "",
    hasAiDecide: false,
    kind: "textarea",
    placeholder: "Include features, layout ideas, tone, or specific requirements.",
  },
];

export type GenerateAnswers = {
  selections: Record<string, string>;
  aiDecide: Record<string, boolean>;
  inspirationLink: string;
  inspirationFileName: string | null;
  extraNotes: string;
};

function AiDecideToggle({ active }: { active: boolean }) {
  return (
    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" className="shrink-0">
      <path
        d="M12 4H5C2.79086 4 1 5.79086 1 8C1 10.2091 2.79086 12 5 12H12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4Z"
        className={cn("transition-colors", active ? "fill-primary stroke-primary" : "fill-[#303030] stroke-[#303030]")}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="8" r="4" fill="white" className={cn("transition-transform", active && "translate-x-[7px]")} />
    </svg>
  );
}

function Illustration({ quadrant, className }: { quadrant: IllustrationQuadrant; className?: string }) {
  return (
    <div
      className={cn("shrink-0 overflow-hidden rounded-2xl", className)}
      style={{
        backgroundImage: "url(/images/question-illustration.png)",
        backgroundSize: "200% 200%",
        backgroundPosition: QUADRANT_POSITION[quadrant],
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function GenerateQuestionsOverlay({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (answers: GenerateAnswers) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [aiDecide, setAiDecide] = useState<Record<string, boolean>>({});
  const [inspirationLink, setInspirationLink] = useState("");
  const [inspirationFileName, setInspirationFileName] = useState<string | null>(null);
  const [extraNotes, setExtraNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function selectOption(value: string) {
    setSelections((prev) => ({ ...prev, [step.key]: prev[step.key] === value ? "" : value }));
  }

  function toggleAiDecide() {
    setAiDecide((prev) => ({ ...prev, [step.key]: !prev[step.key] }));
  }

  function advance() {
    if (isLast) {
      onComplete({ selections, aiDecide, inspirationLink, inspirationFileName, extraNotes });
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function skip() {
    setSelections((prev) => ({ ...prev, [step.key]: "" }));
    advance();
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const selected = selections[step.key];
  const aiActive = aiDecide[step.key];

  return (
    <div className="absolute bottom-[78px] left-1/2 z-40 flex h-[420px] w-[626px] -translate-x-1/2 flex-col rounded-[30px] border border-primary bg-popover p-6">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Sparkles className="h-[17px] w-[17px] text-white/80" />
        <p className="text-sm font-medium text-white/80">Let&rsquo;s refine your idea</p>
      </div>
      <p className="mb-5 text-center text-xs text-white/80">I&rsquo;ll ask you a few quick questions to get started.</p>

      {stepIndex > 0 ? (
        <button
          onClick={goBack}
          aria-label="Back"
          className="absolute top-6 left-6 text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : null}
      <button onClick={onClose} aria-label="Close" className="absolute top-6 right-6 text-white/60 hover:text-white">
        <X className="h-5 w-5" />
      </button>
      <p className="absolute top-7 right-14 text-[10px] text-white/40">
        {stepIndex + 1}/{STEPS.length}
      </p>

      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <p className="mb-1 text-sm font-medium text-white">{step.title}</p>
          {step.subtitle && <p className="mb-4 text-xs text-white/80">{step.subtitle}</p>}

          {step.kind === "pills" && (
            <div className={cn("flex flex-wrap gap-3", step.columns === "stack" && "flex-col items-start")}>
              {step.options.map((option) => (
                <button
                  key={option}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "rounded-2xl border px-4 py-1.5 text-xs font-medium transition-colors",
                    selected === option
                      ? "border-primary bg-primary text-white"
                      : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/80",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {step.kind === "cards" && (
            <div className="flex gap-3">
              {step.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "flex h-[76px] w-[100px] flex-col items-center justify-center gap-1.5 rounded-2xl border transition-colors",
                    selected === option.value
                      ? "border-primary bg-primary/15"
                      : "border-white/10 bg-[#18181a] hover:border-white/20",
                  )}
                >
                  <span className="text-base text-white/70">{option.value}</span>
                  <span className="text-xs font-medium text-white/70">{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {step.kind === "link-upload" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 rounded-[46px] border border-white/20 py-2.5 pr-2.5 pl-4">
                <Link2 className="h-5 w-5 shrink-0 text-white/60" />
                <input
                  value={inspirationLink}
                  onChange={(e) => setInspirationLink(e.target.value)}
                  placeholder="Paste website URL (e.g. dribbble.com, behance.net)"
                  className="w-full bg-transparent text-[11px] text-white/80 outline-none placeholder:text-white/60"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/20 py-3 hover:border-white/40"
              >
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary">Upload images</span>
                <span className="text-[10px] text-white/60">PNG, JPG up to 10MB</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setInspirationFileName(e.target.files?.[0]?.name ?? null)}
              />
              {inspirationFileName && <p className="text-[10px] text-white/60">Selected: {inspirationFileName}</p>}
            </div>
          )}

          {step.kind === "textarea" && (
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder={step.placeholder}
              className="h-[100px] w-full resize-none rounded-2xl border border-white/20 p-3 text-xs text-white/80 outline-none placeholder:text-white/60"
            />
          )}
        </div>

        {step.illustration && <Illustration quadrant={step.illustration} className="h-[152px] w-[152px] self-center" />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {step.hasAiDecide ? (
          <button
            onClick={toggleAiDecide}
            className={cn(
              "flex items-center gap-2.5 rounded-[46px] border-[0.5px] border-primary px-2.5 py-2.5 text-xs text-primary transition-colors",
              aiActive && "bg-primary/15",
            )}
          >
            <Sparkles className="h-[15px] w-[15px]" />
            Let AI decide
            <AiDecideToggle active={!!aiActive} />
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-5">
          <button onClick={skip} className="text-xs font-medium text-white/60 hover:text-white/80">
            Skip this
          </button>
          <button
            onClick={advance}
            className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8E51FF] px-5 py-3.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Continue
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
