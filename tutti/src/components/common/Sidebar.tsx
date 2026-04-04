"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";

import { useLibraryListInfiniteQuery } from "@api/library/hooks/queries/useLibraryListInfiniteQuery";
import { useDeleteProjectMutation } from "@api/project/hooks/mutations/useDeleteProjectMutation";
import { usePatchProjectNameMutation } from "@api/project/hooks/mutations/usePatchProjectNameMutation";
import { useUser } from "@features/auth/hooks/useAuthStore";

import { Spinner } from "@/components/common/Spinner";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasNextPageRef = useRef(false);
  const isFetchingNextPageRef = useRef(false);

  const deleteProjectMutation = useDeleteProjectMutation();
  const patchProjectNameMutation = usePatchProjectNameMutation();

  const [openMenuProjectId, setOpenMenuProjectId] = useState<number | null>(
    null,
  );
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(
    null,
  );
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<{
    projectId: number;
    name: string;
  } | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useLibraryListInfiniteQuery();

  useEffect(() => {
    hasNextPageRef.current = !!hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = !!isFetchingNextPage;
  }, [isFetchingNextPage]);

  const projects = useMemo(() => {
    const rows = data?.pages.flatMap((p) => p.result?.projects ?? []) ?? [];
    const byId = new Map<number, (typeof rows)[number]>();
    for (const item of rows) {
      if (!byId.has(item.projectId)) {
        byId.set(item.projectId, item);
      }
    }
    return Array.from(byId.values());
  }, [data?.pages]);

  const closeMenus = () => {
    setOpenMenuProjectId(null);
  };

  const startRename = (projectId: number, name: string) => {
    setRenamingProjectId(projectId);
    setRenameDraft(name);
    closeMenus();
  };

  const submitRename = async (projectId: number, originalName: string) => {
    const next = renameDraft.trim();
    if (!next) return;
    if (next === originalName) {
      setRenamingProjectId(null);
      return;
    }
    // 낙관적 업데이트가 있으니 즉시 인풋 종료
    setRenamingProjectId(null);
    try {
      await patchProjectNameMutation.mutateAsync({ projectId, name: next });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "이름 변경에 실패했습니다.");
    }
  };

  const confirmDelete = (projectId: number, name: string) => {
    setDeleteConfirmProject({ projectId, name });
    closeMenus();
  };

  const runDelete = async () => {
    if (!deleteConfirmProject) return;
    const { projectId } = deleteConfirmProject;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      setDeleteConfirmProject(null);

      if (pathname.startsWith(`/library/${projectId}`)) {
        router.push("/home");
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    if (isCollapsed) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry?.isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "80px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isCollapsed, fetchNextPage]);

  return (
    <aside
      className={`
        bg-[#0a0c10] border-r border-[#1e293b] flex flex-col h-screen sticky top-0 
        transition-all duration-300 ease-in-out z-60
        ${isCollapsed ? "w-0 border-r-0" : "w-60"}
      `}
      style={{ overflow: isCollapsed ? "hidden" : "visible" }}
    >
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between min-w-[240px]">
        <Link
          href="/home"
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60 rounded-lg"
          aria-label="홈으로 이동"
          onClick={() => {
            closeMenus();
            setRenamingProjectId(null);
          }}
        >
          <div className="bg-[#3b82f6] p-1 rounded-lg">
            <span className="material-symbols-outlined text-white text-lg">
              graphic_eq
            </span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Harmonix
          </span>
        </Link>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg">
            side_navigation
          </span>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="grow flex flex-col p-3 space-y-5 overflow-y-auto min-w-[240px] min-h-0"
      >
        <Modal
          isOpen={deleteConfirmProject != null}
          onClose={() => setDeleteConfirmProject(null)}
          title="프로젝트 삭제"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              정말로{" "}
              <span className="text-white font-semibold">
                {deleteConfirmProject?.name ?? ""}
              </span>
              을(를) 삭제할까요?
            </p>
            <p className="text-xs text-gray-500">
              삭제하면 프로젝트의 모든 버전과 파일이 함께 삭제됩니다.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1e293b] text-gray-200 hover:bg-[#334155] transition-colors"
                disabled={deleteProjectMutation.isPending}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void runDelete()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </Modal>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              프로젝트 히스토리
            </h2>
            <Link
              href="/home"
              className="text-gray-500 hover:text-[#3b82f6] transition-colors"
              aria-label="새 프로젝트"
            >
              <span className="material-symbols-outlined text-base">
                add_circle
              </span>
            </Link>
          </div>

          {isPending && (
            <div className="px-2 py-2">
              <Spinner size="sm" label="불러오는 중…" />
            </div>
          )}
          {isError && (
            <p className="text-[11px] text-red-400/90 px-2 py-2">
              목록을 불러오지 못했습니다.
            </p>
          )}
          {!isPending && !isError && projects.length === 0 && (
            <p className="text-[11px] text-gray-500 px-2 py-2">
              저장된 프로젝트가 없습니다.
            </p>
          )}

          <div className="space-y-0.5">
            {projects.map((item) => (
              <div
                key={item.projectId}
                className="group relative flex items-center gap-2 px-2 py-2 rounded-lg sidebar-item hover:bg-white/5 transition-colors"
                onMouseLeave={() => {
                  if (openMenuProjectId === item.projectId) closeMenus();
                }}
              >
                {renamingProjectId === item.projectId ? (
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setRenamingProjectId(null);
                      }
                      if (e.key === "Enter") {
                        void submitRename(item.projectId, item.name);
                      }
                    }}
                    onBlur={() => setRenamingProjectId(null)}
                    className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-2 py-1 text-[13px] text-gray-100 focus:outline-none focus:border-[#3b82f6]"
                    disabled={patchProjectNameMutation.isPending}
                  />
                ) : (
                  <Link
                    href={`/library/${item.projectId}?name=${encodeURIComponent(item.name)}`}
                    className="block min-w-0 flex-1 text-left text-[13px] leading-snug text-gray-300 hover:text-white transition-colors truncate"
                  >
                    {item.name}
                  </Link>
                )}

                <button
                  type="button"
                  aria-label="프로젝트 메뉴"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMenuProjectId((prev) =>
                      prev === item.projectId ? null : item.projectId,
                    );
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                >
                  <span className="material-symbols-outlined text-lg">
                    more_horiz
                  </span>
                </button>

                {openMenuProjectId === item.projectId && (
                  <div className="absolute right-2 top-9 z-[70] w-40 rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startRename(item.projectId, item.name);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                      이름 바꾸기
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        confirmDelete(item.projectId, item.name);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="px-2 py-1.5">
                <Spinner size="xs" label="더 불러오는 중…" />
              </div>
            )}
            <div
              ref={sentinelRef}
              className="h-1 w-full shrink-0"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-[#1e293b] space-y-0.5 min-w-[240px]">
        <a
          href="#"
          className="sidebar-item flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-base">help</span>
          <span>Help &amp; Support</span>
        </a>
        <a
          href="#"
          className="sidebar-item flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-base">settings</span>
          <span>Settings</span>
        </a>

        <div className="mt-3 flex items-center gap-2 px-2 py-1.5 min-w-0">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full border border-white/20 object-cover shrink-0"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 border border-white/20 shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white truncate">
              {user?.name ?? "—"}
            </span>
            <span className="text-[9px] text-gray-500 font-bold tracking-tighter truncate">
              {user?.email ?? ""}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
