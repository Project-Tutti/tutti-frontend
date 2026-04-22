"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, RefreshCw } from "lucide-react";
import MusicPlayer from "@/components/music/MusicPlayer";
import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import { Spinner } from "@/components/common/Spinner";
import { getProject } from "@api/project/apis/get/get-project";
import { useProjectScoreQuery } from "@api/project/hooks/queries/useProjectScoreQuery";
import { useProjectTracksQuery } from "@api/project/hooks/queries/useProjectTracksQuery";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { useGenerationStore, genKey } from "@features/midi-create/stores/generation-store";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { toast } from "@/components/common/Toast";

function PlayerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawProjectId = searchParams.get("projectId");
  const rawVersionId = searchParams.get("versionId");

  const parsedProjectId = rawProjectId == null ? NaN : Number(rawProjectId);
  const parsedVersionId = rawVersionId == null ? NaN : Number(rawVersionId);

  const hasBothQueryParams = rawProjectId != null && rawVersionId != null;
  const hasValidBothQueryNumbers =
    Number.isFinite(parsedProjectId) && Number.isFinite(parsedVersionId);

  /** projectId·versionId가 모두 있고 숫자로 파싱 가능할 때만 API 조회 */
  const fetchScoreFromApi = hasBothQueryParams && hasValidBothQueryNumbers;

  const projectId = parsedProjectId;
  const versionId = parsedVersionId;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [controlBar, setControlBar] = useState<React.ReactNode>(null);
  const handleControlBar = useCallback(
    (node: React.ReactNode) => setControlBar(node),
    [],
  );
  const { setTracks, setUploadedFile } = useMidiStore();
  const {
    start: genStart,
    maximize: genMaximize,
    clear: genClear,
  } = useGenerationStore();

  const tracksQuery = useProjectTracksQuery(
    Number.isFinite(projectId) ? projectId : null,
    false,
  );

  const mainRef = useRef<HTMLElement>(null);

  const {
    data: scoreXml,
    isPending: isScorePending,
    isError: isScoreError,
  } = useProjectScoreQuery(projectId, versionId, fetchScoreFromApi);

  // 새로운 악보 로드 시 스크롤 최상단으로 이동
  useEffect(() => {
    if (scoreXml && mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scoreXml]);

  const openDownloadModal = () => {
    if (
      !fetchScoreFromApi ||
      !Number.isFinite(projectId) ||
      !Number.isFinite(versionId)
    )
      return;
    const qs = new URLSearchParams({
      projectId: String(projectId),
      versionId: String(versionId),
    });
    router.push(`/player/download?${qs.toString()}`);
  };

  const handleRegenerate = async () => {
    if (
      !fetchScoreFromApi ||
      !Number.isFinite(projectId) ||
      !Number.isFinite(versionId)
    )
      return;
    try {
      const res = await tracksQuery.refetch();
      const tracks = res.data?.result?.tracks ?? [];
      if (!tracks.length) {
        throw new Error("트랙 정보를 불러오지 못했습니다.");
      }

      const projectRes = await getProject(projectId);
      if (!projectRes.isSuccess || !projectRes.result) {
        throw new Error(
          projectRes.message ?? "프로젝트 버전 정보를 불러오지 못했습니다.",
        );
      }
      const versionMeta = projectRes.result.versions.find(
        (v) => v.versionId === versionId,
      );
      if (!versionMeta) {
        throw new Error("선택한 버전의 생성 설정을 찾을 수 없습니다.");
      }

      setUploadedFile(null);
      setTracks(
        tracks.map((t) => ({
          id: `track-${t.trackIndex}`,
          name: `Track ${t.trackIndex + 1}`,
          icon: "music_note",
          instrumentType: "MIDI",
          sourceInstrumentId: t.sourceInstrumentId,
          channel: t.trackIndex,
          tags: ["original"],
        })),
        {
          instrumentId: versionMeta.instrumentId,
          mappings: versionMeta.mappings ?? [],
          genre: versionMeta.genre,
          minNote: versionMeta.minNote,
          maxNote: versionMeta.maxNote,
          temperature: versionMeta.temperature,
        },
      );

      router.push(
        `/before-create?mode=regenerate&projectId=${encodeURIComponent(String(projectId))}&versionId=${encodeURIComponent(String(versionId))}`,
      );
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "재생성 준비에 실패했습니다.",
      );
    }
  };

  const showInvalidParams = !fetchScoreFromApi;
  const showScoreLoading = fetchScoreFromApi && isScorePending;
  const showScoreError = fetchScoreFromApi && isScoreError && !isScorePending;

  // score 에러 시 SSE 오버레이 표시
  useEffect(() => {
    if (!showScoreError) return;
    if (!Number.isFinite(projectId) || !Number.isFinite(versionId)) return;
    const key = genKey(projectId, versionId);
    const existing = useGenerationStore.getState().entries[key];
    if (existing) {
      if (existing.isMinimized) genMaximize(projectId, versionId);
    } else {
      genStart(projectId, versionId);
    }
  }, [showScoreError, projectId, versionId, genStart, genMaximize]);

  // score 에러 해제(재시도 성공) 시 generation-store 정리
  useEffect(() => {
    if (showScoreError) return;
    if (!Number.isFinite(projectId) || !Number.isFinite(versionId)) return;
    const key = genKey(projectId, versionId);
    if (!useGenerationStore.getState().entries[key]) return;
    genClear(projectId, versionId);
  }, [showScoreError, projectId, versionId, genClear]);

  // scoreXml이 string인 경우 매 렌더마다 new File(...)을 만들면 xmlData 참조가 바뀌어
  // ScoreViewer가 불필요하게 전체 리로드(깜빡임)될 수 있어 scoreXml 변경 시에만 생성.
  const stableXmlData = useMemo(() => {
    if (!scoreXml) return null;
    if (typeof scoreXml === "string") {
      return new File([scoreXml], "score.xml", { type: "application/xml" });
    }
    return scoreXml;
  }, [scoreXml]);

  return (
    <div className="flex h-dvh max-h-dvh flex-row overflow-x-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex min-h-0 grow flex-col">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
          title=""
          centerContent={
            !showScoreLoading && controlBar ? (
              <div className="mx-auto w-full max-w-7xl">{controlBar}</div>
            ) : undefined
          }
          rightContent={
            !showScoreLoading && fetchScoreFromApi && controlBar ? (
              <div className="flex items-center gap-3 md:gap-4">
                <div
                  className="hidden h-7 w-px shrink-0 bg-[#1e293b] sm:block"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => void handleRegenerate()}
                  disabled={isScorePending || tracksQuery.isFetching}
                  className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0a0c11] px-4 py-2.5 text-[16px] font-semibold text-gray-200 shadow-sm transition-all hover:border-[#334155] hover:bg-[#12151d] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  {tracksQuery.isFetching ? (
                    <Loader2
                      className="size-4 shrink-0 animate-spin text-[#3b82f6]"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : (
                    <RefreshCw
                      className="size-4 shrink-0 text-gray-500 transition-colors group-hover:text-gray-300"
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                  <span className="tabular-nums">
                    {tracksQuery.isFetching ? "불러오는 중…" : "재생성"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openDownloadModal()}
                  disabled={isScorePending}
                  className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/10 px-4 py-2.5 text-[16px] font-semibold text-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] transition-all hover:border-[#3b82f6]/55 hover:bg-[#3b82f6]/18 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Download
                    className="size-4 shrink-0 text-[#60a5fa] transition-colors group-hover:text-blue-200"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>다운로드</span>
                </button>
              </div>
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
                  <span className="text-[#93c5fd]">versionId</span> 쿼리가 모두
                  필요합니다.
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
              <div className="fixed bottom-0 right-0 top-17 z-50 flex items-center justify-center bg-[#05070a]" style={{ left: isSidebarCollapsed ? 72 : 308, transition: "left 0.3s ease" }}>
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="md" />
                  <p className="text-gray-400 text-sm">악보를 불러오는 중…</p>
                </div>
              </div>
            )}

            {stableXmlData && !showScoreLoading && fetchScoreFromApi && (
              <div>
                <MusicPlayer
                  xmlData={stableXmlData}
                  autoPlay={false}
                  onRequestChangeFile={undefined}
                  onControlBar={handleControlBar}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex h-dvh max-h-dvh flex-col items-center justify-center gap-3 bg-[#05070a]">
            <Spinner size="md" />
            <p className="text-gray-400 text-sm">불러오는 중…</p>
          </div>
        }
      >
        <PlayerPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
