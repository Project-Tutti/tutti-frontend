// components/music/MusicPlayer.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "osmd-audio-player";
import ScoreViewer, { ScoreViewerRef } from "./ScoreViewer";
import PlaybackControl from "./PlaybackControl";
import InstrumentMixer, { InstrumentInfo } from "./InstrumentMixer";
import { buildMeasureIndex, getMeasureNumberFromCursor } from "./MeasureIndex";
import { toast } from "@/components/common/Toast";
import { Spinner } from "@/components/common/Spinner";

type UiState = "loading" | "idle" | "playing" | "paused";
type JumpSource = "control" | "click";

const isDev = process.env.NODE_ENV === "development";

// ✅ ScoreViewer.tsx에서 active 하이라이트 rect에 붙이는 클래스
const ACTIVE_HIGHLIGHT_CLASS = "osmd-active-measure-highlight";

type OsmdAudioPlayerLike = {
  loadScore: (osmd: OpenSheetMusicDisplay) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => Promise<void>;
  jumpToStep?: (step: number) => void;
  on?: (event: string, cb: (arg: unknown) => void) => void;
  off?: (event: string, cb: (arg: unknown) => void) => void;
};

interface MusicPlayerProps {
  xmlData?: string | ArrayBuffer | File;
  autoPlay?: boolean;
  onRequestChangeFile?: () => void;
  onControlBar?: (node: React.ReactNode) => void;
  isSidebarCollapsed?: boolean;
}

