import equityData from './equity_boe.json';

const dashboardData = {
  welcome: {
    line1: `Welcome ${equityData.investorInfo.name.split(' ')[0]},`,
    line2: `Here are your ${equityData.investorInfo.currentQuarter} numbers.`
  },
  stats: (() => {
    const latest = equityData.quarterlyData[equityData.quarterlyData.length - 1];
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
    { label: 'Beginning Balance', value: `$${equityData.historicalSummary.beginningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Realized Return', value: `$${equityData.historicalSummary.realizedReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: 'Ending Balance', value: `$${equityData.historicalSummary.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  ]
};

export default dashboardData;
export { equityData }; 