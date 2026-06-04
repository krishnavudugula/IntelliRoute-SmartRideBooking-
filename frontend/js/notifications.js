/**
 * ══════════════════════════════════════════════════════════
 *  IntelliRoute — Smart Notification Stack System
 * ══════════════════════════════════════════════════════════
 *
 *  A premium, animated notification stack for the IntelliRoute
 *  ride-booking platform. Replaces basic single-notification
 *  alerts with a modern, stacked, swipe-dismissable system.
 *
 *  Features:
 *   • 5 notification types: info, success, warning, alert, ai
 *   • Smooth slide-in / slide-out animations
 *   • Auto-dismiss with shrinking progress bar
 *   • Stack max 4 visible (oldest auto-dismissed)
 *   • Touch swipe-right to dismiss on mobile
 *   • Dark mode support (body.dark-mode)
 *   • Responsive — full-width on mobile (< 768px)
 *   • Self-contained CSS injection (no external stylesheet)
 *
 *  Usage:
 *   showNotification('Hello!', { type: 'success', description: '...' });
 *   showSuccessNotification('Done', 'Your ride was booked.');
 *   notifyDriverArriving('Suresh', 3);
 *
 *  @author  IntelliRoute Frontend
 *  @version 2.0.0
 */

/* ══════════════════════════════════════
   CSS INJECTION
   ══════════════════════════════════════ */

