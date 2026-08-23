import type { FormEvent } from "react";
import { Button } from "@/components/ui";
import type { PaymentDatePreset } from "../history.types";

const PRESETS: { key: PaymentDatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "custom", label: "Custom" },
];

export interface PaymentHistoryFiltersProps {
  preset: PaymentDatePreset;
  customFrom: string;
  customTo: string;
  searchValue: string;
  isSearching: boolean;
  onPresetChange: (preset: PaymentDatePreset) => void;
  onCustomRangeChange: (from: string, to: string) => void;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
}

export function PaymentHistoryFilters({
  preset,
  customFrom,
  customTo,
  searchValue,
  isSearching,
  onPresetChange,
  onCustomRangeChange,
  onSearchValueChange,
  onSearchSubmit,
  onClearSearch,
}: PaymentHistoryFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchSubmit();
  }

  return (
    <div className="phistory-filters">
      <div className="date-filter date-filter--inline" role="group" aria-label="Date range">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`date-filter__tab${preset === key ? " date-filter__tab--active" : ""}`}
            onClick={() => onPresetChange(key)}
            aria-pressed={preset === key}
          >
            {label}
          </button>
        ))}
        {preset === "custom" && (
          <span className="phistory-filters__custom">
            <input
              type="date"
              className="date-filter__input"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomRangeChange(e.target.value, customTo)}
              aria-label="From date"
            />
            <span aria-hidden="true">–</span>
            <input
              type="date"
              className="date-filter__input"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomRangeChange(customFrom, e.target.value)}
              aria-label="To date"
            />
          </span>
        )}
      </div>

      <form
        className="payments-search payments-search--compact"
        role="search"
        onSubmit={handleSubmit}
      >
        <label className="payments-search__label" htmlFor="payment-history-search">
          Search Order #
        </label>
        <input
          id="payment-history-search"
          className="payments-search__input"
          type="search"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Order number e.g. 1024"
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
        />
        <Button variant="outline" size="md" type="submit">
          Search
        </Button>
        {isSearching && (
          <Button variant="ghost" size="md" type="button" onClick={onClearSearch}>
            Clear
          </Button>
        )}
      </form>
    </div>
  );
}
