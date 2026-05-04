"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/common/Modal";

type SidebarRenameProjectModalProps = {
  isOpen: boolean;
  projectName: string | undefined;
  onClose: () => void;
  onConfirm: (name: string) => void;
  isPending: boolean;
};

export default function SidebarRenameProjectModal({
  isOpen,
  projectName,
  onClose,
  onConfirm,
  isPending,
}: SidebarRenameProjectModalProps) {
  const [draft, setDraft] = useState(projectName ?? "");

  useEffect(() => {
    if (isOpen) setDraft(projectName ?? "");
  }, [isOpen, projectName]);

  const handleConfirm = () => {
    const next = draft.trim();
    if (!next || next === projectName) {
      onClose();
      return;
    }
    onConfirm(next);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="이름 바꾸기"
      panelClassName="min-w-3xl"
      headerClassName="[&_h2]:text-[16px] [&_h2]:font-semibold"
      contentClassName="px-6 py-10"
    >
      <div className="space-y-4">
        <p className="text-[20px] font-semibold text-gray-100">
          새 이름을 입력해주세요
        </p>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded-lg border border-[#2d4a6a] bg-[#0f1218]/60 px-4 py-2.5 text-[14px] text-gray-100 outline-none transition-colors focus:border-[#3b82f6]/50 focus:bg-[#0f1218]/80 placeholder:text-gray-500"
          placeholder="프로젝트 이름"
          disabled={isPending}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg bg-[#2d4a6a] px-4 py-2.5 text-[14px] font-semibold text-gray-200 transition-colors hover:bg-[#334155]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !draft.trim()}
            className="rounded-lg bg-[#3b82f6] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_16px_rgba(59,130,246,0.4)] transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:shadow-none"
          >
            {isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
