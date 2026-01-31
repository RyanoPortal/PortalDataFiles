// ==========================================
// FleetFlow Navigator - Main Application Logic
// ==========================================

// Mock User Database
const USERS = [
    { id: "driver1", name: "John Driver", role: "driver", password: "driver123" },
    { id: "driver2", name: "Alice Driver", role: "driver", password: "driver123" },
    { id: "manager1", name: "Jane Manager", role: "manager", password: "manager123" },
    { id: "manager2", name: "Bob Manager", role: "manager", password: "manager123" }
];

// Application State
const AppState = {
    currentUser: null,
    trips: [],
    darkMode: true,
    currentView: 'dashboard',
    googleAuthenticated: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check for saved session
    const savedUser = localStorage.getItem('fleetflow_user');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        showMainInterface();
    }
    
    // Setup login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Load trips from localStorage
    const savedTrips = localStorage.getItem('fleetflow_trips');
    if (savedTrips) {
        AppState.trips = JSON.parse(savedTrips);
    }
    
    // Initialize dark mode
    initializeDarkMode();
}

// Authentication Functions
function handleLogin(e) {
    e.preventDefault();
    const employeeId = document.getElementById('employee-id').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    const user = USERS.find(u => u.id === employeeId && u.password === password);
    
    if (user) {
        AppState.currentUser = user;
        localStorage.setItem('fleetflow_user', JSON.stringify(user));
        errorDiv.classList.add('hidden');
        showMainInterface();
    } else {
        errorDiv.textContent = 'Invalid Employee ID or Password';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('fleetflow_user');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-interface').classList.add('hidden');
    document.getElementById('employee-id').value = '';
    document.getElementById('password').value = '';
}

function showMainInterface() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-interface').classList.remove('hidden');
    
    // Update UI based on role
    updateUIBasedOnRole();
    
    // Load dashboard data
    loadDashboardData();
    
    // Navigate to dashboard
    navigateTo('dashboard');
}

function updateUIBasedOnRole() {
    const isManager = AppState.currentUser.role === 'manager';
    
    // Dispatch event to update sidebar
    window.dispatchEvent(new CustomEvent('user-role-changed', { 
        detail: { role: AppState.currentUser.role, user: AppState.currentUser } 
    }));
    
    // Show/hide manager-only views
    if (!isManager) {
        // Hide database and spreadsheet nav items for drivers
        document.querySelectorAll('.manager-only-nav').forEach(el => el.classList.add('hidden'));
    }
}

// Navigation
function navigateTo(view) {
    AppState.currentView = view;
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // Show selected view
    const targetView = document.getElementById(`view-${view}`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('animate-fade-in');
    }
    
    // Update sidebar active state
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: { view } }));
    
    // Load view-specific data
    if (view === 'dashboard') {
        loadDashboardData();
    } else if (view === 'database' && AppState.currentUser.role === 'manager') {
        window.dispatchEvent(new CustomEvent('load-database-view'));
    }
}

// Dashboard Functions
function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = AppState.trips.filter(t => t.date === today);
    
    // Calculate stats
    const totalMiles = todayTrips.reduce((sum, t) => sum + (parseFloat(t.totalMiles) || 0), 0);
    const totalWait = todayTrips.reduce((sum, t) => sum + (parseInt(t.totalWait) || 0), 0);
    
    // Count unique drivers
    const activeDrivers = new Set(todayTrips.map(t => t.driverId)).size;
    
    // Update UI
    document.getElementById('stat-today-trips').textContent = todayTrips.length;
    document.getElementById('stat-total-miles').textContent = totalMiles.toFixed(1);
    document.getElementById('stat-total-wait').textContent = totalWait;
    document.getElementById('stat-active-drivers').textContent = activeDrivers;
    
    // Update recent activity
    const recentList = document.getElementById('recent-activity-list');
    const recentTrips = [...AppState.trips].reverse().slice(0, 5);
    
    if (recentTrips.length === 0) {
        recentList.innerHTML = '<p class="text-secondary-400 text-sm italic">No recent activity</p>';
    } else {
        recentList.innerHTML = recentTrips.map(trip => `
            <div class="flex items-center justify-between p-3 bg-secondary-900/50 rounded-lg border border-secondary-700">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <i data-feather="truck" class="w-4 h-4 text-primary-400"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-white">${trip.driverName}</p>
                        <p class="text-xs text-secondary-400">Van ${trip.vanId} • ${trip.destination}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-white">${trip.totalMiles} mi</p>
                    <p class="text-xs text-secondary-400">${trip.date}</p>
                </div>
            </div>
        `).join('');
        feather.replace();
    }
}

// Trip Management
function saveTrip(tripData) {
    const trip = {
        ...tripData,
        id: generateTripId(),
        submittedAt: new Date().toISOString(),
        submittedBy: AppState.currentUser.id,
        driverId: AppState.currentUser.id
    };
    
    // Add to local database
    AppState.trips.push(trip);
    localStorage.setItem('fleetflow_trips', JSON.stringify(AppState.trips));
    
    // Sync with Google Sheets if authenticated
    if (AppState.googleAuthenticated && typeof sheetsAPI !== 'undefined') {
        sheetsAPI.appendTripToSheet(trip).catch(err => console.error('Failed to sync with Google Sheets:', err));
    }
    
    return trip;
}

function generateTripId() {
    return 'TRIP-' + Date.now().toString(36).toUpperCase();
}

function getTrips(filters = {}) {
    let filtered = [...AppState.trips];
    
    if (filters.driver) {
        filtered = filtered.filter(t => t.driverName.toLowerCase().includes(filters.driver.toLowerCase()));
    }
    
    if (filters.vanId) {
        filtered = filtered.filter(t => t.vanId.toLowerCase().includes(filters.vanId.toLowerCase()));
    }
    
    if (filters.dateFrom) {
        filtered = filtered.filter(t => t.date >= filters.dateFrom);
    }
    
    if (filters.dateTo) {
        filtered = filtered.filter(t => t.date <= filters.dateTo);
    }
    
    // If driver role, only show own trips
    if (AppState.currentUser && AppState.currentUser.role === 'driver') {
        filtered = filtered.filter(t => t.driverId === AppState.currentUser.id);
    }
    
    return filtered;
}

// Dark Mode
function initializeDarkMode() {
    const savedMode = localStorage.getItem('fleetflow_darkmode');
    if (savedMode !== null) {
        AppState.darkMode = savedMode === 'true';
    }
    
    applyDarkMode();
}

function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    localStorage.setItem('fleetflow_darkmode', AppState.darkMode);
    applyDarkMode();
}

function applyDarkMode() {
    const html = document.documentElement;
    if (AppState.darkMode) {
        html.classList.add('dark');
        html.classList.remove('light');
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
    }
}

// Export functions for global access
window.AppState = AppState;
window.logout = logout;
window.navigateTo = navigateTo;
window.saveTrip = saveTrip;
window.getTrips = getTrips;
window.toggleDarkMode = toggleDarkMode;
window.generateTripId = generateTripId;