import { FILTER_GROUPS } from "@/lib/filters-data";
import type { Template } from "@/lib/templates-data";

const LABEL_BY_VALUE = new Map(
  FILTER_GROUPS.flatMap((g) => g.options.map((o) => [o.value, o.label] as const)),
);

/**
 * Best-effort match against a template's free-text tags — there's no
 * dedicated category/style/complexity field on Template yet, so this checks
 * whether any selected filter's label appears in (or contains) any tag.
 * Approximate, not a real faceted filter engine — flagged as such since it's
 * matching on loose text overlap rather than structured metadata.
 */
export function templateMatchesFilters(template: Template, selectedValues: string[]): boolean {
  if (selectedValues.length === 0) return true;
  const tags = template.tags.map((t) => t.toLowerCase());
  return selectedValues.some((value) => {
    const label = (LABEL_BY_VALUE.get(value) ?? value).toLowerCase();
    return tags.some((tag) => tag.includes(label) || label.includes(tag));
  });
}
