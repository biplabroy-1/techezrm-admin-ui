import { OrderTrackingClient } from "./client"

// Next 15 made `params` a Promise. Reading `params.id` synchronously yields
// undefined, so the guard below fired on every request and the page always
// rendered "No order ID provided" instead of the tracker.
export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params

  if (!id) {
    return <div>Error: No order ID provided</div>
  }

  // Pass the id to your client component
  return <OrderTrackingClient id={id} />
}
