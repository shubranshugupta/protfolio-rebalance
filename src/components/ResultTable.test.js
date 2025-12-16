import { render, screen } from '@testing-library/react';
import ResultTable from './ResultTable';

describe('ResultTable Component', () => {
    // --- MOCK DATA ---
    // Weighted XIRR Math: 
    // Fund A: 10,000 * 10% = 1,000
    // Fund B: 20,000 * 20% = 4,000
    // Total Value: 30,000
    // Weighted Sum: 5,000
    // Result: 5,000 / 30,000 = 16.67%
    const mockFunds = [
        { id: 1, name: 'Fund A', value: 10000, xirr: 10 },
        { id: 2, name: 'Fund B', value: 20000, xirr: 20 }
    ];

    const mockResults = {
        total: 5000,
        data: [
            { id: 1, name: 'Fund A', currentPct: '33.3', xirr: 10, investAmount: 2000 },
            { id: 2, name: 'Fund B', currentPct: '66.7', xirr: 20, investAmount: 3000 }
        ]
    };

    // --- TEST 1: CALCULATIONS ---
    test('correctly calculates and displays weighted average XIRR', () => {
        render(<ResultTable funds={mockFunds} results={mockResults} isMobile={false} />);
        
        // Check calculation logic (explained in mock data comments above)
        expect(screen.getByText(/Portfolio Avg XIRR: 16.67%/i)).toBeInTheDocument();
    });

    test('handles negative XIRR correctly', () => {
        const negativeFunds = [{ id: 1, value: 1000, xirr: -10 }];
        const negativeResults = { total: 0, data: [] };
        
        render(<ResultTable funds={negativeFunds} results={negativeResults} isMobile={false} />);
        
        expect(screen.getByText(/Portfolio Avg XIRR: -10.00%/i)).toBeInTheDocument();
    });

    test('handles zero total value (prevents NaN)', () => {
        const zeroFunds = [{ id: 1, value: 0, xirr: 10 }]; // New user scenario
        
        render(<ResultTable funds={zeroFunds} results={mockResults} isMobile={false} />);
        
        expect(screen.getByText(/Portfolio Avg XIRR: 0%/i)).toBeInTheDocument();
    });

    // --- TEST 2: DESKTOP LAYOUT ---
    test('renders full table columns on Desktop', () => {
        render(<ResultTable funds={mockFunds} results={mockResults} isMobile={false} />);

        // 1. Check Headers (Desktop should have specific columns)
        // Note: We use { selector: 'th' } to ensure we are finding headers
        expect(screen.getByRole('columnheader', { name: /current %/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /xirr/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /invest/i })).toBeInTheDocument();

        // 2. Check Row Data
        expect(screen.getByText('Fund A')).toBeInTheDocument();
        expect(screen.getByText('33.3%')).toBeInTheDocument(); // Current % cell
        expect(screen.getByText('₹ 2,000')).toBeInTheDocument(); // Invest Amount formatted
    });

    // --- TEST 3: MOBILE LAYOUT ---
    test('renders compact layout on Mobile', () => {
        render(<ResultTable funds={mockFunds} results={mockResults} isMobile={true} />);

        // 1. Check Headers (Should NOT exist)
        expect(screen.queryByText('Current %', { selector: 'th' })).not.toBeInTheDocument();
        expect(screen.queryByText('XIRR', { selector: 'th' })).not.toBeInTheDocument();

        // 2. Check "Collapsed" Details
        // On mobile, details are shown inside the Name cell
        // We look for the text containing the portfolio %
        expect(screen.getByText(/33.3% portfolio/i)).toBeInTheDocument();
    });

    // --- TEST 4: TOTAL ROW ---
    test('renders the Total row correctly', () => {
        render(<ResultTable funds={mockFunds} results={mockResults} isMobile={false} />);

        const totalLabel = screen.getByText('Total:');
        expect(totalLabel).toBeInTheDocument();

        // Check the total value formatting
        // "5000" should become "₹ 5,000"
        expect(screen.getByText('₹ 5,000')).toBeInTheDocument();
    });
});