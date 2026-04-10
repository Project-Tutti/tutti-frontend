"use client";

import { useEffect, useMemo, useState } from "react";

import { useInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useInstrumentCategoriesQuery";

import Modal from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { Track } from "@/types/track";
import { INSTRUMENT_OPTIONS } from "@features/midi-create/constants/instrument-options";
import { flattenInstrumentCategoriesToMappingOptions } from "@features/midi-create/utils/instrument-category-mapping-options";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { DROP_CATEGORY_PROGRAM } from "@common/utils/midi-utils";

interface TrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

const TrackModal = ({ isOpen, track, onClose }: TrackModalProps) => {
  const { trackMappings, setTrackMapping } = useMidiStore();
  const [searchText, setSearchText] = useState("");
  const [inputValue, setInputValue] = useState("");
  const trackId = track?.id ?? "";
  const sourceInstrumentId = track?.sourceInstrumentId ?? 0;

  const {
    data: categories,
    isPending: categoriesPending,
    isError: categoriesError,
  } = useInstrumentCategoriesQuery();

  const categoriesLoadingWithoutData = categoriesPending && !categories;

  const mappingOptions = useMemo(() => {
    const fromApi = categories?.length
      ? flattenInstrumentCategoriesToMappingOptions(categories)
      : [];
    if (fromApi.length > 0) return fromApi;
    return INSTRUMENT_OPTIONS.map((o) => ({
      id: o.id,
      label: o.label,
    }));
  }, [categories]);

  const defaultMappedInstrumentId = track?.isDropListProgram
    ? DROP_CATEGORY_PROGRAM
    : sourceInstrumentId;

  const currentMappedInstrumentId =
    trackMappings[trackId] ?? defaultMappedInstrumentId;

  useEffect(() => {
    if (!track) return;
    const initialId =
      trackMappings[track.id] ??
      (track.isDropListProgram
        ? DROP_CATEGORY_PROGRAM
        : track.sourceInstrumentId);
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
    return matched?.label ?? "Custom Instrument";
  }, [currentMappedInstrumentId, mappingOptions]);

  const applyMappingValue = (value: string) => {
    if (!track) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (parsed < 0 || parsed > 129) return;
    setTrackMapping(trackId, parsed);
  };

  if (!track) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${track.name} Settings`}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Track Summary
          </p>
          <p className="text-white font-semibold text-xs">
            {track.name} ({track.instrumentType})
          </p>
          <p className="text-[11px] text-gray-400">
            Channel {track.channel} · {track.noteCount ?? 0} notes · Track ID{" "}
            {track.id}
          </p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {track.tags.map((tag, index) => (
              <span
                key={index}
                className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Current Mapping
          </p>
          {track.isDropListProgram ? (
            <>
              <p className="text-[11px] text-gray-300">
                원본 분류:{" "}
                <span className="text-amber-300/95 font-medium">Drop</span>
              </p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                자동 변환에서 제외되는 악기군입니다. 아래에서 원하는 악기로
                매핑할 수 있습니다.
              </p>
            </>
          ) : (
            <p className="text-[11px] text-gray-300">
              Source Instrument ID:{" "}
              <span className="text-white">{track.sourceInstrumentId}</span>
            </p>
          )}
          <p className="text-[11px] text-gray-300">
            {track.isDropListProgram ? (
              <>
                매핑 악기:{" "}
                <span className="text-white">{mappedOptionLabel}</span>
              </>
            ) : (
              <>
                Target Instrument ID:{" "}
                <span className="text-white">{currentMappedInstrumentId}</span>{" "}
                ({mappedOptionLabel})
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              const resetId = track.isDropListProgram
                ? DROP_CATEGORY_PROGRAM
                : track.sourceInstrumentId;
              setInputValue(String(resetId));
              setTrackMapping(track.id, resetId);
            }}
            className="text-[10px] font-semibold text-[#3b82f6] hover:text-blue-400"
          >
            {track.isDropListProgram
              ? "기본 매핑으로 되돌리기"
              : "원본 악기번호로 되돌리기"}
          </button>
        </div>

        <div className="rounded-lg border border-[#1e293b] bg-[#0f1218]/60 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Change Mapping
          </p>
          {categoriesLoadingWithoutData && (
            <div className="flex justify-center py-4">
              <Spinner size="sm" label="악기 카테고리 불러오는 중…" />
            </div>
          )}
          {categoriesError && (
            <p className="text-[10px] text-amber-400/90">
              카테고리 API를 불러오지 못해 기본 GM 목록을 표시합니다.
            </p>
          )}
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="악기명 또는 번호 검색"
            disabled={categoriesLoadingWithoutData}
            className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-2.5 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
          />
          <select
            size={5}
            value={String(currentMappedInstrumentId)}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              applyMappingValue(value);
            }}
            disabled={categoriesLoadingWithoutData}
            className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-1.5 py-1.5 text-xs text-gray-100 focus:outline-none disabled:opacity-50"
          >
            {filteredOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id} - {option.label}
              </option>
            ))}
          </select>

          <div className="space-y-1.5">
            <label
              htmlFor="custom-instrument-id"
              className="text-[10px] text-gray-400"
            >
              직접 악기번호 입력 (0~129)
            </label>
            <input
              id="custom-instrument-id"
              type="number"
              min={0}
              max={129}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={(e) => applyMappingValue(e.target.value)}
              className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-2.5 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TrackModal;
