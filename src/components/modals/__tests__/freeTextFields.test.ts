import { test, expect } from '../../../test-utils/bunTest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildUpdateProductFormData } from '../buildUpdateProductFormData';

/**
 * Free-text fields must go on the wire exactly as they are stored.
 *
 * The migration writes real content into `applications` and `functions` -
 * flattened CAS data like `"CAS No: 14281-83-5"` and
 * `"Source: Mineral chelation (zinc oxide)"`. `handleSubmit` used to run every
 * value through a slugifier against `filtersData`, so the first admin save of any
 * product turned `"CAS No: 14281-83-5"` into `cas-no-14281-83-5`: the CAS number
 * destroyed, on all 240 products, with a success toast and nothing in the log.
 *
 * Every value below is the verbatim string, not a slug of it.
 */
const base = {
  name: 'Zinc Bisglycinate',
  description: 'chelated zinc',
  price: 2222,
  category: 'c',
  inStock: true,
  status: 'active',
};

test('a CAS number survives a save unmangled', () => {
  const functions = [
    'CAS No: 14281-83-5',
    'Source: Mineral chelation (zinc oxide)',
    'Synonym: Zinc bis(glycinate)',
  ];
  const fd = buildUpdateProductFormData({ ...base, functions });

  expect(fd.get('functions')).toBe(JSON.stringify(functions));
  expect(JSON.parse(fd.get('functions') as string)).toEqual(functions);
  // Spelled out because it is the exact damage: lower-casing plus whitespace
  // folding is what turned the CAS number into `cas-no-14281-83-5`.
  expect(fd.get('functions')).not.toContain('cas-no-14281-83-5');
});

test('applications keep their original casing and punctuation', () => {
  const applications = ['Immune support', 'Bone & joint health'];
  const fd = buildUpdateProductFormData({ ...base, applications });

  expect(fd.get('applications')).toBe(JSON.stringify(applications));
  expect(JSON.parse(fd.get('applications') as string)).toEqual(applications);
  // The slug of "Bone & joint health" is `bone-&-joint-health`, which matches no
  // facet and no storefront filter - so the ampersand has to survive as an
  // ampersand, not as a hyphen run.
  expect(fd.get('applications')).not.toContain('bone-&-joint-health');
});

test('countryOfOrigin is sent verbatim', () => {
  const countryOfOrigin = ['IN', 'US'];
  const fd = buildUpdateProductFormData({ ...base, countryOfOrigin });

  expect(JSON.parse(fd.get('countryOfOrigin') as string)).toEqual(countryOfOrigin);
});

test('tags are sent as plain values, never re-derived from the facet list', () => {
  // The one field whose MEANING does not change: tags are genuine facet slugs that
  // product.service.ts:86 filters on (`tags: { $in: filter.tag }`). So they are
  // sent as-is - the picker already holds the facet value. Re-deriving them here
  // from `filtersData` is what turned free text into slugs, and it must not creep
  // back into the builder.
  const tags = ['vegan', 'gluten-free'];
  const fd = buildUpdateProductFormData({ ...base, tags });

  expect(fd.get('tags')).toBe(JSON.stringify(tags));
  expect(JSON.parse(fd.get('tags') as string)).toEqual(tags);
});

test('clearing the last tag sends [], so the removal sticks', () => {
  // An admin save is a full-form replace, and `decodeProductFields` writes a field
  // only when the key is present. Omitting `tags` means "leave alone", so a delete
  // of the final tag would silently undo itself on the next load.
  const fd = buildUpdateProductFormData({ ...base, tags: [] });

  expect(fd.get('tags')).toBe('[]');
  expect(JSON.parse(fd.get('tags') as string)).toEqual([]);
});

test('clearing applications and functions sends [], not an absent key', () => {
  // Same replace semantics as tags. An admin who removes the last CAS line must not
  // find it back on the next open.
  const fd = buildUpdateProductFormData({
    ...base,
    applications: [],
    functions: [],
    countryOfOrigin: [],
  });

  expect(JSON.parse(fd.get('applications') as string)).toEqual([]);
  expect(JSON.parse(fd.get('functions') as string)).toEqual([]);
  expect(JSON.parse(fd.get('countryOfOrigin') as string)).toEqual([]);
});

test('an omitted list still arrives as [], never as an absent key', () => {
  // `undefined` is what a product with no stored applications produces, and the
  // builder has to reach the same payload as an empty array - otherwise the key
  // disappears and the server reads the omission as "leave alone".
  const fd = buildUpdateProductFormData(base);

  expect(fd.get('tags')).toBe('[]');
  expect(fd.get('applications')).toBe('[]');
  expect(fd.get('functions')).toBe('[]');
  expect(fd.get('countryOfOrigin')).toBe('[]');
});

test('deleting every image sends [], so the deletion sticks', () => {
  // `if (v.images?.length)` meant an emptied gallery sent no `images` key at all.
  // The server's presence guard then left the stored array alone, so removing the
  // last image silently undid itself - the exact bug the empty-list rule fixes for
  // the other fields.
  const fd = buildUpdateProductFormData({ ...base, images: [] });

  expect(fd.get('images')).toBe('[]');
  expect(JSON.parse(fd.get('images') as string)).toEqual([]);
});

test('a populated image list is unchanged by the empty-list fix', () => {
  const images = ['https://cdn/x,1.png', 'https://cdn/y.png'];
  const fd = buildUpdateProductFormData({ ...base, images });

  expect(fd.get('images')).toBe(JSON.stringify(images));
});

/* ---- the component: no mangling on the way IN ---- */

const COMPONENT_PATH = join(__dirname, '..', 'EditProductModal.tsx');

