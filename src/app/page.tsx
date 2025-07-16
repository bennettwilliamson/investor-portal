"use client";

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import equityData from '@/data/brian_schmidt.json';
import styles from './page.module.scss';

// Chart components (client-side rendered)
import BalanceFlowChart from '@/components/client/BalanceFlowChartClient';
import ReturnComboChart from '@/components/client/ReturnComboClient';

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import React from 'react';

// Helper formatters
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Utility to parse "1,234.56" or "-4.71" into number
function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

interface AggregatedRow {
  period: number;
  year: number;
  quarter: number;
  label: string; // e.g. "2024 Q4"
  beginningBalance: number;
  returnDollar: number;
  returnRate: number; // decimal
  action: 'Reinvested' | 'Distributed';
  netFlow: number;
  endingBalance: number;
}

export default function Home() {
  // Parse and aggregate transactions by quarter using memoisation to avoid recomputation
  const { rows, stats, historical, welcome } = React.useMemo(() => {
    // Convert raw transactions
    const transactions = (equityData as any[]).map((t) => ({
      ...t,
      amount: parseAmount(t.Actual_Transaction_Amount as string),
      date: new Date(t.Effective_Date as string),
    })) as Array<{
      amount: number;
      date: Date;
      Transaction_Type: string;
      Investor: string;
    }>;

    // Sort chronologically
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by year + quarter
    const groups = new Map<string, {
      year: number;
      quarter: number;
      transactions: typeof transactions;
    }>();

    transactions.forEach((tx) => {
      const year = tx.date.getUTCFullYear();
      const quarter = Math.floor(tx.date.getUTCMonth() / 3) + 1;
      const key = `${year}-Q${quarter}`;
      if (!groups.has(key)) {
        groups.set(key, { year, quarter, transactions: [] });
      }
      groups.get(key)!.transactions.push(tx);
    });

    // Build aggregated rows in chronological order
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      const [ay, aq] = a.split('-Q').map(Number);
      const [by, bq] = b.split('-Q').map(Number);
      return ay === by ? aq - bq : ay - by;
    });

    const rows: AggregatedRow[] = [];
    let beginningBalance = 0;

    sortedKeys.forEach((key, idx) => {
      const grp = groups.get(key)!;
      let returnDollar = 0;
      let netFlow = 0;
      let action: 'Reinvested' | 'Distributed' = 'Distributed';

      grp.transactions.forEach((tx) => {
        const type = tx.Transaction_Type;
        if (type === 'Contribution - Equity') {
          netFlow += tx.amount;
        } else {
          returnDollar += tx.amount;
        }

        if (type === 'Income Reinvestment') {
          action = 'Reinvested';
        }
      });

      const endingBalance = beginningBalance + returnDollar + netFlow;
      const returnRate = beginningBalance > 0 ? returnDollar / beginningBalance : 0;

      rows.push({
        period: idx + 1,
        year: grp.year,
        quarter: grp.quarter,
        label: `${grp.year} Q${grp.quarter}`,
        beginningBalance,
        returnDollar,
        returnRate,
        action,
        netFlow,
        endingBalance,
      });

      beginningBalance = endingBalance;
    });

    // ----- Metrics -----
    const lastRow = rows[rows.length - 1];

    const stats = [
      {
        label: 'Realized Return (%)',
        value: percentFormatter.format(lastRow.returnRate),
      },
      {
        label: 'Realized Return ($)',
        value: currencyFormatter.format(lastRow.returnDollar),
      },
      {
        label: 'Current Balance',
        value: currencyFormatter.format(lastRow.endingBalance),
      },
    ];

    const totalReturns = rows.reduce((sum, r) => sum + r.returnDollar, 0);

    const historical = [
      {
        label: 'Beginning Balance',
        value: currencyFormatter.format(rows[0]?.beginningBalance ?? 0),
      },
      {
        label: 'Realized Return',
        value: currencyFormatter.format(totalReturns),
      },
      {
        label: 'Ending Balance',
        value: currencyFormatter.format(lastRow.endingBalance),
      },
    ];

    // Greeting lines
    const investorNameRaw = (equityData as any[])[0]?.Investor ?? '';
    const firstNameMatch = investorNameRaw.match(/[A-Za-z]+/);
    const firstName = firstNameMatch ? firstNameMatch[0] : 'Investor';

    const welcome = {
      line1: `Welcome ${firstName},`,
      line2: `Here are your ${lastRow.year} Q${lastRow.quarter} numbers.`,
    };

    return { rows, stats, historical, welcome };
  }, []);

  return (
    <>
      {/* Show dashboard only when the user is signed in */}
      <SignedIn>
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
            {/* Return Combo Chart */}
            <div style={{
              height: 560,
              width: '100%',
              marginBottom: '3rem',
              background: '#212121',
              borderRadius: '12px',
              padding: '0.75rem 2rem 2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '30px',
                  fontWeight: 400,
                  color: '#E6E7E8',
                  fontFamily: 'Utile Regular, sans-serif'
                }}>
                  Your Historical Returns
                </h2>
                <div style={{
                  marginTop: 4,
                  width: 180,
                  height: 2,
                  backgroundColor: '#008bce'
                }} />
              </div>
              <ReturnComboChart data={rows.map((r) => ({
                quarter: r.period,
                quarterLabel: r.label,
                beginningBalance: r.beginningBalance,
                returnRate: r.returnRate,
                returnDollar: r.returnDollar,
                action: r.action,
                netFlow: r.netFlow,
                endingBalance: r.endingBalance,
              }))} />
            </div>

            {/* Balance Flow Chart */}
            <div style={{
              height: 560,
              width: '100%',
              background: '#212121',
              borderRadius: '12px',
              padding: '0.75rem 2rem 2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '30px',
                  fontWeight: 400,
                  color: '#E6E7E8',
                  fontFamily: 'Utile Regular, sans-serif'
                }}>
                  Your Historical Balance
                </h2>
                <div style={{
                  marginTop: 4,
                  width: 180,
                  height: 2,
                  backgroundColor: '#008bce'
                }} />
              </div>
              <BalanceFlowChart data={rows.map((r) => ({
                period: r.period,
                label: r.label,
                year: r.year,
                quarter: r.quarter,
                beginningBalance: r.beginningBalance,
                returnRate: r.returnRate,
                returnDollar: r.returnDollar,
                action: r.action,
                netFlow: r.netFlow,
                endingBalance: r.endingBalance,
              }))} />
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
                  // Enlarge the logo container by 50% while keeping Clerk functionality intact
                  logoBox: {
                    transform: 'scale(3)',
                    transformOrigin: 'top center',
                    marginTop: '1.25rem',
                    marginBottom: '0.5rem'
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
                    fontWeight: '300', // lighter weight for cleaner look
                  },
                  headerSubtitle: {
                    display: 'none',
                  },
                  alternativeMethodsBlockButton: {
                    color: '#b0b0b0', // medium grey for readability
                    fontSize: '1rem',
                    fontWeight: '500',
                    '&:hover': {
                      color: '#c8c8c8'
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
                    '&::placeholder': {
                      color: '#8e8e8e' // lighter medium grey placeholder
                    },
                    '&:focus': {
                      borderColor: '#008bce'
                    }
                  },
                  formFieldLabel: {
                    color: '#e6e7e8',
                    fontSize: '1rem',
                    fontWeight: '500'
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