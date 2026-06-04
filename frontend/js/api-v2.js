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

// ===== RIDES APIs =====

/**
 * Get predefined demo data: Warangal locations and vehicle types
 */
async function getRideDemoData() {
    const response = await fetch(`${API_BASE_URL}/rides/demo-data`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.detail || 'Failed to load demo data');
    }

    return data;
}

/**
 * Estimate a predefined Warangal ride before requesting it
 */
async function estimateRide(estimateData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/rides/estimate`, {
        method: 'POST',
        body: JSON.stringify(estimateData)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.detail || 'Failed to estimate ride');
    }

    return data;
}

/**
 * Create a new ride request
 */
async function createRide(rideData) {
    try {
        AppState.setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/create-ride`, {
            method: 'POST',
            body: JSON.stringify(rideData)
        });

        const data = await response.json().catch(() => ({}));
        AppState.setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to create ride');
        }

        // Set active ride in app state
        AppState.setActiveRide(data);
        AppState.showNotification('Ride created! Finding drivers...');
        
        return data;
    } catch (error) {
        AppState.setLoading(false);
        console.error('❌ Create ride error:', error);
        AppState.setError(error.message);
        throw error;
    }
}

/**
 * Get active ride
 */
async function getActiveRide() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/active-ride`);
        
        if (response.status === 404) {
            AppState.setActiveRide(null);
            return null;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to fetch active ride');
        }

        AppState.setActiveRide(data);
        return data;
    } catch (error) {
        console.error('❌ Get active ride error:', error);
        return null;
    }
}

/**
 * Get ride details by ID
 */
async function getRideDetail(rideId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/ride/${rideId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to fetch ride');
        }

        return data;
    } catch (error) {
        console.error('❌ Get ride detail error:', error);
        throw error;
    }
}

/**
 * Get ride history
 */
async function getRideHistory() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/ride-history`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error('Failed to fetch ride history');
        }

        return data;
    } catch (error) {
        console.error('❌ Get ride history error:', error);
        return [];
    }
}

/**
 * Start ride (verify OTP)
 */
async function startRide(rideId, otp) {
    try {
        AppState.setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/start-ride/${rideId}`, {
            method: 'POST',
            body: JSON.stringify({ otp })
        });

        const data = await response.json().catch(() => ({}));
        AppState.setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to start ride');
        }

        AppState.setActiveRide(data);
        AppState.updateRideStatus('in_progress', data);
        AppState.showNotification('Ride started!');
        return data;
    } catch (error) {
        AppState.setLoading(false);
        console.error('❌ Start ride error:', error);
        AppState.setError(error.message);
        throw error;
    }
}

/**
 * Complete ride
 */
async function completeRide(rideId) {
    try {
        AppState.setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/complete-ride/${rideId}`, {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));
        AppState.setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to complete ride');
        }

        AppState.updateRideStatus('completed', data);
        AppState.setActiveRide(null);
        AppState.showNotification('Ride completed! Please rate your driver.');
        return data;
    } catch (error) {
        AppState.setLoading(false);
        console.error('❌ Complete ride error:', error);
        throw error;
    }
}

/**
 * Cancel ride
 */
async function cancelRide(rideId, reason = null) {
    try {
        AppState.setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/cancel-ride/${rideId}`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });

        const data = await response.json().catch(() => ({}));
        AppState.setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to cancel ride');
        }

        AppState.setActiveRide(null);
        AppState.updateRideStatus('idle');
        AppState.showNotification('Ride cancelled.');
        return data;
    } catch (error) {
        AppState.setLoading(false);
        console.error('❌ Cancel ride error:', error);
        throw error;
    }
}

/**
 * Rate a ride
 */
async function rateRide(rideId, ratingData) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/rate-ride/${rideId}`, {
            method: 'POST',
            body: JSON.stringify(ratingData)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to rate ride');
        }

        AppState.showNotification('Thank you for your rating!');
        return data;
    } catch (error) {
        console.error('❌ Rate ride error:', error);
        throw error;
    }
}

// ===== DRIVER APIs =====

/**
 * Register as a driver
 */
async function registerDriver(driverData) {
    try {
        AppState.setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/register`, {
            method: 'POST',
            body: JSON.stringify(driverData)
        });

        const data = await response.json().catch(() => ({}));
        AppState.setLoading(false);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to register as driver');
        }

        AppState.setDriverProfile(data);
        AppState.showNotification('Driver registration successful!');
        return data;
    } catch (error) {
        AppState.setLoading(false);
        console.error('❌ Register driver error:', error);
        throw error;
    }
}

/**
 * Get driver profile
 */
async function getDriverProfile() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/me`);
        const data = await response.json().catch(() => ({}));

        if (response.status === 404) {
            AppState.setDriverProfile(null);
            return null;
        }

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to fetch driver profile');
        }

        AppState.setDriverProfile(data);
        return data;
    } catch (error) {
        console.error('❌ Get driver profile error:', error);
        return null;
    }
}

/**
 * Go online (driver)
 */
async function driverGoOnline() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/go-online`, {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to go online');
        }

        AppState.setDriverOnlineStatus(true);
        AppState.showNotification('You are now online!');
        return data;
    } catch (error) {
        console.error('❌ Go online error:', error);
        throw error;
    }
}

/**
 * Go offline (driver)
 */
async function driverGoOffline() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/go-offline`, {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to go offline');
        }

        AppState.setDriverOnlineStatus(false);
        AppState.showNotification('You are now offline.');
        return data;
    } catch (error) {
        console.error('❌ Go offline error:', error);
        throw error;
    }
}

/**
 * Update driver location
 */
async function updateDriverLocation(latitude, longitude) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/update-location`, {
            method: 'POST',
            body: JSON.stringify({ latitude, longitude })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Failed to update location');
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ Update location error:', error);
        return null;
    }
}

/**
 * Get driver's active rides
 */
async function getDriverActiveRides() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/active-rides`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
            return [];
        }

        AppState.setDriverActiveRides(data);
        return data;
    } catch (error) {
        console.error('❌ Get active rides error:', error);
        return [];
    }
}

/**
 * Get driver's earnings
 */
async function getDriverEarnings() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/drivers/earnings`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return null;
        }

        AppState.setDriverEarnings(data);
        return data;
    } catch (error) {
        console.error('❌ Get earnings error:', error);
        return null;
    }
}

/**
 * Accept a ride (driver)
 */
async function acceptRide(rideId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/accept-ride/${rideId}`, {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to accept ride');
        }

        AppState.setActiveRide(data);
        AppState.showNotification('Ride accepted!');
        return data;
    } catch (error) {
        console.error('❌ Accept ride error:', error);
        throw error;
    }
}

/**
 * Reject a ride (driver)
 */
async function rejectRide(rideId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/rides/reject-ride/${rideId}`, {
            method: 'POST'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to reject ride');
        }

        AppState.showNotification('Ride request rejected.');
        return data;
    } catch (error) {
        console.error('Reject ride error:', error);
        throw error;
    }
}
