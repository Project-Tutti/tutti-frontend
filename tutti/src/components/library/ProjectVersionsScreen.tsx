"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LogoLink } from "@/components/common/LogoLink";
import { useMemo, useRef, useState } from "react";

import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";
import { getProjectTracks } from "@api/project/apis/get/get-project-tracks";
import type { ProjectVersionResponseDto } from "@api/project/types/api.types";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";

import { useClickOutside } from "@/common/hooks/useClickOutside";
import Modal from "@/components/common/Modal";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";
import { toast } from "@/components/common/Toast";
import { useMidiStore } from "@features/midi-create/stores/midi-store";
import { MoreVertical, RefreshCw } from "lucide-react";

import { useDeleteProjectVersionMutation } from "@api/project/hooks/mutations/useDeleteProjectVersionMutation";
import { usePatchProjectVersionNameMutation } from "@api/project/hooks/mutations/usePatchProjectVersionNameMutation";

interface VersionRow {
  id: string;
  displayIndex: number;
  versionName: string;
  versionLabel: string;
  savedAt: string;
  isMaster: boolean;
  genre: string;
  instrumentName: string;
}

function formatVersionTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function mapVersionsToRows(
  projectName: string,
  versions: ProjectVersionResponseDto[],
  instrumentNameMap: Map<number, string>,
): VersionRow[] {
  if (!versions.length) return [];
  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const masterId = sorted[0]?.versionId;
  const n = sorted.length;
  return sorted.map((v, i) => ({
    id: String(v.versionId),
    displayIndex: n - i,
    versionName: v.name,
    versionLabel: `${projectName} - ${v.name}`,
    savedAt: formatVersionTime(v.createdAt),
    isMaster: v.versionId === masterId,
    genre: v.genre,
    instrumentName: instrumentNameMap.get(v.instrumentId) ?? "알 수 없는 악기",
  }));
}

