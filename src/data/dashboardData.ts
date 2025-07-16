import rawTransactions from './equity_bennett_williamson.json';

// ---------------- Types ----------------
interface Transaction {
  Actual_Transaction_Amount: string; // numeric string with commas & potentially negative sign
  Transaction_Type: string;
  Effective_Date: string;
  Tran_Date?: string;
  Investor: string;
}

interface QuarterRow {
  period: number; // sequential across dataset (1,2,...)
  label: string; // e.g. "2024 Q4"
  year: number;
  quarter: number; // 1..4 (alias for BalanceFlow)
  quarterNum: number; // duplicate for compatibility with existing helper in page.tsx
  quarterLabel: string; // formatted label like "2024 Q4"
  beginningBalance: number;
  returnRate: number; // decimal, e.g. 0.125
  returnDollar: number;
  action: 'Reinvested' | 'Distributed';
  netFlow: number; // contributions (+) or withdrawals (-)
  endingBalance: number;
}

// ---------------- Helpers ----------------
const parseAmount = (val: string): number => parseFloat(val.replace(/,/g, ''));

const getQuarterKey = (d: Date) => {
  const year = d.getUTCFullYear();
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return { key: `${year} Q${q}`, year, q } as const;
};

// ---------------- Transform ----------------
function buildQuarterlyData(transactions: Transaction[]): QuarterRow[] {
  // Group transactions by quarter key
  const groups: Record<string, {
    year: number;
    q: number;
    transactions: Transaction[];
  }> = {};

  transactions.forEach((t) => {
    // Prefer Effective_Date, else Tran_Date
    const dateStr = t.Effective_Date ?? t.Tran_Date ?? '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return; // skip invalid

    const { key, year, q } = getQuarterKey(date);
    if (!groups[key]) {
      groups[key] = { year, q, transactions: [] };
    }
    groups[key].transactions.push(t);
  });

  // Sort keys chronologically
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const [ay, aq] = a.split(' ').map((v) => (v.startsWith('Q') ? parseInt(v.slice(1), 10) : parseInt(v, 10)));
    const [by, bq] = b.split(' ').map((v) => (v.startsWith('Q') ? parseInt(v.slice(1), 10) : parseInt(v, 10)));
    if (ay !== by) return ay - by;
    return aq - bq;
  });

  const rows: QuarterRow[] = [];
  let beginningBalance = 0;

  sortedKeys.forEach((key, index) => {
    const { year, q } = groups[key];
    const quarterTransactions = groups[key].transactions;

    let returnDollar = 0;
    let netFlow = 0; // contributions / withdrawals
    let hasDistributions = false;
    let hasReinvestment = false;

    quarterTransactions.forEach((tr) => {
      const amt = parseAmount(tr.Actual_Transaction_Amount);
      const type = tr.Transaction_Type ?? '';

      if (type.startsWith('Contribution')) {
        netFlow += amt; // contribution increases balance
      } else if (type.startsWith('Distribution')) {
        returnDollar += amt; // treated as realized return
        hasDistributions = true;
      } else if (type.startsWith('Income Reinvestment')) {
        returnDollar += amt;
        hasReinvestment = true;
      } else if (type.includes('Unrealized')) {
        returnDollar += amt; // could be negative
      } else if (type.includes('Tax')) {
        returnDollar += amt; // could be negative
      }
    });

    const action: 'Reinvested' | 'Distributed' = hasDistributions && !hasReinvestment ? 'Distributed' : 'Reinvested';

    // Calculate ending balance
    let afterReturn = beginningBalance;
    if (action === 'Reinvested') {
      afterReturn += returnDollar;
    }
    const endingBalance = afterReturn + netFlow;

    const returnRate = beginningBalance !== 0 ? returnDollar / beginningBalance : 0;

    rows.push({
      period: index + 1,
      label: key,
      year,
      quarter: q, // alias for BalanceFlow fallback
      quarterNum: q,
      quarterLabel: key,
      beginningBalance,
      returnRate,
      returnDollar,
      action,
      netFlow,
      endingBalance,
    } as any);

    // Prepare for next iteration
    beginningBalance = endingBalance;
  });

  return rows;
}

// ---------------- Build equityData ----------------
const quarterlyData = buildQuarterlyData(rawTransactions as unknown as Transaction[]);
const latest = quarterlyData[quarterlyData.length - 1] ?? {
  returnRate: 0,
  returnDollar: 0,
  endingBalance: 0,
};

const investorName = (rawTransactions[0] as any)?.Investor?.split(' (')[0] ?? 'Investor';
const currentQuarterLabel = latest?.label ?? '';

const equityData = {
  investorInfo: {
    name: investorName,
    currentQuarter: currentQuarterLabel,
    currentYear: latest?.year ?? new Date().getUTCFullYear(),
  },
  historicalSummary: {
    beginningBalance: quarterlyData[0]?.beginningBalance ?? 0,
    realizedReturn: quarterlyData.reduce((sum, r) => sum + r.returnDollar, 0),
    endingBalance: latest?.endingBalance ?? 0,
  },
  quarterlyData,
};

// ---------------- Dashboard Data ----------------
const dashboardData = {
  welcome: {
    line1: `Welcome ${investorName.split(' ')[0]},`,
    line2: `Here are your ${currentQuarterLabel} numbers.`,
  },
  stats: (() => {
    const percentFormatter = new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return [
      { label: 'Realized Return (%)', value: percentFormatter.format(latest.returnRate) },
      { label: 'Realized Return ($)', value: currencyFormatter.format(latest.returnDollar) },
      { label: 'Current Balance', value: currencyFormatter.format(latest.endingBalance) },
    ];
  })(),
  historical: [
    {
      label: 'Beginning Balance',
      value: `$${equityData.historicalSummary.beginningBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: 'Realized Return',
      value: `$${equityData.historicalSummary.realizedReturn.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      label: 'Ending Balance',
      value: `$${equityData.historicalSummary.endingBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
  ],
};

export default dashboardData;
export { equityData }; 