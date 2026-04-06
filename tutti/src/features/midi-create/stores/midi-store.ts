import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Track } from "@/types/track";
import { DROP_CATEGORY_PROGRAM } from "@common/utils/midi-utils";

interface NoteRange {
  min: number;
  max: number;
}

interface MidiStore {
  tracks: Track[];
  selectedInstrument: number | null;
  uploadedFile: File | null;
  trackMappings: Record<string, number>;
  noteRange: NoteRange | null;
  setTracks: (tracks: Track[]) => void;
  setSelectedInstrument: (id: number | null) => void;
  setUploadedFile: (file: File | null) => void;
  setTrackMapping: (trackId: string, targetInstrumentId: number) => void;
  setNoteRange: (range: NoteRange | null) => void;
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
      setTracks: (tracks) =>
        set(() => {
          const nextMappings: Record<string, number> = {};
          tracks.forEach((track) => {
            nextMappings[track.id] = track.isDropListProgram
              ? DROP_CATEGORY_PROGRAM
              : track.sourceInstrumentId;
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
      setNoteRange: (range) => set({ noteRange: range }),
      reset: () =>
        set({
          tracks: [],
          selectedInstrument: null,
          uploadedFile: null,
          trackMappings: {},
          noteRange: null,
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
      }),
    },
  ),
);
