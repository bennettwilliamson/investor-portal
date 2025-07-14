"use client";

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import Image from "next/image";

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
        <div className={styles.signInContainer}>
          <Image
            src="/images/AREF Logo Final - 2024 07 18-01.png"
            alt="Alturas Real Estate Fund Logo"
            width={180}
            height={60}
            className={styles.logo}
            priority
          />
          <SignIn
            signUpUrl="/"
            appearance={{
              variables: {
                colorPrimary: "#008bce",
                colorText: "#ffffff",
              },
            }}
          />
        </div>
      </SignedOut>
    </>
  );
} 