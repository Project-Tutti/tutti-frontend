"use client";

import { useRef, useState } from "react";

import { useClickOutside } from "@/common/hooks/useClickOutside";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Settings, UserX } from "lucide-react";

import Modal from "@/components/common/Modal";
import { useDeleteUserMeMutation } from "@api/user/hooks/mutations/useDeleteUserMeMutation";
import { useLogoutMutation } from "@api/user/hooks/mutations/useLogoutMutation";
import {
  useAuthStoreActions,
  useUser,
} from "@features/auth/hooks/useAuthStore";

type SidebarAccountFooterVariant = "full" | "icon";

interface SidebarAccountFooterProps {
  variant?: SidebarAccountFooterVariant;
}

const SidebarAccountFooter = ({
  variant = "full",
}: SidebarAccountFooterProps) => {
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

  const accountMenuRootRef = useRef<HTMLDivElement>(null);
  useClickOutside(accountMenuRootRef, isUserMenuOpen, () =>
    setIsUserMenuOpen(false),
  );

  return (
    <div
      ref={accountMenuRootRef}
      className={
        variant === "icon"
          ? "relative w-full pt-0 pb-6 flex items-start px-4"
          : "group relative min-w-54 border-t border-[#2d4a6a] h-[88px] flex items-stretch"
      }
    >
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="계정 삭제"
        panelClassName="min-w-3xl"
        headerClassName="[&_h2]:text-[16px] [&_h2]:font-semibold"
        contentClassName="px-6 py-10"
      >
        <div className="space-y-4">
          <p className="text-[20px] font-semibold text-gray-100">
            정말로 계정을 삭제할까요?
          </p>
          <p className="text-[14px] text-gray-400">
            삭제하면 모든 프로젝트와 데이터가 영구적으로 삭제되며 복구할 수
            없습니다.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteAccountModalOpen(false)}
              className="rounded-lg bg-[#2d4a6a] px-4 py-2.5 text-[14px] font-semibold text-gray-200 transition-colors hover:bg-[#334155]"
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
              className="rounded-lg bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
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
          className={
            variant === "icon"
              ? "absolute left-full bottom-2 z-70 ml-2"
              : "absolute inset-x-2.5 bottom-full z-70 mb-1"
          }
        >
          {variant === "icon" ? (
            <div className="flex min-w-44 flex-col whitespace-nowrap rounded-xl border border-[#2d4a6a] bg-[#0f1218] p-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsDeleteAccountModalOpen(true);
                }}
                className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
              >
                <UserX className="size-4 shrink-0" strokeWidth={1.75} />
                계정 삭제
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  try {
                    sessionStorage.setItem("tutti:skip-auth-toast-once", "1");
                  } catch {
                    // ignore
                  }
                  clearAuth();
                  router.push("/login");
                  logoutMutation.mutate();
                }}
                className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm text-gray-200 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                로그아웃
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#2d4a6a] bg-[#0f1218] shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setIsDeleteAccountModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <UserX className="size-4 shrink-0" strokeWidth={1.75} />
                계정 삭제
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  try {
                    sessionStorage.setItem("tutti:skip-auth-toast-once", "1");
                  } catch {
                    // ignore
                  }
                  clearAuth();
                  router.push("/login");
                  logoutMutation.mutate();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:bg-white/5"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      )}

      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#3b82f6]/60"
          aria-label="설정"
          title="설정"
        >
          <Settings className="size-5" strokeWidth={1.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((v) => !v)}
          className="flex h-full w-full items-center gap-3 px-5 transition-colors hover:bg-white/5"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full border border-white/20 bg-linear-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-[15px] font-semibold text-white">
              {user?.name ?? "—"}
            </span>
            <span className="truncate text-[13px] font-medium text-gray-500">
              {user?.email ?? ""}
            </span>
          </div>
          <ChevronUp
            className={`size-5 shrink-0 text-gray-500 transition-transform ${isUserMenuOpen ? "" : "rotate-180"}`}
            strokeWidth={1.75}
          />
        </button>
      )}
    </div>
  );
};

export default SidebarAccountFooter;
