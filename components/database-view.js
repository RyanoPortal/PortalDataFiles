class DatabaseView extends HTMLElement {
    constructor() {
        super();
        this.filters = {
            dateFrom: '',
            dateTo: '',
            driver: '',
            vanId: ''
        };
        this.filteredTrips = [];
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.loadData();
        this.render();
        this.setupListeners();
    }
    
    setupListeners() {
        window.addEventListener('load-database-view', () => {
            this.loadData();
            this.render();
        });
    }
    
    loadData() {
        this.filteredTrips = window.getTrips(this.filters);
    }
    
    applyFilters() {
        this.filters.dateFrom = this.shadowRoot.getElementById('filter-date-from').value;
        this.filters.dateTo = this.shadowRoot.getElementById('filter-date-to').value;
        this.filters.driver = this.shadowRoot.getElementById('filter-driver').value;
        this.filters.vanId = this.shadowRoot.getElementById('filter-van').value;
        
        this.loadData();
        this.renderTable();
    }
    
    clearFilters() {
        this.filters = { dateFrom: '', dateTo: '', driver: '', vanId: '' };
        this.shadowRoot.getElementById('filter-date-from').value = '';
        this.shadowRoot.getElementById('filter-date-to').value = '';
        this.shadowRoot.getElementById('filter-driver').value = '';
        this.shadowRoot.getElementById('filter-van').value = '';
        
        this.loadData();
        this.renderTable();
    }
    
    exportCSV() {
        const headers = ['Trip ID', 'Date', 'Driver Name', 'Van ID', 'Destination', 'Total Miles', 'Total Wait', 'Stops Count', 'Submitted At'];
        const rows = this.filteredTrips.map(t => [
            t.id, t.date, t.driverName, t.vanId, t.destination, t.totalMiles, t.totalWait, t.stops.length, t.submittedAt
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trips_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    
    exportToSpreadsheet() {
        window.dispatchEvent(new CustomEvent('export-to-spreadsheet', { 
            detail: { trips: this.filteredTrips } 
        }));
        window.navigateTo('spreadsheet');
    }
    
    renderTable() {
        const tbody = this.shadowRoot.getElementById('table-body');
        if (!tbody) return;
        
        if (this.filteredTrips.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8 text-secondary-400">
                        No trips found matching your criteria
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.filteredTrips.map
