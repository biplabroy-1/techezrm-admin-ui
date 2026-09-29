/**
 * Canonical supplier payment methods.
 *
 * This list used to be duplicated in four places and had drifted apart:
 *
 *   suppliers/add          Wire Transfer, PayPal, Credit Card, UPI, Bank Transfer
 *   suppliers/page.tsx     the same, plus an "All Payment Methods" empty option
 *   AddSupplierModal      IBAN Transfer, Wire Transfer, Credit Card, PayPal,
 *                          Bank Transfer, Cash on Delivery
 *   suppliers/[id]/edit    UPI, NEFT, Bank Transfer, Cheque, Cash
 *
 * The drift was not cosmetic. A supplier saved as "Cash on Delivery" or
 * "Wire Transfer" rendered a BLANK dropdown on the edit page, because a MUI
 * Select whose value is not among its <MenuItem>s displays nothing - so opening
 * the form and pressing Save wrote back whatever the Select reported instead of
 * the stored value. The list-page filter likewise could not filter for methods
 * the create form allowed.
 *
 * Keep one list, and derive the "All" filter option from it rather than
 * hand-maintaining a parallel copy.
 */
export const SUPPLIER_PAYMENT_METHODS = [
  'Wire Transfer',
  'PayPal',
  'Credit Card',
  'UPI',
  'Bank Transfer',
  'IBAN Transfer',
  'Cash on Delivery',
] as const;

export type SupplierPaymentMethod = (typeof SUPPLIER_PAYMENT_METHODS)[number];

/** Filter-dropdown options: the canonical list plus an "All" sentinel. */
export const SUPPLIER_PAYMENT_FILTER_OPTIONS = [
  { value: '', label: 'All Payment Methods' },
  ...SUPPLIER_PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
];
