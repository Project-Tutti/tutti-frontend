"use client";

import Modal from "@/components/common/Modal";

type SidebarDeleteProjectModalProps = {
  isOpen: boolean;
  projectName: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
};

export default function SidebarDeleteProjectModal({
  isOpen,
  projectName,
  onClose,
  onConfirm,
  isPending,
}: SidebarDeleteProjectModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로젝트 삭제">
      <div className="space-y-4">
        <p className="text-xs text-gray-300">
          정말로{" "}
          <span className="font-semibold text-white">{projectName ?? ""}</span>
          을(를) 삭제할까요?
        </p>
        <p className="text-[11px] text-gray-500">
          삭제하면 프로젝트의 모든 버전과 파일이 함께 삭제됩니다.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1e293b] px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-[#334155]"
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? "삭제 중…" : "삭제"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
