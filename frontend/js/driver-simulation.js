/**
 * ══════════════════════════════════════════════════════════════════
 *  IntelliRoute — Driver Simulation Module
 * ══════════════════════════════════════════════════════════════════
 *
 *  A rich, realistic driver-presence simulation for Leaflet maps.
 *  Replaces the basic 4-dot animation with 8-12 animated vehicles
 *  that follow road-like paths, respond to pickup requests, and
 *  look premium on both light and dark Carto tiles.
 *
 *  Usage (global):
 *    initDriverSimulation(mapInstance, 17.4435, 78.3772);
 *    searchForPickup(17.4400, 78.3800);
 *    stopSimulation();
 *
 *  Usage (class):
 *    const sim = new DriverSimulation(mapInstance, 17.4435, 78.3772);
 *    sim.searchForPickup(17.4400, 78.3800);
 *    sim.stop();
 *
 *  @module driver-simulation
 *  @author IntelliRoute Team
 */

/* ──────────────────────────────────────────────
   CSS injected into the page for marker styling
   ────────────────────────────────────────────── */
(function injectDriverCSS() {
  if (document.getElementById('ir-driver-sim-css')) return;

  const css = document.createElement('style');
  css.id = 'ir-driver-sim-css';
  css.textContent = `
    /* ── Driver marker wrapper ────────────────── */
    .ir-driver-marker {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.8s cubic-bezier(.25,.46,.45,.94),
                  opacity 0.4s ease;
      will-change: transform;
    }

    /* ── Coloured circle behind the emoji ─────── */
    .ir-driver-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28),
                  0 0 0 1px rgba(0, 0, 0, 0.06);
      position: relative;
      z-index: 2;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .ir-driver-marker:hover .ir-driver-circle {
      transform: scale(1.18);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35),
                  0 0 0 2px rgba(255, 255, 255, 0.5);
    }

    /* ── Pulsing 'available' ring ─────────────── */
    .ir-driver-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      pointer-events: none;
    }

    .ir-driver-pulse::before,
    .ir-driver-pulse::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      opacity: 0;
      animation: irDriverPulse 2.8s cubic-bezier(.4, 0, .2, 1) infinite;
    }

    .ir-driver-pulse::after {
      animation-delay: 1.4s;
    }

    @keyframes irDriverPulse {
      0%   { transform: scale(0.8); opacity: 0.6; }
      70%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* ── Arrived state ────────────────────────── */
    .ir-driver-marker.arrived .ir-driver-circle {
      animation: irDriverBounce 0.5s ease;
      box-shadow: 0 0 16px rgba(31, 123, 109, 0.5),
                  0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .ir-driver-marker.arrived .ir-driver-pulse::before,
    .ir-driver-marker.arrived .ir-driver-pulse::after {
      border-color: #1F7B6D;
      animation-duration: 1.6s;
    }

    @keyframes irDriverBounce {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      70%  { transform: scale(0.92); }
      100% { transform: scale(1); }
    }

    /* ── Searching convergence glow ───────────── */
    .ir-driver-marker.converging .ir-driver-circle {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28),
                  0 0 12px rgba(197, 138, 42, 0.4);
    }

    /* ── Dark mode adjustments ────────────────── */
    body.dark-mode .ir-driver-circle {
      border-color: rgba(255, 255, 255, 0.75);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.55),
                  0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    body.dark-mode .ir-driver-marker:hover .ir-driver-circle {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6),
                  0 0 0 2px rgba(255, 255, 255, 0.25);
    }
  `;
  document.head.appendChild(css);
})();


/* ══════════════════════════════════════════════
   VEHICLE TYPE CONFIGURATION
   ══════════════════════════════════════════════ */

/**
 * @typedef {Object} VehicleConfig
 * @property {string} type       - Vehicle type identifier
 * @property {string} emoji      - Display emoji
 * @property {string} color      - Background hex color (light mode)
 * @property {string} colorDark  - Background hex color (dark mode)
 * @property {string} pulseColor - Pulse ring CSS color
 * @property {number} speedMin   - Minimum speed factor (degrees/frame)
 * @property {number} speedMax   - Maximum speed factor
 * @property {number} size       - Circle diameter in px
 */

