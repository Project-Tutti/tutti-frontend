"use client";

import { useRef, useEffect, useState } from "react";

interface NoteRangeStaffProps {
  minNote: number;
  maxNote: number;
}

function trimOsmdSvg(container: HTMLDivElement) {
  const svg = container.querySelector("svg") as SVGSVGElement | null;
  if (!svg) return;

  // OSMD can render with generous page margins; trim to actual drawn content.
  // getBBox can throw if SVG isn't fully in DOM yet.
  const bb = svg.getBBox();
  // Padding controls perceived zoom: larger pad => more zoomed-out view.
  const pad = 20;
  const x = Math.max(0, bb.x - pad);
  const y = Math.max(0, bb.y - pad);
  const w = bb.width + pad * 2;
  const h = bb.height + pad * 2;

  svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = "100%";
  svg.style.height = "auto";
}

const PITCH_MAP = [
  { step: "C" },
  { step: "C", alter: 1 },
  { step: "D" },
  { step: "D", alter: 1 },
  { step: "E" },
  { step: "F" },
  { step: "F", alter: 1 },
  { step: "G" },
  { step: "G", alter: 1 },
  { step: "A" },
  { step: "A", alter: 1 },
  { step: "B" },
] as const;

function midiToPitch(midi: number) {
  const entry = PITCH_MAP[midi % 12];
  const step = entry.step;
  const alter = "alter" in entry ? entry.alter : undefined;
  const octave = Math.floor(midi / 12) - 1;
  return { step, alter: alter as number | undefined, octave };
}

function buildMusicXML(minNote: number, maxNote: number): string {
  const minP = midiToPitch(minNote);
  const maxP = midiToPitch(maxNote);
  const minStaff = minNote < 60 ? 2 : 1;
  const maxStaff = maxNote < 60 ? 2 : 1;

  const pitch = (p: ReturnType<typeof midiToPitch>) =>
    `<pitch><step>${p.step}</step>${p.alter != null ? `<alter>${p.alter}</alter>` : ""}<octave>${p.octave}</octave></pitch>`;

  const note = (p: ReturnType<typeof midiToPitch>, staff: number, chord = false) =>
    `<note>${chord ? "<chord/>" : ""}${pitch(p)}<duration>4</duration><type>whole</type><staff>${staff}</staff></note>`;

  const rest = (staff: number) =>
    `<note><rest/><duration>4</duration><type>whole</type><staff>${staff}</staff></note>`;

  // measure 1: min note (left)
  const m1s1 = minStaff === 1 ? note(minP, 1) : rest(1);
  const m1s2 = minStaff === 2 ? note(minP, 2) : rest(2);

  // measure 2: max note (right)
  const m2s1 = maxStaff === 1 ? note(maxP, 1) : rest(1);
  const m2s2 = maxStaff === 2 ? note(maxP, 2) : rest(2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Range</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      ${m1s1}
      <backup><duration>4</duration></backup>
      ${m1s2}
    </measure>
    <measure number="2">
      ${m2s1}
      <backup><duration>4</duration></backup>
      ${m2s2}
    </measure>
  </part>
</score-partwise>`;
}

const NoteRangeStaff = ({ minNote, maxNote }: NoteRangeStaffProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<InstanceType<typeof import("opensheetmusicdisplay").OpenSheetMusicDisplay> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
      if (cancelled || !containerRef.current) return;

      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        backend: "svg",
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawCredits: false,
        drawPartNames: false,
        drawPartAbbreviations: false,
        drawTimeSignatures: false,
        drawMeasureNumbers: false,
        autoResize: false,
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !osmdRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const xml = buildMusicXML(minNote, maxNote);
        await osmdRef.current!.load(xml);
        osmdRef.current!.render();
        if (containerRef.current) {
          try {
            trimOsmdSvg(containerRef.current);
          } catch {
            // ignore (e.g. getBBox not ready yet)
          }
        }
      } catch {
        /* ignore transient render errors during rapid slider updates */
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [ready, minNote, maxNote]);

  return (
    <div className="relative">
      {!ready && (
        <div className="flex items-center justify-center h-16">
          <span className="text-[10px] text-gray-500">악보 로딩 중...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="rounded bg-white overflow-hidden flex justify-center [&_svg]:bg-white! [&_svg]:mx-auto [&_svg]:block"
      />
    </div>
  );
};

export default NoteRangeStaff;
