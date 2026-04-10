"use client";

import { useState } from "react";

import {
  PROJECT_DOWNLOAD_TYPE,
  type ProjectDownloadType,
} from "@api/project/constants/api-end-point.constants";
import { useProjectDownloadMutation } from "@api/project/hooks/mutations/useProjectDownloadMutation";

type DownloadFormatModalProps = {
  projectId: string;
  versionId: string;
  onClose: () => void;
};

const OPTIONS: {
  type: ProjectDownloadType;
  label: string;
  sub: string;
  icon: string;
}[] = [
  {
    type: PROJECT_DOWNLOAD_TYPE.MIDI,
    label: "MIDI 다운로드",
    sub: "원본 MIDI 파일 (.mid)",
    icon: "piano",
  },
  {
    type: PROJECT_DOWNLOAD_TYPE.XML,
    label: "MusicXML 다운로드",
    sub: "악보 데이터 (MusicXML .xml)",
    icon: "code",
  },
  {
    type: PROJECT_DOWNLOAD_TYPE.PDF,
    label: "PDF 다운로드",
    sub: "악보 PDF 파일 (.pdf)",
    icon: "picture_as_pdf",
  },
];

export default function DownloadFormatModal({
  projectId,
  versionId,
  onClose,
}: DownloadFormatModalProps) {
  const [pendingType, setPendingType] = useState<ProjectDownloadType | null>(
    null,
  );

  const downloadMutation = useProjectDownloadMutation();

  const handlePick = async (type: ProjectDownloadType) => {
    setPendingType(type);
    try {
      const url = await downloadMutation.mutateAsync({
        projectId,
        versionId,
        type,
      });
      const ext =
        type === PROJECT_DOWNLOAD_TYPE.MIDI
          ? "mid"
          : type === PROJECT_DOWNLOAD_TYPE.XML
            ? "xml"
            : "pdf";
      const filename = `project-${projectId}-v${versionId}.${ext}`;

      // Supabase Storage signed URL에 download 파라미터를 주면 attachment로 내려줍니다.
      const forced = new URL(url);
      forced.searchParams.set("download", filename);

      // 1) fetch → blob → objectURL 로 "페이지 이동 없이" 다운로드 (CORS 막히면 fallback)
      try {
        const res = await fetch(forced.toString(), { credentials: "omit" });
        if (!res.ok) throw new Error(`download fetch failed: ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // 브라우저가 다운로드를 시작하기 전에 revoke 하면 Safari/Firefox 등에서 실패할 수 있음
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      } catch {
        // 2) fallback: direct link click
        const a = document.createElement("a");
        a.href = forced.toString();
        a.rel = "noopener noreferrer";
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "다운로드에 실패했습니다.");
    } finally {
      setPendingType(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#05070a]/80 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative z-[10000] w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f1218] text-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55),0_0_48px_-14px_rgba(59,130,246,0.16)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-format-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-gray-500 transition-colors hover:bg-[#1e293b] hover:text-[#3b82f6]"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="px-6 pb-8 pt-9 text-center sm:px-8">
          <h2
            id="download-format-title"
            className="text-base font-semibold tracking-tight text-white"
          >
            다운로드 파일 <span className="text-[#93c5fd]/95">형식 선택</span>
            하기
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            다운로드하고자 하시는 파일의 형식을{" "}
            <span className="text-[#60a5fa]/80">선택</span>해 주세요.
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                disabled={pendingType != null}
                onClick={() => void handlePick(opt.type)}
                className="group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0a0c10] px-5 py-6 transition-all duration-200 hover:border-[#3b82f6]/55 hover:bg-[#3b82f6]/[0.07] hover:shadow-[0_0_20px_-6px_rgba(59,130,246,0.35)] disabled:pointer-events-none disabled:opacity-50"
              >
                <span
                  className="material-symbols-outlined text-4xl text-gray-400 transition-colors group-hover:text-[#3b82f6]"
                  aria-hidden
                >
                  {opt.icon}
                </span>
                <span className="text-sm font-semibold text-gray-200 transition-colors group-hover:text-white">
                  {pendingType === opt.type ? "준비 중…" : opt.label}
                </span>
                <span className="text-[11px] text-gray-600 transition-colors group-hover:text-[#93c5fd]/85">
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
