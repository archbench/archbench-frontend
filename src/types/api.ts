export interface Workload {
  rps?: number;
  p95TargetMs?: number;
}

export type NodeType =
  | "client"
  | "service"
  | "cache"
  | "database"
  | "queue"
  | "gateway"
  | "cdn"
  | "objectstore"
  | "search"
  | "stream"
  | "lb"
  | "worker";

export type DbEngine = "postgres" | "mysql" | "dynamodb" | "mongo";

export type DbColumnType = "string" | "number" | "boolean" | "json";

export interface DbColumn {
  name: string;
  type: DbColumnType;
}

export interface DbTable {
  name: string;
  sizeClass?: "S" | "M" | "L";
  indexes?: string[];
  columns?: DbColumn[];
}

export interface DbConfig {
  engine?: DbEngine;
  tables?: DbTable[];
}

export interface Node {
  id: string;
  type: NodeType;
  latencyMs?: number;
  varianceFactor?: number;
  capacityRps?: number;
  failureRate?: number;
  costPerHour?: number;
  dbConfig?: DbConfig;
}

export interface Edge {
  from: string;
  to: string;
}

export interface Scenario {
  name: string;
  workload?: Workload;
  nodes: Node[];
  edges: Edge[];
}

export interface SimulationResult {
  latencyMsP50: number;
  latencyMsP95: number;
  throughputRps: number;
  costPerHour: number;
  status: string;
  score?: number;
  hints?: string[];
}

export interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
}
