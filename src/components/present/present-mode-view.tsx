"use client";

import { useState } from "react";
import type { PresentPanel } from "@/components/present/present-left-rail";
import { PresentScreensPanel } from "@/components/present/present-screens-panel";
import { AiAssistantOverlay } from "@/components/present/ai-assistant-overlay";
import { PresentTopToolbar, type PresentTool } from "@/components/present/present-top-toolbar";
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
}: {
  generationPrompt: string;
  maxVariations?: number;
  panel: PresentPanel;
  onPanelChange: (panel: PresentPanel) => void;
}) {
  const variationIds = ALL_VARIATIONS.slice(0, Math.max(1, Math.min(3, maxVariations)));

  const [tool, setTool] = useState<PresentTool>("pointer");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [selectedVariation, setSelectedVariation] = useState<VariationId>(variationIds[0]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<VariationId[]>(variationIds.slice(0, 2));
  const [activeScreen, setActiveScreen] = useState<HealthScreenId>("splash");
  const [taggedElement, setTaggedElement] = useState<string | null>(null);
  const [past, setPast] = useState<HealthScreenId[]>([]);
  const [future, setFuture] = useState<HealthScreenId[]>([]);

  function navigate(id: HealthScreenId) {
    setPast((p) => [...p, activeScreen]);
    setFuture([]);
    setActiveScreen(id);
  }

  function undo() {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [activeScreen, ...f]);
    setActiveScreen(prev);
  }

  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, activeScreen]);
    setActiveScreen(next);
  }

  const ActiveScreen = HEALTH_SCREENS[activeScreen].Component;

  function handleScreenClick(themeId: VariationId) {
    return tool === "select"
      ? () => setTaggedElement(`${HEALTH_SCREENS[activeScreen].name} (${VARIATION_THEMES[themeId].label})`)
      : undefined;
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
        {panel === "screens" && <PresentScreensPanel active={activeScreen} onSelect={navigate} />}
        {panel === "aichat" && <AiAssistantOverlay prompt={generationPrompt} onClose={() => onPanelChange(null)} />}
        {panel === "split" && (
          <>
            <PresentScreensPanel active={activeScreen} onSelect={navigate} />
            <AiAssistantOverlay prompt={generationPrompt} />
          </>
        )}
      </div>

      <div className="absolute top-6 left-1/2 z-20 -translate-x-1/2">
        <PresentTopToolbar
          tool={tool}
          onToolChange={setTool}
          deviceMode={deviceMode}
          onDeviceModeChange={setDeviceMode}
          onUndo={undo}
          onRedo={redo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
        />
      </div>

      <div className="flex h-full items-center justify-center">
        {compareMode ? (
          <div className="flex items-center gap-10 rounded-[30px] bg-[#18181a] p-8">
            {compareSelection.map((id) => (
              <DeviceFrame key={id} mode={deviceMode}>
                <div onClick={handleScreenClick(id)} className="h-full w-full">
                  <ActiveScreen theme={VARIATION_THEMES[id]} onNavigate={navigate} />
                </div>
              </DeviceFrame>
            ))}
          </div>
        ) : (
          <DeviceFrame mode={deviceMode}>
            <div onClick={handleScreenClick(selectedVariation)} className="h-full w-full">
              <ActiveScreen theme={VARIATION_THEMES[selectedVariation]} onNavigate={navigate} />
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
