import type { Preset } from "../types/presets";
import type { Scenario } from "../types/api";

const buildScenario = (
  name: string,
  workload: { rps?: number; p95TargetMs?: number },
  nodes: Scenario["nodes"],
  edges: Scenario["edges"],
): Scenario => ({
  name,
  workload,
  nodes,
  edges,
});

export const PRESETS: Preset[] = [
  {
    meta: { slug: "url-shortener", name: "URL Shortener", category: "Edge" },
    brief: {
      title: "URL Shortener",
      summary:
        "Core redirector for marketing campaigns.\nCache hits must stay over 90% to avoid hammering the primary database.\nTraffic spikes come in hourly bursts from newsletter links.",
      workload: { rps: 1800, p95TargetMs: 150, costTargetPerHour: 0.45 },
    },
    scenario: buildScenario(
      "url-shortener",
      { rps: 1800, p95TargetMs: 150 },
      [
        { id: "client", type: "client" },
        { id: "edge", type: "gateway", latencyMs: 10, capacityRps: 4500 },
        { id: "api", type: "service", latencyMs: 25, capacityRps: 2600 },
        { id: "cache", type: "cache", latencyMs: 5, capacityRps: 4200 },
        {
          id: "links-db",
          type: "database",
          latencyMs: 65,
          capacityRps: 950,
          dbConfig: {
            engine: "postgres",
            tables: [
              {
                name: "links",
                indexes: ["slug_idx"],
                columns: [
                  { name: "slug", type: "string" },
                  { name: "target", type: "string" },
                ],
              },
            ],
          },
        },
      ],
      [
        { from: "client", to: "edge" },
        { from: "edge", to: "api" },
        { from: "api", to: "cache" },
        { from: "api", to: "links-db" },
      ],
    ),
  },
  {
    meta: { slug: "chat-dm", name: "Chat Direct Messages", category: "Messaging" },
    brief: {
      title: "Chat DM",
      summary:
        "Inbox-style DM service with ordered delivery and read receipts.\nQueue load follows diurnal patterns and needs worker autoscaling.\nLow-latency multi-region delivery is more important than raw throughput.",
      workload: { rps: 2500, p95TargetMs: 120, costTargetPerHour: 0.8 },
    },
    scenario: buildScenario(
      "chat-dm",
      { rps: 2500, p95TargetMs: 120 },
      [
        { id: "client", type: "client" },
        { id: "gateway", type: "gateway", latencyMs: 18, capacityRps: 3800 },
        { id: "queue", type: "queue", latencyMs: 4, capacityRps: 5000 },
        { id: "worker", type: "worker", latencyMs: 45, capacityRps: 2000 },
        {
          id: "dm-store",
          type: "database",
          latencyMs: 70,
          capacityRps: 1100,
          dbConfig: {
            engine: "mongo",
            tables: [
              {
                name: "messages",
                indexes: ["conversation_idx", "ts_idx"],
                columns: [
                  { name: "conversationId", type: "string" },
                  { name: "ts", type: "number" },
                  { name: "payload", type: "json" },
                ],
              },
            ],
          },
        },
      ],
      [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "queue" },
        { from: "queue", to: "worker" },
        { from: "worker", to: "dm-store" },
      ],
    ),
  },
  {
    meta: { slug: "news-feed", name: "News Feed", category: "Social" },
    brief: {
      title: "News Feed",
      summary:
        "Personalized feed with freshness guarantees.\nAPI fans out to cache + DB + recommendation service per request.\nWorkload is bursty around product announcements and events.",
      workload: { rps: 3200, p95TargetMs: 180, costTargetPerHour: 1.3 },
    },
    scenario: buildScenario(
      "news-feed",
      { rps: 3200, p95TargetMs: 180 },
      [
        { id: "client", type: "client" },
        { id: "api", type: "service", latencyMs: 40, capacityRps: 3200 },
        { id: "feed-cache", type: "cache", latencyMs: 6, capacityRps: 5200 },
        {
          id: "feed-db",
          type: "database",
          latencyMs: 80,
          capacityRps: 1300,
          dbConfig: {
            engine: "postgres",
            tables: [
              {
                name: "feed_items",
                columns: [
                  { name: "user_id", type: "string" },
                  { name: "story_id", type: "string" },
                ],
              },
            ],
          },
        },
        { id: "reco", type: "service", latencyMs: 55, capacityRps: 1500 },
      ],
      [
        { from: "client", to: "api" },
        { from: "api", to: "feed-cache" },
        { from: "api", to: "feed-db" },
        { from: "api", to: "reco" },
      ],
    ),
  },
  {
    meta: { slug: "checkout", name: "Checkout Flow", category: "Commerce" },
    brief: {
      title: "Checkout",
      summary:
        "Secure checkout with payment orchestration and inventory writes.\nFraud screening runs inline and adds latency budget pressure.\nOptimizing DB writes and idempotency reduces support load.",
      workload: { rps: 900, p95TargetMs: 200, costTargetPerHour: 1.1 },
    },
    scenario: buildScenario(
      "checkout",
      { rps: 900, p95TargetMs: 200 },
      [
        { id: "client", type: "client" },
        { id: "checkout-api", type: "service", latencyMs: 55, capacityRps: 1200 },
        { id: "payments", type: "service", latencyMs: 60, capacityRps: 800 },
        {
          id: "orders-db",
          type: "database",
          latencyMs: 90,
          capacityRps: 600,
          dbConfig: {
            engine: "postgres",
            tables: [
              {
                name: "orders",
                columns: [
                  { name: "order_id", type: "string" },
                  { name: "status", type: "string" },
                ],
              },
            ],
          },
        },
        { id: "checkout-cache", type: "cache", latencyMs: 8, capacityRps: 1800 },
      ],
      [
        { from: "client", to: "checkout-api" },
        { from: "checkout-api", to: "payments" },
        { from: "checkout-api", to: "orders-db" },
        { from: "checkout-api", to: "checkout-cache" },
      ],
    ),
  },
  {
    meta: { slug: "notifications", name: "Notifications Fanout", category: "Comms" },
    brief: {
      title: "Notifications",
      summary:
        "Transactional notifications with email + SMS workers.\nQueue depth is the key alerting signal during incidents.\nCost target assumes SMS offload to third-party provider.",
      workload: { rps: 1500, p95TargetMs: 220, costTargetPerHour: 0.7 },
    },
    scenario: buildScenario(
      "notifications",
      { rps: 1500, p95TargetMs: 220 },
      [
        { id: "client", type: "client" },
        { id: "notify-api", type: "service", latencyMs: 35, capacityRps: 2100 },
        { id: "fanout-queue", type: "queue", latencyMs: 5, capacityRps: 4000 },
        { id: "mailer", type: "worker", latencyMs: 80, capacityRps: 900 },
        { id: "sms", type: "worker", latencyMs: 90, capacityRps: 700 },
      ],
      [
        { from: "client", to: "notify-api" },
        { from: "notify-api", to: "fanout-queue" },
        { from: "fanout-queue", to: "mailer" },
        { from: "fanout-queue", to: "sms" },
      ],
    ),
  },
  {
    meta: { slug: "rate-limiter", name: "Global Rate Limiter", category: "Reliability" },
    brief: {
      title: "Rate Limiter",
      summary:
        "Edge service enforcing tenant quotas.\nHot tenants should be absorbed by the edge cache before hitting storage.\nLatency budget is tiny; cross-region replication is async.",
      workload: { rps: 4200, p95TargetMs: 80, costTargetPerHour: 0.6 },
    },
    scenario: buildScenario(
      "rate-limiter",
      { rps: 4200, p95TargetMs: 80 },
      [
        { id: "client", type: "client" },
        { id: "edge", type: "gateway", latencyMs: 8, capacityRps: 6000 },
        { id: "limiter", type: "service", latencyMs: 20, capacityRps: 4500 },
        {
          id: "token-store",
          type: "database",
          latencyMs: 50,
          capacityRps: 1600,
          dbConfig: {
            engine: "dynamodb",
            tables: [
              {
                name: "counters",
                columns: [
                  { name: "tenant", type: "string" },
                  { name: "window", type: "number" },
                ],
              },
            ],
          },
        },
      ],
      [
        { from: "client", to: "edge" },
        { from: "edge", to: "limiter" },
        { from: "limiter", to: "token-store" },
      ],
    ),
  },
  {
    meta: { slug: "file-storage", name: "File Storage Pipeline", category: "Storage" },
    brief: {
      title: "File Storage",
      summary:
        "Multipart uploads with asynchronous processing.\nWorkers add virus scanning, thumbnails, and metadata writes.\nObject-store egress is the primary cost lever for this workload.",
      workload: { rps: 650, p95TargetMs: 250, costTargetPerHour: 1.4 },
    },
    scenario: buildScenario(
      "file-storage",
      { rps: 650, p95TargetMs: 250 },
      [
        { id: "client", type: "client" },
        { id: "upload-api", type: "service", latencyMs: 45, capacityRps: 900 },
        { id: "upload-queue", type: "queue", latencyMs: 6, capacityRps: 1800 },
        { id: "processor", type: "worker", latencyMs: 120, capacityRps: 700 },
        { id: "object-store", type: "objectstore", latencyMs: 90, capacityRps: 750 },
      ],
      [
        { from: "client", to: "upload-api" },
        { from: "upload-api", to: "upload-queue" },
        { from: "upload-queue", to: "processor" },
        { from: "processor", to: "object-store" },
      ],
    ),
  },
  {
    meta: { slug: "realtime-analytics", name: "Realtime Analytics", category: "Analytics" },
    brief: {
      title: "Realtime Analytics",
      summary:
        "Stream ingestion > processing > dashboard updates.\nBatch window is sub-second, so backpressure must be visible quickly.\nCPU-heavy processors need close monitoring for noisy neighbors.",
      workload: { rps: 3000, p95TargetMs: 140, costTargetPerHour: 1.8 },
    },
    scenario: buildScenario(
      "realtime-analytics",
      { rps: 3000, p95TargetMs: 140 },
      [
        { id: "client", type: "client" },
        { id: "ingest", type: "service", latencyMs: 30, capacityRps: 3600 },
        { id: "stream", type: "stream", latencyMs: 8, capacityRps: 6000 },
        { id: "processor", type: "worker", latencyMs: 70, capacityRps: 2000 },
        { id: "dashboard", type: "service", latencyMs: 40, capacityRps: 2200 },
      ],
      [
        { from: "client", to: "ingest" },
        { from: "ingest", to: "stream" },
        { from: "stream", to: "processor" },
        { from: "processor", to: "dashboard" },
      ],
    ),
  },
  {
    meta: { slug: "search-autocomplete", name: "Search Autocomplete", category: "Search" },
    brief: {
      title: "Search Autocomplete",
      summary:
        "Edge-accelerated search suggestions with aggressive caching.\nMisses fall back to a search tier that reads from a pre-warmed index.\nLatency sensitivity is extreme; aim for sub-70ms end-to-end.",
      workload: { rps: 4800, p95TargetMs: 70, costTargetPerHour: 1.0 },
    },
    scenario: buildScenario(
      "search-autocomplete",
      { rps: 4800, p95TargetMs: 70 },
      [
        { id: "client", type: "client" },
        { id: "edge", type: "gateway", latencyMs: 8, capacityRps: 7000 },
        { id: "autocomplete", type: "search", latencyMs: 18, capacityRps: 3200 },
        { id: "search-cache", type: "cache", latencyMs: 5, capacityRps: 5200 },
      ],
      [
        { from: "client", to: "edge" },
        { from: "edge", to: "autocomplete" },
        { from: "autocomplete", to: "search-cache" },
      ],
    ),
  },
  {
    meta: { slug: "ride-hailing", name: "Ride Hailing", category: "Mobility" },
    brief: {
      title: "Ride Hailing",
      summary:
        "Match riders to drivers with live ETA updates.\nQueue plus worker tier coordinates driver state and pricing events.\nDB writes are append-only but high volume during commute surges.",
      workload: { rps: 2100, p95TargetMs: 190, costTargetPerHour: 1.6 },
    },
    scenario: buildScenario(
      "ride-hailing",
      { rps: 2100, p95TargetMs: 190 },
      [
        { id: "client", type: "client" },
        { id: "gateway", type: "gateway", latencyMs: 22, capacityRps: 3000 },
        { id: "match", type: "service", latencyMs: 45, capacityRps: 2000 },
        { id: "dispatch-queue", type: "queue", latencyMs: 5, capacityRps: 3600 },
        { id: "driver-service", type: "service", latencyMs: 35, capacityRps: 2100 },
        {
          id: "rides-db",
          type: "database",
          latencyMs: 85,
          capacityRps: 1200,
          dbConfig: {
            engine: "postgres",
            tables: [
              {
                name: "rides",
                indexes: ["driver_idx"],
                columns: [
                  { name: "ride_id", type: "string" },
                  { name: "status", type: "string" },
                ],
              },
            ],
          },
        },
      ],
      [
        { from: "client", to: "gateway" },
        { from: "gateway", to: "match" },
        { from: "match", to: "dispatch-queue" },
        { from: "dispatch-queue", to: "driver-service" },
        { from: "driver-service", to: "rides-db" },
      ],
    ),
  },
];

