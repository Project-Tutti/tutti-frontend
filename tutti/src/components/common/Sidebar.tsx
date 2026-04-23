"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLibraryListInfiniteQuery } from "@api/library/hooks/queries/useLibraryListInfiniteQuery";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { useDeleteProjectMutation } from "@api/project/hooks/mutations/useDeleteProjectMutation";
import { usePatchProjectNameMutation } from "@api/project/hooks/mutations/usePatchProjectNameMutation";
import { useClickOutside } from "@/common/hooks/useClickOutside";
import { toast } from "@/components/common/Toast";
import SidebarAccountFooter from "@/components/common/SidebarAccountFooter";
import SidebarDeleteProjectModal from "@/components/common/SidebarDeleteProjectModal";

import { Spinner } from "@/components/common/Spinner";
import { CirclePlus, Menu, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const projectMenuHostRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasNextPageRef = useRef(false);
  const isFetchingNextPageRef = useRef(false);

  const deleteProjectMutation = useDeleteProjectMutation();
  const patchProjectNameMutation = usePatchProjectNameMutation();
  useGeneratableInstrumentCategoriesQuery();

  const [openMenuProjectId, setOpenMenuProjectId] = useState<number | null>(
    null,
  );
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
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

  const activeProjectId = useMemo(() => {
    // /library/123 형태
    const libMatch = /^\/library\/(\d+)/.exec(pathname);
    if (libMatch) return Number(libMatch[1]);
    // /player?projectId=123 또는 /player/download?projectId=123
    const fromSearch = searchParams.get("projectId");
    if (fromSearch) return Number(fromSearch);
    return null;
  }, [pathname, searchParams]);

  const closeMenus = () => {
    setOpenMenuProjectId(null);
    setMenuPos(null);
  };

  useClickOutside(projectMenuHostRef, openMenuProjectId != null, closeMenus);

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
    setRenamingProjectId(null);
    try {
      await patchProjectNameMutation.mutateAsync({ projectId, name: next });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "이름 변경에 실패했습니다.");
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
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
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
        bg-[#0a0c10] border-r border-[#1e293b] flex flex-col
        sticky top-0 h-dvh max-h-dvh shrink-0
        transition-all duration-300 ease-in-out z-60
        ${isCollapsed ? "w-18" : "w-77"}
      `}
    >
      {/* ── Main content wrapper: overflow-hidden clips during transition ── */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {/* 헤더 (토글/로고) */}
        {isCollapsed ? (
          <div className="flex w-full flex-col items-start">
            <div className="flex min-h-17 w-full items-center px-4">
              <button
                onClick={onToggle}
                className="flex size-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
                aria-label="사이드바 열기"
              >
                <Menu className="size-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-17 min-w-77 shrink-0 items-center px-4">
            <button
              onClick={onToggle}
              className="flex size-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
              aria-label="사이드바 접기"
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* 새 프로젝트: DOM을 하나로 유지해서 토글 시 미세 이동 방지 */}
        <div
          className={
            isCollapsed ? "px-4 pt-2.5 pb-1.5" : "min-w-77 px-4 pt-2.5 pb-1"
          }
        >
          <Link
            href="/home"
            onClick={() => {
              closeMenus();
              setRenamingProjectId(null);
            }}
            className={[
              "group flex items-center rounded-full text-[14px] font-semibold text-gray-200 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60",
              isCollapsed ? "w-10 justify-center" : "w-[268px] gap-2",
            ].join(" ")}
            aria-label="새 프로젝트"
            title="새 프로젝트"
          >
            <span className="flex size-10 shrink-0 items-center justify-center">
              <CirclePlus
                className="size-5 text-gray-400 group-hover:text-[#3b82f6]"
                strokeWidth={1.75}
              />
            </span>
            {!isCollapsed && <span className="truncate">새 프로젝트</span>}
          </Link>
        </div>

        {!isCollapsed && (
          <>
            {/* ✅ 프로젝트 목록 스크롤 영역 */}
            <div
              ref={scrollRef}
              // 계정별 프로젝트 개수에 따라 스크롤바 유무가 달라지면 콘텐츠 폭이 달라져 보일 수 있어
              // 스크롤바 공간을 항상 확보(=항상 스크롤바)해서 폭이 일관되게 보이게 함
              className="grow flex min-h-0 min-w-77 flex-col space-y-4 overflow-y-scroll px-0 pt-1 pb-4"
            >
              <div>
                <div className="space-y-1">
                  {isPending && (
                    <div className="px-9 py-2">
                      <Spinner size="sm" label="불러오는 중…" />
                    </div>
                  )}
                  {isError && (
                    <p className="px-9 py-2 text-[14px] text-red-400/90">
                      목록을 불러오지 못했습니다.
                    </p>
                  )}
                  {!isPending && !isError && projects.length === 0 && (
                    <p className="px-9 py-2 text-[14px] text-gray-500">
                      저장된 프로젝트가 없습니다.
                    </p>
                  )}

                  {projects.map((item) => {
                    const isActive = item.projectId === activeProjectId;
                    return (
                      <div key={item.projectId} className="px-4">
                        <div
                          ref={
                            openMenuProjectId === item.projectId
                              ? projectMenuHostRef
                              : undefined
                          }
                          className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] transition-colors hover:bg-white/5 ${
                            isActive ? "bg-[#ffffff]/10" : "sidebar-item"
                          }`}
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
                              className="w-full bg-transparent outline-none text-[14px] text-gray-100 placeholder:text-gray-600"
                              disabled={patchProjectNameMutation.isPending}
                            />
                          ) : (
                            <Link
                              href={`/library/${item.projectId}?name=${encodeURIComponent(item.name)}`}
                              className={`block min-w-0 flex-1 text-left text-[14px] leading-snug transition-colors truncate ${
                                isActive
                                  ? "font-medium text-white"
                                  : "text-gray-200"
                              }`}
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
                              if (openMenuProjectId === item.projectId) {
                                closeMenus();
                              } else {
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.top, left: rect.left - 144 - 4 });
                                setOpenMenuProjectId(item.projectId);
                              }
                            }}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full p-0 text-gray-400 opacity-100 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            <MoreHorizontal
                              className="size-5"
                              strokeWidth={1.75}
                            />
                          </button>

                          {/* 드롭다운: DOM은 row 안에 두고, 위치만 fixed로 띄워서
                              footer/overflow 영향 없이 렌더 + clickOutside 범위에도 포함 */}
                          {openMenuProjectId === item.projectId && menuPos ? (
                            <div
                              className="fixed z-200 w-36 overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-xl"
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  startRename(item.projectId, item.name);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-gray-200 transition-colors hover:bg-white/5"
                              >
                                <Pencil
                                  className="size-[18px] shrink-0 text-gray-400"
                                  strokeWidth={1.75}
                                />
                                이름 바꾸기
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  confirmDelete(item.projectId, item.name);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-red-400 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2
                                  className="size-[18px] shrink-0"
                                  strokeWidth={1.75}
                                />
                                삭제
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {isFetchingNextPage && (
                    <div className="px-9 py-1.5">
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
          </>
        )}
      </div>

      {/* ── Footer: overflow-hidden 밖에 배치 → 드롭다운이 잘리지 않음 ── */}
      <div className="shrink-0">
        {isCollapsed ? (
          <SidebarAccountFooter variant="icon" />
        ) : (
          <SidebarAccountFooter />
        )}
      </div>

      <SidebarDeleteProjectModal
        isOpen={deleteConfirmProject != null}
        projectName={deleteConfirmProject?.name}
        onClose={() => setDeleteConfirmProject(null)}
        onConfirm={runDelete}
        isPending={deleteProjectMutation.isPending}
      />
    </aside>
  );
};

export default Sidebar;
