"use client";

import { useState } from "react";
import type { PresentPanel } from "@/components/present/present-left-rail";
import { PresentScreensPanel } from "@/components/present/present-screens-panel";
import { AiAssistantOverlay } from "@/components/present/ai-assistant-overlay";
import type { PresentTool } from "@/components/present/present-top-toolbar";
import { VariationsPanel } from "@/components/present/variations-panel";
import { PresentPromptBar } from "@/components/present/present-prompt-bar";
import { DeviceFrame, type DeviceMode } from "@/components/present/device-frame";
import { VARIATION_THEMES, type VariationId } from "@/components/present/health-app/theme";
import { HEALTH_SCREENS, type HealthScreenId, type TextOverrides } from "@/components/present/health-app/screens";

const ALL_VARIATIONS: VariationId[] = ["bold", "playful", "minimal"];

export function PresentModeView({
  generationPrompt,
  maxVariations = 3,
  panel,
  onPanelChange,
  tool,
  deviceMode,
  activeScreen,
  onNavigate,
  showVariations = true,
  interactive = true,
}: {
  generationPrompt: string;
  maxVariations?: number;
  panel: PresentPanel;
  onPanelChange: (panel: PresentPanel) => void;
  tool: PresentTool;
  deviceMode: DeviceMode;
  activeScreen: HealthScreenId;
  onNavigate: (id: HealthScreenId) => void;
  /** Start-with-your-design has no AI-generated variations to offer — just the
   * one imported design. Defaults to true everywhere else. */
  showVariations?: boolean;
  /** Whether clicking inside the screen itself navigates — gated on the
   * Prototype tab having been generated for Start-with-your-design (Screens
   * panel navigation, driven by the same onNavigate, stays available either
   * way). Defaults to true everywhere else. */
  interactive?: boolean;
}) {
  const variationIds = ALL_VARIATIONS.slice(0, Math.max(1, Math.min(3, maxVariations)));

  const [selectedVariation, setSelectedVariation] = useState<VariationId>(variationIds[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<VariationId[]>(variationIds.slice(0, 2));
  const [taggedElement, setTaggedElement] = useState<string | null>(null);
  // Text edited via the Edit tool (pencil icon) — ids are already namespaced
  // per screen (e.g. "splash.welcome"), so one flat map safely covers every
  // screen without needing a nested per-screen structure.
  const [textOverrides, setTextOverrides] = useState<TextOverrides>({});
  const editable = tool === "edit";

  function handleTextChange(id: string, text: string) {
    setTextOverrides((prev) => (prev[id] === text ? prev : { ...prev, [id]: text }));
  }

  const ActiveScreen = HEALTH_SCREENS[activeScreen].Component;

  function handleScreenClick(themeId: VariationId) {
    return tool === "select"
      ? () => setTaggedElement(`${HEALTH_SCREENS[activeScreen].name} (${VARIATION_THEMES[themeId].label})`)
      : undefined;
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      {/* The screen is centered on the canvas's true midline — the same
          center line the bottom prompt bar sits on (both use left-1/2) —
          matching the Figma reference, where the side panels float over
          the canvas rather than pushing the centered content off-axis. */}
      <div className="flex h-full items-center justify-center">
        {compareMode ? (
          <div className="flex items-center gap-10 rounded-[30px] bg-card p-8">
            {compareSelection.map((id) => (
              <DeviceFrame key={id} mode={deviceMode}>
                <div onClick={handleScreenClick(id)} className="h-full w-full">
                  <ActiveScreen
                    theme={VARIATION_THEMES[id]}
                    onNavigate={interactive ? onNavigate : () => {}}
                    editable={editable}
                    overrides={textOverrides}
                    onTextChange={handleTextChange}
                  />
                </div>
              </DeviceFrame>
            ))}
          </div>
        ) : (
          <DeviceFrame mode={deviceMode}>
            <div onClick={handleScreenClick(selectedVariation)} className="h-full w-full">
              <ActiveScreen
                theme={VARIATION_THEMES[selectedVariation]}
                onNavigate={interactive ? onNavigate : () => {}}
                editable={editable}
                overrides={textOverrides}
                onTextChange={handleTextChange}
              />
            </div>
          </DeviceFrame>
        )}
      </div>

      <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
        {panel === "screens" && <PresentScreensPanel active={activeScreen} onSelect={onNavigate} />}
        {panel === "aichat" && <AiAssistantOverlay prompt={generationPrompt} onClose={() => onPanelChange(null)} />}
        {panel === "split" && (
          <>
            <PresentScreensPanel active={activeScreen} onSelect={onNavigate} />
            <AiAssistantOverlay prompt={generationPrompt} />
          </>
        )}
      </div>

      {showVariations && (
        <div className="absolute top-1/2 right-5 z-30 -translate-y-1/2">
          <VariationsPanel
            variationIds={variationIds}
            selected={selectedVariation}
            onSelect={setSelectedVariation}
            compareMode={compareMode}
            compareSelection={compareSelection}
            onCompareToggle={() => setCompareMode((v) => !v)}
            onCompareSelectionChange={setCompareSelection}
          />
        </div>
      )}

      <PresentPromptBar taggedElement={taggedElement} onClearTag={() => setTaggedElement(null)} />
    </div>
  );
}
