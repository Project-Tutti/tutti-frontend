"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/common/Sidebar";
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

const TRACKS_PER_PAGE = 8;

const BeforeCreatePage = () => {
  const router = useRouter();
  const { tracks, uploadedFile } = useMidiStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<Record<string, unknown> | null>(null);

  const createProjectMutation = useCreateProjectMutation();

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
    setCreateResult(null);

    try {
      const res = await createProjectMutation.mutateAsync();
      setCreateResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.message);
      } else if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("프로젝트 생성 실패");
      }
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070a] text-gray-400 text-sm">
        불러오는 중…
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
            isPending={createProjectMutation.isPending}
          />

          {createError && (
            <p className="mt-4 text-sm text-red-400 text-center">
              {createError}
            </p>
          )}

          {createResult && (
            <pre className="mt-4 p-4 text-xs text-gray-300 bg-[#0f1218] border border-[#1e293b] rounded-md overflow-x-auto">
              {JSON.stringify(createResult, null, 2)}
            </pre>
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
