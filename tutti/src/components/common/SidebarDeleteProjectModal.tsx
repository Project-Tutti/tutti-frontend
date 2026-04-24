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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="프로젝트 삭제"
      panelClassName="min-w-3xl"
      headerClassName="[&_h2]:text-[16px] [&_h2]:font-semibold"
      contentClassName="px-6 py-10"
    >
      <div className="space-y-4">
        <p className="text-[20px] font-semibold text-gray-100">
          정말로 이 프로젝트를 삭제할까요?
        </p>
        <p className="text-[14px] text-gray-400">
          <span className="font-semibold text-white">{projectName ?? ""}</span>
          의 모든 버전과 파일이 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1e293b] px-4 py-2.5 text-[14px] font-semibold text-gray-200 transition-colors hover:bg-[#334155]"
            disabled={isPending}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? "삭제 중…" : "프로젝트 삭제"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