export default function MusicPlayer({
  xmlData,
  autoPlay = false,
  onRequestChangeFile,
  onControlBar,
  isSidebarCollapsed = false,
}: MusicPlayerProps) {
  const scoreViewerRef = useRef<ScoreViewerRef>(null);

  const playerRef = useRef<OsmdAudioPlayerLike | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  const measureToStepRef = useRef<Map<number, number>>(new Map());
  const totalMeasuresRef = useRef<number>(0);

  const [state, setState] = useState<UiState>("loading");
  const [currentMeasure, setCurrentMeasure] = useState<number | null>(null);
  const [totalMeasures, setTotalMeasures] = useState<number>(0);

  // ✅ 악기 믹서 상태
  const [instruments, setInstruments] = useState<InstrumentInfo[]>([]);
  const [mutedIndices, setMutedIndices] = useState<Set<number>>(new Set());
  const [isInstrumentsOpen, setIsInstrumentsOpen] = useState(false);

  // ✅ 콜백에서 stale 방지용 ref
  const instrumentsRef = useRef<InstrumentInfo[]>([]);
  const mutedIndicesRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    instrumentsRef.current = instruments;
  }, [instruments]);
  useEffect(() => {
    mutedIndicesRef.current = mutedIndices;
  }, [mutedIndices]);

  const cleanupPlayerEventsRef = useRef<(() => void) | null>(null);
  const lastHighlightedMeasureRef = useRef<number | null>(null);

  // ✅ 현재 커서가 속한 페이지 DOM(페이지 변경 감지)
  const lastPageElRef = useRef<Element | null>(null);

  // ✅ 점프/클릭 직후 “툭” 방지용
  const suppressAutoScrollUntilRef = useRef<number>(0);

  // ✅ Header + 재생바(헤더 내부 centerContent) 높이 기반 topSafe 계산
  const controlBarRef = useRef<HTMLDivElement>(null);

  const getTopSafe = () => {
    const headerH =
      (
        document.querySelector("[data-app-header]") as HTMLElement | null
      )?.getBoundingClientRect().height ?? 0;
    const instrumentsH =
      (
        document.querySelector(
          "[data-instruments-sticky]",
        ) as HTMLElement | null
      )?.getBoundingClientRect().height ?? 0;

    // 헤더 + INSTRUMENTS가 가리는 영역 + 여백
    return Math.max(80, Math.round(headerH + instrumentsH) + 20);
  };

  const getBottomSafe = () => 120;

  const normalizeState = (raw: unknown): UiState => {
    const s = String(raw ?? "").toUpperCase();
    if (s.includes("PLAY")) return "playing";
    if (s.includes("PAUSE")) return "paused";
    if (s.includes("STOP")) return "idle";
    return "idle";
  };

  // ============================================================
  // ✅ 스크롤/커서 유틸 (기존 유지)
  // ============================================================

  /** ✅ 커서 엘리먼트 */
  const getCursorElement = (): Element | null => {
    const c = scoreViewerRef.current?.getCursor?.();
    if (!c || typeof c !== "object") return null;
    const cc = c as { cursorElement?: unknown; CursorElement?: unknown };
    return (
      (cc.cursorElement as Element | undefined) ??
      (cc.CursorElement as Element | undefined) ??
      null
    );
  };

  /**
   * ✅ 현재 active 하이라이트 bounds
   * - "마지막 트랙 기준 트래킹"을 위해 bottom(초록)이 있으면 bottom을 우선 기준으로 사용
   * - bottom이 없으면 top/single을 union으로 사용
   */
  const getActiveHighlightBounds = (): DOMRect | null => {
    const bottom = document.querySelector(
      ".osmd-active-bottom-highlight",
    ) as Element | null;
    const top = document.querySelector(
      ".osmd-active-top-highlight",
    ) as Element | null;
    const single = document.querySelector(
      `.${ACTIVE_HIGHLIGHT_CLASS}`,
    ) as Element | null;

    const getRect = (el: Element | null): DOMRect | null => {
      if (!el || typeof el.getBoundingClientRect !== "function") return null;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      return r;
    };

    const bottomRect = getRect(bottom);
    if (bottomRect) return bottomRect;

    const rects: DOMRect[] = [];
    const topRect = getRect(top);
    const singleRect = getRect(single);
    if (topRect) rects.push(topRect);
    if (singleRect) rects.push(singleRect);
    if (rects.length === 0) return null;

    const left = Math.min(...rects.map((r) => r.left));
    const topY = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottomY = Math.max(...rects.map((r) => r.bottom));

    return new DOMRect(
      left,
      topY,
      Math.max(0, right - left),
      Math.max(0, bottomY - topY),
    );
  };

  /** ✅ 스크롤 가능한 부모 찾기 */
  const findScrollParent = (
    el: Element | null,
    axis: "y" | "x",
  ): HTMLElement | null => {
    let cur: HTMLElement | null = el ? (el as unknown as HTMLElement) : null;

    while (cur && cur !== document.body) {
      const style = window.getComputedStyle(cur);
      const overflow = axis === "y" ? style.overflowY : style.overflowX;

      const canScroll =
        (overflow === "auto" ||
          overflow === "scroll" ||
          overflow === "overlay") &&
        (axis === "y"
          ? (cur.scrollHeight ?? 0) > (cur.clientHeight ?? 0) + 1
          : (cur.scrollWidth ?? 0) > (cur.clientWidth ?? 0) + 1);

      if (canScroll) return cur;
      cur = cur.parentElement;
    }

    return (document.scrollingElement as HTMLElement) ?? null;
  };

  /** ✅ 커서가 속한 "페이지" SVG — cursor img는 SVG의 sibling이므로 위치 기반으로 탐지 */
  const getPageElement = (): Element | null => {
    const el = getCursorElement();
    const fallback = (document.querySelector(".osmd-active-bottom-highlight") ??
      document.querySelector(".osmd-active-top-highlight") ??
      document.querySelector(`.${ACTIVE_HIGHLIGHT_CLASS}`)) as Element | null;
    const anchor = el ?? fallback;
    if (!anchor) return null;

    // 수평 레이아웃: cursor의 중심 x로 어느 SVG 위에 있는지 판별
    const cursorRect = (anchor as HTMLElement).getBoundingClientRect?.();
    if (cursorRect && (cursorRect.width > 0 || cursorRect.height > 0)) {
      const cx = (cursorRect.left + cursorRect.right) / 2;
      const svgs = Array.from(
        document.querySelectorAll(".score-viewer-root svg"),
      ) as SVGSVGElement[];
      for (const svg of svgs) {
        const r = svg.getBoundingClientRect();
        if (cx >= r.left - 4 && cx <= r.right + 4) return svg;
      }
    }

    // fallback (수직 레이아웃 또는 cursor가 SVG 안에 있는 경우)
    return (
      (anchor as HTMLElement).closest?.(
        ".osmdPage, .osmd-page, .page, .osmdPageContainer, .osmd-page-container, [id^='osmdPage'], [class*='osmdPage'], [data-osmd-page]",
      ) ??
      (anchor as HTMLElement).closest?.("svg") ??
      null
    );
  };

  /** ✅ 생성 트랙(bottom) 하이라이트 기준으로 화면 안에 충분히 보이면 scrollIntoView OFF */
  const shouldUseScrollIntoView = (): boolean => {
    const rect =
      getActiveHighlightBounds() ??
      getCursorElement()?.getBoundingClientRect?.() ??
      null;
    if (!rect) return true;
    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const visibleEnough =
      rect.top >= topSafe && rect.bottom <= window.innerHeight - bottomSafe;

    return !visibleEnough;
  };

  /** ✅ 하이라이트 rect 기준 세로 보정 */
  const scrollActiveHighlightIntoView = (
    behavior: ScrollBehavior = "smooth",
  ): boolean => {
    const rect = getActiveHighlightBounds();
    const anchor =
      (document.querySelector(
        ".osmd-active-bottom-highlight",
      ) as Element | null) ??
      (document.querySelector(
        ".osmd-active-top-highlight",
      ) as Element | null) ??
      (document.querySelector(`.${ACTIVE_HIGHLIGHT_CLASS}`) as Element | null);
    if (!rect || !anchor) return false;

    const parent = findScrollParent(anchor, "y");
    if (!parent) return false;
    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const DEAD_ZONE = 36;

    if (parent === document.scrollingElement) {
      const topLimit = topSafe;
      const bottomLimit = window.innerHeight - bottomSafe;

      let delta = 0;
      if (rect.top < topLimit) delta = rect.top - topLimit;
      else if (rect.bottom > bottomLimit) delta = rect.bottom - bottomLimit;
      else return false;

      if (Math.abs(delta) < DEAD_ZONE) return false;

      // 최상단(0)에서 위로 당기려는 보정은 "툭" 튐을 유발할 수 있어 무시
      if (window.scrollY <= 0 && delta < 0) return false;

      const target = Math.max(0, window.scrollY + delta);
      if (Math.abs(target - window.scrollY) < 1) return false;
      window.scrollTo({ top: target, behavior });
      return true;
    }

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

    // 최상단(0)에서 위로 당기려는 보정은 "툭" 튐을 유발할 수 있어 무시
    if (parent.scrollTop <= 0 && delta < 0) return false;

    const target = Math.max(0, parent.scrollTop + delta);
    if (Math.abs(target - parent.scrollTop) < 1) return false;
    parent.scrollTo({ top: target, behavior });
    return true;
  };

  /** ✅ 커서 기준 세로 보정 (fallback) */
  const scrollToCursorVertIfNeeded = (
    behavior: ScrollBehavior = "smooth",
  ): boolean => {
    const el = getCursorElement();
    if (!el || typeof (el as Element).getBoundingClientRect !== "function")
      return false;

    const rect = el.getBoundingClientRect();
    const yParent = findScrollParent(el, "y");
    if (!yParent) return false;

    const topSafe = getTopSafe();
    const bottomSafe = getBottomSafe();

    const DEAD_ZONE = 36;

    if (yParent === document.scrollingElement) {
      const out =
        rect.top < topSafe || rect.bottom > window.innerHeight - bottomSafe;
      if (!out) return false;

      let target =
        window.scrollY + (rect.top + rect.height / 2) - window.innerHeight / 2;
      if (target < 0) target = 0;

      if (Math.abs(target - window.scrollY) < DEAD_ZONE) return false;

      window.scrollTo({ top: target, behavior });
      return true;
    }

    const parentRect = yParent.getBoundingClientRect();
    const topInParent = rect.top - parentRect.top;
    const bottomInParent = rect.bottom - parentRect.top;

    const out =
      topInParent < topSafe ||
      bottomInParent > yParent.clientHeight - bottomSafe;
    if (!out) return false;

    const centerInParent = topInParent + rect.height / 2;
    let target = yParent.scrollTop + centerInParent - yParent.clientHeight / 2;
    if (target < 0) target = 0;

    if (Math.abs(target - yParent.scrollTop) < DEAD_ZONE) return false;

    yParent.scrollTo({ top: target, behavior });
    return true;
  };

  /** ✅ 페이지 상단 정렬 */
  const scrollToPageTop = (
    pageEl: Element,
    behavior: ScrollBehavior = "auto",
  ) => {
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
    const target = Math.max(
      0,
      yParent.scrollTop + (pageRect.top - parentRect.top) - topSafe,
    );
    if (Math.abs(target - yParent.scrollTop) < DEAD_ZONE) return;
    yParent.scrollTo({ top: target, behavior });
  };

  const ensurePageTop = (pageEl: Element) => {
    let lastXLeft = -1;
    const run = () => {
      // 1. 수평 스크롤: 새 페이지 SVG를 화면에 맞춤
      const xParent = findScrollParent(pageEl, "x");
      if (xParent) {
        const pageRect = (pageEl as HTMLElement).getBoundingClientRect();
        const parentRect = xParent.getBoundingClientRect();
        const leftOffset = pageRect.left - parentRect.left;
        if (leftOffset < -8 || pageRect.right > parentRect.right + 8) {
          const newLeft = Math.max(0, xParent.scrollLeft + leftOffset);
          if (Math.abs(newLeft - lastXLeft) > 1) {
            lastXLeft = newLeft;
            xParent.scrollTo({ left: newLeft, behavior: "auto" });
          }
        }
      }
      // 2. 수직 스크롤: 페이지 맨 위로 이동 (맨 위 악기가 보이도록)
      scrollToPageTop(pageEl, "auto");
    };
    run();
    requestAnimationFrame(run);
    setTimeout(run, 80);
  };

  const postHighlightScroll = (prevPageEl: Element | null) => {
    const run = () => {
      const nextEl = getPageElement();
      const changed =
        prevPageEl != null && nextEl != null && prevPageEl !== nextEl;

      if (nextEl) lastPageElRef.current = nextEl;

      if (changed && nextEl) {
        // 페이지 전환: 수평 스크롤만 (scrollToPageTop 제거로 bounce 방지)
        ensurePageTop(nextEl);
      } else {
        // 같은 페이지: 수직 스크롤로 하이라이트 추적
        const moved = scrollActiveHighlightIntoView("smooth");
        if (!moved) scrollToCursorVertIfNeeded("smooth");
      }
    };

    run();
    requestAnimationFrame(run);
    setTimeout(run, 80);
  };

  // ============================================================
  // ✅ 악보 로드 핸들러
  // ============================================================
  const handleScoreLoaded = async (osmd: OpenSheetMusicDisplay) => {
    setState("loading");

    cleanupPlayerEventsRef.current?.();
    cleanupPlayerEventsRef.current = null;

    try {
      osmdRef.current = osmd;

      const sheet = osmd.Sheet as unknown as { SourceMeasures?: unknown };
      const measures = Array.isArray(sheet?.SourceMeasures)
        ? sheet.SourceMeasures
        : [];
      totalMeasuresRef.current = measures.length;
      setTotalMeasures(measures.length);

      const idx = buildMeasureIndex(osmd.cursor);
      measureToStepRef.current = idx.measureToStep;

      const AudioPlayerCtor =
        AudioPlayer as unknown as new () => OsmdAudioPlayerLike;
      const player = new AudioPlayerCtor();
      playerRef.current = player;

      await player.loadScore(osmd);

      // ============================================================
      // ✅ stepQueue: 같은 tick에 몰린 step들의 간격을 강제로 벌림
      // ============================================================
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sch = (player as any).scheduler;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const steps: any[] = sch?.stepQueue?.steps ?? [];

        if (Array.isArray(steps) && steps.length > 1) {
          // 1) 정수 round
          steps.forEach((s) => {
            if (typeof s?.tick === "number") s.tick = Math.round(s.tick);
          });

          // 2) 정렬
          steps.sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0));

          // 3) 같은 tick이 연속이면 1씩 벌림 (시계 진행에 맞춰 순차 처리되도록)
          let bumped = 0;
          for (let i = 1; i < steps.length; i++) {
            if (steps[i].tick <= steps[i - 1].tick) {
              steps[i].tick = steps[i - 1].tick + 1;
              bumped++;
            }
          }

          if (bumped > 0 && isDev) {
            console.log(
              `[MusicPlayer] stepQueue: ${bumped} step(s) bumped apart`,
            );
          }
        }
      } catch (e) {
        if (isDev) console.warn("[MusicPlayer] stepQueue fix failed:", e);
      }

      // ============================================================
      // ✅ instrument 목록 추출 + 원본 참조 보관
      // ============================================================
      type OsmdInstrumentLike = {
        Name?: string;
        NameLabel?: { text?: string };
        Voices?: Array<{ VoiceId?: number }>;
      };
      const sheetForInstruments = osmd.Sheet as unknown as
        | { Instruments?: OsmdInstrumentLike[] }
        | undefined;
      const rawInstruments = sheetForInstruments?.Instruments ?? [];

      const instrumentList: InstrumentInfo[] = rawInstruments.map((ins, i) => ({
        index: i,
        name: ins.Name ?? ins.NameLabel?.text ?? `Track ${i + 1}`,
      }));

      // ✅ instrument 참조 → index Map (핵심)
      const instrumentRefToIndex = new Map<unknown, number>();
      rawInstruments.forEach((ins, i) => {
        instrumentRefToIndex.set(ins, i);
      });

      setInstruments(instrumentList);
      setMutedIndices(new Set());
      instrumentsRef.current = instrumentList;
      mutedIndicesRef.current = new Set();

      // ============================================================
      // ✅ notePlaybackCallback 오버라이드 — muted 악기 노트 필터링
      // ============================================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pAny = player as any;
      const originalCallback = pAny.notePlaybackCallback?.bind(player);

      if (typeof originalCallback === "function") {
        let loggedShape = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getInstrumentIndexFromNote = (note: any): number | null => {
          try {
            // 경로 1: note.parentStaffEntry.parentStaff.parentInstrument
            const staff =
              note?.parentStaffEntry?.parentStaff ??
              note?.ParentStaffEntry?.ParentStaff ??
              null;
            const ins =
              staff?.parentInstrument ?? staff?.ParentInstrument ?? null;
            if (ins && instrumentRefToIndex.has(ins)) {
              return instrumentRefToIndex.get(ins) ?? null;
            }

            // 경로 2: voiceEntry.parentVoice.parent (Instrument)
            const voice =
              note?.voiceEntry?.parentVoice ??
              note?.ParentVoiceEntry?.ParentVoice ??
              null;
            const insFromVoice = voice?.parent ?? voice?.Parent ?? null;
            if (insFromVoice && instrumentRefToIndex.has(insFromVoice)) {
              return instrumentRefToIndex.get(insFromVoice) ?? null;
            }

            return null;
          } catch {
            return null;
          }
        };

        pAny.notePlaybackCallback = function (
          audioContextTime: number,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scheduledNotes: any,
        ) {
          const muted = mutedIndicesRef.current;

          if (!loggedShape && isDev) {
            const sample = Array.isArray(scheduledNotes)
              ? scheduledNotes[0]
              : null;
            console.log("[MusicPlayer] notePlaybackCallback shape:", {
              isArray: Array.isArray(scheduledNotes),
              length: Array.isArray(scheduledNotes)
                ? scheduledNotes.length
                : null,
              sampleStaff: sample?.parentStaffEntry?.parentStaff,
              sampleInstrumentIndex: sample
                ? getInstrumentIndexFromNote(sample)
                : null,
              instrumentRefMapSize: instrumentRefToIndex.size,
            });
            loggedShape = true;
          }

          if (muted.size === 0) {
            return originalCallback(audioContextTime, scheduledNotes);
          }

          if (Array.isArray(scheduledNotes)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filtered = scheduledNotes.filter((note: any) => {
              const idx = getInstrumentIndexFromNote(note);
              if (idx == null) return true; // 못 찾으면 재생 (안전)
              return !muted.has(idx);
            });
            return originalCallback(audioContextTime, filtered);
          }

          return originalCallback(audioContextTime, scheduledNotes);
        };

        if (isDev) console.log("[MusicPlayer] notePlaybackCallback wrapped ✅");
      } else if (isDev) {
        console.warn("[MusicPlayer] notePlaybackCallback을 찾지 못했습니다.");
      }

      // 초기 페이지 저장
      lastPageElRef.current = getPageElement();

      const onState = (s: unknown) => {
        const ui = normalizeState(s);
        setState(ui);

        if (ui === "idle") {
          try {
            const c = scoreViewerRef.current?.getCursor();
            c?.reset();
            c?.show();
          } catch {}

          setCurrentMeasure(1);
          scoreViewerRef.current?.highlightMeasure(1, {
            scrollIntoView: false,
          });
          lastHighlightedMeasureRef.current = 1;

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

        const useScrollIntoView = !suppress && shouldUseScrollIntoView();

        scoreViewerRef.current?.highlightMeasure(m, {
          scrollIntoView: useScrollIntoView,
        });
        lastHighlightedMeasureRef.current = m;

        const curPageEl = getPageElement();
        if (curPageEl) lastPageElRef.current = curPageEl;

        if (suppress) return;
        postHighlightScroll(prevPageEl);
      };

      const onIterationEvent = () => {
        onIteration();
      };

      if (player.on) {
        player.on("state-change", onState);
        player.on("iteration", onIterationEvent);

        cleanupPlayerEventsRef.current = () => {
          try {
            player.off?.("state-change", onState);
            player.off?.("iteration", onIterationEvent);
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
      toast.error(
        `플레이어 초기화 실패: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
      setState("idle");
    }
  };

  // ============================================================
  // ✅ 곡 끝 감지 — stuck 상태 자동 복구
  // scheduler가 끝을 인식 못 하는 케이스 (악보 데이터 한계로)
  // 마지막 마디 도달 후 일정 시간 진행 없으면 강제 stop
  // ============================================================
  useEffect(() => {
    if (state !== "playing") return;

    let lastStep = -1;
    let stuckCount = 0;
    const STUCK_THRESHOLD = 6; // 300ms × 6 = 1.8초간 진행 없으면 stuck

    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pAny = p as any;
      const total = pAny.iterationSteps ?? 0;
      const current = pAny.currentIterationStep ?? 0;

      // 케이스 1: 끝까지 정상 도달
      if (total > 0 && current >= total) {
        if (isDev) console.log("[MusicPlayer] 곡 끝 도달, stop");
        void p.stop?.();
        setState("idle");
        return;
      }

      // 케이스 2: 마지막 마디 근처에서 stuck (악보 한계)
      const m = currentMeasure ?? 0;
      const totalM = totalMeasuresRef.current;
      const nearEnd = totalM > 0 && m >= totalM - 1;

      if (current === lastStep) {
        stuckCount++;
        if (nearEnd && stuckCount >= STUCK_THRESHOLD) {
          if (isDev) {
            console.log(
              `[MusicPlayer] 마지막 부근(${m}/${totalM})에서 stuck 감지, 강제 stop`,
            );
          }
          void p.stop?.();
          setState("idle");
          return;
        }
      } else {
        stuckCount = 0;
        lastStep = current;
      }
    }, 300);

    return () => clearInterval(interval);
  }, [state, currentMeasure]);

  // ============================================================
  // ✅ 재생 제어
  // ============================================================
  const play = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    await p.play();
  }, []);

  const pause = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
  }, []);

  const stop = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      await p.stop();
    } catch {}
  }, []);

  const jumpToMeasure = useCallback(async (
    measure: number,
    autoplay = true,
    source: JumpSource = "control",
  ) => {
    const p = playerRef.current;
    if (!p) return;

    const m = Math.min(
      Math.max(measure, 1),
      Math.max(totalMeasuresRef.current, 1),
    );
    const step = measureToStepRef.current.get(m);

    if (step == null) {
      if (isDev) console.warn("No step mapping for measure:", m);
      return;
    }

    if (typeof p.jumpToStep !== "function") {
      toast.error(
        "이 버전의 osmd-audio-player에서 jumpToStep을 찾지 못했습니다.",
      );
      return;
    }

    const prevPageEl = lastPageElRef.current ?? getPageElement();

    p.jumpToStep(step);
    setCurrentMeasure(m);

    const fromClick = source === "click";
    const useScrollIntoView = !fromClick && shouldUseScrollIntoView();

    scoreViewerRef.current?.highlightMeasure(m, {
      scrollIntoView: useScrollIntoView,
    });
    lastHighlightedMeasureRef.current = m;

    try {
      const c = scoreViewerRef.current?.getCursor();
      c?.show();
    } catch {}

    suppressAutoScrollUntilRef.current =
      performance.now() + (fromClick ? 320 : 180);

    if (!fromClick) {
      postHighlightScroll(prevPageEl);
    } else {
      const curPageEl = getPageElement();
      if (curPageEl) lastPageElRef.current = curPageEl;
    }

    if (autoplay) await p.play();
  }, []); // refs만 사용하므로 deps 없음

  // ============================================================
  // ✅ 악기 믹서 핸들러
  // ============================================================
  const handleToggleMute = (index: number) => {
    setMutedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      mutedIndicesRef.current = next; // 즉시 ref 동기화
      return next;
    });
  };

  const handleSolo = (index: number) => {
    const next = new Set(
      instrumentsRef.current.map((i) => i.index).filter((i) => i !== index),
    );
    mutedIndicesRef.current = next;
    setMutedIndices(next);
  };

  const handleAll = () => {
    const next = new Set<number>();
    mutedIndicesRef.current = next;
    setMutedIndices(next);
  };

  // 재생바 노드를 부모(Header)로 올리기
  const onControlBarRef = useRef(onControlBar);
  useEffect(() => {
    onControlBarRef.current = onControlBar;
  }, [onControlBar]);

  useEffect(() => {
    onControlBarRef.current?.(
      state === "loading" ? null : (
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
      ),
    );
  }, [
    state,
    currentMeasure,
    totalMeasures,
    play,
    pause,
    stop,
    jumpToMeasure,
    onRequestChangeFile,
  ]);

  // ============================================================
  // ✅ cleanup
  // ============================================================
  useEffect(() => {
    return () => {
      cleanupPlayerEventsRef.current?.();
      cleanupPlayerEventsRef.current = null;

      const p = playerRef.current;
      playerRef.current = null;
      if (p) {
        // stop()은 Promise를 반환하고, 내부에서 cursor가 null이면 reject → 동기 try/catch로는 잡히지 않음
        void Promise.resolve(p.stop?.()).catch(() => {});
      }
    };
  }, []);

  if (!xmlData) return null;

  return (
    <div className="flex h-full w-full flex-col">
      {state === "loading" ? (
        <div className="fixed bottom-0 right-0 top-17 z-50 flex items-center justify-center bg-[#05070a]" style={{ left: isSidebarCollapsed ? 72 : 308, transition: "left 0.3s ease" }}>
          <div className="flex flex-col items-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-gray-400">악보를 불러오는 중…</p>
          </div>
        </div>
      ) : null}

      {/* INSTRUMENTS: player 스크롤 중에도 Header 아래에 고정 */}
      <div data-instruments-sticky className="sticky top-0 z-30 shrink-0">
        <div className="relative">
          <div className="w-full border border-[#1e293b] bg-[#0f1218]/70 backdrop-blur">
            <button
              type="button"
              onClick={() => setIsInstrumentsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3"
              aria-expanded={isInstrumentsOpen}
            >
              <span className="text-xs uppercase tracking-widest text-white/90">
                Instruments - 소리 제어
              </span>
              <span className="shrink-0 text-gray-400">
                {isInstrumentsOpen ? (
                  <ChevronUp className="size-4" strokeWidth={2} aria-hidden />
                ) : (
                  <ChevronDown className="size-4" strokeWidth={2} aria-hidden />
                )}
              </span>
            </button>
          </div>

          {isInstrumentsOpen ? (
            <div className="absolute left-0 right-0 top-full border border-[#1e293b] bg-[#0f1218]/95 px-4 py-3 backdrop-blur">
              <InstrumentMixer
                instruments={instruments}
                mutedIndices={mutedIndices}
                onToggleMute={handleToggleMute}
                onSolo={handleSolo}
                onAll={handleAll}
                disabled={state === "loading"}
                showHeader={false}
                isLoading={state === "loading" && instruments.length === 0}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* 악보 */}
      <div
        ref={controlBarRef}
        className="min-h-0 flex-1"
        style={{ overflowAnchor: "none" }}
      >
        <ScoreViewer
          ref={scoreViewerRef}
          xmlData={xmlData}
          onScoreLoaded={handleScoreLoaded}
          onMeasureClick={(mm) => jumpToMeasure(mm, true, "click")}
          highlightedInstrumentIndex="last"
        />
      </div>
    </div>
  );
}
