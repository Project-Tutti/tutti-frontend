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

interface GenerationStore {
  projectId: number | null;
  versionId: number | null;
  isMinimized: boolean;
  sseState: ProjectStatusState;
  /** GlobalGenerationWidget이 주입하는 retry 함수 */
  retryFn: (() => void) | null;

  start: (projectId: number, versionId: number) => void;
  minimize: () => void;
  maximize: () => void;
  clear: () => void;
  /** GlobalGenerationWidget 전용 — SSE 상태 동기화 */
  _updateSse: (state: ProjectStatusState) => void;
  _setRetryFn: (fn: () => void) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  projectId: null,
  versionId: null,
  isMinimized: false,
  sseState: INITIAL_SSE,
  retryFn: null,

  start: (projectId, versionId) =>
    set({ projectId, versionId, isMinimized: false, sseState: INITIAL_SSE, retryFn: null }),
  minimize: () => set({ isMinimized: true }),
  maximize: () => set({ isMinimized: false }),
  clear: () =>
    set({ projectId: null, versionId: null, isMinimized: false, sseState: INITIAL_SSE, retryFn: null }),
  _updateSse: (sseState) => set({ sseState }),
  _setRetryFn: (retryFn) => set({ retryFn }),
}));
