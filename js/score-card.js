class ScoreCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.countdown = 5;
    this.timer = null;
  }

  connectedCallback() {
    this.render();
    this.hide();
  }

  show(timeInSeconds, wpm, mistakes = 0, mode = 'sentence') {
    this.timeInSeconds = timeInSeconds;
    this.wpm = wpm;
    this.mistakes = mistakes;
    this.mode = mode;
    this.countdown = mode === 'single' ? 10 : 5;
    this.style.display = 'flex';
    
    // Play win sound
    if (window.audioManager) {
      window.audioManager.play('win');
    }
    
    // Add blur to all elements except score card
    const elements = document.querySelectorAll('body > *:not(score-card)');
    elements.forEach(el => {
      el.style.filter = 'blur(8px)';
    });
    
    this.render();
    this.startCountdown();
  }

  hide() {
    this.style.display = 'none';
    
    // Remove blur from all elements
    const elements = document.querySelectorAll('body > *');
    elements.forEach(el => {
      el.style.filter = '';
    });
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startCountdown() {
    this.timer = setInterval(() => {
      this.countdown--;
      this.updateCountdown();
      
      if (this.countdown <= 0) {
        this.hide();
        if (this.mode === 'single') {
          // Clear single letter stats and restart
          window.dispatchEvent(new Event('resetSingleLetter'));
        } else {
          // Dispatch event to load next sentence
          window.dispatchEvent(new Event('nextSentence'));
        }
      }
    }, 1000);
  }

  updateCountdown() {
    const countdownEl = this.shadowRoot.querySelector('.countdown');
    if (countdownEl) {
      countdownEl.textContent = this.countdown;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${secs}.${ms.toString().padStart(2, '0')}s`;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .card {
          background: white;
          border-radius: 24px;
          padding: 48px 80px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          font-family: var(--font-sans, 'Source Sans 3', sans-serif);
          animation: slideUp 0.4s ease-out;
          position: relative;
          min-width: 500px;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .title {
          font-size: 24px;
          font-weight: var(--font-weight-black, 900);
          color: var(--cyan-600, oklch(52% 0.105 223.128));
          margin-bottom: 32px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .stats {
          display: flex;
          gap: 48px;
          justify-content: center;
          margin-bottom: 40px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-value {
          font-size: 48px;
          font-weight: var(--font-weight-black, 900);
          color: var(--cyan-500, oklch(71.5% 0.143 215.221));
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          font-weight: var(--font-weight-bold, 700);
          color: var(--cyan-800, oklch(30.2% 0.056 229.695));
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .countdown-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 16px;
          color: var(--cyan-600, oklch(52% 0.105 223.128));
        }
        
        .countdown {
          font-size: 32px;
          font-weight: var(--font-weight-black, 900);
          color: var(--cyan-500, oklch(71.5% 0.143 215.221));
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--cyan-500, oklch(71.5% 0.143 215.221));
          border-radius: 50%;
          animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        .next-text {
          font-weight: var(--font-weight-bold, 700);
        }
      </style>
      <div class="card">
        <div class="title">Great Job!</div>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${this.formatTime(this.timeInSeconds || 0)}</div>
            <div class="stat-label">Time</div>
          </div>
          <div class="stat">
            <div class="stat-value">${Math.round(this.wpm || 0)}</div>
            <div class="stat-label">${this.mode === 'single' ? 'Letters/Min' : 'Words/Min'}</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: var(--rose-500, oklch(64.5% 0.246 16.439));">${this.mistakes || 0}</div>
            <div class="stat-label">Mistakes</div>
          </div>
        </div>
        <div class="countdown-container">
          <span class="next-text">Next sentence in</span>
          <div class="countdown">${this.countdown}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('score-card', ScoreCard);

export default ScoreCard;