import { useMemo } from "react";
import Button from "@/components/common/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Scenario, SimulationResult } from "@/types/api";
import type { WhatIf } from "@/types/grading";
import { getWhatIfs } from "@/whatif/catalog";

type Props = {
  scenario: Scenario | null;
  result: SimulationResult | null;
  onScenarioChange: (next: Scenario) => void;
};

export default function WhatIfList({ scenario, result, onScenarioChange }: Props) {
  const suggestions = useMemo<WhatIf[]>(() => {
    if (!scenario || !result) {
      return [];
    }
    return getWhatIfs(scenario, result);
  }, [scenario, result]);

  if (!scenario || !result || suggestions.length === 0) {
    return null;
  }

  const handleApply = (whatIf: WhatIf) => {
    if (!scenario) {
      return;
    }
    const next = whatIf.apply(scenario);
    if (next !== scenario) {
      onScenarioChange(next);
    }
  };

  const handleRevert = (whatIf: WhatIf) => {
    if (!scenario || !whatIf.revert) {
      return;
    }
    const next = whatIf.revert(scenario);
    if (next !== scenario) {
      onScenarioChange(next);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">What-if suggestions</CardTitle>
        <p className="text-sm text-muted">Apply safe tweaks, then re-run the simulation.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => {
          const applied = suggestion.isApplied ? suggestion.isApplied(scenario) : false;
          return (
            <div
              key={suggestion.id}
              data-testid="whatif-card"
              className="rounded-lg border border-border/60 p-4 dark:border-borderDark"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs capitalize border border-border/60 dark:border-borderDark/60"
                  >
                    {suggestion.tag}
                  </Badge>
                  <p className="font-semibold text-text dark:text-white">{suggestion.title}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={applied ? "destructive" : "secondary"}
                  onClick={() => (applied ? handleRevert(suggestion) : handleApply(suggestion))}
                  aria-label={applied ? `Revert ${suggestion.title}` : `Apply ${suggestion.title}`}
                  disabled={applied && !suggestion.revert}
                  data-testid="whatif-apply"
                >
                  {applied ? "Revert" : "Apply"}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted">{suggestion.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
