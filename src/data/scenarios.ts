import type { Scenario } from "../types/api";

export type ScenarioPreset = {
  id: string;
  label: string;
  workload: {
    rps: number;
    p95TargetMs: number;
    costTargetUsd: number;
  };
  scenario: Scenario;
};

type PresetDefinition = {
  id: string;
  label: string;
  workload: ScenarioPreset["workload"];
  nodes: Scenario["nodes"];
  edges: Scenario["edges"];
};

const DEFINITIONS: PresetDefinition[] = [
  {
    id: "url-shortener",
    label: "URL Shortener",
    workload: { rps: 1800, p95TargetMs: 150, costTargetUsd: 0.5 },
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "cache", type: "cache" },
      { id: "db", type: "database" },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "cache" },
      { from: "api", to: "db" },
    ],
  },
  {
    id: "chat-dm",
    label: "Chat DM",
    workload: { rps: 2500, p95TargetMs: 120, costTargetUsd: 0.8 },
    nodes: [
      { id: "client", type: "client" },
      { id: "gateway", type: "gateway" },
      { id: "queue", type: "queue" },
      { id: "worker", type: "worker" },
      { id: "store", type: "database" },
    ],
    edges: [
      { from: "client", to: "gateway" },
      { from: "gateway", to: "queue" },
      { from: "queue", to: "worker" },
      { from: "worker", to: "store" },
    ],
  },
  {
    id: "news-feed",
    label: "News Feed",
    workload: { rps: 3200, p95TargetMs: 180, costTargetUsd: 1.3 },
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "feed-cache", type: "cache" },
      { id: "feed-db", type: "database" },
      { id: "reco", type: "service" },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "feed-cache" },
      { from: "api", to: "feed-db" },
      { from: "api", to: "reco" },
    ],
  },
  {
    id: "checkout",
    label: "Checkout",
    workload: { rps: 900, p95TargetMs: 200, costTargetUsd: 1.1 },
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "payments", type: "service" },
      { id: "orders-db", type: "database" },
      { id: "cache", type: "cache" },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "payments" },
      { from: "api", to: "orders-db" },
      { from: "api", to: "cache" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    workload: { rps: 1500, p95TargetMs: 220, costTargetUsd: 0.7 },
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "queue", type: "queue" },
      { id: "mailer", type: "worker" },
      { id: "sms", type: "worker" },
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "queue" },
      { from: "queue", to: "mailer" },
      { from: "queue", to: "sms" },
    ],
  },
  {
    id: "rate-limiter",
    label: "Rate Limiter",
    workload: { rps: 4200, p95TargetMs: 80, costTargetUsd: 0.6 },
    nodes: [
      { id: "client", type: "client" },
      { id: "edge", type: "gateway" },
      { id: "limiter", type: "service" },
      { id: "store", type: "database" },
    ],
    edges: [
      { from: "client", to: "edge" },
      { from: "edge", to: "limiter" },
      { from: "limiter", to: "store" },
    ],
  },
  {
    id: "file-storage",
    label: "File Storage",
    workload: { rps: 650, p95TargetMs: 250, costTargetUsd: 1.4 },
    nodes: [
      { id: "client", type: "client" },
      { id: "upload", type: "service" },
      { id: "queue", type: "queue" },
      { id: "worker", type: "worker" },
      { id: "object-store", type: "objectstore" },
    ],
    edges: [
      { from: "client", to: "upload" },
      { from: "upload", to: "queue" },
      { from: "queue", to: "worker" },
      { from: "worker", to: "object-store" },
    ],
  },
  {
    id: "realtime-analytics",
    label: "Realtime Analytics",
    workload: { rps: 3000, p95TargetMs: 140, costTargetUsd: 1.8 },
    nodes: [
      { id: "client", type: "client" },
      { id: "ingest", type: "service" },
      { id: "stream", type: "stream" },
      { id: "processor", type: "worker" },
      { id: "dashboard", type: "service" },
    ],
    edges: [
      { from: "client", to: "ingest" },
      { from: "ingest", to: "stream" },
      { from: "stream", to: "processor" },
      { from: "processor", to: "dashboard" },
    ],
  },
  {
    id: "search-autocomplete",
    label: "Search Autocomplete",
    workload: { rps: 4800, p95TargetMs: 70, costTargetUsd: 1.0 },
    nodes: [
      { id: "client", type: "client" },
      { id: "edge", type: "gateway" },
      { id: "search", type: "search" },
      { id: "cache", type: "cache" },
    ],
    edges: [
      { from: "client", to: "edge" },
      { from: "edge", to: "search" },
      { from: "search", to: "cache" },
    ],
  },
  {
    id: "ride-hailing",
    label: "Ride Hailing",
    workload: { rps: 2100, p95TargetMs: 190, costTargetUsd: 1.6 },
    nodes: [
      { id: "client", type: "client" },
      { id: "gateway", type: "gateway" },
      { id: "match", type: "service" },
      { id: "queue", type: "queue" },
      { id: "driver-service", type: "service" },
      { id: "rides", type: "database" },
    ],
    edges: [
      { from: "client", to: "gateway" },
      { from: "gateway", to: "match" },
      { from: "match", to: "queue" },
      { from: "queue", to: "driver-service" },
      { from: "driver-service", to: "rides" },
    ],
  },
];

export const SCENARIO_PRESETS: ScenarioPreset[] = DEFINITIONS.map((definition) => ({
  ...definition,
  scenario: {
    name: definition.id,
    workload: {
      rps: definition.workload.rps,
      p95TargetMs: definition.workload.p95TargetMs,
    },
    nodes: definition.nodes.map((node) => ({ ...node })),
    edges: definition.edges.map((edge) => ({ ...edge })),
  },
}));

export const BLANK_SCENARIO: Scenario = {
  name: "new-scenario",
  nodes: [],
  edges: [],
};
