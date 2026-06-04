/**
 * IntelliRoute API Communication Module
 * Handles all interactions with backend services
 */

const API_BASE_URL = '/api';

// ===== AUTHENTICATION APIs =====

/**
 * Register a new user
 */
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || `Registration failed: ${response.status}`);
        }

        // Store auth data in AppState
        AppState.login(data.user, data.access_token, data.refresh_token);
        return data;
    } catch (error) {
        console.error('❌ Registration error:', error);
        throw error;
    }
}

/**
 * Login user
 */
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || `Login failed: ${response.status}`);
        }

        // Store auth data in AppState
        AppState.login(data.user, data.access_token, data.refresh_token);
        return data;
    } catch (error) {
        console.error('❌ Login error:', error);
        throw error;
    }
}

/**
 * Get current user profile
 */
async function getCurrentUser() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to fetch user');
        }

        AppState.updateUserProfile(data);
        return data;
    } catch (error) {
        console.error('❌ Get user error:', error);
        throw error;
    }
}

/**
 * Update user profile
 */
async function updateUserProfile(profileData) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to update profile');
        }

        AppState.updateUserProfile(data);
        return data;
    } catch (error) {
        console.error('❌ Update profile error:', error);
        throw error;
    }
}

/**
 * Add money to wallet
 */
async function addWalletBalance(amount) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/wallet/add`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to add balance');
        }

        // Update user wallet
        const user = AppState.getUser();
        if (user) {
            user.wallet_balance = data.wallet_balance;
            AppState.updateUserProfile(user);
        }

        return data;
    } catch (error) {
        console.error('❌ Add wallet error:', error);
        throw error;
    }
}

/**
 * Save a favorite location
 */
async function saveLocation(locationData) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/locations`, {
            method: 'POST',
            body: JSON.stringify(locationData)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to save location');
        }

        return data;
    } catch (error) {
        console.error('❌ Save location error:', error);
        throw error;
    }
}

/**
 * Get user's saved locations
 */
async function getSavedLocations() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/locations`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error('Failed to fetch locations');
        }

        return data;
    } catch (error) {
        console.error('❌ Get locations error:', error);
        throw error;
    }
}
function getStoredUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Logout user
 */
function logoutUser() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/pages/login-v2.html';
}

/**
 * Get headers with authentication token
 * @returns {Object} Headers object
 */
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Get current user profile from backend
 * @returns {Promise<Object>} User profile
 */
async function getCurrentUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                logoutUser();
            }
            throw new Error('Failed to fetch user profile');
        }

        const user = await response.json();
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

// ===== LOCATION SEARCH =====

/**
 * Search places using Nominatim (OpenStreetMap)
 * @param {string} q - query
 * @param {number} limit - max results
 * @returns {Promise<Array>} array of {display_name, lat, lon}
 */
async function searchPlaces(q, limit = 6) {
    if (!q || q.length < 3) return [];
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=0&limit=${limit}`;
    try {
        const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!resp.ok) throw new Error(`Geocode error: ${resp.status}`);
        const data = await resp.json();
        return data.map(item => ({ display_name: item.display_name, lat: parseFloat(item.lat), lon: parseFloat(item.lon) }));
    } catch (err) {
        console.error('searchPlaces error:', err);
        return [];
    }
}

// ===== ROUTE & LOCATION =====

/**
 * Fetches route alternatives from OSRM
 * @param {number} startLat 
 * @param {number} startLng 
 * @param {number} endLat 
 * @param {number} endLng 
 * @returns {Promise<Array>} Array of route objects containing geometry, distance, duration
 */
async function fetchRouteAlternatives(startLat, startLng, endLat, endLng) {
    // OSRM expects longitude,latitude
    const coords = `${startLng},${startLat};${endLng},${endLat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=3`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`OSRM API error: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No routes found');
        }

        // Process and categorize routes
        return data.routes.map((route, index) => {
            // Simulated attributes to give each route a unique identity
            let type = 'Standard';
            let color = '#1E405E'; // Navy
            let safetyScore = 80 + Math.floor(Math.random() * 15); // 80-95
            let trafficLevel = 'Medium';
            let fareMultiplier = 1.0;
            
            if (index === 0) {
                type = 'AI Recommended';
                color = '#1F7B6D'; // Teal (Safest)
                safetyScore = 92 + Math.floor(Math.random() * 6); // 92-98
                trafficLevel = 'Low';
            } else if (index === 1) {
                type = 'Fastest';
                color = '#C58A2A'; // Gold
                safetyScore -= 10;
                trafficLevel = 'High';
                fareMultiplier = 1.15;
            } else {
                type = 'Alternative';
                color = '#58A6FF'; // Blue
            }

            return {
                id: `route-${index}`,
                type: type,
                color: color,
                geometry: route.geometry,
                distanceKm: (route.distance / 1000).toFixed(1),
                durationMins: Math.round(route.duration / 60),
                safetyScore: safetyScore,
                trafficLevel: trafficLevel,
                fareMultiplier: fareMultiplier,
                raw: route
            };
        });

    } catch (error) {
        console.error("Error fetching routes:", error);
        // Fallback to straight line if OSRM fails
        return [{
            id: 'route-fallback',
            type: 'Fallback',
            color: '#1E405E',
            geometry: {
                type: "LineString",
                coordinates: [[startLng, startLat], [endLng, endLat]]
            },
            distanceKm: "Unknown",
            durationMins: "Unknown",
            safetyScore: 85,
            trafficLevel: 'Unknown',
            fareMultiplier: 1.0
        }];
    }
}
