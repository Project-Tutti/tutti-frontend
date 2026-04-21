"use client";

import { useMemo } from "react";

import type { InstrumentCategoryDto } from "@api/instruments/types/api.types";
import { useInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useInstrumentCategoriesQuery";

/**
 * `/instruments/categories` 응답에서 특정 midi program 에 해당하는 "표준 악기명" 을 찾는다.
 *
 * API 응답의 `instruments[]` 원소는 서버 스키마 진화를 고려해 아래 필드들을 관대하게 허용한다:
 * - program 번호: `midiProgram` | `program` | `instrumentId`
 * - 이름: `name` | `label`
 *
 * 매칭이 없으면 `fallback` 을 반환한다 (예: MIDI 원본에서 파싱한 이름).
 */
export function resolveInstrumentDisplayName(
  categories: InstrumentCategoryDto[] | undefined,
  programId: number,
  fallback: string,
): string {
  if (!categories) return fallback;

  for (const c of categories) {
    const items = c.instruments;
    if (!Array.isArray(items)) continue;

    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;

      const id =
        typeof o.midiProgram === "number"
          ? o.midiProgram
          : typeof o.program === "number"
            ? o.program
            : typeof o.instrumentId === "number"
              ? o.instrumentId
              : null;
      if (id !== programId) continue;

      const name =
        typeof o.name === "string"
          ? o.name
          : typeof o.label === "string"
            ? o.label
            : null;
      if (name && name.trim().length > 0) return name;
    }
  }

  return fallback;
}

/**
 * 표준화된 악기 표시명을 반환한다.
 *
 * - API 캐시가 비어있거나 매칭이 없으면 `fallback` 을 그대로 반환한다.
 * - 내부적으로 공용 `useInstrumentCategoriesQuery` 를 사용하므로 여러 번 호출돼도 네트워크 요청은 1회로 dedupe 된다.
 */
export function useInstrumentDisplayName(
  programId: number,
  fallback: string,
): string {
  const { data } = useInstrumentCategoriesQuery();
  return useMemo(
    () => resolveInstrumentDisplayName(data, programId, fallback),
    [data, programId, fallback],
  );
}
