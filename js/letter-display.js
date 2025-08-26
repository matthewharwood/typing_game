class LetterDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentLetter = this.getRandomLetter();
    this.correctSound = new Audio('img/correct.mp3');
    this.wrongSound = new Audio('img/wrong.mp3');
    // Preload sounds
    this.correctSound.preload = 'auto';
    this.wrongSound.preload = 'auto';
    this.isVisible = true;
  }

  getRandomLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
  }

  connectedCallback() {
    this.render();
    this.setupKeyboardListener();
    this.setupModeListener();
  }

  disconnectedCallback() {
    this.removeKeyboardListener();
    this.removeModeListener();
  }

  setupModeListener() {
    this.modeHandler = (e) => {
      if (e.detail.mode === 'single') {
        this.isVisible = true;
        this.style.display = 'flex';
      } else {
        this.isVisible = false;
        this.style.display = 'none';
      }
    };
    document.addEventListener('modeChange', this.modeHandler);
  }

  removeModeListener() {
    if (this.modeHandler) {
      document.removeEventListener('modeChange', this.modeHandler);
    }
  }

  setupKeyboardListener() {
    this.keyHandler = (e) => {
      // Only process keys if visible (in single letter mode)
      if (!this.isVisible) return;
      
      const pressedKey = e.key.toUpperCase();
      if (pressedKey.length === 1 && /[A-Z]/.test(pressedKey)) {
        if (pressedKey === this.currentLetter) {
          this.correctSound.currentTime = 0;
          this.correctSound.play();
          
          // Create particle explosion effect
          if (window.particleEffect) {
            const letterElement = this.shadowRoot.querySelector('.letter');
            if (letterElement) {
              const rect = letterElement.getBoundingClientRect();
              window.particleEffect.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
          }
          
          // Dispatch correct key event for stats
          window.dispatchEvent(new Event('correctKey'));
          this.currentLetter = this.getRandomLetter();
          this.render();
        } else {
          this.wrongSound.currentTime = 0;
          this.wrongSound.play();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  removeKeyboardListener() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .letter {
          font-size: var(--text-4xl, 36px);
          font-family: var(--font-typewriter, monospace);
          font-weight: var(--font-weight-bold, 700);
          color: #222;
          border: 4px solid var(--cyan-500, oklch(71.5% 0.143 215.221));
          border-radius: 12px;
          padding: var(--spacing-8, 32px) var(--spacing-12, 48px);
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.1s linear; /* FASTER & SIMPLER */
          transform: translateZ(0); /* GPU LAYER */
          will-change: transform; /* OPTIMIZATION HINT */
          user-select: none;
        }
        
        .letter:hover {
          transform: translateZ(0) scale(1.05); /* MAINTAIN GPU LAYER */
        }
      </style>
      <div class="letter">${this.currentLetter}</div>
    `;
  }
}

customElements.define('letter-display', LetterDisplay);

export default LetterDisplay;