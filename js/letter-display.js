class LetterDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadLetterStats();
    this.currentLetter = this.getWeightedRandomLetter();
    this.isVisible = true;
    this.sessionStartTime = Date.now();
    this.correctCount = 0;
    this.wrongCount = 0;
  }

  loadLetterStats() {
    const saved = localStorage.getItem('letterPracticeCount');
    this.letterPracticeCount = saved ? JSON.parse(saved) : {};
    
    const savedWrong = localStorage.getItem('letterWrongCount');
    this.letterWrongCount = savedWrong ? JSON.parse(savedWrong) : {};
    
    // Initialize all letters with 0 count if not present
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of letters) {
      if (!this.letterPracticeCount[letter]) {
        this.letterPracticeCount[letter] = 0;
      }
      if (!this.letterWrongCount[letter]) {
        this.letterWrongCount[letter] = 0;
      }
    }
  }

  saveLetterStats() {
    localStorage.setItem('letterPracticeCount', JSON.stringify(this.letterPracticeCount));
    localStorage.setItem('letterWrongCount', JSON.stringify(this.letterWrongCount));
  }

  getWeightedRandomLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const availableLetters = [];
    const weights = [];
    
    // Check if all letters have been practiced 2 times
    let allComplete = true;
    for (const letter of letters) {
      if (this.letterPracticeCount[letter] < 2) {
        allComplete = false;
        // Weight: higher for unpracticed letters
        const weight = Math.max(1, 3 - this.letterPracticeCount[letter]);
        availableLetters.push(letter);
        weights.push(weight);
      }
    }
    
    // If all letters are complete, show score and reset
    if (allComplete) {
      this.showSingleLetterScore();
      return 'A'; // Default while waiting
    }
    
    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableLetters.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableLetters[i];
      }
    }
    
    return availableLetters[0];
  }

  showSingleLetterScore() {
    const timeElapsed = (Date.now() - this.sessionStartTime) / 1000;
    const lettersPerMinute = (this.correctCount / timeElapsed) * 60;
    
    // Dispatch event to show score card
    window.dispatchEvent(new CustomEvent('singleLetterComplete', {
      detail: { 
        time: timeElapsed, 
        lpm: lettersPerMinute,
        mistakes: this.wrongCount,
        mode: 'single'
      }
    }));
  }

  resetSingleLetterStats() {
    this.letterPracticeCount = {};
    this.letterWrongCount = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of letters) {
      this.letterPracticeCount[letter] = 0;
      this.letterWrongCount[letter] = 0;
    }
    this.saveLetterStats();
    this.sessionStartTime = Date.now();
    this.correctCount = 0;
    this.wrongCount = 0;
    this.currentLetter = this.getWeightedRandomLetter();
    this.render();
  }

  connectedCallback() {
    this.render();
    this.setupKeyboardListener();
    this.setupModeListener();
    
    // Listen for reset from score card
    window.addEventListener('resetSingleLetter', () => {
      this.resetSingleLetterStats();
      // Also clear visual keyboard
      localStorage.removeItem('pressedKeys');
      window.dispatchEvent(new Event('resetProgress'));
    });
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
          // Track correct letter
          this.letterPracticeCount[this.currentLetter]++;
          this.correctCount++;
          this.saveLetterStats();
          
          // Play sound with zero latency
          if (window.audioManager) {
            window.audioManager.play('correct');
          }
          
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
          this.currentLetter = this.getWeightedRandomLetter();
          this.render();
        } else {
          // Track wrong attempt
          this.letterWrongCount[this.currentLetter]++;
          this.wrongCount++;
          this.saveLetterStats();
          
          // Play wrong sound with zero latency
          if (window.audioManager) {
            window.audioManager.play('wrong');
          }
          // Trigger red vignette pulse
          window.dispatchEvent(new Event('wrongKey'));
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