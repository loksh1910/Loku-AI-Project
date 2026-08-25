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
import { HEALTH_SCREENS, type HealthScreenId } from "@/components/present/health-app/screens";

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
}: {
  generationPrompt: string;
  maxVariations?: number;
  panel: PresentPanel;
  onPanelChange: (panel: PresentPanel) => void;
  tool: PresentTool;
  deviceMode: DeviceMode;
  activeScreen: HealthScreenId;
  onNavigate: (id: HealthScreenId) => void;
}) {
  const variationIds = ALL_VARIATIONS.slice(0, Math.max(1, Math.min(3, maxVariations)));

  const [selectedVariation, setSelectedVariation] = useState<VariationId>(variationIds[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<VariationId[]>(variationIds.slice(0, 2));
  const [taggedElement, setTaggedElement] = useState<string | null>(null);

  const ActiveScreen = HEALTH_SCREENS[activeScreen].Component;

  function handleScreenClick(themeId: VariationId) {
    return tool === "select"
      ? () => setTaggedElement(`${HEALTH_SCREENS[activeScreen].name} (${VARIATION_THEMES[themeId].label})`)
      : undefined;
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
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

      <div className="flex h-full items-center justify-center pt-10 pr-[210px] pb-[230px] pl-[340px]">
        {compareMode ? (
          <div className="flex items-center gap-10 rounded-[30px] bg-[#18181a] p-8">
            {compareSelection.map((id) => (
              <DeviceFrame key={id} mode={deviceMode}>
                <div onClick={handleScreenClick(id)} className="h-full w-full">
                  <ActiveScreen theme={VARIATION_THEMES[id]} onNavigate={onNavigate} />
                </div>
              </DeviceFrame>
            ))}
          </div>
        ) : (
          <DeviceFrame mode={deviceMode}>
            <div onClick={handleScreenClick(selectedVariation)} className="h-full w-full">
              <ActiveScreen theme={VARIATION_THEMES[selectedVariation]} onNavigate={onNavigate} />
            </div>
          </DeviceFrame>
        )}
      </div>

      <VariationsPanel
        variationIds={variationIds}
        selected={selectedVariation}
        onSelect={setSelectedVariation}
        compareMode={compareMode}
        compareSelection={compareSelection}
        onCompareToggle={() => setCompareMode((v) => !v)}
        onCompareSelectionChange={setCompareSelection}
      />

      <PresentPromptBar taggedElement={taggedElement} onClearTag={() => setTaggedElement(null)} />
    </div>
  );
}
