"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef,
} from "react";
import { OpenSheetMusicDisplay, Cursor } from "opensheetmusicdisplay";
import JSZip from "jszip";

interface ScoreViewerProps {
  xmlData?: string | ArrayBuffer | File;

  onScoreLoaded?: (osmd: OpenSheetMusicDisplay) => void;

  /** 마디 클릭하면 MusicPlayer에서 jumpToMeasure로 처리 */
  onMeasureClick?: (measureNumber: number) => void;

  /** 마디 hover 표시(선택) */
  onMeasureHover?: (measureNumber: number | null) => void;
}

export interface ScoreViewerRef {
  getOSMD: () => OpenSheetMusicDisplay | null;
  getCursor: () => Cursor | null;
  reload: () => Promise<void>;

  /** 재생 중/선택된 마디(Active) 하이라이트 */
  highlightMeasure: (measureNumber: number | null, opts?: { scrollIntoView?: boolean }) => void;
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

const ACTIVE_CLASS = "osmd-active-measure-highlight";
const HOVER_CLASS = "osmd-hover-measure-highlight";

const ScoreViewer = forwardRef<ScoreViewerRef, ScoreViewerProps>(
  ({ xmlData, onScoreLoaded, onMeasureClick, onMeasureHover }, ref) => {
    /** 바깥(가로 스크롤) */
    const scrollRef = useRef<HTMLDivElement>(null);
    /** OSMD 렌더 타겟(여기에 svg 페이지들이 들어옴) */
    const renderRef = useRef<HTMLDivElement>(null);

    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const cursorRef = useRef<Cursor | null>(null);

    /** measure -> box(페이지+좌표) 인덱스 (하이라이트/히트테스트용) */
    const measureBoxMapRef = useRef<Map<number, MeasureBox>>(new Map());
    const measureBoxesRef = useRef<MeasureBox[]>([]);

    const hoveredMeasureRef = useRef<number | null>(null);
    const cleanupHandlersRef = useRef<(() => void) | null>(null);

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
      [getAllSvgs]
    );

    const parseMeasureNumberFromLabel = useCallback((label: string): number | null => {
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

      // fallback: 아무 숫자 1개
      const any = label.match(/(\d+)/);
      if (any?.[1]) {
        const n = parseInt(any[1], 10);
        return Number.isNaN(n) ? null : n;
      }

      return null;
    }, []);

    const buildMeasureBoxesIndex = useCallback(() => {
      const map = new Map<number, MeasureBox>();
      const all: MeasureBox[] = [];

      const svgs = getAllSvgs();
      for (const svg of svgs) {
        const groups = Array.from(
          svg.querySelectorAll(
            'g[class*="measure"], g[class*="Measure"], g[id*="measure"], g[id*="Measure"]'
          )
        ) as SVGGraphicsElement[];

        // measure 하나당 bbox union
        const union = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>();

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
          } catch {
            // 일부 그룹 bbox 실패는 무시
          }
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

          // 같은 measure가 중복으로 들어오면(보통 없음) 먼저 것 유지
          if (!map.has(measure)) map.set(measure, box);
        }
      }

      measureBoxMapRef.current = map;
      measureBoxesRef.current = all;
    }, [getAllSvgs, parseMeasureNumberFromLabel]);

    const insertRect = useCallback(
      (box: MeasureBox, className: string, fill: string) => {
        const svg = box.svg;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(box.x));
        rect.setAttribute("y", String(box.y));
        rect.setAttribute("width", String(box.w));
        rect.setAttribute("height", String(box.h));
        rect.setAttribute("fill", fill);
        rect.setAttribute("class", className);
        rect.setAttribute("pointer-events", "none");

        // 노트/커서 가리지 않게 맨 뒤로
        if (svg.firstChild) svg.insertBefore(rect, svg.firstChild);
        else svg.appendChild(rect);
      },
      []
    );

    const scrollPageIntoView = useCallback((box: MeasureBox) => {
      // 페이지 단위(svg)로 가운데 정렬되도록 스크롤
      try {
        box.svg.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      } catch {}
    }, []);

    const highlightMeasure = useCallback(
      (measureNumber: number | null, opts?: { scrollIntoView?: boolean }) => {
        clearHighlightByClass(ACTIVE_CLASS);
        if (measureNumber == null) return;

        const box = measureBoxMapRef.current.get(measureNumber);
        if (!box) return;

        insertRect(box, ACTIVE_CLASS, "rgba(59,130,246,0.16)"); // active
        if (opts?.scrollIntoView) scrollPageIntoView(box);
      },
      [clearHighlightByClass, insertRect, scrollPageIntoView]
    );

    const highlightHover = useCallback(
      (measureNumber: number | null) => {
        clearHighlightByClass(HOVER_CLASS);
        if (measureNumber == null) return;

        const box = measureBoxMapRef.current.get(measureNumber);
        if (!box) return;

        insertRect(box, HOVER_CLASS, "rgba(148,163,184,0.16)"); // hover
      },
      [clearHighlightByClass, insertRect]
    );

    const applyPointerCursorToMeasures = useCallback(() => {
      const svgs = getAllSvgs();
      for (const svg of svgs) {
        const groups = Array.from(
          svg.querySelectorAll(
            'g[class*="measure"], g[class*="Measure"], g[id*="measure"], g[id*="Measure"]'
          )
        ) as SVGGraphicsElement[];

        for (const g of groups) {
          try {
            (g as any).style.cursor = "pointer";
          } catch {}
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
              if (musicXmlFile) musicXmlContent = await musicXmlFile.async("string");
            }
          }

          if (!musicXmlContent) {
            const xmlFiles = Object.keys(zip.files).filter(
              (n) => n.endsWith(".xml") && !n.includes("META-INF")
            );
            if (xmlFiles.length > 0) {
              const f = zip.file(xmlFiles[0]);
              if (f) musicXmlContent = await f.async("string");
            }
          }

          if (!musicXmlContent) throw new Error("MXL에서 유효한 MusicXML을 찾지 못했습니다.");
          return musicXmlContent;
        }

        return await xmlData.text();
      }

      if (typeof xmlData === "string") return xmlData;

      const decoder = new TextDecoder("utf-8");
      return decoder.decode(xmlData);
    }, [xmlData]);

    // -----------------------------
    // Hit test (click/hover)
    // -----------------------------
    const getSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      return pt.matrixTransform(ctm.inverse());
    };

    const tryFindMeasureFromDomPath = (target: Element | null, svg: SVGSVGElement) => {
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
    };

    const findMeasureByPoint = (svg: SVGSVGElement, x: number, y: number): number | null => {
      // 해당 svg에 속한 measure box만 대상으로
      const boxes = measureBoxesRef.current.filter((b) => b.svg === svg);
      if (boxes.length === 0) return null;

      const tol = 8;
      let best: { m: number; dist: number } | null = null;

      for (const b of boxes) {
        const hit =
          x >= b.x - tol && x <= b.x + b.w + tol && y >= b.y - tol && y <= b.y + b.h + tol;
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

      // 이전 svg들 제거
      renderRef.current.innerHTML = "";

      try {
        if (!osmdRef.current) {
          osmdRef.current = new OpenSheetMusicDisplay(renderRef.current, {
            backend: "svg",
            autoResize: true,
            drawTitle: true,
            drawComposer: true,
            drawCredits: false,
            drawingParameters: "compact",
            // ✅ 페이지 단위(Endless 말고 A4). 필요하면 "A4_L"(가로)로도 테스트 가능
            pageFormat: "A4_P",
          } as any);
        } else {
          // 컨테이너가 바뀌거나 innerHTML 비웠으니, 안전하게 clear
          try {
            osmdRef.current.clear();
          } catch {}
        }

        const xmlString = await readMusicXml();
        if (!xmlString) return;

        await osmdRef.current.load(xmlString);

        // ✅ 너무 큰 문제: 기본 zoom을 먼저 낮춰서 한 페이지가 더 잘 보이게
        // (필요하면 아래 값만 조정하면 됨)
        (osmdRef.current as any).Zoom = 0.78;
        (osmdRef.current as any).zoom = 0.78;

        osmdRef.current.render();

        // Cursor
        const c = (osmdRef.current as any).cursor as Cursor | undefined;
        if (c) {
          cursorRef.current = c;

          // 노트(음) 커서 표시(얇은 라인/하이라이트 느낌)
          try {
            (c as any).CursorOptions = {
              type: 0,
              color: "#f59e0b",
              alpha: 0.38,
              follow: false, // 가로 페이지에서는 follow=true가 오히려 이상해질 수 있어 꺼둠
            };
          } catch {}

          c.reset();
          c.show();
        } else {
          cursorRef.current = null;
        }

        // ✅ 페이지(svg)들을 가로로 나열되게 만들기 (OSMD가 svg 여러 개를 넣어줌)
        // renderRef가 flex-row이기 때문에 자동으로 가로 나열됨.
        // scroll-snap은 바깥 컨테이너에서 처리.

        // measure box index 생성 (모든 페이지 대상)
        buildMeasureBoxesIndex();

        // cursor-pointer 적용
        applyPointerCursorToMeasures();

        // 초기 active highlight: 1마디
        highlightMeasure(1);

        // 이벤트 핸들러 연결
        const root = scrollRef.current;
        if (!root) return;

        const onClick = (e: MouseEvent) => {
          const target = e.target as Element | null;
          const svg = target?.closest("svg") as SVGSVGElement | null;
          if (!svg) return;

          const direct = tryFindMeasureFromDomPath(target, svg);
          if (direct != null) {
            onMeasureClick?.(direct);
            return;
          }

          const p = getSvgPoint(svg, e.clientX, e.clientY);
          if (!p) return;

          const m = findMeasureByPoint(svg, p.x, p.y);
          if (m != null) onMeasureClick?.(m);
        };

        const onPointerMove = (e: PointerEvent) => {
          // hover는 마우스만 (터치에서는 의미 없음)
          if (e.pointerType !== "mouse") return;

          const target = e.target as Element | null;
          const svg = target?.closest("svg") as SVGSVGElement | null;
          if (!svg) return;

          const direct = tryFindMeasureFromDomPath(target, svg);
          const p = direct == null ? getSvgPoint(svg, e.clientX, e.clientY) : null;
          const m = direct ?? (p ? findMeasureByPoint(svg, p.x, p.y) : null);

          if (m !== hoveredMeasureRef.current) {
            hoveredMeasureRef.current = m ?? null;
            highlightHover(m ?? null);
            onMeasureHover?.(m ?? null);
          }
        };

        const onLeave = () => {
          hoveredMeasureRef.current = null;
          highlightHover(null);
          onMeasureHover?.(null);
        };

        root.addEventListener("click", onClick);
        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("mouseleave", onLeave);

        cleanupHandlersRef.current = () => {
          root.removeEventListener("click", onClick);
          root.removeEventListener("pointermove", onPointerMove);
          root.removeEventListener("mouseleave", onLeave);
        };

        onScoreLoaded?.(osmdRef.current);
      } catch (e) {
        console.error(e);
        alert(`악보 로드 실패: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }, [
      xmlData,
      readMusicXml,
      buildMeasureBoxesIndex,
      applyPointerCursorToMeasures,
      highlightMeasure,
      highlightHover,
      onMeasureClick,
      onMeasureHover,
      parseMeasureNumberFromLabel,
    ]);

    // expose ref
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
        clearHighlightByClass(HOVER_CLASS);

        if (cursorRef.current) {
          try {
            cursorRef.current.hide();
          } catch {}
          cursorRef.current = null;
        }
        if (osmdRef.current) {
          try {
            osmdRef.current.clear();
          } catch {}
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xmlData]);

    // -----------------------------
    // UI
    // -----------------------------
    return (
      <div className="w-full">
        {/* ✅ 가로 스크롤 + 페이지 넘김 스냅 */}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto overflow-y-hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* ✅ OSMD가 만든 svg들이 여기 들어오고, flex-row라서 가로로 쭉 나열됨 */}
          <div
            ref={renderRef}
            className="flex flex-row gap-6 items-start py-4 px-4"
          />
        </div>

        {/* highlight rect 스타일 최소(필요시) */}
        <style jsx global>{`
          .${ACTIVE_CLASS} {
            shape-rendering: crispEdges;
          }
          .${HOVER_CLASS} {
            shape-rendering: crispEdges;
          }
          /* 페이지 단위 scroll-snap: svg 각각 */
          .osmdSvgPage,
          svg {
            scroll-snap-align: start;
            flex: 0 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          }
        `}</style>
      </div>
    );
  }
);

ScoreViewer.displayName = "ScoreViewer";
export default ScoreViewer;
