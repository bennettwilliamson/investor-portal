import equityData from './equity_boe.json';

const dashboardData = {
  welcome: {
    line1: `Welcome ${equityData.investorInfo.name},`,
    line2: `Here are your ${equityData.investorInfo.currentQuarter} numbers.`
  },
  stats: [
    { label: 'Realized Return (%)', value: `${equityData.currentMetrics.realizedReturnPercent}%` },
    { label: 'Realized Return ($)', value: `$${equityData.currentMetrics.realizedReturnDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Current Balance', value: `$${equityData.currentMetrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  ],
  historical: [
    { label: 'Beginning Balance', value: `$${equityData.historicalSummary.beginningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Realized Return', value: `$${equityData.historicalSummary.realizedReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Ending Balance', value: `$${equityData.historicalSummary.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  ]
};

export default dashboardData;
export { equityData }; 