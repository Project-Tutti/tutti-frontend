import { create } from "zustand";
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

export const useMidiStore = create<MidiStore>((set) => ({
  tracks: [],
  selectedInstrument: null,
  uploadedFile: null,
  setTracks: (tracks) => set({ tracks }),
  setSelectedInstrument: (id) => set({ selectedInstrument: id }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  reset: () =>
    set({ tracks: [], selectedInstrument: null, uploadedFile: null }),
}));
