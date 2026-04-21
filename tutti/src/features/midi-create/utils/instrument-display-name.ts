"use client";

import { useMemo } from "react";

import type { InstrumentCategoryDto } from "@api/instruments/types/api.types";
import { useInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useInstrumentCategoriesQuery";

/**
 * `/instruments/categories` 응답에서 특정 midi program 에 해당하는 "표준 악기명" 을 찾는다.
 * 매칭이 없으면 `fallback` 을 반환한다 (예: MIDI 원본에서 파싱한 이름).
 */
export function resolveInstrumentDisplayName(
  categories: InstrumentCategoryDto[] | undefined,
  programId: number,
  fallback: string,
): string {
  if (!categories) return fallback;

  for (const cat of categories) {
    const instruments = cat.instruments;
    if (!instruments) continue;

    const found = instruments.find((inst) => inst.midiProgram === programId);
    if (found?.name) return found.name;
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
