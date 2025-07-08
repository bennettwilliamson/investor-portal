"use client";

import Link from 'next/link';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Alturas Real Estate Fund</div>
      <nav className={styles.nav}>
        <Link href="#">Tools</Link>
        <Link href="#">Documents</Link>
        <Link href="#">Requests</Link>
        <Link href="#">Portfolio</Link>
      </nav>
      <div className={styles.avatar}>B</div>
    </header>
  );
} 