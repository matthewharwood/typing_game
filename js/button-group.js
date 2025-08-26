class ButtonGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.activeMode = localStorage.getItem('activeMode') || 'single';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    // Emit initial mode on load
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('modeChange', {
        detail: { mode: this.activeMode },
        bubbles: true,
        composed: true
      }));
    }, 0);
  }

  setupEventListeners() {
    this.shadowRoot.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button) {
        const mode = button.dataset.mode;
        if (mode !== this.activeMode) {
          this.activeMode = mode;
          localStorage.setItem('activeMode', mode);
          this.render();
          this.dispatchEvent(new CustomEvent('modeChange', {
            detail: { mode },
            bubbles: true,
            composed: true
          }));
        }
      }
    });
    
    // Listen for reset event
    window.addEventListener('resetProgress', () => {
      localStorage.removeItem('activeMode');
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          gap: 8px;
        }
        
        button {
          font-family: var(--font-typewriter, monospace);
          font-size: 16px;
          font-weight: var(--font-weight-bold, 700);
          padding: 12px 24px;
          border: 2px solid var(--cyan-500, oklch(71.5% 0.143 215.221));
          border-radius: 8px;
          background: white;
          color: var(--cyan-800, oklch(30.2% 0.056 229.695));
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        button:hover:not(.active) {
          background: var(--cyan-300, oklch(91.7% 0.08 205.041));
        }
        
        button.active {
          background: var(--cyan-500, oklch(71.5% 0.143 215.221));
          color: white;
        }
      </style>
      <button data-mode="single" class="${this.activeMode === 'single' ? 'active' : ''}">
        Single Letter
      </button>
      <button data-mode="sentence" class="${this.activeMode === 'sentence' ? 'active' : ''}">
        Sentence
      </button>
    `;
  }
}

customElements.define('button-group', ButtonGroup);

export default ButtonGroup;