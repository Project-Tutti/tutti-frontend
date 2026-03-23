import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Track } from "@/types/track";

interface MidiStore {
  tracks: Track[];
  selectedInstrument: string | null;
  uploadedFile: File | null;
  setTracks: (tracks: Track[]) => void;
  setSelectedInstrument: (id: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  reset: () => void;
}

export const useMidiStore = create<MidiStore>()(
  persist(
    (set) => ({
      tracks: [],
      selectedInstrument: null,
      uploadedFile: null,
      setTracks: (tracks) => set({ tracks }),
      setSelectedInstrument: (id) => set({ selectedInstrument: id }),
      setUploadedFile: (file) => set({ uploadedFile: file }),
      reset: () =>
        set({ tracks: [], selectedInstrument: null, uploadedFile: null }),
    }),
    {
      name: "tutti-midi-store",
      storage: createJSONStorage(() => localStorage),
      // File은 직렬화 불가 — 트랙 메타만 유지해 새로고침 후에도 목록 유지
      partialize: (state) => ({
        tracks: state.tracks,
        selectedInstrument: state.selectedInstrument,
      }),
    },
  ),
);
