"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.scss';
// Added Clerk auth component imports
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useInvestor, investors } from '@/context/InvestorContext';

export default function Header() {
  // Access investor context
  const { investorKey, setInvestorKey } = useInvestor();
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
          </nav>

          {/* ---- Development-only investor toggle ---- */}
          <select
            className={styles.investorSelect}
            value={investorKey}
            onChange={(e) => setInvestorKey(e.target.value as keyof typeof investors)}
          >
            {Object.entries(investors).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>

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