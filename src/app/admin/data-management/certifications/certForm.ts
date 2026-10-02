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
    // NEVER trim this. It is the row's identity, not a label: 236 products store
    // the catalogue's names in `dietaryAttributes[].title`, copied verbatim out of
    // Supabase, and the tenth row of `certification_types` is stored as "HACCP "
    // - with a trailing space. Trimming renamed that row to "HACCP" on any save,
    // including a save that only flipped `isActive`, so the catalogue stopped
    // matching 236 products' stored titles. It fails SILENTLY: the product-side
    // picker compares trimmed, so nothing looks broken until something compares
    // the strings exactly. Send it byte for byte.
    name: form.name,
    // `description` and `iconName` ARE still trimmed, and that asymmetry is
    // deliberate: no product references either of them, so normalising them can
    // only lose stray whitespace, never sever a reference. Trimming is not what
    // made this field unclearable - the `|| undefined` above was - so both keep
    // being sent unconditionally, where '' still clears.
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
 *
 * That claim is only true because this DELEGATES to `buildCertPayload` rather than
 * rebuilding the payload. It did not used to: `name` was trimmed inside the builder,
 * so the toggle inherited the trim and the row was renamed by a control whose
 * entire job was to flip a boolean. `description` and `iconName` are still
 * normalised here - that is not a rename or a reorder, and it matches what the save
 * path does - but `name` now round-trips byte for byte, which is what makes
 * "cannot accidentally rename a row" true rather than merely intended.
 */
export function buildCertTogglePayload(
  row: CertFormState & { _id: string }
): CertPayload {
  return buildCertPayload({ ...row, isActive: !row.isActive });
}