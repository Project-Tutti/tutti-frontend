"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MusicPlayer from "@/components/music/MusicPlayer";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Spinner } from "@/components/common/Spinner";
import { useProjectScoreQuery } from "@api/project/hooks/queries/useProjectScoreQuery";

/** TODO: `/player`만 열었을 때 기본 pid/vid 제거 — 개발용 */
const DEV_PLAYER_PROJECT_ID = "14";
const DEV_PLAYER_VERSION_ID = "14";

function PlayerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawProjectId = searchParams.get("projectId");
  const rawVersionId = searchParams.get("versionId");

  /** 쿼리가 없으면 임시로 14/14 악보 조회. 둘 중 하나만 있으면 API 호출 안 함. */
  const useDevDefault =
    rawProjectId == null && rawVersionId == null;
  const fetchScoreFromApi =
    useDevDefault ||
    (rawProjectId != null && rawVersionId != null);
  const projectId = useDevDefault
    ? DEV_PLAYER_PROJECT_ID
    : (rawProjectId ?? "");
  const versionId = useDevDefault
    ? DEV_PLAYER_VERSION_ID
    : (rawVersionId ?? "");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  const {
    data: scoreXml,
    isPending: isScorePending,
    isError: isScoreError,
    error: scoreError,
    refetch: refetchScore,
  } = useProjectScoreQuery(projectId, versionId, fetchScoreFromApi);

  const effectiveSubtitle = fetchScoreFromApi
    ? `프로젝트 ${projectId} · 버전 ${versionId}`
    : "프로젝트를 불러올 수 없습니다";

  // 새로운 악보 로드 시 스크롤 최상단으로 이동
  useEffect(() => {
    if (scoreXml && mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scoreXml]);

  const openDownloadModal = () => {
    if (!fetchScoreFromApi || !projectId || !versionId) return;
    const qs = new URLSearchParams({
      projectId: String(projectId),
      versionId: String(versionId),
    });
    router.push(`/player/download?${qs.toString()}`);
  };

  const showInvalidParams = !fetchScoreFromApi;
  const showScoreLoading = fetchScoreFromApi && isScorePending;
  const showScoreError =
    fetchScoreFromApi && isScoreError && !isScorePending;

  return (
    <div className="h-screen flex flex-row overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="grow flex flex-col min-h-0">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title="Music Player"
          subtitle={effectiveSubtitle}
          rightContent={
            fetchScoreFromApi ? (
              <button
                type="button"
                onClick={() => openDownloadModal()}
                disabled={isScorePending}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#1e293b] text-gray-200 hover:bg-[#334155] border border-[#334155] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden>
                  download
                </span>
                다운로드
              </button>
            ) : undefined
          }
        />

        <main
          ref={mainRef}
          className="grow min-h-0 flex flex-col bg-[#05070a] pt-0 px-4 pb-4 md:px-8 md:pb-8 overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {showInvalidParams && (
              <div className="max-w-xl mx-auto mt-16 p-8 rounded-xl border border-[#1e293b] bg-[#0f1218] text-center">
                <p className="text-gray-300 text-sm">
                  악보를 보려면{" "}
                  <span className="text-[#93c5fd]">projectId</span>와{" "}
                  <span className="text-[#93c5fd]">versionId</span> 쿼리가
                  모두 필요합니다.
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  예:{" "}
                  <code className="text-gray-400">
                    /player?projectId=1&versionId=1
                  </code>
                </p>
              </div>
            )}

            {showScoreLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Spinner size="md" />
                <p className="text-gray-400 text-sm">악보를 불러오는 중…</p>
              </div>
            )}

            {showScoreError && (
              <div className="max-w-2xl mx-auto p-6 rounded-xl bg-[#0f1218] border border-red-900/50 text-center space-y-4">
                <p className="text-red-400 text-sm">
                  {scoreError instanceof Error
                    ? scoreError.message
                    : "악보를 불러오지 못했습니다."}
                </p>
                <button
                  type="button"
                  onClick={() => void refetchScore()}
                  className="px-4 py-2 bg-[#3b82f6] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg"
                >
                  다시 시도
                </button>
              </div>
            )}

            {scoreXml && !showScoreLoading && fetchScoreFromApi && (
              <div>
                <MusicPlayer
                  xmlData={scoreXml}
                  autoPlay={false}
                  onRequestChangeFile={undefined}
                />
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#05070a]">
          <Spinner size="md" />
          <p className="text-gray-400 text-sm">불러오는 중…</p>
        </div>
      }
    >
      <PlayerPageContent />
    </Suspense>
  );
}
