/**
 * Row model behind the specifications editor.
 *
 * `specifications` is `Schema.Types.Mixed` on the server because the Supabase
 * source keys are inconsistent - "Purity/Assay" vs "Purity assay", "Shelf Life "
 * with a trailing space. So the editor is a free key/value list rather than a
 * fixed set of named fields, and every transformation between the stored object
 * and the list of inputs lives here where it can be tested without a DOM.
 *
 * One rule the whole file obeys: a key is only ever *trimmed*, never
 * case-normalised and never collapsed internally. "Shelf Life " and "Shelf Life"
 * are two different specs in the source data and merging them would silently
 * destroy one of them.
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
 * The key is stored VERBATIM. The trim below is only a "has the admin finished
 * this row?" test, never a rewrite of what gets stored, and that distinction is
 * load-bearing: the migrated catalogue holds both `"Shelf Life "` and
 * `"Shelf Life"`, which are two different specs. Storing the trimmed key would
 * collapse them into one, so simply opening the product and pressing Update
 * would rename a spec and drop the other. Values are never trimmed at all.
 */
export function rowsToSpec(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    if (key.trim()) out[key] = value;
  }
  return out;
}
