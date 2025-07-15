// API Response Data - Stored for development/testing purposes
// This data was fetched from: https://acpinvestordashboard-byg9fdazdea0cfhq.westus-01.azurewebsites.net/equity?investor=boe

export interface ApiTransaction {
  Actual_Transaction_Amount: string;
  Control: number;
  Effective_Date: string;
  ID: number;
  Investment: string;
  Investor: string;
  Post_Month: string;
  Prorated_Transaction: string;
  Prorated_Transaction_Amount: string;
  Share_Price: string;
  Shares: string;
  Tran_Date: string;
  Transaction_Type: string;
}

export const apiResponseData: ApiTransaction[] = [
  {
    "Actual_Transaction_Amount": "500,000.00",
    "Control": 39967,
    "Effective_Date": "Fri, 29 May 2015 00:00:00 GMT",
    "ID": 24894,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Thu, 15 May 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "500,000.00",
    "Share_Price": "1,000.00",
    "Shares": "500",
    "Tran_Date": "Fri, 29 May 2015 00:00:00 GMT",
    "Transaction_Type": "Contribution - Equity"
  },
  {
    "Actual_Transaction_Amount": "2,551.71",
    "Control": 39971,
    "Effective_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "ID": 24895,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Sun, 15 Jun 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "2,551.71",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Excess Distributable Cash"
  },
  {
    "Actual_Transaction_Amount": "3,616.44",
    "Control": 43275,
    "Effective_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "ID": 24896,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Sun, 15 Jun 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "3,616.44",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Preferred Return"
  },
  {
    "Actual_Transaction_Amount": "6,168.15",
    "Control": 43276,
    "Effective_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "ID": 24897,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Sun, 15 Jun 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "6,168.15",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Tue, 30 Jun 2015 00:00:00 GMT",
    "Transaction_Type": "Income Paid"
  },
  {
    "Actual_Transaction_Amount": "10,397.66",
    "Control": 39978,
    "Effective_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "ID": 24898,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Sep 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "10,397.66",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Excess Distributable Cash"
  },
  {
    "Actual_Transaction_Amount": "10,082.19",
    "Control": 43281,
    "Effective_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "ID": 24899,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Sep 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "10,082.19",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Preferred Return"
  },
  {
    "Actual_Transaction_Amount": "20,479.85",
    "Control": 43282,
    "Effective_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "ID": 24900,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Sep 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "20,479.85",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Wed, 30 Sep 2015 00:00:00 GMT",
    "Transaction_Type": "Income Paid"
  },
  {
    "Actual_Transaction_Amount": "8,859.66",
    "Control": 39995,
    "Effective_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "ID": 24901,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Dec 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "8,859.66",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Excess Distributable Cash"
  },
  {
    "Actual_Transaction_Amount": "10,082.19",
    "Control": 43288,
    "Effective_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "ID": 24902,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Dec 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "10,082.19",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "Transaction_Type": "Distribution - Preferred Return"
  },
  {
    "Actual_Transaction_Amount": "18,941.85",
    "Control": 43289,
    "Effective_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "ID": 24903,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Mon, 15 Dec 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "18,941.85",
    "Share_Price": "0",
    "Shares": "0",
    "Tran_Date": "Thu, 31 Dec 2015 00:00:00 GMT",
    "Transaction_Type": "Income Paid"
  },
  {
    "Actual_Transaction_Amount": "100,000.00",
    "Control": 40005,
    "Effective_Date": "Fri, 01 Jan 2016 00:00:00 GMT",
    "ID": 24904,
    "Investment": "Alturas Real Estate Fund (01-aref )",
    "Investor": "Stelck Boeger 1998 Revocable Trust (i2)",
    "Post_Month": "Thu, 16 Jan 2025 00:00:00 GMT",
    "Prorated_Transaction": "100",
    "Prorated_Transaction_Amount": "100,000.00",
    "Share_Price": "1,000.00",
    "Shares": "100",
    "Tran_Date": "Fri, 01 Jan 2016 00:00:00 GMT",
    "Transaction_Type": "Contribution - Equity"
  }
  // Note: This is a sample of the data. The full dataset contains many more transactions.
  // The complete dataset spans from 2015 to 2024 with quarterly transactions.
];

// Helper function to parse currency strings to numbers
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/,/g, '')) || 0;
}

// Helper function to parse date strings
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

// Helper function to get quarter from date
export function getQuarterFromDate(date: Date): { year: number; quarter: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return { year, quarter };
}

// Helper function to format quarter label
export function formatQuarterLabel(year: number, quarter: number): string {
  return `${year} Q${quarter}`;
}

// Transaction type categories for analysis
export const TRANSACTION_CATEGORIES = {
  CONTRIBUTIONS: [
    'Contribution - Equity',
    'Transfer In',
    'Income Reinvestment'
  ],
  DISTRIBUTIONS: [
    'Distribution - Excess Distributable Cash',
    'Distribution - Preferred Return',
    'Distribution - Realized Gain/Loss',
    'Transfer Out'
  ],
  INCOME: [
    'Income Paid'
  ],
  UNREALIZED: [
    'Unrealized Gains/Losses',
    'Unrealized Gains/Losses-Adj'
  ],
  TAXES: [
    'Tax Increase/Decrease'
  ]
} as const;

// Export the raw JSON for reference
export const rawApiResponse = apiResponseData; 