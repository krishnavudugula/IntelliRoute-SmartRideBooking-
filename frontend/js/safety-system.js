/**
 * IntelliRoute — Emergency Safety System
 * Handles SOS activations, long-press logic, and simulated emergency actions.
 */

(function injectSafetyCSS() {
    if (document.getElementById('ir-safety-css')) return;
  
    const css = document.createElement('style');
    css.id = 'ir-safety-css';
    css.textContent = `
      .sos-modal-overlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .sos-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      
      .sos-modal {
        background: var(--c-surface, #fff);
        width: 90%;
        max-width: 400px;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        transform: scale(0.95) translateY(20px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 2px solid var(--c-red, #c93636);
      }
      .sos-modal-overlay.active .sos-modal {
        transform: scale(1) translateY(0);
      }
      
      body.dark-mode .sos-modal {
        background: #1e1e1e;
        color: #fff;
      }
      
      .sos-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        color: var(--c-red, #c93636);
        font-family: 'Playfair Display', serif;
        font-size: 1.6rem;
      }
      .sos-header-icon {
        width: 40px; height: 40px;
        background: rgba(201, 54, 54, 0.15);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        animation: sosPulse 1.5s infinite;
      }
      
      .sos-action-btn {
        display: flex;
        align-items: center;
        gap: 16px;
        width: 100%;
        padding: 16px;
        border: 1px solid var(--c-bg2, #eef2f6);
        background: var(--c-bg, #f7f9fc);
        border-radius: 12px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      body.dark-mode .sos-action-btn {
        background: #2a2a2a;
        border-color: #333;
        color: #fff;
      }
      .sos-action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: var(--c-red, #c93636);
      }
      .sos-action-icon {
        font-size: 1.5rem;
      }
      .sos-action-title {
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 4px;
      }
      .sos-action-desc {
        font-size: 0.8rem;
        color: var(--c-ink3, #64748b);
      }
      body.dark-mode .sos-action-desc { color: #aaa; }
      
      .sos-recording-banner {
        background: rgba(201, 54, 54, 0.1);
        color: var(--c-red, #c93636);
        padding: 12px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
      }
      
      .sos-close {
        width: 100%;
        padding: 14px;
        background: none;
        border: none;
        color: var(--c-ink3, #64748b);
        font-weight: 600;
        cursor: pointer;
      }
      body.dark-mode .sos-close { color: #888; }
      .sos-close:hover { color: var(--c-ink, #0f172a); }
      body.dark-mode .sos-close:hover { color: #fff; }
      
      @keyframes sosPulse {
        0% { box-shadow: 0 0 0 0 rgba(201, 54, 54, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(201, 54, 54, 0); }
        100% { box-shadow: 0 0 0 0 rgba(201, 54, 54, 0); }
      }
    `;
    document.head.appendChild(css);
  })();
  
  class SafetySystem {
    constructor() {
      this.initModal();
      this.longPressTimer = null;
    }
  
    initModal() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'sos-modal-overlay';
      
      this.overlay.innerHTML = `
        <div class="sos-modal">
          <div class="sos-header">
            <div class="sos-header-icon">🚨</div>
            Emergency SOS
          </div>
          
          <div class="sos-recording-banner" id="sos-recording" style="display:none;">
            <span style="animation: sosPulse 1s infinite; width:8px; height:8px; background:var(--c-red); border-radius:50%; display:inline-block;"></span>
            Secure audio recording started
          </div>
  
          <button class="sos-action-btn" onclick="window.safetySystem.triggerPolice()">
            <div class="sos-action-icon">🚓</div>
            <div>
              <div class="sos-action-title">Call Police (100)</div>
              <div class="sos-action-desc">Instantly dial local authorities</div>
            </div>
          </button>
  
          <button class="sos-action-btn" onclick="window.safetySystem.triggerShare()">
            <div class="sos-action-icon">📍</div>
            <div>
              <div class="sos-action-title">Share Live Location</div>
              <div class="sos-action-desc">Send tracking link to trusted contacts</div>
            </div>
          </button>
  
          <button class="sos-action-btn" onclick="window.safetySystem.triggerAudio()">
            <div class="sos-action-icon">🎙️</div>
            <div>
              <div class="sos-action-title">Record Audio</div>
              <div class="sos-action-desc">Silently record and upload to secure cloud</div>
            </div>
          </button>
  
          <button class="sos-close" onclick="window.safetySystem.close()">Cancel & Close</button>
        </div>
      `;
      document.body.appendChild(this.overlay);
    }
  
    open() {
      this.overlay.classList.add('active');
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  
    close() {
      this.overlay.classList.remove('active');
      document.getElementById('sos-recording').style.display = 'none';
    }
  
    triggerPolice() {
      if (window.showNotification) {
          window.showNotification('Calling Police', { type: 'alert', description: 'Dialing 100... Your location has been sent to dispatch.' });
      } else {
          alert('Calling 100... Location shared.');
      }
    }
  
    triggerShare() {
      if (window.showNotification) {
          window.showNotification('Location Shared', { type: 'success', description: 'Live tracking link sent to 3 trusted contacts.' });
      }
    }
  
    triggerAudio() {
      document.getElementById('sos-recording').style.display = 'flex';
      if (window.showNotification) {
          window.showNotification('Recording Started', { type: 'warning', description: 'Audio is being securely uploaded to IntelliRoute servers.' });
      }
    }
  
    /**
     * Attach long-press behavior to a specific button
     * @param {HTMLElement} btnElement 
     */
    attachLongPress(btnElement) {
      if (!btnElement) return;
      
      const startPress = (e) => {
        // e.preventDefault();
        this.longPressTimer = setTimeout(() => {
          this.open();
        }, 800); // 800ms long press
      };
      
      const endPress = () => {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
      };
  
      btnElement.addEventListener('mousedown', startPress);
      btnElement.addEventListener('touchstart', startPress);
      btnElement.addEventListener('mouseup', endPress);
      btnElement.addEventListener('mouseleave', endPress);
      btnElement.addEventListener('touchend', endPress);
    }
  }
  
  // Initialize and expose globally
  document.addEventListener('DOMContentLoaded', () => {
      window.safetySystem = new SafetySystem();
  });
  
  // Backwards compatibility for the old triggerSOS() function calls in book.html
  window.triggerSOS = function() {
      if (window.safetySystem) {
          window.safetySystem.open();
      }
  };
