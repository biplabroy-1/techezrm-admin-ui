/**
 * The multipart payload `EditProductModal` sends to
 * `PUT /private/products/:id`.
 *
 * Extracted from the component so the shape of what goes on the wire can be
 * asserted without a DOM or a React renderer - neither is installed here, and
 * adding one is out of scope for this change.
 *
 * The field name strings are load-bearing: they are the keys the multer fields on
 * the server arrive as, and a typo here is a silently discarded field rather than
 * an error.
 */

export interface DietaryAttribute {
  title: string;
  logo: string;
  certificateLink: string;
}

export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  /**
   * The PRIMARY category, as a category `_id`.
   *
   * Kept even though `categoryIds` carries the full set. `Products.category` is a
   * single String ref that `product.service.ts:104` filters on and the products
   * table's Category column reads; blanking it would break every single-category
   * filter on the storefront.
   */
  category: string;
  /**
   * The full set of category `_id`s, as selected in the multi-select.
   *
   * Empty means "not sent" here: a product with no links has nothing to change,
   * and the create endpoint has no links to create before the product exists. An
   * admin who deselects everything on an EXISTING product clears the set through
   * `setProductCategories` instead, which is the only write that can express it.
   */
  categoryIds?: string[];
  inStock: boolean;
  status: string;
  moq?: number;
  unit?: string;
  appearance?: string;
  bannerImage?: string;
  images?: string[];
  /**
   * Facet slugs, e.g. `vegan`. `product.service.ts:86` filters on them
   * (`tags: { $in: filter.tag }`) and the storefront's tag facets are derived from
   * the stored values themselves, so whatever is stored is what filters on.
   *
   * Sent exactly as the box holds it - never re-derived from the facet list, which
   * is what used to rewrite this and the three fields below. This is the one field
   * where a comma genuinely separates values, and it is the only one the server
   * still comma-splits; `EditProductModal`'s tag control is a free-text box, so an
   * admin typing "vegan, gluten-free" does mean two tags.
   */
  tags?: string[];
  /** Free-form spec rows. Keys are stored verbatim, trailing space included. */
  specifications?: Record<string, string>;
  dietaryAttributes?: DietaryAttribute[];
  /**
   * Free text, one entry per string, commas included. The migration writes real
   * content here - `functions` holds flattened CAS data like `"CAS No: 14281-83-5"`
   * and `"Source: Coffee, tea, guarana (synthetic or natural)"`, and applications
   * hold display names like `"Bone & joint health"`. Slugifying any of it
   * destroyed the value on the first admin save; comma-SPLITTING it, which the
   * server used to do, destroys it just as silently.
   */
  applications?: string[];
  functions?: string[];
  /**
   * ISO country codes as stored, e.g. `["IN", "US"]` - the storefront's country
   * facet and filter both match on `countryCode`, so a name would never be found.
   */
  countryOfOrigin?: string[];
}

/**
 * Always serialises a value, including when empty.
 *
 * An admin save replaces the whole form, so an emptied field must arrive as
 * `{}` / `[]` / the field's empty value. Skipping an empty value would make the
 * server ignore the field and the previously-saved rows would survive a delete the
 * admin believed they had made: `updateProduct` guards `parseJsonField` on the key
 * being present, so an absent key is "leave alone", not "clear".
 *
 * Every list this serialises is sent as a JSON ARRAY, which is also what makes the
 * entry boundaries survive: the server's per-field comma decision
 * (`PRODUCT_STRING_LIST_FIELDS`) only ever applies to a value that is not JSON, so
 * `["Source: Coffee, tea, guarana"]` is one entry no matter which field it is.
 */
export function appendReplaceJson<T>(fd: FormData, key: string, value: T) {
  fd.append(key, JSON.stringify(value ?? null));
}

/** Omits the key entirely when empty - correct for fields that are truly optional. */
export function appendJsonIfPresent<T>(
  fd: FormData,
  key: string,
  value: T[] | Record<string, string> | undefined
) {
  if (value == null) return;
  const empty = Array.isArray(value) ? value.length === 0 : Object.keys(value).length === 0;
  if (empty) return;
  fd.append(key, JSON.stringify(value));
}

