import { Card, CardContent } from "@/components/ui/card";

type Props = {
  visible: boolean;
};

export function OverlayLegend({ visible }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <Card className="pointer-events-none fixed bottom-3 right-3 z-overlay text-xs opacity-90">
      <CardContent className="space-y-2 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-textMuted">Overlay legend</p>
        <LegendRow
          label="Δp95 (ms)"
          description="lower is better"
          good="↓"
          bad="↑"
        />
        <LegendRow
          label="Δrps"
          description="higher is better"
          good="↑"
          bad="↓"
        />
        <LegendRow
          label="Δ$/h"
          description="lower is better"
          good="↓"
          bad="↑"
        />
      </CardContent>
    </Card>
  );
}

type LegendRowProps = {
  label: string;
  description: string;
  good: string;
  bad: string;
};

function LegendRow({ label, description, good, bad }: LegendRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <span>{label}</span>
        <span className="text-[11px] uppercase tracking-wide text-textMuted">{description}</span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <span className="font-semibold text-success">
          {good} better
        </span>
        <span className="font-semibold text-danger">
          {bad} worse
        </span>
      </div>
    </div>
  );
}

export default OverlayLegend;
