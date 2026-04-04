"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useDeleteProjectVersionMutation } from "@api/project/hooks/mutations/useDeleteProjectVersionMutation";
import { usePatchProjectVersionNameMutation } from "@api/project/hooks/mutations/usePatchProjectVersionNameMutation";
import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";
import type { ProjectVersionResponseDto } from "@api/project/types/api.types";

import Header from "@/components/common/Header";
import Modal from "@/components/common/Modal";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";

interface VersionRow {
  id: string;
  displayIndex: number;
  versionName: string;
  versionLabel: string;
  savedAt: string;
  isMaster: boolean;
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
): VersionRow[] {
  if (!versions.length) return [];
  const sorted = [...versions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
  }));
}

const ProjectVersionsScreen = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectIdParam = String(params.projectId ?? "");
  const rawName = searchParams.get("name");
  const fallbackName = rawName
    ? decodeURIComponent(rawName)
    : `프로젝트 ${projectIdParam || "—"}`;

  const { data, isPending, isError } = useProjectQuery(
    projectIdParam || null,
    !!projectIdParam,
  );

  const result = data?.result;
  const projectName = result?.name ?? fallbackName;

  const rows = useMemo(
    () => mapVersionsToRows(projectName, result?.versions ?? []),
    [projectName, result?.versions],
  );

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openMenuVersionId, setOpenMenuVersionId] = useState<string | null>(
    null,
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

  return (
    <div className="min-h-screen flex flex-row overflow-x-hidden bg-[#05070a]">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((v) => !v)}
      />

      <div className="grow flex flex-col min-h-screen min-w-0">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={isSidebarCollapsed}
          title="Library / Versions"
          subtitle="버전을 눌러 해당 프로젝트 작업 화면으로 이동합니다."
        />

        <main className="grow px-4 md:px-6 py-6 md:py-8">
          <div className="max-w-xl mx-auto w-full">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
              <Link
                href="/home"
                className="hover:text-[#3b82f6] transition-colors"
              >
                LIBRARY
              </Link>
              <span className="text-gray-600">{" > "}</span>
              <span className="text-gray-400 truncate">
                {projectName.toUpperCase()}
              </span>
            </p>

            <h1 className="text-xl md:text-2xl font-bold text-[#f8fafc] tracking-tight mb-1">
              {projectName}
            </h1>
            {result?.originalFileName && (
              <p className="text-[11px] text-gray-600 mb-1 truncate">
                원본 파일: {result.originalFileName}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-6">
              버전 행을 클릭하면 해당 버전으로 이동합니다.
            </p>

            {isPending && (
              <div className="flex justify-center py-12">
                <Spinner size="md" label="불러오는 중…" />
              </div>
            )}
            {isError && (
              <p className="text-xs text-red-400/90 py-8">
                프로젝트를 불러오지 못했습니다.
              </p>
            )}
            {!isPending && !isError && rows.length === 0 && (
              <p className="text-xs text-gray-500 py-8">버전이 없습니다.</p>
            )}

            {!isPending && !isError && rows.length > 0 && (
              <ul className="space-y-1.5" aria-label="프로젝트 버전 목록">
                {rows.map((v) => {
                  const href = `/player?projectId=${encodeURIComponent(projectIdParam)}&versionId=${encodeURIComponent(v.id)}`;
                  const isRenaming = renamingVersionId === v.id;
                  const isMenuOpen = openMenuVersionId === v.id;
                  return (
                    <li key={v.id}>
                      <Link
                        href={href}
                        className={[
                          "group flex w-full min-w-0 items-start gap-3 px-3 py-2.5 rounded-lg text-left border transition-colors",
                          "outline-none",
                          "hover:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-[#3b82f6]/50 focus-visible:ring-inset",
                          v.isMaster
                            ? "bg-[#0f1218] border-[#1e293b]"
                            : "border-transparent",
                        ].join(" ")}
                        onClick={() => {
                          // 다른 메뉴/인풋 상태 정리 (네비게이션은 그대로)
                          setOpenMenuVersionId(null);
                          setRenamingVersionId(null);
                        }}
                      >
                        <span
                          className={[
                            "text-sm tabular-nums w-7 shrink-0 pt-0.5",
                            v.isMaster ? "text-[#3b82f6]" : "text-gray-500",
                          ].join(" ")}
                        >
                          {String(v.displayIndex).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1 pr-2">
                          {!isRenaming ? (
                            <div className="text-[13px] text-gray-200 group-hover:text-white leading-snug truncate transition-colors">
                              {v.versionLabel}
                            </div>
                          ) : (
                            <div className="flex min-w-0 items-center gap-1 text-[13px] leading-snug">
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
                                      alert(
                                        e instanceof Error
                                          ? e.message
                                          : "버전 이름 변경에 실패했습니다.",
                                      );
                                    }
                                  })();
                                }}
                                autoFocus
                                className={[
                                  "min-w-0 flex-1 bg-black/30 border border-[#1e293b] rounded-md px-2 py-1",
                                  "text-[13px] text-gray-100 outline-none",
                                  "focus:ring-1 focus:ring-[#3b82f6]/60 focus:border-[#3b82f6]/60",
                                ].join(" ")}
                                aria-label="버전 이름 변경"
                              />
                            </div>
                          )}
                          {v.isMaster && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-[#3b82f6]">
                              최신 버전
                            </span>
                          )}
                        </div>

                        <div className="relative flex items-start gap-2 shrink-0 pt-0.5">
                          <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                            {v.savedAt}
                          </span>

                          <button
                            type="button"
                            className={[
                              "ml-1 rounded-md p-1.5",
                              "text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors",
                              "focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60 outline-none",
                            ].join(" ")}
                            aria-label="버전 메뉴 열기"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuVersionId((prev) =>
                                prev === v.id ? null : v.id,
                              );
                              setRenamingVersionId(null);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px] leading-none">
                              more_vert
                            </span>
                          </button>

                          {isMenuOpen && (
                            <div
                              className={[
                                "absolute right-0 top-7 z-[200] w-44 overflow-hidden",
                                "rounded-lg border border-[#1e293b] bg-[#0f1218] shadow-xl",
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
                                  "hover:bg-white/[0.06] transition-colors",
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
                                  "text-red-300 hover:bg-white/[0.06]",
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
        <p className="text-sm text-gray-200 mb-2">
          정말 이 버전을 삭제할까요?
        </p>
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
                  alert(
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
