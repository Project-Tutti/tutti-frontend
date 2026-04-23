"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { OpenSheetMusicDisplay, Cursor } from "opensheetmusicdisplay";
import JSZip from "jszip";
import { toast } from "@/components/common/Toast";

const isDev = process.env.NODE_ENV === "development";

interface ScoreViewerProps {
  xmlData?: string | ArrayBuffer | File;

  onScoreLoaded?: (osmd: OpenSheetMusicDisplay) => void;

  /** 마디 클릭하면 MusicPlayer에서 jumpToMeasure로 처리 */
  onMeasureClick?: (measureNumber: number) => void;

  /** 마디 hover 표시(선택) */
  onMeasureHover?: (measureNumber: number | null) => void;

  /**
   * ✅ "맨 아래 트랙(생성된 트랙)"을 다른 색으로 분리 하이라이트할지
   * - number: 해당 인덱스
   * - "last": 맨 아래 instrument
   * - null/undefined: 분리 없이 단일 색
   */
  highlightedInstrumentIndex?: number | "last" | null;
}

export interface ScoreViewerRef {
  getOSMD: () => OpenSheetMusicDisplay | null;
  getCursor: () => Cursor | null;
  reload: () => Promise<void>;

  /** 재생 중/선택된 마디(Active) 하이라이트 */
  highlightMeasure: (
    measureNumber: number | null,
    opts?: { scrollIntoView?: boolean },
  ) => void;
}

type MeasureBox = {
  measure: number;
  svg: SVGSVGElement;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
};

type BBoxUnion = { minX: number; minY: number; maxX: number; maxY: number };

/** instrument별 시스템의 y 범위 캐시 */
type SystemYInfo = {
  minY: number;
  maxY: number;
  ratio: number;
  svg: SVGSVGElement;
};
type InstrumentYRange = {
  // pages[pageIdx][sysIdx] = info | null
  pages: Array<Array<SystemYInfo | null>>;
};

const ACTIVE_CLASS = "osmd-active-measure-highlight"; // 단일 모드
const ACTIVE_TOP_CLASS = "osmd-active-top-highlight"; // 위쪽 트랙
const ACTIVE_BOTTOM_CLASS = "osmd-active-bottom-highlight"; // generated 트랙
const HOVER_CLASS = "osmd-hover-measure-highlight";

/** 마디 하이라이트 좌측 여백 (SVG units) — 왼쪽 마디 침범 방지 */
const HIGHLIGHT_X_INSET = 4;

