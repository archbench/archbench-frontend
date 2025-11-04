import type { ProblemDetail, Scenario, SimulationResult } from "../types/api";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

const buildUrl = (path: string) => `${BASE_URL}${path}`;

export async function getHealth(): Promise<string> {
  const res = await fetch(buildUrl("/health"));
  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }

  return text.trim();
}

export async function simulate(scenario: Scenario): Promise<SimulationResult> {
  const res = await fetch(buildUrl("/simulate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario),
  });

  if (!res.ok) {
    const problem = (await res
      .json()
      .catch(() => null)) as ProblemDetail | null;
    const message =
      problem?.detail || problem?.title || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as SimulationResult;
}
