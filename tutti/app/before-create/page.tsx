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

const TRACKS_PER_PAGE = 8;

const BeforeCreatePage = () => {
  const router = useRouter();
  const { tracks, uploadedFile } = useMidiStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // tracks가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (tracks.length === 0) {
      router.replace("/");
    }
  }, [tracks, router]);

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

  const handleGenerate = () => {
    console.log("Generate clicked!");
    // TODO: 생성 로직 구현
  };

  // 리다이렉트 되는 동안 빈 화면 방지
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
          <AnalysisInfo onGenerate={handleGenerate} />
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
