import { useMemo } from "react";
import { safeParse } from "../utils/json";

type Props = {
    scenarioJson: string;
    onScenarioChange: (newJson: string) => void;
}

type Node = {
    id: string;
    type: string;
    latencyMs?: number;
    varianceFactor?: number;
    capacityRps?: number;
    failureRate?: number;
    costPerHour?: number;
}

type Scenario = {
    name: string;
    nodes: Node[];
    edges: { from: string; to: string }[];
}

export default function NodeParameters({ scenarioJson, onScenarioChange }: Props) {
    const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);

    if (!scenario) {
        return <div style={{ marginTop: 16, color: "red" }}>Invalid JSON — fix the editor to edit parameters.</div>;
    }

    const handleChange = (idx: number, field: keyof Node, value: string) => {
        const next = structuredClone(scenario) as Scenario;
        const node = next.nodes[idx];

        const numericFields: (keyof Node)[] = ["latencyMs", "varianceFactor", "capacityRps", "failureRate", "costPerHour"];
        if (numericFields.includes(field)) {
            const v = value.trim();
            if (v === "") {
                delete (node as any)[field];
            } else {
                const n = Number(v);
                (node as any)[field] = isNaN(n) ? undefined : n;
            }
        } else {
            (node as any)[field] = value;
        }

        onScenarioChange(JSON.stringify(next, null, 2));
    }

    return (
        <div style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 8 }}>Nodes Parameters</h2>
            {scenario.nodes?.length ? (
                scenario.nodes.map((n, idx) => (
                    <div key={n.id ?? idx} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                            {n.id || `<node-${idx}>`} <span style={{ opacity: 0.7 }}>({n.type})</span>
                        </div>

                        <Field
                            label="latencyMs"
                            value={n.latencyMs ?? ""}
                            placeholder="e.g. 8"
                            onChange={(v) => handleChange(idx, "latencyMs", v)}
                        />
                        <Field
                            label="varianceFactor"
                            value={n.varianceFactor ?? ""}
                            placeholder="e.g. 1.5"
                            onChange={(v) => handleChange(idx, "varianceFactor", v)}
                        />
                        <Field
                            label="capacityRps"
                            value={n.capacityRps ?? ""}
                            placeholder="e.g. 3000"
                            onChange={(v) => handleChange(idx, "capacityRps", v)}
                        />
                        <Field
                            label="failureRate"
                            value={n.failureRate ?? ""}
                            placeholder="e.g. 0.005"
                            onChange={(v) => handleChange(idx, "failureRate", v)}
                        />
                        <Field
                            label="costPerHour"
                            value={n.costPerHour ?? ""}
                            placeholder="e.g. 0.05"
                            onChange={(v) => handleChange(idx, "costPerHour", v)}
                        />
                    </div>
                ))
            ) : (
                <div style={{ opacity: 0.7 }}>No nodes in scenario.</div>
            )}
        </div>
    );
}

function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: number | string;
    placeholder?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <label style={{ opacity: 0.8 }}>{label}</label>
            <input
                type="text"
                value={String(value)}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
            />
        </div>
    );
}

