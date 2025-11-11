import { describe, expect, it } from "vitest";
import type { Scenario } from "@/types/api";
import { buildNodeDeltas, deltaClass, fmtCost } from "./diff";

const scenarioA: Scenario = {
  name: "scenario-a",
  nodes: [
    { id: "api", type: "service", latencyMs: 20, capacityRps: 2500, costPerHour: 1.2 },
    { id: "cache", type: "cache", latencyMs: 5, capacityRps: 4000 },
  ],
  edges: [],
};

const scenarioB: Scenario = {
  name: "scenario-b",
  nodes: [
    { id: "api", type: "service", latencyMs: 25, capacityRps: 2300, costPerHour: 1.5 },
    { id: "worker", type: "worker", latencyMs: 40, capacityRps: 1500 },
  ],
  edges: [],
};

describe("buildNodeDeltas", () => {
  it("computes deltas for nodes present in both snapshots", () => {
    const deltas = buildNodeDeltas(scenarioA, scenarioB);
    expect(deltas).toHaveLength(1);
    const apiDelta = deltas[0];
    expect(apiDelta.id).toBe("api");
    expect(apiDelta.dLatencyMs).toBe(5);
    expect(apiDelta.dCapacityRps).toBe(-200);
    expect(apiDelta.dCost).toBeDefined();
    expect(apiDelta.dCost ?? 0).toBeCloseTo(0.3, 6);
  });

  it("ignores nodes that are only present in one snapshot", () => {
    const deltas = buildNodeDeltas(scenarioB, scenarioA);
    expect(deltas.map((delta) => delta.id)).toEqual(["api"]);
  });

  it("handles scenarios without comparable metrics", () => {
    const left: Scenario = { name: "left", nodes: [{ id: "edge", type: "gateway" }], edges: [] };
    const right: Scenario = { name: "right", nodes: [{ id: "edge", type: "gateway" }], edges: [] };
    expect(buildNodeDeltas(left, right)).toEqual([]);
  });
});

describe("delta helpers", () => {
  it("maps delta classes based on metric semantics", () => {
    expect(deltaClass("latency", 5)).toContain("text-danger");
    expect(deltaClass("latency", -2)).toContain("text-success");
    expect(deltaClass("capacity", 10)).toContain("text-success");
    expect(deltaClass("capacity", -1)).toContain("text-danger");
  });

  it("formats cost deltas with currency units", () => {
    expect(fmtCost(0.5)).toBe("+0.50 $/h");
    expect(fmtCost(-1.25)).toBe("-1.25 $/h");
  });
});
