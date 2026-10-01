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

/* ---- I5: the FAQ screen must soft delete, not hard delete ---- */

test('the FAQ screen removes FAQs through the soft-delete endpoint', () => {
  const faqs = read('faqs.ts');
  const page = readApp('faqs/page.tsx');

  // faq.routes.ts exposes both `DELETE /:id` and `PATCH /:id/soft-delete`. On 717
  // migrated rows a hard delete is unrecoverable, and the migration script refuses a
  // non-empty target, so a re-import is not a safety net.
  expect(faqs).toContain('/soft-delete');

  // The page must call the soft delete, not the hard one. Comment-stripped: the
  // deleteMutation docstring names BOTH endpoints in order to explain the choice, so
  // matching raw source would find `remove` in prose.
  const code = readAppCode('faqs/page.tsx');
  expect(code).toContain('faqService.softDelete');
  expect(code).not.toContain('faqService.remove');

  // ...and must not reach past the service for a raw axios call either. Every HTTP
  // verb is checked, not just delete, because a page that bypassed faqService
  // entirely would evade the check above.
  //
  // This replaces a previous `not.toMatch(/api\.delete/)`, which was VACUOUS: `api.`
  // appeared zero times in the page, so the assertion could never fail and would have
  // stayed green through any number of hard deletes.
  expect(code).not.toMatch(/\bapi\.(get|post|put|patch|delete)\b/);

  // The service keeps a hard `remove` for other callers, so assert the page is what
  // avoids it - not that the method is gone.
  expect(faqs).toContain('async remove(');
  expect(faqs).toContain('async softDelete(');
});

