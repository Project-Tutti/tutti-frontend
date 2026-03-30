"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useProjectQuery } from "@api/project/hooks/queries/useProjectQuery";
import type { ProjectVersionResponseDto } from "@api/project/types/api.types";

import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import { Spinner } from "@/components/common/Spinner";

interface VersionRow {
  id: string;
  displayIndex: number;
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
            {isError && !isPending && (
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
                          <div className="text-[13px] text-gray-200 group-hover:text-white leading-snug truncate transition-colors">
                            {v.versionLabel}
                          </div>
                          {v.isMaster && (
                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-[#3b82f6]">
                              최신 버전
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap shrink-0 pt-0.5">
                          {v.savedAt}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectVersionsScreen;
