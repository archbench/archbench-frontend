import { useState, type ReactNode } from "react";

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
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="inspector-tabs">
      <div className="inspector-tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === current?.id}
            className={`inspector-tabs__button ${tab.id === current?.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="inspector-tabs__panel" role="tabpanel">
        {current?.content}
      </div>
    </div>
  );
}
