import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import { Field, Input, Select } from "@/components/forms/Form";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DbColumn, DbColumnType, DbConfig, DbEngine, DbTable, Scenario } from "@/types/api";
import { safeParse } from "@/utils/json";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
};

type DialogTarget = { nodeIndex: number; tableIndex: number } | null;

const ENGINE_OPTIONS: { value: DbEngine; label: string }[] = [
  { value: "postgres", label: "Postgres" },
  { value: "mysql", label: "MySQL" },
  { value: "dynamodb", label: "DynamoDB" },
  { value: "mongo", label: "MongoDB" },
];

const SIZE_OPTIONS: { value: DbTable["sizeClass"]; label: string }[] = [
  { value: "S", label: "Small (S)" },
  { value: "M", label: "Medium (M)" },
  { value: "L", label: "Large (L)" },
];

const COLUMN_TYPES: DbColumnType[] = ["string", "number", "boolean"];

export default function DbInspector({ scenarioJson, onScenarioChange }: Props) {
  const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const [columnDialog, setColumnDialog] = useState<DialogTarget>(null);
  const [indexDialog, setIndexDialog] = useState<DialogTarget>(null);
  const [columnDraft, setColumnDraft] = useState<DbColumn>({ name: "", type: "string" });
  const [indexDraft, setIndexDraft] = useState("");
  const [columnError, setColumnError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  if (!scenario) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
        Invalid JSON — fix the editor to edit DB config.
      </div>
    );
  }

  const databaseNodes =
    scenario.nodes
      ?.map((node, index) => ({ node, index }))
      .filter(({ node }) => node.type === "database") ?? [];

  if (!databaseNodes.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-surface px-4 py-6 text-center text-sm text-textMuted dark:border-borderDark/60 dark:bg-surfaceDark">
        No database nodes available.
      </div>
    );
  }

  const updateDbConfig = (nodeIndex: number, mutate: (config: DbConfig) => void) => {
    const next = structuredClone(scenario);
    const target = next.nodes[nodeIndex];
    if (!target) {
      return;
    }
    const draft: DbConfig = structuredClone(target.dbConfig ?? {});
    mutate(draft);
    const sanitized = sanitizeDbConfig(draft);
    if (sanitized) {
      target.dbConfig = sanitized;
    } else {
      delete target.dbConfig;
    }
    onScenarioChange(JSON.stringify(next, null, 2));
  };

  const openColumnDialog = (target: DialogTarget) => {
    setColumnDraft({ name: "", type: "string" });
    setColumnError(null);
    setColumnDialog(target);
  };

  const openIndexDialog = (target: DialogTarget) => {
    setIndexDraft("");
    setIndexError(null);
    setIndexDialog(target);
  };

  const handleAddColumn = () => {
    if (!columnDialog) {
      return;
    }
    if (!columnDraft.name.trim()) {
      setColumnError("Column name is required.");
      return;
    }
    updateDbConfig(columnDialog.nodeIndex, (config) => {
      const tables = [...(config.tables ?? [])];
      const nextTable = structuredClone(tables[columnDialog.tableIndex] ?? { name: "" });
      const columns = [...(nextTable.columns ?? [])];
      columns.push({ name: columnDraft.name.trim(), type: columnDraft.type });
      nextTable.columns = columns;
      tables[columnDialog.tableIndex] = nextTable;
      config.tables = tables;
    });
    setColumnDialog(null);
  };

  const handleAddIndex = () => {
    if (!indexDialog) {
      return;
    }
    if (!indexDraft.trim()) {
      setIndexError("Index name is required.");
      return;
    }
    updateDbConfig(indexDialog.nodeIndex, (config) => {
      const tables = [...(config.tables ?? [])];
      const nextTable = structuredClone(tables[indexDialog.tableIndex] ?? { name: "" });
      const indexes = [...(nextTable.indexes ?? [])];
      indexes.push(indexDraft.trim());
      nextTable.indexes = indexes;
      tables[indexDialog.tableIndex] = nextTable;
      config.tables = tables;
    });
    setIndexDialog(null);
  };

  const handleRemoveColumn = (nodeIndex: number, tableIndex: number, columnIndex: number) => {
    updateDbConfig(nodeIndex, (config) => {
      const tables = [...(config.tables ?? [])];
      const nextTable = structuredClone(tables[tableIndex] ?? { name: "" });
      const columns = [...(nextTable.columns ?? [])];
      columns.splice(columnIndex, 1);
      nextTable.columns = columns;
      tables[tableIndex] = nextTable;
      config.tables = tables;
    });
  };

  const handleRemoveIndex = (nodeIndex: number, tableIndex: number, index: number) => {
    updateDbConfig(nodeIndex, (config) => {
      const tables = [...(config.tables ?? [])];
      const nextTable = structuredClone(tables[tableIndex] ?? { name: "" });
      const indexes = [...(nextTable.indexes ?? [])];
      indexes.splice(index, 1);
      nextTable.indexes = indexes;
      tables[tableIndex] = nextTable;
      config.tables = tables;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Database</p>
        <p className="text-sm text-textMuted">Manage engines, table definitions, and indexes.</p>
      </div>

      <div className="space-y-4">
        {databaseNodes.map(({ node, index }) => (
          <section
            key={node.id ?? index}
            className="space-y-4 rounded-md border border-border bg-surface p-4 shadow-card dark:border-borderDark dark:bg-surfaceDark"
          >
            <header className="flex flex-col gap-0.5 text-sm">
              <span className="font-semibold text-foreground">{node.id || `db-${index}`}</span>
              <span className="text-textMuted">Database node</span>
            </header>

            <Field
              label="Engine"
              htmlFor={`db-engine-${index}`}
              description="Select the primary database engine."
            >
              {({ describedBy }) => (
                <Select
                  id={`db-engine-${index}`}
                  value={node.dbConfig?.engine ?? ""}
                  aria-describedby={describedBy}
                  onChange={(event) => {
                    const value = event.target.value as DbEngine | "";
                    updateDbConfig(index, (config) => {
                      if (!value) {
                        delete config.engine;
                      } else {
                        config.engine = value;
                      }
                    });
                  }}
                >
                  <option value="">Select engine</option>
                  {ENGINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="space-y-2 rounded-md border border-dashed border-border/60 p-3 dark:border-borderDark/60">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Tables</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    updateDbConfig(index, (config) => {
                      const tables = [...(config.tables ?? [])];
                      tables.push({ name: `table_${tables.length + 1}` });
                      config.tables = tables;
                    })
                  }
                >
                  Add table
                </Button>
              </div>
              <p className="text-xs text-textMuted">Model table shape so the engine can estimate storage & IO.</p>
            </div>

            {(node.dbConfig?.tables ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 px-4 py-6 text-center text-sm text-textMuted dark:border-borderDark/60">
                No tables defined yet.
              </div>
            ) : (
              node.dbConfig?.tables?.map((table, tableIndex) => {
                const nameError = table.name?.trim() ? undefined : "Table name is required.";
                const sizeId = `${node.id ?? index}-table-${tableIndex}-size`;
                return (
                  <article
                    key={`${table.name}-${tableIndex}`}
                    className="space-y-3 rounded-md border border-border/80 bg-surfaceMuted p-4 dark:border-borderDark/70 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">Table {tableIndex + 1}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateDbConfig(index, (config) => {
                            const tables = [...(config.tables ?? [])];
                            tables.splice(tableIndex, 1);
                            config.tables = tables;
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <Field
                      label="Table name"
                      htmlFor={`${node.id ?? index}-table-${tableIndex}-name`}
                      description="Displayed across inspectors and docs."
                      error={nameError}
                    >
                      {({ describedBy }) => (
                        <Input
                          id={`${node.id ?? index}-table-${tableIndex}-name`}
                          value={table.name ?? ""}
                          aria-describedby={describedBy}
                          invalid={Boolean(nameError)}
                          onChange={(event) =>
                            updateDbConfig(index, (config) => {
                              const tables = [...(config.tables ?? [])];
                              const nextTable = structuredClone(tables[tableIndex] ?? { name: "" });
                              nextTable.name = event.target.value;
                              tables[tableIndex] = nextTable;
                              config.tables = tables;
                            })
                          }
                        />
                      )}
                    </Field>

                    <Field
                      label="Size class"
                      htmlFor={sizeId}
                      description="Rough storage footprint for planner heuristics."
                    >
                      {({ describedBy }) => (
                        <Select
                          id={sizeId}
                          value={table.sizeClass ?? ""}
                          aria-describedby={describedBy}
                          onChange={(event) =>
                            updateDbConfig(index, (config) => {
                              const tables = [...(config.tables ?? [])];
                              const nextTable = structuredClone(tables[tableIndex] ?? { name: "" });
                              nextTable.sizeClass = event.target.value ? (event.target.value as DbTable["sizeClass"]) : undefined;
                              tables[tableIndex] = nextTable;
                              config.tables = tables;
                            })
                          }
                        >
                          <option value="">Select size</option>
                          {SIZE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>

                    <div className="space-y-2 rounded-md border border-border/70 bg-white p-3 dark:border-borderDark/60 dark:bg-zinc-900/60">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Columns</span>
                        <Button type="button" size="sm" onClick={() => openColumnDialog({ nodeIndex: index, tableIndex })}>
                          Add column
                        </Button>
                      </div>
                      {(table.columns ?? []).length === 0 ? (
                        <p className="text-xs text-textMuted">No columns yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {table.columns?.map((column, columnIndex) => (
                            <Badge key={`${column.name}-${columnIndex}`} variant="outline" className="gap-2">
                              <span className="text-xs">
                                {column.name} · {column.type}
                              </span>
                              <button
                                type="button"
                                className="text-xs text-danger hover:text-danger/80"
                                onClick={() => handleRemoveColumn(index, tableIndex, columnIndex)}
                              >
                                ×
                                <span className="sr-only">Remove column</span>
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 rounded-md border border-border/70 bg-white p-3 dark:border-borderDark/60 dark:bg-zinc-900/60">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Indexes</span>
                        <Button type="button" size="sm" onClick={() => openIndexDialog({ nodeIndex: index, tableIndex })}>
                          Add index
                        </Button>
                      </div>
                      <p className="text-xs text-textMuted">Add an index for primary lookup or filtering paths.</p>
                      {(table.indexes ?? []).length === 0 ? (
                        <p className="text-xs text-textMuted">No indexes yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {table.indexes?.map((idx, idxIndex) => (
                            <Badge key={`${idx}-${idxIndex}`} variant="outline" className="gap-2">
                              <span className="text-xs">{idx}</span>
                              <button
                                type="button"
                                className="text-xs text-danger hover:text-danger/80"
                                onClick={() => handleRemoveIndex(index, tableIndex, idxIndex)}
                              >
                                ×
                                <span className="sr-only">Remove index</span>
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ))}
      </div>

      <Dialog open={Boolean(columnDialog)} onOpenChange={(open) => (!open ? setColumnDialog(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
            <DialogDescription>Capture column name and type to inform storage estimates.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="Column name" htmlFor="column-name" required error={columnError ?? undefined}>
              {({ describedBy }) => (
                <Input
                  id="column-name"
                  value={columnDraft.name}
                  aria-describedby={describedBy}
                  invalid={Boolean(columnError)}
                  onChange={(event) => {
                    setColumnDraft((prev) => ({ ...prev, name: event.target.value }));
                    setColumnError(null);
                  }}
                />
              )}
            </Field>
            <Field label="Type" htmlFor="column-type">
              {({ describedBy }) => (
                <Select
                  id="column-type"
                  value={columnDraft.type}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    setColumnDraft((prev) => ({
                      ...prev,
                      type: (event.target.value as DbColumnType) || "string",
                    }))
                  }
                >
                  {COLUMN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setColumnDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddColumn}>
                Add column
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(indexDialog)} onOpenChange={(open) => (!open ? setIndexDialog(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add index</DialogTitle>
            <DialogDescription>Name the index so the planner can reason about lookups.</DialogDescription>
          </DialogHeader>
          <Field label="Index name" htmlFor="index-name" required error={indexError ?? undefined}>
            {({ describedBy }) => (
              <Input
                id="index-name"
                value={indexDraft}
                aria-describedby={describedBy}
                invalid={Boolean(indexError)}
                onChange={(event) => {
                  setIndexDraft(event.target.value);
                  setIndexError(null);
                }}
              />
            )}
          </Field>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIndexDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddIndex}>
                Add index
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        const name = table.name?.trim() ?? "";
        const sizeClass = table.sizeClass;
        const indexes = table.indexes?.map((idx) => idx.trim()).filter(Boolean) ?? [];
        const columns = table.columns
          ?.map<DbColumn | undefined>((column) => {
            const columnName = column.name?.trim() ?? "";
            if (!columnName) {
              return undefined;
            }
            return { name: columnName, type: column.type };
          })
          .filter((column): column is DbColumn => Boolean(column));

        const cleaned: DbTable = { name };
        if (sizeClass) {
          cleaned.sizeClass = sizeClass;
        }
        if (indexes.length) {
          cleaned.indexes = indexes;
        }
        if (columns?.length) {
          cleaned.columns = columns;
        }
        return cleaned;
      })
      .filter((table) => Boolean(table.name || table.sizeClass || table.indexes?.length || table.columns?.length));

    if (cleanedTables.length) {
      next.tables = cleanedTables;
    }
  }

  return Object.keys(next).length ? next : undefined;
}
