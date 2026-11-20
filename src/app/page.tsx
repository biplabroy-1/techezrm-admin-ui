import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'EZRM Admin',
  description: 'EZRM admin',
};

export default function HomePage() {
  redirect('/login');

  return null;
}
