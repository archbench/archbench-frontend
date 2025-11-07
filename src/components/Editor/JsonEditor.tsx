type Props = {
  value: string;
  onChange: (next: string) => void;
};

export default function JsonEditor({ value, onChange }: Props) {
  return (
    <div className="json-editor">
      <label htmlFor="scenario-json-editor">Scenario JSON</label>
      <textarea
        id="scenario-json-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
