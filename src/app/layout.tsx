import '@/styles/globals.scss';
import { ReactNode } from 'react';
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Alturas Real Estate Fund - Investor Portal",
  description: "Secure investor portal for Alturas Real Estate Fund portfolio management and reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkAppearance = {
    // Design tokens
    variables: {
      colorPrimary: '#008bce',        // Alturas brand blue
      colorBackground: '#171717',     // App dark background
      colorText: '#ffffff',
      colorTextOnPrimary: '#ffffff',
      colorBorder: '#444',
      fontFamily: "'Utile Regular', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      borderRadius: '8px',
    },
    // Per-element style overrides
    elements: {
      card: {
        background: '#212121',
        borderRadius: '12px',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid #333',
      },
      logoImage: {
        width: '100%',
        margin: '0 auto 1.5rem auto',
      },
      // Slightly enlarge the logo container but keep Clerk layout intact
      logoBox: {
        transform: 'scale(2)',
        transformOrigin: 'top center',
        marginTop: '1.25rem',
        marginBottom: '0.5rem',
      },
      header: {
        textAlign: 'center',
      },
      headerTitle: {
        color: '#ffffff',
        fontSize: '1.5rem',
        fontWeight: '300',
      },
      headerSubtitle: {
        display: 'none',
      },
      formButtonPrimary: {
        backgroundColor: '#008bce',
        '&:hover': { backgroundColor: '#0073ad' },
      },
      formFieldInput: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #444',
        color: '#fff',
        '&::placeholder': { color: '#8e8e8e' },
        '&:focus': { borderColor: '#008bce' },
      },
      formFieldLabel: {
        color: '#e6e7e8',
        fontSize: '1rem',
        fontWeight: '500',
      },
      socialButtonsBlockButton: {
        backgroundColor: '#333',
        border: '1px solid #444',
        color: '#fff',
        '&:hover': { backgroundColor: '#444' },
      },
      alternativeMethodsBlockButton: {
        color: '#b0b0b0',
        fontSize: '1rem',
        fontWeight: '500',
        '&:hover': { color: '#c8c8c8' },
      },
      footerActionLink: {
        color: '#008bce',
        '&:hover': { color: '#0073ad' },
      },
      dividerLine: { backgroundColor: '#444' },
      dividerText: { color: '#888' },
      // ----- UserButton popover -----
      userButtonPopoverActionButton: {
        color: '#ffffff',
        '&:hover': { backgroundColor: '#2a2a2a' },
      },
      userButtonPopoverActionButtonIcon: {
        color: '#ffffff',
      },
      userButtonPopoverActionButtonText: {
        color: '#ffffff',
      },
    },
    // Layout options
    layout: {
      logoImageUrl: '/images/AREF Logo Final - 2024 07 18-03.png',
      logoPlacement: 'inside',
    },
  } as const;

  const clerkLocalization = {
    signIn: {
      start: {
        title: 'Sign In To Your Investor Portal',
        subtitle: '',
      },
    },
    signUp: {
      start: {
        title: 'Create Your Investor Portal Account',
        subtitle: '',
      },
    },
  } as const;

  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
} 