import { test, expect } from '../../../test-utils/bunTest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildUpdateProductFormData,
  primaryCategoryId,
} from '../../../components/modals/buildUpdateProductFormData';

/**
 * The multi-category payload has to agree with the server, and there is no way to
 * run either side here - no HTTP, no React, no renderer installed. So the tests are
 * in two parts: pure-function assertions on the form-data builder (which need no
 * DOM), and source reads for the parts that only exist inside a service method.
 *
 * The source reads are weaker than a live call, deliberately so: they catch the
 * failure mode that actually bites - a renamed field or a wrong URL silently
 * writing nothing - without inventing a mock layer whose fidelity nobody checks.
 */
const SRC = join(__dirname, '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

/* ---- the pure part: what the edit form puts on the wire ---- */

const VALUES = {
  name: 'Creatine',
  description: 'd',
  price: 2500,
  category: '',
  inStock: true,
  status: 'active',
};

test('category stays the first selected id, so the single-ref filters keep working', () => {
  // `Products.category` is a single String ref read by product.service.ts:104 and
  // the products table's Category column. If the primary were dropped while the
  // links were written, those filters would match nothing.
  const fd = buildUpdateProductFormData({
    ...VALUES,
    categoryIds: ['cat-a', 'cat-b', 'cat-c'],
  });

  expect(fd.get('category')).toBe('cat-a');
  expect(fd.get('categoryIds')).toBe('["cat-a","cat-b","cat-c"]');
});

test('an explicit category wins over the first selected id', () => {
  expect(
    buildUpdateProductFormData({
      ...VALUES,
      category: 'cat-pinned',
      categoryIds: ['cat-a', 'cat-b'],
    }).get('category')
  ).toBe('cat-pinned');
});

test('no selection at all leaves category empty rather than writing "undefined"', () => {
  const fd = buildUpdateProductFormData({ ...VALUES, categoryIds: [] });

  expect(fd.get('category')).toBe('');
  // An absent key, not "[]": on create the product has no _id yet, so there are no
  // links to clear, and an empty set is the form's "not selected" not "delete all".
  expect(fd.get('categoryIds')).toBeNull();
});

test('primaryCategoryId falls back through every shape the forms produce', () => {
  expect(primaryCategoryId({ category: 'c', categoryIds: ['a'] })).toBe('c');
  expect(primaryCategoryId({ categoryIds: ['a', 'b'] })).toBe('a');
  expect(primaryCategoryId({ category: '', categoryIds: [] })).toBe('');
  expect(primaryCategoryId({})).toBe('');
});

test('the existing replace-semantics fields are unaffected by the new one', () => {
  // Regression guard: adding categoryIds must not make these conditional. They are
  // sent even when empty, because the server reads an absent key as "leave alone"
  // and an admin's delete would otherwise be silently undone.
  const fd = buildUpdateProductFormData({ ...VALUES, categoryIds: ['a'] });

  expect(fd.get('specifications')).toBe('{}');
  expect(fd.get('dietaryAttributes')).toBe('[]');
});

/* ---- productService: the two new endpoints ---- */

test('productService reads and writes a product category set', () => {
  const src = read('products.ts');

  expect(src).toContain('getProductCategories');
  // GET /private/products/:id/categories
  expect(src).toMatch(
    /getProductCategories[\s\S]{0,400}?api\.get\(\s*`\$\{this\.baseUrl\}\/\$\{id\}\/categories`/
  );

  expect(src).toContain('setProductCategories');
  // PUT /private/products/:id/categories
  expect(src).toMatch(
    /setProductCategories[\s\S]{0,400}?api\.put\(\s*`\$\{this\.baseUrl\}\/\$\{id\}\/categories`/
  );
});

test('the category write posts the whole set under categoryIds', () => {
  const src = read('products.ts');
  const body = src.slice(src.indexOf('setProductCategories'));

  // The server's parseCategoryIds reads `body.categoryIds` and rejects anything
  // else, so this key name is load-bearing, not cosmetic. A bare array 400s.
  expect(body).toMatch(/categoryIds/);
});

/* ---- the endpoint paths the server actually registered ---- */

test('the paths this client calls are the ones the server registers', () => {
  const products = read('products.ts');
  const certs = read('certificationTypes.ts');
  const faqs = read('faqs.ts');

  expect(products).toContain("'/private/products'");
  expect(certs).toContain("'/private/certification-types'");
  expect(products).toMatch(/id\}\/categories/);
  expect(faqs).toContain("'/private/faqs'");
  expect(faqs).toContain('/bulk/orders');
});

test('the FAQ service posts the { orderUpdates } shape the server reads', () => {
  const faqs = read('faqs.ts');
  // faq.controller.ts:349 destructures `const { orderUpdates } = req.body`. Sending
  // a bare array instead would 400 with "orderUpdates must be an array".
  expect(faqs).toMatch(/bulk\/orders`[\s\S]{0,80}?orderUpdates/);
});

test('the FAQ key filter offers exactly the enum the schema allows', () => {
  const faqs = read('faqs.ts');
  // A key outside the server's enum fails schema validation on save, and a filter
  // for one the enum rejects returns nothing forever.
  for (const key of [
    'product',
    'general',
    'shipping',
    'payment',
    'account',
    'technical',
    'other',
  ]) {
    expect(faqs).toContain(`'${key}'`);
  }
});

/* ---- the two screens ---- */

/**
 * SRC is `src/api/services`; the screens live at `src/app/...`, which is two
 * levels up from SRC.
 */
const readApp = (p: string) =>
  readFileSync(join(SRC, '..', '..', 'app', 'admin', 'data-management', p), 'utf8');

test('the FAQ screen writes orders through the bulk endpoint, swapping neighbours', () => {
  const page = readApp('faqs/page.tsx');

  expect(page).toContain('faqService.bulkUpdateOrders');
  // Two rows in one call: a one-sided update leaves two FAQs sharing an `order`,
  // and the server sorts by `{ order: 1 }` so the tie resolves arbitrarily - the
  // button would appear to do nothing on some saves.
  expect(page).toMatch(/bulkUpdateOrders\(\s*\[\s*\{ id:[\s\S]{0,200}?\{ id:/);
});

test('the certification screen uploads through the endpoint that exists', () => {
  const page = readApp('certifications/page.tsx');

  // `upload.routes.ts` declares /single-local and /single-cloud. `/single` does
  // not exist, and a stored fileUrl has to be a cloud URL for the storefront to
  // read it, so this must be /single-cloud.
  expect(page).toContain('/private/upload/single-cloud');
  expect(page).not.toContain("'/private/upload/single'");
  // The URL is nested at data.file.url; reading data.url would store `undefined`.
  expect(page).toContain('data?.file?.url');
});

test('both screens list every field the models declare', () => {
  // A missing column is a field the admin cannot see or fix, which is the whole
  // point of these screens.
  const certPage = readApp('certifications/page.tsx');
  for (const field of [
    'name',
    'description',
    'iconName',
    'displayOrder',
    'isActive',
    'fileUrl',
  ]) {
    expect(certPage).toContain(field);
  }

  const faqPage = readApp('faqs/page.tsx');
  for (const field of ['question', 'answer', 'entityId', 'order', 'isActive']) {
    expect(faqPage).toContain(field);
  }
});

test('both new screens are reachable from the sidebar', () => {
  // A screen with no nav entry is only reachable by typing its URL, which is how a
  // maintained page starts looking like a deleted one. The sidebar lives in the
  // admin layout, not next to the pages.
  const layout = readFileSync(join(SRC, '..', '..', 'app', 'admin', 'layout.tsx'), 'utf8');

  expect(layout).toContain('/admin/data-management/faqs');
  expect(layout).toContain('/admin/data-management/certifications');
});

test('both new screens are reachable from the global search', () => {
  const search = readFileSync(
    join(SRC, '..', '..', 'components', 'GlobalSearchModal.tsx'),
    'utf8'
  );

  expect(search).toContain('/admin/data-management/faqs');
  expect(search).toContain('/admin/data-management/certifications');
});

test('the FAQ screen reads the count from pagination, not a top-level total', () => {
  const page = readApp('faqs/page.tsx');
  // faq.controller.ts responds { success, data, pagination: { total, ... } }. A
  // top-level read yields undefined -> 0 -> "0 FAQs" above a populated table, which
  // is the bug the Categories listing had.
  expect(page).toContain('pagination?.total');
  expect(page).not.toMatch(/faqsData\?\.total\b/);
});