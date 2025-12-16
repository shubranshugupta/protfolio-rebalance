import { parseGrowwFile } from './growwParser';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// --- MOCKS ---

// 1. Mock PapaParse
jest.mock('papaparse', () => ({
  parse: jest.fn(),
}));

// 2. Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
  SheetNames: [],
  Sheets: {},
}));

// 3. Mock FileReader (Browser API)
// This is necessary because Jest runs in Node.js, which doesn't have FileReader
class MockFileReader {
  readAsBinaryString() {
    // Simulate async success
    setTimeout(() => {
        this.onload({ target: { result: 'mock-binary-content' } });
    }, 10);
  }
}
global.FileReader = MockFileReader;

describe('growwParser Utility', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- HELPER: Create a fake file object ---
  const createMockFile = (name, type) => ({
    name,
    type,
    // Add other file properties if needed
  });

  // --- DATA FIXTURES ---
  // This simulates the "Messy" data Groww gives (Metadata at top, headers, data)
  const mockRawData = [
    ["Name", "John Doe"],            // Row 0: Junk Metadata
    ["PAN", "ABCDE1234F"],           // Row 1: Junk Metadata
    [],                              // Row 2: Empty
    ["Scheme Name", "Folio No", "Invested Value", "Current Value", "XIRR"], // Row 3: HEADER
    ["Nippon Small Cap", "123", "10,000", "₹ 12,000", "10%"],              // Row 4: Fund A (Entry 1)
    ["Nippon Small Cap", "456", "5,000", "₹ 8,000", "20%"],                // Row 5: Fund A (Entry 2 - Duplicate)
    ["HDFC Top 100", "789", "50,000", "50,000", "5%"],                     // Row 6: Fund B
    ["Total", "", "", "70,000", ""],                                       // Row 7: Total Row (Should be ignored)
    [],                                                                    // Row 8: Empty
  ];

  // --- TESTS ---

  test('successfully parses CSV and merges duplicate funds (Weighted XIRR)', async () => {
    const mockFile = createMockFile('holdings.csv', 'text/csv');

    // Mock Papa.parse to return our data immediately
    Papa.parse.mockImplementation((file, config) => {
      config.complete({ data: mockRawData });
    });

    const result = await parseGrowwFile(mockFile);

    // Assertions
    expect(Papa.parse).toHaveBeenCalled();
    expect(result).toHaveLength(2); // Should merge Nippon into 1, keeping HDFC (Total=2)

    // 1. Check Merge Logic (Nippon Small Cap)
    // Value 1: 12,000, XIRR: 10% -> Score: 120,000
    // Value 2: 8,000, XIRR: 20%  -> Score: 160,000
    // Total Value: 20,000
    // Total Score: 280,000
    // Weighted XIRR: 280,000 / 20,000 = 14.00%
    const nippon = result.find(f => f.name === 'Nippon Small Cap');
    expect(nippon).toBeDefined();
    expect(nippon.value).toBe(20000);
    expect(nippon.xirr).toBe(14.00);

    // 2. Check Standard Row (HDFC)
    const hdfc = result.find(f => f.name === 'HDFC Top 100');
    expect(hdfc.value).toBe(50000);
    expect(hdfc.xirr).toBe(5);
  });

  test('successfully parses XLSX files', async () => {
    const mockFile = createMockFile('holdings.xlsx', 'application/vnd.ms-excel');

    // Mock XLSX behavior
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} }
    };
    XLSX.read.mockReturnValue(mockWorkbook);
    XLSX.utils.sheet_to_json.mockReturnValue(mockRawData); // Return same data structure

    const result = await parseGrowwFile(mockFile);

    expect(XLSX.read).toHaveBeenCalled();
    expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Nippon Small Cap'); // Just checking basic success
  });

  test('throws error for unsupported file formats', async () => {
    const mockFile = createMockFile('image.png', 'image/png');
    
    await expect(parseGrowwFile(mockFile)).rejects.toMatch(/Unsupported file format/);
  });

  test('throws error if "Scheme Name" header is missing', async () => {
    const badData = [
      ["Just", "Random", "Data"],
      ["Without", "Headers", "Here"]
    ];
    const mockFile = createMockFile('bad.csv', 'text/csv');

    Papa.parse.mockImplementation((file, config) => {
      config.complete({ data: badData });
    });

    await expect(parseGrowwFile(mockFile)).rejects.toMatch(/Could not find 'Scheme Name' header/);
  });

  test('throws error if required columns are missing in the header row', async () => {
    const badHeaderData = [
      ["Scheme Name", "Some Other Column"] // Missing "Current Value"
    ];
    const mockFile = createMockFile('bad_cols.csv', 'text/csv');

    Papa.parse.mockImplementation((file, config) => {
      config.complete({ data: badHeaderData });
    });

    await expect(parseGrowwFile(mockFile)).rejects.toMatch(/Missing required columns/);
  });

  test('handles cleanNumber edge cases (NaN, empty strings)', async () => {
    // We create a specific dataset for this edge case
    const trickyData = [
      ["Scheme Name", "Current Value", "XIRR"], // Header
      ["Bad Fund", "InvalidNumber", "5%"],      // Should be treated as 0 value
      ["Empty Fund", "", ""]                    // Should be skipped
    ];
    
    const mockFile = createMockFile('tricky.csv', 'text/csv');
    Papa.parse.mockImplementation((file, config) => {
      config.complete({ data: trickyData });
    });

    const result = await parseGrowwFile(mockFile);
    
    // "Bad Fund" has 0 value, so it should be skipped by the logic:
    // "if (!name || value === 0 || name.includes("Total")) continue;"
    expect(result).toHaveLength(0);
  });
});