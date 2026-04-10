interface AnalysisInfoProps {
  onGenerate: () => void;
  isPending?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  pendingLabel?: string;
  icon?: string;
}

const AnalysisInfo = ({
  onGenerate,
  isPending,
  disabled,
  disabledReason,
  label = "Generate",
  pendingLabel = "Generating...",
  icon = "auto_fix_high",
}: AnalysisInfoProps) => {
  const isDisabled = isPending || disabled;

  return (
    <div className="mt-auto pt-5 md:pt-6 max-w-3xl mx-auto w-full">
      <div className="flex flex-col items-center gap-3 md:gap-4">
        {/* Generate 버튼 */}
        <button
          onClick={onGenerate}
          disabled={isDisabled}
          className="
            w-full max-w-sm h-11 md:h-12 
            bg-[#3b82f6] hover:bg-blue-600 
            rounded-lg flex items-center justify-center gap-2 
            text-white font-bold text-sm md:text-base tracking-wide
            shadow-[0_6px_24px_rgba(59,130,246,0.3)] 
            transition-all hover:scale-[1.02] active:scale-[0.98]
            uppercase
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <span className="material-symbols-outlined text-lg md:text-xl">
            {icon}
          </span>
          {isPending ? pendingLabel : label}
        </button>
        {disabled && disabledReason && (
          <p className="text-[10px] text-red-400 flex items-center gap-1">
            <span className="material-symbols-outlined leading-none" style={{ fontSize: "15px" }}>error</span>
            {disabledReason}
          </p>
        )}
      </div>
    </div>
  );
};

export default AnalysisInfo;