/**
 * The primary category id: the admin's explicit pick when there is one, else the
 * first of the multi-select.
 *
 * Exported because the rule is not obvious and both callers need it identically.
 * `categoryIds[0]` is MUI's own ordering guarantee (it preserves selection order),
 * so this is the first category the admin clicked rather than an arbitrary one.
 */
export function primaryCategoryId(v: {
  category?: string;
  categoryIds?: string[];
}): string {
  return v.category || v.categoryIds?.[0] || '';
}

export function buildUpdateProductFormData(v: ProductFormValues): FormData {
  const fd = new FormData();
  fd.append('name', v.name);
  fd.append('description', v.description || '');
  fd.append('price', String(v.price));
  // Derived, never `v.category` directly: the multi-select is the source of truth,
  // and passing a stale `v.category` alongside a changed `categoryIds` would leave
  // Products.category pointing at a category the admin just removed.
  fd.append('category', primaryCategoryId(v));
  fd.append('inStock', String(v.inStock));
  fd.append('status', v.status);
  fd.append('moq', v.moq?.toString() || '');
  fd.append('unit', v.unit || '');
  fd.append('appearance', v.appearance || '');
  fd.append('bannerImage', v.bannerImage || '');
  // Sent even when empty, like the lists below: `if (v.images?.length)` meant an
  // admin who deleted the last image sent no `images` key at all, and the server's
  // presence guard (`decodeProductFields` writes only what the body carries) then
  // left the stored gallery alone - the delete silently undid itself. New file
  // uploads still win server-side: `updateProduct` only overrides `images` from
  // `uploaded.images` when multer actually received files.
  appendReplaceJson(fd, 'images', v.images ?? []);
  // Full-form replace, so these are sent even when empty.
  appendReplaceJson(fd, 'specifications', v.specifications ?? {});
  appendReplaceJson(fd, 'dietaryAttributes', v.dietaryAttributes ?? []);
  /**
   * The four list fields, exactly as they are held.
   *
   * `handleSubmit` used to slugify these against `filtersData` before appending,
   * which turned `"CAS No: 14281-83-5"` into `cas-no-14281-83-5` on the first
   * admin save and destroyed the CAS number. They are moved here as they are held:
   * no case folding, no whitespace collapsing, no facet lookup. `tags` is included
   * in that rule even though it is the one field that really is slugs
   * (`product.service.ts:86` filters on it) - the box the admin types into already
   * holds the value, and re-deriving it here is what caused the damage.
   *
   * END TO END, "as they are held" is now exact, and it is worth saying why: it
   * takes this builder AND the server's per-field comma decision. Every one of
   * these is serialised as a JSON array, so the server receives the entry
   * boundaries intact - `PRODUCT_STRING_LIST_FIELDS` splits on commas for `tags`
   * only (an admin typing "vegan, gluten-free" means two tags), while
   * `applications`, `functions` and `countryOfOrigin` opted out. That matters
   * because migrated prose is full of commas: "Source: Coffee, tea, guarana" is
   * ONE entry, and with the split on it arrived as two broken ones. This comment
   * claimed "verbatim" while the server was still tearing entries in half.
   *
   * `countryOfOrigin` holds ISO codes, so the country picker stores
   * `country.countryCode` and labels it `country.name` - see `countryOptions`.
   *
   * `appendReplaceJson`, not `appendJsonIfPresent`: the admin save is a
   * full-form replace, so clearing the last tag must arrive as `[]`. An absent key
   * is read server-side as "leave alone".
   */
  appendReplaceJson(fd, 'tags', v.tags ?? []);
  appendReplaceJson(fd, 'applications', v.applications ?? []);
  appendReplaceJson(fd, 'functions', v.functions ?? []);
  appendReplaceJson(fd, 'countryOfOrigin', v.countryOfOrigin ?? []);
  // NOT appendReplaceJson, and the difference is deliberate. `categoryIds` is
  // optional here because this builder serves both create and update, and on create
  // the product has no `_id` yet so there are no links to write. Sending `[]` on
  // create would be a meaningless "clear every category" for a product that has
  // none. The update path clears an emptied set through setProductCategories.
  appendJsonIfPresent(fd, 'categoryIds', v.categoryIds);
  return fd;
}
