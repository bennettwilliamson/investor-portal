"use client";

import Image from 'next/image';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import styles from './page.module.scss';
import SectionHeader from '@/components/SectionHeader';
import { useEffect, useState } from 'react';

// Chart components (client-side rendered)
import BalanceFlowChart from '@/components/client/BalanceFlowChartClient';
import ReturnComboChart from '@/components/client/ReturnComboClient';

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

type DashboardData = {
  welcome: { line1: string; line2: string };
  stats: { label: string; value: string }[];
  historical: { label: string; value: string }[];
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d: DashboardData) => setData(d))
      .catch(() => setData(null));
  }, []);

  const { welcome, stats, historical } = data ?? {
    welcome: { line1: '', line2: '' },
    stats: [],
    historical: [],
  };

  return (
    <>
      {/* Show dashboard only when the user is signed in */}
      <SignedIn>
        {!data ? (
          <p>Loading...</p>
        ) : (
        <>
        <Header />
        <main className={styles.main}>
          <section className={styles.welcome}>
            <h1>{welcome.line1}</h1>
            <p className={styles.welcomeSubtitle}>{welcome.line2}</p>
            <div className={styles.statGrid}>
              {stats.map(({ label, value }) => (
                <StatCard key={label} label={label} value={value} />
              ))}
            </div>
          </section>

          {/* ---- Charts ---- */}
          <section style={{ marginTop: '3rem', width: '100%' }}>
            <div>
              <SectionHeader title="Your Historical Returns" />
              {/* Return Combo Chart */}
              <div style={{
                height: 500,
                width: '100%',
                background: '#212121',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <ReturnComboChart />
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <SectionHeader title="Your Historical Balance" />
              {/* Balance Flow Chart */}
              <div style={{
                height: 500,
                width: '100%',
                background: '#212121',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <BalanceFlowChart />
              </div>
            </div>
          </section>
        </main>
        </>
      )}
      </SignedIn>

      {/* Show sign-in form when the user is signed out */}
      <SignedOut>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          width: '100%',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          padding: '2rem'
        }}>
            <SignIn 
              appearance={{
                layout: {
                  logoImageUrl: '/images/AREF Logo Final - 2024 07 18-03.png',
                  logoPlacement: 'inside',
                },
                elements: {
                  logoImage: {
                    width: '100%',
                    margin: '0 auto 1.5rem auto'
                  },
                  card: {
                    width: '100%',
                    maxWidth: '500px',
                    background: '#212121',
                    borderRadius: '12px',
                    padding: '2.5rem 2rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid #333'
                  },
                  header: {
                    textAlign: 'center',
                  },
                  headerTitle: {
                    color: '#ffffff', 
                    fontSize: '1.5rem', 
                    fontWeight: '600',
                  },
                  headerSubtitle: {
                    display: 'none',
                  },
                  alternativeMethodsBlockButton: {
                    color: '#ffffff',
                    '&:hover': {
                      color: '#dddddd'
                    }
                  },
                  formButtonPrimary: {
                    backgroundColor: '#008bce',
                    '&:hover': {
                      backgroundColor: '#0073ad'
                    }
                  },
                  socialButtonsBlockButton: {
                    backgroundColor: '#333',
                    border: '1px solid #444',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#444'
                    }
                  },
                  formFieldInput: {
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    color: '#fff',
                    '&:focus': {
                      borderColor: '#008bce'
                    }
                  },
                  formFieldLabel: {
                    color: '#ccc'
                  },
                  footerActionLink: {
                    color: '#008bce',
                    '&:hover': {
                      color: '#0073ad'
                    }
                  },
                  dividerLine: {
                    backgroundColor: '#444'
                  },
                  dividerText: {
                    color: '#888'
                  }
                }
              }}
            />
        </div>
      </SignedOut>
    </>
  );
} 