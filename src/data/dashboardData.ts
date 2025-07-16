// Import the raw transaction-level dataset provided by the client. The file name contains a space, which is valid in an import path.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rawTransactions from './equity_boe v2.json';

/**
 * Schema for a single raw transaction record coming from SS&C export.
 */
interface RawTransaction {
  Actual_Transaction_Amount: string; // e.g. "2,551.71"
  Effective_Date: string;            // e.g. "Tue, 30 Jun 2015 00:00:00 GMT"
  Transaction_Type: string;          // e.g. "Distribution - Preferred Return"
  Investor: string;                  // e.g. "Stelck Boeger 1998 Revocable Trust (i2)"
}

/** Helper: parse a formatted currency string (with commas) into a number */
const parseAmount = (value: string): number => parseFloat(value.replace(/,/g, ''));

/** Helper: determine calendar quarter (1-4) given a JS Date */
const quarterOf = (d: Date): number => Math.floor(d.getUTCMonth() / 3) + 1;

/**
 * Aggregate the raw transactions to a quarterly dataset compatible with the
 * components that power the dashboard charts.
 */
function buildQuarterlyData(transactions: RawTransaction[]) {
  // 1. Group by year-quarter.
  const buckets = new Map<string, RawTransaction[]>();

  transactions.forEach((tx) => {
    const date = new Date(tx.Effective_Date);
    const y = date.getUTCFullYear();
    const q = quarterOf(date);
    const key = `${y}-Q${q}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(tx);
  });

  // 2. Sort the buckets chronologically.
  const orderedKeys = Array.from(buckets.keys()).sort((a, b) => {
    const [ay, aq] = a.split('-Q').map(Number);
    const [by, bq] = b.split('-Q').map(Number);
    return ay === by ? aq - bq : ay - by;
  });

  const quarterlyRows: any[] = [];
  let runningBalance = 0;
  let periodIdx = 1;

  orderedKeys.forEach((key) => {
    const rows = buckets.get(key)!;
    const [yearStr, quarterStr] = key.split('-Q');
    const year = Number(yearStr);
    const quarterNum = Number(quarterStr);

    let contributions = 0;
    let distributions = 0;

    rows.forEach((tx) => {
      const amt = parseAmount(tx.Actual_Transaction_Amount);
      if (tx.Transaction_Type.startsWith('Contribution')) {
        contributions += amt;
      } else if (tx.Transaction_Type.startsWith('Distribution') || tx.Transaction_Type.startsWith('Income')) {
        distributions += amt;
      }
    });

    const beginningBalance = runningBalance;
    const returnDollar = distributions;
    const returnRate = beginningBalance > 0 ? returnDollar / beginningBalance : 0;

    // If there was any cash distribution treat it as "Distributed", otherwise assume reinvested.
    const action: 'Reinvested' | 'Distributed' = returnDollar > 0 ? 'Distributed' : 'Reinvested';

    // Returns are *not* added to ending balance when distributed.
    const afterReturn = action === 'Reinvested' ? beginningBalance + returnDollar : beginningBalance;

    const netFlow = contributions; // Positive contributions only (no withdrawal data in export)
    const endingBalance = afterReturn + netFlow;

    quarterlyRows.push({
      quarter: periodIdx,
      quarterLabel: `${year} Q${quarterNum}`,
      period: periodIdx,
      label: `${year} Q${quarterNum}`,
      year,
      quarterNum,
      beginningBalance,
      returnRate,
      returnDollar,
      action,
      netFlow,
      endingBalance,
    });

    runningBalance = endingBalance;
    periodIdx += 1;
  });

  return quarterlyRows;
}

// Derive aggregated dataset once at module initialisation.
const quarterlyData = buildQuarterlyData(rawTransactions as unknown as RawTransaction[]);

// ---- Derive summary & metadata ----
const investorRaw = (rawTransactions[0] as RawTransaction).Investor ?? 'Investor';
// Welcome banner uses the surname – assume second word in investor name string.
const investorSurname = investorRaw.split(' ')[1] ?? investorRaw.split(' ')[0];

const lastRow = quarterlyData[quarterlyData.length - 1] ?? {
  year: new Date().getUTCFullYear(),
  quarterNum: 0,
  endingBalance: 0,
  returnDollar: 0,
  returnRate: 0,
};

const equityData = {
  investorInfo: {
    name: investorSurname,
    currentQuarter: `${lastRow.year} Q${lastRow.quarterNum}`,
    currentYear: lastRow.year,
  },
  historicalSummary: {
    beginningBalance: quarterlyData[0]?.beginningBalance ?? 0,
    realizedReturn: quarterlyData.reduce((acc, r) => acc + r.returnDollar, 0),
    endingBalance: lastRow.endingBalance,
  },
  quarterlyData,
};

// ---- Prepare data projections consumed by page.tsx ----
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

const stats = (() => {
  const latest = quarterlyData[quarterlyData.length - 1];
  if (!latest) return [] as never[];
  return [
    { label: 'Realized Return (%)', value: percentFormatter.format(latest.returnRate) },
    { label: 'Realized Return ($)', value: currencyFormatter.format(latest.returnDollar) },
    { label: 'Current Balance', value: currencyFormatter.format(latest.endingBalance) },
  ];
})();

const historical = [
  {
    label: 'Beginning Balance',
    value: currencyFormatter.format(equityData.historicalSummary.beginningBalance),
  },
  {
    label: 'Realized Return',
    value: currencyFormatter.format(equityData.historicalSummary.realizedReturn),
  },
  {
    label: 'Ending Balance',
    value: currencyFormatter.format(equityData.historicalSummary.endingBalance),
  },
];

const dashboardData = {
  welcome: {
    line1: `Welcome ${investorSurname},`,
    line2: `Here are your ${equityData.investorInfo.currentQuarter} numbers.`,
  },
  stats,
  historical,
};

export default dashboardData;
export { equityData }; 