/**
 * `EditProductModal.tsx` with every comment stripped.
 *
 * MANDATORY, and not decoration: the `handleSubmit` comment block this change
 * deletes QUOTED the slugifier and the string `"CAS No: 14281-83-5"` in order to
 * explain why the loops had to go. Two earlier tasks in this repo shipped
 * assertions that passed against the exact regression they targeted for precisely
 * this reason - a comment quoting a string is indistinguishable from code calling
 * it.
 *
 * Known limitation of the shared two-regex strip: a `//` inside a string literal
 * (the `https://...` placeholder at the bottom of the file) truncates the rest of
 * that line. Harmless here - stripping can only remove text, never add a
 * slugifier, so the negative assertions stay sound - and no assertion below is
 * anchored past that line.
 */
function readComponentCode(): string {
  return readFileSync(COMPONENT_PATH, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/** `handleSubmit` alone: from its declaration to the next top-level `const`. */
function handleSubmitSource(): string {
  const code = readComponentCode();
  const start = code.indexOf('const handleSubmit');
  const end = code.indexOf('const handleClose', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return code.slice(start, end);
}

test('the component does not slugify on save - the payload goes out verbatim', () => {
  // `buildUpdateProductFormData` can be perfect while the component still rewrites
  // values on the way in, so the pure-function tests above cannot see this at all.
  // This is the only thing guarding it.
  const submit = handleSubmitSource();

  // Positive first, so the negatives below cannot pass by the payload simply
  // ceasing to be built.
  expect(submit).toMatch(/const\s+formDataToSend\s*=\s*buildUpdateProductFormData\(\{/);
  // ...and the form state is what reaches the builder. That spread is the only
  // reason applications/functions/countryOfOrigin/tags arrive at all.
  expect(submit).toMatch(/\.\.\.formData/);
  expect(submit).toMatch(/updateProductMutation\.mutate\(formDataToSend\)/);

  // The slugifier, gone. Both spellings are checked so a rename cannot slip past.
  expect(submit).not.toMatch(/\.toLowerCase\(\)\.replace\(/);
  expect(submit).not.toContain("replace(/\\s+/g, '-')");

  // ...and the `filtersData` lookups that fed it. Anchored on `.find`: the JSX
  // Selects legitimately read `filtersData?.data?.application` and `?.function` to
  // fill their dropdowns, so an unanchored match would fire on the pickers.
  expect(submit).not.toMatch(
    /filtersData\?\.data\?\.(tag|application|function|countryOfOrigin)\?\.find/
  );

  // The component appends nothing itself. A second `append` of the same key here
  // would reach multer as a repeated multipart part.
  expect(submit).not.toMatch(/formDataToSend\.append\(/);
});

test('no slugifier is hiding anywhere else in the component', () => {
  // Whole-file sweep, so the mangling cannot reappear outside `handleSubmit` - a
  // `useMemo`, say - where the assertions above would not look.
  const code = readComponentCode();

  expect(code).not.toMatch(/\.toLowerCase\(\)\.replace\(\s*\/\\s\+\/g/);
  expect(code).not.toMatch(
    /JSON\.stringify\(\s*(tagSlugs|applicationSlugs|functionSlugs|countryCodes)\s*\)/
  );
});

test('the facet dropdowns still read filtersData - only the save path changed', () => {
  // Guards the guard. The assertions above forbid `filtersData` on the save path;
  // without this one they would also read as "the component no longer uses the
  // facet list at all", and the next change could delete the query and the
  // dropdowns with the test suite still green.
  const code = readComponentCode();

  expect(code).toMatch(/filtersData\?\.data\?\.application\?\.map/);
  expect(code).toMatch(/filtersData\?\.data\?\.function\?\.map/);
  expect(code).toMatch(/filtersData\?\.data\?\.category\?\.categories\?\.map/);
});

/* ---- the country picker: code in, name out ---- */

test('the country picker stores a countryCode while showing the country name', () => {
  // `countryOfOrigin` is the one field whose stored value is a CODE, not prose:
  // `getFilters` builds the storefront's country facet from `country.countryCode`
  // and counts products with `countryOfOrigin: { $in: ['IN'] }`, so an admin
  // picking "India" must store "IN". Before this the dropdown's value was
  // `country.name`, and the name->code lookup that compensated for it lived on the
  // save path - so deleting the slugifiers (which is what makes the save verbatim)
  // would have left "India" in a codes field and silently broken the country
  // filter for anything added from then on.
  const code = readComponentCode();

  // The options are the country objects, not a list of names.
  expect(code).toMatch(
    /const\s+countryOptions\s*=\s*filtersData\?\.data\?\.countryOfOrigin\s*\|\|\s*\[\]/
  );
  expect(code).not.toMatch(/countryOfOrigin\?\.map\(/);

  // Value = the code, label = the name, so the admin still reads "India".
  expect(code).toMatch(
    /<MenuItem\s+key=\{country\.countryCode\}\s+value=\{country\.countryCode\}\s*>/
  );
  expect(code).toMatch(/\{country\.name\}/);
});

test('the selected country actually reaches form state', () => {
  // Guards the guard above: a `value={country.countryCode}` that nothing reads is
  // decorative. The chain is Select value -> `countryInput` -> `handleAddCountry`
  // -> `formData.countryOfOrigin`, and the builder sends it verbatim, so all three
  // links have to hold or the code never reaches the wire.
  const code = readComponentCode();

  expect(code).toMatch(/<Select\s+value=\{countryInput\}/);
  expect(code).toMatch(
    /onChange=\{\(e\) => setCountryInput\(e\.target\.value\)\}/
  );
  // ...and the add handler stores the selection unchanged - no re-derivation.
  expect(code).toMatch(
    /countryOfOrigin:\s*\[\.\.\.prev\.countryOfOrigin,\s*countryInput\.trim\(\)\]/
  );
});