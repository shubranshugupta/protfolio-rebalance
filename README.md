# 📈 SIP Smart Rebalancer

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)
![Jest](https://img.shields.io/badge/-Jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Privacy](https://img.shields.io/badge/Privacy-Local_Only-green?style=for-the-badge&logo=shield)

A smart financial tool built with **React** and **Material UI** that helps investors maintain their desired mutual fund asset allocation using **Inflow Rebalancing** (adjusting the SIP amount) rather than selling assets.

It now features **Automated Portfolio Imports** from brokers (like Groww) and **Visual Analytics**.

## 🚀 Why this tool?

Traditional rebalancing involves selling high-performing assets to buy low-performing ones. This triggers **Capital Gains Tax** and **Exit Loads**.

**SIP Smart Rebalancer** solves this by calculating exactly how to split your *next* monthly investment (SIP) to naturally correct portfolio imbalances.

* **Zero Tax:** No units are sold.
* **Buy Low:** Automatically allocates more money to underperforming funds.
* **One-Click Setup:** Import your holdings statement directly instead of typing manually.

## ✨ Key Features

### 📊 Portfolio Management
* **Inflow Rebalancing Algorithm:** Mathematically distributes your SIP to close the gap between *Current Allocation* and *Target Allocation*.
* **Smart Import:** Upload **Groww** statements (CSV or XLSX). The app automatically:
    * Cleans metadata and headers.
    * **Merges Duplicates:** If you have the same fund in multiple folios, it merges them and calculates the **Weighted Average XIRR**.
* **Data Persistence:** Uses `localStorage` so you don't have to re-import every time.
* **Backup & Restore:** Export your configuration as JSON to transfer between devices.

### 🎨 UI & Visualization
* **Allocation Pie Charts:** Visual comparison of "Current vs. Target" allocation.
* **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop.
* **Dark/Light Mode:** Native theme toggling.
* **Portfolio Health:** Visual indicators (Green/Red/Orange) for XIRR and Allocation gaps.

### 🔒 Privacy First
* **100% Client-Side:** Your financial data **never** leaves your browser. Files are processed locally using `FileReader`.
* **Privacy Warnings:** Built-in alerts reminding you to sanitize PII (PAN, Name) before importing.

## 🛠️ Tech Stack

* **Frontend:** React.js (Hooks, Context)
* **UI Library:** Material UI (MUI v6) + Emotion
* **Charts:** MUI X Charts
* **File Parsing:**
    * `papaparse` (CSV Processing)
    * `xlsx` / SheetJS (Excel Processing)
* **Testing:** Jest & React Testing Library

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/shubranshugupta/protfolio-rebalance.git](https://github.com/shubranshugupta/protfolio-rebalance.git)
    cd protfolio-rebalance
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # Installs React, MUI, PapaParse, SheetJS, and Testing libraries
    ```

3.  **Run the App**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🧪 Running Tests

This project includes a robust test suite covering rendering, calculations, file parsing, and privacy logic.

```bash
npm test
```

**What is tested?**

* **Broker Parsers:** Verifies that Groww CSV/XLSX files are parsed correctly and junk metadata is ignored.
* **Math:** Validates Weighted Average XIRR calculations.
* **UI:** Checks responsive tables and charts.
* **Integration:** Tests the flow from "Click Import" -> "Modal" -> "File Select" -> "Data Merge".

## 📐 How the Algorithm Works

1. **Calculate Future Total:** `Current Portfolio Value + New SIP Amount`
2. **Determine Ideal Value:** `Future Total * Target %` for each fund.
3. **Find the Deficit:** `Ideal Value - Current Value`.
   * *If Deficit > 0*: The fund is lagging (Needs money).
   * *If Deficit < 0*: The fund is overweight (Needs no money).
4. **Weighted Distribution:** The SIP amount is distributed proportionally to the funds with the largest deficits.
5. **Weighted Merge (On Import):**
    * If Fund A is in Folio 1 (₹10k @ 10%) and Folio 2 (₹90k @ 20%).
    * The app calculates the true weighted return: `((10k*10) + (90k*20)) / 100k = 19%`.

## 📁 Project Structure

```plain text
/src
  ├── components
  │   ├── AllocationPieChart.js  # Visuals
  │   ├── ImportPortfolio.js     # Broker Import Logic (Menu/Modal)
  │   └── ResultTable.js         # Responsive Calculation Display
  ├── utils
  │   └── growwParser.js         # CSV/XLSX Parsing & Math Logic
  ├── App.js                     # Main Container
  ├── App.test.js                # Integration Tests
  └── ...
```

## 📝 Usage Guide

1. **Set SIP Amount:** Enter the total amount you want to invest this month (e.g., ₹18,000).
2. **Add Funds/Import Data:** Click `Add Fund` or `Click "Import Portfolio" -> Select "Groww" -> Upload your holdings statement.` to list your mutual funds.
3. **Enter Details:**
   * *Value*: Current market value of the fund.
   * *Target*: Desired portfolio percentage (e.g., 40%).
4. **Calculate:** Click the button. The table will show exactly how much to invest in each fund.
5. **Save:** Click "Save Data" to remember your setup for next month.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](/LICENSE).
