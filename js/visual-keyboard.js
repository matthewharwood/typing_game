class VisualKeyboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadPressedKeys();
    
    this.keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
  }

  loadPressedKeys() {
    const saved = localStorage.getItem('pressedKeys');
    this.pressedKeys = saved ? new Set(JSON.parse(saved)) : new Set();
  }

  savePressedKeys() {
    localStorage.setItem('pressedKeys', JSON.stringify(Array.from(this.pressedKeys)));
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
        this.style.display = 'block';
      } else {
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
      const pressedKey = e.key.toUpperCase();
      if (pressedKey.length === 1 && /[A-Z]/.test(pressedKey)) {
        this.pressedKeys.add(pressedKey);
        this.savePressedKeys();
        this.updateKeyState(pressedKey);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    
    // Listen for reset event
    this.resetHandler = () => {
      this.pressedKeys.clear();
      this.savePressedKeys();
      this.render();
    };
    window.addEventListener('resetProgress', this.resetHandler);
  }

  removeKeyboardListener() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    if (this.resetHandler) {
      window.removeEventListener('resetProgress', this.resetHandler);
    }
  }

  updateKeyState(key) {
    const keyElement = this.shadowRoot.querySelector(`[data-key="${key}"]`);
    if (keyElement) {
      keyElement.classList.add('pressed');
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          font-family: var(--font-typewriter, monospace);
        }
        
        .keyboard {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .row {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .key {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cyan-800, oklch(30.2% 0.056 229.695));
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: bold;
          transition: background 0.3s ease;
          cursor: default;
        }
        
        .key.pressed {
          background: var(--cyan-600, oklch(52% 0.105 223.128));
        }
      </style>
      <div class="keyboard">
        ${this.keyboardLayout.map((row, rowIndex) => `
          <div class="row">
            ${row.map(key => `
              <div class="key" data-key="${key}">${key}</div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
    
    // Restore pressed state for already pressed keys
    this.pressedKeys.forEach(key => {
      this.updateKeyState(key);
    });
  }
}

customElements.define('visual-keyboard', VisualKeyboard);

export default VisualKeyboard;