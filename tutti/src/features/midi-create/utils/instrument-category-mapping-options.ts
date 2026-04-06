import type { InstrumentCategoryDto } from "@api/instruments/types/api.types";

export interface InstrumentMappingOption {
  id: number;
  label: string;
}

const MAX_MIDI_PROGRAM_FOR_UI = 129;

function parseNestedInstrument(
  raw: unknown,
): { id: number; label: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id =
    typeof o.program === "number"
      ? o.program
      : typeof o.instrumentId === "number"
        ? o.instrumentId
        : typeof o.representativeProgram === "number"
          ? o.representativeProgram
          : null;
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.label === "string"
        ? o.label
        : null;
  if (
    id == null ||
    !Number.isFinite(id) ||
    id < 0 ||
    id > MAX_MIDI_PROGRAM_FOR_UI
  )
    return null;
  return { id, label: name ?? `General MIDI ${id}` };
}

/**
 * `/instruments/categories` 응답을 트랙 매핑용 `<select>` 옵션으로 평탄화.
 * `instruments`가 비어 있으면 카테고리 `representativeProgram` 한 줄을 옵션으로 씀.
 */
export function flattenInstrumentCategoriesToMappingOptions(
  categories: InstrumentCategoryDto[],
): InstrumentMappingOption[] {
  const seen = new Set<number>();
  const out: InstrumentMappingOption[] = [];

  for (const c of categories) {
    const items = c.instruments;
    if (Array.isArray(items) && items.length > 0) {
      for (const raw of items) {
        const parsed = parseNestedInstrument(raw);
        if (!parsed || seen.has(parsed.id)) continue;
        seen.add(parsed.id);
        out.push({
          id: parsed.id,
          label: `${c.name} › ${parsed.label}`,
        });
      }
    } else {
      const id = c.representativeProgram;
      if (
        !Number.isFinite(id) ||
        id < 0 ||
        id > MAX_MIDI_PROGRAM_FOR_UI ||
        seen.has(id)
      )
        continue;
      seen.add(id);
      out.push({
        id,
        label: c.name === "Drop" ? "Drop" : `${c.name} · General MIDI ${id}`,
      });
    }
  }

  return out.sort((a, b) => a.id - b.id);
}
