"use client";

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import dashboardData from '@/data/dashboardData';
import styles from './page.module.scss';

// Chart components (client-side rendered)
import BalanceFlowChart from '@/components/client/BalanceFlowChartClient';
import ReturnComboChart from '@/components/client/ReturnComboClient';

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import React from 'react'; // Added missing import for React

export default function Home() {
  const { welcome, stats, historical } = dashboardData;

  const returnStats = historical.map(({ label, value }) => ({
    label: label === 'Realized Return' ? 'Realized Return ($)' : label,
    value,
  }));
  // TODO: This should come from dashboardData.ts
  // Note: ReturnCombo and BalanceFlow charts manage their own dynamic metric cards internally.

  return (
    <>
      {/* Show dashboard only when the user is signed in */}
      <SignedIn>
        <Header />
        <main className={styles.main}>
          <section className={styles.welcome}>
            <h1>{welcome.text.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < welcome.text.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}</h1>
          </section>

          {/* ---- Primary Stats ---- */}
          <section className={styles.statGrid} style={{ marginTop: '2rem' }}>
            {stats.map(({ label, value }) => (
              <StatCard key={label} label={label} value={value} />
            ))}
          </section>

          {/* ---- Charts ---- */}
          <section style={{ marginTop: '3rem', width: '100%', display: 'grid', gap: '2rem' }}>
            {/* Return Combo Chart Card */}
            <div style={{ width: '100%' }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Your Historical Returns</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                background: '#212121',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                {returnStats.map(({ label, value }) => (
                  <StatCard key={label} label={label} value={value} />
                ))}
              </div>
              <div style={{
                background: '#1c1c1c',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #333',
              }}>
                <div style={{ height: 500, width: '100%' }}>
                  <ReturnComboChart />
                </div>
              </div>
            </div>

            {/* Balance Flow Chart Card */}
            <div style={{
              background: '#1c1c1c',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #333',
            }}>
              <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Your Historical Balance</h2>
              {/* Removed static stat grid here to avoid duplication */}
              <div style={{ height: 500, width: '100%' }}>
                <BalanceFlowChart />
              </div>
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
                    background: '#1c1c1c',
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