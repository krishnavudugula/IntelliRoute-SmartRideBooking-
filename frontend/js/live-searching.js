/**
 * ══════════════════════════════════════════════════════════════════
 *  IntelliRoute — Live Driver Searching Animation
 * ══════════════════════════════════════════════════════════════════
 *
 *  Handles:
 *  - Searching ripple animation on map
 *  - Live driver convergence toward pickup
 *  - ETA countdown updates
 *  - Driver card display with real-time info
 *
 *  Usage:
 *    const searcher = new LiveSearching(mapInstance);
 *    searcher.startSearching(pickupLat, pickupLng);
 *    searcher.stopSearching();
 */

class LiveSearching {
  constructor(mapInstance) {
    this.map = mapInstance;
    this.isSearching = false;
    this.searchingMarker = null;
    this.rippleCircles = [];
    this.convergingDrivers = [];
    this.selectedDriver = null;
    this.etaTimer = null;
    this.searchStartTime = null;
    this.pickupLat = null;
    this.pickupLng = null;
    this.injectCSS();
  }

  injectCSS() {
    if (document.getElementById('ir-live-search-css')) return;
    
    const css = document.createElement('style');
    css.id = 'ir-live-search-css';
    css.textContent = `
      /* Ripple animation for searching */
      @keyframes irSearchRipple {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
          stroke-width: 2;
        }
        70% {
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.8);
          opacity: 0;
          stroke-width: 0.5;
        }
      }

      .ir-search-ripple {
        position: absolute;
        width: 60px;
        height: 60px;
        left: 50%;
        top: 50%;
        pointer-events: none;
      }

      .ir-search-ripple svg circle {
        fill: none;
        stroke: #1E405E;
        animation: irSearchRipple 2s ease-out infinite;
      }

      body.dark-mode .ir-search-ripple svg circle {
        stroke: #58A6FF;
      }

      /* Searching status card */
      .ir-search-status {
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 999;
        max-width: 90%;
        width: 360px;
        animation: slideUp 0.4s ease;
      }

      body.dark-mode .ir-search-status {
        background: #1a1a1a;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .ir-search-status-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ir-search-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #1E405E;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      body.dark-mode .ir-search-spinner {
        border-color: #58A6FF;
        border-top-color: transparent;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .ir-search-text {
        flex: 1;
      }

      .ir-search-text h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        color: #1E405E;
      }

      body.dark-mode .ir-search-text h4 {
        color: #58A6FF;
      }

      .ir-search-text p {
        font-size: 12px;
        margin: 4px 0 0 0;
        color: #666;
        opacity: 0.8;
      }

      body.dark-mode .ir-search-text p {
        color: #aaa;
      }

      /* Driver card */
      .ir-driver-card {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 16px;
        padding: 16px;
        max-width: 90%;
        width: 360px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
        z-index: 998;
        animation: slideUp 0.5s ease;
      }

      body.dark-mode .ir-driver-card {
        background: #1a1a1a;
        color: #fff;
      }

      .ir-driver-header {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }

      .ir-driver-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1E405E, #1F7B6D);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        flex-shrink: 0;
      }

      .ir-driver-info h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: #1E405E;
      }

      body.dark-mode .ir-driver-info h3 {
        color: #fff;
      }

      .ir-driver-info p {
        font-size: 12px;
        margin: 0;
        color: #666;
        display: flex;
        gap: 8px;
      }

      body.dark-mode .ir-driver-info p {
        color: #aaa;
      }

      .ir-driver-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
      }

      .ir-driver-eta {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        margin-bottom: 12px;
      }

      body.dark-mode .ir-driver-eta {
        background: #222;
      }

      .ir-driver-eta h4 {
        font-size: 12px;
        margin: 0 0 4px 0;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .ir-driver-eta-value {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        color: #1E405E;
        font-family: 'DM Mono', monospace;
      }

      body.dark-mode .ir-driver-eta-value {
        color: #58A6FF;
      }

      .ir-driver-vehicle {
        font-size: 12px;
        color: #999;
        margin: 0;
      }

      .ir-driver-actions {
        display: flex;
        gap: 8px;
      }

      .ir-driver-actions button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .ir-call-btn {
        background: #1E405E;
        color: white;
      }

      .ir-call-btn:hover {
        background: #2a5182;
      }

      .ir-chat-btn {
        background: #f0f0f0;
        color: #1E405E;
      }

      .ir-chat-btn:hover {
        background: #e0e0e0;
      }

      body.dark-mode .ir-chat-btn {
        background: #222;
        color: #58A6FF;
      }

      body.dark-mode .ir-chat-btn:hover {
        background: #333;
      }
    `;
    document.head.appendChild(css);
  }

  /**
   * Start searching animation
   */
  startSearching(pickupLat, pickupLng) {
    this.pickupLat = pickupLat;
    this.pickupLng = pickupLng;
    this.isSearching = true;
    this.searchStartTime = Date.now();

    this.createSearchingMarker();
    this.startRippleAnimation();
    this.showSearchingStatus();
    this.convergNearbyDrivers();
    this.simulateDriverMatch();
  }

