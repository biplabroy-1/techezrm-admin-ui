// Five levels up from `src/app/admin/data-management/faqs/__tests__` reaches `src`.
import { test, expect } from '../../../../../test-utils/bunTest';
import {
  buildFaqPayload,
  swapOrderUpdates,
  nextFaqOrder,
  makeReorderNoop,
  isReorderNoop,
  type FAQFormState,
} from '../faqForm';

/**
 * I1 - "clear this field" controls that silently did nothing.
 *
 * `findByIdAndUpdate` strips `undefined` (verified against this mongoose version:
 * `_castUpdate` drops it), so a key sent as `undefined` leaves the stored value in
 * place and the admin gets a success toast. These tests pin the payload builder so
 * a blank field is actually sent as a value that clears.
 *
 * I4 - reorder must never produce two rows sharing an `order`.
 *
 * Pure functions extracted from page.tsx because no renderer is installed here; see
 * the note at the top of faqForm.ts.
 */

const FORM: FAQFormState = {
  question: '  How is it shipped?  ',
  answer: '  By courier.  ',
  key: 'shipping',
  entityId: '  65e1b2c3d4e5f6a7b8c9d0e1  ',
  order: 3,
  isActive: true,
};

/* ---- I1: clearing entityId ---- */

test('a blank entityId is sent as an empty string, so clearing actually clears', () => {
  // The bug: `entityId: form.entityId.trim() || undefined`. mongoose strips
  // undefined, the stored value survives, and the field's own helper text promises
  // "Leave blank for a global FAQ" - so the control was presented as clearable and
  // was not.
  const payload = buildFaqPayload({ ...FORM, entityId: '' });

  expect(payload.entityId).toBe('');
  // Spelled out separately: `toBe('')` on an absent key is a TypeError under some
  // matchers, and the key's PRESENCE is the thing under test.
  expect('entityId' in payload).toBe(true);
  expect(payload.entityId).not.toBeUndefined();
});

test('clearing entityId also clears entityType', () => {
  // entityType is meaningless without an entityId. A row carrying
  // `entityType: 'product'` and no entity is a dangling reference, and it is what
  // the storefront uses to decide which FAQs belong to a product page.
  const cleared = buildFaqPayload({ ...FORM, entityId: '' });
  const attached = buildFaqPayload(FORM);

  expect(cleared.entityType).toBe('');
  expect(attached.entityType).toBe('product');
});

test('whitespace-only entityId counts as blank', () => {
  const payload = buildFaqPayload({ ...FORM, entityId: '   ' });
  expect(payload.entityId).toBe('');
  expect(payload.entityType).toBe('');
});

test('an entityId is trimmed and keeps entityType', () => {
  const payload = buildFaqPayload(FORM);
  expect(payload.entityId).toBe('65e1b2c3d4e5f6a7b8c9d0e1');
  expect(payload.entityType).toBe('product');
});

/* ---- other payload fields ---- */

test('every field is always present, never undefined', () => {
  // A single sweep over the whole payload. Any field that can become undefined is a
  // field that cannot be cleared, and the bug was one `|| undefined` away.
  const payload = buildFaqPayload({ ...FORM, entityId: '', isActive: false });

  for (const [key, value] of Object.entries(payload)) {
    expect({ key, isUndefined: value === undefined }).toEqual({
      key,
      isUndefined: false,
    });
  }
});

test('question and answer are trimmed', () => {
  const payload = buildFaqPayload(FORM);
  expect(payload.question).toBe('How is it shipped?');
  expect(payload.answer).toBe('By courier.');
});

test('isActive false is preserved, not defaulted back to true', () => {
  // The other falsy value. `isActive || true` would make a row un-deactivatable.
  expect(buildFaqPayload({ ...FORM, isActive: false }).isActive).toBe(false);
});

test('order 0 is preserved, not defaulted to 1', () => {
  // `Number(form.order) || 0` happens to survive 0, but a `|| 1` would silently
  // push a row to position 1 instead.
  expect(buildFaqPayload({ ...FORM, order: 0 }).order).toBe(0);
});

/* ---- I4: the reorder collision guard ---- */

test('a swap of two distinct orders exchanges them', () => {
  const rows = [
    { _id: 'a', order: 1 },
    { _id: 'b', order: 2 },
  ];
  expect(swapOrderUpdates(rows, 1, -1)).toEqual([
    { id: 'b', order: 1 },
    { id: 'a', order: 2 },
  ]);
});

