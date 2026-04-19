"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, UserX } from "lucide-react";

import Modal from "@/components/common/Modal";
import { useDeleteUserMeMutation } from "@api/user/hooks/mutations/useDeleteUserMeMutation";
import { useLogoutMutation } from "@api/user/hooks/mutations/useLogoutMutation";
import {
  useAuthStoreActions,
  useUser,
} from "@features/auth/hooks/useAuthStore";

const SidebarAccountFooter = () => {
  const router = useRouter();
  const user = useUser();
  const { clearAuth } = useAuthStoreActions();
  const logoutMutation = useLogoutMutation();
  const deleteUserMeMutation = useDeleteUserMeMutation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [isDeleteSuccessModalOpen, setIsDeleteSuccessModalOpen] =
    useState(false);

  return (
    <div className="relative min-w-54 border-t border-[#1e293b] p-2.5">
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
              className="rounded-lg bg-[#1e293b] px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-[#334155]"
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
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              disabled={deleteUserMeMutation.isPending}
            >
              {deleteUserMeMutation.isPending ? "삭제 중…" : "계정 삭제"}
            </button>
          </div>
        </div>
      </Modal>

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
              className="rounded-lg bg-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>

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
              계정 삭제
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                clearAuth();
                router.push("/login");
                logoutMutation.mutate();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-gray-200 transition-colors hover:bg-white/5"
            >
              <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
              로그아웃
            </button>
          </div>
        </div>
      )}

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
  );
};

export default SidebarAccountFooter;
