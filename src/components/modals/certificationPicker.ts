/**
 * The certification picker behind the product forms.
 *
 * `dietaryAttributes` is a per-product list of `{ title, logo, certificateLink }`
 * subdocuments, and the global `certification_types` collection is a catalogue of
 * names an admin can point a product at. The picker is the bridge between them.
 *
 * Extracted from `EditProductModal` for the reason `buildUpdateProductFormData.ts`
 * and `specRows.ts` are: no DOM renderer is installed here, and the failure this
 * guards against is invisible at runtime anyway. A wrong mapping answers 200 and
 * rewrites the certifications of every product an admin ever saved. 236 products
 * carry this field, so the mapping is pinned by test against the exact values the
 * migration wrote.
 *
 * One rule the whole file obeys: an ATTACHED entry is never rebuilt from its type.
 * The stored subdocument is the unit of truth and is passed through byte for byte;
 * `toDietaryAttribute` runs exactly once, on the entry an admin is adding. See
 * `attachCertification`.
 */

import type { DietaryAttribute } from './buildUpdateProductFormData';
import type { CertificationType } from '../../api/services/certificationTypes';

export type { DietaryAttribute };

/**
 * The mapping, in full:
 *
 *   { title: cert.name, logo: cert.iconName ?? '', certificateLink: cert.fileUrl ?? '' }
 *
 * Every part of that is load-bearing:
 *
 * - `title` is the type's NAME, and it is stored VERBATIM - including the trailing
 *   space. The catalogue's tenth row is literally named `"HACCP "`, and 236
 *   products store exactly that. Trimming it here would leave the attached entry
 *   and the catalogue row unable to find each other, so the type would be offered
 *   again and an admin could add a second, near-identical HACCP chip to a product
 *   that already has one.
 * - `logo` is the MUI ICON NAME (`"FileCheck"`, `"USFDAIcon"`), not an image URL.
 *   `ProductDetailsModal` was rendering it as `<Image src>`, which asks the browser
 *   to fetch the string "FileCheck" as a relative path and renders a broken image
 *   for every certification on the product. It is text now, next to the name.
 * - `?? ''` and not `|| ''`: the two are the same for a string, but the fallback
 *   exists to keep the stored shape total. `DietaryAttribute` declares all three
 *   fields as required, and the subdocument schema has no `_id` and no optional
 *   `logo`, so a missing icon must become `''` rather than `undefined` - which
 *   `JSON.stringify` drops from the object entirely, producing an entry with only
 *   two keys where the migration wrote three.
 */
export function toDietaryAttribute(cert: CertificationType): DietaryAttribute {
  return {
    title: cert.name,
    logo: cert.iconName ?? '',
    certificateLink: cert.fileUrl ?? '',
  };
}

/**
 * Ascending `displayOrder`, stable for equal keys.
 *
 * The tiebreak on the ORIGINAL index is not decoration. `EZ-PI-00239` carries
 * `"ISO 45001:2018"` twice, and any comparator that returns 0 for equal keys makes
 * the relative order of those two entries arbitrary - which means the payload
 * could differ between two identical no-op saves. The catalogue's own
 * `displayOrder` is not unique either (`buildCertPayload` lets two rows take the
 * same number, and nothing in the schema forbids it), so a unique key cannot be
 * assumed.
 *
 * Sorts a COPY. The input is the react-query cache's array; sorting it in place
 * would reorder what the certifications admin screen renders from the same cache.
 */
export function sortByDisplayOrder(
  types: CertificationType[]
): CertificationType[] {
  return types
    .map((type, index) => ({ type, index }))
    .sort(
      (a, b) => a.type.displayOrder - b.type.displayOrder || a.index - b.index
    )
    .map(({ type }) => type);
}

/**
 * Titles are compared TRIMMED, and only for matching purposes.
 *
 * `title` is the only field both sides are guaranteed to have, so it is what
 * identifies "is this certification already attached". The comparison is trimmed
 * purely so that a stored `"HACCP "` and a catalogue row named `"HACCP "` are
 * recognised as the same certification rather than two - the value is still stored
 * and displayed verbatim everywhere. Never used to write a title.
 */
