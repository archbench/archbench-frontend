import { useMemo } from "react";
import { safeParse } from "../../utils/json";
import type { Scenario, DbConfig, DbTable, DbColumn, DbColumnType, DbEngine } from "../../types/api";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
};

export default function DbInspector({ scenarioJson, onScenarioChange }: Props) {
  const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);

  if (!scenario) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
        Invalid JSON — fix the editor to edit DB config.
      </div>
    );
  }

  const databaseNodes =
    scenario.nodes?.map((node, index) => ({ node, index })).filter((entry) => entry.node.type === "database") ?? [];

  if (!databaseNodes.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-surface px-4 py-6 text-center text-sm text-muted dark:border-borderDark/60 dark:bg-surfaceDark">
        No database nodes available.
      </div>
    );
  }

  const updateDbConfig = (nodeIndex: number, mutate: (config: DbConfig) => void) => {
    const next = structuredClone(scenario);
    const target = next.nodes[nodeIndex];
    const config: DbConfig = target.dbConfig ? structuredClone(target.dbConfig) : {};
    mutate(config);
    const sanitized = sanitizeDbConfig(config);
    if (sanitized) {
      target.dbConfig = sanitized;
    } else {
      delete target.dbConfig;
    }
    onScenarioChange(JSON.stringify(next, null, 2));
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Database Inspector</h2>
      {databaseNodes.map(({ node, index }) => (
        <div
          key={node.id ?? index}
          className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4 shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
        >
          <div className="text-sm font-semibold text-text">{node.id || `db-${index}`}</div>

          <div className="field-row flex flex-col gap-1">
            <label className="text-sm font-medium text-muted">Engine</label>
            <select
              value={node.dbConfig?.engine ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                updateDbConfig(index, (config) => {
                  if (!value) {
                    delete config.engine;
                  } else {
                    config.engine = value as DbEngine;
                  }
                });
              }}
              className="text-input"
            >
              <option value="">Select engine</option>
              <option value="postgres">postgres</option>
              <option value="mysql">mysql</option>
              <option value="dynamodb">dynamodb</option>
              <option value="mongo">mongo</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-text">
            <span>Tables</span>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() =>
                updateDbConfig(index, (config) => {
                  const tables = [...(config.tables ?? [])];
                  tables.push({ name: `table_${tables.length + 1}` });
                  config.tables = tables;
                })
              }
            >
              Add table
            </button>
          </div>

          {(node.dbConfig?.tables ?? []).length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 bg-white/40 px-4 py-6 text-center text-sm text-muted dark:border-borderDark/60 dark:bg-transparent">
              No tables defined.
            </div>
          ) : (
            node.dbConfig?.tables?.map((table, tableIdx) => (
              <div
                key={`${table.name}-${tableIdx}`}
                className="flex flex-col gap-3 rounded-md border border-border bg-white/70 p-4 dark:border-borderDark dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-text">
                  <span>Table {tableIdx + 1}</span>
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                    onClick={() =>
                      updateDbConfig(index, (config) => {
                        const tables = [...(config.tables ?? [])];
                        tables.splice(tableIdx, 1);
                        config.tables = tables;
                      })
                    }
                  >
                    Remove
                  </button>
                </div>

                <LabeledInput
                  label="name"
                  value={table.name ?? ""}
                  onChange={(value) =>
                    updateDbConfig(index, (config) => {
                      const tables = [...(config.tables ?? [])];
                      const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                      nextTable.name = value;
                      tables[tableIdx] = nextTable;
                      config.tables = tables;
                    })
                  }
                />

                <LabeledSelect
                  label="sizeClass"
                  value={table.sizeClass ?? ""}
                  options={[
                    { value: "S", label: "S" },
                    { value: "M", label: "M" },
                    { value: "L", label: "L" },
                  ]}
                  placeholder="Select size"
                  onChange={(value) =>
                    updateDbConfig(index, (config) => {
                      const tables = [...(config.tables ?? [])];
                      const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                      nextTable.sizeClass = value === "" ? undefined : (value as DbTable["sizeClass"]);
                      tables[tableIdx] = nextTable;
                      config.tables = tables;
                    })
                  }
                />

                <LabeledInput
                  label="indexes"
                  placeholder="idx_email, idx_created_at"
                  value={table.indexes?.join(", ") ?? ""}
                  onChange={(value) =>
                    updateDbConfig(index, (config) => {
                      const tables = [...(config.tables ?? [])];
                      const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                      const parsed = value
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean);
                      nextTable.indexes = parsed.length ? parsed : undefined;
                      tables[tableIdx] = nextTable;
                      config.tables = tables;
                    })
                  }
                />

                <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-white/80 p-3 dark:border-borderDark/60 dark:bg-zinc-900/70">
                  <div className="flex items-center justify-between text-sm font-semibold text-text">
                    <span>Columns</span>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      onClick={() =>
                        updateDbConfig(index, (config) => {
                          const tables = [...(config.tables ?? [])];
                          const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                          const columns = [...(nextTable.columns ?? [])];
                          columns.push({ name: `column_${columns.length + 1}`, type: "string" });
                          nextTable.columns = columns;
                          tables[tableIdx] = nextTable;
                          config.tables = tables;
                        })
                      }
                    >
                      Add column
                    </button>
                  </div>
                  {(table.columns ?? []).length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-sm text-muted dark:border-borderDark/60">
                      No columns.
                    </div>
                  ) : (
                    table.columns?.map((column, columnIdx) => (
                      <div key={`${column.name}-${columnIdx}`} className="flex flex-col gap-3 rounded-md bg-white/60 p-3 dark:bg-zinc-950/40">
                        <div className="flex items-center justify-between text-sm font-semibold text-text">
                          <span>Column {columnIdx + 1}</span>
                          <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
                            onClick={() =>
                              updateDbConfig(index, (config) => {
                                const tables = [...(config.tables ?? [])];
                                const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                                const columns = [...(nextTable.columns ?? [])];
                                columns.splice(columnIdx, 1);
                                nextTable.columns = columns;
                                tables[tableIdx] = nextTable;
                                config.tables = tables;
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <LabeledInput
                          label="name"
                          value={column.name ?? ""}
                          onChange={(value) =>
                            updateDbConfig(index, (config) => {
                              const tables = [...(config.tables ?? [])];
                              const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                              const columns = [...(nextTable.columns ?? [])];
                              const nextColumn = structuredClone(
                                columns[columnIdx] ?? { name: "", type: "string" as DbColumnType }
                              );
                              nextColumn.name = value;
                              columns[columnIdx] = nextColumn;
                              nextTable.columns = columns;
                              tables[tableIdx] = nextTable;
                              config.tables = tables;
                            })
                          }
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
                          onChange={(value) =>
                            updateDbConfig(index, (config) => {
                              const tables = [...(config.tables ?? [])];
                              const nextTable = structuredClone(tables[tableIdx] ?? { name: "" });
                              const columns = [...(nextTable.columns ?? [])];
                              const nextColumn = structuredClone(
                                columns[columnIdx] ?? { name: "", type: "string" as DbColumnType }
                              );
                              nextColumn.type = (value || "string") as DbColumnType;
                              columns[columnIdx] = nextColumn;
                              nextTable.columns = columns;
                              tables[tableIdx] = nextTable;
                              config.tables = tables;
                            })
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function sanitizeDbConfig(config: DbConfig): DbConfig | undefined {
  const next: DbConfig = {};

  if (config.engine) {
    next.engine = config.engine;
  }

  if (config.tables && config.tables.length) {
    const cleanedTables: DbTable[] = config.tables
      .map((table) => {
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
      })
      .filter((table) => Boolean(table.name?.trim() || table.sizeClass || table.indexes?.length || table.columns?.length));

    if (cleanedTables.length) {
      next.tables = cleanedTables;
    }
  }

  return Object.keys(next).length ? next : undefined;
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
    <div className="field-row">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="text-input"
      />
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <select className="text-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
