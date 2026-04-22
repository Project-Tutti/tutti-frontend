import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProjectVersionMappingResponseDto } from "@api/project/types/api.types";

import { Track } from "@/types/track";

/** 생성 설정 모달 등에서 기본 선택 장르 */
export const DEFAULT_GENRE = "POP";

interface NoteRange {
  min: number;
  max: number;
}

/** 플레이어 재생성 등: 특정 버전의 생성 옵션으로 스토어를 한 번에 맞출 때 사용 */
export type RegenerateVersionSeed = {
  instrumentId: number;
  mappings: ProjectVersionMappingResponseDto[];
  genre: string;
  minNote: number;
  maxNote: number;
  temperature: number;
};

function trackIndexFromId(trackId: string): number | null {
  const m = /^track-(\d+)$/.exec(trackId);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

interface MidiStore {
  tracks: Track[];
  selectedInstrument: number | null;
  uploadedFile: File | null;
  trackMappings: Record<string, number>;
  noteRange: NoteRange | null;
  genre: string | null;
  projectName: string;
  setTracks: (tracks: Track[], seed?: RegenerateVersionSeed | null) => void;
  setSelectedInstrument: (id: number | null) => void;
  setUploadedFile: (file: File | null) => void;
  setTrackMapping: (trackId: string, targetInstrumentId: number) => void;
  setNoteRange: (range: NoteRange | null) => void;
  setGenre: (genre: string | null) => void;
  setProjectName: (name: string) => void;
  reset: () => void;
}

export const useMidiStore = create<MidiStore>()(
  persist(
    (set) => ({
      tracks: [],
      selectedInstrument: null,
      uploadedFile: null,
      trackMappings: {},
      noteRange: null,
      genre: DEFAULT_GENRE,
      projectName: "",
      setTracks: (tracks, seed) =>
        set(() => {
          const mappingsByIndex = new Map<number, number>();
          if (seed?.mappings?.length) {
            for (const m of seed.mappings) {
              mappingsByIndex.set(m.trackIndex, m.targetInstrumentId);
            }
          }

          const nextMappings: Record<string, number> = {};
          tracks.forEach((track) => {
            const idx = trackIndexFromId(track.id);
            const mapped =
              idx != null && mappingsByIndex.has(idx)
                ? mappingsByIndex.get(idx)!
                : track.sourceInstrumentId;
            nextMappings[track.id] = mapped;
          });

          if (seed) {
            return {
              tracks,
              trackMappings: nextMappings,
              selectedInstrument: seed.instrumentId,
              genre: seed.genre,
              noteRange: { min: seed.minNote, max: seed.maxNote },
            };
          }

          return {
            tracks,
            trackMappings: nextMappings,
            genre: DEFAULT_GENRE,
            noteRange: null,
          };
        }),
      setSelectedInstrument: (id) => set({ selectedInstrument: id }),
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setTrackMapping: (trackId, targetInstrumentId) =>
        set((state) => ({
          trackMappings: {
            ...state.trackMappings,
            [trackId]: targetInstrumentId,
          },
        })),
      setNoteRange: (range) => set({ noteRange: range }),
      setGenre: (genre) => set({ genre }),
      setProjectName: (name) => set({ projectName: name }),
      reset: () =>
        set({
          tracks: [],
          selectedInstrument: null,
          uploadedFile: null,
          trackMappings: {},
          noteRange: null,
          genre: DEFAULT_GENRE,
          projectName: "",
        }),
    }),
    {
      name: "tutti-midi-store",
      storage: createJSONStorage(() => localStorage),
      // File은 직렬화 불가 — 트랙 메타만 유지해 새로고침 후에도 목록 유지
      partialize: (state) => ({
        tracks: state.tracks,
        trackMappings: state.trackMappings,
        selectedInstrument: state.selectedInstrument,
        noteRange: state.noteRange,
        genre: state.genre,
        projectName: state.projectName,
      }),
      merge: (persistedState, currentState) => {
        if (persistedState == null || typeof persistedState !== "object") {
          return currentState;
        }
        const p = persistedState as Partial<MidiStore>;
        const genre =
          p.genre != null && String(p.genre).trim() !== ""
            ? p.genre
            : DEFAULT_GENRE;
        return { ...currentState, ...p, genre };
      },
    },
  ),
);
