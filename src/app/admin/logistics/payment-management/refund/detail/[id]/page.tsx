/**
 * /admin/logistics/payment-management/refund/detail/[id]
 *
 * Duplicate of the refund detail under /admin/payments/. This copy rendered a
 * fixed page of invented values and never read the route's [id]. Now delegates to
 * the real implementation.
 */
export { default } from "@/app/admin/payments/refund/detail/[id]/page";
