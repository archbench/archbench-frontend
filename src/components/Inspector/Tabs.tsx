import { useMemo, useState, type ReactNode } from "react";

export type InspectorTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type Props = {
  tabs: InspectorTab[];
};

export default function Tabs({ tabs }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const current = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab, tabs]);
  const panelId = "inspector-panel";

  if (!tabs.length) {
    return null;
  }

  return (
    <div className="flex h-full w-full max-w-[500px] flex-col gap-4 overflow-y-auto px-4 py-4">
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2 shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
        role="tablist"
        aria-label="Inspector sections"
      >
        {tabs.map((tab) => {
          const tabId = `inspector-tab-${tab.id}`;
          const isActive = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isActive
                  ? "bg-black/5 text-text dark:bg-white/10 dark:text-white"
                  : "text-muted hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="rounded-md border border-border bg-surface p-4 shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
        role="tabpanel"
        id={panelId}
        aria-labelledby={current ? `inspector-tab-${current.id}` : undefined}
      >
        {current?.content}
      </div>
    </div>
  );
}
