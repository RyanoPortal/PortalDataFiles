class AppHeader extends HTMLElement {
    constructor() {
        super();
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.render();
        this.setupListeners();
    }
    
    setupListeners() {
        // Listen for Google auth state changes
        window.addEventListener('google-auth-success', () => {
            this.render();
        });
        
        window.addEventListener('google-signed-out', () => {
            this.render();
        });
    }
    
    handleGoogleAuth() {
        if (window.AppState.googleAuthenticated) {
            window.sheetsAPI.signOutFromGoogle();
        } else {
            window.sheetsAPI.signInWithGoogle();
        }
    }
    
    render() {
        const isGoogleAuth = window.AppState && window.AppState.googleAuthenticated;
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 64px;
                    background: #1e293b;
                    border-bottom: 1px solid #334155;
                    padding: 0 1.5rem;
                }
                
                .header {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: white;
                }
                
                .actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                
                .btn-google {
                    background: ${isGoogleAuth ? '#dcfce7' : '#fef3c7'};
                    color: ${isGoogleAuth ? '#166534' : '#92400e'};
                }
                
                .btn-google:hover {
                    background: ${isGoogleAuth ? '#bbf7d0' : '#fde68a'};
                }
                
                .btn-theme {
                    background: #334155;
                    color: #e2e8f0;
                    padding: 0.5rem;
                }
                
                .btn-theme:hover {
                    background: #475569;
                }
                
                .btn-logout {
                    background: #ef4444;
                    color: white;
                }
                
                .btn-logout:hover {
                    background: #dc2626;
                }
                
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${isGoogleAuth ? '#22c55e' : '#ef4444'};
                }
            </style>
            
            <div class="header">
                <h2 class="title">Fleet Management Dashboard</h2>
                
                <div class="actions">
                    <button class="btn-google" onclick="this.getRootNode().host.handleGoogleAuth()">
                        <div class="status-indicator"></div>
                        <span>${isGoogleAuth ? 'Sheets Connected' : 'Connect Sheets'}</span>
                    </button>
                    
                    <button class="btn-theme" onclick="window.toggleDarkMode()" title="Toggle Dark Mode">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    </button>
                    
                    <button class="btn-logout" onclick="window.logout()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('app-header', AppHeader);