// Configuration - Replace these with your actual values
let config = {
    apiKey: 'AIzaSyDJqPLDxldipUW9vcc1Hs5PTCEpeiVOyQg',
    sheetId: '1RG1-mUwgzxB_jquutq6dmk5ZMn_IrFX8bt4v8aTKXgA'
};

const accountColumns = ['401k', 'Checking', 'IRAs', 'Home', '529', 'Pension', 'HSA', 'Stock Opt.'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('refreshBtn').addEventListener('click', loadData);
});

async function loadData() {
    try {
        const data = await fetchSheetData('Summary');
        
        console.log('Fetched data:', data);
        console.log('Data length:', data.length);
        
        if (data.length === 0) {
            alert('No data found in the Summary sheet. Check browser console (F12) for details.');
            return;
        }
        
        displayCurrentBalances(data);
        displayHistoryChart(data);
        displayBreakdownChart(data);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Error: ' + error.message + '. Check browser console (F12) for details.');
    }
}

async function fetchSheetData(sheetName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${sheetName}?key=${config.apiKey}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.error) {
        throw new Error(data.error.message || 'API Error');
    }
    
    if (!data.values) {
        console.warn('No values found in response');
        return [];
    }
    
    console.log('Raw values:', data.values);
    
    const headers = data.values[0];
    console.log('Headers:', headers);
    
    const rows = data.values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });
    
    console.log('Parsed rows:', rows);
    return rows;
}

function displayCurrentBalances(data) {
    const latestRow = data[data.length - 1];
    
    // Display summary cards
    const total = parseFloat(latestRow['Total'] || 0);
    const change = parseFloat(latestRow['Change'] || 0);
    
    document.getElementById('totalBalance').textContent = formatCurrency(total);
    document.getElementById('lastUpdate').textContent = latestRow['Date'] || '-';
    
    const changeElement = document.getElementById('lastChange');
    changeElement.textContent = formatCurrency(change);
    changeElement.className = 'amount ' + (change >= 0 ? 'positive' : 'negative');
    
    // Display account balances
    const container = document.getElementById('accountsList');
    container.innerHTML = accountColumns.map(account => {
        const balance = parseFloat(latestRow[account] || 0);
        return `
            <div class="account-item">
                <span class="account-name">${account}</span>
                <span class="account-balance">${formatCurrency(balance)}</span>
            </div>
        `;
    }).join('');
}

function displayHistoryChart(data) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    if (window.historyChart && typeof window.historyChart.destroy === 'function') {
        window.historyChart.destroy();
    }
    
    const dates = data.map(row => row['Date']);
    const totals = data.map(row => parseFloat(row['Total'] || 0));
    
    window.historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Total Balance',
                data: totals,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function displayBreakdownChart(data) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');
    
    if (window.breakdownChart && typeof window.breakdownChart.destroy === 'function') {
        window.breakdownChart.destroy();
    }
    
    const latestRow = data[data.length - 1];
    const balances = accountColumns.map(account => parseFloat(latestRow[account] || 0));
    
    window.breakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: accountColumns,
            datasets: [{
                data: balances,
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#4facfe',
                    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': ' + formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
