// Time Tracker App functionality
class TimeTrackerApp {
    constructor() {
        this.currentEntry = null;
        this.timeEntries = this.loadTimeEntries();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPWAInstall();
        this.updateStatus();
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
            this.showOutput('Already punched in! Punch out first.');
            return;
        }

        const now = new Date();
        this.currentEntry = {
            id: Date.now(),
            punchIn: now,
            date: now.toDateString()
        };

        this.updateStatus();
        this.showOutput(`Punched in at ${now.toLocaleTimeString()}`);
    }

    punchOut() {
        if (!this.currentEntry) {
            this.showOutput('Not punched in! Punch in first.');
            return;
        }

        const now = new Date();
        this.currentEntry.punchOut = now;

        // Calculate hours worked
        const hoursWorked = (now - this.currentEntry.punchIn) / (1000 * 60 * 60);
        this.currentEntry.hoursWorked = hoursWorked;

        // Save the entry
        this.timeEntries.push(this.currentEntry);
        this.saveTimeEntries();

        this.showOutput(`Punched out at ${now.toLocaleTimeString()}\nHours worked: ${hoursWorked.toFixed(2)}`);

        this.currentEntry = null;
        this.updateStatus();
    }

    updateStatus() {
        const statusEl = document.getElementById('currentStatus');

        if (this.currentEntry) {
            const punchInTime = this.currentEntry.punchIn.toLocaleTimeString();
            statusEl.textContent = `⏰ Punched in at ${punchInTime}`;
            statusEl.style.background = '#e8f5e8';
            statusEl.style.borderColor = '#4CAF50';
            statusEl.style.color = '#2e7d32';
        } else {
            statusEl.textContent = 'Ready to start tracking time';
            statusEl.style.background = '#e3f2fd';
            statusEl.style.borderColor = '#2196F3';
            statusEl.style.color = '#1976D2';
        }
    }

    viewTimeEntries() {
        if (this.timeEntries.length === 0) {
            this.showOutput('No time entries found.');
            return;
        }

        let output = 'Time Entries:\n\n';
        this.timeEntries.forEach((entry, index) => {
            const punchIn = new Date(entry.punchIn).toLocaleString();
            const punchOut = entry.punchOut ? new Date(entry.punchOut).toLocaleString() : 'Still working';
            const hours = entry.hoursWorked ? entry.hoursWorked.toFixed(2) : 'In progress';

            output += `${index + 1}. ${entry.date}\n`;
            output += `   In: ${punchIn}\n`;
            output += `   Out: ${punchOut}\n`;
            output += `   Hours: ${hours}\n\n`;
        });

        this.showOutput(output);
    }

    calculateHours() {
        if (this.timeEntries.length === 0) {
            this.showOutput('No time entries to calculate.');
            return;
        }

        const totalHours = this.timeEntries.reduce((total, entry) => {
            return total + (entry.hoursWorked || 0);
        }, 0);

        const today = new Date().toDateString();
        const todayEntries = this.timeEntries.filter(entry => entry.date === today);
        const todayHours = todayEntries.reduce((total, entry) => {
            return total + (entry.hoursWorked || 0);
        }, 0);

        this.showOutput(`Hours Summary:\n\nToday: ${todayHours.toFixed(2)} hours\nTotal: ${totalHours.toFixed(2)} hours\nEntries: ${this.timeEntries.length}`);
    }

    showOutput(message) {
        const output = document.getElementById('output');
        output.textContent = message;
    }

    loadTimeEntries() {
        try {
            const saved = localStorage.getItem('timeEntries');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading time entries:', error);
            return [];
        }
    }

    saveTimeEntries() {
        try {
            localStorage.setItem('timeEntries', JSON.stringify(this.timeEntries));
        } catch (error) {
            console.error('Error saving time entries:', error);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.timeTrackerApp = new TimeTrackerApp();
});

// Handle online/offline status
window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    console.log('App is online');
});

window.addEventListener('offline', () => {
    document.body.classList.add('offline');
    console.log('App is offline');
});