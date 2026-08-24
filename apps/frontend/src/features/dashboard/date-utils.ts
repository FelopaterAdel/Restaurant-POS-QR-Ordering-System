export const RESTAURANT_TIMEZONE = "Africa/Cairo";

const CAIRO_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: RESTAURANT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sat: 0,
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
};

/** Returns the calendar date (YYYY-MM-DD) of an instant in the restaurant timezone. */
export function cairoDateString(instant: Date = new Date()): string {
  return CAIRO_DATE_FORMAT.format(instant);
}

/** Adds days to a YYYY-MM-DD string without timezone drift. */
export function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));

  return next.toISOString().slice(0, 10);
}

function weekdayIndexOfDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));

  return WEEKDAY_INDEX[weekday];
}

/**
 * The restaurant week runs Saturday -> Friday and is anchored to the
 * current Cairo local date, not the viewer's device clock.
 */
export function getWeekRange(
  now: Date = new Date(),
): { from: string; to: string } {
  const today = cairoDateString(now);
  const weekdayIndex = weekdayIndexOfDate(today);

  const from = addDaysToDateString(today, -weekdayIndex);
  const to = addDaysToDateString(from, 6);

  return { from, to };
}

/** Formats a YYYY-MM-DD string as a short label, e.g. "Aug 22". */
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

/** Formats a YYYY-MM-DD string as a long label, e.g. "Saturday, Aug 22, 2026". */
export function formatLongDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
