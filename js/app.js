// Time Tracker App
class TimeTracker {
    constructor() {
        this.currentEntry = null;
        this.entries = this.loadEntries();
        this.dateRange = {
            start: null,
            end: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPWAInstall();
        this.updateStatus();
        this.initializeDateInputs();
    }

    setupEventListeners() {
        // Punch buttons
        document.getElementById('punchInBtn').addEventListener('click', () => {
            this.punchIn();
        });

        document.getElementById('punchOutBtn').addEventListener('click', () => {
            this.punchOut();
        });

        // Action buttons
        document.getElementById('viewEntriesBtn').addEventListener('click', () => {
            this.viewTimeEntries();
        });

        document.getElementById('calculateHoursBtn').addEventListener('click', () => {
            this.calculateHours();
        });

        // Date range inputs
        document.getElementById('startDate').addEventListener('change', (e) => {
            this.dateRange.start = e.target.value;
            this.updateDateRangeDisplay();
        });

        document.getElementById('endDate').addEventListener('change', (e) => {
            this.dateRange.end = e.target.value;
            this.updateDateRangeDisplay();
        });

        // Quick filter buttons
        document.getElementById('todayBtn').addEventListener('click', () => {
            this.setDateRangeToday();
        });

        document.getElementById('thisWeekBtn').addEventListener('click', () => {
            this.setDateRangeThisWeek();
        });

        document.getElementById('thisMonthBtn').addEventListener('click', () => {
            this.setDateRangeThisMonth();
        });

        document.getElementById('allTimeBtn').addEventListener('click', () => {
            this.setDateRangeAllTime();
        });
    }

    initializeDateInputs() {
        // Set default to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        this.dateRange.start = today;
        this.dateRange.end = today;
    }

    setDateRangeToday() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
        this.dateRange.start = today;
        this.dateRange.end = today;
        this.updateDateRangeDisplay();
    }

    setDateRangeThisWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);

        const start = startOfWeek.toISOString().split('T')[0];
        const end = today.toISOString().split('T')[0];

        document.getElementById('startDate').value = start;
        document.getElementById('endDate').value = end;
        this.dateRange.start = start;
        this.dateRange.end = end;
        this.updateDateRangeDisplay();
    }

    setDateRangeThisMonth() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const start = startOfMonth.toISOString().split('T')[0];
        const end = today.toISOString().split('T')[0];

        document.getElementById('startDate').value = start;
        document.getElementById('endDate').value = end;
        this.dateRange.start = start;
        this.dateRange.end = end;
        this.updateDateRangeDisplay();
    }

    setDateRangeAllTime() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        this.dateRange.start = null;
        this.dateRange.end = null;
        this.updateDateRangeDisplay();
    }

    updateDateRangeDisplay() {
        if (document.getElementById('outputDisplay').innerHTML) {
            const lastAction = this.lastAction;
            if (lastAction === 'viewEntries') {
                this.viewTimeEntries();
            } else if (lastAction === 'calculateHours') {
                this.calculateHours();
            }
        }
    }

    filterEntriesByDateRange(entries) {
        if (!this.dateRange.start && !this.dateRange.end) {
            return entries;
        }

        return entries.filter(entry => {
            const entryDate = new Date(entry.punchIn).toISOString().split('T')[0];

            if (this.dateRange.start && this.dateRange.end) {
                return entryDate >= this.dateRange.start && entryDate <= this.dateRange.end;
            } else if (this.dateRange.start) {
                return entryDate >= this.dateRange.start;
            } else if (this.dateRange.end) {
                return entryDate <= this.dateRange.end;
            }

            return true;
        });
    }

    setupPWAInstall() {
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            installBtn.style.display = 'none';
        });
    }

    punchIn() {
        if (this.currentEntry) {
            this.showOutput('Already punched in! Punch out first.', 'warning');
            return;
        }

        this.currentEntry = {
            punchIn: new Date().toISOString(),
            punchOut: null
        };

        this.updateStatus();
        this.showOutput('✅ Punched in at ' + this.formatTime(this.currentEntry.punchIn), 'success');
    }

    punchOut() {
        if (!this.currentEntry) {
            this.showOutput('Not punched in! Punch in first.', 'warning');
            return;
        }

        this.currentEntry.punchOut = new Date().toISOString();
        this.entries.push(this.currentEntry);
        this.saveEntries();

        const duration = this.calculateDuration(this.currentEntry.punchIn, this.currentEntry.punchOut);
        this.showOutput(`✅ Punched out at ${this.formatTime(this.currentEntry.punchOut)}\nDuration: ${duration}`, 'success');

        this.currentEntry = null;
        this.updateStatus();
    }

    deleteEntry(index) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.entries.splice(index, 1);
            this.saveEntries();
            this.viewTimeEntries();
        }
    }

    updateEntry(index, field, value) {
        if (value) {
            this.entries[index][field] = new Date(value).toISOString();
            this.saveEntries();
            this.viewTimeEntries();
        }
    }

    viewTimeEntries() {
        this.lastAction = 'viewEntries';
        const filteredEntries = this.filterEntriesByDateRange(this.entries);

        if (filteredEntries.length === 0) {
            this.showOutput('No time entries found for the selected date range.', 'info');
            return;
        }

        let output = '<h3>Time Entries</h3>';

        if (this.dateRange.start || this.dateRange.end) {
            output += '<p class="date-range-info">📅 ';
            if (this.dateRange.start && this.dateRange.end) {
                output += `Showing entries from ${this.formatDateOnly(this.dateRange.start)} to ${this.formatDateOnly(this.dateRange.end)}`;
            } else if (this.dateRange.start) {
                output += `Showing entries from ${this.formatDateOnly(this.dateRange.start)} onwards`;
            } else {
                output += `Showing entries up to ${this.formatDateOnly(this.dateRange.end)}`;
            }
            output += '</p>';
        }

        output += '<div class="entries-list">';

        filteredEntries.forEach((entry) => {
            const originalIndex = this.entries.indexOf(entry);
            const punchInDatetime = this.toDatetimeLocalString(entry.punchIn);
            const punchOutDatetime = this.toDatetimeLocalString(entry.punchOut);
            const entryDate = this.formatDateOnly(entry.punchIn);

            output += `
                <div class="entry-item">
                    <div class="entry-header">
                        Entry #${originalIndex + 1}
                        <button class="btn-delete" onclick="window.app.deleteEntry(${originalIndex})">🗑️ Delete</button>
                    </div>
                    <div class="entry-details">
                        <div class="entry-date">📅 ${entryDate}</div>
                        <div class="entry-edit-row">
                            <label>🟢 Punch In:</label>
                            <input type="datetime-local" 
                                   value="${punchInDatetime}" 
                                   onchange="window.app.updateEntry(${originalIndex}, 'punchIn', this.value)"
                                   class="datetime-edit">
                        </div>
                        <div class="entry-edit-row">
                            <label>🔴 Punch Out:</label>
                            <input type="datetime-local" 
                                   value="${punchOutDatetime}" 
                                   onchange="window.app.updateEntry(${originalIndex}, 'punchOut', this.value)"
                                   class="datetime-edit">
                        </div>
                        <div class="entry-duration">⏱️ Duration: ${this.calculateDuration(entry.punchIn, entry.punchOut)}
     | 💰 ${this.formatMoney(
        this.calculateEarnings(
          this.getMinutesDuration(entry.punchIn, entry.punchOut)
        )
     )}</div>
                    </div>
                </div>
            `;
        });

        output += '</div>';
        this.showOutput(output, 'info');
    }

    calculateHours() {
        this.lastAction = 'calculateHours';
        const filteredEntries = this.filterEntriesByDateRange(this.entries);

        if (filteredEntries.length === 0) {
            this.showOutput('No time entries found for the selected date range.', 'info');
            return;
        }

        let totalMinutes = 0;
        let totalPay = 0;
        let todayPay = 0;
        let todayMinutes = 0;
        const today = new Date().toISOString().split('T')[0];

        filteredEntries.forEach(entry => {
            const minutes = this.getMinutesDuration(entry.punchIn, entry.punchOut);
            totalMinutes += minutes;
            totalPay += this.calculateEarnings(minutes);

            const entryDate = new Date(entry.punchIn).toISOString().split('T')[0];
            if (entryDate === today) {
                todayMinutes += minutes;
                todayPay += this.calculateEarnings(minutes);
            }
        });

        const totalHours = (totalMinutes / 60).toFixed(2);
        const todayHours = (todayMinutes / 60).toFixed(2);

        let output = '<h3>Hours Summary</h3>';

        if (this.dateRange.start || this.dateRange.end) {
            output += '<p class="date-range-info">📅 ';
            if (this.dateRange.start && this.dateRange.end) {
                output += `Period: ${this.formatDateOnly(this.dateRange.start)} to ${this.formatDateOnly(this.dateRange.end)}`;
            } else if (this.dateRange.start) {
                output += `Period: ${this.formatDateOnly(this.dateRange.start)} onwards`;
            } else {
                output += `Period: up to ${this.formatDateOnly(this.dateRange.end)}`;
            }
            output += '</p>';
        }

        output += `
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-label">Today:</div>
                    <div class="stat-value">${todayHours} hours<br>💰 ${this.formatMoney(todayPay)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Total:</div>
                    <div class="stat-value">${totalHours} hours<br>💰 ${this.formatMoney(totalPay)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Entries:</div>
                    <div class="stat-value">${filteredEntries.length}</div>
                </div>
            </div>
        `;

        this.showOutput(output, 'info');
    }

    updateStatus() {
        const statusDiv = document.getElementById('currentStatus');

        if (this.currentEntry) {
            const duration = this.calculateDuration(this.currentEntry.punchIn, new Date().toISOString());
            statusDiv.innerHTML = `🟢 Currently clocked in<br>Started: ${this.formatTime(this.currentEntry.punchIn)}<br>Duration: ${duration}`;
            statusDiv.className = 'status-display status-active';
        } else {
            statusDiv.innerHTML = 'Ready to start tracking time';
            statusDiv.className = 'status-display';
        }
    }

    showOutput(message, type = 'info') {
        const outputDiv = document.getElementById('outputDisplay');
        outputDiv.innerHTML = message;
        outputDiv.className = `output-display output-${type}`;
        outputDiv.style.display = 'block';
    }

    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    formatDateOnly(isoStringOrDate) {
        // Handle ISO strings with time component
        const date = new Date(isoStringOrDate);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    toDatetimeLocalString(isoString) {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    calculateDuration(start, end) {
        const minutes = this.getMinutesDuration(start, end);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    getMinutesDuration(start, end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        return Math.floor((endTime - startTime) / 1000 / 60);
    }

    loadEntries() {
        const stored = localStorage.getItem('timeEntries');
        return stored ? JSON.parse(stored) : [];
    }

    saveEntries() {
        localStorage.setItem('timeEntries', JSON.stringify(this.entries));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimeTracker();

    // Update status every minute if clocked in
    setInterval(() => {
        if (window.app.currentEntry) {
            window.app.updateStatus();
        }
    }, 60000);
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}