(function injectNotificationStyles() {
  if (document.getElementById('intelliroute-notification-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'intelliroute-notification-styles';
  styleEl.textContent = `
/* ── Notification Container ────────── */
.ir-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
  max-height: calc(100vh - 40px);
  overflow: visible;
}

/* ── Notification Card ─────────────── */
.ir-notification {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 380px;
  max-width: 100%;
  padding: 16px 18px;
  border-radius: var(--r, 16px);
  border: 1.5px solid rgba(14, 13, 12, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(14, 13, 12, 0.10),
    0 2px 8px rgba(14, 13, 12, 0.06);
  pointer-events: auto;
  cursor: default;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;

  /* Entrance animation */
  animation: irNotifSlideIn 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform: translateX(110%);
  opacity: 0;
  will-change: transform, opacity;
  transition: box-shadow 0.2s ease;
}

.ir-notification:hover {
  box-shadow:
    0 12px 40px rgba(14, 13, 12, 0.14),
    0 4px 12px rgba(14, 13, 12, 0.08);
}

/* ── Slide-in Keyframes ────────────── */
@keyframes irNotifSlideIn {
  from {
    transform: translateX(110%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ── Exit animation class ──────────── */
.ir-notification.ir-notif-exit {
  animation: irNotifSlideOut 0.32s cubic-bezier(0.55, 0, 1, 0.45) forwards;
}

@keyframes irNotifSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}

/* ── Icon ──────────────────────────── */
.ir-notif-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm, 10px);
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1;
}

/* ── Content ───────────────────────── */
.ir-notif-content {
  flex: 1;
  min-width: 0;
  padding-right: 20px;
}

.ir-notif-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--c-ink, #0E0D0C);
  line-height: 1.3;
  margin: 0 0 2px;
  letter-spacing: -0.2px;
}

.ir-notif-desc {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--c-ink3, #7C7871);
  line-height: 1.55;
  margin: 0;
}

/* ── Close Button ──────────────────── */
.ir-notif-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(14, 13, 12, 0.06);
  border-radius: 6px;
  color: var(--c-ink4, #B8B3AB);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
  line-height: 1;
  padding: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.ir-notif-close:hover {
  background: rgba(14, 13, 12, 0.12);
  color: var(--c-ink, #0E0D0C);
  transform: scale(1.08);
}

/* ── Progress Bar ──────────────────── */
.ir-notif-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(14, 13, 12, 0.05);
  overflow: hidden;
}

.ir-notif-progress-bar {
  height: 100%;
  width: 100%;
  border-radius: 0 3px 3px 0;
  transform-origin: left;
  transition: none;
}

/* ══════════════════════════════════════
   TYPE VARIANTS
   ══════════════════════════════════════ */

/* ── Info (Navy) ───────────────────── */
.ir-notification[data-type="info"] .ir-notif-icon {
  background: rgba(15, 39, 68, 0.10);
  color: var(--c-navy, #0F2744);
}
.ir-notification[data-type="info"] .ir-notif-progress-bar {
  background: linear-gradient(90deg, var(--c-navy, #0F2744), var(--c-navy2, #1A3D6B));
}
.ir-notification[data-type="info"] {
  border-left: 3px solid var(--c-navy, #0F2744);
}

/* ── Success (Teal) ────────────────── */
.ir-notification[data-type="success"] .ir-notif-icon {
  background: rgba(11, 122, 106, 0.10);
  color: var(--c-teal, #0B7A6A);
}
.ir-notification[data-type="success"] .ir-notif-progress-bar {
  background: linear-gradient(90deg, var(--c-teal, #0B7A6A), var(--c-green, #1A7F5A));
}
.ir-notification[data-type="success"] {
  border-left: 3px solid var(--c-teal, #0B7A6A);
}

/* ── Warning (Gold) ────────────────── */
.ir-notification[data-type="warning"] .ir-notif-icon {
  background: rgba(212, 137, 10, 0.12);
  color: var(--c-gold, #D4890A);
}
.ir-notification[data-type="warning"] .ir-notif-progress-bar {
  background: linear-gradient(90deg, var(--c-gold, #D4890A), var(--c-gold2, #F5A623));
}
.ir-notification[data-type="warning"] {
  border-left: 3px solid var(--c-gold, #D4890A);
}

/* ── Alert (Red) ───────────────────── */
.ir-notification[data-type="alert"] .ir-notif-icon {
  background: rgba(201, 54, 54, 0.10);
  color: var(--c-red, #C93636);
}
.ir-notification[data-type="alert"] .ir-notif-progress-bar {
  background: linear-gradient(90deg, var(--c-red, #C93636), #E05050);
}
.ir-notification[data-type="alert"] {
  border-left: 3px solid var(--c-red, #C93636);
}

/* ── AI (Gradient Navy→Teal) ───────── */
.ir-notification[data-type="ai"] {
  background: linear-gradient(135deg,
    rgba(15, 39, 68, 0.95) 0%,
    rgba(11, 122, 106, 0.92) 100%
  );
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-left: 3px solid rgba(245, 166, 35, 0.7);
}
.ir-notification[data-type="ai"] .ir-notif-icon {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.ir-notification[data-type="ai"] .ir-notif-title {
  color: #fff;
}
.ir-notification[data-type="ai"] .ir-notif-desc {
  color: rgba(255, 255, 255, 0.65);
}
.ir-notification[data-type="ai"] .ir-notif-close {
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.6);
}
.ir-notification[data-type="ai"] .ir-notif-close:hover {
  background: rgba(255, 255, 255, 0.20);
  color: #fff;
}
.ir-notification[data-type="ai"] .ir-notif-progress-track {
  background: rgba(255, 255, 255, 0.08);
}
.ir-notification[data-type="ai"] .ir-notif-progress-bar {
  background: linear-gradient(90deg, var(--c-gold2, #F5A623), var(--c-gold, #D4890A));
}

/* ══════════════════════════════════════
   DARK MODE
   ══════════════════════════════════════ */
body.dark-mode .ir-notification:not([data-type="ai"]) {
  background: rgba(30, 30, 30, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.25);
}

body.dark-mode .ir-notification:not([data-type="ai"]):hover {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.45),
    0 4px 12px rgba(0, 0, 0, 0.30);
}

body.dark-mode .ir-notification:not([data-type="ai"]) .ir-notif-title {
  color: var(--c-ink, #F7F4EF);
}

body.dark-mode .ir-notification:not([data-type="ai"]) .ir-notif-desc {
  color: var(--c-ink3, #A69E93);
}

body.dark-mode .ir-notification:not([data-type="ai"]) .ir-notif-close {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
}

body.dark-mode .ir-notification:not([data-type="ai"]) .ir-notif-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
}

body.dark-mode .ir-notification:not([data-type="ai"]) .ir-notif-progress-track {
  background: rgba(255, 255, 255, 0.05);
}

/* ══════════════════════════════════════
   RESPONSIVE — MOBILE (<768px)
   ══════════════════════════════════════ */
@media (max-width: 767px) {
  .ir-notification-container {
    top: 12px;
    right: 12px;
    left: 12px;
    gap: 8px;
  }

  .ir-notification {
    width: 100%;
  }
}

/* ══════════════════════════════════════
   REDUCED MOTION
   ══════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  .ir-notification {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .ir-notification.ir-notif-exit {
    animation-duration: 0.01ms !important;
  }
}
`;

  document.head.appendChild(styleEl);
})();


/* ══════════════════════════════════════
   NOTIFICATION SYSTEM CLASS
   ══════════════════════════════════════ */

/**
 * @typedef {Object} NotificationOptions
 * @property {'info'|'success'|'warning'|'alert'|'ai'} [type='info'] - Visual style type
 * @property {string}  [description]  - Secondary description text
 * @property {number}  [duration=4000] - Auto-dismiss time in ms (0 = persist)
 * @property {string}  [icon]         - Custom emoji/icon override
 */

class NotificationSystem {

  /** Maximum number of visible notifications at once */
  static MAX_VISIBLE = 4;

  /** Default auto-dismiss duration in milliseconds */
  static DEFAULT_DURATION = 4000;

  /**
   * Default icons per notification type.
   * Emoji-based for zero-dependency rendering.
   * @type {Record<string, string>}
   */
  static ICONS = {
    info:    'ℹ️',
    success: '✅',
    warning: '⚠️',
    alert:   '🚨',
    ai:      '✨',
  };

  constructor() {
    /** @type {Map<string, {el: HTMLElement, timer: number|null, raf: number|null}>} */
    this._notifications = new Map();

    /** @type {HTMLElement|null} */
    this._container = null;

    /** Auto-incrementing ID counter */
    this._idCounter = 0;

    // Build the container lazily on first use
    this._ensureContainer();
  }

  /* ─────────────────────────────────────
     PRIVATE — Container Setup
     ───────────────────────────────────── */

  /**
   * Creates (or retrieves) the fixed-position container element
   * where notification cards are appended.
   * @private
   */
  _ensureContainer() {
    if (this._container && document.body.contains(this._container)) return;

    let existing = document.querySelector('.ir-notification-container');
    if (existing) {
      this._container = existing;
      return;
    }

    this._container = document.createElement('div');
    this._container.classList.add('ir-notification-container');
    this._container.setAttribute('role', 'status');
    this._container.setAttribute('aria-live', 'polite');
    this._container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(this._container);
  }

  /* ─────────────────────────────────────
     PUBLIC — Show Notification
     ───────────────────────────────────── */

  /**
   * Display a notification card.
   *
   * @param {string} title - Bold heading text
   * @param {NotificationOptions} [options={}] - Configuration
   * @returns {string} Unique notification ID (for programmatic dismissal)
   *
   * @example
   *   notificationSystem.show('Ride booked!', {
   *     type: 'success',
   *     description: 'Driver arriving in 4 minutes',
   *     duration: 5000,
   *   });
   */
  show(title, options = {}) {
    this._ensureContainer();

    const id       = `ir-notif-${++this._idCounter}-${Date.now()}`;
    const type     = options.type || 'info';
    const desc     = options.description || '';
    const duration = options.duration !== undefined ? options.duration : NotificationSystem.DEFAULT_DURATION;
    const icon     = options.icon || NotificationSystem.ICONS[type] || 'ℹ️';

    // ── Build DOM ────────────────────
    const card = document.createElement('div');
    card.classList.add('ir-notification');
    card.setAttribute('data-type', type);
    card.setAttribute('data-id', id);
    card.setAttribute('role', 'alert');

    card.innerHTML = `
      <div class="ir-notif-icon">${icon}</div>
      <div class="ir-notif-content">
        <p class="ir-notif-title">${this._escapeHTML(title)}</p>
        ${desc ? `<p class="ir-notif-desc">${this._escapeHTML(desc)}</p>` : ''}
      </div>
      <button class="ir-notif-close" aria-label="Dismiss notification">&times;</button>
      ${duration > 0 ? `
        <div class="ir-notif-progress-track">
          <div class="ir-notif-progress-bar"></div>
        </div>
      ` : ''}
    `;

    // ── Close button handler ─────────
    const closeBtn = card.querySelector('.ir-notif-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss(id);
    });

    // ── Touch swipe-to-dismiss ───────
    this._attachTouchHandlers(card, id);

    // ── Pause timer on hover ─────────
    let remainingTime = duration;
    let timerStartedAt = null;
    let animFrameId = null;
    let timeoutId = null;

    const progressBar = card.querySelector('.ir-notif-progress-bar');

    /**
     * Start (or resume) the auto-dismiss countdown and
     * animate the progress bar in sync via requestAnimationFrame.
     */
    const startTimer = () => {
      if (duration <= 0) return;
      timerStartedAt = performance.now();

      // Auto-dismiss timeout
      timeoutId = setTimeout(() => this.dismiss(id), remainingTime);

      // Animate progress bar shrink
      const animate = (now) => {
        const elapsed = now - timerStartedAt;
        const totalElapsed = (duration - remainingTime) + elapsed;
        const fraction = 1 - Math.min(totalElapsed / duration, 1);
        if (progressBar) {
          progressBar.style.transform = `scaleX(${fraction})`;
        }
        if (fraction > 0) {
          animFrameId = requestAnimationFrame(animate);
        }
      };
      animFrameId = requestAnimationFrame(animate);
    };

    /**
     * Pause the countdown and freeze the progress bar.
     */
    const pauseTimer = () => {
      if (duration <= 0) return;
      if (timeoutId) clearTimeout(timeoutId);
      if (animFrameId) cancelAnimationFrame(animFrameId);

      // Calculate how much time remains
      if (timerStartedAt !== null) {
        const elapsed = performance.now() - timerStartedAt;
        remainingTime = Math.max(remainingTime - elapsed, 0);
      }
    };

    card.addEventListener('mouseenter', pauseTimer);
    card.addEventListener('mouseleave', startTimer);

    // ── Append to DOM ────────────────
    this._container.appendChild(card);

    // Store reference
    this._notifications.set(id, { el: card, timer: timeoutId, raf: animFrameId });

    // Enforce max visible count
    this._enforceMaxVisible();

    // Start auto-dismiss timer
    startTimer();

    return id;
  }

  /* ─────────────────────────────────────
     PUBLIC — Dismiss
     ───────────────────────────────────── */

  /**
   * Dismiss (remove) a specific notification with exit animation.
   *
   * @param {string} id - The notification ID returned from .show()
   */
  dismiss(id) {
    const entry = this._notifications.get(id);
    if (!entry) return;

    const { el, timer, raf } = entry;

    // Clear pending timers
    if (timer) clearTimeout(timer);
    if (raf) cancelAnimationFrame(raf);

    // Trigger exit animation
    el.classList.add('ir-notif-exit');

    // Remove after animation completes
    const onEnd = () => {
      el.removeEventListener('animationend', onEnd);
      el.remove();
      this._notifications.delete(id);
    };

    el.addEventListener('animationend', onEnd);

    // Safety fallback in case animationend doesn't fire
    setTimeout(onEnd, 400);
  }

  /* ─────────────────────────────────────
     PUBLIC — Clear All
     ───────────────────────────────────── */

  /**
   * Dismiss every active notification at once.
   */
  clearAll() {
    const ids = Array.from(this._notifications.keys());
    ids.forEach((id, i) => {
      // Stagger dismissals slightly for visual polish
      setTimeout(() => this.dismiss(id), i * 60);
    });
  }

  /* ─────────────────────────────────────
     PRIVATE — Enforce Max Visible
     ───────────────────────────────────── */

  /**
   * If the stack exceeds MAX_VISIBLE, dismiss the oldest
   * notifications until we are within the limit.
   * @private
   */
  _enforceMaxVisible() {
    const ids = Array.from(this._notifications.keys());
    while (ids.length > NotificationSystem.MAX_VISIBLE) {
      const oldestId = ids.shift();
      this.dismiss(oldestId);
    }
  }

  /* ─────────────────────────────────────
     PRIVATE — Touch / Swipe Handlers
     ───────────────────────────────────── */

  /**
   * Attach touch event listeners for swipe-right-to-dismiss.
   * Includes momentum tracking: a fast-enough swipe (even
   * partial) will trigger dismissal.
   *
   * @param {HTMLElement} card - The notification card element
   * @param {string} id - Notification ID
   * @private
   */
  _attachTouchHandlers(card, id) {
    let startX = 0;
    let currentX = 0;
    let startTime = 0;
    let isSwiping = false;

    const DISMISS_THRESHOLD = 0.35;   // 35% of card width
    const VELOCITY_THRESHOLD = 0.5;   // px/ms — fast swipe detection

    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      currentX = startX;
      startTime = Date.now();
      isSwiping = true;
      card.style.transition = 'none';
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;

      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;

      // Only allow swiping to the right (positive delta)
      if (deltaX > 0) {
        const opacity = 1 - (deltaX / card.offsetWidth) * 0.6;
        card.style.transform = `translateX(${deltaX}px)`;
        card.style.opacity = Math.max(opacity, 0.3).toString();
      }
    }, { passive: true });

    card.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;

      const deltaX = currentX - startX;
      const elapsed = Date.now() - startTime;
      const velocity = deltaX / elapsed; // px/ms

      const pastThreshold = deltaX > card.offsetWidth * DISMISS_THRESHOLD;
      const fastSwipe = velocity > VELOCITY_THRESHOLD && deltaX > 30;

      if (pastThreshold || fastSwipe) {
        // Dismiss with momentum
        card.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        card.style.transform = `translateX(${card.offsetWidth + 40}px)`;
        card.style.opacity = '0';
        setTimeout(() => this.dismiss(id), 260);
      } else {
        // Snap back
        card.style.transition = 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease';
        card.style.transform = 'translateX(0)';
        card.style.opacity = '1';
      }
    }, { passive: true });
  }

  /* ─────────────────────────────────────
     PRIVATE — Helpers
     ───────────────────────────────────── */

  /**
   * Basic HTML-entity escaping to prevent XSS in notification content.
   * @param {string} str - Raw string
   * @returns {string} Escaped string safe for innerHTML insertion
   * @private
   */
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}


