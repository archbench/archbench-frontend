import { useMemo } from "react";
import { safeParse } from "../utils/json";
import type {
    Scenario,
    Node,
    DbConfig,
    DbTable,
    DbColumn,
    DbEngine,
    DbColumnType,
} from "../types/api";

type NumericField = "latencyMs" | "varianceFactor" | "capacityRps" | "failureRate" | "costPerHour";

type Props = {
    scenarioJson: string;
    onScenarioChange: (newJson: string) => void;
}

export default function NodeParameters({ scenarioJson, onScenarioChange }: Props) {
    const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);

    if (!scenario) {
        return <div style={{ marginTop: 16, color: "red" }}>Invalid JSON — fix the editor to edit parameters.</div>;
    }

    const handleChange = (idx: number, field: NumericField, value: string) => {
        const next = structuredClone(scenario);
        const node = next.nodes[idx];
        if (!node) {
            return;
        }

        const trimmed = value.trim();
        if (trimmed === "") {
            const updated: Node = { ...node };
            delete updated[field];
            next.nodes[idx] = updated;
        } else {
            const parsed = Number(trimmed);
            if (Number.isNaN(parsed)) {
                const updated: Node = { ...node };
                delete updated[field];
                next.nodes[idx] = updated;
            } else {
                next.nodes[idx] = { ...node, [field]: parsed } as Node;
            }
        }
        onScenarioChange(JSON.stringify(next, null, 2));
    };

    const updateDbConfig = (idx: number, mutate: (config: DbConfig) => void) => {
        const next = structuredClone(scenario);
        const node = next.nodes[idx];
        const config: DbConfig = node.dbConfig ? structuredClone(node.dbConfig) : {};
        mutate(config);
        const sanitized = sanitizeDbConfig(config);
        if (sanitized) {
            node.dbConfig = sanitized;
        } else {
            delete node.dbConfig;
        }
        onScenarioChange(JSON.stringify(next, null, 2));
    };

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
                        {n.type === "database" ? (
                            <DbConfigSection
                                node={n}
                                onMutate={(mutate) => updateDbConfig(idx, mutate)}
                            />
                        ) : null}
                    </div>
                ))
            ) : (
                <div style={{ opacity: 0.7 }}>No nodes in scenario.</div>
            )}
        </div>
    );
}

function sanitizeDbConfig(config: DbConfig): DbConfig | undefined {
    const next: DbConfig = {};

    if (config.engine) {
        next.engine = config.engine;
    }

    if (config.tables && config.tables.length) {
        const cleanedTables: DbTable[] = config.tables.map((table) => {
            const name = table.name ?? "";
            const sizeClass = table.sizeClass;
            const indexes = table.indexes?.map((idx) => idx.trim()).filter(Boolean) ?? [];
            const columns = table.columns
                ?.map<DbColumn | undefined>((col) => {
                    const trimmedName = col.name?.trim() ?? "";
                    if (!trimmedName) {
                        return undefined;
                    }
                    return { name: trimmedName, type: col.type };
                })
                .filter((col): col is DbColumn => Boolean(col));

            const cleaned: DbTable = { name };
            if (sizeClass) {
                cleaned.sizeClass = sizeClass;
            }
            if (indexes.length) {
                cleaned.indexes = indexes;
            }
            if (columns && columns.length) {
                cleaned.columns = columns;
            }
            return cleaned;
        }).filter((table) => {
            return Boolean(table.name?.trim() || table.sizeClass || table.indexes?.length || table.columns?.length);
        });

        if (cleanedTables.length) {
            next.tables = cleanedTables;
        }
    }

    return Object.keys(next).length ? next : undefined;
}

function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: NumericField;
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

