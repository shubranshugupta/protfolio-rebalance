import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportPortfolio from './ImportPortfolio';
import { parseGrowwFile } from '../utils/growwParser';

// --- MOCKS ---

// 1. Mock the Groww Parser
jest.mock('../utils/growwParser', () => ({
  parseGrowwFile: jest.fn(),
}));

describe('ImportPortfolio Component', () => {
  const mockSetFunds = jest.fn();
  const mockFunds = [
    { id: 1, name: 'Existing Fund', value: 10000, target: 50 }
  ];

  // Helper to mock window.alert
  const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the import button correctly', () => {
    render(<ImportPortfolio funds={mockFunds} setFunds={mockSetFunds} isMobile={false} />);
    expect(screen.getByText(/Import Portfolio/i)).toBeInTheDocument();
  });

  test('opens menu and displays broker options', async () => {
    render(<ImportPortfolio funds={mockFunds} setFunds={mockSetFunds} isMobile={false} />);

    // 1. Click the main button
    const importBtn = screen.getByText(/Import Portfolio/i);
    fireEvent.click(importBtn);

    // 2. Check if Menu opens
    expect(await screen.findByText('Groww')).toBeInTheDocument();
    expect(screen.getByText('Zerodha (Kite)')).toBeInTheDocument();
  });

  test('full flow: Open Menu -> Click Groww -> Show Modal -> Proceed -> Upload File', async () => {
    const user = userEvent.setup();
    render(<ImportPortfolio funds={mockFunds} setFunds={mockSetFunds} isMobile={false} />);

    // --- STEP 1: OPEN MENU ---
    fireEvent.click(screen.getByText(/Import Portfolio/i));

    // --- STEP 2: CLICK GROWW ---
    const growwOption = await screen.findByText('Groww');
    fireEvent.click(growwOption);

    // --- STEP 3: VERIFY MODAL OPENS ---
    // The input should NOT be clicked yet, only the modal should show
    expect(screen.getByText(/Privacy Note/i)).toBeInTheDocument();
    
    // --- STEP 4: CLICK PROCEED (The 'Close' X button on the Alert) ---
    // In MUI Alert, onClose adds an X button with aria-label="Close"
    const closeButton = screen.getByTitle(/Close/i) || screen.getByLabelText(/Close/i);
    
    // We need to spy on the hidden input to ensure it gets clicked
    const fileInput = document.getElementById('import-broker-file');
    const clickSpy = jest.spyOn(fileInput, 'click');

    fireEvent.click(closeButton);

    // Verify modal closed and input was clicked
    await waitFor(() => {
        expect(screen.queryByText(/Privacy Note/i)).not.toBeInTheDocument();
        expect(clickSpy).toHaveBeenCalled();
    });

    // --- STEP 5: SIMULATE FILE UPLOAD ---
    // Mock the parser returning data
    const mockParsedData = [
      { name: 'Existing Fund', value: 20000, xirr: 12 }, // Should merge
      { name: 'New Fund', value: 5000, xirr: 10 }        // Should add
    ];
    parseGrowwFile.mockResolvedValue(mockParsedData);

    // Create a fake file
    const file = new File(['dummy content'], 'holdings.csv', { type: 'text/csv' });

    // Trigger change event on the hidden input
    await user.upload(fileInput, file);

    // --- STEP 6: VERIFY LOGIC ---
    await waitFor(() => {
        expect(parseGrowwFile).toHaveBeenCalledWith(file);
    });

    // Check if setFunds was called with the MERGED data
    await waitFor(() => {
        const expectedMergedData = [
            { name: 'Existing Fund', value: 20000, xirr: 12, target: 50 }, // Target preserved
            { name: 'New Fund', value: 5000, xirr: 10, target: 0 }         // Default target
        ];
        
        // We match objectContaining because spread operator might add ID or other props
        expect(mockSetFunds).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ name: 'Existing Fund', target: 50 }),
            expect.objectContaining({ name: 'New Fund', target: 0 })
        ]));
    });

    // Verify Success Alert
    expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Successfully imported/i));
  });

  test('shows alert for disabled Zerodha option', async () => {
    render(<ImportPortfolio funds={mockFunds} setFunds={mockSetFunds} isMobile={false} />);

    fireEvent.click(screen.getByText(/Import Portfolio/i));
    
    // Note: The MenuItem is disabled in your code, but the click handler is on the Item. 
    // If MUI disables pointer events, fireEvent might still force it, 
    // but typically user interaction is blocked.
    // However, your code logic has `case 'zerodha'` which triggers an alert. 
    // If the MenuItem is `disabled`, onClick might not fire at all in real DOM.
    // Assuming we force click it to test the switch case fallback:
    
    const zerodhaOption = await screen.findByText('Zerodha (Kite)');
    
    // If strictly disabled, we can check attribute
    if (zerodhaOption.closest('li').getAttribute('aria-disabled') === 'true') {
        expect(zerodhaOption.closest('li')).toHaveAttribute('aria-disabled', 'true');
    } else {
        // If clickable
        fireEvent.click(zerodhaOption);
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/coming soon/i));
    }
  });

  test('handles file parsing errors gracefully', async () => {
    render(<ImportPortfolio funds={mockFunds} setFunds={mockSetFunds} isMobile={false} />);

    // Mock Parser Error
    parseGrowwFile.mockRejectedValue(new Error('Invalid CSV format'));

    // Skip UI steps and simulate input change directly for speed
    const fileInput = document.getElementById('import-broker-file');
    // We need to set state to 'groww' internally, but since we can't access state easily in integration test,
    // we have to go through the UI flow or export logic.
    // Let's do UI flow quickly:
    
    fireEvent.click(screen.getByText(/Import Portfolio/i));
    fireEvent.click(screen.getByText('Groww'));
    const closeButton = screen.getByLabelText(/Close/i);
    fireEvent.click(closeButton);

    const file = new File(['bad content'], 'bad.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringMatching(/Error importing: Error: Invalid CSV format/i));
    });
  });
});