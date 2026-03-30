"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import TrackGrid from "@/components/before-create/TrackGrid";
import TrackModal from "@/components/before-create/TrackModal";
import AnalysisInfo from "@/components/before-create/AnalysisInfo";
import HeaderContent from "@/components/before-create/HeaderContent";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { Track } from "@/types/track";
import { useCreateProjectMutation } from "@api/midi/hooks/mutations/useCreateProjectMutation";
import { ApiError } from "@/common/errors/ApiError";
import { useRegenerateProjectMutation } from "@api/project/hooks/mutations/useRegenerateProjectMutation";
import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";

const TRACKS_PER_PAGE = 8;

/** TODO: 생성 API가 projectId / versionId 를 주면 mutate 응답으로 교체 */
const DEV_PLAYER_PROJECT_ID = 14;
const DEV_PLAYER_VERSION_ID = 14;

const BeforeCreatePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tracks, uploadedFile, trackMappings } = useMidiStore();

  const mode = searchParams.get("mode");
  const isRegenerateMode = mode === "regenerate";
  const regenerateProjectId = searchParams.get("projectId");
  const parsedRegenerateProjectId = useMemo(() => {
    if (!isRegenerateMode) return null;
    const n = regenerateProjectId == null ? NaN : Number(regenerateProjectId);
    return Number.isFinite(n) ? n : null;
  }, [isRegenerateMode, regenerateProjectId]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createProjectMutation = useCreateProjectMutation();
  const regenerateMutation = useRegenerateProjectMutation();
  const projectQuery = useProjectQuery(parsedRegenerateProjectId, isRegenerateMode);

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

    try {
      if (isRegenerateMode) {
        if (parsedRegenerateProjectId == null) {
          throw new Error("projectId가 올바르지 않습니다.");
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
            mappings,
          },
        });

        if (!res.isSuccess) {
          throw new Error(res.message ?? "재생성 실패");
        }

        router.push(
          `/player?projectId=${encodeURIComponent(String(res.result.projectId))}&versionId=${encodeURIComponent(String(res.result.versionId))}`,
        );
        return;
      }

      await createProjectMutation.mutateAsync();
      router.push(
        `/player?projectId=${encodeURIComponent(String(DEV_PLAYER_PROJECT_ID))}&versionId=${encodeURIComponent(String(DEV_PLAYER_VERSION_ID))}`,
      );
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "프로젝트 생성 실패",
      );
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#05070a]">
        <Spinner size="md" />
        <p className="text-gray-400 text-sm">불러오는 중…</p>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <div className="min-h-screen flex flex-row overflow-x-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="grow flex flex-col min-h-screen">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title="Identified Tracks"
          subtitle="Analysis Complete"
          rightContent={<HeaderContent trackCount={tracks.length} />}
        />

        <main className="grow flex flex-col bg-[#05070a] p-4 md:p-8 overflow-y-auto">
          {/* 타이틀 */}
          <div className="max-w-5xl mx-auto w-full mb-8 md:mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">
              Identified Tracks
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto">
              {uploadedFile
                ? `"${uploadedFile.name}" 분석이 완료되었습니다. 발견된 트랙들을 확인하세요.`
                : "파일 분석이 완료되었습니다. 발견된 트랙들을 확인하세요."}
            </p>
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
              isRegenerateMode
                ? regenerateMutation.isPending
                : createProjectMutation.isPending
            }
            label={isRegenerateMode ? "Regenerate" : "Generate"}
            pendingLabel={isRegenerateMode ? "Regenerating..." : "Generating..."}
            icon={isRegenerateMode ? "autorenew" : "auto_fix_high"}
          />

          {createError && (
            <p className="mt-4 text-sm text-red-400 text-center">
              {createError}
            </p>
          )}
        </main>

        <Footer />
      </div>

      {/* 모달 */}
      <TrackModal
        isOpen={isModalOpen}
        track={selectedTrack}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default BeforeCreatePage;
