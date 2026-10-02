/**
 * Timezone-safe date formatting for values that are stored as calendar dates.
 *
 * WHY NOT toLocaleDateString()
 * -----------------------------
 * A date-only value such as "2026-10-02" is parsed by `new Date(...)` as UTC
 * midnight. Rendering that with `toLocaleDateString()` then shows whatever calendar
 * day the VIEWER's timezone lands on:
 *
 *   UTC            -> 02/10/2026
 *   America/New_York -> 01/10/2026     <- a day early
 *   Asia/Kolkata   -> 02/10/2026
 *
 * So the same stored date reads differently for different admins, and any of these
 * called during a server render disagrees with the client, which React reports as:
 *
 *   Hydration failed because the server rendered text didn't match the client
 *
 * That is not only a console error - React discards the server-rendered tree and
 * re-renders the whole page client-side.
 *
 * These helpers format the stored calendar date directly, with no Date parsing and
 * therefore no timezone to shift it. They are also deterministic, which is what
 * makes them safe to render on the server at all.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-10-02" (or any ISO-ish string starting with it) -> "2 Oct 2026". */
export function formatCalendarDate(value: string | undefined | null): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value; // not a date we recognise; show it rather than hide it
  const year = m[1];
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  const day = String(Number(m[3]));
  return `${day} ${month} ${year}`;
}

/** "2026-10-02" -> "2026-10-02". The value unchanged; for sortable columns. */
export function toISODate(value: Date | string | undefined | null): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/**
 * A date-time, for values that really are instants rather than calendar dates.
 *
 * These DO carry a timezone - they are timestamps - so they are formatted in the
 * viewer's zone on purpose. Still not safe to call during a server render, because
 * the server's zone is not the viewer's; render these only after mount.
 */
export function formatDateTime(value: string | number | Date | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}