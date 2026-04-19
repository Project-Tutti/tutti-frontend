// components/music/MusicPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import AudioPlayer from "osmd-audio-player";
import ScoreViewer, { ScoreViewerRef } from "./ScoreViewer";
import PlaybackControl from "./PlaybackControl";
import InstrumentMixer, { InstrumentInfo } from "./InstrumentMixer";
import { buildMeasureIndex, getMeasureNumberFromCursor } from "./MeasureIndex";
import { toast } from "@/components/common/Toast";

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
}

export default function MusicPlayer({
  xmlData,
  autoPlay = false,
  onRequestChangeFile,
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

  // ✅ sticky 재생바 높이 기반 topSafe 계산
  const controlBarRef = useRef<HTMLDivElement>(null);

  const getTopSafe = () => {
    const barH = controlBarRef.current?.getBoundingClientRect().height ?? 0;
    return Math.max(80, Math.round(barH) + 28);
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

  /** ✅ 현재 active 하이라이트 rect */
  const getActiveHighlightElement = (): Element | null => {
    return document.querySelector(`.${ACTIVE_HIGHLIGHT_CLASS}`);
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

  /** ✅ 커서가 속한 "페이지" DOM */
  const getPageElement = (): Element | null => {
    const el = getCursorElement();
    if (!el) return null;

    return (
      (el as HTMLElement).closest?.(
        ".osmdPage, .osmd-page, .page, .osmdPageContainer, .osmd-page-container, [id^='osmdPage'], [class*='osmdPage'], [data-osmd-page]",
      ) ??
      (el as HTMLElement).closest?.("svg") ??
      null
    );
  };

  /** ✅ 커서가 화면 안에 충분히 보이면 scrollIntoView OFF */
  const shouldUseScrollIntoView = (): boolean => {
    const el = getCursorElement();
    if (!el || typeof (el as Element).getBoundingClientRect !== "function")
      return true;

    const rect = el.getBoundingClientRect();
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
    const el = getActiveHighlightElement();
    if (!el || typeof (el as Element).getBoundingClientRect !== "function")
      return false;

    const parent = findScrollParent(el, "y");
    if (!parent) return false;

    const rect = el.getBoundingClientRect();
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

      window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior });
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

    parent.scrollTo({ top: Math.max(0, parent.scrollTop + delta), behavior });
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
    const run = () => {
      scrollToPageTop(pageEl, "auto");
      scrollActiveHighlightIntoView("auto");
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
        ensurePageTop(nextEl);
      } else {
        const moved = scrollActiveHighlightIntoView("smooth");
        if (!moved) {
          scrollToCursorVertIfNeeded("smooth");
        }
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
    try {
      await p.stop();
    } catch {
      // PlaybackEngine.stop() 내부에서 cursor 등이 null이면 reject될 수 있음
    }
  };

  const jumpToMeasure = async (
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
  };

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

      {/* ✅ 악기 믹서 */}
      <InstrumentMixer
        instruments={instruments}
        mutedIndices={mutedIndices}
        onToggleMute={handleToggleMute}
        onSolo={handleSolo}
        onAll={handleAll}
        disabled={state === "loading"}
        // 초기 로드(악기 목록이 비어있을 때)만 스켈레톤 표시.
        // 점프/재렌더/재로딩 시에는 기존 악기 목록을 유지해 깜빡임을 줄임.
        isLoading={state === "loading" && instruments.length === 0}
      />

      {/* 브라우저 scroll anchoring 점프 완화 */}
      <div style={{ overflowAnchor: "none" }}>
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