/* ══════════════════════════════════════
   SINGLETON INSTANCE
   ══════════════════════════════════════ */

/** @type {NotificationSystem} Global singleton */
const _irNotificationSystem = new NotificationSystem();


/* ══════════════════════════════════════
   GLOBAL CONVENIENCE FUNCTIONS
   ══════════════════════════════════════ */

/**
 * Show a notification with full options control.
 *
 * @param {string} title - Main heading text
 * @param {NotificationOptions} [options={}] - Configuration
 * @returns {string} Notification ID
 *
 * @example
 *   showNotification('Update available', {
 *     type: 'info',
 *     description: 'A new version is ready to install.',
 *     duration: 6000,
 *     icon: '🔄'
 *   });
 */
function showNotification(title, options = {}) {
  return _irNotificationSystem.show(title, options);
}

/**
 * Show a success (teal) notification.
 *
 * @param {string} title - Main heading text
 * @param {string} [description] - Optional secondary text
 * @returns {string} Notification ID
 */
function showSuccessNotification(title, description) {
  return _irNotificationSystem.show(title, {
    type: 'success',
    description,
  });
}

/**
 * Show a warning (gold) notification.
 *
 * @param {string} title - Main heading text
 * @param {string} [description] - Optional secondary text
 * @returns {string} Notification ID
 */
