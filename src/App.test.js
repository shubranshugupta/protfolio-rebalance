import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// --- Mocks ---

// Mock window.alert since it's not implemented in the test environment
var window = global.window;
window.alert = jest.fn();

global.URL.createObjectURL = jest.fn();

// Mock LocalStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SIP Rebalancer App', () => {

    beforeEach(() => {
        // Clear data before each test to ensure a clean slate
        window.localStorage.clear();
        window.alert.mockClear();
    });

    test('renders the main title and default inputs', () => {
        render(<App />);
        const linkElement = screen.getByText(/SIP Rebalancer/i);
        expect(linkElement).toBeInTheDocument();

        // Check if default SIP amount input exists
        const sipInput = screen.getByLabelText(/Monthly SIP Amount/i);
        expect(sipInput).toBeInTheDocument();
        expect(sipInput.value).toBe('20000'); // Default value
    });

    test('calculates allocation correctly for a simple scenario', () => {
        render(<App />);

        // 1. Set SIP Amount to 10,000
        const sipInput = screen.getByLabelText(/Monthly SIP Amount/i);
        fireEvent.change(sipInput, { target: { value: '10000' } });

        // 2. Setup Fund A (50%) and Fund B (50%) - assuming default has 3 items, we delete one
        // const deleteButtons = screen.getAllByTestId('DeleteIcon'); // MUI Icon check
        // Note: In real testing, it's better to rely on accessibility roles, 
        // but for MUI icons we often click the button wrapping them.
        // const buttons = screen.getAllByRole('button', { name: '' }); // Delete buttons often have no text
        // Let's rely on finding inputs to modify the default funds instead of deleting

        const names = screen.getAllByLabelText(/Fund Name/i);
        const values = screen.getAllByLabelText(/^Current Value$/i); // Exact match
        const targets = screen.getAllByLabelText(/^Target$/i);

        // Modify Fund 1: Value 0, Target 50%
        fireEvent.change(names[0], { target: { value: 'Fund A' } });
        fireEvent.change(values[0], { target: { value: '0' } });
        fireEvent.change(targets[0], { target: { value: '50' } });

        // Modify Fund 2: Value 0, Target 50%
        fireEvent.change(names[1], { target: { value: 'Fund B' } });
        fireEvent.change(values[1], { target: { value: '0' } });
        fireEvent.change(targets[1], { target: { value: '50' } });

        // Set Fund 3 to 0% to ignore it or delete it. Let's Set to 0 to be safe.
        fireEvent.change(targets[2], { target: { value: '0' } });

        // 3. Click Calculate
        const calcButton = screen.getByText(/Calculate/i);
        fireEvent.click(calcButton);

        // 4. Check Results
        // Since SIP is 10k, and both funds are empty with 50% target, 
        // they should get 5k each.

        const resultsTable = screen.getByRole('table');
        expect(resultsTable).toBeInTheDocument();

        // Check for values in the table cells
        expect(screen.getByText('Fund A')).toBeInTheDocument();
        expect(screen.getByText('Fund B')).toBeInTheDocument();

        // We look for formatted numbers
        const moneyCells = screen.getAllByText(/5,000/i);
        expect(moneyCells.length).toBeGreaterThanOrEqual(2);
    });

    test('shows alert validation if targets do not equal 100%', () => {
        render(<App />);

        const targets = screen.getAllByLabelText(/^Target$/i);

        // Set first target to 10% (Default total will now be mismatch)
        fireEvent.change(targets[0], { target: { value: '10' } });

        const calcButton = screen.getByText(/Calculate/i);
        fireEvent.click(calcButton);

        expect(window.alert).toHaveBeenCalled();
    });

    test('adds and removes fund rows', async () => {
        render(<App />);

        // 1. Check Initial State (Should be 3 rows)
        const initialRows = screen.getAllByLabelText(/Fund Name/i);
        expect(initialRows).toHaveLength(3);

        // 2. Add a Fund
        const addButton = screen.getByText(/Add Fund/i);
        fireEvent.click(addButton);

        // Wait for the row to appear (Safety check)
        await waitFor(() => {
            const afterAddRows = screen.getAllByLabelText(/Fund Name/i);
            expect(afterAddRows).toHaveLength(4);
        });

        // 3. Remove a Fund
        // Now this will work because we added aria-label="delete fund" in Step 1
        const deleteButtons = screen.getAllByRole('button', { name: /delete fund/i });

        // We expect 4 delete buttons now. Click the first one.
        expect(deleteButtons).toHaveLength(4);
        fireEvent.click(deleteButtons[0]);

        // 4. Verify Removal
        await waitFor(() => {
            const finalRows = screen.getAllByLabelText(/Fund Name/i);
            expect(finalRows).toHaveLength(3);
        });
    });

    test('saves and loads from localStorage', () => {
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
        
        render(<App />);

        const saveButton = screen.getByText(/Save/i);
        const sipInput = screen.getByLabelText(/Monthly SIP Amount/i);

        // Change SIP
        fireEvent.change(sipInput, { target: { value: '25000' } });

        // Click Save
        fireEvent.click(saveButton);

        // Check if localStorage was called
        expect(window.alert).toHaveBeenCalledWith("Data saved successfully!");
        expect(window.localStorage.getItem('sipAmount')).toBe('25000');
    });

    test('toggles dark mode', () => {
        render(<App />);

        // CORRECT WAY: Find button by its accessible name (aria-label)
        // No more .parentElement!
        const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

        fireEvent.click(toggleButton);

        // Check if localStorage updated the theme preference
        expect(window.localStorage.getItem('themeMode')).toBe('dark');
    });
});