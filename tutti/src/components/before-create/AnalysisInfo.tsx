interface AnalysisInfoProps {
  onGenerate: () => void;
  isPending?: boolean;
  label?: string;
  pendingLabel?: string;
  icon?: string;
}

const AnalysisInfo = ({ 
  onGenerate,
  isPending,
  label = "Generate",
  pendingLabel = "Generating...",
  icon = "auto_fix_high",
}: AnalysisInfoProps) => {
  return (
    <div className="mt-auto pt-5 md:pt-6 max-w-3xl mx-auto w-full">
      <div className="flex flex-col items-center gap-3 md:gap-4">

        {/* Generate 버튼 */}
        <button
          onClick={onGenerate}
          disabled={isPending}
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
      </div>
    </div>
  );
};

export default AnalysisInfo;
