import { create } from "zustand";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

const INITIAL_SSE: ProjectStatusState = {
  status: null,
  progress: 0,
  message: null,
  error: null,
  isComplete: false,
  isFailed: false,
};

export function genKey(pid: number, vid: number) {
  return `${pid}-${vid}`;
}

export type GenEntry = {
  projectId: number;
  versionId: number;
  isMinimized: boolean;
  sseState: ProjectStatusState;
  retryFn: (() => void) | null;
  label?: string;
};

interface GenerationStore {
  entries: Record<string, GenEntry>;
  start: (projectId: number, versionId: number, minimized?: boolean, label?: string) => void;
  minimize: (projectId: number, versionId: number) => void;
  maximize: (projectId: number, versionId: number) => void;
  clear: (projectId: number, versionId: number) => void;
  clearAll: () => void;
  _updateSse: (projectId: number, versionId: number, state: ProjectStatusState) => void;
  _setRetryFn: (projectId: number, versionId: number, fn: () => void) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  entries: {},

  start: (projectId, versionId, minimized = false, label) => {
    const key = genKey(projectId, versionId);
    set((s) => ({
      entries: {
        ...s.entries,
        [key]: {
          projectId,
          versionId,
          isMinimized: minimized,
          sseState: INITIAL_SSE,
          retryFn: null,
          label,
        },
      },
    }));
  },

  minimize: (projectId, versionId) => {
    const key = genKey(projectId, versionId);
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, isMinimized: true } } };
    });
  },

  maximize: (projectId, versionId) => {
    const key = genKey(projectId, versionId);
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, isMinimized: false } } };
    });
  },

  clear: (projectId, versionId) => {
    const key = genKey(projectId, versionId);
    set((s) => {
      const next = { ...s.entries };
      delete next[key];
      return { entries: next };
    });
  },

  clearAll: () => set({ entries: {} }),

  _updateSse: (projectId, versionId, sseState) => {
    const key = genKey(projectId, versionId);
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, sseState } } };
    });
  },

  _setRetryFn: (projectId, versionId, retryFn) => {
    const key = genKey(projectId, versionId);
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, retryFn } } };
    });
  },
}));