function titleKey(title: string): string {
  return title.trim();
}

/**
 * The catalogue row an attached entry came from, if there still is one.
 *
 * An exact match wins over a trimmed one, so a stored `"HACCP "` finds the row
 * that is also called `"HACCP "` rather than some other row that merely trims to
 * the same thing. Returns `undefined` when the row has been deleted from the
 * catalogue - which is a real state, and one the caller has to be able to see.
 */
export function findCertificationType(
  types: CertificationType[],
  title: string
): CertificationType | undefined {
  return (
    types.find((type) => type.name === title) ??
    types.find((type) => titleKey(type.name) === titleKey(title))
  );
}

/**
 * True when the attached entry is not offered by the catalogue any more: the row
 * was deactivated, or deleted outright.
 *
 * The picker's alternative was to render attached entries only when their type is
 * still active. That was rejected: a certification the product genuinely carries
 * would be invisible in the editor while still being written on every save, so the
 * admin would see an empty list over a product that has six, the "3
 * certifications" count would be a lie, and detaching everything VISIBLE would
 * leave a hidden one attached. Retired entries are shown, and labelled - see
 * `EditProductModal`'s chip list.
 */
export function isRetiredCertification(
  types: CertificationType[],
  title: string
): boolean {
  const type = findCertificationType(types, title);
  return !type || !type.isActive;
}

/**
 * What the "Add certification" control offers: active rows the product does not
 * already have, in `displayOrder` order.
 *
 * INACTIVE ROWS ARE NOT OFFERED, and that is the asymmetry with the chip list
 * rather than a contradiction of it. `isActive` is the flag the storefront's
 * certification strip reads (`buildCertPayload` documents it as "the only way to
 * take a row off the strip"), so an inactive row is a kind the catalogue has
 * retired: attaching a new one would attach something the storefront will not
 * show. Existing attachments are a different question - those are already on
 * products, and hiding them is what would lose data.
 *
 * Also filtered out: rows with a blank name, which would produce a titleless chip
 * and an entry the picker could then never find again (its own title key is `''`).
 */
export function attachableCertifications(
  types: CertificationType[],
  attached: DietaryAttribute[]
): CertificationType[] {
  const held = new Set(attached.map((entry) => titleKey(entry.title)));
  return sortByDisplayOrder(
    types.filter(
      (type) =>
        type.isActive &&
        type.name.trim() !== '' &&
        !held.has(titleKey(type.name))
    )
  );
}

/**
 * Attach a catalogue row: append the derived entry, leave every existing entry
 * untouched.
 *
 * The append is the whole operation. Nothing is rebuilt, re-derived, re-sorted or
 * re-cased, because a save that did not touch this control must produce the array
 * it was given - 236 products would otherwise be rewritten by an admin editing a
 * price, with a 200 and no diff to show for it.
 *
 * Two no-ops return the SAME ARRAY REFERENCE, so a React state update that
 * changes nothing also re-renders nothing:
 *
 * - the type is already attached (compared trimmed, per `titleKey`)
 * - the type has no name, and so has no title to store
 */
export function attachCertification(
  attached: DietaryAttribute[],
  cert: CertificationType
): DietaryAttribute[] {
  if (!cert.name.trim()) return attached;
  const title = titleKey(cert.name);
  if (attached.some((entry) => titleKey(entry.title) === title)) return attached;
  return [...attached, toDietaryAttribute(cert)];
}

/**
 * Detach ONE entry, by index.
 *
 * By index, not by title, because `EZ-PI-00239` stores `"ISO 45001:2018"` twice
 * and every other chip list in these modals deletes by value - which on that
 * product would drop both rows from a click on one of the two chips. An admin
 * cannot see which of two identical chips they clicked, so "remove the one I
 * clicked" has to be the contract.
 *
 * Returns the same array for an out-of-range index rather than throwing, so a
 * stale click cannot take the form down.
 */
export function detachCertificationAt(
  attached: DietaryAttribute[],
  index: number
): DietaryAttribute[] {
  if (index < 0 || index >= attached.length) return attached;
  return attached.filter((_, i) => i !== index);
}
