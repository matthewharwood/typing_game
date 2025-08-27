class SentenceDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sentences = [
      "The cat sat on the mat",
      "I like to play with my toys",
      "The sun is bright today",
      "My dog loves to run fast",
      "We can jump and play",
      "I see a big red ball",
      "The bird can fly high",
      "Mom makes good food",
      "Dad reads me a book",
      "I love my family",
      "The fish swims in water",
      "Trees are very tall",
      "I can count to ten",
      "My bike is blue",
      "The moon comes out at night",
      "I brush my teeth every day",
      "We go to the park",
      "My friend is nice",
      "I like to draw pictures",
      "The car goes fast",
      "Flowers smell good",
      "I eat lunch at noon",
      "The baby is sleeping",
      "We play fun games",
      "I wear my favorite shirt",
      "The cookie tastes sweet",
      "Rain makes puddles",
      "I can tie my shoes",
      "The clock tells time",
      "We sing happy songs",
      "My room is clean",
      "The bunny hops around",
      "I help my mom",
      "Stars shine at night",
      "We read books together",
      "The train goes choo choo",
      "I wash my hands",
      "The apple is red",
      "We build with blocks",
      "My teddy bear is soft",
      "The wind blows leaves",
      "I drink cold milk",
      "We share our toys",
      "The grass is green",
      "I wake up early",
      "The bee buzzes around",
      "We eat breakfast together",
      "My shoes are new",
      "The snow is white",
      "I learn new things"
    ];
    
    this.loadState();
    this.isVisible = false;
    this.sentenceStartTime = null;
    this.charactersTyped = 0;
    this.wrongKeystrokes = 0;
    this.saveTimeout = null; // For throttling saves
  }

  loadState() {
    const savedSentence = localStorage.getItem('currentSentence');
    const savedIndex = localStorage.getItem('currentIndex');
    const savedStartTime = localStorage.getItem('sentenceStartTime');
    const savedCharactersTyped = localStorage.getItem('charactersTyped');
    const savedWrongKeystrokes = localStorage.getItem('wrongKeystrokes');
    
    if (savedSentence) {
      this.currentSentence = savedSentence;
      this.currentIndex = parseInt(savedIndex) || 0;
      this.sentenceStartTime = savedStartTime ? parseInt(savedStartTime) : Date.now();
      this.charactersTyped = parseInt(savedCharactersTyped) || this.currentIndex;
      this.wrongKeystrokes = parseInt(savedWrongKeystrokes) || 0;
    } else {
      this.currentSentence = "";
      this.currentIndex = 0;
      this.sentenceStartTime = Date.now();
      this.charactersTyped = 0;
      this.wrongKeystrokes = 0;
    }
  }

  saveState() {
    // THROTTLE saves to reduce I/O overhead
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    
    this.saveTimeout = setTimeout(() => {
      localStorage.setItem('currentSentence', this.currentSentence);
      localStorage.setItem('currentIndex', this.currentIndex.toString());
      localStorage.setItem('sentenceStartTime', this.sentenceStartTime.toString());
      localStorage.setItem('charactersTyped', this.charactersTyped.toString());
      localStorage.setItem('wrongKeystrokes', this.wrongKeystrokes.toString());
    }, 100); // Save after 100ms of inactivity
  }

  connectedCallback() {
    if (!this.currentSentence) {
      this.reset();
    }
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
      if (e.detail.mode === 'sentence') {
        this.show();
      } else {
        this.hide();
      }
    };
    document.addEventListener('modeChange', this.modeHandler);
    
    // Listen for next sentence event from score card
    window.addEventListener('nextSentence', () => {
      if (this.isVisible) {
        this.reset();
      }
    });
  }

  removeModeListener() {
    if (this.modeHandler) {
      document.removeEventListener('modeChange', this.modeHandler);
    }
  }

  show() {
    this.isVisible = true;
    this.reset();
    this.style.display = 'flex';
  }

  hide() {
    this.isVisible = false;
    this.style.display = 'none';
  }

  reset() {
    this.currentSentence = this.sentences[Math.floor(Math.random() * this.sentences.length)].toUpperCase();
    this.currentIndex = 0;
    this.sentenceStartTime = Date.now();
    this.charactersTyped = 0;
    this.wrongKeystrokes = 0;
    this.saveState();
    this.render();
  }

  setupKeyboardListener() {
    this.keyHandler = (e) => {
      if (!this.isVisible) return;
      
      // Handle space separately since it doesn't uppercase
      const pressedKey = e.key === ' ' ? ' ' : e.key.toUpperCase();
      const currentChar = this.currentSentence[this.currentIndex];
      
      // Check if the pressed key matches the current character
      if (pressedKey === currentChar) {
        // Play sound with zero latency
        if (window.audioManager) {
          window.audioManager.play('correct');
        }
        
        // Create particle explosion effect at the active letter
        if (window.particleEffect) {
          const activeLetterElement = this.shadowRoot.querySelector('.letter.active');
          if (activeLetterElement) {
            const rect = activeLetterElement.getBoundingClientRect();
            window.particleEffect.explode(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }
        
        // Dispatch correct key event for stats
        window.dispatchEvent(new Event('correctKey'));
        this.currentIndex++;
        this.charactersTyped++;
        this.saveState();
        
        if (this.currentIndex >= this.currentSentence.length) {
          // Calculate stats
          const timeElapsed = (Date.now() - this.sentenceStartTime) / 1000; // in seconds
          const words = this.charactersTyped / 5; // 5 chars = 1 word
          const wpm = (words / timeElapsed) * 60;
          
          // Show score card with mistakes count
          window.dispatchEvent(new CustomEvent('sentenceComplete', {
            detail: { time: timeElapsed, wpm: wpm, mistakes: this.wrongKeystrokes }
          }));
        } else {
          this.render();
        }
      } else if (pressedKey.length === 1) {
        // Track wrong keystroke
        this.wrongKeystrokes++;
        this.saveState();
        
        // Play wrong sound with zero latency
        if (window.audioManager) {
          window.audioManager.play('wrong');
        }
        // Trigger red vignette pulse
        window.dispatchEvent(new Event('wrongKey'));
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    
    // Listen for reset event
    window.addEventListener('resetProgress', () => {
      localStorage.removeItem('currentSentence');
      localStorage.removeItem('currentIndex');
      localStorage.removeItem('sentenceStartTime');
      localStorage.removeItem('charactersTyped');
      localStorage.removeItem('wrongKeystrokes');
      this.currentSentence = "";
      this.currentIndex = 0;
      this.sentenceStartTime = Date.now();
      this.charactersTyped = 0;
      this.wrongKeystrokes = 0;
      if (this.isVisible) {
        this.reset();
      }
    });
  }

  removeKeyboardListener() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }

  render() {
    if (!this.currentSentence) return;
    
    const letters = this.currentSentence.split('').map((char, index) => {
      const isActive = index === this.currentIndex;
      const isPassed = index < this.currentIndex;
      return `<span class="letter ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}">${char === ' ' ? '&nbsp;' : char}</span>`;
    }).join('');

    // Calculate offset to keep active letter centered
    const offsetX = window.innerWidth / 2 - (this.currentIndex * 60);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 100%;
          height: 100px;
          justify-content: flex-start;
          align-items: center;
          overflow: hidden;
        }
        
        .sentence-container {
          display: flex;
          align-items: center;
          height: 100%;
          position: absolute;
          transition: transform 0.15s linear; /* FASTER & LINEAR */
          transform: translate3d(${offsetX}px, 0, 0); /* GPU ACCELERATION */
          will-change: transform; /* HINT TO BROWSER */
        }
        
        .letter {
          font-family: var(--font-typewriter, monospace);
          font-size: var(--text-4xl, 36px);
          font-weight: var(--font-weight-bold, 700);
          color: #222;
          opacity: 0.3;
          width: 60px;
          height: 80px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.15s linear, border 0.1s linear; /* SELECTIVE & FASTER */
        }
        
        .letter.active {
          opacity: 1;
          border: 4px solid var(--cyan-500, oklch(71.5% 0.143 215.221));
          border-radius: 12px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* LIGHTER SHADOW */
          transform: translateZ(0); /* FORCE GPU LAYER */
          will-change: opacity, border; /* OPTIMIZATION HINT */
        }
        
        .letter.passed {
          opacity: 0.5;
          color: var(--cyan-600, oklch(52% 0.105 223.128));
        }
      </style>
      <div class="sentence-container">
        ${letters}
      </div>
    `;
  }
}

customElements.define('sentence-display', SentenceDisplay);

export default SentenceDisplay;