import PendingDetail from '../../PendingDetail';

/**
 * completed payment detail.
 *
 * The implementation used to live inline in this file as a page of invented
 * values that never read the route's [id], so every link showed the same
 * fiction. It now lives in ../PendingDetail.tsx and loads the real order; this
 * route exists so both /pending/ and /completed/ keep working as distinct URLs.
 */
export default function Page() {
  return <PendingDetail />;
}
