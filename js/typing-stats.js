class TypingStats extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.startTime = Date.now();
    this.correctKeystrokes = 0;
    this.currentMode = 'single';
    this.timer = null;
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this.startTimer();
  }

  disconnectedCallback() {
    this.stopTimer();
    this.removeListeners();
  }

  setupListeners() {
    // Listen for mode changes
    this.modeHandler = (e) => {
      this.currentMode = e.detail.mode;
      this.reset();
    };
    document.addEventListener('modeChange', this.modeHandler);

    // Listen for correct keystrokes
    this.keystrokeHandler = (e) => {
      const pressedKey = e.key.toUpperCase();
      
      // Check if this is coming from letter-display or sentence-display
      if (this.currentMode === 'single') {
        // In single mode, listen for any letter key
        if (pressedKey.length === 1 && /[A-Z]/.test(pressedKey)) {
          // We'll count it as correct if it matches (handled by letter-display)
          this.correctKeystrokes++;
        }
      }
    };
    window.addEventListener('keydown', this.keystrokeHandler);

    // Listen for correct key events from components
    this.correctHandler = () => {
      this.correctKeystrokes++;
    };
    window.addEventListener('correctKey', this.correctHandler);

    // Listen for reset
    this.resetHandler = () => {
      this.reset();
    };
    window.addEventListener('resetProgress', this.resetHandler);
  }

  removeListeners() {
    if (this.modeHandler) document.removeEventListener('modeChange', this.modeHandler);
    if (this.keystrokeHandler) window.removeEventListener('keydown', this.keystrokeHandler);
    if (this.correctHandler) window.removeEventListener('correctKey', this.correctHandler);
    if (this.resetHandler) window.removeEventListener('resetProgress', this.resetHandler);
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.updateDisplay();
    }, 50); // OPTIMIZED: 20fps is smooth enough, saves CPU (was 100fps)
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  reset() {
    this.startTime = Date.now();
    this.correctKeystrokes = 0;
    this.updateDisplay();
  }

  updateDisplay() {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const milliseconds = Math.floor((elapsed % 1000) / 10); // Show 2 digits
    
    const timeDisplay = `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    
    // Calculate rate
    const minutes = elapsed / 60000;
    let rate = 0;
    let rateLabel = '';
    
    if (minutes > 0) {
      if (this.currentMode === 'single') {
        rate = Math.round(this.correctKeystrokes / minutes);
        rateLabel = 'Letters/Min';
      } else {
        // In sentence mode, words = characters / 5
        const words = this.correctKeystrokes / 5;
        rate = Math.round(words / minutes);
        rateLabel = 'Words/Min';
      }
    }
    
    const timeElement = this.shadowRoot.querySelector('.time');
    const rateElement = this.shadowRoot.querySelector('.rate');
    
    if (timeElement) timeElement.textContent = timeDisplay;
    if (rateElement) rateElement.textContent = `${rate} ${rateLabel}`;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-sans, 'Source Sans 3', sans-serif);
          font-weight: var(--font-weight-black, 900);
          color: var(--cyan-600, oklch(52% 0.105 223.128));
          font-size: 14px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          user-select: none;
          display: flex;
          gap: 20px;
          align-items: center;
          opacity: 0.8;
        }
        
        .time, .rate {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .separator {
          color: var(--cyan-600, oklch(52% 0.105 223.128));
          opacity: 0.6;
        }
      </style>
      <div class="time">00:00</div>
      <div class="separator">|</div>
      <div class="rate">0 ${this.currentMode === 'single' ? 'Letters/Min' : 'Words/Min'}</div>
    `;
  }
}

customElements.define('typing-stats', TypingStats);

export default TypingStats;