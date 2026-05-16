"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

// createPortal(document.body)를 쓰므로 SSR 비활성화 (영상 데모 페이지 전용).
const GenerationProgressOverlay = dynamic(
  () => import("@/components/before-create/GenerationProgressOverlay"),
  { ssr: false },
);

/**
 * 영상 촬영 전용 데모 페이지.
 * 실제 SSE 진행 모달(GenerationProgressOverlay)을 그대로 재사용하고
 * 진행률만 가짜로 주입한다. glow / 백그라운드 버튼 / 등장 애니메이션 /
 * spring 숫자 등은 전부 실제 모달과 동일.
 * 영상 배경용으로 모달 뒤만 순수 검정으로 깐다.
 * 진행 속도 곡선: ease-in-out-cubic (느림 → 빠름 → 다시 느림), 3초.
 */

const START_DELAY_MS = 2000;
const DURATION_MS = 3000;
const MIDI_NAME = "HeyJude.mid";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function VideoModalPage() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start - START_DELAY_MS;
      if (elapsed < 0) {
        // 시작 전 대기 구간: 0% 유지
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / DURATION_MS, 1);
      setPct(Math.round(easeInOutCubic(t) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isComplete = pct >= 100;

  const state: ProjectStatusState = {
    status: isComplete ? "complete" : "processing",
    progress: pct,
    message: null,
    error: null,
    isComplete,
    isFailed: false,
  };

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <GenerationProgressOverlay
        state={state}
        label={MIDI_NAME}
        onMinimize={() => {}}
      />
    </div>
  );
}
