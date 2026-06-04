/**
 * ══════════════════════════════════════════════════════════════════
 *  IntelliRoute — Bottom Sheet UI Component
 * ══════════════════════════════════════════════════════════════════
 *
 *  Modern bottom sheet for mobile-first booking interface
 *  Features:
 *  - Draggable/swipeable dismiss
 *  - Smooth height transitions
 *  - Dark mode support
 *  - Accessibility friendly
 *
 *  Usage:
 *    const sheet = new BottomSheet({
 *      title: 'Select Ride',
 *      content: '<div>Ride options</div>',
 *      height: 'auto' // or '50%', '75%', '90%'
 *    });
 *    sheet.show();
 */

class BottomSheet {
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      content: options.content || '',
      height: options.height || 'auto',
      dismissible: options.dismissible !== false,
      onDismiss: options.onDismiss || (() => {}),
    };

    this.sheet = null;
    this.isOpen = false;
    this.startY = 0;
    this.currentY = 0;
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('ir-bottom-sheet-css')) return;

    const css = document.createElement('style');
    css.id = 'ir-bottom-sheet-css';
    css.textContent = `
      /* Bottom sheet backdrop */
      .ir-sheet-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        z-index: 999;
        transition: background 0.3s ease;
        pointer-events: none;
      }

      .ir-sheet-backdrop.active {
        background: rgba(0, 0, 0, 0.4);
        pointer-events: auto;
      }

      /* Bottom sheet container */
      .ir-bottom-sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-radius: 24px 24px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        max-height: 90vh;
        max-height: 90dvh;
        transition: transform 0.3s cubic-bezier(.25, .46, .45, .94);
        transform: translateY(100%);
        display: flex;
        flex-direction: column;
        touch-action: none;
      }

      .ir-bottom-sheet.open {
        transform: translateY(0);
      }

      body.dark-mode .ir-bottom-sheet {
        background: #1a1a1a;
        color: #fff;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
      }

      /* Drag handle */
      .ir-sheet-handle {
        width: 48px;
        height: 4px;
        background: #ddd;
        border-radius: 2px;
        margin: 12px auto 8px;
        cursor: grab;
      }

      body.dark-mode .ir-sheet-handle {
        background: #333;
      }

      .ir-sheet-handle:active {
        cursor: grabbing;
      }

      /* Sheet header */
      .ir-sheet-header {
        padding: 0 20px 16px;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }

      body.dark-mode .ir-sheet-header {
        border-bottom-color: #222;
      }

      .ir-sheet-header h2 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        color: #1E405E;
      }

      body.dark-mode .ir-sheet-header h2 {
        color: #fff;
      }

      /* Sheet content */
      .ir-sheet-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px;
      }

      /* Ride option card in bottom sheet */
      .ir-ride-option {
        padding: 16px;
        border-radius: 12px;
        border: 2px solid #f0f0f0;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      body.dark-mode .ir-ride-option {
        border-color: #222;
      }

      .ir-ride-option:hover {
        border-color: #1E405E;
        background: #f9f9f9;
      }

      body.dark-mode .ir-ride-option:hover {
        background: #222;
      }

      .ir-ride-option.selected {
        border-color: #1E405E;
        background: #f0f5ff;
      }

      body.dark-mode .ir-ride-option.selected {
        background: #1a2e4a;
        border-color: #58A6FF;
      }

      .ir-ride-emoji {
        font-size: 32px;
        flex-shrink: 0;
      }

      .ir-ride-details {
        flex: 1;
      }

      .ir-ride-details h4 {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: #1E405E;
      }

      body.dark-mode .ir-ride-details h4 {
        color: #fff;
      }

      .ir-ride-details p {
        font-size: 12px;
        margin: 0;
        color: #666;
      }

      body.dark-mode .ir-ride-details p {
        color: #aaa;
      }

      .ir-ride-fare {
        text-align: right;
      }

      .ir-ride-fare-label {
        font-size: 11px;
        color: #999;
        margin: 0;
      }

      .ir-ride-fare-amount {
        font-size: 16px;
        font-weight: 700;
        color: #1E405E;
        margin: 2px 0 0 0;
        font-family: 'DM Mono', monospace;
      }

      body.dark-mode .ir-ride-fare-amount {
        color: #58A6FF;
      }

      /* Sheet footer/action */
      .ir-sheet-footer {
        padding: 20px;
        border-top: 1px solid #f0f0f0;
        flex-shrink: 0;
      }

      body.dark-mode .ir-sheet-footer {
        border-top-color: #222;
      }

      .ir-sheet-footer button {
        width: 100%;
        padding: 14px;
        background: #1E405E;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .ir-sheet-footer button:hover {
        background: #2a5182;
      }

      .ir-sheet-footer button:active {
        transform: scale(0.98);
      }

      /* Loading skeleton in sheet */
      .ir-skeleton {
        background: linear-gradient(
          90deg,
          #f0f0f0 0%,
          #f9f9f9 50%,
          #f0f0f0 100%
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      body.dark-mode .ir-skeleton {
        background: linear-gradient(
          90deg,
          #222 0%,
          #333 50%,
          #222 100%
        );
      }

      /* Responsive adjustments */
      @media (max-width: 600px) {
        .ir-bottom-sheet {
          border-radius: 20px 20px 0 0;
        }

        .ir-sheet-content {
          padding: 16px;
        }

        .ir-sheet-footer {
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(css);
  }

  /**
   * Create and return the sheet element
   */
  create() {
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'ir-sheet-backdrop';
    backdrop.addEventListener('click', () => {
      if (this.options.dismissible) this.hide();
    });

    // Sheet container
    const sheet = document.createElement('div');
    sheet.className = 'ir-bottom-sheet';

    // Handle
    const handle = document.createElement('div');
    handle.className = 'ir-sheet-handle';
    sheet.appendChild(handle);

    // Header
    if (this.options.title) {
      const header = document.createElement('div');
      header.className = 'ir-sheet-header';
      header.innerHTML = `<h2>${this.options.title}</h2>`;
      sheet.appendChild(header);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'ir-sheet-content';
    if (typeof this.options.content === 'string') {
      content.innerHTML = this.options.content;
    } else {
      content.appendChild(this.options.content);
    }
    sheet.appendChild(content);

    // Touch handling for drag dismiss
    if (this.options.dismissible) {
      handle.addEventListener('touchstart', (e) => {
        this.startY = e.touches[0].clientY;
      });

      handle.addEventListener('touchmove', (e) => {
        this.currentY = e.touches[0].clientY;
        const diff = this.currentY - this.startY;
        if (diff > 0) {
          sheet.style.transform = `translateY(${diff}px)`;
        }
      });

      handle.addEventListener('touchend', () => {
        const diff = this.currentY - this.startY;
        if (diff > 80) {
          this.hide();
        } else {
          sheet.style.transform = 'translateY(0)';
        }
      });
    }

    this.sheet = sheet;
    this.backdrop = backdrop;

    return { backdrop, sheet };
  }

  /**
   * Show the bottom sheet
   */
  show() {
    if (this.isOpen) return;

    const { backdrop, sheet } = this.create();

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    // Trigger animation
    setTimeout(() => {
      backdrop.classList.add('active');
      sheet.classList.add('open');
    }, 10);

    this.isOpen = true;
  }

  /**
   * Hide the bottom sheet
   */
  hide() {
    if (!this.isOpen || !this.sheet) return;

    this.sheet.classList.remove('open');
    this.backdrop?.classList.remove('active');

    setTimeout(() => {
      this.sheet?.remove();
      this.backdrop?.remove();
      this.isOpen = false;
      this.options.onDismiss();
    }, 300);
  }

  /**
   * Update content
   */
  setContent(content) {
    if (!this.sheet) return;
    const contentDiv = this.sheet.querySelector('.ir-sheet-content');
    if (contentDiv) {
      if (typeof content === 'string') {
        contentDiv.innerHTML = content;
      } else {
        contentDiv.innerHTML = '';
        contentDiv.appendChild(content);
      }
    }
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.BottomSheet = BottomSheet;
}
