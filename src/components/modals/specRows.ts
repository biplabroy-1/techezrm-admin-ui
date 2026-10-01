/**
 * Row model behind the specifications editor.
 *
 * `specifications` is `Schema.Types.Mixed` on the server because the Supabase
 * source keys are inconsistent - "Purity/Assay" vs "Purity assay", "Shelf Life "
 * with a trailing space. So the editor is a free key/value list rather than a
 * fixed set of named fields, and every transformation between the stored object
 * and the list of inputs lives here where it can be tested without a DOM.
 *
 * One rule the whole file obeys: a stored key is never rewritten. Not
 * case-folded, not whitespace-collapsed, and not trimmed. See `rowsToSpec` for
 * why the trim is the one that matters.
 */

export interface SpecRow {
  key: string;
  value: string;
}

const BLANK: SpecRow = { key: '', value: '' };

/** An empty spec renders one blank row, so the form is never an empty void. */
export function specToRows(spec?: Record<string, string>): SpecRow[] {
  const entries = Object.entries(spec ?? {});
  return entries.length
    ? entries.map(([key, value]) => ({ key, value: value ?? '' }))
    : [{ ...BLANK }];
}

export function specRowAdded(rows: SpecRow[]): SpecRow[] {
  return [...rows, { ...BLANK }];
}

/** Partial edit, so a keystroke in one field does not clear the other. */
export function specRowUpdated(
  rows: SpecRow[],
  index: number,
  patch: Partial<SpecRow>
): SpecRow[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export function specRowRemoved(rows: SpecRow[], index: number): SpecRow[] {
  const next = rows.filter((_, i) => i !== index);
  return next.length ? next : [{ ...BLANK }];
}

/**
 * Rows without a key are half-finished input, not data - drop them.
 *
 * The key is stored VERBATIM. `trim()` below is only a "has the admin finished
 * this row?" test, never a rewrite of what gets stored, and that distinction is
 * load-bearing: `out[key.trim()]` is the shorter and more readable line, and it
 * is wrong. 12 of the 240 migrated products are keyed `"Shelf Life "` with a
 * trailing space, so any save at all - including one where the admin only
 * touched the price - would rewrite that key to `"Shelf Life"` and answer 200.
 * No product carries both spellings, so no row is lost and no two rows collapse;
 * the damage is a silent rename, with no diff anywhere to show for it.
 * Values are never trimmed at all.
 */
export function rowsToSpec(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    if (key.trim()) out[key] = value;
  }
  return out;
}
