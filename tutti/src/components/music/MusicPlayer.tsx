// components/music/MusicPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "osmd-audio-player";
import ScoreViewer, { ScoreViewerRef } from "./ScoreViewer";
import PlaybackControl from "./PlaybackControl";
import { buildMeasureIndex, getMeasureNumberFromCursor } from "./MeasureIndex";

type UiState = "loading" | "idle" | "playing" | "paused";
type JumpSource = "control" | "click";

// ✅ ScoreViewer.tsx에서 active 하이라이트 rect에 붙이는 클래스
const ACTIVE_HIGHLIGHT_CLASS = "osmd-active-measure-highlight";

interface MusicPlayerProps {
  xmlData?: string | ArrayBuffer | File;
  autoPlay?: boolean;
  onRequestChangeFile?: () => void;
}

export default function MusicPlayer({
  xmlData,
  autoPlay = false,
  onRequestChangeFile,
}: MusicPlayerProps) {
  const scoreViewerRef = useRef<ScoreViewerRef>(null);

  const playerRef = useRef<any>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  const measureToStepRef = useRef<Map<number, number>>(new Map());
  const totalMeasuresRef = useRef<number>(0);

  const [state, setState] = useState<UiState>("loading");
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const [totalMeasures, setTotalMeasures] = useState<number>(0);

  const cleanupPlayerEventsRef = useRef<(() => void) | null>(null);
  const lastHighlightedMeasureRef = useRef<number | null>(null);

  // ✅ 현재 커서가 속한 페이지 DOM(페이지 변경 감지)
  const lastPageElRef = useRef<Element | null>(null);

  // ✅ 점프/클릭 직후 “툭” 방지용
  const suppressAutoScrollUntilRef = useRef<number>(0);

  // ✅ sticky 재생바 높이 기반 topSafe 계산
  const controlBarRef = useRef<HTMLDivElement>(null);

  const getTopSafe = () => {
    const barH = controlBarRef.current?.getBoundingClientRect().height ?? 0;
    return Math.max(80, Math.round(barH) + 28);
  };

  const getBottomSafe = () => 120;

  const normalizeState = (raw: any): UiState => {
    const s = String(raw ?? "").toUpperCase();
    if (s.includes("PLAY")) return "playing";
    if (s.includes("PAUSE")) return "paused";
    if (s.includes("STOP")) return "idle";
    return "idle";
  };

  /** ✅ 커서 엘리먼트 */
  const getCursorElement = (): Element | null => {
    const c: any = scoreViewerRef.current?.getCursor?.();
    return c?.cursorElement ?? c?.CursorElement ?? null;
  };

  /** ✅ 현재 active 하이라이트 rect (두번째 코드의 핵심 기준) */
  const getActiveHighlightElement = (): Element | null => {
    return document.querySelector(`.${ACTIVE_HIGHLIGHT_CLASS}`);
  };

  /** ✅ 스크롤 가능한 부모 찾기 */
  const findScrollParent = (el: Element | null, axis: "y" | "x"): HTMLElement | null => {
    let cur: HTMLElement | null = el ? (el as unknown as HTMLElement) : null;

    while (cur && cur !== document.body) {
      const style = window.getComputedStyle(cur);
      const overflow = axis === "y" ? style.overflowY : style.overflowX;

      const canScroll =
        (overflow === "auto" || overflow === "scroll" || overflow === "overlay") &&
        (axis === "y"
          ? (cur.scrollHeight ?? 0) > (cur.clientHeight ?? 0) + 1
          : (cur.scrollWidth ?? 0) > (cur.clientWidth ?? 0) + 1);

      if (canScroll) return cur;
      cur = cur.parentElement;
    }

    return (document.scrollingElement as HTMLElement) ?? null;
  };

  /** ✅ 커서가 속한 "페이지" DOM (없으면 svg로라도 잡기) */
  const getPageElement = (): Element | null => {
    const el = getCursorElement();
    if (!el) return null;

    return (
      (el as HTMLElement).closest?.(
        ".osmdPage, .osmd-page, .page, .osmdPageContainer, .osmd-page-container, [id^='osmdPage'], [class*='osmdPage'], [data-osmd-page]"
      ) ??
      (el as HTMLElement).closest?.("svg") ??
      null
    );
  };

  /** ✅ 커서가 화면 안에 충분히 보이면 scrollIntoView를 꺼서 툭 튐 방지 */
  const shouldUseScrollIntoView = (): boolean => {
    const el = getCursorElement();
    if (!el || typeof (el as any).getBoundingClientRect !== "function") return true;

    const rect = (el as any).getBoundingClientRect() as DOMRect;
    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const visibleEnough =
      rect.top >= topSafe && rect.bottom <= window.innerHeight - bottomSafe;

    return !visibleEnough;
  };

  /**
   * ✅ (추가) 하이라이트 rect 기준 세로 보정 (두번째 코드의 핵심)
   * - 중앙 정렬 X
   * - 안전영역(topSafe~bottomSafe) 밖일 때만 "필요한 만큼만" 이동
   * - return: 실제로 스크롤했는지 여부
   */
  const scrollActiveHighlightIntoView = (
    behavior: ScrollBehavior = "smooth"
  ): boolean => {
    const el = getActiveHighlightElement();
    if (!el || typeof (el as any).getBoundingClientRect !== "function") return false;

    const parent = findScrollParent(el, "y");
    if (!parent) return false;

    const rect = (el as any).getBoundingClientRect() as DOMRect;
    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const DEAD_ZONE = 36; // 미세 보정(툭) 방지

    // window 스크롤
    if (parent === document.scrollingElement) {
      const topLimit = topSafe;
      const bottomLimit = window.innerHeight - bottomSafe;

      let delta = 0;
      if (rect.top < topLimit) delta = rect.top - topLimit;
      else if (rect.bottom > bottomLimit) delta = rect.bottom - bottomLimit;
      else return false;

      if (Math.abs(delta) < DEAD_ZONE) return false;

      window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior });
      return true;
    }

    // 특정 컨테이너 스크롤
    const parentRect = parent.getBoundingClientRect();
    const topInParent = rect.top - parentRect.top;
    const bottomInParent = rect.bottom - parentRect.top;

    const topLimit = topSafe;
    const bottomLimit = parent.clientHeight - bottomSafe;

    let delta = 0;
    if (topInParent < topLimit) delta = topInParent - topLimit;
    else if (bottomInParent > bottomLimit) delta = bottomInParent - bottomLimit;
    else return false;

    if (Math.abs(delta) < DEAD_ZONE) return false;

    parent.scrollTo({ top: Math.max(0, parent.scrollTop + delta), behavior });
    return true;
  };

  /**
   * ✅ 같은 페이지에서만: 커서가 화면 밖이면 세로로 따라가기
   * (기존 유지: 커서 기준은 fallback으로만 사용)
   */
  const scrollToCursorVertIfNeeded = (behavior: ScrollBehavior = "smooth"): boolean => {
    const el = getCursorElement();
    if (!el || typeof (el as any).getBoundingClientRect !== "function") return false;

    const rect = (el as any).getBoundingClientRect() as DOMRect;
    const yParent = findScrollParent(el, "y");
    if (!yParent) return false;

    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const DEAD_ZONE = 36;

    if (yParent === document.scrollingElement) {
      const out = rect.top < topSafe || rect.bottom > window.innerHeight - bottomSafe;
      if (!out) return false;

      let target = window.scrollY + (rect.top + rect.height / 2) - window.innerHeight / 2;
      if (target < 0) target = 0;

      if (Math.abs(target - window.scrollY) < DEAD_ZONE) return false;

      window.scrollTo({ top: target, behavior });
      return true;
    }

    const parentRect = yParent.getBoundingClientRect();
    const topInParent = rect.top - parentRect.top;
    const bottomInParent = rect.bottom - parentRect.top;

    const out =
      topInParent < topSafe || bottomInParent > yParent.clientHeight - bottomSafe;
    if (!out) return false;

    const centerInParent = topInParent + rect.height / 2;
    let target = yParent.scrollTop + centerInParent - yParent.clientHeight / 2;
    if (target < 0) target = 0;

    if (Math.abs(target - yParent.scrollTop) < DEAD_ZONE) return false;

    yParent.scrollTo({ top: target, behavior });
    return true;
  };

  /** ✅ 페이지가 바뀌면: 그 페이지의 상단이 안전영역 아래로 오도록 정렬 */
  const scrollToPageTop = (pageEl: Element, behavior: ScrollBehavior = "auto") => {
    const yParent = findScrollParent(pageEl, "y");
    const topSafe = getTopSafe();
    const DEAD_ZONE = 36;

    if (!yParent) {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const pageRect = (pageEl as HTMLElement).getBoundingClientRect();

    if (yParent === document.scrollingElement) {
      const target = Math.max(0, window.scrollY + pageRect.top - topSafe);
      if (Math.abs(target - window.scrollY) < DEAD_ZONE) return;
      window.scrollTo({ top: target, behavior });
      return;
    }

    const parentRect = yParent.getBoundingClientRect();
    const target = Math.max(0, yParent.scrollTop + (pageRect.top - parentRect.top) - topSafe);
    if (Math.abs(target - yParent.scrollTop) < DEAD_ZONE) return;
    yParent.scrollTo({ top: target, behavior });
  };

  const ensurePageTop = (pageEl: Element) => {
    const run = () => {
      scrollToPageTop(pageEl, "auto");
      // ✅ 페이지 top 정렬 후, 하이라이트가 아래에 있으면 최소 보정으로 확실히 보이게
      scrollActiveHighlightIntoView("auto");
    };
    run();
    requestAnimationFrame(run);
    setTimeout(run, 80);
  };

  /**
   * ✅ 하이라이트 이후: (기존 흐름 유지)
   * - changed면 ensurePageTop
   * - 아니면 "하이라이트 기준 세로 보정"을 먼저 하고, 안 되면 커서 fallback
   */
  const postHighlightScroll = (prevPageEl: Element | null) => {
    const run = () => {
      const nextEl = getPageElement();
      const changed = prevPageEl != null && nextEl != null && prevPageEl !== nextEl;

      if (nextEl) lastPageElRef.current = nextEl;

      if (changed && nextEl) {
        ensurePageTop(nextEl);
      } else {
        // ✅ (추가) 아래 악보에서 하이라이트가 안 보이는 문제 해결: 하이라이트 기준 우선
        const moved = scrollActiveHighlightIntoView("smooth");
        if (!moved) {
          // fallback
          scrollToCursorVertIfNeeded("smooth");
        }
      }
    };

    run();
    requestAnimationFrame(run);
    setTimeout(run, 80);
  };

  const handleScoreLoaded = async (osmd: OpenSheetMusicDisplay) => {
    setState("loading");

    cleanupPlayerEventsRef.current?.();
    cleanupPlayerEventsRef.current = null;

    try {
      osmdRef.current = osmd;

      const measures = (osmd.Sheet as any)?.SourceMeasures ?? [];
      totalMeasuresRef.current = measures.length;
      setTotalMeasures(measures.length);

      const idx = buildMeasureIndex(osmd.cursor);
      measureToStepRef.current = idx.measureToStep;

      const player = new (AudioPlayer as any)();
      playerRef.current = player;

      await player.loadScore(osmd);

      // 초기 페이지 저장
      lastPageElRef.current = getPageElement();

      const onState = (s: any) => {
        const ui = normalizeState(s);
        setState(ui);

        if (ui === "idle") {
          try {
            const c = scoreViewerRef.current?.getCursor();
            c?.reset();
            c?.show();
          } catch {}

          setCurrentMeasure(1);
          scoreViewerRef.current?.highlightMeasure(1, { scrollIntoView: false });
          lastHighlightedMeasureRef.current = 1;

          // ✅ 시작 마디도 하이라이트 기준으로 확실히 보이게
          requestAnimationFrame(() => {
            const moved = scrollActiveHighlightIntoView("auto");
            if (!moved) scrollToCursorVertIfNeeded("smooth");
          });
        }
      };

      const onIteration = () => {
        const c = scoreViewerRef.current?.getCursor();
        if (!c) return;

        const m = getMeasureNumberFromCursor(c);
        if (m == null) return;

        setCurrentMeasure(m);

        if (lastHighlightedMeasureRef.current === m) return;

        const now = performance.now();
        const suppress = now < suppressAutoScrollUntilRef.current;

        const prevPageEl = lastPageElRef.current ?? getPageElement();

        // ✅ (그대로) 화면 밖일 때만 scrollIntoView
        // ✅ suppress 구간에는 scrollIntoView/추가 스크롤 보정 모두 중단
        const useScrollIntoView = !suppress && shouldUseScrollIntoView();

        scoreViewerRef.current?.highlightMeasure(m, { scrollIntoView: useScrollIntoView });
        lastHighlightedMeasureRef.current = m;

        const curPageEl = getPageElement();
        if (curPageEl) lastPageElRef.current = curPageEl;

        if (suppress) return;
        postHighlightScroll(prevPageEl);
      };

      if (player.on) {
        player.on("state-change", onState);
        player.on("iteration", onIteration);

        cleanupPlayerEventsRef.current = () => {
          try {
            player.off?.("state-change", onState);
            player.off?.("iteration", onIteration);
          } catch {}
        };
      }

      try {
        const c = scoreViewerRef.current?.getCursor();
        c?.reset();
        c?.show();
      } catch {}

      setCurrentMeasure(1);
      scoreViewerRef.current?.highlightMeasure(1, { scrollIntoView: false });
      lastHighlightedMeasureRef.current = 1;

      setState("idle");

      if (autoPlay) {
        await player.play();
      }
    } catch (e) {
      console.error(e);
      alert(`플레이어 초기화 실패: ${e instanceof Error ? e.message : "Unknown error"}`);
      setState("idle");
    }
  };

  const play = async () => {
    const p = playerRef.current;
    if (!p) return;
    await p.play();
  };

  const pause = () => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
  };

  const stop = async () => {
    const p = playerRef.current;
    if (!p) return;
    await p.stop();
  };

  const jumpToMeasure = async (
    measure: number,
    autoplay = true,
    source: JumpSource = "control"
  ) => {
    const p = playerRef.current;
    if (!p) return;

    const m = Math.min(Math.max(measure, 1), Math.max(totalMeasuresRef.current, 1));
    const step = measureToStepRef.current.get(m);

    if (step == null) {
      console.warn("No step mapping for measure:", m);
      return;
    }

    if (typeof p.jumpToStep !== "function") {
      alert("이 버전의 osmd-audio-player에서 jumpToStep을 찾지 못했습니다.");
      return;
    }

    const prevPageEl = lastPageElRef.current ?? getPageElement();

    p.jumpToStep(step);
    setCurrentMeasure(m);

    const fromClick = source === "click";

    const useScrollIntoView = !fromClick && shouldUseScrollIntoView();

    scoreViewerRef.current?.highlightMeasure(m, { scrollIntoView: useScrollIntoView });
    lastHighlightedMeasureRef.current = m;

    try {
      const c = scoreViewerRef.current?.getCursor();
      c?.show();
    } catch {}

    // ✅ 클릭/점프 직후 onIteration 자동보정 잠깐 차단
    suppressAutoScrollUntilRef.current = performance.now() + (fromClick ? 320 : 180);

    if (!fromClick) {
      // ✅ 컨트롤 점프는 “하이라이트 기준”으로 확실히 보이게 보정
      postHighlightScroll(prevPageEl);
    } else {
      const curPageEl = getPageElement();
      if (curPageEl) lastPageElRef.current = curPageEl;
    }

    if (autoplay) await p.play();
  };

  useEffect(() => {
    return () => {
      cleanupPlayerEventsRef.current?.();
      cleanupPlayerEventsRef.current = null;

      if (playerRef.current) {
        try {
          playerRef.current.stop?.();
        } catch {}
      }
    };
  }, []);

  if (!xmlData) return null;

  return (
    <div className="w-full space-y-3">
      <div ref={controlBarRef} className="sticky top-0 z-40 -mx-4 md:-mx-8">
        <div className="border-b border-[#1e293b] bg-[#05070a]/85 backdrop-blur px-2">
          <PlaybackControl
            state={state}
            currentMeasure={currentMeasure}
            totalMeasures={totalMeasures}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onJumpToMeasure={(mm) => jumpToMeasure(mm, true, "control")}
            onChangeFile={onRequestChangeFile}
          />
        </div>
      </div>

      {/* 브라우저 scroll anchoring 점프 완화 */}
      <div style={{ overflowAnchor: "none" }}>
        <ScoreViewer
          ref={scoreViewerRef}
          xmlData={xmlData}
          onScoreLoaded={handleScoreLoaded}
          onMeasureClick={(mm) => jumpToMeasure(mm, true, "click")}
        />
      </div>
    </div>
  );
}
