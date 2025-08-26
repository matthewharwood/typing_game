class LetterDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentLetter = this.getRandomLetter();
    this.correctSound = new Audio('img/correct.mp3');
    this.wrongSound = new Audio('img/wrong.mp3');
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
        }
        
        .letter:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
      </style>
      <div class="letter">${this.currentLetter}</div>
    `;
  }
}

customElements.define('letter-display', LetterDisplay);

export default LetterDisplay;