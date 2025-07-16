import equityData from './equity_boe.json';

const dashboardData = {
  welcome: {
    line1: `Welcome ${equityData.investorInfo.name},`,
    line2: `Here are your ${equityData.investorInfo.currentQuarter} numbers.`
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
      { label: 'Realized Return (%)', value: percentFormatter.format(equityData.currentMetrics.realizedReturnPercent / 100) },
      { label: 'Realized Return ($)', value: currencyFormatter.format(equityData.currentMetrics.realizedReturnDollar) },
      { label: 'Current Balance', value: currencyFormatter.format(equityData.currentMetrics.currentBalance) },
    ];
  })(),
  historical: (() => {
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return [
      { label: 'Beginning Balance', value: currencyFormatter.format(equityData.historicalSummary.beginningBalance) },
      { label: 'Realized Return', value: currencyFormatter.format(equityData.historicalSummary.realizedReturn) },
      { label: 'Ending Balance', value: currencyFormatter.format(equityData.historicalSummary.endingBalance) }
    ];
  })()
};

export default dashboardData;
export { equityData }; 