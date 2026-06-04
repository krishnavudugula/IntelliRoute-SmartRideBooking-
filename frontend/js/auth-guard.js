/**
 * Authentication Guard Module
 * Protects pages, manages login/logout, handles token refresh
 */

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return AppState.isLoggedIn();
}

/**
 * Get stored user data
 */
function getStoredUser() {
    return AppState.getUser();
}

/**
 * Protect a page - redirect to login if not authenticated
 * Call this at the top of protected pages
 */
function protectPage() {
    // Check immediately (AppState auto-restores on script load)
    if (!isAuthenticated()) {
        setTimeout(() => {
            if (!isAuthenticated()) {
                window.location.href = '/pages/login-v2.html';
            }
        }, 100);
        return false;
    }
    return true;
}

/**
 * Check if user is a driver (has driver profile)
 */
function isDriver() {
    return AppState.getDriverProfile() !== null;
}

/**
 * Add authentication info to page
 */
function loadUserInfo() {
    const user = getStoredUser();
    if (!user) return;
    
    // Update user name display
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        userNameElement.style.display = 'inline';
    }

    // Update user email display
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }

    // Update wallet balance
    const walletElement = document.getElementById('user-wallet');
    if (walletElement) {
        walletElement.textContent = `₹ ${parseFloat(user.wallet_balance || 0).toFixed(2)}`;
    }
    
    // Show logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    }
}

/**
 * Logout user
 */
async function logoutUser() {
    try {
        // Call logout API (optional)
        const token = AppState.getToken();
        if (token) {
            await fetch('/api/users/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {}); // Ignore errors
        }
    } catch (err) {
        console.warn('Logout API call failed:', err);
    }
    
    // Clear local state
    AppState.logout();
    AppState.reset();
    
    // Redirect to login
    setTimeout(() => {
        window.location.href = '/pages/login-v2.html';
    }, 100);
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('intelliroute_refresh_token');
    
    if (!refreshToken) {
        logoutUser();
        return false;
    }
    
    try {
        const response = await fetch('/api/users/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            throw new Error(`Refresh failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Update token and user
        AppState.login(data.user, data.access_token, refreshToken);
        console.log('✅ Token refreshed successfully');
        
        return true;
    } catch (err) {
        console.error('❌ Token refresh failed:', err);
        logoutUser();
        return false;
    }
}

/**
 * Make authenticated API call with auto-refresh
 */
async function authenticatedFetch(url, options = {}) {
    let token = AppState.getToken();
    
    // Add auth header
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['Authorization'] = `Bearer ${token}`;
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    
    let response = await fetch(url, options);
    
    // If 401, try to refresh token and retry
    if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
            token = AppState.getToken();
            options.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, options);
        } else {
            throw new Error('Authentication failed');
        }
    }
    
    return response;
}

/**
 * Setup logout button handlers
 */
function setupLogoutButton() {
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logoutUser();
            }
        });
    });
}

/**
 * Ensure auth is ready before running callback
 */
function ensureAuthReady(cb) {
    if (typeof cb !== 'function') return;
    
    if (isAuthenticated()) {
        cb();
        return;
    }
    
    // Wait for app state initialization
    let tries = 0;
    const checkAuth = setInterval(() => {
        tries++;
        if (isAuthenticated()) {
            clearInterval(checkAuth);
            cb();
        }
        if (tries > 50) clearInterval(checkAuth); // Give up after 5 seconds
    }, 100);
}

/**
 * Listen to auth state changes
 */
AppState.on('auth:login', (user) => {
    console.log('🔑 User logged in:', user.email);
    loadUserInfo();
});

AppState.on('auth:logout', () => {
    console.log('🚪 User logged out');
});

AppState.on('auth:session-restored', (user) => {
    console.log('✅ Session restored for:', user.email);
    loadUserInfo();
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ensureAuthReady(() => {
        loadUserInfo();
        setupLogoutButton();
    });
});
