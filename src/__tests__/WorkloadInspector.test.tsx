import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import WorkloadInspector from "@/components/Inspector/WorkloadInspector";
import type { Scenario } from "@/types/api";

const scenario: Scenario = {
  name: "url-shortener",
  workload: { rps: 900, p95TargetMs: 140 },
  nodes: [],
  edges: [],
};

const Harness = ({
  initial,
  onScenarioChange,
  onValidityChange,
}: {
  initial: Scenario;
  onScenarioChange?: (next: string) => void;
  onValidityChange?: (valid: boolean) => void;
}) => {
  const [json, setJson] = useState(JSON.stringify(initial));
  return (
    <WorkloadInspector
      scenarioJson={json}
      onScenarioChange={(next) => {
        setJson(next);
        onScenarioChange?.(next);
      }}
      onValidityChange={onValidityChange}
    />
  );
};

describe("WorkloadInspector", () => {
  it("persists edits and notifies callers", async () => {
    const user = userEvent.setup();
    const onScenarioChange = vi.fn();
    const onValidityChange = vi.fn();

    render(<Harness initial={scenario} onScenarioChange={onScenarioChange} onValidityChange={onValidityChange} />);

    const rpsInput = screen.getByLabelText(/requests per second/i);
    await user.clear(rpsInput);
    await user.type(rpsInput, "1200");
    await user.tab();

    expect(onScenarioChange).toHaveBeenCalled();
    const latest = onScenarioChange.mock.calls.at(-1)?.[0] as string | undefined;
    expect(latest).toContain('"rps": 1200');

    const p95Input = screen.getByLabelText(/p95 target/i);
    await user.clear(p95Input);
    await user.type(p95Input, "180");
    await user.tab();

    const lastCall = onScenarioChange.mock.calls.at(-1)?.[0] as string | undefined;
    expect(lastCall).toContain('"p95TargetMs": 180');

    expect(onValidityChange).toHaveBeenCalledWith(true);
  });
});
