"use client";

import { useEffect, useMemo, useState } from "react";

import Modal from "@/components/common/Modal";
import { Track } from "@/types/track";
import { INSTRUMENT_OPTIONS } from "@features/midi-create/constants/instrument-options";
import { useMidiStore } from "@features/midi-create/stores/midi-store";

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

  const currentMappedInstrumentId =
    trackMappings[trackId] ?? sourceInstrumentId;

  useEffect(() => {
    if (!track) return;
    setInputValue(String(currentMappedInstrumentId));
    setSearchText("");
  }, [currentMappedInstrumentId, trackId, isOpen, track]);

  const filteredOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return INSTRUMENT_OPTIONS;

    return INSTRUMENT_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        String(option.id).includes(query),
    );
  }, [searchText]);

  const mappedOptionLabel = useMemo(() => {
    const matched = INSTRUMENT_OPTIONS.find(
      (option) => option.id === currentMappedInstrumentId,
    );
    return matched?.label ?? "Custom Instrument";
  }, [currentMappedInstrumentId]);

  const applyMappingValue = (value: string) => {
    if (!track) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (parsed < 0 || parsed > 128) return;
    setTrackMapping(trackId, parsed);
  };

  if (!track) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${track.name} Settings`}>
      <div className="space-y-6">
        <div className="rounded-xl border border-[#1e293b] bg-[#0f1218]/60 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Track Summary
          </p>
          <p className="text-white font-semibold text-base">
            {track.name} ({track.instrumentType})
          </p>
          <p className="text-sm text-gray-400">
            Channel {track.channel} · {track.noteCount ?? 0} notes · Track ID{" "}
            {track.id}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {track.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#1e293b] bg-[#0f1218]/60 p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Current Mapping
          </p>
          <p className="text-sm text-gray-300">
            Source Instrument ID:{" "}
            <span className="text-white">{track.sourceInstrumentId}</span>
          </p>
          <p className="text-sm text-gray-300">
            Target Instrument ID:{" "}
            <span className="text-white">{currentMappedInstrumentId}</span> (
            {mappedOptionLabel})
          </p>
          <button
            type="button"
            onClick={() => {
              setInputValue(String(track.sourceInstrumentId));
              setTrackMapping(track.id, track.sourceInstrumentId);
            }}
            className="text-xs font-semibold text-[#3b82f6] hover:text-blue-400"
          >
            원본 악기번호로 되돌리기
          </button>
        </div>

        <div className="rounded-xl border border-[#1e293b] bg-[#0f1218]/60 p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Change Mapping
          </p>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="악기명 또는 번호 검색"
            className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6]"
          />
          <select
            size={6}
            value={String(currentMappedInstrumentId)}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              applyMappingValue(value);
            }}
            className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-2 py-2 text-sm text-gray-100 focus:outline-none"
          >
            {filteredOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id} - {option.label}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <label
              htmlFor="custom-instrument-id"
              className="text-xs text-gray-400"
            >
              직접 악기번호 입력 (0~128)
            </label>
            <input
              id="custom-instrument-id"
              type="number"
              min={0}
              max={128}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={(e) => applyMappingValue(e.target.value)}
              className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#3b82f6]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TrackModal;
