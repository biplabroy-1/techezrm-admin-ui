import RefundDetail from './RefundDetail';

/**
 * Refund detail route.
 *
 * The implementation used to live inline here as a page of invented values that
 * never read the route's [id], so every refund link showed the same fiction. It
 * now lives in ../RefundDetail.tsx and loads the real transaction.
 */
export default function Page() {
  return <RefundDetail />;
}
