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
  category: string;
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

export function buildUpdateProductFormData(v: ProductFormValues): FormData {
  const fd = new FormData();
  fd.append('name', v.name);
  fd.append('description', v.description || '');
  fd.append('price', String(v.price));
  fd.append('category', v.category || '');
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
  return fd;
}
