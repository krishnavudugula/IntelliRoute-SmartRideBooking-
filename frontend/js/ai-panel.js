/**
 * IntelliRoute AI Recommendation Panel
 * Provides a context-aware floating AI assistant
 */

(function injectAIPanelCSS() {
    if (document.getElementById('ir-ai-panel-css')) return;
  
    const css = document.createElement('style');
    css.id = 'ir-ai-panel-css';
    css.textContent = `
      .ai-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--c-navy) 0%, var(--c-teal) 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 16px rgba(31, 123, 109, 0.4);
        cursor: pointer;
        z-index: 1000;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .ai-floating-btn:hover {
        transform: scale(1.1);
      }
      .ai-floating-btn .ai-badge {
        position: absolute;
        top: 0;
        right: 0;
        width: 12px;
        height: 12px;
        background: var(--c-red);
        border-radius: 50%;
        border: 2px solid white;
        display: none;
      }
      .ai-floating-btn.has-notification .ai-badge {
        display: block;
        animation: aiPulse 2s infinite;
      }
      
      .ai-panel {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 320px;
        max-width: calc(100vw - 48px);
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      body.dark-mode .ai-panel {
        background: rgba(30, 30, 30, 0.85);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .ai-panel.active {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      
      .ai-panel-header {
        padding: 16px;
        border-bottom: 1px solid var(--c-bg2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(90deg, rgba(30, 64, 94, 0.05), transparent);
      }
      body.dark-mode .ai-panel-header {
        border-bottom-color: rgba(255,255,255,0.1);
      }
      .ai-panel-title {
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--c-navy);
      }
      body.dark-mode .ai-panel-title { color: #fff; }
      
      .ai-panel-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--c-ink3);
      }
      
      .ai-panel-body {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .ai-message {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        animation: aiSlideUp 0.3s ease forwards;
      }
      .ai-message-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--c-bg2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 16px;
      }
      body.dark-mode .ai-message-icon { background: rgba(255,255,255,0.1); }
      
      .ai-message-content {
        background: var(--c-white);
        padding: 12px;
        border-radius: 0 12px 12px 12px;
        box-shadow: var(--sh-sm);
        font-size: 0.9rem;
        color: var(--c-ink);
        border: 1px solid var(--c-bg2);
      }
      body.dark-mode .ai-message-content {
        background: var(--c-surface);
        border-color: rgba(255,255,255,0.05);
        color: #e0e0e0;
      }
      
      .ai-typing {
        display: flex;
        gap: 4px;
        padding: 4px 8px;
      }
      .ai-typing-dot {
        width: 6px;
        height: 6px;
        background: var(--c-teal);
        border-radius: 50%;
        animation: aiTypingBounce 1.4s infinite ease-in-out both;
      }
      .ai-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .ai-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      .ai-suggestions {
        padding: 12px 16px;
        border-top: 1px solid var(--c-bg2);
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      body.dark-mode .ai-suggestions { border-top-color: rgba(255,255,255,0.1); }
      
      .ai-suggestion-chip {
        padding: 6px 12px;
        background: var(--c-bg2);
        border: 1px solid transparent;
        border-radius: 16px;
        font-size: 0.75rem;
        cursor: pointer;
        color: var(--c-ink2);
        transition: all 0.2s;
      }
      body.dark-mode .ai-suggestion-chip {
        background: rgba(255,255,255,0.1);
        color: #ccc;
      }
      .ai-suggestion-chip:hover {
        background: var(--c-teal-light);
        color: var(--c-teal);
        border-color: var(--c-teal);
      }
      
      @keyframes aiPulse {
        0% { box-shadow: 0 0 0 0 rgba(201, 54, 54, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(201, 54, 54, 0); }
        100% { box-shadow: 0 0 0 0 rgba(201, 54, 54, 0); }
      }
      
      @keyframes aiSlideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes aiTypingBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `;
    document.head.appendChild(css);
  })();
  
  class AIPanel {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.initUI();
    }
    
    initUI() {
      // Create Button
      this.btn = document.createElement('div');
      this.btn.className = 'ai-floating-btn';
      this.btn.innerHTML = `✨<div class="ai-badge"></div>`;
      this.btn.onclick = () => this.toggle();
      document.body.appendChild(this.btn);
      
      // Create Panel
      this.panel = document.createElement('div');
      this.panel.className = 'ai-panel';
      this.panel.innerHTML = `
        <div class="ai-panel-header">
          <div class="ai-panel-title"><span>✨</span> IntelliRoute AI</div>
          <button class="ai-panel-close">×</button>
        </div>
        <div class="ai-panel-body" id="ai-messages">
        </div>
        <div class="ai-suggestions" id="ai-chips">
        </div>
      `;
      document.body.appendChild(this.panel);
      
      this.panel.querySelector('.ai-panel-close').onclick = () => this.close();
      this.messagesContainer = this.panel.querySelector('#ai-messages');
      this.chipsContainer = this.panel.querySelector('#ai-chips');
      
      // Add initial welcome message
      this.addMessage("Hi! I'm your IntelliRoute AI. I can help you find the safest routes, compare prices, or check live traffic.", '🤖');
      this.setSuggestions(['Safest route to work?', 'Check traffic', 'Cheapest option']);
    }
    
    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }
    
    open() {
      this.isOpen = true;
      this.panel.classList.add('active');
      this.btn.classList.remove('has-notification');
      this.btn.style.transform = 'scale(0) translateY(20px)';
      this.btn.style.opacity = '0';
    }
    
    close() {
      this.isOpen = false;
      this.panel.classList.remove('active');
      this.btn.style.transform = 'scale(1) translateY(0)';
      this.btn.style.opacity = '1';
    }
    
    addMessage(text, icon = '✨', isTypingDelay = 0) {
      if (isTypingDelay > 0) {
        const id = 'typing-' + Date.now();
        const typingHTML = `
          <div class="ai-message" id="${id}">
            <div class="ai-message-icon">${icon}</div>
            <div class="ai-message-content">
              <div class="ai-typing">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
              </div>
            </div>
          </div>
        `;
        this.messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
        
        setTimeout(() => {
          document.getElementById(id).remove();
          this.renderMessage(text, icon);
        }, isTypingDelay);
      } else {
        this.renderMessage(text, icon);
      }
    }
    
    renderMessage(text, icon) {
      const msgHTML = `
        <div class="ai-message">
          <div class="ai-message-icon">${icon}</div>
          <div class="ai-message-content">${text}</div>
        </div>
      `;
      this.messagesContainer.insertAdjacentHTML('beforeend', msgHTML);
      this.scrollToBottom();
      
      // If panel is closed, show notification badge on button
      if (!this.isOpen) {
        this.btn.classList.add('has-notification');
      }
    }
    
    setSuggestions(suggestions) {
      this.chipsContainer.innerHTML = '';
      suggestions.forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'ai-suggestion-chip';
        chip.innerText = text;
        chip.onclick = () => {
          this.addMessage(`You asked: ${text}`, '👤');
          // Simulated responses
          if (text.includes('Safest')) {
              this.addMessage("Route A is currently the safest option. It has a safety score of 94/100 and avoids two accident-prone zones.", '🛡️', 1000);
          } else if (text.includes('traffic')) {
              this.addMessage("Traffic is moderate right now. Expect a 4-minute delay on Jubilee Hills Road No. 36.", '🚦', 800);
          } else {
              this.addMessage("I've highlighted the cheapest and fastest options for you.", '✨', 600);
          }
        };
        this.chipsContainer.appendChild(chip);
      });
    }
    
    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    /**
     * Call this when context changes (e.g., user selects a destination)
     */
    triggerContextualAdvice(contextData) {
      if (contextData.type === 'route_selected') {
        this.addMessage(`I found ${contextData.routesCount} possible routes. **Route A** is highly recommended—it's 12% safer than the alternatives today.`, '✨', 1500);
        this.setSuggestions(['Why is Route A safer?', 'Show me the fastest instead', 'Are there any road closures?']);
        
        if (!this.isOpen) {
          setTimeout(() => {
              if (window.showNotification) {
                  window.showNotification('AI Recommendation', {
                      type: 'ai',
                      description: 'I found a safer route for your destination. Tap to view.'
                  });
              }
          }, 1600);
        }
      }
    }
  }
  
  // Expose to global scope
  window.AIPanel = AIPanel;
  
  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
      window.aiAssistant = new window.AIPanel();
  });
