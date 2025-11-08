import type { Edge, Node, Scenario, SimulationResult } from "@/types/api";
import type { WhatIf } from "@/types/grading";

const WHAT_IF_PREFIX = "whatif";

const cloneNode = (node: Node): Node => ({
  ...node,
  dbConfig: node.dbConfig
    ? {
        ...node.dbConfig,
        tables: node.dbConfig.tables?.map((table) => ({
          ...table,
          columns: table.columns?.map((column) => ({ ...column })),
          indexes: table.indexes ? [...table.indexes] : undefined,
        })),
      }
    : undefined,
});

const cloneScenario = (scenario: Scenario): Scenario => ({
  ...scenario,
  workload: scenario.workload ? { ...scenario.workload } : undefined,
  nodes: scenario.nodes.map(cloneNode),
  edges: scenario.edges.map((edge) => ({ ...edge })),
});

const edgeExists = (edges: Edge[], from: string, to: string) =>
  edges.some((edge) => edge.from === from && edge.to === to);

const addIntermediateNode = (
  scenario: Scenario,
  fromId: string,
  toId: string,
  node: Node,
): Scenario => {
  const next = cloneScenario(scenario);
  if (next.nodes.some((existing) => existing.id === node.id)) {
    return scenario;
  }
  next.nodes.push(node);
  next.edges = next.edges.filter((edge) => !(edge.from === fromId && edge.to === toId));
  next.edges.push({ from: fromId, to: node.id }, { from: node.id, to: toId });
  return next;
};

const removeIntermediateNode = (scenario: Scenario, fromId: string, toId: string, nodeId: string): Scenario => {
  if (!scenario.nodes.some((node) => node.id === nodeId)) {
    return scenario;
  }
  const next = cloneScenario(scenario);
  next.nodes = next.nodes.filter((node) => node.id !== nodeId);
  next.edges = next.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
  if (!edgeExists(next.edges, fromId, toId)) {
    next.edges.push({ from: fromId, to: toId });
  }
  return next;
};

const describeCacheWhatIf = (scenario: Scenario): WhatIf | null => {
  const nodesById = new Map(scenario.nodes.map((node) => [node.id, node]));
  const edge = scenario.edges.find((candidate) => {
    const from = nodesById.get(candidate.from);
    const to = nodesById.get(candidate.to);
    if (!from || !to) {
      return false;
    }
    if (from.type !== "service" || to.type !== "database") {
      return false;
    }
    const alreadyBuffered = scenario.edges.some((e) => {
      if (e.from !== candidate.from) {
        return false;
      }
      const node = nodesById.get(e.to);
      return node?.type === "cache" || node?.type === "queue";
    });
    return !alreadyBuffered;
  });

  if (!edge) {
    return null;
  }

  const cacheNodeId = `${WHAT_IF_PREFIX}-cache-${edge.from}-${edge.to}`;

  return {
    id: "cache-before-db",
    title: "Add cache before DB",
    description: "Insert a small, fast cache in front of the database to absorb repeated reads.",
    tag: "cache",
    apply: (current) =>
      addIntermediateNode(current, edge.from, edge.to, {
        id: cacheNodeId,
        type: "cache",
        latencyMs: 2,
        varianceFactor: 1.2,
        capacityRps: 5_000,
        costPerHour: 0.02,
      }),
    revert: (current) => removeIntermediateNode(current, edge.from, edge.to, cacheNodeId),
    isApplied: (current) => current.nodes.some((node) => node.id === cacheNodeId),
  };
};

const describeQueueWhatIf = (scenario: Scenario): WhatIf | null => {
  const nodesById = new Map(scenario.nodes.map((node) => [node.id, node]));
  const edge = scenario.edges.find((candidate) => {
    const from = nodesById.get(candidate.from);
    const to = nodesById.get(candidate.to);
    if (!from || !to) {
      return false;
    }
    if (from.type !== "service" || to.type !== "database") {
      return false;
    }
    const queueExists = scenario.nodes.some((node) => node.id === `${WHAT_IF_PREFIX}-queue-${candidate.from}-${candidate.to}`);
    return !queueExists;
  });

  if (!edge) {
    return null;
  }

  const queueNodeId = `${WHAT_IF_PREFIX}-queue-${edge.from}-${edge.to}`;

  return {
    id: "queue-before-db",
    title: "Queue writes",
    description: "Buffer writes with a lightweight queue to smooth out spikes before hitting storage.",
    tag: "queue",
    apply: (current) =>
      addIntermediateNode(current, edge.from, edge.to, {
        id: queueNodeId,
        type: "queue",
        latencyMs: 5,
        varianceFactor: 1.1,
        capacityRps: 10_000,
        costPerHour: 0.01,
      }),
    revert: (current) => removeIntermediateNode(current, edge.from, edge.to, queueNodeId),
    isApplied: (current) => current.nodes.some((node) => node.id === queueNodeId),
  };
};

