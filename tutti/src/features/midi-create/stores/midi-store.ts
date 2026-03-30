import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Track } from "@/types/track";

interface MidiStore {
  tracks: Track[];
  selectedInstrument: string | null;
  uploadedFile: File | null;
  trackMappings: Record<string, number>;
  setTracks: (tracks: Track[]) => void;
  setSelectedInstrument: (id: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  setTrackMapping: (trackId: string, targetInstrumentId: number) => void;
  reset: () => void;
}

export const useMidiStore = create<MidiStore>()(
  persist(
    (set) => ({
      tracks: [],
      selectedInstrument: null,
      uploadedFile: null,
      trackMappings: {},
      setTracks: (tracks) =>
        set((state) => {
          const nextMappings: Record<string, number> = {};
          tracks.forEach((track) => {
            nextMappings[track.id] =
              state.trackMappings[track.id] ?? track.sourceInstrumentId;
          });
          return { tracks, trackMappings: nextMappings };
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
      reset: () =>
        set({
          tracks: [],
          selectedInstrument: null,
          uploadedFile: null,
          trackMappings: {},
        }),
    }),
    {
      name: "tutti-midi-store",
      storage: createJSONStorage(() => localStorage),
      // File은 직렬화 불가 — 트랙 메타만 유지해 새로고침 후에도 목록 유지
      partialize: (state) => ({
        tracks: state.tracks,
        trackMappings: state.trackMappings,
      }),
      // 악기 선택은 세션 UI 상태라 복원하지 않음 (기본 선택 방지)
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<MidiStore>;
        return {
          ...currentState,
          ...persisted,
          selectedInstrument: null,
        };
      },
    },
  ),
);
