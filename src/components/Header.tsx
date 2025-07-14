"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image
          src="/images/AREF Logo Final - 2024 07 18-04.png"
          alt="Alturas Real Estate Fund"
          width={200}
          height={50}
          priority
        />
      </div>
      <div className={styles.right}>
        <nav className={styles.nav}>
          <Link href="#">Tools</Link>
          <Link href="#">Documents</Link>
          <Link href="#">Requests</Link>
          <Link href="#">Portfolio</Link>
        </nav>
        <div className={styles.avatar}>B</div>
      </div>
    </header>
  );
} 