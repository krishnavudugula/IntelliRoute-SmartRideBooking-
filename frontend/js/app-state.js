/**
 * IntelliRoute App State Management
 * Centralized state management for the entire application
 * Handles: auth, user data, active ride, UI state
 */

const AppState = (() => {
    // Private state
    const STATE = {
        auth: {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null
        },
        ride: {
            active: null,
            history: [],
            currentRequest: null,
            status: 'idle' // idle, searching, accepted, in_progress, completed
        },
        driver: {
            profile: null,
            isOnline: false,
            activeRides: [],
            earnings: null
        },
        ui: {
            currentPage: 'home',
            loading: false,
            error: null,
            notification: null,
            showModal: null
        }
    };

    // Event listeners
    const listeners = {};

    /**
     * Subscribe to state changes
     * @param {string} event - Event name (e.g., 'auth:login', 'ride:status-change')
     * @param {Function} callback - Callback function
     */
    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);

        // Return unsubscribe function
        return () => {
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Emit state change event
     */
    function emit(event, data) {
        console.log(`[AppState] ${event}`, data);
        if (listeners[event]) {
            listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in listener for ${event}:`, err);
                }
            });
        }
    }

    /**
     * Get current state (or specific slice)
     */
    function getState(path = null) {
        if (!path) return JSON.parse(JSON.stringify(STATE));
        
        const parts = path.split('.');
        let value = STATE;
        for (const part of parts) {
            value = value[part];
            if (value === undefined) return null;
        }
        return value;
    }

    /**
     * Update state and emit event
     */
    function setState(path, value, eventName = null) {
        const parts = path.split('.');
        const lastPart = parts.pop();
        
        let obj = STATE;
        for (const part of parts) {
            obj = obj[part];
        }
        
        const oldValue = obj[lastPart];
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
            obj[lastPart] = value;
            
            if (eventName) {
                emit(eventName, { old: oldValue, new: value });
            }
        }
    }

    /**
     * LOGIN - Set auth state after successful login
     */
    function login(userData, accessToken, refreshToken) {
        setState('auth.isAuthenticated', true, 'auth:login');
        setState('auth.user', userData, 'auth:user-update');
        setState('auth.accessToken', accessToken);
        setState('auth.refreshToken', refreshToken);
        
        // Store in localStorage
        localStorage.setItem('intelliroute_token', accessToken);
        localStorage.setItem('intelliroute_refresh_token', refreshToken);
        localStorage.setItem('intelliroute_user', JSON.stringify(userData));
        
        emit('auth:login-success', userData);
        console.log('✅ User logged in:', userData.email);
    }

    /**
     * LOGOUT - Clear auth state
     */
    function logout() {
        setState('auth.isAuthenticated', false);
        setState('auth.user', null);
        setState('auth.accessToken', null);
        setState('auth.refreshToken', null);
        
        localStorage.removeItem('intelliroute_token');
        localStorage.removeItem('intelliroute_refresh_token');
        localStorage.removeItem('intelliroute_user');
        
        emit('auth:logout', null);
        console.log('✅ User logged out');
    }

    /**
     * AUTO-LOGIN - Restore session from localStorage
     */
    function tryAutoLogin() {
        const token = localStorage.getItem('intelliroute_token');
        const refreshToken = localStorage.getItem('intelliroute_refresh_token');
        const userStr = localStorage.getItem('intelliroute_user');
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                setState('auth.isAuthenticated', true);
                setState('auth.user', user);
                setState('auth.accessToken', token);
                setState('auth.refreshToken', refreshToken);
                
                console.log('✅ Session restored for', user.email);
                emit('auth:session-restored', user);
                return true;
            } catch (err) {
                console.warn('Failed to restore session:', err);
                logout();
                return false;
            }
        }
        return false;
    }

    /**
     * UPDATE USER PROFILE
     */
    function updateUserProfile(userData) {
        setState('auth.user', userData, 'auth:user-update');
        localStorage.setItem('intelliroute_user', JSON.stringify(userData));
        emit('user:profile-update', userData);
    }

    /**
     * UPDATE ACTIVE RIDE
     */
    function setActiveRide(rideData) {
        setState('ride.active', rideData, 'ride:update');
        if (rideData) {
            setState('ride.status', rideData.status, 'ride:status-change');
            emit('ride:active-set', rideData);
        } else {
            setState('ride.status', 'idle');
            emit('ride:cleared', null);
        }
    }

    /**
     * UPDATE RIDE STATUS
     */
    function updateRideStatus(status, rideData) {
        setState('ride.status', status, 'ride:status-change');
        if (rideData) {
            setState('ride.active', rideData);
        }
        emit('ride:status-update', { status, ride: rideData });
    }

    /**
     * ADD RIDE TO HISTORY
     */
    function addRideToHistory(rideData) {
        const history = getState('ride.history') || [];
        history.unshift(rideData);
        setState('ride.history', history);
        emit('ride:added-to-history', rideData);
    }

    /**
     * SET DRIVER PROFILE
     */
    function setDriverProfile(driverData) {
        setState('driver.profile', driverData, 'driver:profile-set');
        emit('driver:profile-update', driverData);
    }

    /**
     * UPDATE DRIVER ONLINE STATUS
     */
    function setDriverOnlineStatus(isOnline) {
        setState('driver.isOnline', isOnline, 'driver:status-change');
        emit('driver:status-update', { isOnline });
    }

    /**
     * UPDATE ACTIVE RIDES (for driver)
     */
    function setDriverActiveRides(rides) {
        setState('driver.activeRides', rides);
        emit('driver:active-rides-update', rides);
    }

    /**
     * UPDATE DRIVER EARNINGS
     */
    function setDriverEarnings(earningsData) {
        setState('driver.earnings', earningsData, 'driver:earnings-update');
        emit('driver:earnings-update', earningsData);
    }

    /**
     * SET UI LOADING STATE
     */
    function setLoading(isLoading) {
        setState('ui.loading', isLoading);
        emit('ui:loading-change', { isLoading });
    }

    /**
     * SET UI ERROR
     */
    function setError(errorMsg) {
        setState('ui.error', errorMsg);
        if (errorMsg) {
            emit('ui:error', { message: errorMsg });
            // Auto-clear after 5 seconds
            setTimeout(() => setState('ui.error', null), 5000);
        }
    }

    /**
     * SET UI SUCCESS NOTIFICATION
     */
    function showNotification(message, duration = 3000) {
        setState('ui.notification', { message, type: 'success' });
        emit('ui:notification', { message, type: 'success' });
        
        if (duration) {
            setTimeout(() => setState('ui.notification', null), duration);
        }
    }

    /**
     * SET UI MODAL
     */
    function showModal(modalId, data = null) {
        setState('ui.showModal', { id: modalId, data });
        emit('ui:modal-open', { id: modalId, data });
    }

    function closeModal() {
        setState('ui.showModal', null);
        emit('ui:modal-close', null);
    }

    /**
     * RESET TO INITIAL STATE (for logout)
     */
    function reset() {
        STATE.auth = {
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null
        };
        STATE.ride = {
            active: null,
            history: [],
            currentRequest: null,
            status: 'idle'
        };
        STATE.driver = {
            profile: null,
            isOnline: false,
            activeRides: [],
            earnings: null
        };
        STATE.ui = {
            currentPage: 'home',
            loading: false,
            error: null,
            notification: null,
            showModal: null
        };
        emit('state:reset', null);
    }

    // Public API
    return {
        // State access
        getState,
        setState,
        
        // Events
        on,
        emit,
        
        // Auth methods
        login,
        logout,
        tryAutoLogin,
        updateUserProfile,
        
        // Ride methods
        setActiveRide,
        updateRideStatus,
        addRideToHistory,
        
        // Driver methods
        setDriverProfile,
        setDriverOnlineStatus,
        setDriverActiveRides,
        setDriverEarnings,
        
        // UI methods
        setLoading,
        setError,
        showNotification,
        showModal,
        closeModal,
        
        // Utility
        reset,
        
        // Getters for common operations
        isLoggedIn: () => getState('auth.isAuthenticated'),
        getUser: () => getState('auth.user'),
        getToken: () => getState('auth.accessToken'),
        getActiveRide: () => getState('ride.active'),
        getRideStatus: () => getState('ride.status'),
        getDriverProfile: () => getState('driver.profile'),
        isDriverOnline: () => getState('driver.isOnline')
    };
})();

// Synchronous restore on script load (before page renders)
(function() {
    const token = localStorage.getItem('intelliroute_token');
    const userStr = localStorage.getItem('intelliroute_user');
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            AppState.login(user, token, localStorage.getItem('intelliroute_refresh_token'));
            console.log('✅ Session auto-restored');
        } catch (err) {
            localStorage.removeItem('intelliroute_token');
            localStorage.removeItem('intelliroute_user');
            localStorage.removeItem('intelliroute_refresh_token');
        }
    }
})();

// Also on DOM load for safety
document.addEventListener('DOMContentLoaded', () => {
    if (!AppState.isLoggedIn()) {
        AppState.tryAutoLogin();
    }
});
