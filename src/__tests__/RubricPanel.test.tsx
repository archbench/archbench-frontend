import { render, screen } from "@testing-library/react";
import RubricPanel from "@/components/Grading/RubricPanel";
import type { Scenario, SimulationResult } from "@/types/api";

const scenario: Scenario = {
  name: "demo",
  workload: {
    rps: 2000,
    p95TargetMs: 150,
    costTargetPerHour: 0.5,
  },
  nodes: [],
  edges: [],
};

const result: SimulationResult = {
  latencyMsP50: 20,
  latencyMsP95: 140,
  throughputRps: 1800,
  costPerHour: 0.65,
  status: "ok",
  score: 82,
  hints: [],
};

describe("RubricPanel", () => {
  it("renders grading bars with pass/fail indicators", () => {
    render(<RubricPanel scenario={scenario} result={result} />);
    expect(screen.getByText("Grading Rubric")).toBeInTheDocument();
    expect(screen.getByText("Latency p95")).toBeInTheDocument();
    expect(screen.getByText("Throughput")).toBeInTheDocument();
    expect(screen.getByText("Cost / hour")).toBeInTheDocument();

    expect(screen.getAllByText("Target met").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Needs work").length).toBeGreaterThanOrEqual(1);
  });
});