test('the guard is what prevents two rows sharing an order', () => {
  // The bug: emitting `{id: a, order: b.order}, {id: b, order: a.order}` when both
  // are 0 sends two identical writes and the order afterwards is whatever Mongo
  // decides for a tie. `order` defaults to 0, the 717 imported rows were not given
  // distinct values, and the default view spans all seven keys - so equal-order
  // neighbours are the common case, not a corner one.
  const tied = [
    { _id: 'a', order: 0 },
    { _id: 'b', order: 0 },
  ];

  const updates = swapOrderUpdates(tied, 0, 1);

  // The invariant: the two ids must never be sent the same order.
  const orders = updates.map((u) => u.order);
  expect(new Set(orders).size).toBe(updates.length);
  // And it has to be a real move, not a no-op: exactly one row changes position.
  expect(updates.some((u) => u.order !== 0)).toBe(true);
  expect(updates).toEqual([
    { id: 'a', order: 1 },
    { id: 'b', order: 0 },
  ]);
});

test('a tie resolved upwards still gives the two rows distinct orders', () => {
  const tied = [
    { _id: 'a', order: 0 },
    { _id: 'b', order: 0 },
  ];
  const updates = swapOrderUpdates(tied, 1, -1);

  expect(new Set(updates.map((u) => u.order)).size).toBe(2);
  expect(updates).toEqual([
    { id: 'b', order: -1 },
    { id: 'a', order: 0 },
  ]);
});

test('every tie among a run of equal orders produces a legal move', () => {
  // The realistic shape: a whole imported block sharing order 0, as the unfiltered
  // list shows them. Walking it must never produce a duplicate order.
  const rows = [
    { _id: 'a', order: 0 },
    { _id: 'b', order: 0 },
    { _id: 'c', order: 0 },
    { _id: 'd', order: 0 },
  ];

  for (let i = 0; i < rows.length - 1; i += 1) {
    const updates = swapOrderUpdates(rows, i, 1);
    expect(updates).toHaveLength(2);
    expect(new Set(updates.map((u) => u.order)).size).toBe(2);
  }
});

test('an out-of-range index produces no request rather than a broken one', () => {
  const rows = [
    { _id: 'a', order: 1 },
    { _id: 'b', order: 2 },
  ];
  // Off either end: the neighbour is on the previous or next page, whose orders this
  // client never loaded.
  expect(swapOrderUpdates(rows, 0, -1)).toEqual([]);
  expect(swapOrderUpdates(rows, 1, 1)).toEqual([]);
});

/* ---- I4: where a new FAQ's order comes from ---- */

test('a new FAQ is created after the highest order in the collection', () => {
  // The bug: derived from the current 25-row page, so every newly imported FAQ was
  // created at the same order as the largest one visible and collided with it.
  expect(nextFaqOrder(41)).toBe(42);
  expect(nextFaqOrder(0)).toBe(1);
});

test('an empty collection starts at order 0', () => {
  expect(nextFaqOrder(undefined)).toBe(0);
  expect(nextFaqOrder(Number.NaN)).toBe(0);
});

/* ---- I5 (round 2): a no-op reorder must be distinguishable from a real one ---- */

test('a no-op sentinel is recognised as a no-op', () => {
  const noop = makeReorderNoop();
  expect(isReorderNoop(noop, noop)).toBe(true);
});

test('a real result is never mistaken for the no-op', () => {
  const noop = makeReorderNoop();

  // Including undefined and null: those are exactly what a careless sentinel choice
  // would use, and react-query counts a resolved undefined as SUCCESS - so if the
  // guard matched `undefined` the success toast would fire for a move that never
  // happened, which is the bug this exists to prevent.
  expect(isReorderNoop({ success: true }, noop)).toBe(false);
  expect(isReorderNoop(undefined, noop)).toBe(false);
  expect(isReorderNoop(null, noop)).toBe(false);
  expect(isReorderNoop(0, noop)).toBe(false);
  expect(isReorderNoop('', noop)).toBe(false);
  expect(isReorderNoop(false, noop)).toBe(false);
});

test('a sentinel from another module instance is not this one', () => {
  // Two module copies would each build their own Symbol, and identity would say
  // "not a no-op". That is the safe direction to fail: a spurious toast is a smaller
  // harm than a swallowed one.
  expect(isReorderNoop(makeReorderNoop(), makeReorderNoop())).toBe(false);
});

test('the sentinel cannot be forged by an API response', () => {
  // A JSON response can never contain a Symbol, so no server payload can masquerade
  // as the no-op and suppress a legitimate success toast.
  const noop = makeReorderNoop();
  expect(isReorderNoop(JSON.parse('{"success":true,"count":2}'), noop)).toBe(false);
});