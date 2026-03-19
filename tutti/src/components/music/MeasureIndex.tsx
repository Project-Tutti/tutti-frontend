// components/music/measureIndex.ts
import type { Cursor } from "opensheetmusicdisplay";

/**
 * osmd-audio-player는 "시간(초)"이 아니라 Cursor "step" 기반으로 재생/점프합니다.
 * 그래서 "마디 -> step" 매핑을 한 번 만들어두면
 * jumpToStep(step)으로 정확하게 '마디부터 재생'을 구현할 수 있습니다.
 */
export function buildMeasureIndex(cursor: Cursor) {
  const measureToStep = new Map<number, number>();
  const stepToMeasure: number[] = [];

  cursor.reset();

  let step = 0;
  const it: any = (cursor as any).Iterator ?? (cursor as any).iterator;

  // cursor.next() 한 번이 곧 step 1 증가라고 보는 게 PlaybackEngine 동작 방식과 맞습니다.
  while (it && !it.EndReached) {
    const measureNumber = getMeasureNumberFromCursor(cursor);

    if (measureNumber != null) {
      if (!measureToStep.has(measureNumber)) measureToStep.set(measureNumber, step);
      stepToMeasure[step] = measureNumber;
    }

    cursor.next();
    step++;
  }

  cursor.reset();
  return { measureToStep, stepToMeasure, totalSteps: step };
}

export function getMeasureNumberFromCursor(cursor: Cursor): number | null {
  const it: any = (cursor as any).Iterator ?? (cursor as any).iterator;
  if (!it) return null;

  // 케이스 1) 인덱스를 주는 경우
  if (typeof it.CurrentMeasureIndex === "number") return it.CurrentMeasureIndex + 1;

  // 케이스 2) measure 객체가 있는 경우
  const m = it.CurrentMeasure ?? it.currentMeasure ?? null;
  if (!m) return null;

  const n =
    m.MeasureNumber ??
    m.measureNumber ??
    m.Number ??
    m.number ??
    null;

  return typeof n === "number" ? n : null;
}
