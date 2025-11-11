import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  Panel,
  applyEdgeChanges,
  applyNodeChanges,
} from "reactflow";
import type {
  Connection,
  Edge as RFEdge,
  EdgeChange,
  Node as RFNode,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import type { Scenario, NodeType } from "@/types/api";
import type { CompareOverlayMode } from "@/types/compare";
import type { NodeDelta } from "@/compare/diff";
import { safeParse } from "@/utils/json";
import BoardNode, { type BoardNodeData } from "./Board/BoardNode";
import OverlayLegend from "./Board/OverlayLegend";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
  compareOverlay: CompareOverlayMode;
  nodeDeltas?: NodeDelta[];
};

const palette: { type: NodeType; label: string }[] = [
  { type: "client", label: "Client" },
  { type: "service", label: "Service" },
  { type: "cache", label: "Cache" },
  { type: "database", label: "Database" },
  { type: "queue", label: "Queue" },
];

type Position = { x: number; y: number };

const nodeTypes = { board: BoardNode };

export default function Board({ scenarioJson, onScenarioChange, compareOverlay, nodeDeltas }: Props) {
  const scenario = useMemo(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const [nodes, setNodes] = useState<RFNode[]>([]);
  const [edges, setEdges] = useState<RFEdge[]>([]);
  const cachedPositions = useRef<Record<string, Position>>({});
  const deltaMap = useMemo(() => {
    const map = new Map<string, NodeDelta>();
    (nodeDeltas ?? []).forEach((delta) => {
      map.set(delta.id, delta);
    });
    return map;
  }, [nodeDeltas]);

  const updateScenario = useCallback(
    (mutator: (draft: Scenario) => void) => {
      if (!scenario) {
        return;
      }
      const draft: Scenario = JSON.parse(JSON.stringify(scenario));
      mutator(draft);
      onScenarioChange(JSON.stringify(draft, null, 2));
    },
    [scenario, onScenarioChange]
  );

  useEffect(() => {
    if (!scenario) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setNodes((prev) => {
      const previousPositions = new Map(prev.map((node) => [node.id, node.position]));
      return (scenario.nodes ?? []).map((node, index) => {
        const storedPosition =
          cachedPositions.current[node.id] ??
          previousPositions.get(node.id) ??
          gridPosition(index);
        cachedPositions.current[node.id] = storedPosition;
        const delta = deltaMap.get(node.id);
        return {
          id: node.id,
          type: "board",
          position: storedPosition,
          data: {
            label: node.id,
            delta,
            compareOverlay,
          } satisfies BoardNodeData,
          draggable: true,
          selectable: true,
        };
      });
    });

    setEdges(() => {
      const pairCounts = new Map<string, number>();
      return (scenario.edges ?? []).map((edge) => {
        const pairKey = `${edge.from}->${edge.to}`;
        const occurrence = (pairCounts.get(pairKey) ?? 0) + 1;
        pairCounts.set(pairKey, occurrence);
        return {
          id: `edge-${pairKey}-${occurrence}`,
          source: edge.from,
          target: edge.to,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#555" },
          animated: false,
        };
      });
    });
  }, [scenario, compareOverlay, deltaMap]);

  const commitEdgesToScenario = useCallback(
    (nextEdges: RFEdge[]) => {
      updateScenario((draft) => {
        draft.edges = nextEdges.map((edge) => ({
          from: edge.source,
          to: edge.target,
        }));
      });
    },
    [updateScenario]
  );

  const removeNodesFromScenario = useCallback(
    (ids: string[]) => {
      if (!ids.length) {
        return;
      }
      const toRemove = new Set(ids);
      updateScenario((draft) => {
        draft.nodes = (draft.nodes ?? []).filter((node) => !toRemove.has(node.id));
        draft.edges = (draft.edges ?? []).filter(
          (edge) => !toRemove.has(edge.from) && !toRemove.has(edge.to)
        );
      });
    },
    [updateScenario]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const removedIds = changes.filter((change) => change.type === "remove").map((change) => change.id);
      setNodes((current) => {
        const next = applyNodeChanges(changes, current);
        next.forEach((node) => {
          cachedPositions.current[node.id] = node.position;
        });
        return next;
      });
      if (removedIds.length) {
        setEdges((current) =>
          current.filter(
            (edge) => !removedIds.includes(edge.source) && !removedIds.includes(edge.target)
          )
        );
        removeNodesFromScenario(removedIds);
      }
    },
    [removeNodesFromScenario]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((current) => {
        const next = applyEdgeChanges(changes, current);
        if (changes.some((change) => change.type === "remove")) {
          commitEdgesToScenario(next);
        }
        return next;
      });
    },
    [commitEdgesToScenario]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      setEdges((current) => {
        const exists = current.some(
          (edge) => edge.source === connection.source && edge.target === connection.target
        );
        if (exists) {
          return current;
        }
        const next = addEdge(
          {
            ...connection,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#555" },
          },
          current
        );
        commitEdgesToScenario(next);
        return next;
      });
    },
    [commitEdgesToScenario]
  );

  const addNode = useCallback(
    (type: NodeType) => {
      if (!scenario) {
        return;
      }
      const existingIds = new Set((scenario.nodes ?? []).map((node) => node.id));
      const nextId = generateNodeId(type, existingIds);
      updateScenario((draft) => {
        draft.nodes = [
          ...(draft.nodes ?? []),
          {
            id: nextId,
            type,
          },
        ];
      });
    },
    [scenario, updateScenario]
  );

  if (!scenario) {
    return (
      <div style={{ marginTop: 20, padding: 16, border: "1px solid #f4c2c2", borderRadius: 8, color: "#a33" }}>
        Invalid scenario JSON: fix the editor to use the board.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Board</div>
          <div style={{ fontSize: 12, color: "#666" }}>Drag nodes and wire edges; updates the scenario JSON automatically.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {palette.map((entry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => addNode(entry.type)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              + {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onInit={(instance) => instance.fitView({ padding: 0.2 })}
          nodesDraggable
          nodesConnectable
          panOnScroll
          nodeTypes={nodeTypes}
        >
          <Background gap={20} size={1} color="#e6e6e6" />
          <Controls />
          <Panel position="bottom-left" style={{ fontSize: 12, color: "#555", background: "rgba(255,255,255,0.9)", padding: "6px 10px", borderRadius: 6 }}>
            Tip: select a node/edge and press Delete to remove it.
          </Panel>
        </ReactFlow>
      </div>
      <OverlayLegend visible={compareOverlay === "A-vs-B" && (nodeDeltas?.length ?? 0) > 0} />
    </div>
  );
}

function gridPosition(index: number): Position {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return { x: 80 + column * 180, y: 60 + row * 140 };
}

function generateNodeId(type: NodeType, existing: Set<string>): string {
  let counter = 1;
  let candidate = `${type}-${counter}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${type}-${counter}`;
  }
  return candidate;
}
