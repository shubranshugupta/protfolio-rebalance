// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock ResizeObserver (MUI Charts uses this to resize charts)
global.ResizeObserver = require('resize-observer-polyfill');

// Mock the PieChart to avoid the "@mui/x-charts-vendor" error
jest.mock('@mui/x-charts/PieChart', () => ({
  PieChart: ({ series }) => (
    <div data-testid="mock-pie-chart">
      {series && series[0] && series[0].data.length > 0 ? "Pie Chart Rendered" : "Empty Chart"}
    </div>
  ),
  pieArcLabelClasses: { root: 'MuiPieArcLabel-root' },
}));