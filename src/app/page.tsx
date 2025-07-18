"use client";

import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { useInvestor } from '@/context/InvestorContext';
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
  beginningBalance: number; // GAAP starting balance (for display)
  beginningGaap: number;
  beginningNav: number;
  // ----- NEW fields to distinguish cash vs economic performance -----
  realizedDollar: number; // cash distributions counted as return
  realizedRate: number;   // realizedDollar / beginningBalance
  // Existing fields now represent TOTAL (realised + unrealised) return
  returnDollar: number;   // totalReturnDollar
  returnRate: number;     // totalReturnRate
  action: 'Reinvested' | 'Distributed';
  netFlow: number;
  endingBalance: number;
  capitalFlow: number;
  // ----- NEW BALANCE FIELDS -----
  gaapEnd: number; // GAAP capital account at end of quarter
  navEnd: number;  // GAAP + unrealised at end
  contributionDollar: number;
  redemptionGaapDollar: number;
  redemptionNavDollar: number;
}

export default function Home() {
  // Get currently selected investor's raw transaction rows
  const { equityData } = useInvestor();

  // Parse and aggregate transactions by quarter using memoisation to avoid recomputation
  const { rows, stats, historical, welcome } = React.useMemo(() => {
    // Convert raw transactions
    const transactions = (equityData as any[]).map((t) => ({
      ...t,
      amount: parseAmount(t.Actual_Transaction_Amount as string),
      // Use Tran_Date per latest requirement (fallback to Effective_Date if missing)
      date: new Date((t as any).Tran_Date ?? (t as any).Effective_Date as string),
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

    const EARNINGS_SHIFT_SET = new Set([
      'Income Paid',
      'Income Paid - Adj',
      'Income Reinvestment',
      'Income Reinvestment - Adj',
      'Unrealized Gains/Losses',
      'Unrealized Gains/Losses-Adj',
    ]);

    function getQuarterKeyWithType(d: Date, type: string) {
      let y = d.getUTCFullYear();
      let q = Math.floor(d.getUTCMonth() / 3) + 1;
      const CUTOFF_DAYS = 5;
      // Only shift for earnings transactions; capital contributions/redemptions stay put
      if (EARNINGS_SHIFT_SET.has(type) && d.getUTCDate() <= CUTOFF_DAYS) {
        q -= 1;
        if (q === 0) {
          q = 4;
          y -= 1;
        }
      }
      return { y, q } as const;
    }

    transactions.forEach((tx) => {
      const { y: year, q: quarter } = getQuarterKeyWithType(tx.date, tx.Transaction_Type as string);
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
    let gaapBegin = 0; // GAAP capital at quarter start
    let cumulativeUnreal = 0; // Track cumulative unrealized gains/losses

    sortedKeys.forEach((key, idx) => {
      const grp = groups.get(key)!;
      // ----- Flow buckets -----
      let addGaap = 0;        // Contributions / transfers in that increase GAAP
      let subtractGaap = 0;   // Redemptions / transfers out that reduce GAAP
      let redemptionNavDollar = 0; // NAV-only redemption bucket

      let incomePaidDollar = 0;     // cash earnings paid to investor (realised)
      let incomeReinvestDollar = 0; // realised but reinvested
      let unrealizedDollar = 0;     // mark-to-market change

      let action: 'Reinvested' | 'Distributed' = 'Distributed';

      // NAV balance at the start of this quarter (GAAP + cumulative unrealized)
      const navBegin = gaapBegin + cumulativeUnreal;

      grp.transactions.forEach((tx) => {
        const type = tx.Transaction_Type as string;

        // ---- ADD or SUBTRACT GAAP FLOWS ----
        if (
          type === 'Contribution - Equity' ||
          type === 'Equity Conversion - from Line of Credit' ||
          type === 'Equity Conversion - from Long Term Note' ||
          type === 'Equity Conversion - from Short Term Note' ||
          type === 'Equity Conversion - from Temporary Note' ||
          type === 'Transfer In'
        ) {
          addGaap += tx.amount;
        } else if (
          type === 'Redemption - GAAP' ||
          type === 'Taxes Paid Behalf of Investor - Reinvest' ||
          type === 'Transfer Out'
        ) {
          subtractGaap += tx.amount;
        }

        // ---- REALISED EARNINGS ----
        if (type.startsWith('Income Paid')) {
          incomePaidDollar += tx.amount;
        } else if (type.startsWith('Income Reinvestment')) {
          // Includes "Income Reinvestment" and "Income Reinvestment - Adj"
          incomeReinvestDollar += tx.amount;
          action = 'Reinvested';
        }

        // ---- UNREALISED EARNINGS ----
        if (type.startsWith('Unrealized Gains/Losses')) {
          // Includes both base and "- Adj" variants
          unrealizedDollar += tx.amount;
        }

        // ---- OTHER bucket handling ----
        if (type === 'Redemption - NAV') {
          redemptionNavDollar += tx.amount;
        }
      });

      const realizedDollar = incomePaidDollar + incomeReinvestDollar;

      // GAAP capital movements: GAAP = previous + contributions - cash withdrawals/redemptions + income reinvestment + tax adjustments
      const gaapEnd = gaapBegin + addGaap + incomeReinvestDollar - subtractGaap;

      cumulativeUnreal += unrealizedDollar - redemptionNavDollar;
      const navEnd = gaapEnd + cumulativeUnreal;

      // Denominator logic per spec: use GAAP opening balance. For quarters starting on/after 2025-01-01
      // lock to baseline GAAP captured at cut-off, excluding later contributions/redemptions.
      const quarterStart = new Date(grp.year, (grp.quarter - 1) * 3, 1);
      const CUTOFF = new Date('2025-01-01T00:00:00Z');
      let baselineGaap: number | null = null;
      if (quarterStart >= CUTOFF && baselineGaap === null) {
        baselineGaap = gaapBegin;
      }
      const denominator = quarterStart >= CUTOFF && baselineGaap !== null ? baselineGaap : gaapBegin;

      const realizedRate = denominator > 0 ? realizedDollar / denominator : 0;
      const totalReturnDollar = realizedDollar + unrealizedDollar;
      const totalReturnRate = denominator > 0 ? totalReturnDollar / denominator : 0;

      rows.push({
        period: idx + 1,
        year: grp.year,
        quarter: grp.quarter,
        label: `${grp.year} Q${grp.quarter}`,
        beginningBalance: gaapBegin,
        beginningGaap: gaapBegin,
        beginningNav: navBegin,
        realizedDollar,
        realizedRate,
        returnDollar: totalReturnDollar, // total
        returnRate: totalReturnRate,     // total
        action,
        netFlow: addGaap - subtractGaap - redemptionNavDollar,
        capitalFlow: addGaap - subtractGaap - redemptionNavDollar,
        contributionDollar: addGaap,
        redemptionGaapDollar: subtractGaap,
        redemptionNavDollar,
        gaapEnd,
        navEnd,
        endingBalance: navEnd,
      });

      gaapBegin = gaapEnd; // next quarter starts with this GAAP balance
      // cumulativeUnreal persists across quarters
    });

    // ----- Metrics -----
    const lastRow = rows[rows.length - 1];

    const stats = [
      {
        label: 'Realized Return (%)',
        // Use simple annualisation (quarterly rate × 4) instead of compound growth
        value: percentFormatter.format(lastRow.realizedRate * 4),
      },
      {
        label: 'Realized Return ($)',
        value: currencyFormatter.format(lastRow.realizedDollar),
      },
      {
        label: 'Total Return (%)',
        // Simple annualisation for total return as well
        value: percentFormatter.format(lastRow.returnRate * 4),
      },
      {
        label: 'Total Return ($)',
        value: currencyFormatter.format(lastRow.returnDollar),
      },
      {
        label: 'GAAP Balance',
        value: currencyFormatter.format(lastRow.gaapEnd),
      },
      {
        label: 'NAV Balance',
        value: currencyFormatter.format(lastRow.navEnd),
      },
    ];

    const totalRealized = rows.reduce((sum, r) => sum + r.realizedDollar, 0);
    const totalTotal = rows.reduce((sum, r) => sum + r.returnDollar, 0);

    const historical = [
      {
        label: 'Beginning Balance',
        value: currencyFormatter.format(rows[0]?.beginningBalance ?? 0),
      },
      {
        label: 'Realized Return',
        value: currencyFormatter.format(totalRealized),
      },
      {
        label: 'Total Return',
        value: currencyFormatter.format(totalTotal),
      },
      {
        label: 'Ending GAAP Balance',
        value: currencyFormatter.format(lastRow.gaapEnd),
      },
      {
        label: 'Ending NAV Balance',
        value: currencyFormatter.format(lastRow.navEnd),
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
  }, [equityData]);

  // NEW: balance mode toggle (GAAP vs NAV)
  const [balanceMode, setBalanceMode] = React.useState<'gaap' | 'nav'>('nav');
  // Toggle for Returns chart: realised vs total (default to realised per user feedback)
  const [returnMode, setReturnMode] = React.useState<'realised' | 'total'>('realised');

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
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '30px',
                  fontWeight: 400,
                  color: '#E6E7E8',
                  fontFamily: 'Utile Regular, sans-serif'
                }}>
                  Your Historical Returns
                </h2>
              </div>
              <ReturnComboChart data={rows.map((r) => ({
                quarter: r.period,
                quarterLabel: r.label,
                beginningBalance: r.beginningBalance,
                returnRate: returnMode === 'realised' ? r.realizedRate : r.returnRate,
                returnDollar: returnMode === 'realised' ? r.realizedDollar : r.returnDollar,
                action: r.action,
                netFlow: r.netFlow,
                endingBalance: returnMode === 'realised' ? r.gaapEnd : r.navEnd,
              }))} returnMode={returnMode} onReturnModeChange={setReturnMode} />
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
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '30px',
                  fontWeight: 400,
                  color: '#E6E7E8',
                  fontFamily: 'Utile Regular, sans-serif'
                }}>
                  Your Historical Balance
                </h2>
              </div>
              <BalanceFlowChart data={(() => {
                let prevNavEnd = 0;
                return rows.map((r, idx) => {
                  const endingBalance = balanceMode === 'gaap' ? r.gaapEnd : r.navEnd;
                  let beginningBalance: number;
                  if (balanceMode === 'gaap') {
                    beginningBalance = r.beginningGaap;
                  } else {
                    // NAV mode: use stored NAV beginning balance (or previous ending nav for continuity)
                    beginningBalance = idx === 0 ? r.beginningNav : prevNavEnd;
                  }
                  prevNavEnd = endingBalance;
                  return {
                    period: r.period,
                    label: r.label,
                    year: r.year,
                    quarter: r.quarter,
                    beginningBalance,
                    returnRate: r.returnRate,
                    returnDollar: r.returnDollar,
                    action: r.action,
                    netFlow: r.netFlow,
                    capitalFlow: r.capitalFlow,
                    contributionDollar: r.contributionDollar,
                    redemptionGaapDollar: r.redemptionGaapDollar,
                    redemptionNavDollar: r.redemptionNavDollar,
                    endingBalance,
                  };
                });
              })()} balanceMode={balanceMode} onBalanceModeChange={setBalanceMode} />
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