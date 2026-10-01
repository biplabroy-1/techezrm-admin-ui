/**
 * Pure logic behind the certification-type admin screen.
 *
 * Extracted from `page.tsx` so it can be tested without a renderer - neither
 * @testing-library nor a jsdom environment is installed here, and adding one is out
 * of scope. The alternative would be asserting on nothing, or source-reading the
 * page and calling that coverage.
 *
 * What lives here is the mutation payload, and specifically which fields are able to
 * be CLEARED. That is where the bug was.
 */

export interface CertFormState {
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  /** Set by the upload; '' means "no PDF". */
  fileUrl: string;
}

export interface CertPayload {
  name: string;
  description: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  fileUrl: string;
}

/**
 * The mutation body for create and update alike.
 *
 * EVERY field is always sent, including empty ones.
 *
 * `findByIdAndUpdate` strips `undefined` (verified against this mongoose version:
 * `_castUpdate` drops it), so a key sent as `undefined` does not clear the stored
 * value - it leaves it, and the caller gets a success response. That made three
 * "clear this field" controls no-ops:
 *
 *   - `iconName: form.iconName.trim() || undefined` - an icon could never be removed.
 *   - `...(form.fileUrl ? { fileUrl } : {})` - which made the "PDF uploaded" chip's
 *     own `onDelete`, a control whose entire purpose is to clear the field, a
 *     complete no-op. Reopen the dialog and the PDF was still there.
 *   - the same shape for `description`.
 *
 * Each of those presented a way to clear something and silently did not. Every
 * field is now sent unconditionally, so '' clears and only '' clears.
 *
 * `displayOrder` and `isActive` are the two falsy values that matter most: 0 is the
 * legitimate "show this row first", and `isActive: false` is the only way to take a
 * row off the storefront's certification strip.
 */
export function buildCertPayload(form: CertFormState): CertPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    iconName: form.iconName.trim(),
    displayOrder: Number(form.displayOrder) || 0,
    isActive: form.isActive,
    fileUrl: form.fileUrl,
  };
}

/**
 * The payload for the inline `isActive` toggle.
 *
 * Carries every field rather than just `isActive`, because this writes through the
 * general `PUT /:id` and a partial write is at the mercy of whatever the server
 * decides an absent key means. Sending the row's own values makes the toggle's
 * effect exactly "isActive is now the other value" and nothing else - it cannot
 * accidentally rename a row or reorder the list as a side effect of being toggled.
 */
export function buildCertTogglePayload(
  row: CertFormState & { _id: string }
): CertPayload {
  return buildCertPayload({ ...row, isActive: !row.isActive });
}