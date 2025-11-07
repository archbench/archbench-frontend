import { useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioPreset } from "../data/scenarios";

type Props = {
  presets: ScenarioPreset[];
  activeId: string | null;
  onSelect: (presetId: string) => void;
  onShowBrief: (presetId: string) => void;
};

export default function ScenarioSelector({ presets, activeId, onSelect, onShowBrief }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activePreset = useMemo(() => presets.find((preset) => preset.id === activeId) ?? null, [presets, activeId]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return presets.filter((preset) => preset.label.toLowerCase().includes(lower));
  }, [presets, query]);

  return (
    <div className="scenario-selector" ref={containerRef}>
      <button type="button" className="scenario-selector__button" onClick={() => setOpen((prev) => !prev)}>
        {activePreset ? activePreset.label : "Select scenario"}
      </button>
      <button
        type="button"
        className="scenario-selector__info"
        onClick={() => activePreset && onShowBrief(activePreset.id)}
        aria-label="Show scenario brief"
        disabled={!activePreset}
      >
        ℹ️
      </button>
      {open ? (
        <div className="scenario-selector__menu">
          <input
            type="text"
            placeholder="Search scenarios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul>
            {filtered.map((preset) => (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(preset.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {preset.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? <li className="inspector-empty">No scenarios</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
