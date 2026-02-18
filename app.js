// Configuration - Replace these with your actual values
let config = {
    apiKey: 'AIzaSyDJqPLDxldipUW9vcc1Hs5PTCEpeiVOyQg',
    sheetId: '1RG1-mUwgzxB_jquutq6dmk5ZMn_IrFX8bt4v8aTKXgA'
};

const accountColumns = ['401k', 'Checking', 'IRAs', 'Home', '529', 'Pension', 'HSA', 'Stock Opt.'];
let allData = []; // Store all data globally for filtering

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    document.getElementById('startDateFilter').addEventListener('change', function() {
        updateHistoryChart();
    });
    
    // Redraw chart on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            if (allData.length > 0) {
                updateHistoryChart();
            }
        }, 100);
    });
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
        
        allData = data; // Store globally
        populateDateFilter(data);
        displayCurrentBalances(data);
        displayHistoryChart(data);
        
        // Add event listeners for account toggles after chart is created
        document.querySelectorAll('.account-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateHistoryChart();
            });
        });
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

function populateDateFilter(data) {
    const select = document.getElementById('startDateFilter');
    const dates = data.map(row => row['Date']).filter(date => date);
    
    console.log('Available dates:', dates);
    
    // Clear existing options except "All Time"
    select.innerHTML = '<option value="all">All Time</option>';
    
    // Add each unique date as an option
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        select.appendChild(option);
    });
}

function updateHistoryChart() {
    const selectedDate = document.getElementById('startDateFilter').value;
    let filteredData = allData;
    
    if (selectedDate !== 'all') {
        const startIndex = allData.findIndex(row => row['Date'] === selectedDate);
        if (startIndex !== -1) {
            filteredData = allData.slice(startIndex);
        }
    }
    
    displayHistoryChart(filteredData);
}

function parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove commas and any other non-numeric characters except decimal point and minus sign
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function displayCurrentBalances(data) {
    const latestRow = data[data.length - 1];
    
    // Display summary cards
    const total = parseNumber(latestRow['Total']);
    
    // Calculate change over past year (last 12 rows)
    const last12Rows = data.slice(-12);
    const yearChange = last12Rows.reduce((sum, row) => sum + parseNumber(row['Change']), 0);
    
    document.getElementById('totalBalance').textContent = formatCurrency(total);
    
    const yearChangeElement = document.getElementById('yearChange');
    yearChangeElement.textContent = formatCurrency(yearChange);
    yearChangeElement.className = 'amount ' + (yearChange >= 0 ? 'positive' : 'negative');
    
    // Display account balances with Total Net Worth at top
    const container = document.getElementById('accountsList');
    
    // Add Total Net Worth as first item
    let html = `
        <div class="account-item" data-account="Total">
            <div class="account-header">
                <span class="account-name">Total Net Worth</span>
                <span class="account-balance">${formatCurrency(total)}</span>
            </div>
            <div class="account-history" style="display: none;"></div>
        </div>
    `;
    
    // Add individual accounts
    html += accountColumns.map(account => {
        const balance = parseNumber(latestRow[account]);
        return `
            <div class="account-item" data-account="${account}">
                <div class="account-header">
                    <span class="account-name">${account}</span>
                    <span class="account-balance">${formatCurrency(balance)}</span>
                </div>
                <div class="account-history" style="display: none;"></div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // Add click handlers for expanding/collapsing
    document.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', function() {
            toggleAccountHistory(this, data);
        });
    });
}

function toggleAccountHistory(element, data) {
    const accountName = element.getAttribute('data-account');
    const historyDiv = element.querySelector('.account-history');
    
    if (!historyDiv) return;
    
    if (historyDiv.style.display === 'none') {
        // Expand - show past 2 years (24 rows) in reverse order (newest first)
        const past24Rows = data.slice(-24).reverse();
        
        let historyHtml = '<div class="history-grid">';
        past24Rows.forEach(row => {
            const value = parseNumber(row[accountName]);
            historyHtml += `
                <div class="history-row">
                    <span class="history-date">${row['Date']}</span>
                    <span class="history-value">${formatCurrencyNoDecimals(value)}</span>
                </div>
            `;
        });
        historyHtml += '</div>';
        
        historyDiv.innerHTML = historyHtml;
        historyDiv.style.display = 'block';
        element.classList.add('expanded');
    } else {
        // Collapse
        historyDiv.style.display = 'none';
        element.classList.remove('expanded');
    }
}

function displayHistoryChart(data) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    if (window.historyChart && window.historyChart instanceof Chart) {
        window.historyChart.destroy();
    }
    
    // Get selected accounts from checkboxes
    const selectedAccounts = Array.from(document.querySelectorAll('.account-toggle:checked'))
        .map(cb => cb.value);
    
    // If nothing selected, show Total by default
    if (selectedAccounts.length === 0) {
        selectedAccounts.push('Total');
        document.querySelector('.account-toggle[value="Total"]').checked = true;
    }
    
    // Define colors for each account
    const colors = {
        'Total': '#667eea',
        '401k': '#764ba2',
        'Checking': '#f093fb',
        'IRAs': '#4facfe',
        'Home': '#43e97b',
        '529': '#fa709a',
        'Pension': '#fee140',
        'HSA': '#30cfd0',
        'Stock Opt.': '#ff6b6b'
    };
    
    // Create datasets for each selected account
    const datasets = selectedAccounts.map(account => {
        const dataPoints = data.map(row => {
            const dateStr = row['Date'];
            const date = new Date(dateStr);
            
            return {
                x: date.getTime(),
                y: parseNumber(row[account])
            };
        });
        
        // Sort by date
        dataPoints.sort((a, b) => a.x - b.x);
        
        return {
            label: account === 'Total' ? 'Total Net Worth' : account,
            data: dataPoints,
            borderColor: colors[account] || '#667eea',
            backgroundColor: 'transparent',
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: account === 'Total' ? 3 : 2
        };
    });
    
    // Calculate min and max for y-axis based on selected data
    let allValues = [];
    datasets.forEach(dataset => {
        dataset.data.forEach(point => allValues.push(point.y));
    });
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1; // 10% padding
    
    // Detect if we're in landscape mode on mobile
    const isMobile = window.innerWidth < 768;
    const isLandscape = window.innerWidth > window.innerHeight;
    let aspectRatio;
    
    if (isMobile && isLandscape) {
        aspectRatio = 2;
    } else if (isMobile) {
        aspectRatio = 1.5;
    } else {
        aspectRatio = 2.5;
    }
    
    window.historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: aspectRatio,
            plugins: {
                legend: {
                    display: selectedAccounts.length > 1,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const timestamp = context[0].parsed.x;
                            const date = new Date(timestamp);
                            return date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            });
                        },
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    grid: {
                        color: function(context) {
                            const value = context.tick.value;
                            const date = new Date(value);
                            // Make December grid lines more prominent
                            if (date.getMonth() === 11) { // December is month 11
                                return '#9ca3af';
                            }
                            return '#e5e7eb';
                        },
                        lineWidth: function(context) {
                            const value = context.tick.value;
                            const date = new Date(value);
                            // Make December grid lines thicker
                            if (date.getMonth() === 11) {
                                return 2;
                            }
                            return 1;
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            const date = new Date(value);
                            if (isMobile) {
                                return date.toLocaleDateString('en-US', { 
                                    year: '2-digit', 
                                    month: 'short' 
                                });
                            } else {
                                return date.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short' 
                                });
                            }
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: isMobile ? 8 : 15
                    }
                },
                y: {
                    min: minValue - padding,
                    max: maxValue + padding,
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

function formatCurrency(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function formatCurrencyNoDecimals(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
}
