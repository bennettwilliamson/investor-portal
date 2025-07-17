import '@/styles/globals.scss';
import { ReactNode } from 'react';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { InvestorProvider } from '@/context/InvestorContext';

export const metadata = {
  title: "Alturas Real Estate Fund - Investor Portal",
  description: "Secure investor portal for Alturas Real Estate Fund portfolio management and reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={{
        signIn: {
          start: {
            title: 'Sign In To The Investor Portal',
            subtitle: '',
          }
        }
      }}
    >
      <html lang="en">
        <body>
          <InvestorProvider>
            {children}
          </InvestorProvider>
        </body>
      </html>
    </ClerkProvider>
  );
} 