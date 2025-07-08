import '@/styles/globals.scss';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Alturas Investor Portal',
  description: 'Investor dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 