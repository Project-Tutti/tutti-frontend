import { create } from "zustand";
import type { ProjectStatusState } from "@api/project/hooks/useProjectStatusSSE";

const INITIAL_SSE: ProjectStatusState = {
  status: "pending",
  progress: 0,
  message: "연결 중...",
  error: null,
  isComplete: false,
  isFailed: false,
};

export function genKey(pid: number, vid: number) {
  return `${pid}-${vid}`;
}

function findKeyByPidVid(
  entries: Record<string, GenEntry>,
  pid: number,
  vid: number,
): string | undefined {
  return Object.keys(entries).find(
    (k) => entries[k].projectId === pid && entries[k].versionId === vid,
  );
}

export type GenEntry = {
  projectId: number | null;
  versionId: number | null;
  isMinimized: boolean;
  sseState: ProjectStatusState;
  retryFn: (() => void) | null;
  label?: string;
};

interface GenerationStore {
  entries: Record<string, GenEntry>;
  start: (projectId: number, versionId: number, minimized?: boolean, label?: string) => void;
  startPending: (label?: string) => string;
  confirm: (tempKey: string, projectId: number, versionId: number) => void;
  clearByKey: (key: string) => void;
  minimizeByKey: (key: string) => void;
  maximizeByKey: (key: string) => void;
  maximize: (projectId: number, versionId: number) => void;
  clear: (projectId: number, versionId: number) => void;
  clearAll: () => void;
  updateLabel: (projectId: number, versionId: number, label: string) => void;
  _updateSse: (projectId: number, versionId: number, state: ProjectStatusState) => void;
  _setRetryFn: (projectId: number, versionId: number, fn: () => void) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  entries: {},

  startPending: (label) => {
    const tempKey = `pending-${Date.now()}`;
    set((s) => ({
      entries: {
        ...s.entries,
        [tempKey]: {
          projectId: null,
          versionId: null,
          isMinimized: false,
          sseState: INITIAL_SSE,
          retryFn: null,
          label,
        },
      },
    }));
    return tempKey;
  },

  confirm: (tempKey, projectId, versionId) => {
    set((s) => {
      const pending = s.entries[tempKey];
      if (!pending) return s;
      return {
        entries: {
          ...s.entries,
          [tempKey]: { ...pending, projectId, versionId },
        },
      };
    });
  },

  clearByKey: (key) => {
    set((s) => {
      const next = { ...s.entries };
      delete next[key];
      return { entries: next };
    });
  },

  minimizeByKey: (key) => {
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, isMinimized: true } } };
    });
  },

  maximizeByKey: (key) => {
    set((s) => {
      const entry = s.entries[key];
      if (!entry) return s;
      return { entries: { ...s.entries, [key]: { ...entry, isMinimized: false } } };
    });
  },

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

  maximize: (projectId, versionId) => {
    set((s) => {
      const key = findKeyByPidVid(s.entries, projectId, versionId);
      if (!key) return s;
      return { entries: { ...s.entries, [key]: { ...s.entries[key], isMinimized: false } } };
    });
  },

  clear: (projectId, versionId) => {
    set((s) => {
      const key = findKeyByPidVid(s.entries, projectId, versionId);
      if (!key) return s;
      const next = { ...s.entries };
      delete next[key];
      return { entries: next };
    });
  },

  clearAll: () => set({ entries: {} }),

  updateLabel: (projectId, versionId, label) => {
    set((s) => {
      const key = findKeyByPidVid(s.entries, projectId, versionId);
      if (!key) return s;
      return { entries: { ...s.entries, [key]: { ...s.entries[key], label } } };
    });
  },

  _updateSse: (projectId, versionId, sseState) => {
    set((s) => {
      const key = findKeyByPidVid(s.entries, projectId, versionId);
      if (!key) return s;
      return { entries: { ...s.entries, [key]: { ...s.entries[key], sseState } } };
    });
  },

  _setRetryFn: (projectId, versionId, retryFn) => {
    set((s) => {
      const key = findKeyByPidVid(s.entries, projectId, versionId);
      if (!key) return s;
      return { entries: { ...s.entries, [key]: { ...s.entries[key], retryFn } } };
    });
  },
}));
