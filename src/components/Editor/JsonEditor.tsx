type Props = {
  value: string;
  onChange: (next: string) => void;
};

export default function JsonEditor({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="scenario-json-editor" className="text-sm font-medium text-muted">
        Scenario JSON
      </label>
      <textarea
        id="scenario-json-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[220px] rounded-md border border-border bg-black/5 p-3 font-mono text-sm leading-[1.3] text-text outline-none transition focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-borderDark dark:bg-white/5 dark:text-white"
      />
    </div>
  );
}
