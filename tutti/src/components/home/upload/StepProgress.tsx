interface Step {
  label: string;
  icon: string;
  isActive: boolean;
}

interface StepProgressProps {
  steps: Step[];
}

const StepProgress = ({ steps }: StepProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-5 md:gap-8 mb-6 md:mb-8 relative z-10">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 md:gap-2">
            {step.isActive ? (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                <span className="material-symbols-outlined text-[11px] md:text-xs font-bold">
                  {step.icon}
                </span>
              </div>
            ) : (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-[#1e293b] flex items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-[11px] md:text-xs font-bold">
                  {step.icon}
                </span>
              </div>
            )}
            <span className={`font-medium text-[10px] md:text-xs ${step.isActive ? 'text-white' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
