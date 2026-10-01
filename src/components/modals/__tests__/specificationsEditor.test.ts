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
  const rows = specRowUpdated(specToRows({ Form: 'Powder' }), 0, {
    key: 'Color',
    value: 'White',
  });
  expect(rows[0]).toEqual({ key: 'Color', value: 'White' });
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
  // The migrated data has both spellings and they are different specs. A commit
  // that trims the key would collapse them into one and silently drop a row, so
  // the stored key is verbatim - the trim is only a "is this row finished?"
  // test, never a rewrite.
  expect(
    rowsToSpec([
      { key: 'Shelf Life ', value: '24 months' },
      { key: 'Shelf Life', value: '18 months' },
    ])
  ).toEqual({ 'Shelf Life ': '24 months', 'Shelf Life': '18 months' });
});

test('a round trip through the editor changes no key', () => {
  const stored = { 'Shelf Life ': '24 months', Form: 'Powder', 'Purity/Assay': '99%' };
  expect(rowsToSpec(specToRows(stored))).toEqual(stored);
});
