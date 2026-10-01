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
  tags?: string[];
  /** Free-form spec rows. Keys are stored verbatim, trailing space included. */
  specifications?: Record<string, string>;
  dietaryAttributes?: DietaryAttribute[];
  applications?: string[];
  functions?: string[];
  countryOfOrigin?: string[];
}

/**
 * Always serialises `specifications` and `dietaryAttributes`, including when empty.
 *
 * An admin save replaces the whole form, so an emptied field must arrive as
 * `{}` / `[]`. Skipping an empty value would make the server ignore the field
 * and the previously-saved rows would survive a delete the admin believed they
 * had made: `updateProduct` guards `parseJsonField` on the key being present, so
 * an absent key is "leave alone", not "clear".
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
  if (v.images?.length) fd.append('images', JSON.stringify(v.images));
  // Full-form replace, so these two are sent even when empty.
  appendReplaceJson(fd, 'specifications', v.specifications ?? {});
  appendReplaceJson(fd, 'dietaryAttributes', v.dietaryAttributes ?? []);
  // NOT appendReplaceJson, and the difference is deliberate. `categoryIds` is
  // optional here because this builder serves both create and update, and on create
  // the product has no `_id` yet so there are no links to write. Sending `[]` on
  // create would be a meaningless "clear every category" for a product that has
  // none. The update path clears an emptied set through setProductCategories.
  appendJsonIfPresent(fd, 'categoryIds', v.categoryIds);
  return fd;
}
