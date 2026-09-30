/**
 * /admin/logistics/payment-management/payment
 *
 * This is a duplicate of /admin/payments/payment that renders a second, entirely
 * fictional set of payments - "John Smith", "Sarah Johnson", "Robin Rosh",
 * invoice #789012 - with no API call. Both this route and /admin/payments/payment
 * were linked from the admin nav, so the same fake data was reachable two ways.
 *
 * It now renders the real implementation, so the URL keeps working and the two
 * nav entries can never drift apart again.
 */
export { default } from "@/app/admin/payments/payment/page";
