/**
 * /admin/logistics/payment-management/payment/detail/pending/[id]
 *
 * Duplicate of the payment detail under /admin/payments/. This copy rendered a
 * fixed page of invented values and never read the route's [id], so every link
 * showed the same "Robin Bask / randhrpol@gmail.com / Lorem ipsum garden"
 * fiction. Now delegates to the real implementation.
 */
export { default } from "@/app/admin/payments/payment/detail/pending/[id]/page";