test('the service exposes BOTH deletes, and only the page distinguishes them', () => {
  // Guards the shape of the test above. If a future change removed `softDelete` from
  // the service, `expect(faqs).toContain('/soft-delete')` and the page assertions
  // would still be checking something coherent, so the intent is pinned here: both
  // methods exist, and the choice of which to call belongs to the screen.
  const faqs = read('faqs.ts');

  expect(faqs).toMatch(/async remove\([\s\S]*?api\.delete\(`\$\{this\.baseUrl\}\/\$\{id\}`/);
  expect(faqs).toMatch(
    /async softDelete\([\s\S]*?api\.patch\(`\$\{this\.baseUrl\}\/\$\{id\}\/soft-delete`/
  );
});

test('the soft delete is a PATCH, matching the route the server registers', () => {
  const faqs = read('faqs.ts');
  // faq.routes.ts declares `router.patch("/:id/soft-delete", ...)`. A DELETE or POST
  // here would 404 on a method the router does not register.
  expect(faqs).toMatch(/api\.patch\(`\$\{this\.baseUrl\}\/\$\{id\}\/soft-delete`/);
});

test('the FAQ screen confirms a reorder to the admin, but stays silent on a no-op', () => {
  // Comment-stripped and scoped to the reorderMutation declaration: the surrounding
  // file carries comments that mention both `onSuccess` and `toast.success`, so a
  // looser pattern matches prose rather than the code under test.
  const code = readAppCode('faqs/page.tsx');
  const declStart = code.indexOf('const reorderMutation');
  expect(declStart).toBeGreaterThan(-1);
  const reorder = code.slice(declStart, code.indexOf('function openAdd', declStart));

  // A reorder has no visible effect until the list refetches, so without a success
  // toast the admin clicks the button and cannot tell it worked - indistinguishable
  // from the tie bug the swap guard prevents.
  expect(reorder).toMatch(/onSuccess[\s\S]*?toast\.success/);

  // ...but a move that found nothing to do must NOT claim success. react-query counts
  // a resolved `undefined` as success and calls `onSuccess`, so an unguarded early
  // return toasted "FAQ moved up" for a move that never happened.
  expect(reorder).toMatch(/if\s*\(\s*isReorderNoop\(result,\s*REORDER_NOOP\)\s*\)\s*return;/);
  expect(reorder).toMatch(/mutationFn[\s\S]*?return REORDER_NOOP;/);

  // The guard must come BEFORE the toast, or it guards nothing.
  // Order matters: a guard placed after the toast guards nothing. Compared as
  // numbers via Number(), because `String.prototype.indexOf` is typed to return a
  // number but the shim's `expect` is untyped `any` and arithmetic on that trips tsc.
  const guardAt = Number(reorder.indexOf('isReorderNoop(result'));
  const toastAt = Number(reorder.indexOf('toast.success'));
  expect(guardAt).toBeGreaterThan(-1);
  expect(toastAt).toBeGreaterThan(-1);
  expect(guardAt).toBeLessThan(toastAt);
});

test('the FAQ screen takes a new FAQ order from the collection, not the page', () => {
  const page = readApp('faqs/page.tsx');

  // Reading the max off the visible 25-row page meant every imported FAQ was created
  // at the same order as the largest row on screen. A single-row descending query is
  // the only thing that is correct regardless of pagination.
  expect(page).toContain("sortOrder: 'desc'");
  expect(page).toContain('maxOrderQuery');

  // The ORDER VALUE must read from that query, not merely coexist with it. Asserting
  // only that the identifier appears passes even when the call site has been
  // reverted to the page-derived max - which is the bug - because the declaration is
  // still there. This ties the two together.
  expect(page).toMatch(
    /order:\s*nextFaqOrder\(\s*maxOrderQuery\.data\?\.data\?\.\[0\]\?\.order/
  );
  // ...and the QUERY that feeds it must actually ask for the maximum.
  //
  // Anchored on the declaration and closed at the `})` that ends it, so this covers
  // ONLY the max-order query. Every attempt to bound it by a character count or by a
  // lazy quantifier instead matched somewhere else in the file and passed against the
  // exact regression it was written to catch - the main listing query legitimately
  // mentions `limit: 1`-adjacent params and sorts ascending, and a loose window finds
  // it. The assertion has to cover the whole queryFn body or it proves nothing.
  const declStart = page.indexOf('const maxOrderQuery');
  expect(declStart).toBeGreaterThan(-1);
  const declEnd = page.indexOf('});', page.indexOf('queryFn:', declStart));

  // Strip comments before asserting. The declaration carries a JSDoc block that
  // QUOTES the very params under test - so a naive `toContain("sortOrder: 'desc'")`
  // passes on the comment alone while the actual query has lost the parameter. That
  // is exactly what the earlier, looser version of this assertion did.
  const maxQueryDecl = page
    .slice(declStart, declEnd)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  expect(maxQueryDecl).toMatch(/limit:\s*1/);
  expect(maxQueryDecl).toMatch(/sortBy:\s*'order'/);
  expect(maxQueryDecl).toMatch(/sortOrder:\s*'desc'/);
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

/**
 * A page source with every comment stripped.
 *
 * MANDATORY before matching a page for a call, and this file was bitten by exactly
 * that twice:
 *
 *  1. The `maxOrderQuery` declaration carries a JSDoc block that QUOTES the very
 *     params under test, so `toContain("sortOrder: 'desc'")` passed on the comment
 *     while the real query had lost the parameter.
 *  2. Every one of these three page comments names the helper it is supposed to be
 *     calling - `buildFaqPayload`, `buildCertPayload`, `swapOrderUpdates` - in order
 *     to explain why the call matters. So `toContain('buildFaqPayload')` is satisfied
 *     by the prose alone.
 *
 * A comment quoting a string is indistinguishable from code calling it, so any
 * assertion that a page CALLS a helper must run against stripped source.
 */
function readAppCode(p: string): string {
  return readApp(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/** Byte offsets of each `identifier(` in the source. */
function callSites(code: string, identifier: string): number[] {
  const out: number[] = [];
  // `RegExp` rather than `matchAll`: `matchAll` requires the `g` flag AND an ES2020+
  // lib, and the iterator types add nothing here.
  const re = new RegExp(`${identifier}\\s*\\(`, 'g');
  let m: RegExpExecArray | null = re.exec(code);
  while (m !== null) {
    out.push(m.index);
    m = re.exec(code);
  }
  return out;
}

/** The source around each call, for readable failure output. */
function callContext(code: string, identifier: string): string {
  return callSites(code, identifier)
    .map((i) => code.slice(Math.max(0, i - 80), i + 120).replace(/\s+/g, ' '))
    .join(' | ');
}

test('the FAQ screen CALLS swapOrderUpdates rather than inlining the swap', () => {
  const page = readAppCode('faqs/page.tsx');

  // The swap logic - including the tie guard, which is the part that was wrong -
  // lives in faqForm.ts and is unit tested there. What has to hold is that the page
  // CALLS it, not that it mentions it: an inlined two-element swap is a no-op on a
  // tie, and every comment in this file names the helper, so a plain `toContain`
  // passes against exactly the regression it exists to catch.
  expect(callSites(page, 'swapOrderUpdates')).toHaveLength(1);

  // ...and that the result is what gets sent, so the swap cannot be computed and
  // then discarded in favour of a separately-built array.
  expect(page).toMatch(/faqService\.bulkUpdateOrders\(\s*updates\s*\)/);

  // The negative, re-anchored: the old inline shape must be gone from the code.
  expect(page).not.toMatch(/bulkUpdateOrders\(\s*\[\s*\{ id:/);
  expect(page).not.toMatch(/\{\s*id:\s*\w+\.order\s*,\s*order:/);
});

test('the FAQ screen CALLS buildFaqPayload rather than inlining the payload', () => {
  const page = readAppCode('faqs/page.tsx');

  expect(callSites(page, 'buildFaqPayload')).toHaveLength(1);
  // The payload must be the builder's RETURN VALUE, or the call is decorative.
  expect(page).toMatch(/const\s+payload\s*=\s*buildFaqPayload\(/);

  // The old inline shape: `entityId: ... || undefined`. That is the I1 bug - mongoose
  // strips undefined, so the stored product attachment survived a save that reported
  // success while the field's helper text promised "Leave blank for a global FAQ".
  expect(page).not.toMatch(/entityId:[^,\n]*\|\|\s*undefined/);
  expect(page).not.toMatch(/entityType:[^,\n]*\|\|\s*undefined/);
});

test('the certification screen CALLS both cert payload builders', () => {
  const page = readAppCode('certifications/page.tsx');

  expect(callSites(page, 'buildCertPayload')).toHaveLength(1);
  expect(callSites(page, 'buildCertTogglePayload')).toHaveLength(1);
  expect(page).toMatch(/const\s+payload\s*=\s*buildCertPayload\(/);

  // The old conditional spread, which omitted the key entirely. That made the "PDF
  // uploaded" chip's own onDelete - a control whose entire purpose is clearing
  // fileUrl - a complete no-op.
  expect(page).not.toMatch(/\.\.\.\(\s*form\.fileUrl\s*\?\s*\{/);
  expect(page).not.toMatch(/iconName:[^,\n]*\|\|\s*undefined/);
});

test('the builders are the only payloads the screens construct', () => {
  // A belt-and-braces sweep: no screen may hand-roll a `question:`/`name:` payload
  // literal, which is how an inline copy reappears after the builder is wired up.
  const faqPage = readAppCode('faqs/page.tsx');
  expect(faqPage).not.toMatch(/question:\s*form\.question/);
  expect(faqPage).not.toMatch(/answer:\s*form\.answer/);

  const certPage = readAppCode('certifications/page.tsx');
  expect(certPage).not.toMatch(/name:\s*form\.name/);
  expect(certPage).not.toMatch(/isActive:\s*!type\.isActive/);
});

test('the helper call sites are real statements, not identifiers in strings', () => {
  // Guards the guard: if these two assertions ever become vacuous, a reviewer reading
  // only the test names would assume the call sites are pinned. Asserting the shape
  // of what we found keeps the next mutation honest.
  const faqPage = readAppCode('faqs/page.tsx');
  expect(callContext(faqPage, 'swapOrderUpdates')).toMatch(
    /const updates = swapOrderUpdates\(/
  );
  expect(callContext(faqPage, 'buildFaqPayload')).toMatch(
    /const payload = buildFaqPayload\(form\)/
  );

  const certPage = readAppCode('certifications/page.tsx');
  expect(callContext(certPage, 'buildCertTogglePayload')).toMatch(
    /buildCertTogglePayload\(\s*\{/
  );
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