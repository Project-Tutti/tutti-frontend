"use client";

import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { GiMusicalNotes } from "react-icons/gi";

import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { INSTRUMENT_GROUP_ICON } from "@features/midi-create/constants/instrument-grouping";
import { midiToNoteName } from "@common/utils/midi-utils";

import NoteRangeStaff from "./NoteRangeStaff";
import InstrumentSelector from "@/components/home/InstrumentSelector/InstrumentSelector";
import Modal from "@/components/common/Modal";

const GENRE_DEFS = [
  { value: "CLASSICAL", label: "Classical" },
  { value: "JAZZ", label: "Jazz" },
  { value: "POP", label: "Pop" },
  { value: "ROCK", label: "Rock" },
  { value: "ELECTRONIC", label: "Electronic" },
  { value: "FOLK", label: "Folk" },
] as const;

/** 표시 라벨 알파벳 순 */
const GENRES = [...GENRE_DEFS].sort((a, b) =>
  a.label.localeCompare(b.label, "en"),
);

// 기존 left-3/right-3(12px)에서 좌우 1px씩 더 안쪽(13px)으로 조정
const NOTE_RANGE_RAIL_INSET_REM = 0.5;

const NOTE_RANGE_SLIDER_CLASS =
  "absolute inset-x-0 top-0 h-10 w-full appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:-mt-[1px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#3b82f6] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.55)] " +
  "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#3b82f6] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(59,130,246,0.55)]";

interface InstrumentSettingsPanelProps {
  onBack?: () => void;
  showInstrumentSelector?: boolean;
  isSidebarCollapsed?: boolean;
}

