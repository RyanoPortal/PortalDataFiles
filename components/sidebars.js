class AppSidebar extends HTMLElement {
    constructor() {
        super();
        this.user = null;
        this.currentView = 'dashboard';
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.render();
        this.setupListeners();
    }
    
    setupListeners() {
        window.addEventListener('user-role-changed', (e) => {
            this.user = e.detail.user;
            this.render();
        });
        
        window.addEventListener('navigate-to', (e) => {
            this.currentView = e.detail.view;
            this.updateActiveState();
        });
    }
    
    updateActiveState() {
        const buttons = this.shadowRoot.querySelectorAll('nav button');
        buttons.forEach(btn => {
            const view = btn.getAttribute('data-view');
            if (view === this.currentView) {
                btn.classList.add('bg-primary-500/20', 'text-primary-400', 'border-r-2', 'border-primary-500');
                btn.classList.remove('text-secondary-400', 'hover:bg-secondary-800', 'hover:text-secondary-200');
            } else {
                btn.classList.remove('bg-primary-500/20', 'text-primary-400', 'border-r-2', 'border-primary-500');
                btn.classList.add('text-secondary-400', 'hover:bg-secondary-800', 'hover:text-secondary-200');
            }
        });
    }
    
    render() {
        const isManager = this.user && this.user.role === 'manager';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 256px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    background: #1e293b;
                    border-right: 1px solid #334155;
                    z-index: 40;
                }
                
                .logo {
                    padding: 1.5rem;
                    border-bottom: 1px solid #334155;
                }
                
                nav {
                    padding: 1rem 0;
                }
                
                button {
                    width: 100%;
                    padding: 0.75rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    color: #94a3b8;
                }
                
                button:hover {
                    background: #334155;
                    color: #e2e8f0;
                }
                
                button.active {
                    background: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                    border-right: 2px solid #3b82f6;
                }
                
                .section-label {
                    padding: 0.5rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    margin-top: 1rem;
                }
                
                .user-info {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #334155;
                    background: #0f172a;
                }
            </style>
            
            <div class="logo">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white leading-tight">FleetFlow</h1>
                        <p class="text-xs text-secondary-400">Navigator</p>
                    </div>
                </div>
            </div>
            
            <nav>
                <button class="${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard" onclick="window.navigateTo('dashboard')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Dashboard
                </button>
                
                <button class="${this.currentView === 'trip-sheet' ? 'active' : ''}" data-view="trip-sheet" onclick="window.navigateTo('trip-sheet')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Trip Sheet
                </button>
                
                ${isManager ? `
                <div class="section-label">Management</div>
                
                <button class="${this.currentView === 'database' ? 'active' : ''} manager-only-nav" data-view="database" onclick="window.navigateTo('database')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                    Database
                </button>
                
                <button class="${this.currentView === 'spreadsheet' ? 'active' : ''} manager-only-nav" data-view="spreadsheet" onclick="window.navigateTo('spreadsheet')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="9" x2="9" y2="21"></line><line x1="15" y1="9" x2="15" y2="21"></line></svg>
                    Spreadsheet
                </button>
                ` : ''}
            </nav>
            
            <div class="user-info">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">${this.user ? this.user.name : 'Guest'}</p>
                        <p class="text-xs text-secondary-400 capitalize">${this.user ? this.user.role : ''}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-sidebar', AppSidebar);