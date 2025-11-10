import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Scenario, SimulationResult } from "@/types/api";
import { buildRubric } from "@/utils/rubric";
import GoalBar from "./GoalBar";

type Props = {
  scenario: Scenario | null;
  result: SimulationResult | null;
};

export default function RubricPanel({ scenario, result }: Props) {
  if (!scenario || !result) {
    return null;
  }

  const breakdowns = buildRubric(result, scenario);
  if (!breakdowns.length) {
    return null;
  }

  return (
    <Card data-testid="rubric-panel">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Grading Rubric</CardTitle>
        <p className="text-sm text-muted">How the engine scored this scenario.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdowns.map((breakdown) => (
          <GoalBar key={breakdown.kind} breakdown={breakdown} />
        ))}
        <p className="text-xs text-muted">
          Legend: <span aria-label="better" className="font-semibold text-success">↓ better</span> ·{" "}
          <span aria-label="worse" className="font-semibold text-danger">↑ worse</span> ·{" "}
          <span aria-label="neutral" className="font-semibold text-muted">— on target</span>
        </p>
      </CardContent>
    </Card>
  );
}
