"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";

type StepState = "done" | "active" | "pending";

interface CreateFlowStepsProps {
  currentStep: 1 | 2 | 3;
  /** 현재 step의 작업이 완료된 상태이면 true.
   *  현재 step 원이 체크 표시로 전환되고 다음 connector도 활성화됨. */
  currentStepDone?: boolean;
}

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "MIDI 추가" },
  { n: 2, label: "악기 선택" },
  { n: 3, label: "상세 설정" },
];

const CreateFlowSteps = ({
  currentStep,
  currentStepDone = false,
}: CreateFlowStepsProps) => {
  const getState = (n: 1 | 2 | 3): StepState => {
    if (n < currentStep) return "done";
    if (n === currentStep) return currentStepDone ? "done" : "active";
    return "pending";
  };

  const isConnectorActive = (afterStep: 1 | 2) =>
    afterStep < currentStep ||
    (afterStep === currentStep && currentStepDone);

  return (
    <div className="flex items-center gap-3">
      {STEPS.map((step, idx) => (
        <Fragment key={step.n}>
          <StepCircle
            state={getState(step.n)}
            number={step.n}
            label={step.label}
          />
          {idx < STEPS.length - 1 ? (
            <div
              className={[
                "h-px flex-1 transition-colors duration-500",
                isConnectorActive(step.n as 1 | 2)
                  ? "bg-[#3b82f6]/50"
                  : "bg-[#2d4a6a]",
              ].join(" ")}
              aria-hidden
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
};

const StepCircle = ({
  state,
  number,
  label,
}: {
  state: StepState;
  number: number;
  label: string;
}) => {
  const ariaLabel = `${label} ${
    state === "done" ? "완료" : state === "active" ? "진행 중" : "대기"
  }`;

  if (state === "done") {
    return (
      <div
        className="flex size-9 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]"
        aria-label={ariaLabel}
      >
        <Check className="size-4" strokeWidth={2.75} aria-hidden />
      </div>
    );
  }

  if (state === "active") {
    return (
      <div
        className="flex size-9 items-center justify-center rounded-full bg-[#3b82f6] text-sm font-bold text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]"
        aria-label={ariaLabel}
      >
        {number}
      </div>
    );
  }

  return (
    <div
      className="flex size-9 items-center justify-center rounded-full bg-[#2d4a6a] text-sm font-bold text-gray-500"
      aria-label={ariaLabel}
    >
      {number}
    </div>
  );
};

export default CreateFlowSteps;
