import type { Metadata } from 'next';
import ClientProvider from './ClientProvider';
import './globals.css';
// react-toastify ships no styles unless you import them. Without this the
// <ToastContainer /> rendered below is an empty, unstyled box, so every
// toast.success()/toast.error() call in the app was invisible - users got no
// feedback at all when a create/update/delete succeeded or failed.
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export const metadata: Metadata = {
  title: 'EZRM - Home',
  description: 'Welcome to EZRM - Raw Materials Simplified',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ezrm.png" type="image/png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ClientProvider>{children}</ClientProvider>
        <ToastContainer position="top-center" />
      </body>
    </html>
  );
}
