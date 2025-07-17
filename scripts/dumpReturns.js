const fs = require('fs');
const path = require('path');

// Usage: node scripts/dumpReturns.js [path/to/json]
const file = process.argv[2] || path.join(__dirname, '..', 'src', 'data', 'brian_schmidt.json');

if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

const rowsRaw = JSON.parse(fs.readFileSync(file, 'utf8'));

const parseAmount = (raw) => parseFloat(String(raw).replace(/,/g, ''));
const quarterKey = (d) => `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;

// Group transactions by year-quarter
const groups = new Map();
for (const tx of rowsRaw) {
  const amount = parseAmount(tx.Actual_Transaction_Amount);
  const date = new Date(tx.Effective_Date || tx.Tran_Date);
  const key = quarterKey(date);
  if (!groups.has(key)) {
    groups.set(key, { year: date.getUTCFullYear(), quarter: Math.floor(date.getUTCMonth() / 3) + 1, transactions: [] });
  }
  groups.get(key).transactions.push({ ...tx, amount, date });
}

// Sort keys chronologically
const sortedKeys = [...groups.keys()].sort((a, b) => {
  const [ay, aq] = a.split('-Q').map(Number);
  const [by, bq] = b.split('-Q').map(Number);
  return ay === by ? aq - bq : ay - by;
});

let gaapBegin = 0;
let cumulativeUnreal = 0;
const rows = [];

for (const key of sortedKeys) {
  const grp = groups.get(key);
  let contribution = 0;
  let incomePaid = 0;
  let incomeReinvest = 0;
  let redeemGaap = 0;
  let redeemNav = 0;
  let unreal = 0;

  for (const tx of grp.transactions) {
    const type = tx.Transaction_Type;
    if (type === 'Contribution - Equity') contribution += tx.amount;
    else if (type.startsWith('Income Paid')) incomePaid += tx.amount;
    else if (type.startsWith('Income Reinvestment')) incomeReinvest += tx.amount;
    else if (type === 'Redemption - GAAP') redeemGaap += tx.amount;
    else if (type === 'Redemption - NAV') redeemNav += tx.amount;
    else if (type.startsWith('Unrealized Gains/Losses')) unreal += tx.amount;
    // Tax Increase/Decrease excluded from returns per requirements
  }

  const realizedDollar = incomePaid + incomeReinvest;
  const gaapEnd = gaapBegin + contribution + incomeReinvest - redeemGaap;
  cumulativeUnreal += unreal - redeemNav;
  const navEnd = gaapEnd + cumulativeUnreal;

  const denominator = gaapBegin - redeemGaap;
  const realizedRate = denominator > 0 ? realizedDollar / denominator : 0;
  const totalReturnDollar = realizedDollar + unreal;
  const totalReturnRate = denominator > 0 ? totalReturnDollar / denominator : 0;

  rows.push({
    label: `${grp.year} Q${grp.quarter}`,
    gaapBegin,
    denominator,
    realizedRateAnnual: realizedRate * 4,
    totalRateAnnual: totalReturnRate * 4,
  });

  gaapBegin = gaapEnd;
}

// Print last 8 quarters (or fewer if data shorter)
const out = rows.slice(-8);
console.table(out.map(r => ({
  Quarter: r.label,
  'GAAP Begin': r.gaapBegin.toFixed(2),
  Denominator: r.denominator.toFixed(2),
  'Realised %': (r.realizedRateAnnual * 100).toFixed(2),
  'Total %': (r.totalRateAnnual * 100).toFixed(2),
}))); 