const InstrumentSettingsPanel = ({
  onBack,
  showInstrumentSelector,
  isSidebarCollapsed,
}: InstrumentSettingsPanelProps) => {
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);

  const {
    selectedInstrument,
    setSelectedInstrument,
    noteRange,
    setNoteRange,
    genre,
    setGenre,
  } = useMidiStore();

  const { data: categories } = useGeneratableInstrumentCategoriesQuery();

  const instrumentInfo = useMemo(() => {
    if (selectedInstrument == null || !categories) return null;
    for (const cat of categories) {
      for (const inst of cat.instruments ?? []) {
        if (inst.midiProgram === selectedInstrument) {
          return {
            name: inst.name,
            category: cat.name,
            defaultMin: inst.minNote,
            defaultMax: inst.maxNote,
            Icon: INSTRUMENT_GROUP_ICON[cat.name] ?? GiMusicalNotes,
          };
        }
      }
    }
    return null;
  }, [selectedInstrument, categories]);

  // 예전 InstrumentInfoPanel에 있던 로직: 악기 변경/초기 진입 시 noteRange 자동 세팅 + 범위 보정
  const prevInstrumentRef = useRef<number | null>(null);
  const noteRangeRef = useRef(noteRange);
  noteRangeRef.current = noteRange;

  useEffect(() => {
    if (selectedInstrument == null) {
      prevInstrumentRef.current = null;
      return;
    }
    if (!instrumentInfo) return;

    const instrumentChanged = prevInstrumentRef.current !== selectedInstrument;
    const needInitialRange = noteRangeRef.current == null;

    if (instrumentChanged || needInitialRange) {
      prevInstrumentRef.current = selectedInstrument;
      setNoteRange({
        min: instrumentInfo.defaultMin,
        max: instrumentInfo.defaultMax,
      });
      return;
    }

    const nr = noteRangeRef.current;
    if (nr == null) return;

    const lo = instrumentInfo.defaultMin;
    const hi = instrumentInfo.defaultMax;
    let nextMin = Math.max(lo, Math.min(nr.min, hi));
    let nextMax = Math.min(hi, Math.max(nr.max, lo));
    if (nextMin >= nextMax) {
      nextMin = lo;
      nextMax = hi;
    }
    if (nextMin === nr.min && nextMax === nr.max) return;
    setNoteRange({ min: nextMin, max: nextMax });
  }, [selectedInstrument, instrumentInfo, setNoteRange]);

  const handleMinChange = useCallback(
    (v: number) => {
      if (!instrumentInfo || !noteRange) return;
      const lo = instrumentInfo.defaultMin;
      const hi = instrumentInfo.defaultMax;
      const clamped = Math.max(
        lo,
        Math.min(v, Math.min(noteRange.max - 1, hi)),
      );
      setNoteRange({ min: clamped, max: noteRange.max });
    },
    [instrumentInfo, noteRange, setNoteRange],
  );

  const handleMaxChange = useCallback(
    (v: number) => {
      if (!instrumentInfo || !noteRange) return;
      const lo = instrumentInfo.defaultMin;
      const hi = instrumentInfo.defaultMax;
      const clamped = Math.min(
        hi,
        Math.max(v, Math.max(noteRange.min + 1, lo)),
      );
      setNoteRange({ min: noteRange.min, max: clamped });
    },
    [instrumentInfo, noteRange, setNoteRange],
  );

  const handleResetNoteRange = useCallback(() => {
    if (!instrumentInfo) return;
    setNoteRange({
      min: instrumentInfo.defaultMin,
      max: instrumentInfo.defaultMax,
    });
  }, [instrumentInfo, setNoteRange]);

  const noteRangeSliderVisual = useMemo(() => {
    if (!instrumentInfo || !noteRange) return null;
    const lo = instrumentInfo.defaultMin;
    const hi = instrumentInfo.defaultMax;
    const span = Math.max(1, hi - lo);
    const fillLeft = ((noteRange.min - lo) / span) * 100;
    const fillWidth = ((noteRange.max - noteRange.min) / span) * 100;
    const t = NOTE_RANGE_RAIL_INSET_REM;
    const railGap = `${2 * t}rem`;
    const railPad = `${t}rem`;
    // 두 thumb가 가까워지면(또는 겹치면) 왼쪽(min) thumb를 위로 올려
    // 왼쪽 thumb를 드래그하려다 오른쪽(max) thumb가 잡히는 현상 방지
    const overlapThreshold = Math.max(2, Math.round(span * 0.02));
    const isOverlapping = noteRange.max - noteRange.min <= overlapThreshold;
    const minThumbZIndex = isOverlapping ? 6 : 3;
    const maxThumbZIndex = isOverlapping ? 5 : 4;
    return {
      lo,
      hi,
      fillLeft,
      fillWidth,
      railGap,
      railPad,
      minThumbZIndex,
      maxThumbZIndex,
    };
  }, [instrumentInfo, noteRange]);

  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-[#2d4a6a] bg-[#0f1218]/35">
      <div className="flex items-center justify-between gap-3 border-b border-[#2d4a6a] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {instrumentInfo ? (
            <instrumentInfo.Icon className="size-7 text-[#3b82f6]" />
          ) : null}
          <h2 className="text-[20px] font-semibold text-white">생성 설정</h2>
          {instrumentInfo ? (
            <span className="min-w-0 truncate text-[16px] text-gray-500">
              {instrumentInfo.name}
            </span>
          ) : null}
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#3b82f6]/40 bg-blue-500/8 px-3.5 py-2 text-sm font-medium text-[#3b82f6] transition-colors hover:bg-blue-500/15 hover:border-[#3b82f6]/60"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            이전
          </button>
        ) : null}
      </div>

      <div className="space-y-8 px-4 py-4 md:px-5 md:py-5">
        {/* 0. 악기 선택 (재생성 모드에서만) */}
        {showInstrumentSelector && (
          <>
            <section className="space-y-3">
              <h3 className="text-[16px] font-bold uppercase tracking-wider text-gray-300">
                Instrument
              </h3>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#2d4a6a] bg-[#080a0f] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {instrumentInfo ? (
                    <instrumentInfo.Icon className="size-6 shrink-0 text-[#3b82f6]" />
                  ) : (
                    <GiMusicalNotes className="size-6 shrink-0 text-gray-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">
                      {instrumentInfo?.name ?? "악기 미선택"}
                    </p>
                    {instrumentInfo?.category && (
                      <p className="truncate text-[12px] text-gray-500">
                        {instrumentInfo.category}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInstrumentModalOpen(true)}
                  className="shrink-0 rounded-lg border border-[#3b82f6]/40 bg-blue-500/8 px-3.5 py-2 text-[13px] font-medium text-[#3b82f6] transition-colors hover:border-[#3b82f6]/60 hover:bg-blue-500/15"
                >
                  변경
                </button>
              </div>
            </section>
            <div className="h-px bg-[#2d4a6a]" />

            <Modal
              isOpen={isInstrumentModalOpen}
              onClose={() => setIsInstrumentModalOpen(false)}
              title="악기 선택"
              panelClassName="min-w-2xl"
              contentClassName="px-5 py-5"
              containerStyle={{
                left: isSidebarCollapsed ? 72 : 308,
                transition: "left 0.3s ease",
              }}
            >
              <InstrumentSelector
                selectedInstrument={selectedInstrument}
                onInstrumentSelect={(midiProgram) => {
                  setSelectedInstrument(midiProgram);
                  setIsInstrumentModalOpen(false);
                }}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </Modal>
          </>
        )}

        {/* 1. 음역대 설정 */}
        {noteRange && instrumentInfo ? (
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-[16px] font-bold uppercase tracking-wider text-gray-300">
                Note Range
              </h3>
              <button
                type="button"
                onClick={handleResetNoteRange}
                className="shrink-0 text-[12px] font-medium text-[#3b82f6] transition-colors hover:text-blue-400"
              >
                기본값 복원
              </button>
            </div>

            <p className="text-[14px] text-gray-500">
              악기별 기본 음역(위 양끝) 안에서만 범위를 좁히거나 넓힐 수
              있습니다.
            </p>

            <p className="text-sm font-medium tabular-nums text-gray-200">
              {midiToNoteName(noteRange.min)} – {midiToNoteName(noteRange.max)}
            </p>

            <div className="rounded-lg border border-[#2d4a6a]/50 bg-[#080a0f] px-4 py-3">
              <NoteRangeStaff minNote={noteRange.min} maxNote={noteRange.max} />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3 px-3 text-xs font-medium tabular-nums text-slate-400">
                <span className="min-w-0 truncate" title="악기 기본 최저음">
                  {midiToNoteName(instrumentInfo.defaultMin)}
                </span>
                <span
                  className="min-w-0 truncate text-right"
                  title="악기 기본 최고음"
                >
                  {midiToNoteName(instrumentInfo.defaultMax)}
                </span>
              </div>

              <div className="relative w-full pt-0.5">
                {noteRangeSliderVisual ? (
                  <div className="relative w-full">
                    <div
                      className="pointer-events-none absolute left-[13px] right-[13px] top-[19px] h-2 rounded-full bg-[#2d4a6a]"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute top-[19px] h-2 rounded-full bg-[#3b82f6]/40"
                      style={{
                        left: `calc(${noteRangeSliderVisual.railPad} + (100% - ${noteRangeSliderVisual.railGap}) * ${noteRangeSliderVisual.fillLeft / 100})`,
                        width: `calc((100% - ${noteRangeSliderVisual.railGap}) * ${Math.max(0, noteRangeSliderVisual.fillWidth) / 100})`,
                      }}
                      aria-hidden
                    />
                    <div className="relative h-10 w-full">
                      <input
                        type="range"
                        min={noteRangeSliderVisual.lo}
                        max={noteRangeSliderVisual.hi}
                        value={noteRange.min}
                        onChange={(e) =>
                          handleMinChange(Number(e.target.value))
                        }
                        className={NOTE_RANGE_SLIDER_CLASS}
                        style={{ zIndex: noteRangeSliderVisual.minThumbZIndex }}
                      />
                      <input
                        type="range"
                        min={noteRangeSliderVisual.lo}
                        max={noteRangeSliderVisual.hi}
                        value={noteRange.max}
                        onChange={(e) =>
                          handleMaxChange(Number(e.target.value))
                        }
                        className={NOTE_RANGE_SLIDER_CLASS}
                        style={{ zIndex: noteRangeSliderVisual.maxThumbZIndex }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-3 pt-1">
              <span className="text-xs font-medium tabular-nums text-white">
                {midiToNoteName(noteRange.min)}
              </span>
              <span className="text-xs font-medium tabular-nums text-white">
                {midiToNoteName(noteRange.max)}
              </span>
            </div>
          </section>
        ) : null}

        <div className="h-px bg-[#2d4a6a]" />

        {/* 2. 장르 선택 */}
        <section className="space-y-4">
          <h3 className="text-[16px] font-bold uppercase tracking-wider text-gray-300">
            Genre
          </h3>
          <p className="text-[14px] text-gray-500">
            생성할 악보의 장르를 선택합니다. 장르에 따라 편곡 스타일이
            달라집니다.
          </p>
          <div className="flex flex-wrap gap-3">
            {GENRES.map((g) => {
              const isSelected = genre === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGenre(g.value)}
                  className={`rounded-full border px-3.5 py-2.5 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]"
                      : "bg-[#0f1218] border-[#2d4a6a] text-gray-400 hover:border-gray-500 hover:text-gray-300"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          {!genre ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="size-3.5" strokeWidth={2} />
              장르 선택이 필요합니다
            </p>
          ) : null}
        </section>
      </div>
    </section>
  );
};

export default InstrumentSettingsPanel;
