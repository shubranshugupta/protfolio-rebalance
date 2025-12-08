# 📈 SIP Smart Rebalancer

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MUI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white)
![Jest](https://img.shields.io/badge/-Jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

A smart financial tool built with **React** and **Material UI** that helps investors maintain their desired mutual fund asset allocation using **Inflow Rebalancing** (adjusting the SIP amount) rather than selling assets.

## 🚀 Why this tool?

Traditional rebalancing involves selling high-performing assets to buy low-performing ones. This triggers **Capital Gains Tax** and **Exit Loads**.

**SIP Smart Rebalancer** solves this by calculating exactly how to split your *next* monthly investment (SIP) to naturally correct portfolio imbalances.

* **Zero Tax:** No units are sold.
* **Buy Low:** Automatically allocates more money to underperforming funds.
* **Automated Math:** Handles the complex weighted average calculations instantly.

## ✨ Key Features

* **Inflow Rebalancing Algorithm:** mathematically distributes your SIP to close the gap between *Current Allocation* and *Target Allocation*.
* **Material UI Design:** Clean, modern interface with responsive grid layouts.
* **Dark/Light Mode:** Native theme toggling with persistent state.
* **Data Persistence:** Uses `localStorage` to save your portfolio details (Funds, Targets, SIP Amount) so you don't have to re-enter them every month.
* **XIRR Tracking:** Visual input to track the performance of individual funds alongside their allocation.
* **Portfolio Health:** Visual indicators when Target % does not equal 100%.

## 🛠️ Tech Stack

* **Frontend:** React.js (Hooks: `useState`, `useEffect`, `useMemo`)
* **UI Library:** Material UI (MUI v6) + Emotion
* **Testing:** Jest & React Testing Library
* **Icons:** MUI Icons Material

## ⚙️ Installation & Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/shubranshugupta/protfolio-rebalance.git
    cd sip-rebalancer
    ```

2. **Install Dependencies**

    ```bash
    npm install
    # Installs React, MUI, and Testing libraries
    ```

3. **Run the App**

    ```bash
    npm start
    ```

    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🧪 Running Tests

This project includes a robust test suite covering rendering, calculations, accessibility, and local storage logic.

```bash
npm test
```

**What is tested?**

* **UI Rendering:** Checks if inputs and buttons appear correctly.
* **Logic:** Verifies that SIP allocation math is accurate.
* **Persistence:** Ensures data is saved to LocalStorage.
* **Interaction:** Simulates adding/deleting funds and toggling themes.
* **Accessibility:** Checks for ARIA labels on interactive elements.

## 📐 How the Algorithm Works

1. **Calculate Future Total:** `Current Portfolio Value + New SIP Amount`
2. **Determine Ideal Value:** `Future Total * Target %` for each fund.
3. **Find the Deficit:** `Ideal Value - Current Value`.
   * *If Deficit > 0*: The fund is lagging (Needs money).
   * *If Deficit < 0*: The fund is overweight (Needs no money).
4. **Weighted Distribution:** The SIP amount is distributed proportionally to the funds with the largest deficits.

## 📁 Project Structure

```plain text
/src
  ├── App.js           # Main Component (Logic & UI)
  ├── App.test.js      # Unit & Integration Tests
  ├── index.js         # Entry Point
  └── ...
```

## 📝 Usage Guide

1. **Set SIP Amount:** Enter the total amount you want to invest this month (e.g., ₹18,000).
2. **Add Funds:** Click "Add Fund" to list your mutual funds.
3. **Enter Details:**
   * *Value*: Current market value of the fund.
   * *Target*: Desired portfolio percentage (e.g., 40%).
4. **Calculate:** Click the button. The table will show exactly how much to invest in each fund.
5. **Save:** Click "Save Data" to remember your setup for next month.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](/LICENSE).