const describeReplicaWhatIf = (scenario: Scenario): WhatIf | null => {
  const serviceNode = scenario.nodes.find((node) => node.type === "service");
  if (!serviceNode) {
    return null;
  }
  const baseReplicas = serviceNode.replicas ?? 1;
  const targetReplicas = baseReplicas + 1;
  return {
    id: `service-replica-${serviceNode.id}`,
    title: "Increase API replicas (+1)",
    description: "Add another service replica to improve parallelism and headroom.",
    tag: "replicas",
    apply: (current) => {
      if (current.nodes.find((node) => node.id === serviceNode.id)?.replicas === targetReplicas) {
        return current;
      }
      const next = cloneScenario(current);
      const node = next.nodes.find((candidate) => candidate.id === serviceNode.id);
      if (!node) {
        return current;
      }
      node.replicas = targetReplicas;
      return next;
    },
    revert: (current) => {
      const next = cloneScenario(current);
      const node = next.nodes.find((candidate) => candidate.id === serviceNode.id);
      if (!node) {
        return current;
      }
      if (baseReplicas <= 1) {
        delete node.replicas;
      } else {
        node.replicas = baseReplicas;
      }
      return next;
    },
    isApplied: (current) => current.nodes.find((node) => node.id === serviceNode.id)?.replicas === targetReplicas,
  };
};

const describeIndexWhatIf = (scenario: Scenario): WhatIf | null => {
  const dbNode = scenario.nodes.find((node) => node.type === "database" && node.dbConfig?.tables?.length);
  if (!dbNode?.dbConfig?.tables?.length) {
    return null;
  }
  const table = dbNode.dbConfig.tables[0];
  const indexName = `${table.name ?? "main"}_perf_idx`;
  return {
    id: `db-index-${dbNode.id}`,
    title: "Add index to main table",
    description: "Add a hot-path index to the primary table to improve lookup speed.",
    tag: "db",
    apply: (current) => {
      const next = cloneScenario(current);
      const node = next.nodes.find((candidate) => candidate.id === dbNode.id);
      if (!node?.dbConfig?.tables?.length) {
        return current;
      }
      const targetTable = node.dbConfig.tables[0];
      targetTable.indexes = targetTable.indexes ?? [];
      if (!targetTable.indexes.includes(indexName)) {
        targetTable.indexes.push(indexName);
      }
      return next;
    },
    revert: (current) => {
      const next = cloneScenario(current);
      const node = next.nodes.find((candidate) => candidate.id === dbNode.id);
      if (!node?.dbConfig?.tables?.length) {
        return current;
      }
      const targetTable = node.dbConfig.tables[0];
      targetTable.indexes = targetTable.indexes?.filter((idx) => idx !== indexName);
      if (targetTable.indexes && targetTable.indexes.length === 0) {
        delete targetTable.indexes;
      }
      return next;
    },
    isApplied: (current) => {
      const node = current.nodes.find((candidate) => candidate.id === dbNode.id);
      if (!node?.dbConfig?.tables?.length) {
        return false;
      }
      return Boolean(node.dbConfig.tables[0].indexes?.includes(indexName));
    },
  };
};

export const getWhatIfs = (scenario: Scenario, _result: SimulationResult): WhatIf[] => {
  const suggestions: (WhatIf | null)[] = [
    describeCacheWhatIf(scenario),
    describeQueueWhatIf(scenario),
    describeReplicaWhatIf(scenario),
    describeIndexWhatIf(scenario),
  ];
  return suggestions.filter((item): item is WhatIf => Boolean(item));
};
