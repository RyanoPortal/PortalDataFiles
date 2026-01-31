class TripForm extends HTMLElement {
    constructor() {
        super();
        this.stops = [];
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.render();
        this.setupEventListeners();
        this.addStop(); // Add first stop by default
    }
    
    setupEventListeners() {
        // Form submission
        this.shadowRoot.getElementById('trip-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Auto-calculate totals when EOT odometer changes
        this.shadowRoot.getElementById('eot-odometer').addEventListener('input', () => {
            this.calculateTotals();
        });
        
        // Set default date to today
        this.shadowRoot.getElementById('date').valueAsDate = new Date();
        
        // Pre-fill driver name if logged in
        if (window.AppState.currentUser) {
            this.shadowRoot.getElementById('driver-name').value = window.AppState.currentUser.name;
        }
    }
    
    addStop() {
        const stopNumber = this.stops.length + 1;
        this.stops.push({
            number: stopNumber,
            time: '',
            odometer: '',
            location: '',
            reason: '',
            wait: 0
        });
        this.renderStops();
    }
    
    removeStop(index) {
        this.stops.splice(index, 1);
        // Renumber stops
        this.stops.forEach((stop, i) => stop.number = i + 1);
        this.renderStops();
        this.calculateTotals();
    }
    
    updateStop(index, field, value) {
        this.stops[index][field] = value;
        if (field === 'wait') {
            this.calculateTotals();
        }
    }
    
    calculateTotals() {
        // Calculate total wait
        const totalWait = this.stops.reduce((sum, stop) => sum + (parseInt(stop.wait) || 0), 0);
        this.shadowRoot.getElementById('total-wait').value = totalWait;
        
        // Calculate total miles
        const startingOdo = parseFloat(this.shadowRoot.getElementById('starting-odometer').value) || 0;
        const eotOdo = parseFloat(this.shadowRoot.getElementById('eot-odometer').value) || 0;
        const totalMiles = eotOdo - startingOdo;
        
        if (totalMiles >= 0) {
            this.shadowRoot.getElementById('total-miles').value = totalMiles.toFixed(1);
        }
    }
    
    handleSubmit() {
        const formData = {
            driverName: this.shadowRoot.getElementById('driver-name').value,
            date: this.shadowRoot.getElementById('date').value,
            vanId: this.shadowRoot.getElementById('van-id').value,
            destination: this.shadowRoot.getElementById('destination').value,
            crewName: this.shadowRoot.getElementById('crew-name').value,
            dispatcher: this.shadowRoot.getElementById('dispatcher').value,
            rr: this.shadowRoot.getElementById('rr').value,
            h: this.shadowRoot.getElementById('h').value,
            startingOdometer: this.shadowRoot.getElementById('starting-odometer').value,
            stops: [...this.stops],
            eotTime: this.shadowRoot.getElementById('eot-time').value,
            eotOdometer: this.shadowRoot.getElementById('eot-odometer').value,
            totalWait: this.shadowRoot.getElementById('total-wait').value,
            totalMiles: this.shadowRoot.getElementById('total-miles').value,
            backTime: this.shadowRoot.getElementById('back-time').value
        };
        
        // Validate
        if (!formData.driverName || !formData.date || !formData.vanId) {
            alert('Please fill in all required fields (Driver Name, Date, Van ID)');
            return;
        }
        
        if (this.stops.length === 0) {
            alert('Please add at least one stop');
            return;
        }
        
        // Save trip
        const savedTrip = window.saveTrip(formData);
        
        // Show success message
        this.showSuccessMessage();
        
        // Reset form
        this.resetForm();
    }
    
    showSuccessMessage() {
        const successDiv = this.shadowRoot.getElementById('success-message');
        successDiv.classList.remove('hidden');
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 3000);
    }
    
    resetForm() {
        this.stops = [];
        this.shadowRoot.getElementById('trip-form').reset();
        this.shadowRoot.getElementById('date').valueAsDate = new Date();
        if (window.AppState.currentUser) {
            this.shadowRoot.getElementById('driver-name').value = window.AppState.currentUser.name;
        }
        this.addStop();
        this.calculateTotals();
    }
    
    renderStops() {
        const tbody = this.shadowRoot.getElementById('stops-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.stops.map((stop, index) => `
            <tr class="border-b border-secondary-700">
                <td class="p-2 text-center text-secondary-300">${stop.number}</td>
                <td class="p-2">
                    <input type="time" value="${stop.time}" 
                        onchange="this.getRootNode().host.updateStop(${index}, 'time', this.value)"
                        class="w-full px-2 py-1 bg-secondary-900 border border-secondary-700 rounded text-sm text-white focus:border-primary-500 outline-none">
                </td>
                <td class="p-2">
                    <input type="number" value="${stop.odometer}" 
                        onchange="this.getRootNode().host.updateStop(${index}, 'odometer', this.value)"
                        class="w-full px-2 py-1 bg-secondary-900 border border-secondary-700 rounded text-sm text-white focus:border-primary-500 outline-none">
                </td>
                <td class="p-2">
                    <input type="text" value="${stop.location}" 
                        onchange="this.getRootNode().host.updateStop(${index}, 'location', this.value)"
                        class="w-full px-2 py-1 bg-secondary-900 border border-secondary-700 rounded text-sm text-white focus:border-primary-500 outline-none">
                </td>
                <td class="p-2">
                    <input type="text" value="${stop.reason}" 
                        onchange="this.getRootNode().host.updateStop(${index}, 'reason', this.value)"
                        class="w-full px-2 py-1 bg-secondary-900 border border-secondary-700 rounded text-sm text-white focus:border-primary-500 outline-none">
                </td>
                <td class="p-2">
                    <input type="number" value="${stop.wait}" 
                        onchange="this.getRootNode().host.updateStop(${index}, 'wait', this.value)"
                        class="w-full px-2 py-1 bg-secondary-900 border border-secondary-700 rounded text-sm text-white focus:border-primary-500 outline-none">
                </td>
                <td class="p-2 text-center">
                    <button type="button" onclick="this.getRootNode().host.removeStop(${index})"
                        class="text-red-400 hover:text-red-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .form-container {
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                }
                
                h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .section {
                    margin-bottom: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #334155;
                }
                
                .section:last-of-type {
                    border-bottom: none;
                }
                
                .section-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #60a5fa;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1rem;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #94a3b8;
                }
                
                input {
                    padding: 0.5rem 0.75rem;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 0.375rem;
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                input:focus {
                    border-color: #3b82f6;
                }
                
                input:read-only {
                    background: #334155;
                    cursor: not-allowed;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                
                th {
                    background: #334155;
                    color: #94a3b8;
                    font-weight: 600;
                    text-align: left;
                    padding: 0.75rem;
                    border-bottom: 2px solid #475569;
                }
                
                td {
                    padding: 0.5rem;
                }
                
                .btn-add {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .btn-add:hover {
                    background: #2563eb;
                }
                
                .btn-submit {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    width: 100%;
                    padding: 0.875rem;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .btn-submit:hover {
                    background: #059669;
                }
                
                .success-message {
                    background: #10b981;
                    color: white;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .hidden {
                    display: none !important;
                }
            </style>
            
            <div class="form-container">
                <div id="success-message" class="success-message hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Trip sheet submitted successfully!
                </div>
                
                <h2>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Trip Sheet Form
                </h2>
                
                <form id="trip-form">
                    <!-- Driver Section -->
                    <div class="section">
                        <div class="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            Driver Information
                        </div>
                        <div class="grid">
                            <div class="form-group">
                                <label>Driver Name *</label>
                                <input type="text" id="driver-name" required>
                            </div>
                            <div class="form-group">
                                <label>Date *</label>
                                <input type="date" id="date" required>
                            </div>
                            <div class="form-group">
                                <label>Van ID *</label>
                                <input type="text" id="van-id" required placeholder="e.g., VAN-001">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Crew Section -->
                    <div class="section">
                        <div class="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Crew & Destination
                        </div>
                        <div class="grid">
                            <div class="form-group">
                                <label>Destination</label>
                                <input type="text" id="destination" placeholder="e.g., Downtown Medical Center">
                            </div>
                            <div class="form-group">
                                <label>Crew Name</label>
                                <input type="text" id="crew-name">
                            </div>
                            <div class="form-group">
                                <label>Dispatcher #</label>
                                <input type="text" id="dispatcher">
                            </div>
                            <div class="form-group">
                                <label>RR #</label>
                                <input type="text" id="rr">
                            </div>
                            <div class="form-group">
                                <label>H #</label>
                                <input type="text" id="h">
                            </div>
                            <div class="form-group">
                                <label>Starting Odometer</label>
                                <input type="number" id="starting-odometer" step="0.1">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stops Section -->
                    <div class="section">
                        <div class="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
                            Stops
                        </div>
                        <div style="overflow-x: auto;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Stop #</th>
                                        <th>Time</th>
                                        <th>Odometer</th>
                                        <th>Location</th>
                                        <th>Why?</th>
                                        <th>Wait (min)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="stops-tbody">
                                    <!-- Stops rendered here -->
                                </tbody>
                            </table>
                        </div>
                        <button type="button" class="btn-add" onclick="this.getRootNode().host.addStop()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Stop
                        </button>
                    </div>
                    
                    <!-- End of Trip Section -->
                    <div class="section">
                        <div class="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                            End of Trip
                        </div>
                        <div class="grid">
                            <div class="form-group">
                                <label>EOT Time</label>
                                <input type="time" id="eot-time">