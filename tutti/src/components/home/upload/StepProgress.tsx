import { Check, Upload } from "lucide-react";

interface Step {
  label: string;
  icon: "check" | "upload";
  isActive: boolean;
}

interface StepProgressProps {
  steps: Step[];
}

const iconMap = {
  check: Check,
  upload: Upload,
} as const;

const StepProgress = ({ steps }: StepProgressProps) => {
  return (
    <div className="relative z-10 mb-6 flex items-center justify-center gap-5 md:mb-8 md:gap-8">
      {steps.map((step, index) => {
        const IconComponent = iconMap[step.icon];
        return (
          <div key={index} className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 md:gap-2">
              {step.isActive ? (
                <div className="flex size-5 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] md:size-6">
                  <IconComponent className="size-3 md:size-3.5" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="flex size-5 items-center justify-center rounded-full border-2 border-[#1e293b] text-gray-500 md:size-6">
                  <IconComponent className="size-3 md:size-3.5" strokeWidth={2} />
                </div>
              )}
              <span
                className={`text-[10px] font-medium md:text-xs ${step.isActive ? "text-white" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;
