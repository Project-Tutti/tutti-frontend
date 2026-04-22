"use client";

export const sectionClass =
  "rounded-xl border border-white/8 bg-[#080a0f]/95 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const sectionTitleClass =
  "mb-3 inline-flex w-fit max-w-full items-center rounded-md border border-blue-500/15 bg-blue-500/6 px-2.5 py-1 text-[14px] font-semibold tracking-wide text-white";

export function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm leading-snug text-slate-200 wrap-break-word whitespace-normal sm:text-right">
        {children}
      </dd>
    </div>
  );
}

/** HTML5: dl 안에서 dt/dd를 div로 묶을 수 있음 */
export function MetaList({ children }: { children: React.ReactNode }) {
  return <dl className="space-y-2.5">{children}</dl>;
}

