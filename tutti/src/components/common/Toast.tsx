"use client";

import { useEffect, useCallback, useState, memo } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-[18px] text-emerald-400" strokeWidth={2} />,
  error: <AlertCircle className="size-[18px] text-red-400" strokeWidth={2} />,
  info: <Info className="size-[18px] text-sky-400" strokeWidth={2} />,
};

const BG_CLASSES: Record<ToastType, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10",
  error: "border-red-500/20 bg-red-500/10",
  info: "border-sky-500/20 bg-sky-500/10",
};

const ToastItemComponent = memo(function ToastItemComponent({
  toast,
}: {
  toast: ToastItem;
}) {
  const remove = useToastStore((s) => s.remove);
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => remove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, remove]);

  const handleClose = useCallback(() => {
    remove(toast.id);
  }, [toast.id, remove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${BG_CLASSES[toast.type]}`}
    >
      <span className="shrink-0">{ICONS[toast.type]}</span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-white">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={handleClose}
        className="shrink-0 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="닫기"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </motion.div>
  );
});

export const ToastContainer = memo(function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="알림"
      className="pointer-events-none fixed inset-x-0 top-0 z-200 flex flex-col items-center gap-2 p-4"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItemComponent key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
});

/** 전역 토스트 호출 유틸 */
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: "success", message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: "error", message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: "info", message, duration }),
  clear: () => useToastStore.getState().clear(),
};

/** React hook으로 토스트 호출 */
export function useToast() {
  const add = useToastStore((s) => s.add);
  const clear = useToastStore((s) => s.clear);

  return {
    success: useCallback(
      (message: string, duration?: number) =>
        add({ type: "success", message, duration }),
      [add],
    ),
    error: useCallback(
      (message: string, duration?: number) =>
        add({ type: "error", message, duration }),
      [add],
    ),
    info: useCallback(
      (message: string, duration?: number) =>
        add({ type: "info", message, duration }),
      [add],
    ),
    clear,
  };
}
