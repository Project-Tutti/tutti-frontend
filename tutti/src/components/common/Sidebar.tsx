"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";

import { useLibraryListInfiniteQuery } from "@api/library/hooks/queries/useLibraryListInfiniteQuery";
import { useGeneratableInstrumentCategoriesQuery } from "@api/instruments/hooks/queries/useGeneratableInstrumentCategoriesQuery";
import { useDeleteProjectMutation } from "@api/project/hooks/mutations/useDeleteProjectMutation";
import { usePatchProjectNameMutation } from "@api/project/hooks/mutations/usePatchProjectNameMutation";
import { useLogoutMutation } from "@api/user/hooks/mutations/useLogoutMutation";
import { useDeleteUserMeMutation } from "@api/user/hooks/mutations/useDeleteUserMeMutation";
import { useUser } from "@features/auth/hooks/useAuthStore";

import { Spinner } from "@/components/common/Spinner";
import {
  ChevronUp,
  CirclePlus,
  LayoutPanelLeft,
  LogOut,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
} from "lucide-react";

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
  const logoutMutation = useLogoutMutation();
  const deleteUserMeMutation = useDeleteUserMeMutation();

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] =
    useState(false);

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

      <div
        ref={scrollRef}
        className="grow flex min-h-0 min-w-54 flex-col space-y-4 overflow-y-auto p-2.5"
      >
        <Modal
          isOpen={deleteConfirmProject != null}
          onClose={() => setDeleteConfirmProject(null)}
          title="프로젝트 삭제"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-300">
              정말로{" "}
              <span className="text-white font-semibold">
                {deleteConfirmProject?.name ?? ""}
              </span>
              을(를) 삭제할까요?
            </p>
            <p className="text-[11px] text-gray-500">
              삭제하면 프로젝트의 모든 버전과 파일이 함께 삭제됩니다.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e293b] text-gray-200 hover:bg-[#334155] transition-colors"
                disabled={deleteProjectMutation.isPending}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void runDelete()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </Modal>

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
                className="group relative flex items-center gap-1.5 py-1.5 rounded-lg sidebar-item hover:bg-white/5 transition-colors"
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

      <div className="relative min-w-54 border-t border-[#1e293b] p-2.5">
        {/* 계정 삭제 확인 모달 */}
        <Modal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setIsDeleteAccountModalOpen(false)}
          title="계정 삭제"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-300">정말로 계정을 삭제할까요?</p>
            <p className="text-[11px] text-gray-500">
              삭제하면 모든 프로젝트와 데이터가 영구적으로 삭제되며 복구할 수
              없습니다.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1e293b] text-gray-200 hover:bg-[#334155] transition-colors"
                disabled={deleteUserMeMutation.isPending}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUserMeMutation.mutate(undefined, {
                    onSuccess: () => {
                      setIsDeleteAccountModalOpen(false);
                      setIsDeleteSuccessModalOpen(true);
                    },
                  });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={deleteUserMeMutation.isPending}
              >
                {deleteUserMeMutation.isPending ? "삭제 중…" : "계정 삭제"}
              </button>
            </div>
          </div>
        </Modal>

        {/* 계정 삭제 성공 모달 */}
        <Modal
          isOpen={isDeleteSuccessModalOpen}
          onClose={() => {
            setIsDeleteSuccessModalOpen(false);
            router.push("/login");
          }}
          title="계정 삭제 완료"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-300">
              계정이 성공적으로 삭제되었습니다.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteSuccessModalOpen(false);
                  router.push("/login");
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3b82f6] text-white hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </Modal>

        {/* 사용자 메뉴 드롭다운 (위로 열림) */}
        {isUserMenuOpen && (
          <div
            className="absolute inset-x-2.5 bottom-full z-70 mb-1"
            onMouseLeave={() => setIsUserMenuOpen(false)}
          >
            <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsDeleteAccountModalOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                <UserX className="size-4 shrink-0" strokeWidth={1.75} />
                Delete Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push("/login");
                  logoutMutation.mutate();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* 사용자 프로필 (클릭 시 메뉴 토글) */}
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full border border-white/20 bg-linear-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-[11px] font-medium text-white">
              {user?.name ?? "—"}
            </span>
            <span className="truncate text-[8px] font-bold tracking-tighter text-gray-500">
              {user?.email ?? ""}
            </span>
          </div>
          <ChevronUp
            className={`size-4 shrink-0 text-gray-500 transition-transform ${isUserMenuOpen ? "" : "rotate-180"}`}
            strokeWidth={1.75}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
