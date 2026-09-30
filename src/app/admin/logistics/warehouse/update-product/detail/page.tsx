'use client';
import { useSearchParams } from 'next/navigation';


import { Suspense } from 'react';
import Detail from '../Detail';

// This component needs to be separate to use Suspense
function DetailPageContent() {
  const searchParams = useSearchParams();

  const product = {
    id: searchParams.get('id') || '',
    name: searchParams.get('name') || '',
    description: searchParams.get('description') || '',
    inventory: searchParams.get('inventory') || '',
    // Was `loreal` - a Lorem Ipsum template leftover the list fed with the
    // literal strings "Black"/"White". Now carries the real quality value.
    quality: searchParams.get('quality') || '',
    price: searchParams.get('price') || '',
    rating: searchParams.get('rating') || '',
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