/** @type {VehicleConfig[]} */
const VEHICLE_TYPES = [
  {
    type: 'bike',
    emoji: '🏍️',
    color: '#1E405E',       // --c-navy
    colorDark: '#3B6A96',
    pulseColor: 'rgba(30, 64, 94, 0.5)',
    speedMin: 0.000035,
    speedMax: 0.000065,
    size: 16,
  },
  {
    type: 'auto',
    emoji: '🛺',
    color: '#C58A2A',       // --c-gold
    colorDark: '#D4A04A',
    pulseColor: 'rgba(197, 138, 42, 0.5)',
    speedMin: 0.000025,
    speedMax: 0.000050,
    size: 17,
  },
  {
    type: 'cab',
    emoji: '🚗',
    color: '#1F7B6D',       // --c-teal
    colorDark: '#2FA08E',
    pulseColor: 'rgba(31, 123, 109, 0.5)',
    speedMin: 0.000018,
    speedMax: 0.000040,
    size: 18,
  },
];


/* ══════════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════════ */

/**
 * Returns a random float in [min, max).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Haversine distance between two lat/lng points (in km).
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
function haversineKm(lat1, lng1, lat2, lng2) {
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

/**
 * Checks if dark mode is currently active.
 * @returns {boolean}
 */
function isDarkMode() {
  return document.body.classList.contains('dark-mode');
}

/**
 * Pick a random cardinal/intercardinal direction (in radians).
 * This simulates drivers following rough road grids rather
 * than moving in arbitrary angles.
 *
 * 8 directions: N, NE, E, SE, S, SW, W, NW — with a small
 * random jitter (±15°) for organic feel.
 * @returns {number} angle in radians
 */
function randomRoadAngle() {
  const cardinals = [0, 45, 90, 135, 180, 225, 270, 315];
  const base = cardinals[Math.floor(Math.random() * cardinals.length)];
  const jitter = randRange(-15, 15);
  return (base + jitter) * Math.PI / 180;
}


/* ══════════════════════════════════════════════
   DRIVER ENTITY
   ══════════════════════════════════════════════ */

/**
 * Represents a single driver on the map.
 */
class Driver {
  /**
   * @param {VehicleConfig} config
   * @param {number} lat
   * @param {number} lng
   * @param {L.Map} map
   * @param {string} id
   */
  constructor(config, lat, lng, map, id) {
    /** @type {string} */
    this.id = id;

    /** @type {VehicleConfig} */
    this.config = config;

    /** @type {number} Current latitude */
    this.lat = lat;

    /** @type {number} Current longitude */
    this.lng = lng;

    /** @type {L.Map} */
    this.map = map;

    /** @type {number} Current movement angle (radians) */
    this.angle = randomRoadAngle();

    /** @type {number} Current speed (degrees/frame at 60fps) */
    this.speed = randRange(config.speedMin, config.speedMax);

    /** @type {number} Timestamp of last direction change */
    this.lastTurnTime = performance.now();

    /** @type {number} Interval (ms) until next direction change */
    this.turnInterval = randRange(3000, 8000);

    /** @type {'roaming'|'converging'|'arrived'} */
    this.state = 'roaming';

    /** @type {L.Marker|null} */
    this.marker = null;

    this._createMarker();
  }

