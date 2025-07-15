// Define the interface based on the curl output
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

export async function fetchEquityData(): Promise<ApiTransaction[]> {
    // For now, hardcode the URL. We'll move this to an env var later.
    const API_URL = 'https://acpinvestordashboard-byg9fdazdea0cfhq.westus-01.azurewebsites.net/equity?investor=boe';

    try {
        const response = await fetch(API_URL, {
            // Using no-cache to ensure we get fresh data, as we will later use React Query/SWR for caching.
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        return data as ApiTransaction[];

    } catch (error) {
        console.error('Failed to fetch equity data:', error);
        // In a real app, we'd handle this more gracefully.
        // For now, returning an empty array to prevent crashes.
        return [];
    }
} 