// ==========================================
// Google Sheets Integration Module
// ==========================================

const sheetsAPI = {
    // Configuration - Replace with your actual credentials
    config: {
        CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        API_KEY: 'YOUR_GOOGLE_API_KEY',
        SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',
        DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
        SCOPES: 'https://www.googleapis.com/auth/spreadsheets'
    },
    
    tokenClient: null,
    gapiInited: false,
    gisInited: false,
    
    // Initialize Google API Client
    initGoogleClient() {
        return new Promise((resolve, reject) => {
            // Load the Google API client library
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            apiKey: this.config.API_KEY,
                            discoveryDocs: [this.config.DISCOVERY_DOC],
                        });
                        this.gapiInited = true;
                        resolve();
                    } catch (err) {
                        console.error('Error initializing GAPI client:', err);
                        reject(err);
                    }
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Initialize Google Identity Services
    initGIS() {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.accounts) {
                reject(new Error('Google Identity Services not loaded'));
                return;
            }
            
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.config.CLIENT_ID,
                scope: this.config.SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error) {
                        console.error('Token error:', tokenResponse);
                        return;
                    }
                    AppState.googleAuthenticated = true;
                    window.dispatchEvent(new CustomEvent('google-auth-success'));
                },
            });
            
            this.gisInited = true;
            resolve();
        });
    },
    
    // Sign in with Google
    signInWithGoogle() {
        if (!this.gisInited) {
            console.error('GIS not initialized');
            return;
        }
        
        // Request an access token
        this.tokenClient.requestAccessToken();
    },
    
    // Sign out from Google
    signOutFromGoogle() {
        if (AppState.googleAuthenticated) {
            // Revoke token
            const token = gapi.client.getToken();
            if (token) {
                google.accounts.oauth2.revoke(token.access_token, () => {
                    AppState.googleAuthenticated = false;
                    gapi.client.setToken(null);
                    window.dispatchEvent(new CustomEvent('google-signed-out'));
                });
            }
        }
    },
    
    // Append trip to sheet
    async appendTripToSheet(trip) {
        if (!AppState.googleAuthenticated) {
            throw new Error('Not authenticated with Google');
        }
        
        // Format stops for sheet
        const stopsFormatted = trip.stops.map((s, i) => 
            `#${i+1} ${s.time} ${s.odometer} ${s.location} ${s.reason} ${s.wait}min`
        ).join('; ');
        
        const values = [
            [
                trip.id,
                trip.date,
                trip.driverName,
                trip.vanId,
                trip.destination,
                trip.crewName,
                trip.dispatcher,
                trip.rr,
                trip.h,
                trip.startingOdometer,
                stopsFormatted,
                trip.eotTime,
                trip.eotOdometer,
                trip.totalWait,
                trip.totalMiles,
                trip.backTime,
                trip.submittedAt
            ]
        ];
        
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.SHEET_ID,
                range: 'Sheet1!A:Q',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });
            
            console.log('Trip appended to sheet:', response);
            return response;
        } catch (err) {
            console.error('Error appending to sheet:', err);
            throw err;
        }
    },
    
    // Load trips from sheet
    async loadTripsFromSheet() {
        if (!AppState.googleAuthenticated) {
            throw new Error('Not authenticated with Google');
        }
        
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.SHEET_ID,
                range: 'Sheet1!A2:Q',
            });
            
            const rows = response.result.values;
            if (!rows || rows.length === 0) {
                return [];
            }
            
            // Convert rows to trip objects
            const trips = rows.map(row => ({
                id: row[0],
                date: row[1],
                driverName: row[2],
                vanId: row[3],
                destination: row[4],
                crewName: row[5],
                dispatcher: row[6],
                rr: row[7],
                h: row[8],
                startingOdometer: row[9],
                stopsFormatted: row[10],
                eotTime: row[11],
                eotOdometer: row[12],
                totalWait: row[13],
                totalMiles: row[14],
                backTime: row[15],
                submittedAt: row[16]
            }));
            
            return trips;
        } catch (err) {
            console.error('Error loading from sheet:', err);
            throw err;
        }
    },
    
    // Export trips to specific sheet range (for spreadsheet workspace)
    async exportTripsToRange(trips, sheetName, startCell) {
        if (!AppState.googleAuthenticated) {
            throw new Error('Not authenticated with Google');
        }
        
        const headers = ['Trip ID', 'Date', 'Driver', 'Van', 'Destination', 'Total Miles', 'Total Wait'];
        const values = trips.map(t => [
            t.id, t.date, t.driverName, t.vanId, t.destination, t.totalMiles, t.totalWait
        ]);
        
        const allValues = [headers, ...values];
        
        try {
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.SHEET_ID,
                range: `${sheetName}!${startCell}`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: allValues }
            });
            
            return response;
        } catch (err) {
            console.error('Error exporting to range:', err);
            throw err;
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Auto-initialize if credentials are set (not placeholder)
    if (sheetsAPI.config.CLIENT_ID.includes('YOUR_') === false) {
        sheetsAPI.initGoogleClient().then(() => {
            return sheetsAPI.initGIS();
        }).then(() => {
            console.log('Google Sheets API initialized');
        }).catch(err => {
            console.log('Google Sheets API not initialized (expected if credentials not set)');
        });
    }
});

// Expose to window
window.sheetsAPI = sheetsAPI;