  /**
   * Builds the Leaflet divIcon marker with styled HTML.
   * @private
   */
  _createMarker() {
    const dark = isDarkMode();
    const bg = dark ? this.config.colorDark : this.config.color;
    const size = this.config.size;

    const html = `
      <div class="ir-driver-marker" data-driver-id="${this.id}">
        <div class="ir-driver-pulse" style="color: ${this.config.pulseColor};"></div>
        <div class="ir-driver-circle" style="
          background: ${bg};
          width: ${size}px;
          height: ${size}px;
          font-size: ${Math.round(size * 0.56)}px;
        ">${this.config.emoji}</div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'ir-driver-icon', // avoids Leaflet default blue pin
      html: html,
      iconSize: [size + 12, size + 12],
      iconAnchor: [(size + 12) / 2, (size + 12) / 2],
    });

    this.marker = L.marker([this.lat, this.lng], {
      icon: icon,
      interactive: false,   // don't block map clicks
      keyboard: false,
      zIndexOffset: 100,
    }).addTo(this.map);
  }

  /**
   * Smoothly update marker position via Leaflet's setLatLng.
   * The CSS transition on .ir-driver-marker handles interpolation.
   * @private
   */
  _updateMarkerPosition() {
    if (this.marker) {
      this.marker.setLatLng([this.lat, this.lng]);
    }
  }

  /**
   * Update marker class list for state changes.
   * @private
   */
  _updateMarkerState() {
    if (!this.marker) return;
    const el = this.marker.getElement();
    if (!el) return;
    const wrapper = el.querySelector('.ir-driver-marker');
    if (!wrapper) return;

    wrapper.classList.toggle('converging', this.state === 'converging');
    wrapper.classList.toggle('arrived', this.state === 'arrived');
  }

  /**
   * Core update tick — called every animation frame.
   * @param {number} now         - Current timestamp from rAF
   * @param {number} delta       - Time since last frame (ms)
   * @param {number} centerLat   - Simulation center latitude
   * @param {number} centerLng   - Simulation center longitude
   * @param {number} radiusDeg   - Bounding radius in degrees
   * @param {{lat: number, lng: number}|null} pickupTarget
   */
  update(now, delta, centerLat, centerLng, radiusDeg, pickupTarget) {
    if (this.state === 'arrived') return; // Stop moving once arrived

    // — Normalise delta to ~16ms baseline (60fps) ——————————————
    const dt = Math.min(delta, 50) / 16.667;

    // ── CONVERGING toward pickup ──────────────────────────────
    if (this.state === 'converging' && pickupTarget) {
      const dlat = pickupTarget.lat - this.lat;
      const dlng = pickupTarget.lng - this.lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);

      // Arrival threshold — close enough to "arrive"
      if (dist < 0.00015) {
        this.state = 'arrived';
        this.lat = pickupTarget.lat + randRange(-0.00008, 0.00008);
        this.lng = pickupTarget.lng + randRange(-0.00008, 0.00008);
        this._updateMarkerPosition();
        this._updateMarkerState();
        return;
      }

      // Move toward pickup at variable speed (accelerate when far)
      const convergeSpeed = this.speed * 1.6 * Math.min(dist / 0.002, 2.5);
      this.angle = Math.atan2(dlng, dlat);

      // Add slight random wobble for realism (±8°)
      this.angle += randRange(-0.14, 0.14);

      this.lat += Math.cos(this.angle) * convergeSpeed * dt;
      this.lng += Math.sin(this.angle) * convergeSpeed * dt;

      this._updateMarkerPosition();
      return;
    }

    // ── ROAMING behaviour ─────────────────────────────────────

    // Check if it's time to change direction
    if (now - this.lastTurnTime > this.turnInterval) {
      this.angle = randomRoadAngle();
      this.speed = randRange(this.config.speedMin, this.config.speedMax);
      this.turnInterval = randRange(3000, 8000);
      this.lastTurnTime = now;
    }

    // Advance position
    this.lat += Math.cos(this.angle) * this.speed * dt;
    this.lng += Math.sin(this.angle) * this.speed * dt;

    // ── Boundary enforcement — soft bounce back toward center ──
    const dFromCenter = Math.sqrt(
      (this.lat - centerLat) ** 2 +
      (this.lng - centerLng) ** 2
    );

    if (dFromCenter > radiusDeg * 0.85) {
      // Steer back toward center with a smooth curve
      const toCenter = Math.atan2(
        centerLng - this.lng,
        centerLat - this.lat
      );
      // Blend current angle toward center (weighted average)
      this.angle = this.angle * 0.3 + toCenter * 0.7;
      this.lastTurnTime = now; // Reset turn timer
    }

    this._updateMarkerPosition();
  }

  /**
   * Remove the marker from the map and clean up.
   */
  destroy() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }
}


/* ══════════════════════════════════════════════
   DRIVER SIMULATION CLASS
   ══════════════════════════════════════════════ */

/**
 * @typedef {Object} SimulationOptions
 * @property {number}  [driverCount=10]   - Number of drivers (8-12 recommended)
 * @property {number}  [radiusKm=1.5]     - Roaming radius in km
 * @property {number}  [pickupDelayMs=0]  - Delay before drivers begin converging
 * @property {boolean} [autoStart=true]   - Start animation immediately
 */

class DriverSimulation {
  /**
   * @param {L.Map} mapInstance   - Leaflet map instance
   * @param {number} centerLat   - Center latitude for simulation
   * @param {number} centerLng   - Center longitude for simulation
   * @param {SimulationOptions} [options={}]
   */
  constructor(mapInstance, centerLat, centerLng, options = {}) {
    if (!mapInstance) {
      console.warn('[DriverSimulation] No map instance provided.');
      return;
    }

    /** @type {L.Map} */
    this.map = mapInstance;

    /** @type {number} */
    this.centerLat = centerLat;

    /** @type {number} */
    this.centerLng = centerLng;

    /** @type {number} Number of drivers to spawn */
    this.driverCount = Math.max(4, Math.min(options.driverCount || 10, 16));

    /** @type {number} Roaming radius in degrees (~0.009 per km at this latitude) */
    this.radiusDeg = ((options.radiusKm || 1.5) / 111);

    /** @type {number} Delay before pickup convergence begins */
    this.pickupDelayMs = options.pickupDelayMs || 0;

    /** @type {Driver[]} Active drivers */
    this.drivers = [];

    /** @type {{lat: number, lng: number}|null} */
    this.pickupTarget = null;

    /** @type {number|null} */
    this.animFrameId = null;

    /** @type {number} Last frame timestamp */
    this._lastFrameTime = 0;

    /** @type {boolean} */
    this._running = false;

    /** @type {string|null} ID of the driver chosen to arrive */
    this._arrivedDriverId = null;

    // Spawn drivers
    this._spawnDrivers();

    // Auto-start
    if (options.autoStart !== false) {
      this.start();
    }
  }

  /**
   * Spawn driver entities at random positions within the radius.
   * Distributes vehicle types roughly evenly.
   * @private
   */
  _spawnDrivers() {
    // Weighted distribution: ~40% bikes, ~30% autos, ~30% cabs (Indian city feel)
    const distribution = [];
    const bikeCount = Math.round(this.driverCount * 0.4);
    const autoCount = Math.round(this.driverCount * 0.3);
    const cabCount  = this.driverCount - bikeCount - autoCount;

    for (let i = 0; i < bikeCount; i++) distribution.push(VEHICLE_TYPES[0]);
    for (let i = 0; i < autoCount; i++) distribution.push(VEHICLE_TYPES[1]);
    for (let i = 0; i < cabCount; i++)  distribution.push(VEHICLE_TYPES[2]);

    // Shuffle for variety
    for (let i = distribution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [distribution[i], distribution[j]] = [distribution[j], distribution[i]];
    }

    distribution.forEach((config, idx) => {
      // Place drivers at random positions within radius
      const angle = Math.random() * 2 * Math.PI;
      const dist = Math.random() * this.radiusDeg * 0.8; // Don't spawn at boundary

      const lat = this.centerLat + Math.cos(angle) * dist;
      const lng = this.centerLng + Math.sin(angle) * dist;

      const driver = new Driver(
        config,
        lat,
        lng,
        this.map,
        `ir-driver-${idx}-${Date.now()}`
      );

      this.drivers.push(driver);
    });
  }

  /**
   * Start the animation loop.
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._lastFrameTime = performance.now();
    this._tick = this._tick.bind(this);
    this.animFrameId = requestAnimationFrame(this._tick);
  }

  /**
   * The main animation tick — called via requestAnimationFrame.
   * @param {number} now - DOMHighResTimeStamp
   * @private
   */
  _tick(now) {
    if (!this._running) return;

    const delta = now - this._lastFrameTime;
    this._lastFrameTime = now;

    // Update each driver
    for (const driver of this.drivers) {
      driver.update(
        now,
        delta,
        this.centerLat,
        this.centerLng,
        this.radiusDeg,
        this.pickupTarget
      );
    }

    this.animFrameId = requestAnimationFrame(this._tick);
  }

  /**
   * Trigger nearby drivers to converge toward a pickup point.
   * One random nearby driver is chosen to 'arrive' first;
   * 2-3 others begin moving toward the area for realism.
   *
   * @param {number} lat - Pickup latitude
   * @param {number} lng - Pickup longitude
   */
  searchForPickup(lat, lng) {
    this.pickupTarget = { lat, lng };

    // Sort drivers by distance to pickup
    const sorted = [...this.drivers]
      .filter(d => d.state !== 'arrived')
      .map(d => ({
        driver: d,
        dist: haversineKm(d.lat, d.lng, lat, lng),
      }))
      .sort((a, b) => a.dist - b.dist);

    if (sorted.length === 0) return;

    // Pick the closest driver to arrive
    const arrivedDriver = sorted[0].driver;
    this._arrivedDriverId = arrivedDriver.id;

    // Converge the closest 3-4 drivers
    const convergeCount = Math.min(sorted.length, Math.floor(randRange(3, 5)));

    sorted.forEach((item, idx) => {
      if (idx < convergeCount) {
        // Stagger start with slight delays for natural feel
        const delay = this.pickupDelayMs + idx * randRange(400, 900);
        setTimeout(() => {
          if (item.driver.state !== 'arrived') {
            item.driver.state = 'converging';
            item.driver._updateMarkerState();
          }
        }, delay);
      }
    });
  }

  /**
   * Stop the simulation and remove all markers.
   */
  stop() {
    this._running = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Clean up all driver markers
    for (const driver of this.drivers) {
      driver.destroy();
    }
    this.drivers = [];
    this.pickupTarget = null;
    this._arrivedDriverId = null;
  }

  /**
   * Returns the total number of active drivers.
   * @returns {number}
   */
  getDriverCount() {
    return this.drivers.length;
  }

  /**
   * Returns drivers within a given radius (km) of a point.
   *
   * @param {number} lat
   * @param {number} lng
   * @param {number} radiusKm
   * @returns {Array<{id: string, type: string, lat: number, lng: number, distKm: number, state: string}>}
   */
  getNearbyDrivers(lat, lng, radiusKm) {
    return this.drivers
      .map(d => ({
        id: d.id,
        type: d.config.type,
        lat: d.lat,
        lng: d.lng,
        distKm: haversineKm(d.lat, d.lng, lat, lng),
        state: d.state,
      }))
      .filter(d => d.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);
  }

  /**
   * Update the center point of the simulation.
   * Useful when the map view changes.
   *
   * @param {number} lat
   * @param {number} lng
   */
  setCenter(lat, lng) {
    this.centerLat = lat;
    this.centerLng = lng;
  }

  /**
   * Reset all drivers to roaming state and clear pickup target.
   */
  resetPickup() {
    this.pickupTarget = null;
    this._arrivedDriverId = null;

    for (const driver of this.drivers) {
      driver.state = 'roaming';
      driver.angle = randomRoadAngle();
      driver._updateMarkerState();
    }
  }

  /**
   * Returns information about the driver that has arrived,
   * or null if no driver has arrived yet.
   *
   * @returns {{id: string, type: string, lat: number, lng: number}|null}
   */
  getArrivedDriver() {
    const d = this.drivers.find(d => d.state === 'arrived');
    if (!d) return null;
    return {
      id: d.id,
      type: d.config.type,
      lat: d.lat,
      lng: d.lng,
    };
  }
}


/* ══════════════════════════════════════════════
   GLOBAL API  —  for drop-in usage from HTML
   ══════════════════════════════════════════════ */

/** @type {DriverSimulation|null} Singleton instance */
let _activeSimulation = null;

/**
 * Initialise the driver simulation on a Leaflet map.
 * Automatically cleans up any existing simulation first.
 *
 * @param {L.Map} mapInstance   - Leaflet map object
 * @param {number} centerLat   - Centre latitude
 * @param {number} centerLng   - Centre longitude
 * @param {SimulationOptions} [options]
 * @returns {DriverSimulation}
 */
function initDriverSimulation(mapInstance, centerLat, centerLng, options) {
  // Tear down any existing simulation
  if (_activeSimulation) {
    _activeSimulation.stop();
    _activeSimulation = null;
  }

  _activeSimulation = new DriverSimulation(
    mapInstance,
    centerLat,
    centerLng,
    options
  );

  return _activeSimulation;
}

/**
 * Tell nearby drivers to converge on a pickup point.
 *
 * @param {number} lat - Pickup latitude
 * @param {number} lng - Pickup longitude
 */
function searchForPickup(lat, lng) {
  if (!_activeSimulation) {
    console.warn('[DriverSimulation] No active simulation. Call initDriverSimulation() first.');
    return;
  }
  _activeSimulation.searchForPickup(lat, lng);
}

/**
 * Stop and clean up the active simulation.
 */
function stopSimulation() {
  if (_activeSimulation) {
    _activeSimulation.stop();
    _activeSimulation = null;
  }
}

/**
 * Get the number of active drivers in the simulation.
 * @returns {number}
 */
function getDriverCount() {
  return _activeSimulation ? _activeSimulation.getDriverCount() : 0;
}

/**
 * Get drivers within a radius (km) of a given point.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Array<{id: string, type: string, lat: number, lng: number, distKm: number, state: string}>}
 */
function getNearbyDrivers(lat, lng, radiusKm) {
  if (!_activeSimulation) return [];
  return _activeSimulation.getNearbyDrivers(lat, lng, radiusKm);
}


/* ══════════════════════════════════════════════
   EXPOSE ON WINDOW FOR GLOBAL ACCESS
   ══════════════════════════════════════════════ */

// Global functions (backwards-compatible with script tag usage)
window.initDriverSimulation = initDriverSimulation;
window.searchForPickup       = searchForPickup;
window.stopSimulation        = stopSimulation;
window.getDriverCount        = getDriverCount;
window.getNearbyDrivers      = getNearbyDrivers;

// Also expose the class for advanced usage
window.DriverSimulation = DriverSimulation;