  /**
   * Create the searching marker with ripple
   */
  createSearchingMarker() {
    if (this.searchingMarker) {
      this.map.removeLayer(this.searchingMarker);
    }

    const html = `
      <div style="
        width: 50px;
        height: 50px;
        background: radial-gradient(circle, #C58A2A 0%, #A67020 100%);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        position: relative;
      ">
        <span style="animation: pulse 2s ease-in-out infinite;">📍</span>
        <div class="ir-search-ripple">
          <svg viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25"></circle>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: html,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    this.searchingMarker = L.marker([this.pickupLat, this.pickupLng], { icon })
      .addTo(this.map);
  }

  /**
   * Start ripple animation
   */
  startRippleAnimation() {
    // Ripples are handled by CSS animation
  }

  /**
   * Show searching status card
   */
  showSearchingStatus() {
    const existing = document.querySelector('.ir-search-status');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'ir-search-status';
    card.innerHTML = `
      <div class="ir-search-status-content">
        <div class="ir-search-spinner"></div>
        <div class="ir-search-text">
          <h4>Finding your ride...</h4>
          <p>Searching 12 nearby drivers</p>
        </div>
      </div>
    `;

    document.body.appendChild(card);
  }

  /**
   * Converge nearby drivers toward pickup
   */
  convergNearbyDrivers() {
    if (!window.liveDrivers) return;

    // Get nearby drivers (simulate)
    const nearbyCount = Math.min(4, window.liveDrivers.length);
    this.convergingDrivers = window.liveDrivers.slice(0, nearbyCount);

    // Add converging class and move toward pickup
    this.convergingDrivers.forEach((driver, i) => {
      setTimeout(() => {
        if (driver.marker) {
          driver.marker._icon?.classList.add('converging');
        }
        // Animate driver movement toward pickup
        this.animateDriverTowardPickup(driver);
      }, i * 300);
    });
  }

  /**
   * Animate a driver toward pickup location
   */
  animateDriverTowardPickup(driver) {
    const startLat = driver.lat;
    const startLng = driver.lng;
    const targetLat = this.pickupLat;
    const targetLng = this.pickupLng;
    
    const distance = this.haversineKm(startLat, startLng, targetLat, targetLng);
    const duration = 4000; // 4 seconds to converge
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth convergence
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      driver.lat = startLat + (targetLat - startLat) * easeProgress;
      driver.lng = startLng + (targetLng - startLng) * easeProgress;

      if (driver.marker) {
        driver.marker.setLatLng([driver.lat, driver.lng]);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Driver arrived
        if (driver.marker) {
          driver.marker._icon?.classList.add('arrived');
        }
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Simulate driver match after searching
   */
  simulateDriverMatch() {
    setTimeout(() => {
      if (!this.isSearching) return;

      // Pick a random driver from converging ones
      if (this.convergingDrivers.length > 0) {
        this.selectedDriver = this.convergingDrivers[
          Math.floor(Math.random() * this.convergingDrivers.length)
        ];

        this.showDriverCard();
        this.removeSearchingStatus();
      }
    }, 2500);
  }

  /**
   * Show driver card with details
   */
  showDriverCard() {
    const existing = document.querySelector('.ir-driver-card');
    if (existing) existing.remove();

    const drivers = [
      { name: 'Rajesh K.', vehicle: 'Honda Bike • TG-1234', rating: 4.8, avatar: '🏍️' },
      { name: 'Priya Singh', vehicle: 'Auto • TG-5678', rating: 4.9, avatar: '🛺' },
      { name: 'Ahmed Hassan', vehicle: 'Toyota Cab • TG-9012', rating: 4.7, avatar: '🚗' },
    ];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];

    let eta = 4;
    const card = document.createElement('div');
    card.className = 'ir-driver-card';
    card.innerHTML = `
      <div class="ir-driver-eta">
        <h4>Arriving in</h4>
        <p class="ir-driver-eta-value">${eta}:00</p>
      </div>
      <div class="ir-driver-header">
        <div class="ir-driver-avatar">${driver.avatar}</div>
        <div class="ir-driver-info">
          <h3>${driver.name}</h3>
          <p>
            <span class="ir-driver-rating">⭐ ${driver.rating}</span>
            <span>•</span>
            <span class="ir-driver-vehicle">${driver.vehicle}</span>
          </p>
        </div>
      </div>
      <div class="ir-driver-actions">
        <button class="ir-call-btn">📞 Call</button>
        <button class="ir-chat-btn">💬 Chat</button>
      </div>
    `;

    document.body.appendChild(card);

    // Countdown ETA
    this.startEtaCountdown(card, eta);
  }

  /**
   * Start ETA countdown
   */
  startEtaCountdown(card, initialEta) {
    let remaining = initialEta * 60;
    const etaDisplay = card.querySelector('.ir-driver-eta-value');

    this.etaTimer = setInterval(() => {
      remaining--;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      etaDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (remaining <= 0) {
        clearInterval(this.etaTimer);
      }
    }, 1000);
  }

  /**
   * Remove searching status card
   */
  removeSearchingStatus() {
    const card = document.querySelector('.ir-search-status');
    if (card) {
      card.style.animation = 'slideDown 0.3s ease forwards';
      setTimeout(() => card.remove(), 300);
    }
  }

  /**
   * Stop searching
   */
  stopSearching() {
    this.isSearching = false;

    if (this.searchingMarker) {
      this.map.removeLayer(this.searchingMarker);
      this.searchingMarker = null;
    }

    if (this.etaTimer) {
      clearInterval(this.etaTimer);
    }

    document.querySelector('.ir-search-status')?.remove();
  }

  /**
   * Haversine distance
   */
  haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

// Global instance
let globalLiveSearching = null;

function startLiveSearching(map, lat, lng) {
  if (!globalLiveSearching) {
    globalLiveSearching = new LiveSearching(map);
  }
  globalLiveSearching.startSearching(lat, lng);
}

function stopLiveSearching() {
  if (globalLiveSearching) {
    globalLiveSearching.stopSearching();
  }
}
