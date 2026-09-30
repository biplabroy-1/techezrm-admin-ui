/**
 * /admin/logistics/payment-management/refund
 *
 * Duplicate of /admin/payments/refund. Both were linked from the admin nav.
 * Now delegates to the real implementation so the two cannot drift apart.
 */
export { default } from "@/app/admin/payments/refund/page";
