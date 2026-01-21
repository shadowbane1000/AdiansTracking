// Time Tracker App - Clean Canonical Implementation
class TimeTracker {
    constructor() {
        this.entries = this.loadEntries();
        this.currentEntry = null;
        this.payRate = 0;
        this.dateRange = { start: null, end: null };
        this.lastAction = null;
        this.init();
    }

    init() {
        this.initializePayRate();
        this.initializeDateInputs();
        this.setupEventListeners();
        this.updateStatus();
    }

    /* ---------------- PAY RATE ---------------- */

    initializePayRate() {
        const input = document.getElementById('payRate');
        this.payRate = parseFloat(localStorage.getItem('payRate')) || 0;

        if (input) {
            input.value = this.payRate || '';
            input.addEventListener('input', e => {
                this.payRate = parseFloat(e.target.value) || 0;
                localStorage.setItem('payRate', this.payRate);
                this.refreshView();
            });
        }
    }

    calculateEarnings(minutes) {
        if (!this.payRate || minutes <= 0) return 0;
        return (minutes / 60) * this.payRate;
    }

    formatMoney(value) {
        return `$${value.toFixed(2)}`;
    }

    /* ---------------- DATE RANGE ---------------- */

    initializeDateInputs() {
        const today = new Date().toISOString().split('T')[0];
        this.dateRange.start = today;
        this.dateRange.end = today;

        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = today;
    }

    setDateRange(start, end) {
        this.dateRange.start = start;
        this.dateRange.end = end;
        this.refreshView();
    }

    filterEntries() {
        return this.entries.filter(e => {
            const d = e.punchIn.split('T')[0];
            return (!this.dateRange.start || d >= this.dateRange.start) &&
                   (!this.dateRange.end || d <= this.dateRange.end);
        });
    }

    /* ---------------- EVENTS ---------------- */

    setupEventListeners() {
        document.getElementById('punchInBtn').onclick = () => this.punchIn();
        document.getElementById('punchOutBtn').onclick = () => this.punchOut();
        document.getElementById('viewEntriesBtn').onclick = () => this.viewEntries();
        document.getElementById('calculateHoursBtn').onclick = () => this.calculateHours();

        document.getElementById('startDate').onchange = e =>
            this.setDateRange(e.target.value, this.dateRange.end);

        document.getElementById('endDate').onchange = e =>
            this.setDateRange(this.dateRange.start, e.target.value);
    }

    refreshView() {
        if (this.lastAction === 'entries') this.viewEntries();
        if (this.lastAction === 'hours') this.calculateHours();
    }

    /* ---------------- PUNCHING ---------------- */

    punchIn() {
        if (this.currentEntry) return;
        this.currentEntry = { punchIn: new Date().toISOString(), punchOut: null };
        this.updateStatus();
    }

    punchOut() {
        if (!this.currentEntry) return;
        this.currentEntry.punchOut = new Date().toISOString();
        this.entries.push(this.currentEntry);
        this.currentEntry = null;
        this.saveEntries();
        this.updateStatus();
    }

    /* ---------------- RENDERING ---------------- */

    viewEntries() {
        this.lastAction = 'entries';
        const list = this.filterEntries();

        if (!list.length) {
            this.show('No entries found.');
            return;
        }

        let html = '<h3>Entries</h3><div class="entries-list">';
        list.forEach(e => {
            const idx = this.entries.indexOf(e);
            const minutes = this.getMinutes(e);
            html += `
                <div class="entry-item">
                    <button onclick="window.app.deleteEntry(${idx})">Delete</button>
                    <strong>${e.punchIn.split('T')[0]}</strong><br>
                    ⏱️ ${this.formatDuration(minutes)} |
                    💰 ${this.formatMoney(this.calculateEarnings(minutes))}
                    <br>
                    <input type="datetime-local" value="${this.toLocal(e.punchIn)}"
                        onchange="window.app.updateEntry(${idx}, 'punchIn', this.value)">
                    <input type="datetime-local" value="${this.toLocal(e.punchOut)}"
                        onchange="window.app.updateEntry(${idx}, 'punchOut', this.value)">
                </div>`;
        });
        html += '</div>';
        this.show(html);
    }

    calculateHours() {
        this.lastAction = 'hours';
        const list = this.filterEntries();
        let totalMinutes = 0;
        list.forEach(e => totalMinutes += this.getMinutes(e));

        this.show(`
            <h3>Summary</h3>
            <div class="summary-card">
                <div class="summary-line">
                    <span class="amount">💰 ${this.formatMoney(this.calculateEarnings(totalMinutes))}</span>
                    <span class="hours">⏱️ ${(totalMinutes / 60).toFixed(2)} hrs</span>
                </div>
            </div>
        `);
    }

    /* ---------------- HELPERS ---------------- */

    getMinutes(e) {
        return Math.floor((new Date(e.punchOut) - new Date(e.punchIn)) / 60000);
    }

    formatDuration(m) {
        return `${Math.floor(m/60)}h ${m%60}m`;
    }

    toLocal(iso) {
        return iso ? iso.slice(0,16) : '';
    }

    updateEntry(i, k, v) {
        // Preserve local time when converting to ISO
        // v is like "2026-01-21T05:00" (datetime-local, no timezone)
        const localDate = new Date(v);
        const offset = localDate.getTimezoneOffset() * 60000;
        const localISO = new Date(localDate.getTime() - offset).toISOString();

        this.entries[i][k] = localISO;
        this.saveEntries();
        this.refreshView();
    }

    deleteEntry(i) {
        this.entries.splice(i,1);
        this.saveEntries();
        this.refreshView();
    }

    show(html) {
        const o = document.getElementById('outputDisplay');
        o.innerHTML = html;
        o.style.display = 'block';
    }

    updateStatus() {
        const s = document.getElementById('currentStatus');
        s.textContent = this.currentEntry ? 'Clocked In' : 'Ready';
    }

    loadEntries() {
        return JSON.parse(localStorage.getItem('timeEntries') || '[]');
    }

    saveEntries() {
        localStorage.setItem('timeEntries', JSON.stringify(this.entries));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimeTracker();
});
