"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.scss';
// Added Clerk auth component imports
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useDataset } from '@/contexts/DatasetContext';

export default function Header() {
  const { datasets, selected, selectDataset } = useDataset();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Image
            src="/images/AREF Logo Final - 2024 07 18-04.png"
            alt="Alturas Real Estate Fund"
            layout="intrinsic"
            width={199.5}
            height={24}
            priority
          />
        </div>
        <div className={styles.right}>
          <nav className={styles.nav}>
            <Link href="#">Tools</Link>
            <Link href="#">Documents</Link>
            <Link href="#">Requests</Link>
            <Link href="#">Profile</Link>
            {/* Dataset dropdown */}
            {datasets.length > 0 && (
              <select
                value={selected ?? ''}
                onChange={(e) => selectDataset(e.target.value)}
                style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                {datasets.map((name) => (
                  <option key={name} value={name}>
                    {name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
          </nav>
          {/* Show user button when signed in */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          {/* Show sign in/up buttons when signed out */}
          <SignedOut>
            <div className={styles.authButtons}>
              <SignInButton mode="modal">
                <button className={styles.authButton}>Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className={styles.authButton}>Sign up</button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </div>
    </header>
  );
} 