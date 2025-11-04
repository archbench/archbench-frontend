import type { Scenario, SimulationResult } from './api';

export interface Snapshot {
  name: string;
  scenario: Scenario;
  result: SimulationResult;
  savedAt: string;
}
