"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";
import Header from "@/components/common/Header";
import TrackModal from "@/components/before-create/TrackModal";
import AnalysisInfo from "@/components/before-create/AnalysisInfo";
import HeaderContent from "@/components/before-create/HeaderContent";
import InstrumentSettingsPanel from "@/components/before-create/InstrumentSettingsPanel";
import TrackInfoModal from "@/components/before-create/TrackInfoModal";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGenerationStore } from "@features/midi-create/stores/generation-store";
import { Track } from "@/types/track";
import { useCreateProjectMutation } from "@api/midi/hooks/mutations/useCreateProjectMutation";
import { useRegenerateProjectMutation } from "@api/project/hooks/mutations/useRegenerateProjectMutation";
import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";
import { useInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useInstrumentCategoriesQuery";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { toast } from "@/components/common/Toast";

const TRACKS_PER_PAGE = 8;

function BeforeCreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    tracks,
    trackMappings,
    genre,
    selectedInstrument,
    noteRange,
    projectName,
    setSelectedInstrument,
    setNoteRange,
    setGenre,
    setProjectName,
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

  const { entries, startPending: genStartPending, confirm: genConfirm, clearByKey } = useGenerationStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isTrackInfoOpen, setIsTrackInfoOpen] = useState(false);
  const createProjectMutation = useCreateProjectMutation();
  const regenerateMutation = useRegenerateProjectMutation();

  // GlobalGenerationWidget drives the SSE; we just read state from the store
  const projectQuery = useProjectQuery(
    parsedRegenerateProjectId,
    isRegenerateMode,
  );

  const shouldPrefetchInstrumentCategories = hasHydrated && tracks.length > 0;
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
    setCreateError(
      "버전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }, [isRegenerateMode, projectQuery.isError]);

  // 재생성 모드: (versionId가 있으면 해당 버전, 없으면 최신 버전) 설정을 기본값으로 채움
  useEffect(() => {
    if (!isRegenerateMode) return;
    if (!hasHydrated) return;
    const versions = projectQuery.data?.result?.versions ?? [];
    if (!versions.length) return;

    const byId =
      parsedRegenerateVersionId == null
        ? null
        : (versions.find((v) => v.versionId === parsedRegenerateVersionId) ??
          null);

    const latest =
      byId ??
      [...versions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ??
      null;
    if (!latest) return;

    if (selectedInstrument == null) setSelectedInstrument(latest.instrumentId);
    if (!genre) setGenre(latest.genre);
    if (noteRange == null)
      setNoteRange({ min: latest.minNote, max: latest.maxNote });
  }, [
    isRegenerateMode,
    hasHydrated,
    projectQuery.data?.result?.versions,
    parsedRegenerateVersionId,
    selectedInstrument,
    genre,
    noteRange,
    setSelectedInstrument,
    setGenre,
    setNoteRange,
  ]);

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

  const handleGenerate = async () => {
    setCreateError(null);

    if (!isRegenerateMode && !projectName.trim()) {
      toast.error("프로젝트 이름을 입력해주세요.");
      return;
    }

    const label = isRegenerateMode
      ? `${projectQuery.data?.result?.name ?? `Project #${parsedRegenerateProjectId ?? ""}`} · ${nextVersionName}`
      : projectName.trim();
    const tempKey = genStartPending(label);

    try {
      if (isRegenerateMode) {
        if (parsedRegenerateProjectId == null) {
          throw new Error("projectId가 올바르지 않습니다.");
        }
        if (projectQuery.isPending) {
          throw new Error(
            "버전 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
          );
        }
        if (projectQuery.isError) {
          throw new Error(
            "버전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
          );
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
            temperature: 1.0,
            mappings,
          },
        });

        if (!res.isSuccess) {
          throw new Error(res.message ?? "재생성 실패");
        }

        genConfirm(tempKey, res.result.projectId, res.result.versionId);
        return;
      }

      const result = await createProjectMutation.mutateAsync();
      genConfirm(tempKey, result.projectId, result.versionId);
    } catch (err) {
      clearByKey(tempKey);
      setCreateError(err instanceof Error ? err.message : "프로젝트 생성 실패");
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-[#05070a]">
        <Spinner size="sm" />
        <p className="text-gray-400 text-sm">불러오는 중…</p>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  const projectNameMissing = !isRegenerateMode && !projectName.trim();

  return (
    <div className="flex h-dvh max-h-dvh flex-row overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex h-dvh max-h-dvh min-h-0 grow flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title=""
          rightContent={<HeaderContent trackCount={tracks.length} />}
        />

        <main className="flex min-h-0 grow flex-col overflow-y-auto bg-[#05070a] p-3 md:p-6">
          {/* 프로젝트 이름 입력 (재생성 모드면 같은 높이 여백만) */}
          {isRegenerateMode ? (
            <div className="mx-auto mb-2 h-14 w-full max-w-3xl md:mb-3 md:h-16" />
          ) : (
            <div className="mx-auto mb-2 w-full max-w-3xl md:mb-3">
              <label className="block">
                <span className="mb-1.5 block text-[16px] font-medium text-gray-400">
                  프로젝트 이름
                </span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="사용할 프로젝트 이름을 입력하세요."
                  aria-invalid={projectNameMissing}
                  className={`w-full rounded-lg border bg-[#0f1218]/60 px-4 py-4 text-[20px] text-white outline-none transition-colors focus:bg-[#0f1218]/80 placeholder:text-rose-200/45 ${
                    projectNameMissing
                      ? "border-red-500/50 focus:border-red-500/60"
                      : "border-[#2d4a6a] focus:border-[#3b82f6]/50"
                  }`}
                />
              </label>
            </div>
          )}

          {/* 생성설정: 모달이 아니라 페이지에 바로 노출 */}
          <div className="mx-auto mb-3 w-full max-w-3xl md:mb-4">
            <InstrumentSettingsPanel
              onBack={
                !isRegenerateMode
                  ? () => router.push("/home?step=2")
                  : undefined
              }
              showInstrumentSelector={isRegenerateMode}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </div>

          {/* 트랙 정보: 클릭해서 모달로 들어가게 */}
          <div className="mx-auto mb-2 w-full max-w-3xl md:mb-3">
            <button
              type="button"
              onClick={() => setIsTrackInfoOpen(true)}
              className="w-full rounded-xl border border-[#2d4a6a] bg-[#0f1218]/35 px-4 py-3 text-left transition-colors hover:bg-[#0f1218]/55"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold text-gray-300">
                    트랙 정보
                  </span>
                  <span className="mt-0.5 text-[14px] text-gray-500">
                    {tracks.length} tracks · 클릭해서 확인/매핑
                  </span>
                </div>
                <span className="text-[14px] font-medium text-[#3b82f6]">
                  열기
                </span>
              </div>
            </button>
          </div>

          {/* 분석 정보 & Generate 버튼 */}
          <AnalysisInfo
            onGenerate={() => {
              void handleGenerate();
            }}
            isPending={
              (isRegenerateMode && parsedRegenerateProjectId != null
                ? Object.values(entries).some(
                    (e) =>
                      e.projectId === parsedRegenerateProjectId &&
                      !e.sseState.isComplete &&
                      !e.sseState.isFailed,
                  )
                : false) ||
              (isRegenerateMode
                ? regenerateMutation.isPending ||
                  projectQuery.isPending ||
                  projectQuery.isError
                : createProjectMutation.isPending)
            }
            disabled={
              !genre || selectedInstrument == null || projectNameMissing
            }
            errorMessage={createError}
            label={isRegenerateMode ? "악보 재생성하기" : "악보 생성하기"}
            pendingLabel={isRegenerateMode ? "재생성 중…" : "생성 중…"}
            variant={isRegenerateMode ? "regenerate" : "generate"}
          />
        </main>
      </div>

      {/* 트랙 정보 모달 */}
      <TrackInfoModal
        isOpen={isTrackInfoOpen}
        onClose={() => setIsTrackInfoOpen(false)}
        tracks={currentTracks}
        currentPage={currentPage}
        totalPages={totalPages}
        onTrackClick={handleTrackClick}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onPageChange={setCurrentPage}
      />

      {/* 트랙 모달 (트랙 정보 모달 위에 떠야 함) */}
      <TrackModal
        isOpen={isModalOpen}
        track={selectedTrack}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}

export default function BeforeCreatePage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-[#05070a]">
            <Spinner size="sm" />
            <p className="text-gray-400 text-sm">페이지 준비 중…</p>
          </div>
        }
      >
        <BeforeCreatePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
