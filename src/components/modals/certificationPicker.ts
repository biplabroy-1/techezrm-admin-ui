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
 * - `?? ''` and not `|| ''`, and the reason is NOT "they differ for this field" -
 *   for a `string | null | undefined` they are identical, verified exhaustively in
 *   Bun and Node. They diverge only on falsy values that are not nullish (`0`,
 *   `false`, `NaN`), which a `String` schema field cannot hold. What `??` buys is
 *   that it substitutes ONLY for absence, so it can never fabricate a replacement
 *   for a value that was actually there; `||` would launder a malformed stored
 *   value into a plausible empty string. `the operator never fabricates a
 *   replacement for a value that is present` is the test that pins that.
 *
 *   Separately, the fallback itself is load-bearing, and THAT part both operators
 *   agree on: `DietaryAttribute` declares all three fields as required and the
 *   subdocument schema has no `_id` and no optional `logo`, so an absent icon must
 *   become `''` rather than stay `undefined` - `JSON.stringify` DROPS an undefined
 *   property, which would send an entry with two keys where the migration wrote
 *   three.
 */
export function toDietaryAttribute(cert: CertificationType): DietaryAttribute {
  return {
    title: cert.name,
    logo: cert.iconName ?? '',
    certificateLink: cert.fileUrl ?? '',
  };
}

/**
 * Ascending `displayOrder`.
 *
 * Sorts a COPY. The input is the react-query cache's array, and the
 * certifications admin screen renders from that same cache - an in-place sort
 * would silently reorder its table too.
 *
 * NO TIEBREAK, and that is a deliberate non-defence rather than an oversight.
 * An earlier version of this comment claimed the original-index tiebreak was
 * protecting against an unstable comparator, and cited `EZ-PI-00239` - the one
 * product that stores `"ISO 45001:2018"` twice - as the input that would go in
 * wrong. Both halves of that were wrong: `Array.prototype.sort` has been stable
 * by specification since ES2019 (verified identical in Bun 1.4.2 and Node 24), and
 * this function is only ever called on CATALOGUE rows inside
 * `attachableCertifications` - attached entries never pass through it, so a
 * duplicated title was never an input. Deleting the tiebreak left every test
 * green, which is the proof the property was never pinned. A comment explaining a
 * bug that cannot occur is worse than no comment, so the rule here is only the
 * one that is true: order by `displayOrder`, ascending, and leave equal keys
 * wherever the engine's stability guarantee puts them.
 */
export function sortByDisplayOrder(
  types: CertificationType[]
): CertificationType[] {
  return [...types].sort((a, b) => a.displayOrder - b.displayOrder);
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
 * Whether the catalogue can be trusted yet.
 *
 * This exists because the picker's most damaging failure is not a wrong answer -
 * it is a confident one. The first version of this file asked a single question,
 * `isRetiredCertification(types, title)`, and answered `true` whenever no matching
 * row was found. On a failed request `types` is `[]`, so EVERY attached entry
 * reported "retired": a product with six live certifications rendered as six grey
 * `(retired)` chips asserting "no longer offered by the active catalogue", with
 * the add control disabled and no reason on screen. The admin's reasonable
 * response - detach them - is the one action the whole picker was added to
 * enable. An empty catalogue is a fact about the NETWORK, not about the
 * certifications, and the two must not be rendered identically.
 *
 * There is deliberately NO default value for this parameter. A defaulted `status`
 * would be a fresh way to write the original bug, so every caller has to state
 * which world it is in.
 */
export type CatalogueStatus = 'loading' | 'error' | 'ready';

/**
 * What the catalogue says about one attached entry.
 *
 * - `active`  - the row exists and is active
 * - `retired` - the row was deactivated, or deleted outright. Only ever returned
 *               for a LOADED catalogue; it is a claim about the catalogue, so it
 *               needs a catalogue to make it against.
 * - `unknown` - the catalogue has not loaded, so nothing is claimed either way
 */
export type CertificationStanding = 'active' | 'retired' | 'unknown';

/**
 * The standing of one attached entry, given what we know about the catalogue.
 *
 * The asymmetry with the rest of the file is the point: 'retired' is a STATEMENT
 * ABOUT THE CATALOGUE, and `attachableCertifications` is free to withhold
 * inactive rows because withholding is the conservative choice. This is not -
 * labelling a live certification "retired" is an assertion, and the only states
 * in which the picker is entitled to make one are those where the catalogue
 * actually arrived.
 *
 * The picker's rejected alternative was to render attached entries only when
 * their type is still active. A certification the product genuinely carries would
 * then be invisible in the editor while still being written on every save, so the
 * admin would see an empty list over a product that has six, any count would be a
 * lie, and detaching everything VISIBLE would leave a hidden one attached. So
 * 'retired' entries are shown and labelled - see `EditProductModal`'s chip list -
 * and 'unknown' entries are shown unlabelled, because there is nothing to label.
 */
export function certificationStanding(
  types: CertificationType[],
  title: string,
  status: CatalogueStatus
): CertificationStanding {
  if (status !== 'ready') return 'unknown';
  const type = findCertificationType(types, title);
  return !type || !type.isActive ? 'retired' : 'active';
}

/** Everything the two modals need to render the picker for one product. */
export interface PickerState {
  /** The add control's options. Empty unless the catalogue is ready. */
  attachable: CertificationType[];
  /**
   * Whether the add control can be used at all: the catalogue is loaded AND
   * something is left to add. A disabled control with no explanation is the other
   * half of the original bug, so the caller gets a reason from `status`.
   */
  canAttach: boolean;
  /** One standing per attached entry, in the attached list's own order. */
  standings: CertificationStanding[];
  /** How many entries are genuinely retired - the only number worth showing as one. */
  retiredCount: number;
  /**
   * How many entries the catalogue could not speak for. Non-zero means the chip
   * list is incomplete in a way the admin must be told about, NOT a reason to
   * change any of them.
   */
  unknownCount: number;
}

/**
 * The picker's derived state for one product, for one of the three worlds.
 *
 * The statuses are handled separately rather than by folding them into an empty
 * `types` array, because they call for DIFFERENT screens: a loading catalogue
 * wants a spinner and a disabled control, a failed one wants an error and a
 * disabled control, and only a loaded one may make claims about retirement.
 */
export function pickerState(args: {
  status: CatalogueStatus;
  types: CertificationType[];
  attached: DietaryAttribute[];
}): PickerState {
  const { status, types, attached } = args;
  // Nothing is offered from a catalogue that is not here. `attachableCertifications`
  // already returns [] for an empty list, so this is belt-and-braces for the case
  // where a previous load is still cached while a refetch is in flight - offering
  // from stale rows during a loading state would be its own lie.
  const attachable =
    status === 'ready' ? attachableCertifications(types, attached) : [];
  const standings = attached.map((entry) =>
    certificationStanding(types, entry.title, status)
  );
  return {
    attachable,
    canAttach: status === 'ready' && attachable.length > 0,
    standings,
    retiredCount: standings.filter((s) => s === 'retired').length,
    unknownCount: standings.filter((s) => s === 'unknown').length,
  };
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
