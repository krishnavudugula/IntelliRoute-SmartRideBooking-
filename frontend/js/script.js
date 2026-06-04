/**
 * IntelliRoute — Core Script
 * Handles: navigation, maps, dark mode, scroll reveals, live driver simulation
 */

const maps = {};

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */

/** File-based page navigation */
function showPage(name, btn) {
  const pageToFile = {
    home: '/index.html',
    book: '/pages/book-v2.html',
    map: '/pages/map.html',
    safety: '/pages/safety.html',
    driver: '/pages/driver-signup.html',
    about: '/pages/about.html',
    history: '/pages/history.html'
  };
  if (pageToFile[name]) {
    document.body.classList.add('page-exit');
    setTimeout(() => {
      window.location.href = pageToFile[name];
    }, 250);
  }
}

/** Highlight active nav button based on data-page attribute */
function setActiveNav() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;
  
  const map = { home: 0, book: 1, map: 2, safety: 3, driver: 4, about: 5, history: 6 };
  const buttons = document.querySelectorAll('.nav-links button');
  buttons.forEach(b => b.classList.remove('active'));
  if (map[currentPage] !== undefined && buttons[map[currentPage]]) {
    buttons[map[currentPage]].classList.add('active');
  }

  // Also set bottom nav active
  const bnMap = { home: 0, book: 1, map: 2, safety: 3 };
  const bnItems = document.querySelectorAll('.bn-item');
  bnItems.forEach(b => b.classList.remove('active'));
  if (bnMap[currentPage] !== undefined && bnItems[bnMap[currentPage]]) {
    bnItems[bnMap[currentPage]].classList.add('active');
  }
}

/* ══════════════════════════════════════
   INTERACTIVE HELPERS
══════════════════════════════════════ */

