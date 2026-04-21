"use client";

import { useEffect, useMemo, useState } from "react";

import { useInstrumentsQuery } from "@api/instruments/hooks/queries/useInstrumentsQuery";

import Modal from "@/components/common/Modal";
import { Track } from "@/types/track";
import { INSTRUMENT_OPTIONS } from "@features/midi-create/constants/instrument-options";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { TrackSummarySection } from "./track-modal/TrackSummarySection";
import {
  InstrumentMappingOption,
  TrackCurrentMappingSection,
  TrackMappingPickerSection,
} from "./track-modal/TrackMappingSections";

interface TrackModalProps {
  isOpen: boolean;
  track: Track | null;
  onClose: () => void;
}

const formatDisplayName = (name: string): string =>
  name.toUpperCase().replace(/_/g, " ");

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

  const mappingOptions = useMemo((): InstrumentMappingOption[] => {
    if (Array.isArray(instruments) && instruments.length > 0) {
      const seen = new Set<number>();
      const out = [];
      for (const inst of instruments) {
        const id = inst.midiProgram;
        if (!Number.isFinite(id) || id < 0 || id > 128 || seen.has(id))
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
    const matched = instruments?.find(
      (inst) => inst.midiProgram === track.sourceInstrumentId,
    );
    return matched?.name ? formatDisplayName(matched.name) : track.instrumentType;
  }, [track, instruments]);

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
        <TrackSummarySection
          trackName={track.name}
          trackDisplayType={trackDisplayType}
          channel={track.channel}
          noteCount={track.noteCount ?? 0}
          trackId={track.id}
          tags={track.tags}
        />

        <TrackCurrentMappingSection
          sourceInstrumentId={track.sourceInstrumentId}
          mappedOptionLabel={mappedOptionLabel}
          currentMappedInstrumentId={currentMappedInstrumentId}
          onReset={() => {
            const resetId = track.sourceInstrumentId;
            setInputValue(String(resetId));
            setTrackMapping(track.id, resetId);
          }}
        />

        <TrackMappingPickerSection
          instrumentsLoadingWithoutData={instrumentsLoadingWithoutData}
          instrumentsError={instrumentsError}
          searchText={searchText}
          setSearchText={setSearchText}
          filteredOptions={filteredOptions}
          currentMappedInstrumentId={currentMappedInstrumentId}
          onSelectOption={(id) => {
            setInputValue(String(id));
            applyMappingValue(String(id));
          }}
          customValue={inputValue}
          setCustomValue={setInputValue}
          onApplyCustomValue={applyMappingValue}
        />
      </div>
    </Modal>
  );
};

export default TrackModal;
