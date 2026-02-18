# Account Balance Dashboard

A simple balance tracking dashboard that reads data from your Excel file.

## Setup Instructions

### 1. Prepare Your Data

Export your account balances from "Retirement Calculator_super slim.xlsm" to a CSV file:

1. Open "Retirement Calculator_super slim.xlsm" in Excel
2. Select the sheet with your account balances
3. File → Save As → CSV (Comma delimited) (*.csv)
4. Save as `balances.csv` in the same folder as this app

**Expected CSV Format:**
```
Account Name,Balance
Checking,2500.00
Savings,10000.00
401k,45000.00
IRA,32000.00
Brokerage,15000.00
```

### 2. Run the App

1. Open `index.html` in your browser
2. Click "Load CSV File" and select your `balances.csv`
3. View your account balances

## Features

- Clean display of all account balances
- Total balance calculation
- Visual balance chart
- Responsive design for mobile and desktop
- No external API required - all data stays local

## Tips

- Update your CSV file whenever balances change
- Reload the file in the app to see updates
- All data processing happens in your browser - nothing is uploaded
