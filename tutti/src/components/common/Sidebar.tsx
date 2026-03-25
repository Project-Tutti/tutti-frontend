'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';

import { useLibraryListInfiniteQuery } from '@api/library/hooks/queries/useLibraryListInfiniteQuery';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useLibraryListInfiniteQuery();

  const projects = useMemo(() => {
    const rows =
      data?.pages.flatMap((p) => p.result?.projects ?? []) ?? [];
    const byId = new Map<number, (typeof rows)[number]>();
    for (const item of rows) {
      if (!byId.has(item.projectId)) {
        byId.set(item.projectId, item);
      }
    }
    return Array.from(byId.values());
  }, [data?.pages]);

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
          hasNextPage &&
          !isFetchingNextPage
        ) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: '80px', threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isCollapsed, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <aside
      className={`
        bg-[#0a0c10] border-r border-[#1e293b] flex flex-col h-screen sticky top-0 
        transition-all duration-300 ease-in-out z-60
        ${isCollapsed ? 'w-0 border-r-0' : 'w-60'}
      `}
      style={{ overflow: isCollapsed ? 'hidden' : 'visible' }}
    >
      <div className="p-3 border-b border-[#1e293b] flex items-center justify-between min-w-[240px]">
        <div className="flex items-center gap-2">
          <div className="bg-[#3b82f6] p-1 rounded-lg">
            <span className="material-symbols-outlined text-white text-lg">graphic_eq</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">Harmonix</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-lg">side_navigation</span>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="grow flex flex-col p-3 space-y-5 overflow-y-auto min-w-[240px] min-h-0"
      >
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
              <span className="material-symbols-outlined text-base">add_circle</span>
            </Link>
          </div>

          {isPending && (
            <p className="text-[11px] text-gray-500 px-2 py-2">불러오는 중…</p>
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
              <Link
                key={item.projectId}
                href={`/home?projectId=${item.projectId}`}
                className="sidebar-item block w-full text-left px-2 py-2 rounded-lg text-[13px] leading-snug text-gray-300 hover:text-white hover:bg-white/5 transition-colors truncate"
              >
                {item.name}
              </Link>
            ))}
            <div ref={sentinelRef} className="h-1 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <p className="text-[10px] text-gray-500 px-2 py-1.5">더 불러오는 중…</p>
            )}
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

        <div className="mt-3 flex items-center gap-2 px-2 py-1.5">
          <div className="h-7 w-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 border border-white/20"></div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Alex Mercer</span>
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">
              Pro Plan
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
