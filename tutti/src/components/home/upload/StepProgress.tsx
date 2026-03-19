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
    <div className="flex items-center justify-center gap-6 md:gap-12 mb-10 md:mb-12 relative z-10">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          {index > 0 && <div className="h-px w-8 md:w-12 bg-[#1e293b] -ml-[44px] md:-ml-[60px]"></div>}
          
          <div className="flex items-center gap-2 md:gap-3">
            {step.isActive ? (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <span className="material-symbols-outlined text-sm md:text-base font-bold">
                  {step.icon}
                </span>
              </div>
            ) : (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-[#1e293b] flex items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-sm md:text-base font-bold">
                  {step.icon}
                </span>
              </div>
            )}
            <span className={`font-medium text-xs md:text-sm ${step.isActive ? 'text-white' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