function showWarningNotification(title, description) {
  return _irNotificationSystem.show(title, {
    type: 'warning',
    description,
  });
}

/**
 * Show an AI-themed (gradient) notification.
 *
 * @param {string} title - Main heading text
 * @param {string} [description] - Optional secondary text
 * @returns {string} Notification ID
 */
function showAINotification(title, description) {
  return _irNotificationSystem.show(title, {
    type: 'ai',
    description,
    icon: '✨',
  });
}

/**
 * Dismiss every active notification.
 */
function clearAllNotifications() {
  _irNotificationSystem.clearAll();
}


/* ══════════════════════════════════════
   CONTEXT-AWARE PRESET NOTIFICATIONS
   ── Common ride-booking scenarios ──
   ══════════════════════════════════════ */

/**
 * Notify that a driver is arriving soon.
 *
 * @param {string} driverName - Name of the assigned driver
 * @param {number} minutes    - Estimated arrival in minutes
 * @returns {string} Notification ID
 *
 * @example
 *   notifyDriverArriving('Suresh', 3);
 */
function notifyDriverArriving(driverName, minutes) {
  return _irNotificationSystem.show('Driver Arriving', {
    type: 'info',
    description: `${driverName} will reach your pickup in ${minutes} min.`,
    icon: '🚗',
    duration: 5000,
  });
}

