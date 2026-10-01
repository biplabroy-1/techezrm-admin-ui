import { test, expect } from '../../../test-utils/bunTest';
import {
  specToRows,
  specRowAdded,
  specRowUpdated,
  specRowRemoved,
  rowsToSpec,
} from '../specRows';

test('an empty spec has one blank row, not zero', () => {
  expect(specToRows({})).toEqual([{ key: '', value: '' }]);
});

test('keys keep their trailing whitespace', () => {
  const rows = specToRows({ 'Shelf Life ': '24 months', Form: 'Powder' });
  expect(rows.map((r) => r.key)).toEqual(['Shelf Life ', 'Form']);
});

test('adding a row appends a blank one', () => {
  const rows = specRowAdded(specToRows({ Form: 'Powder' }));
  expect(rows).toHaveLength(2);
  expect(rows[1]).toEqual({ key: '', value: '' });
});

test('editing a row changes only that row', () => {
  const rows = specRowUpdated(
    specToRows({ Form: 'Powder', Color: 'White' }),
    0,
    {
      key: 'Packaging',
      value: '25kg drum',
    }
  );
  expect(rows[0]).toEqual({ key: 'Packaging', value: '25kg drum' });
  expect(rows[1]).toEqual({ key: 'Color', value: 'White' });
});

test('patching only the value leaves the key alone', () => {
  // The contract is a partial merge, and a test that hands the function a whole
  // `{key, value}` cannot tell a merge from a replacement. That distinction is
  // the whole point: both TextFields dispatch a one-field patch, so a
  // non-merging implementation wipes the other field's contents on every
  // keystroke, with nothing thrown and no error in the console.
  const rows = specRowUpdated(specToRows({ Form: 'Powder' }), 0, {
    value: 'White',
  });
  expect(rows[0].key).toBe('Form');
  expect(rows[0].value).toBe('White');
});

test('patching only the key leaves the value alone', () => {
  // The mirror of the case above, broken by the same regression.
  const rows = specRowUpdated(specToRows({ Form: 'Powder' }), 0, {
    key: 'Color',
  });
  expect(rows[0].key).toBe('Color');
  expect(rows[0].value).toBe('Powder');
});

test('removing the last row leaves one blank row', () => {
  expect(specRowRemoved(specToRows({ Form: 'Powder' }), 0)).toEqual([
    { key: '', value: '' },
  ]);
});

test('rows with no key are dropped on the way back to a spec object', () => {
  expect(
    rowsToSpec([
      { key: '', value: 'orphan' },
      { key: 'Form', value: 'Powder' },
    ])
  ).toEqual({ Form: 'Powder' });
});

test('a whitespace-only key counts as no key at all', () => {
  expect(
    rowsToSpec([
      { key: '   ', value: 'orphan' },
      { key: 'Form', value: 'Powder' },
    ])
  ).toEqual({ Form: 'Powder' });
});

test('"Shelf Life " and "Shelf Life" stay two specs, not one', () => {
  // Defence in depth, not a description of live data: no migrated product
  // carries both spellings, so nothing collapses today. If one ever did, a
  // committing trim would drop a row silently - the stored key is verbatim, and
  // trim() is only a "is this row finished?" test.
  expect(
    rowsToSpec([
      { key: 'Shelf Life ', value: '24 months' },
      { key: 'Shelf Life', value: '18 months' },
    ])
  ).toEqual({ 'Shelf Life ': '24 months', 'Shelf Life': '18 months' });
});

test('a round trip through the editor changes no key', () => {
  // This is the assertion that pins the silent rename: a price-only save walks
  // exactly this path, and `"Shelf Life "` must come back as `"Shelf Life "`.
  const stored = {
    'Shelf Life ': '24 months',
    Form: 'Powder',
    'Purity/Assay': '99%',
  };
  expect(rowsToSpec(specToRows(stored))).toEqual(stored);
});
