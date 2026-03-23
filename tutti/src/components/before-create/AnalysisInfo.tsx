interface AnalysisInfoProps {
  confidence?: number;
  onGenerate: () => void;
  isPending?: boolean;
}

const AnalysisInfo = ({ 
  onGenerate,
  isPending,
}: AnalysisInfoProps) => {
  return (
    <div className="mt-auto pt-8 md:pt-10 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-center gap-4 md:gap-6">

        {/* Generate 버튼 */}
        <button
          onClick={onGenerate}
          disabled={isPending}
          className="
            w-full max-w-md h-14 md:h-16 
            bg-[#3b82f6] hover:bg-blue-600 
            rounded-xl flex items-center justify-center gap-3 
            text-white font-bold text-base md:text-lg tracking-wide
            shadow-[0_8px_30px_rgba(59,130,246,0.3)] 
            transition-all hover:scale-[1.02] active:scale-[0.98]
            uppercase
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <span className="material-symbols-outlined text-xl md:text-2xl">
            auto_fix_high
          </span>
          {isPending ? "Generating..." : "Generate"}
        </button>
      </div>
    </div>
  );
};

export default AnalysisInfo;
