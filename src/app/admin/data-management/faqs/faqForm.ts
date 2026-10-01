/**
 * Pure logic behind the FAQ admin screen.
 *
 * Extracted from `page.tsx` so it can be tested without a renderer. Neither
 * @testing-library nor a jsdom environment is installed here, and adding one is out
 * of scope - so the alternative would be asserting on nothing, or source-reading
 * the page and calling that coverage.
 *
 * Two things live here because both were silently wrong:
 *
 * 1. `buildFaqPayload` builds the mutation body. Every field must be sent on every
 *    save, including empty ones - see the note on it.
 * 2. `swapOrderUpdates` computes a reorder. It must never emit two rows sharing an
 *    `order`, which is easy to do by accident once 717 imported rows land.
 */

import type { FAQ, CreateFAQRequest, FAQOrderUpdate } from '@/api/services';

export interface FAQFormState {
  question: string;
  answer: string;
  key: FAQ['key'];
  entityId: string;
  order: number;
  isActive: boolean;
}

/**
 * The mutation body for create and update alike.
 *
 * EVERY field is always sent, and that is the whole point.
 *
 * `findByIdAndUpdate` strips `undefined` (verified against this mongoose version:
 * `_castUpdate` drops it), so a key sent as `undefined` does not clear the stored
 * value - it leaves it. An admin who clears a field and saves gets a success toast
 * and the old value still there.
 *
 * That is exactly what `entityId: form.entityId.trim() || undefined` did, and the
 * field's own helper text says "Leave blank for a global FAQ" - so it was
 * *presented* as clearable while being impossible to clear. Blank now sends `''`,
 * which is stored, and is what "no product" means.
 *
 * `entityType` is derived rather than edited: it is meaningless without an
 * `entityId`, and a row carrying `entityType: 'product'` with no entity is a
 * dangling reference. Blanking the id clears both together.
 */
export function buildFaqPayload(form: FAQFormState): CreateFAQRequest {
  const entityId = form.entityId.trim();

  return {
    question: form.question.trim(),
    answer: form.answer.trim(),
    key: form.key,
    entityId,
    entityType: entityId ? 'product' : '',
    order: Number(form.order) || 0,
    isActive: form.isActive,
  };
}

/**
 * The order updates that move `index` one row towards `direction`.
 *
 * WHY THIS IS NOT JUST "swap the two numbers"
 * --------------------------------------------
 * The obvious implementation - emit `{ id: a, order: b.order }, { id: b, order: a.order }`
 * - is a no-op whenever `a.order === b.order`. And that is the common case, not a
 * corner one: `order` defaults to 0, the 717 imported rows were not given distinct
 * values, and `getAllFAQs` sorts by `{ order: 1 }`. The unfiltered default view spans
 * all seven keys, so two neighbours sharing 0 is likely.
 *
 * When they tie, both writes carry the same number and the ordering after the save
 * is whatever Mongo decides for a tie - which makes the button appear to do nothing
 * on some rows and silently reorder on others.
 *
 * So a tie is broken here rather than sent. The pair is given consecutive values
 * straddling the shared one: the row being moved goes to `order - 1` and its
 * neighbour to `order`. That moves exactly one row by exactly one position and
 * leaves the two distinct, which is what the button promised.
 *
 * Returns an empty array when there is nothing to do, so the caller can skip the
 * request instead of sending a no-op and reporting success.
 */
export function swapOrderUpdates(
  rows: Array<{ _id: string; order: number }>,
  index: number,
  direction: -1 | 1
): FAQOrderUpdate[] {
  const current = rows[index];
  const other = rows[index + direction];
  if (!current || !other) return [];

  const currentOrder = current.order;
  const otherOrder = other.order;

  if (currentOrder !== otherOrder) {
    // The normal case: a straight swap of two distinct values.
    return [
      { id: current._id, order: otherOrder },
      { id: other._id, order: currentOrder },
    ];
  }

  // The tie. Straddle the shared value so the moved row lands on one side of its
  // neighbour and the two are never equal afterwards.
  return direction === -1
    ? [
        { id: current._id, order: currentOrder - 1 },
        { id: other._id, order: currentOrder },
      ]
    : [
        { id: current._id, order: currentOrder + 1 },
        { id: other._id, order: currentOrder },
      ];
}

/**
 * The order a new FAQ should be created with.
 *
 * Derived from `maxOrder` over the WHOLE collection, not from the rows currently on
 * screen. Reading the current 25-row page instead meant every newly imported FAQ - all
 * 717 of them carrying whatever order the import gave - would be created at the same
 * order as the largest one visible on page 1, colliding with it and with each other.
 */
export function nextFaqOrder(maxOrder: number | undefined): number {
  if (maxOrder === undefined || !Number.isFinite(maxOrder)) return 0;
  return maxOrder + 1;
}