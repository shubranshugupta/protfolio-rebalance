import { render, screen } from '@testing-library/react';
import AllocationPieChart from './AllocationPieChart';

// --- MOCK THE CHARTS ---
// Mocking the PieChart component because we don't need to test if MUI renders SVGs correctly.
// We only need to check if we passed the correct data to it.
jest.mock('@mui/x-charts/PieChart', () => ({
  PieChart: ({ series }) => {
    // Render a simplified view of the data for testing verification
    return (
      <div data-testid="mock-pie-chart">
        {series[0].data.map((item) => (
          <div key={item.id} data-testid={`slice-${item.label}`}>
            {item.label}: {item.value}
          </div>
        ))}
      </div>
    );
  },
  pieArcLabelClasses: { root: 'MuiPieArcLabel-root' },
}));

describe('AllocationPieChart Component', () => {
  
  // Sample test data
  const mockFunds = [
    { id: 1, name: 'Fund A', value: 50000, target: 60 },
    { id: 2, name: 'Fund B', value: 30000, target: 40 },
  ];

  test('renders chart titles correctly', () => {
    render(<AllocationPieChart funds={mockFunds} />);
    
    // Check if titles exist
    expect(screen.getByText(/Current Allocation \(Actual\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Allocation \(Goal\)/i)).toBeInTheDocument();
  });

  test('renders placeholder when no current value exists', () => {
    // Case where funds exist but values are 0 or empty
    const emptyFunds = [
      { id: 1, name: 'Fund A', value: 0, target: 50 },
      { id: 2, name: 'Fund B', value: 0, target: 50 },
    ];

    render(<AllocationPieChart funds={emptyFunds} />);
    
    // Check for the fallback message
    expect(screen.getByText(/Enter Fund Values to see chart/i)).toBeInTheDocument();
    
    // The "Current" chart should NOT render
    // The "Target" chart SHOULD render (because targets are set)
    const charts = screen.getAllByTestId('mock-pie-chart');
    expect(charts).toHaveLength(1); // Only Target chart
  });

  test('passes correct data to Current Allocation chart', () => {
    render(<AllocationPieChart funds={mockFunds} />);

    // We expect 2 charts (Current + Target)
    const charts = screen.getAllByTestId('mock-pie-chart');
    const currentChart = charts[0]; // First one is Current

    // Verify values inside the Current Chart
    expect(currentChart).toHaveTextContent('Fund A: 50000');
    expect(currentChart).toHaveTextContent('Fund B: 30000');
  });

  test('passes correct data to Target Allocation chart', () => {
    render(<AllocationPieChart funds={mockFunds} />);

    // We expect 2 charts
    const charts = screen.getAllByTestId('mock-pie-chart');
    const targetChart = charts[1]; // Second one is Target

    // Verify values inside the Target Chart
    expect(targetChart).toHaveTextContent('Fund A: 60');
    expect(targetChart).toHaveTextContent('Fund B: 40');
  });

  test('handles empty or malformed data gracefully', () => {
    const malformedFunds = [
      { id: 1, name: 'Fund X', value: "invalid", target: null }, // Should default to 0
    ];

    render(<AllocationPieChart funds={malformedFunds} />);

    // It should render "Enter Fund Values..." because value is effectively 0
    expect(screen.getByText(/Enter Fund Values to see chart/i)).toBeInTheDocument();

    // Check Target chart data (Should be 0)
    const charts = screen.getAllByTestId('mock-pie-chart');
    const targetChart = charts[0];
    expect(targetChart).toHaveTextContent('Fund X: 0');
  });
});