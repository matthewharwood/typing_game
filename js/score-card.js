class ScoreCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.countdown = 5;
    this.timer = null;
    this.fireCanvas = null;
    this.fireCtx = null;
    this.fireAnimation = null;
    this.particles = [];
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
    this.initFireEffect();
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
    
    if (this.fireAnimation) {
      cancelAnimationFrame(this.fireAnimation);
      this.fireAnimation = null;
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

  getFireColors() {
    const speed = Math.round(this.wpm || 0);
    
    // Determine fire level based on WPM/LPM
    if (this.mode === 'single') {
      // For single letter mode (letters per minute)
      if (speed >= 40) {
        // Blue fire - excellent!
        return {
          colors: [
            'oklch(96.7% 0.064 214.3)',  // blue-100
            'oklch(86.8% 0.121 221.4)',  // blue-300
            'oklch(71.5% 0.143 215.2)',  // blue-500
            'oklch(50.8% 0.237 241.2)'   // blue-700
          ],
          intensity: 1.2
        };
      } else if (speed >= 25) {
        // Red fire - great!
        return {
          colors: [
            'oklch(95.7% 0.039 15.8)',   // red-100
            'oklch(86.4% 0.114 18.7)',   // red-300
            'oklch(64.5% 0.246 16.4)',   // red-500
            'oklch(50.0% 0.199 21.7)'    // red-700
          ],
          intensity: 1.0
        };
      } else if (speed >= 15) {
        // Orange fire - good!
        return {
          colors: [
            'oklch(97.2% 0.037 75.8)',   // orange-100
            'oklch(90.8% 0.096 62.3)',   // orange-300
            'oklch(75.0% 0.183 47.5)',   // orange-500
            'oklch(57.4% 0.184 44.6)'    // orange-700
          ],
          intensity: 0.8
        };
      }
    } else {
      // For sentence mode (words per minute)
      if (speed >= 20) {
        // Blue fire
        return {
          colors: [
            'oklch(96.7% 0.064 214.3)',
            'oklch(86.8% 0.121 221.4)',
            'oklch(71.5% 0.143 215.2)',
            'oklch(50.8% 0.237 241.2)'
          ],
          intensity: 1.2
        };
      } else if (speed >= 12) {
        // Red fire
        return {
          colors: [
            'oklch(95.7% 0.039 15.8)',
            'oklch(86.4% 0.114 18.7)',
            'oklch(64.5% 0.246 16.4)',
            'oklch(50.0% 0.199 21.7)'
          ],
          intensity: 1.0
        };
      } else if (speed >= 7) {
        // Orange fire
        return {
          colors: [
            'oklch(97.2% 0.037 75.8)',
            'oklch(90.8% 0.096 62.3)',
            'oklch(75.0% 0.183 47.5)',
            'oklch(57.4% 0.184 44.6)'
          ],
          intensity: 0.8
        };
      }
    }
    
    // No fire for low scores
    return null;
  }

  initFireEffect() {
    const fireConfig = this.getFireColors();
    if (!fireConfig) return;
    
    this.fireCanvas = this.shadowRoot.querySelector('.fire-canvas');
    if (!this.fireCanvas) return;
    
    this.fireCtx = this.fireCanvas.getContext('2d');
    const rect = this.fireCanvas.getBoundingClientRect();
    this.fireCanvas.width = rect.width;
    this.fireCanvas.height = rect.height;
    
    // Initialize particles with staggered creation
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      const particle = this.createParticle(fireConfig);
      // Stagger initial positions for fuller flame
      particle.y -= Math.random() * 30;
      particle.life = Math.random() * 0.5 + 0.5;
      this.particles.push(particle);
    }
    
    this.animateFire(fireConfig);
  }

  createParticle(fireConfig) {
    const centerX = this.fireCanvas.width / 2;
    const spread = 30; // How wide the base of the flame is
    return {
      x: centerX + (Math.random() - 0.5) * spread,
      y: this.fireCanvas.height - 20, // Start from bottom of number
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 4 - 3, // Upward velocity
      size: Math.random() * 12 + 8,
      life: 1.0,
      decay: Math.random() * 0.015 + 0.01,
      color: fireConfig.colors[Math.floor(Math.random() * fireConfig.colors.length)]
    };
  }

  animateFire(fireConfig) {
    if (!this.fireCtx || !fireConfig) return;
    
    this.fireCtx.globalCompositeOperation = 'screen';
    this.fireCtx.clearRect(0, 0, this.fireCanvas.width, this.fireCanvas.height);
    
    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update particle
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.vy -= 0.08; // Slight upward acceleration
      p.vx *= 0.98; // Slow horizontal movement
      p.size *= 0.97; // Shrink
      
      // Remove dead particles
      if (p.life <= 0 || p.size < 1) {
        this.particles.splice(i, 1);
        this.particles.push(this.createParticle(fireConfig));
        continue;
      }
      
      // Draw particle
      const gradient = this.fireCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.5, p.color.replace(/[\d.]+\)$/, `${p.life * 0.5})`));
      gradient.addColorStop(1, 'transparent');
      
      this.fireCtx.fillStyle = gradient;
      this.fireCtx.beginPath();
      this.fireCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.fireCtx.fill();
    }
    
    this.fireAnimation = requestAnimationFrame(() => this.animateFire(fireConfig));
  }

  render() {
    const fireConfig = this.getFireColors();
    const hasFireEffect = fireConfig !== null;
    
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
        
        .stat.with-fire {
          position: relative;
        }
        
        .fire-canvas {
          position: absolute;
          width: 150px;
          height: 120px;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          z-index: -1;
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
          <div class="stat ${hasFireEffect ? 'with-fire' : ''}">
            ${hasFireEffect ? '<canvas class="fire-canvas"></canvas>' : ''}
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