function DbConfigSection({
    node,
    onMutate,
}: {
    node: Node;
    onMutate: (mutate: (config: DbConfig) => void) => void;
}) {
    const tables = node.dbConfig?.tables ?? [];
    const engine = node.dbConfig?.engine ?? "";

    const setEngine = (value: string) => {
        onMutate((config) => {
            if (value === "") {
                delete config.engine;
            } else {
                config.engine = value as DbEngine;
            }
        });
    };

    const addTable = () => {
        onMutate((config) => {
            const currentTables = [...(config.tables ?? [])];
            const newIndex = currentTables.length + 1;
            currentTables.push({ name: `table_${newIndex}` });
            config.tables = currentTables;
        });
    };

    const removeTable = (tableIdx: number) => {
        onMutate((config) => {
            const currentTables = [...(config.tables ?? [])];
            currentTables.splice(tableIdx, 1);
            config.tables = currentTables;
        });
    };

    const updateTable = (tableIdx: number, updater: (table: DbTable) => DbTable) => {
        onMutate((config) => {
            const currentTables = [...(config.tables ?? [])];
            const table = currentTables[tableIdx] ?? { name: "" };
            currentTables[tableIdx] = updater(structuredClone(table));
            config.tables = currentTables;
        });
    };

    const addColumn = (tableIdx: number) => {
        updateTable(tableIdx, (table) => {
            const columns = [...(table.columns ?? [])];
            const newIndex = columns.length + 1;
            columns.push({ name: `column_${newIndex}`, type: "string" });
            return { ...table, columns };
        });
    };

    const removeColumn = (tableIdx: number, columnIdx: number) => {
        updateTable(tableIdx, (table) => {
            const columns = [...(table.columns ?? [])];
            columns.splice(columnIdx, 1);
            return { ...table, columns };
        });
    };

    const updateColumn = (
        tableIdx: number,
        columnIdx: number,
        field: keyof DbColumn,
        value: string
    ) => {
        updateTable(tableIdx, (table) => {
            const columns = [...(table.columns ?? [])];
            const column = structuredClone(columns[columnIdx] ?? { name: "", type: "string" as DbColumnType });
            if (field === "type") {
                column.type = value as DbColumnType;
            } else {
                column.name = value;
            }
            columns[columnIdx] = column;
            return { ...table, columns };
        });
    };

    const setTableIndexes = (tableIdx: number, value: string) => {
        const parsed = value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
        updateTable(tableIdx, (table) => ({
            ...table,
            indexes: parsed.length ? parsed : undefined,
        }));
    };

    return (
        <div style={{ marginTop: 16, background: "#fafafa", borderRadius: 8, padding: 12, border: "1px solid #eee" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>DB Config</div>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <label style={{ opacity: 0.8 }}>Engine</label>
                <select
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
                >
                    <option value="">Select engine</option>
                    <option value="postgres">postgres</option>
                    <option value="mysql">mysql</option>
                    <option value="dynamodb">dynamodb</option>
                    <option value="mongo">mongo</option>
                </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>Tables</span>
                <button type="button" onClick={addTable} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc", background: "white" }}>
                    Add table
                </button>
            </div>

            {tables.length === 0 ? (
                <div style={{ fontSize: 14, opacity: 0.7 }}>No tables yet.</div>
            ) : (
                tables.map((table, tableIdx) => (
                    <div key={`${table.name}-${tableIdx}`} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontWeight: 500 }}>Table {tableIdx + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeTable(tableIdx)}
                                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #f5a8a8", background: "#fff5f5", color: "#cc4444" }}
                            >
                                Remove
                            </button>
                        </div>

                        <LabeledInput
                            label="name"
                            value={table.name ?? ""}
                            onChange={(value) => updateTable(tableIdx, (current) => ({ ...current, name: value }))}
                        />

                        <LabeledSelect
                            label="sizeClass"
                            value={table.sizeClass ?? ""}
                            placeholder="Select size"
                            options={[
                                { value: "S", label: "S" },
                                { value: "M", label: "M" },
                                { value: "L", label: "L" },
                            ]}
                            onChange={(value) => updateTable(tableIdx, (current) => ({
                                ...current,
                                sizeClass: value === "" ? undefined : value as DbTable["sizeClass"],
                            }))}
                        />

                        <LabeledInput
                            label="indexes"
                            placeholder="idx_email, idx_created_at"
                            value={table.indexes?.join(", ") ?? ""}
                            onChange={(value) => setTableIndexes(tableIdx, value)}
                        />

                        <div style={{ marginTop: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <span style={{ opacity: 0.8 }}>Columns</span>
                                <button
                                    type="button"
                                    onClick={() => addColumn(tableIdx)}
                                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc", background: "white" }}
                                >
                                    Add column
                                </button>
                            </div>
                            {(table.columns ?? []).length === 0 ? (
                                <div style={{ fontSize: 14, opacity: 0.7 }}>No columns.</div>
                            ) : (
                                (table.columns ?? []).map((column, columnIdx) => (
                                    <div key={`${column.name}-${columnIdx}`} style={{ border: "1px solid #eee", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                            <span style={{ fontWeight: 500 }}>Column {columnIdx + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeColumn(tableIdx, columnIdx)}
                                                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #f5a8a8", background: "#fff5f5", color: "#cc4444" }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <LabeledInput
                                            label="name"
                                            value={column.name ?? ""}
                                            onChange={(value) => updateColumn(tableIdx, columnIdx, "name", value)}
                                        />
                                        <LabeledSelect
                                            label="type"
                                            value={column.type}
                                            options={[
                                                { value: "string", label: "string" },
                                                { value: "number", label: "number" },
                                                { value: "boolean", label: "boolean" },
                                                { value: "json", label: "json" },
                                            ]}
                                            onChange={(value) => updateColumn(tableIdx, columnIdx, "type", value || "string")}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

function LabeledInput({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <label style={{ opacity: 0.8 }}>{label}</label>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
            />
        </div>
    );
}

function LabeledSelect({
    label,
    value,
    onChange,
    placeholder,
    options,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <label style={{ opacity: 0.8 }}>{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}
            >
                {placeholder ? <option value="">{placeholder}</option> : null}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
