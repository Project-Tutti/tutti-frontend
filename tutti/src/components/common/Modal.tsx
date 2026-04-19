"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** 스크롤 영역 아래 고정(예: 안내 문구 + 확인) */
  footer?: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children, title, footer }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-lg max-h-[min(88vh,720px)] flex-col overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f1218] shadow-2xl animate-fade-in">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1e293b] px-4 py-3">
          <h2 className="min-w-0 text-sm font-semibold leading-snug tracking-tight text-white">
            {title || "알림"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="닫기"
          >
            <X className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-[#1e293b] bg-[#0a0c12]/95 px-4 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Modal;