const ScoreViewer = forwardRef<ScoreViewerRef, ScoreViewerProps>(
  (
    {
      xmlData,
      onScoreLoaded,
      onMeasureClick,
      onMeasureHover,
      highlightedInstrumentIndex = null,
    },
    ref,
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const renderRef = useRef<HTMLDivElement>(null);

    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const cursorRef = useRef<Cursor | null>(null);

    const measureBoxMapRef = useRef<Map<number, MeasureBox>>(new Map());
    const measureBoxesRef = useRef<MeasureBox[]>([]);

    const hoveredMeasureRef = useRef<number | null>(null);
    const cleanupHandlersRef = useRef<(() => void) | null>(null);

    /** instrument별 y 범위 캐시 */
    const instrumentYRangesRef = useRef<InstrumentYRange[]>([]);

    /** 최신 prop ref */
    const highlightedInstrumentIndexRef = useRef(highlightedInstrumentIndex);
    useEffect(() => {
      highlightedInstrumentIndexRef.current = highlightedInstrumentIndex;
    }, [highlightedInstrumentIndex]);

    /** 콜백은 ref로 최신값 유지 — loadScore 의존성을 xmlData 중심으로 두기 위함 */
    const onScoreLoadedRef = useRef(onScoreLoaded);
    const onMeasureClickRef = useRef(onMeasureClick);
    const onMeasureHoverRef = useRef(onMeasureHover);
    useEffect(() => {
      onScoreLoadedRef.current = onScoreLoaded;
      onMeasureClickRef.current = onMeasureClick;
      onMeasureHoverRef.current = onMeasureHover;
    }, [onScoreLoaded, onMeasureClick, onMeasureHover]);

    /** highlightHover ref — event handler 클로저에서 최신값 참조용 */
    const highlightHoverRef = useRef<
      ((measureNumber: number | null) => void) | null
    >(null);

    const [hoveredEdge, setHoveredEdge] = useState<"left" | "right" | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [currentPageIdx, setCurrentPageIdx] = useState(0);

    // -----------------------------
    // Utils
    // -----------------------------
    const getAllSvgs = useCallback((): SVGSVGElement[] => {
      const root = renderRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll("svg")) as SVGSVGElement[];
    }, []);

    const clearHighlightByClass = useCallback(
      (className: string) => {
        const svgs = getAllSvgs();
        for (const svg of svgs) {
          svg.querySelectorAll(`.${className}`).forEach((el) => el.remove());
        }
      },
      [getAllSvgs],
    );

    const parseMeasureNumberFromLabel = useCallback(
      (label: string): number | null => {
        const patterns: RegExp[] = [
          /vexflow-measure-(\d+)/i,
          /vf[-_]?measure[-_]?(\d+)/i,
          /measure[_-](\d+)/i,
          /\bm[_-](\d+)\b/i,
          /(\d+)[_-]staff/i,
        ];

        for (const p of patterns) {
          const m = label.match(p);
          if (m?.[1]) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n)) return n;
          }
        }

        const any = label.match(/(\d+)/);
        if (any?.[1]) {
          const n = parseInt(any[1], 10);
          return Number.isNaN(n) ? null : n;
        }

        return null;
      },
      [],
    );

    const buildMeasureBoxesIndex = useCallback(() => {
      const map = new Map<number, MeasureBox>();
      const all: MeasureBox[] = [];

      const svgs = getAllSvgs();
      for (const svg of svgs) {
        const groups = Array.from(
          svg.querySelectorAll(
            'g[class*="measure"], g[class*="Measure"], g[id*="measure"], g[id*="Measure"]',
          ),
        ) as SVGGraphicsElement[];

        const union = new Map<number, BBoxUnion>();

        for (const g of groups) {
          const id = g.getAttribute("id") || "";
          const cls = g.getAttribute("class") || "";
          const label = `${id} ${cls}`.trim();

          const m = parseMeasureNumberFromLabel(label);
          if (m == null) continue;

          try {
            const b = g.getBBox();
            const u = union.get(m);
            if (!u) {
              union.set(m, {
                minX: b.x,
                minY: b.y,
                maxX: b.x + b.width,
                maxY: b.y + b.height,
              });
            } else {
              u.minX = Math.min(u.minX, b.x);
              u.minY = Math.min(u.minY, b.y);
              u.maxX = Math.max(u.maxX, b.x + b.width);
              u.maxY = Math.max(u.maxY, b.y + b.height);
            }
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
        }

        for (const [measure, u] of union.entries()) {
          const x = u.minX;
          const y = u.minY;
          const w = Math.max(0, u.maxX - u.minX);
          const h = Math.max(0, u.maxY - u.minY);
          const box: MeasureBox = {
            measure,
            svg,
            x,
            y,
            w,
            h,
            cx: x + w / 2,
            cy: y + h / 2,
          };
          all.push(box);

          if (!map.has(measure)) map.set(measure, box);
        }
      }

      measureBoxMapRef.current = map;
      measureBoxesRef.current = all;
    }, [getAllSvgs, parseMeasureNumberFromLabel]);

    // ============================================================
    // ✅ instrument별 y 범위 캐시 빌드 (GraphicSheet 기반)
    // ============================================================
    const buildInstrumentYRanges = useCallback(() => {
      const osmd = osmdRef.current;
      if (!osmd) {
        instrumentYRangesRef.current = [];
        return;
      }

      try {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const sheet = osmd.Sheet as any;
        const graphic =
          (osmd as any).graphicSheet ??
          (osmd as any).GraphicSheet ??
          (osmd as any).graphic;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const instruments = sheet?.Instruments ?? sheet?.instruments ?? [];
        const pages = graphic?.MusicPages ?? graphic?.musicPages ?? [];
        const svgs = getAllSvgs();

        if (!Array.isArray(instruments) || instruments.length === 0) {
          instrumentYRangesRef.current = [];
          return;
        }

        const result: InstrumentYRange[] = instruments.map(() => ({
          pages: [],
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pages.forEach((page: any, pageIdx: number) => {
          const svg = svgs[pageIdx];
          if (!svg) return;

          const viewBox = svg.viewBox?.baseVal;
          const pageSize =
            page?.PositionAndShape?.Size ??
            page?.positionAndShape?.size ??
            null;
          if (!viewBox || !pageSize || pageSize.width <= 0) return;

          const ratio = viewBox.width / pageSize.width;
          const systems = page?.MusicSystems ?? page?.musicSystems ?? [];

          // 이 페이지의 systems 슬롯 초기화
          instruments.forEach((_: unknown, insIdx: number) => {
            const arr: Array<SystemYInfo | null> = new Array(
              systems.length,
            ).fill(null);
            result[insIdx].pages[pageIdx] = arr;
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          systems.forEach((system: any, sysIdx: number) => {
            const staffLines = system?.StaffLines ?? system?.staffLines ?? [];

            // 객체 참조 비교 대신 Id로 비교 (OSMD가 렌더링 시 다른 인스턴스를 반환할 수 있음)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const byInstrumentId = new Map<number, any[]>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            staffLines.forEach((sl: any) => {
              const staff = sl?.ParentStaff ?? sl?.parentStaff ?? null;
              const ins =
                staff?.ParentInstrument ?? staff?.parentInstrument ?? null;
              if (!ins) return;
              const insId: number = ins?.Id ?? ins?.id ?? ins?.IdString ?? -1;
              if (insId < 0) return;
              if (!byInstrumentId.has(insId)) byInstrumentId.set(insId, []);
              byInstrumentId.get(insId)!.push(sl);
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            instruments.forEach((ins: any, insIdx: number) => {
              const insId: number =
                ins?.Id ?? ins?.id ?? ins?.IdString ?? insIdx;
              const matched = byInstrumentId.get(insId) ?? [];
              if (matched.length === 0) return;

              let minY = Infinity;
              let maxY = -Infinity;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              matched.forEach((sl: any) => {
                const ps = sl?.PositionAndShape ?? sl?.positionAndShape ?? null;
                if (!ps) return;
                const pos = ps.AbsolutePosition ?? ps.absolutePosition;
                const size = ps.Size ?? ps.size;
                if (!pos || !size) return;
                if (
                  typeof pos.y !== "number" ||
                  typeof size.height !== "number"
                )
                  return;

                if (pos.y < minY) minY = pos.y;
                if (pos.y + size.height > maxY) maxY = pos.y + size.height;
              });

              if (!isFinite(minY)) return;

              result[insIdx].pages[pageIdx][sysIdx] = {
                minY,
                maxY,
                ratio,
                svg,
              };
            });
          });
        });

        instrumentYRangesRef.current = result;
        if (isDev) {
          console.log(
            `[ScoreViewer] instrument Y ranges built: ${result.length} instruments`,
          );
        }
      } catch (e) {
        console.error("[ScoreViewer] buildInstrumentYRanges failed:", e);
        instrumentYRangesRef.current = [];
      }
    }, [getAllSvgs]);

    // ============================================================
    // ✅ measureBox → 어느 system에 속하는지 찾기
    // ============================================================
    const findSystemForMeasureBox = useCallback(
      (box: MeasureBox): { pageIdx: number; sysIdx: number } | null => {
        const osmd = osmdRef.current;
        if (!osmd) return null;

        try {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const graphic =
            (osmd as any).graphicSheet ??
            (osmd as any).GraphicSheet ??
            (osmd as any).graphic;
          /* eslint-enable @typescript-eslint/no-explicit-any */
          const pages = graphic?.MusicPages ?? graphic?.musicPages ?? [];
          const svgs = getAllSvgs();

          const pageIdx = svgs.indexOf(box.svg);
          if (pageIdx < 0) return null;

          const page = pages[pageIdx];
          if (!page) return null;

          const viewBox = box.svg.viewBox?.baseVal;
          const pageSize =
            page?.PositionAndShape?.Size ??
            page?.positionAndShape?.size ??
            null;
          if (!viewBox || !pageSize || pageSize.width <= 0) return null;
          const ratio = viewBox.width / pageSize.width;

          const systems = page?.MusicSystems ?? page?.musicSystems ?? [];

          // box.cy(SVG unit) → OSMD unit
          const cyOsmd = box.cy / ratio;

          let bestIdx = -1;
          let bestDist = Infinity;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          systems.forEach((system: any, sysIdx: number) => {
            const ps =
              system?.PositionAndShape ?? system?.positionAndShape ?? null;
            if (!ps) return;
            const pos = ps.AbsolutePosition ?? ps.absolutePosition;
            const size = ps.Size ?? ps.size;
            if (!pos || !size) return;

            const top = pos.y;
            const bottom = pos.y + size.height;
            const center = (top + bottom) / 2;

            if (cyOsmd >= top && cyOsmd <= bottom) {
              bestIdx = sysIdx;
              bestDist = 0;
              return;
            }
            const d = Math.abs(cyOsmd - center);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = sysIdx;
            }
          });

          return bestIdx >= 0 ? { pageIdx, sysIdx: bestIdx } : null;
        } catch {
          return null;
        }
      },
      [getAllSvgs],
    );

    // ============================================================
    // Rect 삽입
    // ============================================================
    const insertRect = useCallback(
      (box: MeasureBox, className: string, fill: string, xInset = 0) => {
        const svg = box.svg;

        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        rect.setAttribute("x", String(box.x + xInset));
        rect.setAttribute("y", String(box.y));
        rect.setAttribute("width", String(Math.max(0, box.w - xInset)));
        rect.setAttribute("height", String(box.h));
        rect.setAttribute("fill", fill);
        rect.setAttribute("class", className);
        rect.setAttribute("pointer-events", "none");

        if (svg.firstChild) svg.insertBefore(rect, svg.firstChild);
        else svg.appendChild(rect);
      },
      [],
    );

    const insertRawRect = useCallback(
      (
        svg: SVGSVGElement,
        x: number,
        y: number,
        w: number,
        h: number,
        className: string,
        fill: string,
      ) => {
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(w));
        rect.setAttribute("height", String(h));
        rect.setAttribute("fill", fill);
        rect.setAttribute("class", className);
        rect.setAttribute("pointer-events", "none");
        rect.setAttribute("rx", "3");
        rect.setAttribute("ry", "3");

        if (svg.firstChild) svg.insertBefore(rect, svg.firstChild);
        else svg.appendChild(rect);
      },
      [],
    );

    /** 각 페이지 SVG 하단의 빈 흰 공간을 잘라냄 */
    const clipSvgsToContent = useCallback(() => {
      const svgs = getAllSvgs();
      if (svgs.length === 0) return;

      // 1패스: 모든 페이지의 콘텐츠 하단을 측정해서 최대값 구하기
      const pageInfos: Array<{
        svg: SVGSVGElement;
        svgH: number;
        contentPxH: number;
        vbHeight: number;
        vbX: number;
        vbY: number;
        vbW: number;
      }> = [];

      for (const svg of svgs) {
        try {
          const svgRect = svg.getBoundingClientRect();
          if (svgRect.height <= 0) continue;

          const groups = svg.querySelectorAll(
            'g[class*="measure"], g[class*="Measure"], g[id*="measure"], g[id*="Measure"]',
          );

          let maxRelBottom = 0;
          for (const el of Array.from(groups)) {
            try {
              const r = (el as Element).getBoundingClientRect();
              const relBottom = r.bottom - svgRect.top;
              if (relBottom > maxRelBottom && relBottom <= svgRect.height + 2) {
                maxRelBottom = relBottom;
              }
            } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
          }

          if (maxRelBottom <= 0) continue;

          const vb = svg.viewBox?.baseVal;
          if (!vb || vb.height <= 0) continue;

          pageInfos.push({
            svg,
            svgH: svgRect.height,
            contentPxH: maxRelBottom + 24,
            vbHeight: vb.height,
            vbX: vb.x,
            vbY: vb.y,
            vbW: vb.width,
          });
        } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
      }

      if (pageInfos.length === 0) return;

      // 모든 페이지 중 가장 큰 콘텐츠 높이로 통일
      const targetPxH = Math.max(...pageInfos.map((p) => p.contentPxH));

      // 2패스: 동일한 높이로 클립
      for (const info of pageInfos) {
        try {
          const finalPxH = Math.min(targetPxH, info.svgH);
          if (finalPxH >= info.svgH - 10) continue;
          const newVBH = info.vbHeight * (finalPxH / info.svgH);
          info.svg.setAttribute(
            "viewBox",
            `${info.vbX} ${info.vbY} ${info.vbW} ${newVBH}`,
          );
          info.svg.style.height = `${finalPxH}px`;
        } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
      }
    }, [getAllSvgs]);

    const scrollPageIntoView = useCallback((box: MeasureBox) => {
      try {
        const container = scrollRef.current;
        if (!container) return;
        const svgRect = box.svg.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const currentLeft = container.scrollLeft;
        // SVG 왼쪽 끝을 기준으로 컨테이너 내 절대 위치 계산
        const svgLeftAbs = svgRect.left - cRect.left + currentLeft;
        // SVG 중심이 컨테이너 중심에 오도록 scrollLeft 계산
        const targetLeft = svgLeftAbs - (cRect.width - svgRect.width) / 2;
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: "smooth",
        });
      } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
    }, []);

    const getCurrentPageIndex = useCallback((): number => {
      const container = scrollRef.current;
      if (!container) return 0;
      const svgs = getAllSvgs();
      if (svgs.length === 0) return 0;

      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const viewCenter = scrollLeft + containerWidth / 2;
      const cRect = container.getBoundingClientRect();

      let bestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < svgs.length; i++) {
        const svgRect = svgs[i].getBoundingClientRect();
        const svgLeftAbs = svgRect.left - cRect.left + scrollLeft;
        const svgCenter = svgLeftAbs + svgRect.width / 2;
        const dist = Math.abs(viewCenter - svgCenter);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    }, [getAllSvgs]);

    const navigatePage = useCallback((direction: "prev" | "next") => {
      const container = scrollRef.current;
      if (!container) return;
      const svgs = getAllSvgs();
      if (svgs.length <= 1) return;

      const currentIdx = getCurrentPageIndex();
      const targetIdx =
        direction === "next"
          ? Math.min(currentIdx + 1, svgs.length - 1)
          : Math.max(currentIdx - 1, 0);
      if (targetIdx === currentIdx) return;

      const targetSvg = svgs[targetIdx];
      const cRect = container.getBoundingClientRect();
      const svgRect = targetSvg.getBoundingClientRect();
      const svgLeftAbs = svgRect.left - cRect.left + container.scrollLeft;
      const targetLeft = svgLeftAbs - (cRect.width - svgRect.width) / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }, [getAllSvgs, getCurrentPageIndex]);

    // ============================================================
    // ✅ 핵심: 마디 하이라이트 (위쪽 트랙 / generated 트랙 분리)
    // ============================================================
    const highlightMeasure = useCallback(
      (measureNumber: number | null, opts?: { scrollIntoView?: boolean }) => {
        clearHighlightByClass(ACTIVE_CLASS);
        clearHighlightByClass(ACTIVE_TOP_CLASS);
        clearHighlightByClass(ACTIVE_BOTTOM_CLASS);

        if (measureNumber == null) return;

        const box = measureBoxMapRef.current.get(measureNumber);
        if (!box) return;

        const target = highlightedInstrumentIndexRef.current;
        const ranges = instrumentYRangesRef.current;
        const osmd = osmdRef.current;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sheet = osmd?.Sheet as any;
        const instruments = sheet?.Instruments ?? sheet?.instruments ?? [];

        // 분리 모드 비활성 또는 instrument 1개 → 단일 active
        if (target == null || instruments.length < 2 || ranges.length === 0) {
          insertRect(
            box,
            ACTIVE_CLASS,
            "rgba(59,130,246,0.16)",
            HIGHLIGHT_X_INSET,
          );
          if (opts?.scrollIntoView) scrollPageIntoView(box);
          return;
        }

        const targetIdx = target === "last" ? instruments.length - 1 : target;
        if (targetIdx < 0 || targetIdx >= instruments.length) {
          insertRect(
            box,
            ACTIVE_CLASS,
            "rgba(59,130,246,0.16)",
            HIGHLIGHT_X_INSET,
          );
          if (opts?.scrollIntoView) scrollPageIntoView(box);
          return;
        }

        const sysInfo = findSystemForMeasureBox(box);
        if (!sysInfo) {
          insertRect(
            box,
            ACTIVE_CLASS,
            "rgba(59,130,246,0.16)",
            HIGHLIGHT_X_INSET,
          );
          if (opts?.scrollIntoView) scrollPageIntoView(box);
          return;
        }

        const { pageIdx, sysIdx } = sysInfo;

        let topMinY = Infinity;
        let topMaxY = -Infinity;
        let bottomMinY = Infinity;
        let bottomMaxY = -Infinity;
        let ratio = 1;
        let svg: SVGSVGElement | null = null;

        for (let i = 0; i < instruments.length; i++) {
          const r = ranges[i]?.pages?.[pageIdx]?.[sysIdx];
          if (!r) continue;
          ratio = r.ratio;
          svg = r.svg;

          if (i === targetIdx) {
            if (r.minY < bottomMinY) bottomMinY = r.minY;
            if (r.maxY > bottomMaxY) bottomMaxY = r.maxY;
          } else {
            if (r.minY < topMinY) topMinY = r.minY;
            if (r.maxY > topMaxY) topMaxY = r.maxY;
          }
        }

        if (!svg) {
          insertRect(
            box,
            ACTIVE_CLASS,
            "rgba(59,130,246,0.16)",
            HIGHLIGHT_X_INSET,
          );
          if (opts?.scrollIntoView) scrollPageIntoView(box);
          return;
        }

        // 위쪽 트랙 (파란색)
        if (isFinite(topMinY)) {
          const padTop = 8;
          const padBottom = -26; // ✅ 초록 padTop(30) - 기본(8) = 22 만큼 줄임
          const y = topMinY * ratio - padTop;
          const h = (topMaxY - topMinY) * ratio + padTop + padBottom;
          insertRawRect(
            svg,
            box.x + HIGHLIGHT_X_INSET,
            y,
            Math.max(0, box.w - HIGHLIGHT_X_INSET),
            h,
            ACTIVE_TOP_CLASS,
            "rgba(59,130,246,0.16)",
          );
        }

        // 맨 아래 트랙 (초록색 — generated)
        if (isFinite(bottomMinY)) {
          const padTop = 30;
          const padBottom = 8;
          const y = bottomMinY * ratio - padTop;
          const h = (bottomMaxY - bottomMinY) * ratio + padTop + padBottom;
          insertRawRect(
            svg,
            box.x + HIGHLIGHT_X_INSET,
            y,
            Math.max(0, box.w - HIGHLIGHT_X_INSET),
            h,
            ACTIVE_BOTTOM_CLASS,
            "rgba(16,185,129,0.22)",
          );
        }

        if (opts?.scrollIntoView) scrollPageIntoView(box);
      },
      [
        clearHighlightByClass,
        insertRect,
        insertRawRect,
        scrollPageIntoView,
        findSystemForMeasureBox,
      ],
    );

    const highlightHover = useCallback(
      (measureNumber: number | null) => {
        clearHighlightByClass(HOVER_CLASS);
        if (measureNumber == null) return;

        const box = measureBoxMapRef.current.get(measureNumber);
        if (!box) return;

        insertRect(box, HOVER_CLASS, "rgba(148,163,184,0.16)");
      },
      [clearHighlightByClass, insertRect],
    );

    // highlightHover ref 동기화
    useEffect(() => {
      highlightHoverRef.current = highlightHover;
    }, [highlightHover]);

    const applyPointerCursorToMeasures = useCallback(() => {
      const svgs = getAllSvgs();
      for (const svg of svgs) {
        const groups = Array.from(
          svg.querySelectorAll(
            'g[class*="measure"], g[class*="Measure"], g[id*="measure"], g[id*="Measure"]',
          ),
        ) as SVGGraphicsElement[];

        for (const g of groups) {
          try {
            g.style.cursor = "pointer";
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
        }
      }
    }, [getAllSvgs]);

    const readMusicXml = useCallback(async (): Promise<string | null> => {
      if (!xmlData) return null;

      if (xmlData instanceof File) {
        const name = xmlData.name.toLowerCase();
        if (name.endsWith(".mxl")) {
          const arrayBuffer = await xmlData.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);

          let musicXmlContent = "";

          const containerFile = zip.file("META-INF/container.xml");
          if (containerFile) {
            const containerXml = await containerFile.async("string");
            const match = containerXml.match(/full-path="([^"]+)"/);
            const musicXmlPath = match ? match[1] : null;

            if (musicXmlPath) {
              const musicXmlFile = zip.file(musicXmlPath);
              if (musicXmlFile)
                musicXmlContent = await musicXmlFile.async("string");
            }
          }

          if (!musicXmlContent) {
            const xmlFiles = Object.keys(zip.files).filter(
              (n) => n.endsWith(".xml") && !n.includes("META-INF"),
            );
            if (xmlFiles.length > 0) {
              const f = zip.file(xmlFiles[0]);
              if (f) musicXmlContent = await f.async("string");
            }
          }

          if (!musicXmlContent)
            throw new Error("MXL에서 유효한 MusicXML을 찾지 못했습니다.");
          return musicXmlContent;
        }

        return await xmlData.text();
      }

      if (typeof xmlData === "string") return xmlData;

      const decoder = new TextDecoder("utf-8");
      return decoder.decode(xmlData);
    }, [xmlData]);

    useEffect(() => {
      setCurrentPageIdx(0);
    }, [xmlData]);

    // -----------------------------
    // Hit test
    // -----------------------------
    const getSvgPoint = (
      svg: SVGSVGElement,
      clientX: number,
      clientY: number,
    ) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const tryFindMeasureFromDomPath = useCallback(
      (target: Element | null, svg: SVGSVGElement) => {
        let el: Element | null = target;
        while (el && el !== svg) {
          const id = el.getAttribute("id") || "";
          const cls = el.getAttribute("class") || "";
          const label = `${id} ${cls}`.trim();
          const m = parseMeasureNumberFromLabel(label);
          if (m != null) return m;
          el = el.parentElement;
        }
        return null;
      },
      [parseMeasureNumberFromLabel],
    );

    const findMeasureByPoint = (
      svg: SVGSVGElement,
      x: number,
      y: number,
    ): number | null => {
      const boxes = measureBoxesRef.current.filter((b) => b.svg === svg);
      if (boxes.length === 0) return null;

      const tol = 8;
      let best: { m: number; dist: number } | null = null;

      for (const b of boxes) {
        const hit =
          x >= b.x - tol &&
          x <= b.x + b.w + tol &&
          y >= b.y - tol &&
          y <= b.y + b.h + tol;
        if (!hit) continue;

        const d = Math.hypot(x - b.cx, y - b.cy);
        if (!best || d < best.dist) best = { m: b.measure, dist: d };
      }

      return best ? best.m : null;
    };

    // -----------------------------
    // Render / Load
    // -----------------------------
    const loadScore = useCallback(async () => {
      if (!renderRef.current || !xmlData) return;

      cleanupHandlersRef.current?.();
      cleanupHandlersRef.current = null;

      renderRef.current.innerHTML = "";

      try {
        if (!osmdRef.current) {
          osmdRef.current = new OpenSheetMusicDisplay(renderRef.current, {
            backend: "svg",
            autoResize: false,
            drawTitle: true,
            drawComposer: true,
            drawCredits: false,
            pageFormat: "A4_P",
          } as unknown as Record<string, unknown>);
          // 2번째 시스템부터 악기 약어가 악보를 침범하지 않도록
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rules = (osmdRef.current as any).EngravingRules;
            if (rules) {
              rules.InstrumentLabelTextHeight = 1.5;
              rules.SystemLabelsRightMargin = 3;
            }
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
        } else {
          try {
            osmdRef.current.clear();
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
        }

        const xmlString = await readMusicXml();
        if (!xmlString) return;

        await osmdRef.current.load(xmlString);

        const zoomable = osmdRef.current as unknown as {
          Zoom?: number;
          zoom?: number;
        };
        // 1차 렌더: 기본 zoom
        zoomable.Zoom = 0.08;
        zoomable.zoom = 0.08;
        osmdRef.current.render();

        // 레이아웃 확정 후 컨테이너 높이 측정 → zoom 재계산 (2페이지 보이도록 살짝 줌 아웃)
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        const firstSvg = renderRef.current?.querySelector("svg");
        const containerH = scrollRef.current?.clientHeight ?? 0;
        if (firstSvg && containerH > 100 && osmdRef.current) {
          const svgH = firstSvg.getBoundingClientRect().height;
          if (Math.abs(svgH - containerH) > 8) {
            const fittedZoom = Math.max(0.1, 0.65 * (containerH / svgH));
            zoomable.Zoom = fittedZoom;
            zoomable.zoom = fittedZoom;
            osmdRef.current.render();
          }
        }

        const c = (osmdRef.current as unknown as { cursor?: unknown })
          .cursor as Cursor | undefined;
        if (c) {
          cursorRef.current = c;

          try {
            const cursorWithOptions = c as unknown as {
              CursorOptions?: unknown;
            };
            cursorWithOptions.CursorOptions = {
              type: 0,
              color: "#f59e0b",
              alpha: 0.38,
              follow: false,
            };
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }

          c.reset();
          c.show();
        } else {
          cursorRef.current = null;
        }

        buildMeasureBoxesIndex();
        buildInstrumentYRanges();
        clipSvgsToContent();
        applyPointerCursorToMeasures();
        setPageCount(getAllSvgs().length);

        // 초기 active highlight: pickup measure(0번) 대응
        const firstMeasure =
          measureBoxesRef.current.length > 0
            ? Math.min(...measureBoxesRef.current.map((b) => b.measure))
            : 1;
        highlightMeasure(firstMeasure);

        const root = scrollRef.current;
        if (!root) return;

        const onClick = (e: MouseEvent) => {
          const target = e.target as Element | null;
          const svg = target?.closest("svg") as SVGSVGElement | null;
          if (!svg) return;

          const direct = tryFindMeasureFromDomPath(target, svg);
          if (direct != null) {
            onMeasureClickRef.current?.(direct);
            return;
          }

          const p = getSvgPoint(svg, e.clientX, e.clientY);
          if (!p) return;

          const m = findMeasureByPoint(svg, p.x, p.y);
          if (m != null) onMeasureClickRef.current?.(m);
        };

        const onPointerMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;

          const target = e.target as Element | null;
          const svg = target?.closest("svg") as SVGSVGElement | null;
          if (!svg) return;

          const direct = tryFindMeasureFromDomPath(target, svg);
          const p =
            direct == null ? getSvgPoint(svg, e.clientX, e.clientY) : null;
          const m = direct ?? (p ? findMeasureByPoint(svg, p.x, p.y) : null);

          if (m !== hoveredMeasureRef.current) {
            hoveredMeasureRef.current = m ?? null;
            highlightHoverRef.current?.(m ?? null);
            onMeasureHoverRef.current?.(m ?? null);
          }
        };

        const onLeave = () => {
          hoveredMeasureRef.current = null;
          highlightHoverRef.current?.(null);
          onMeasureHoverRef.current?.(null);
        };

        const onScroll = () => {
          const idx = getCurrentPageIndex();
          setCurrentPageIdx((prev) => (prev !== idx ? idx : prev));
        };

        root.addEventListener("click", onClick);
        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("mouseleave", onLeave);
        root.addEventListener("scroll", onScroll, { passive: true });

        cleanupHandlersRef.current = () => {
          root.removeEventListener("click", onClick);
          root.removeEventListener("pointermove", onPointerMove);
          root.removeEventListener("mouseleave", onLeave);
          root.removeEventListener("scroll", onScroll);
        };

        onScoreLoadedRef.current?.(osmdRef.current);
      } catch (e) {
        console.error(e);
        toast.error(
          `악보 로드 실패: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    }, [
      xmlData,
      readMusicXml,
      getAllSvgs,
      getCurrentPageIndex,
      buildMeasureBoxesIndex,
      buildInstrumentYRanges,
      applyPointerCursorToMeasures,
      clipSvgsToContent,
      highlightMeasure,
      tryFindMeasureFromDomPath,
    ]);

    useImperativeHandle(ref, () => ({
      getOSMD: () => osmdRef.current,
      getCursor: () => cursorRef.current,
      reload: async () => {
        await loadScore();
      },
      highlightMeasure: (m, opts) => highlightMeasure(m, opts),
    }));

    useEffect(() => {
      loadScore();

      return () => {
        cleanupHandlersRef.current?.();
        cleanupHandlersRef.current = null;

        clearHighlightByClass(ACTIVE_CLASS);
        clearHighlightByClass(ACTIVE_TOP_CLASS);
        clearHighlightByClass(ACTIVE_BOTTOM_CLASS);
        clearHighlightByClass(HOVER_CLASS);

        if (cursorRef.current) {
          try {
            cursorRef.current.hide();
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
          cursorRef.current = null;
        }
        if (osmdRef.current) {
          try {
            osmdRef.current.clear();
          } catch (e) { if (isDev) console.warn("[ScoreViewer]", e); }
        }
      };
      // xmlData 또는 loadScore(내부 의존) 변경 시에만 전체 리로드. 콜백은 ref로 최신값 사용.
    }, [xmlData, loadScore, clearHighlightByClass]);

    return (
      <div className="score-viewer-root relative h-full w-full">
        {pageCount > 1 && currentPageIdx > 0 && (
        <div
          className="pointer-events-auto absolute bottom-0 left-0 top-0 z-10 flex w-20 items-center justify-start"
          style={{
            background: hoveredEdge === "left"
              ? "linear-gradient(to right, rgba(0,0,0,0.28), transparent)"
              : "transparent",
            transition: "background 0.2s",
            cursor: hoveredEdge === "left" ? "pointer" : "default",
          }}
          onMouseEnter={() => setHoveredEdge("left")}
          onMouseLeave={() => setHoveredEdge(null)}
          onClick={() => navigatePage("prev")}
          aria-label="이전 페이지"
        >
          {hoveredEdge === "left" && (
            <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b] shadow-lg ring-1 ring-white/10" style={{ color: "#e2e8f0", fontSize: "18px", fontWeight: 600, lineHeight: 1 }}>
              ‹
            </div>
          )}
        </div>
        )}

        {pageCount > 1 && currentPageIdx < pageCount - 1 && (
        <div
          className="pointer-events-auto absolute bottom-0 right-0 top-0 z-10 flex w-20 items-center justify-end"
          style={{
            background: hoveredEdge === "right"
              ? "linear-gradient(to left, rgba(0,0,0,0.28), transparent)"
              : "transparent",
            transition: "background 0.2s",
            cursor: hoveredEdge === "right" ? "pointer" : "default",
          }}
          onMouseEnter={() => setHoveredEdge("right")}
          onMouseLeave={() => setHoveredEdge(null)}
          onClick={() => navigatePage("next")}
          aria-label="다음 페이지"
        >
          {hoveredEdge === "right" && (
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b] shadow-lg ring-1 ring-white/10" style={{ color: "#e2e8f0", fontSize: "18px", fontWeight: 600, lineHeight: 1 }}>
              ›
            </div>
          )}
        </div>
        )}

        <div
          ref={scrollRef}
          className="score-scroll h-full w-full overflow-x-auto overflow-y-hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            ref={renderRef}
            className="flex h-full flex-row items-start gap-4 px-4 py-2"
          />
        </div>
      </div>
    );
  },
);

ScoreViewer.displayName = "ScoreViewer";
export default ScoreViewer;
