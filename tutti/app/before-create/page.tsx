"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import TrackGrid from "@/components/before-create/TrackGrid";
import TrackModal from "@/components/before-create/TrackModal";
import AnalysisInfo from "@/components/before-create/AnalysisInfo";
import HeaderContent from "@/components/before-create/HeaderContent";
import InstrumentInfoPanel from "@/components/before-create/InstrumentInfoPanel";
import InstrumentSettingsModal from "@/components/before-create/InstrumentSettingsModal";
import GenerationProgressOverlay from "@/components/before-create/GenerationProgressOverlay";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { Track } from "@/types/track";
import { useCreateProjectMutation } from "@api/midi/hooks/mutations/useCreateProjectMutation";
import { useRegenerateProjectMutation } from "@api/project/hooks/mutations/useRegenerateProjectMutation";
import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";
import { useInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useInstrumentCategoriesQuery";
import { useProjectStatusSSE } from "@api/project/hooks/useProjectStatusSSE";

const TRACKS_PER_PAGE = 8;

const BeforeCreatePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    tracks,
    uploadedFile,
    trackMappings,
    genre,
    selectedInstrument,
    noteRange,
    freedom,
    setSelectedInstrument,
    setNoteRange,
    setGenre,
    setFreedom,
    setTrackMapping,
  } = useMidiStore();

  const mode = searchParams.get("mode");
  const isRegenerateMode = mode === "regenerate";
  const regenerateProjectId = searchParams.get("projectId");
  const regenerateVersionId = searchParams.get("versionId");
  const parsedRegenerateProjectId = useMemo(() => {
    if (!isRegenerateMode) return null;
    const n = regenerateProjectId == null ? NaN : Number(regenerateProjectId);
    return Number.isFinite(n) ? n : null;
  }, [isRegenerateMode, regenerateProjectId]);
  const parsedRegenerateVersionId = useMemo(() => {
    if (!isRegenerateMode) return null;
    const n = regenerateVersionId == null ? NaN : Number(regenerateVersionId);
    return Number.isFinite(n) ? n : null;
  }, [isRegenerateMode, regenerateVersionId]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sseProjectId, setSseProjectId] = useState<number | null>(null);
  const [sseVersionId, setSseVersionId] = useState<number | null>(null);

  const createProjectMutation = useCreateProjectMutation();
  const regenerateMutation = useRegenerateProjectMutation();
  const {
    reset: sseReset,
    retry: sseRetry,
    status: sseStatus,
    progress: sseProgress,
    message: sseMessage,
    error: sseError,
    isComplete: sseIsComplete,
    isFailed: sseIsFailed,
  } = useProjectStatusSSE(sseProjectId, sseVersionId);

  const sseOverlayState = {
    status: sseStatus,
    progress: sseProgress,
    message: sseMessage,
    error: sseError,
    isComplete: sseIsComplete,
    isFailed: sseIsFailed,
  };
  const hasNavigatedRef = useRef(false);
  const regenerateUiSeededRef = useRef<string | null>(null);
  const projectQuery = useProjectQuery(parsedRegenerateProjectId, isRegenerateMode);

  const shouldPrefetchInstrumentCategories =
    hasHydrated && tracks.length > 0;
  useInstrumentCategoriesQuery(shouldPrefetchInstrumentCategories);

  const nextVersionName = useMemo(() => {
    if (!isRegenerateMode) return "v1";
    const versions = projectQuery.data?.result?.versions ?? [];
    let maxN = 0;
    for (const v of versions) {
      const m = /^v(\d+)$/i.exec(String(v.name ?? "").trim());
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) maxN = Math.max(maxN, n);
      }
    }
    const fallback = versions.length;
    const next = Math.max(maxN, fallback) + 1;
    return `v${next}`;
  }, [isRegenerateMode, projectQuery.data?.result?.versions]);

  useEffect(() => {
    if (!isRegenerateMode) return;
    if (!projectQuery.isError) return;
    setCreateError("버전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  }, [isRegenerateMode, projectQuery.isError]);

  // 재생성 모드: URL의 버전(또는 최신)과 동일한 UI 값·트랙 매핑을 한 번 적용 (persist에 남은 이전 악기 덮어쓰기)
  useEffect(() => {
    if (!isRegenerateMode) return;
    if (!hasHydrated) return;
    if (parsedRegenerateProjectId == null) return;
    const versions = projectQuery.data?.result?.versions ?? [];
    if (!versions.length) return;

    const byId =
      parsedRegenerateVersionId == null
        ? null
        : versions.find((v) => v.versionId === parsedRegenerateVersionId) ?? null;

    const latest =
      byId ??
      [...versions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ??
      null;
    if (!latest) return;

    const seedKey = `${parsedRegenerateProjectId}-${latest.versionId}`;
    if (regenerateUiSeededRef.current === seedKey) return;
    regenerateUiSeededRef.current = seedKey;

    setSelectedInstrument(latest.instrumentId);
    setGenre(latest.genre);
    setNoteRange({ min: latest.minNote, max: latest.maxNote });
    setFreedom(latest.temperature);
    for (const m of latest.mappings ?? []) {
      setTrackMapping(`track-${m.trackIndex}`, m.targetInstrumentId);
    }
  }, [
    isRegenerateMode,
    hasHydrated,
    parsedRegenerateProjectId,
    parsedRegenerateVersionId,
    projectQuery.data?.result?.versions,
    setSelectedInstrument,
    setGenre,
    setNoteRange,
    setFreedom,
    setTrackMapping,
  ]);

  // SSE complete → player 페이지로 이동
  useEffect(() => {
    if (!sseIsComplete) return;
    if (sseProjectId == null || sseVersionId == null) return;
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    router.push(
      `/player?projectId=${encodeURIComponent(String(sseProjectId))}&versionId=${encodeURIComponent(String(sseVersionId))}`,
    );
  }, [sseIsComplete, sseProjectId, sseVersionId, router]);

  // persist 재수화 전에는 tracks가 비어 있어 오인하지 않도록 대기
  useEffect(() => {
    const unsub = useMidiStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    if (useMidiStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, []);

  // 재수화 완료 후에만: 분석 데이터 없으면 업로드 화면으로
  useEffect(() => {
    if (!hasHydrated) return;
    if (tracks.length === 0) {
      router.replace("/home");
    }
  }, [hasHydrated, tracks, router]);

  const totalPages = Math.ceil(tracks.length / TRACKS_PER_PAGE);
  const currentTracks = tracks.slice(
    currentPage * TRACKS_PER_PAGE,
    (currentPage + 1) * TRACKS_PER_PAGE,
  );

  const handleTrackClick = (track: Track) => {
    setSelectedTrack(track);
    setIsModalOpen(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const startSSE = useCallback(
    (projectId: number, versionId: number) => {
      hasNavigatedRef.current = false;
      sseReset();
      setSseProjectId(projectId);
      setSseVersionId(versionId);
    },
    [sseReset],
  );

  const handleCancelSSE = useCallback(() => {
    sseReset();
    setSseProjectId(null);
    setSseVersionId(null);
  }, [sseReset]);

  const handleGenerate = async () => {
    setCreateError(null);

    try {
      if (isRegenerateMode) {
        if (parsedRegenerateProjectId == null) {
          throw new Error("projectId가 올바르지 않습니다.");
        }
        if (projectQuery.isPending) {
          throw new Error("버전 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        }
        if (projectQuery.isError) {
          throw new Error("버전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
        if (!genre) {
          throw new Error("장르를 선택해주세요.");
        }
        if (selectedInstrument == null) {
          throw new Error("선택된 악기(instrumentId)가 없습니다.");
        }

        const mappings = tracks.map((track, index) => {
          const fromId = /^track-(\d+)$/.exec(track.id);
          const trackIndex = fromId ? Number(fromId[1]) : index;
          return {
            trackIndex,
            targetInstrumentId:
              trackMappings[track.id] ?? track.sourceInstrumentId,
          };
        });

        const res = await regenerateMutation.mutateAsync({
          projectId: parsedRegenerateProjectId,
          body: {
            versionName: nextVersionName,
            instrumentId: selectedInstrument,
            minNote: noteRange?.min ?? 0,
            maxNote: noteRange?.max ?? 127,
            genre,
            temperature: freedom ?? 1.0,
            mappings,
          },
        });

        if (!res.isSuccess) {
          throw new Error(res.message ?? "재생성 실패");
        }

        startSSE(res.result.projectId, res.result.versionId);
        return;
      }

      const result = await createProjectMutation.mutateAsync();
      startSSE(result.projectId, result.versionId);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "프로젝트 생성 실패",
      );
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-[#05070a]">
        <Spinner size="sm" />
        <p className="text-gray-400 text-xs">불러오는 중…</p>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <div className="h-screen flex flex-row overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="grow flex flex-col h-screen overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title="Identified Tracks"
          subtitle="Analysis Complete"
          rightContent={<HeaderContent trackCount={tracks.length} />}
        />

        <main className="grow flex flex-col bg-[#05070a] p-3 md:p-6 overflow-hidden">
          {/* 상단: 파일명 안내 + 악기/음역대 패널 */}
          <div className="max-w-3xl mx-auto w-full mb-3 md:mb-4 space-y-2.5">
            <p className="text-gray-500 text-[10px] md:text-[11px] text-center">
              {uploadedFile
                ? `"${uploadedFile.name}" 분석 완료 · ${tracks.length} tracks`
                : `분석 완료 · ${tracks.length} tracks`}
            </p>
            <InstrumentInfoPanel onOpenSettings={() => setIsSettingsModalOpen(true)} />
          </div>

          {/* 트랙 그리드 */}
          <TrackGrid
            tracks={currentTracks}
            currentPage={currentPage}
            totalPages={totalPages}
            onTrackClick={handleTrackClick}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onPageChange={setCurrentPage}
          />

          {/* 분석 정보 & Generate 버튼 */}
          <AnalysisInfo
            onGenerate={() => {
              void handleGenerate();
            }}
            isPending={
              sseProjectId != null ||
              (isRegenerateMode
                ? regenerateMutation.isPending ||
                  projectQuery.isPending ||
                  projectQuery.isError
                : createProjectMutation.isPending)
            }
            disabled={!genre || selectedInstrument == null}
            disabledReason={
              !genre
                ? "장르를 선택해주세요"
                : selectedInstrument == null
                  ? "생성 악기를 선택해주세요"
                  : undefined
            }
            label={isRegenerateMode ? "Regenerate" : "Generate"}
            pendingLabel={isRegenerateMode ? "Regenerating..." : "Generating..."}
            icon={isRegenerateMode ? "autorenew" : "auto_fix_high"}
          />

          {createError && (
            <p className="mt-3 text-xs text-red-400 text-center">
              {createError}
            </p>
          )}
        </main>

        <Footer />
      </div>

      {/* 트랙 모달 */}
      <TrackModal
        isOpen={isModalOpen}
        track={selectedTrack}
        onClose={() => setIsModalOpen(false)}
      />

      {/* 생성 설정 모달 (음역대 / 장르 / 자유도) */}
      <InstrumentSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* 생성 진행률 오버레이 */}
      <GenerationProgressOverlay
        state={sseOverlayState}
        onRetry={sseRetry}
        onCancel={handleCancelSSE}
      />
    </div>
  );
};

export default BeforeCreatePage;
