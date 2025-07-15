"use client";

import Image from 'next/image';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';

// Chart components (client-side rendered)
import BalanceFlowChart from '@/components/client/BalanceFlowChartClient';
import ReturnComboChart from '@/components/client/ReturnComboClient';

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

          {/* ---- Charts ---- */}
          <section style={{ marginTop: '3rem', width: '100%' }}>
            {/* Balance Flow Chart */}
            <div style={{ height: 500, width: '100%', marginBottom: '3rem' }}>
              <BalanceFlowChart />
            </div>

            {/* Return Combo Chart */}
            <div style={{ height: 500, width: '100%' }}>
              <ReturnComboChart />
            </div>
          </section>
        </main>
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
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #333'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Image
                src="/images/AREF Logo Final - 2024 07 18-06.png"
                alt="Alturas Real Estate Fund Logo"
                width={200}
                height={50}
                style={{ marginBottom: '1.5rem', objectFit: 'contain' }}
              />
              <h1 style={{ 
                color: '#ffffff', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Sign In To Your Investor Portal
              </h1>
            </div>
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: {
                    backgroundColor: '#0C40FF',
                    '&:hover': {
                      backgroundColor: '#0a35e6'
                    }
                  },
                  card: {
                    backgroundColor: 'transparent',
                    boxShadow: 'none'
                  },
                  headerTitle: {
                    display: 'none'
                  },
                  headerSubtitle: {
                    display: 'none'
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
                      borderColor: '#0C40FF'
                    }
                  },
                  formFieldLabel: {
                    color: '#ccc'
                  },
                  footerActionLink: {
                    color: '#0C40FF',
                    '&:hover': {
                      color: '#0a35e6'
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
        </div>
      </SignedOut>
    </>
  );
} 