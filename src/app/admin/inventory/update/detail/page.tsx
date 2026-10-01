'use client';
import { useSearchParams } from 'next/navigation';


import { Suspense } from 'react';
import Detail, { type Product } from '../Detail';

// This component needs to be separate to use Suspense
function DetailPageContent() {
  const searchParams = useSearchParams();

  // Detail's own Product is string-typed throughout, because every field arrives as
  // a query-string value.
  const product: Product = {
    id: searchParams.get('id') || '',
    name: searchParams.get('name') || '',
    description: searchParams.get('description') || '',
    inventory: searchParams.get('inventory') || '',
    price: searchParams.get('price') || '',
    // Exactly the fields List.tsx puts in the query string, and exactly the ones
    // Detail reads. `loreal` and `rating` were built here too but are never sent by
    // the list and never read by the form - dead round-trips.
    category: searchParams.get('category') || '',
    inStock: searchParams.get('inStock') || 'true',
  };

  return <Detail product={product} />;
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div>Loading product details...</div>}>
      <DetailPageContent />
    </Suspense>
  );
}
