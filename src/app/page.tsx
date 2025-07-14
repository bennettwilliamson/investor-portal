"use client";

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export default function Home() {
  const { welcome, stats, historical } = dashboardData;

  return (
    <>
      {/* Show dashboard only when the user is signed in */}
      <SignedIn>
        <Header />
        <main className={styles.main}>
          <section className={styles.welcome}>
            <h1>{welcome.text}</h1>
            <div className={styles.statGrid}>
              {stats.map(({ label, value }) => (
                <StatCard key={label} label={label} value={value} />
              ))}
            </div>
          </section>
        </main>
      </SignedIn>

      {/* Show sign-in form when the user is signed out */}
      <SignedOut>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
          <SignIn signUpUrl="/" />
        </div>
      </SignedOut>
    </>
  );
} 