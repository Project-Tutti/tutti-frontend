"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLibraryListInfiniteQuery } from "@api/library/hooks/queries/useLibraryListInfiniteQuery";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { useDeleteProjectMutation } from "@api/project/hooks/mutations/useDeleteProjectMutation";
import { usePatchProjectNameMutation } from "@api/project/hooks/mutations/usePatchProjectNameMutation";
import { useClickOutside } from "@/common/hooks/useClickOutside";
import { toast } from "@/components/common/Toast";
import SidebarAccountFooter from "@/components/common/SidebarAccountFooter";
import SidebarDeleteProjectModal from "@/components/common/SidebarDeleteProjectModal";

import { Spinner } from "@/components/common/Spinner";
import {
  CirclePlus,
  LayoutPanelLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
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
    // 낙관적 업데이트가 있으니 즉시 인풋 종료
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
        ${isCollapsed ? "w-0 border-r-0" : "w-54"}
      `}
      style={{ overflow: isCollapsed ? "hidden" : "visible" }}
    >
      <div className="flex min-h-16 min-w-54 shrink-0 items-center justify-between border-b border-[#1e293b] px-2.5 py-2">
        <Link
          href="/home"
          className="flex items-center justify-start focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60 rounded-lg"
          aria-label="홈으로 이동"
          onClick={() => {
            closeMenus();
            setRenamingProjectId(null);
          }}
        >
          <div className="relative h-9 w-[100px] ml-1">
            <Image
              src="/logo.svg"
              alt="tutti"
              fill
              sizes="100px"
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <LayoutPanelLeft className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <SidebarDeleteProjectModal
        isOpen={deleteConfirmProject != null}
        projectName={deleteConfirmProject?.name}
        onClose={() => setDeleteConfirmProject(null)}
        onConfirm={runDelete}
        isPending={deleteProjectMutation.isPending}
      />

      <div
        ref={scrollRef}
        className="grow flex min-h-0 min-w-54 flex-col space-y-4 overflow-y-auto p-2.5"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              프로젝트 히스토리
            </h2>
            <Link
              href="/home"
              className="text-gray-500 hover:text-[#3b82f6] transition-colors"
              aria-label="새 프로젝트"
            >
              <CirclePlus className="size-4" strokeWidth={1.75} />
            </Link>
          </div>

          {isPending && (
            <div className="py-2">
              <Spinner size="sm" label="불러오는 중…" />
            </div>
          )}
          {isError && (
            <p className="py-2 text-[11px] text-red-400/90">
              목록을 불러오지 못했습니다.
            </p>
          )}
          {!isPending && !isError && projects.length === 0 && (
            <p className="py-2 text-[11px] text-gray-500">
              저장된 프로젝트가 없습니다.
            </p>
          )}

          <div className="space-y-0.5">
            {projects.map((item) => (
              <div
                key={item.projectId}
                ref={
                  openMenuProjectId === item.projectId
                    ? projectMenuHostRef
                    : undefined
                }
                className="group relative flex items-center gap-1.5 py-1.5 rounded-lg sidebar-item hover:bg-white/5 transition-colors"
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
                    className="w-full bg-[#05070a] border border-[#1e293b] rounded-md px-1.5 py-0.5 text-[11px] text-gray-100 focus:outline-none focus:border-[#3b82f6]"
                    disabled={patchProjectNameMutation.isPending}
                  />
                ) : (
                  <Link
                    href={`/library/${item.projectId}?name=${encodeURIComponent(item.name)}`}
                    className="block min-w-0 flex-1 text-left text-[11px] leading-snug text-gray-300 hover:text-white transition-colors truncate"
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
                  className="flex size-7 shrink-0 items-center justify-center rounded-md p-0 text-gray-500 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-5" strokeWidth={1.75} />
                </button>

                {openMenuProjectId === item.projectId && (
                  <div className="absolute inset-x-0 top-full z-70 pt-1">
                    <div className="flex justify-end px-2">
                      <div className="w-36 overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-xl">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startRename(item.projectId, item.name);
                          }}
                          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5"
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
                          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <Trash2
                            className="size-[18px] shrink-0"
                            strokeWidth={1.75}
                          />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="py-1.5">
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

      <SidebarAccountFooter />
    </aside>
  );
};

export default Sidebar;
