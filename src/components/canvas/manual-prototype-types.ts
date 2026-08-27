// The Design/Prototype entry's own interaction model — parallel to
// PrototypeInteraction (prototype-types.ts) but keyed to freeform ManualFrame /
// ManualElement ids instead of the fixed HealthScreenId set, since screens here
// are whatever the user draws in Design mode, not the seeded HealthVisor app.
export type ManualInteraction = {
  id: string;
  sourceFrameId: string;
  /** Null when the wire starts from the screen itself rather than one element on it. */
  sourceElementId: string | null;
  sourceElementName: string;
  sourceElementType: string;
  targetFrameId: string;
  trigger: string;
  action: string;
  animation: string;
  duration: string;
  easing: string;
};

function uid() {
  return `wire-${Math.random().toString(36).slice(2, 9)}`;
}

export function newManualInteraction(
  sourceFrameId: string,
  sourceElementId: string | null,
  sourceElementName: string,
  sourceElementType: string,
  targetFrameId: string,
): ManualInteraction {
  return {
    id: uid(),
    sourceFrameId,
    sourceElementId,
    sourceElementName,
    sourceElementType,
    targetFrameId,
    trigger: "On Click",
    action: "Navigate to",
    animation: "Slide right",
    duration: "300ms",
    easing: "Ease in out",
  };
}
