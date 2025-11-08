import type { ReactNode } from "react";
type Props = {
  scenarioName: string;
  centerSlot?: ReactNode;
};

export default function Header({ scenarioName, centerSlot }: Props) {
  return (
    <div className="z-header w-full bg-surface px-6 py-4 shadow-header dark:bg-surfaceDark">
      <div className="flex w-full flex-wrap items-start justify-between gap-4">
        <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold text-primary">ArchBench</span>
            <span className="text-sm text-muted">{scenarioName}</span>
          </div>
        </div>
        <div className="flex min-w-[240px] flex-1 basis-full items-center gap-3 sm:basis-auto">
          {centerSlot}
        </div>
      </div>
    </div>
  );
}
