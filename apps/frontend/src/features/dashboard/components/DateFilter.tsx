export type DatePreset = "today" | "yesterday" | "custom";

export interface DateFilterProps {
  active: DatePreset;
  customDate: string;
  onChange: (preset: DatePreset, customDate?: string) => void;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "custom", label: "Custom" },
];

export function DateFilter({ active, customDate, onChange }: DateFilterProps) {
  return (
    <div className="date-filter" role="group" aria-label="Date range">
      {PRESETS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`date-filter__tab${active === key ? " date-filter__tab--active" : ""}`}
          onClick={() => onChange(key)}
          aria-pressed={active === key}
        >
          {label}
        </button>
      ))}
      {active === "custom" && (
        <input
          type="date"
          className="date-filter__input"
          value={customDate}
          onChange={(e) => onChange("custom", e.target.value)}
          aria-label="Select date"
        />
      )}
    </div>
  );
}
