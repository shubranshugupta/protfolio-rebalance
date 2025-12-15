import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Main entry point to parse Groww files (CSV or XLSX).
 * Automatically detects file type and merges duplicate schemes.
 */
export const parseGrowwFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
      parseCSV(file, resolve, reject);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      parseXLSX(file, resolve, reject);
    } else {
      reject("Unsupported file format. Please upload .csv or .xlsx");
    }
  });
};

// --- 1. CSV PARSER ---
const parseCSV = (file, resolve, reject) => {
  Papa.parse(file, {
    header: false, // We read raw first to find the real header
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const processedData = processRawData(results.data);
        resolve(processedData);
      } catch (err) {
        reject("CSV Parsing Error: " + err.message);
      }
    },
    error: (err) => reject(err.message),
  });
};

// --- 2. EXCEL PARSER ---
const parseXLSX = (file, resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Convert to array of arrays (like CSV) to reuse logic
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      
      const processedData = processRawData(jsonData);
      resolve(processedData);
    } catch (err) {
      reject("Excel Parsing Error: " + err.message);
    }
  };
  reader.onerror = (err) => reject(err);
  reader.readAsBinaryString(file);
};

// --- 3. CORE LOGIC: CLEAN, MERGE & CALCULATE ---
const processRawData = (rows) => {
  // A. Find the Header Row (It contains "Scheme Name")
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const rowStr = JSON.stringify(rows[i]);
    if (rowStr.includes("Scheme Name") && rowStr.includes("Current Value")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("Could not find 'Scheme Name' header. Invalid Groww File.");
  }

  // Map column names to indices
  const headers = rows[headerIndex].map(h => h ? h.toString().trim() : "");
  const nameIdx = headers.indexOf("Scheme Name");
  const valueIdx = headers.indexOf("Current Value");
  const xirrIdx = headers.indexOf("XIRR");

  if (nameIdx === -1 || valueIdx === -1) {
    throw new Error("Missing required columns (Scheme Name or Current Value).");
  }

  // B. Iterate Data Rows & Merge Duplicates
  const fundMap = {};

  // Start reading from the row AFTER the header
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Safety check: ensure row has data
    if (!row || row.length <= nameIdx) continue;

    const rawName = row[nameIdx];
    const rawValue = row[valueIdx];
    const rawXirr = row[xirrIdx];

    // Clean Data
    const name = rawName ? rawName.toString().trim() : null;
    const value = cleanNumber(rawValue);
    const xirr = cleanNumber(rawXirr);

    // Skip empty or summary rows
    if (!name || value === 0 || name.includes("Total")) continue;

    // --- SUPER ADVANCED MERGE LOGIC ---
    if (!fundMap[name]) {
      fundMap[name] = {
        totalValue: 0,
        weightedXirrScore: 0 // This is (Value * XIRR)
      };
    }

    fundMap[name].totalValue += value;
    fundMap[name].weightedXirrScore += (value * xirr);
  }

  // C. Final Calculation (Weighted Average) & Format
  return Object.keys(fundMap).map((name, index) => {
    const data = fundMap[name];
    
    // Weighted Average XIRR = (Sum of (Val * XIRR)) / Total Val
    const finalXirr = data.totalValue > 0 
      ? (data.weightedXirrScore / data.totalValue).toFixed(2) 
      : 0;

    return {
      id: Date.now() + index, // Generate unique ID
      name: name,
      value: parseFloat(data.totalValue.toFixed(2)),
      xirr: parseFloat(finalXirr),
      target: 0 // Default to 0, user must set this
    };
  });
};

// Helper: Removes ₹, %, commas and converts to float
const cleanNumber = (input) => {
  if (!input) return 0;
  const str = input.toString();
  // Remove currency, %, and commas. Keep digits, dot, and minus sign.
  const cleanStr = str.replace(/[₹,%\s]/g, '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};