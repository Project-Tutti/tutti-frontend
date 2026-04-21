"use client";

import { useEffect, useMemo, useState } from "react";

import { useInstrumentsQuery } from "@api/instruments/hooks/queries/useInstrumentsQuery";

import Modal from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { Track } from "@/types/track";
import { INSTRUMENT_OPTIONS } from "@features/midi-create/constants/instrument-options";
import { resolveInstrumentDisplayName } from "@features/midi-create/utils/instrument-display-name";
import { useMidiStore } from "@features/midi-create/stores/midi-store";

interface TrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-[11px] font-medium text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-xs leading-snug text-slate-200 sm:text-right">
        {children}
      </dd>
    </div>
  );
}

/** HTML5: dl 안에서 dt/dd를 div로 묶을 수 있음 */
function MetaList({ children }: { children: React.ReactNode }) {
  return <dl className="space-y-2.5">{children}</dl>;
}

const sectionClass =
  "rounded-xl border border-white/8 bg-[#080a0f]/95 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

/** 블루 포인트 박스 + 흰색 라벨 */
const sectionTitleClass =
  "mb-3 inline-flex w-fit max-w-full items-center rounded-md border border-blue-500/15 bg-blue-500/6 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white";

const TrackModal = ({ isOpen, track, onClose }: TrackModalProps) => {
  const { trackMappings, setTrackMapping } = useMidiStore();
  const [searchText, setSearchText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const trackId = track?.id ?? "";
  const sourceInstrumentId = track?.sourceInstrumentId ?? 0;

  const {
    data: instruments,
    isPending: instrumentsPending,
    isError: instrumentsError,
  } = useInstrumentsQuery();

  const instrumentsLoadingWithoutData = instrumentsPending && !instruments;

  const mappingOptions = useMemo(() => {
    if (Array.isArray(instruments) && instruments.length > 0) {
      const seen = new Set<number>();
      const out = [];
      for (const inst of instruments) {
        const id = inst.midiProgram;
        if (!Number.isFinite(id) || id < 0 || id > 129 || seen.has(id))
          continue;
        seen.add(id);
        out.push({
          id,
          label: `${inst.name} · General MIDI ${id}`,
        });
      }
      out.sort((a, b) => a.id - b.id);
      return out;
    }
    return INSTRUMENT_OPTIONS.map((o) => ({
      id: o.id,
      label: o.label,
    }));
  }, [instruments]);

  // API 표준명 우선, 없으면 MIDI 원본 기반 instrumentType fallback.
  const trackDisplayType = useMemo(() => {
    if (!track) return "";
    return resolveInstrumentDisplayName(
      undefined,
      track.sourceInstrumentId,
      track.instrumentType,
    );
  }, [track]);

  const defaultMappedInstrumentId = sourceInstrumentId;

  const currentMappedInstrumentId =
    trackMappings[trackId] ?? defaultMappedInstrumentId;

  useEffect(() => {
    if (!track) return;
    const initialId = trackMappings[track.id] ?? track.sourceInstrumentId;
    setInputValue(String(initialId));
    setSearchText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 모달 열림 시 초기값 세팅 목적; trackMappings 변경에 반응하면 안 됨
  }, [track, isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return mappingOptions;

    return mappingOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        String(option.id).includes(query),
    );
  }, [searchText, mappingOptions]);

  const mappedOptionLabel = useMemo(() => {
    const matched = mappingOptions.find(
      (option) => option.id === currentMappedInstrumentId,
    );
    return matched?.label ?? "사용자 지정";
  }, [currentMappedInstrumentId, mappingOptions]);

  const applyMappingValue = (value: string) => {
    if (!track) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (parsed < 0 || parsed > 128) return;
    setTrackMapping(trackId, parsed);
  };

  if (!track) return null;

  const modalTitle = `${track.name} · 트랙 정보`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full max-w-[200px] rounded-lg bg-[#2563eb] px-6 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-600 active:scale-[0.99] sm:w-auto sm:min-w-[120px]"
          >
            확인
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <section
          className={sectionClass}
          aria-labelledby="track-summary-heading"
        >
          <h3 id="track-summary-heading" className={sectionTitleClass}>
            요약
          </h3>
          <MetaList>
            <MetaRow label="트랙 이름">
              <span className="font-medium text-white/95">{track.name}</span>
            </MetaRow>
            <MetaRow label="악기 유형">{trackDisplayType}</MetaRow>
            <MetaRow label="채널">{track.channel}</MetaRow>
            <MetaRow label="음표 수">
              {(track.noteCount ?? 0).toLocaleString("ko-KR")}
            </MetaRow>
            <MetaRow label="트랙 ID">
              <span className="font-mono text-[11px] text-slate-400">
                {track.id}
              </span>
            </MetaRow>
          </MetaList>
          {track.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/6 pt-3">
              {track.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded border border-white/10 bg-white/4 px-2 py-0.5 text-[10px] font-medium text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        <section
          className={sectionClass}
          aria-labelledby="track-mapping-current-heading"
        >
          <h3 id="track-mapping-current-heading" className={sectionTitleClass}>
            현재 매핑
          </h3>
          <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
            <p>
              <span className="text-slate-500">원본 GM 번호</span>{" "}
              <span className="font-mono font-medium text-white tabular-nums">
                {track.sourceInstrumentId}
              </span>
            </p>
            <p>
              <span className="text-slate-500">매핑된 악기</span>{" "}
              <span className="font-medium text-white">
                {mappedOptionLabel}
              </span>
              <span className="ml-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                (#{currentMappedInstrumentId})
              </span>
            </p>
            <p className="rounded-md border border-blue-500/15 bg-blue-500/6 px-2.5 py-1.5 text-[11px] leading-relaxed text-sky-200/95">
              현재 매핑된 악기로 학습이 이루어집니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const resetId = track.sourceInstrumentId;
              setInputValue(String(resetId));
              setTrackMapping(track.id, resetId);
            }}
            className="mt-3 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            원본 악기 번호로 되돌리기
          </button>
        </section>

        <section
          className={sectionClass}
          aria-labelledby="track-mapping-change-heading"
        >
          <h3 id="track-mapping-change-heading" className={sectionTitleClass}>
            악기 변경
          </h3>

          {instrumentsLoadingWithoutData && (
            <div className="flex justify-center py-10">
              <Spinner size="sm" label="악기 목록 불러오는 중" />
            </div>
          )}

          {!instrumentsLoadingWithoutData && (
            <>
              {instrumentsError && (
                <p className="mb-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200/95">
                  악기 목록을 불러오지 못해 기본 GM 목록을 표시합니다.
                </p>
              )}

              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                검색
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="악기 이름 또는 번호"
                className="mb-2.5 w-full rounded-lg border border-[#1e293b] bg-[#030508] px-2.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />

              <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                악기 선택 ({filteredOptions.length.toLocaleString("ko-KR")}개)
              </p>
              <div
                role="listbox"
                aria-label="악기 목록"
                className="flex max-h-[min(280px,38vh)] flex-col gap-0.5 overflow-y-auto rounded-lg border border-[#1e293b] bg-[#030508] p-1.5"
              >
                {filteredOptions.length === 0 ? (
                  <p className="px-3 py-5 text-center text-xs text-slate-500">
                    검색 결과가 없습니다.
                  </p>
                ) : (
                  filteredOptions.map((option) => {
                    const selected = option.id === currentMappedInstrumentId;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setInputValue(String(option.id));
                          applyMappingValue(String(option.id));
                        }}
                        className={
                          selected
                            ? "flex w-full items-center gap-2.5 rounded-md border border-blue-500/35 bg-blue-500/15 px-2.5 py-2 text-left text-xs text-blue-100"
                            : "flex w-full items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left text-xs text-slate-200 transition-colors hover:border-white/10 hover:bg-white/4"
                        }
                      >
                        <span className="w-8 shrink-0 font-mono text-[11px] tabular-nums text-slate-500">
                          {option.id === 0 ? ` ${option.id}` : option.id}
                        </span>
                        <span className="min-w-0 font-medium leading-snug">
                          {option.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-3 border-t border-white/6 pt-3">
                <label
                  htmlFor="custom-instrument-id"
                  className="mb-1 block text-[11px] font-medium text-slate-500"
                >
                  직접 입력 <span className="text-slate-600">(0–129)</span>
                </label>
                <input
                  id="custom-instrument-id"
                  type="number"
                  min={0}
                  max={128}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={(e) => applyMappingValue(e.target.value)}
                  className="w-full rounded-lg border border-[#1e293b] bg-[#030508] px-2.5 py-2 font-mono text-xs text-white tabular-nums focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  포커스를 잃으면 입력한 번호가 적용됩니다.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
};

export default TrackModal;