/** Ride tab selection */
function selTab(el) {
  el.closest('.ride-tabs-v3').querySelectorAll('.rt-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

/** Route pill selection */
function selPill(el) {
  el.closest('.rp-row').querySelectorAll('.rp-pill').forEach(p => p.classList.remove('sel'));
  el.classList.add('sel');
}

/** Ride big card selection */
function selRBC(el) {
  el.closest('.ride-big-grid').querySelectorAll('.rbc').forEach(r => r.classList.remove('sel'));
  el.classList.add('sel');
}

/** Route card item selection */
function selRCI(el) {
  el.closest('.route-cards').querySelectorAll('.route-card-item').forEach(r => {
    r.classList.remove('sel');
    r.querySelector('.rci-sel-btn').textContent = 'Select';
  });
  el.classList.add('sel');
  el.querySelector('.rci-sel-btn').textContent = 'Selected';
}

/** Why feature accordion */
function activateWF(el) {
  el.closest('.why-features').querySelectorAll('.wf-item').forEach(w => w.classList.remove('on'));
  el.classList.add('on');
}

/** Layer toggle */
function toggleLayer(el) {
  el.classList.toggle('on');
}

/* ══════════════════════════════════════
   MAP SYSTEM — Premium Configuration
══════════════════════════════════════ */

/** Get the appropriate tile URL based on dark mode */
function getMapTileUrl() {
  const isDark = document.body.classList.contains('dark-mode');
  // Use OpenStreetMap Mapnik (always reliable) or dark variant
  return isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

/** Create a pulsing pickup marker */
function createPickupIcon() {
  return L.divIcon({
    className: 'ir-marker-pickup',
    html: `<div class="ir-pin ir-pin-pickup">
      <div class="ir-pin-pulse"></div>
      <div class="ir-pin-dot"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

/** Create a drop/destination marker */
function createDropIcon() {
  return L.divIcon({
    className: 'ir-marker-drop',
    html: `<div class="ir-pin ir-pin-drop">
      <div class="ir-pin-flag">📍</div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
}

/** Resize visible maps (call after layout changes) */
function resizeVisibleMaps() {
  Object.keys(maps).forEach(key => {
    const map = maps[key];
    if (!map) return;
    const container = map.getContainer();
    if (container && container.offsetParent !== null) {
      map.invalidateSize();
    }
  });
}

/**
 * Create a styled route map with premium Carto tiles
 * @param {string} targetId - DOM element ID
 * @param {Array} points - Array of [lat, lng] pairs
 * @returns {L.Map|null}
 */
function makeRouteMap(targetId, points) {
  if (!window.L) return null;

  const node = document.getElementById(targetId);
  if (!node) return null;

  const map = L.map(targetId, { 
    zoomControl: targetId !== 'map-why',
    attributionControl: false
  });

  L.tileLayer(getMapTileUrl(), {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Styled route polyline
  const isDark = document.body.classList.contains('dark-mode');
  const routeColor = isDark ? '#58A6FF' : '#1E405E';

  const routeLine = L.polyline(points, {
    color: routeColor,
    weight: 5,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // Custom markers
  L.marker(points[0], { icon: createPickupIcon() })
    .addTo(map)
    .bindPopup('Pickup: Hitech City');
  L.marker(points[points.length - 1], { icon: createDropIcon() })
    .addTo(map)
    .bindPopup('Drop: Banjara Hills');

  map.fitBounds(routeLine.getBounds(), { padding: [28, 28] });

  return map;
}

/** Initialize all maps on the current page */
function initMaps() {
  const routePrimary = [
    [17.4435, 78.3772],
    [17.4328, 78.4011],
    [17.4239, 78.4327]
  ];
  const routeExtended = [
    [17.4435, 78.3772],
    [17.4388, 78.3894],
    [17.4328, 78.4011],
    [17.4264, 78.4175],
    [17.4239, 78.4327]
  ];

  maps.why = makeRouteMap('map-why', routePrimary);
  maps.book = makeRouteMap('map-book', routePrimary);
  maps.main = makeRouteMap('map-main', routeExtended);
  resizeVisibleMaps();
}

/* ══════════════════════════════════════
   SCROLL REVEAL ANIMATIONS
══════════════════════════════════════ */

function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 65);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach(el => {
    el.classList.remove('visible');
    obs.observe(el);
  });
}

/* ══════════════════════════════════════
   STAT NUMBER ANIMATIONS
══════════════════════════════════════ */

function animateNumbers() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const txt = el.innerHTML;
    el.style.opacity = '0';
    setTimeout(() => { 
      el.style.opacity = '1'; 
      el.style.transition = 'opacity .5s'; 
    }, 200);
  });
}

/* ══════════════════════════════════════
   FARE UPDATE LISTENER
══════════════════════════════════════ */

document.addEventListener('input', e => {
  if (e.target.classList.contains('lf-input') || e.target.classList.contains('form-input')) {
    const fareEls = document.querySelectorAll('.fr-amount');
    const min = 60 + Math.floor(Math.random() * 50);
    fareEls.forEach(el => { el.innerHTML = `₹${min} <span>– ₹${min + 20}</span>`; });
  }
});

/* ══════════════════════════════════════
   LOGO CLICK
══════════════════════════════════════ */

const logo = document.querySelector('.nav-logo');
if (logo) {
  logo.addEventListener('click', () => showPage('home'));
}

/* ══════════════════════════════════════
   LIVE DRIVER SIMULATION (Legacy)
   Note: Enhanced version in driver-simulation.js
══════════════════════════════════════ */

let liveDrivers = [];

function simulateLiveDrivers(mapInstance, centerLat, centerLng) {
  if (!mapInstance) return;

  // Clear old drivers
  liveDrivers.forEach(d => d.marker.remove());
  liveDrivers = [];

  const vehicleTypes = [
    { emoji: '🏍️', bg: '#1E405E', label: 'Bike' },
    { emoji: '🛺', bg: '#C58A2A', label: 'Auto' },
    { emoji: '🚗', bg: '#1F7B6D', label: 'Cab' }
  ];

  const numDrivers = 8;
  for (let i = 0; i < numDrivers; i++) {
    const type = vehicleTypes[i % vehicleTypes.length];
    const dLat = centerLat + (Math.random() - 0.5) * 0.015;
    const dLng = centerLng + (Math.random() - 0.5) * 0.015;

    const icon = L.divIcon({
      className: 'ir-driver-marker',
      html: `<div style="
        background:${type.bg};
        width:32px;height:32px;border-radius:50%;
        border:2.5px solid rgba(255,255,255,0.9);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:grid;place-items:center;
        font-size:14px;
        transition:transform 0.8s ease;
      ">${type.emoji}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const driverMarker = L.marker([dLat, dLng], { icon }).addTo(mapInstance);

    liveDrivers.push({
      marker: driverMarker,
      lat: dLat,
      lng: dLng,
      speedLat: (Math.random() - 0.5) * 0.0003,
      speedLng: (Math.random() - 0.5) * 0.0003,
      type: type
    });
  }

  // Smooth animation loop
  setInterval(() => {
    liveDrivers.forEach(d => {
      d.lat += d.speedLat;
      d.lng += d.speedLng;

      // Keep within bounds of center
      const distFromCenter = Math.sqrt(
        Math.pow(d.lat - centerLat, 2) + Math.pow(d.lng - centerLng, 2)
      );
      if (distFromCenter > 0.008) {
        d.speedLat = (centerLat - d.lat) * 0.02;
        d.speedLng = (centerLng - d.lng) * 0.02;
      }

      // Random direction changes
      if (Math.random() < 0.04) {
        d.speedLat = (Math.random() - 0.5) * 0.0003;
        d.speedLng = (Math.random() - 0.5) * 0.0003;
      }

      d.marker.setLatLng([d.lat, d.lng]);
    });
  }, 800);
}

/* Dark mode toggle removed — app uses light theme by default */

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */

initReveal();
initMaps();
setActiveNav();
