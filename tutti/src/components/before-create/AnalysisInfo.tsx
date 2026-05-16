"use client";

import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface AnalysisInfoProps {
  onGenerate: () => void;
  onBack?: () => void;
  isPending?: boolean;
  disabled?: boolean;
  /** Generate 버튼 아래에만 표시 (API 등 생성 실패) */
  errorMessage?: string | null;
  label?: string;
  pendingLabel?: string;
  variant?: "generate" | "regenerate";
}

const AnalysisInfo = ({
  onGenerate,
  onBack,
  isPending,
  disabled,
  errorMessage,
  label = "Generate",
  pendingLabel = "Generating...",
  variant = "generate",
}: AnalysisInfoProps) => {
  const isDisabled = isPending || disabled;
  const hasError = Boolean(errorMessage?.trim());

  const generateButton = (
    <button
      type="button"
      onClick={onGenerate}
      disabled={isDisabled}
      className={`flex ${onBack ? "flex-1" : "w-full max-w-3xl"} items-center justify-center gap-2 rounded-lg border border-blue-600/35 bg-[#3b82f6] px-5 py-3 text-base font-medium text-white transition-colors hover:border-blue-500/50 hover:bg-[#2563eb] active:bg-[#1d4ed8] disabled:pointer-events-none disabled:opacity-50 md:py-3.5`}
    >
      {isPending ? (
        <Loader2
          className="size-4 shrink-0 animate-spin"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : variant === "regenerate" ? (
        <RotateCcw
          className="size-4 shrink-0 opacity-90"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <span>{isPending ? pendingLabel : label}</span>
      {!isPending && variant === "generate" ? (
        <ChevronRight
          className="size-4 shrink-0 opacity-80"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-3xl pt-3 md:pt-4">
      <div className="flex flex-col items-center gap-2 md:gap-2.5">
        {onBack ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#3b82f6]/40 bg-blue-500/8 px-5 py-3 text-base font-medium text-[#3b82f6] transition-colors hover:bg-blue-500/15 hover:border-[#3b82f6]/60 disabled:pointer-events-none disabled:opacity-50 md:py-3.5"
            >
              <ArrowLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              이전
            </button>
            {generateButton}
          </div>
        ) : (
          generateButton
        )}
        {hasError ? (
          <div className="flex w-full max-w-3xl justify-center px-1" aria-live="polite">
            <p className="flex items-start gap-1.5 text-center text-xs leading-snug text-red-400 md:text-sm">
              <AlertCircle
                className="mt-0.5 size-3.5 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span>{errorMessage}</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AnalysisInfo;