const ProjectVersionsScreen = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdParam = String(params.projectId ?? "");
  const rawName = searchParams.get("name");
  const fallbackName = rawName
    ? decodeURIComponent(rawName)
    : `프로젝트 ${projectIdParam || "—"}`;

  const { data, isPending, isError } = useProjectQuery(
    projectIdParam || null,
    !!projectIdParam,
  );
  const { data: instrumentCategories } = useGeneratableInstrumentCategoriesQuery();

  const result = data?.result;
  const projectName = result?.name ?? fallbackName;

  const instrumentNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const category of instrumentCategories ?? []) {
      for (const inst of category.instruments ?? []) {
        map.set(inst.midiProgram, inst.name);
      }
    }
    return map;
  }, [instrumentCategories]);

  const rows = useMemo(
    () => mapVersionsToRows(projectName, result?.versions ?? [], instrumentNameMap),
    [projectName, result?.versions, instrumentNameMap],
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { setTracks, setUploadedFile } = useMidiStore();

  const [openMenuVersionId, setOpenMenuVersionId] = useState<string | null>(
    null,
  );
  const versionMenuHostRef = useRef<HTMLLIElement>(null);

  useClickOutside(versionMenuHostRef, openMenuVersionId != null, () =>
    setOpenMenuVersionId(null),
  );

  const [renamingVersionId, setRenamingVersionId] = useState<string | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{
    versionId: string;
    versionLabel: string;
  } | null>(null);

  const patchVersionNameMutation = usePatchProjectVersionNameMutation();
  const deleteVersionMutation = useDeleteProjectVersionMutation();

  const [regeneratingVersionId, setRegeneratingVersionId] = useState<
    string | null
  >(null);

  const handleRegenerateFromLibrary = async (versionId: string) => {
    if (!projectIdParam) return;
    const versionMeta = result?.versions?.find(
      (v) => String(v.versionId) === String(versionId),
    );
    if (!versionMeta) {
      toast.error("선택한 버전을 찾을 수 없습니다.");
      return;
    }

    setRegeneratingVersionId(versionId);
    try {
      const res = await getProjectTracks(projectIdParam);
      if (!res.isSuccess || !res.result?.tracks?.length) {
        throw new Error(res.message ?? "트랙 정보를 불러오지 못했습니다.");
      }

      setUploadedFile(null);
      setTracks(
        res.result.tracks.map((t) => ({
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
        `/before-create?mode=regenerate&projectId=${encodeURIComponent(projectIdParam)}&versionId=${encodeURIComponent(versionId)}`,
      );
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "재생성 준비에 실패했습니다.",
      );
    } finally {
      setRegeneratingVersionId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-row overflow-x-hidden bg-[#05070a]">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((v) => !v)}
      />

      <div className="grow flex flex-col min-h-0 min-w-0">
        <div className="flex min-h-17 shrink-0 items-center px-3 md:px-5">
          <LogoLink />
        </div>
        <main className="grow flex flex-col items-center px-4 md:px-6 pt-17 pb-8">
          <div className="w-full max-w-xl">
            <p className="text-[14px] font-medium text-gray-500">
              저장된 프로젝트의 버전 목록입니다.
            </p>

            <h1 className="mb-1 text-[30px] font-bold tracking-tight text-foreground break-all">
              {projectName}
            </h1>
            {result?.originalFileName && (
              <p className="text-[14px] text-gray-600 mb-1 truncate">
                원본 파일: {result.originalFileName}
              </p>
            )}
            <p className="text-[13px] text-gray-500 mb-6">
              버전 행을 클릭하면 해당 버전으로 이동합니다.
            </p>

            {isPending && (
              <div className="flex justify-center py-12">
                <Spinner size="md" label="불러오는 중…" />
              </div>
            )}
            {isError && (
              <p className="text-[14px] text-red-400/90 py-8">
                프로젝트를 불러오지 못했습니다.
              </p>
            )}
            {!isPending && !isError && rows.length === 0 && (
              <p className="text-[14px] text-gray-500 py-8">버전이 없습니다.</p>
            )}

            {!isPending && !isError && rows.length > 0 && (
              <ul className="space-y-1.5" aria-label="프로젝트 버전 목록">
                {rows.map((v) => {
                  const href = `/player?projectId=${encodeURIComponent(projectIdParam)}&versionId=${encodeURIComponent(v.id)}`;
                  const isRenaming = renamingVersionId === v.id;
                  const isMenuOpen = openMenuVersionId === v.id;
                  return (
                    <li
                      key={v.id}
                      ref={
                        openMenuVersionId === v.id
                          ? versionMenuHostRef
                          : undefined
                      }
                      className="group relative flex items-center"
                    >
                      <Link
                        href={href}
                        className={[
                          "flex min-w-0 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          "outline-none hover:bg-white/5 focus-visible:bg-white/6",
                          v.isMaster
                            ? "border-[#2d4a6a] bg-[#0f1218]"
                            : "border-transparent hover:border-[#2d4a6a]/70",
                        ].join(" ")}
                        onClick={() => {
                          // 다른 메뉴/인풋 상태 정리 (네비게이션은 그대로)
                          setOpenMenuVersionId(null);
                          setRenamingVersionId(null);
                        }}
                      >
                        <span
                          className={[
                            "text-[16px] tabular-nums w-7 shrink-0 pt-0.5",
                            v.isMaster ? "text-[#3b82f6]" : "text-gray-500",
                          ].join(" ")}
                        >
                          {String(v.displayIndex).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1 pr-2">
                          {!isRenaming ? (
                            <>
                              <div className="text-[16px] text-gray-200 group-hover:text-white leading-snug truncate transition-colors">
                                {v.versionLabel}
                              </div>
                              <p className="mt-0.5 text-[12px] text-gray-500 truncate">
                                {v.genre} · {v.instrumentName}
                              </p>
                            </>
                          ) : (
                            <div className="flex min-w-0 items-center gap-1 text-[14px] leading-snug">
                              <span className="text-gray-400 shrink-0">
                                {projectName} -
                              </span>
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setRenamingVersionId(null);
                                    setOpenMenuVersionId(null);
                                    return;
                                  }
                                  if (e.key !== "Enter") return;

                                  e.preventDefault();
                                  e.stopPropagation();

                                  const next = renameValue.trim();
                                  if (!next) {
                                    setRenamingVersionId(null);
                                    setOpenMenuVersionId(null);
                                    return;
                                  }

                                  // 입력은 즉시 닫고(UX), mutation은 비동기로 처리
                                  setRenamingVersionId(null);
                                  setOpenMenuVersionId(null);
                                  void (async () => {
                                    try {
                                      await patchVersionNameMutation.mutateAsync(
                                        {
                                          projectId: projectIdParam,
                                          versionId: v.id,
                                          name: next,
                                        },
                                      );
                                    } catch (e) {
                                      console.error(e);
                                      toast.error(
                                        e instanceof Error
                                          ? e.message
                                          : "버전 이름 변경에 실패했습니다.",
                                      );
                                    }
                                  })();
                                }}
                                autoFocus
                                className={[
                                  "min-w-0 flex-1 bg-black/30 border border-[#2d4a6a] rounded-md px-2 py-1",
                                  "text-[14px] text-gray-100 outline-none",
                                  "focus:ring-1 focus:ring-[#3b82f6]/60 focus:border-[#3b82f6]/60",
                                ].join(" ")}
                                aria-label="버전 이름 변경"
                              />
                            </div>
                          )}
                          {v.isMaster && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#3b82f6]">
                              최신 버전
                            </span>
                          )}
                        </div>

                        <div className="relative flex shrink-0 items-center gap-2">
                          <span className="whitespace-nowrap text-[12px] tabular-nums text-gray-500">
                            {v.savedAt}
                          </span>

                          <button
                            type="button"
                            className={[
                              "ml-0.5 grid size-8 shrink-0 place-items-center rounded-md text-gray-500 transition-colors",
                              "outline-none hover:bg-white/8 hover:text-gray-200",
                              "focus-visible:bg-white/10 focus-visible:text-gray-100",
                              isMenuOpen ? "bg-white/10 text-gray-200" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            aria-label="버전 메뉴 열기"
                            aria-expanded={isMenuOpen}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuVersionId((prev) =>
                                prev === v.id ? null : v.id,
                              );
                              setRenamingVersionId(null);
                            }}
                          >
                            <MoreVertical
                              className="size-[18px]"
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          </button>

                          {isMenuOpen && (
                            <div
                              className={[
                                "absolute right-0 top-full z-200 mt-1 w-44 overflow-hidden",
                                "rounded-lg border border-[#2d4a6a] bg-[#0f1218] shadow-xl",
                              ].join(" ")}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              role="menu"
                              aria-label="버전 작업 메뉴"
                            >
                              <button
                                type="button"
                                className={[
                                  "w-full text-left px-3 py-2 text-[12px] text-gray-200",
                                  "hover:bg-white/6 transition-colors",
                                ].join(" ")}
                                role="menuitem"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setRenamingVersionId(v.id);
                                  setRenameValue(v.versionName);
                                }}
                              >
                                버전 이름 변경
                              </button>

                              <button
                                type="button"
                                className={[
                                  "w-full text-left px-3 py-2 text-[12px] transition-colors",
                                  "text-red-300 hover:bg-white/6",
                                ].join(" ")}
                                role="menuitem"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuVersionId(null);
                                  setRenamingVersionId(null);
                                  setDeleteTarget({
                                    versionId: v.id,
                                    versionLabel: v.versionLabel,
                                  });
                                }}
                              >
                                버전 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* hover bridge: li 우측 끝과 버튼 사이 갭을 hover 영역에 포함시켜 버튼 사라짐 방지 */}
                      <div className="absolute left-full top-0 bottom-0 hidden sm:flex items-center">
                        <button
                          type="button"
                          className={[
                            "ml-3 inline-flex w-[88px] items-center justify-center gap-1.5",
                            "h-9 rounded-xl border px-3.5 text-[14px] font-semibold tabular-nums",
                            "border-[#3b82f6]/35 bg-[#0b1220] text-blue-100 shadow-sm",
                            "opacity-0 pointer-events-none transition-all duration-150",
                            "group-hover:opacity-100 group-hover:pointer-events-auto",
                            "hover:border-[#3b82f6]/55 hover:bg-[#0e172a] active:scale-[0.98]",
                            regeneratingVersionId === v.id
                              ? "opacity-60 pointer-events-none"
                              : "",
                          ].join(" ")}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleRegenerateFromLibrary(v.id);
                          }}
                          aria-label="재생성"
                        >
                          <RefreshCw
                            className="size-4"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="whitespace-nowrap">
                            {regeneratingVersionId === v.id
                              ? "준비 중…"
                              : "재생성"}
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="버전 삭제"
      >
        <p className="text-sm text-gray-200 mb-2">정말 이 버전을 삭제할까요?</p>
        <p className="text-xs text-gray-500 mb-6 truncate">
          {deleteTarget?.versionLabel}
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-3 py-2 rounded-lg text-sm text-gray-200 bg-white/5 hover:bg-white/10 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            disabled={deleteVersionMutation.isPending}
            onClick={() => {
              void (async () => {
                if (!deleteTarget) return;
                const targetVersionId = deleteTarget.versionId;
                try {
                  await deleteVersionMutation.mutateAsync({
                    projectId: projectIdParam,
                    versionId: targetVersionId,
                  });
                  setDeleteTarget(null);
                } catch (e) {
                  console.error(e);
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "버전 삭제에 실패했습니다.",
                  );
                }
              })();
            }}
            className={[
              "px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
              deleteVersionMutation.isPending
                ? "bg-red-500/30 text-red-200 cursor-not-allowed"
                : "bg-red-500/20 text-red-200 hover:bg-red-500/30",
            ].join(" ")}
          >
            삭제
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectVersionsScreen;