/**
 * Notify about a traffic alert on a specific route.
 *
 * @param {string} routeName - Name or label of the affected route
 * @returns {string} Notification ID
 *
 * @example
 *   notifyTrafficAlert('Hitech City → Banjara Hills');
 */
function notifyTrafficAlert(routeName) {
  return _irNotificationSystem.show('Traffic Alert', {
    type: 'warning',
    description: `Heavy congestion detected on ${routeName}. Considering alternate routes.`,
    icon: '🚧',
    duration: 6000,
  });
}

/**
 * Notify that the AI has found a better route with savings.
 *
 * @param {string} savings - Human-readable savings string (e.g. '₹35 & 8 min')
 * @returns {string} Notification ID
 *
 * @example
 *   notifyAIRouteFound('₹35 & 8 min');
 */
function notifyAIRouteFound(savings) {
  return _irNotificationSystem.show('AI Route Optimised', {
    type: 'ai',
    description: `Found a smarter route — saves you ${savings}. Applied automatically.`,
    icon: '✨',
    duration: 5500,
  });
}

/**
 * Notify that a ride has been completed with the fare summary.
 *
 * @param {string} fare - Formatted fare string (e.g. '₹142')
 * @returns {string} Notification ID
 *
 * @example
 *   notifyRideCompleted('₹142');
 */
function notifyRideCompleted(fare) {
  return _irNotificationSystem.show('Ride Completed', {
    type: 'success',
    description: `Trip total: ${fare}. Thank you for riding with IntelliRoute!`,
    icon: '🏁',
    duration: 6000,
  });
}

/**
 * Notify about an adverse weather condition affecting the ride.
 *
 * @param {string} condition - Weather condition description (e.g. 'Heavy Rain')
 * @returns {string} Notification ID
 *
 * @example
 *   notifyWeatherAlert('Heavy Rain');
 */
function notifyWeatherAlert(condition) {
  return _irNotificationSystem.show('Weather Advisory', {
    type: 'alert',
    description: `${condition} expected on your route. Drive speed may be adjusted for safety.`,
    icon: '🌧️',
    duration: 7000,
  });
}
