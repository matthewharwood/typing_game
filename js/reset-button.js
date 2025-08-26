class ResetButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListener();
  }

  setupEventListener() {
    this.shadowRoot.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button) {
        const confirmed = confirm('Reset all progress? This will clear which letters have been practiced and reset to Single Letter mode.');
        if (confirmed) {
          // Clear all localStorage
          localStorage.clear();
          // Dispatch reset event
          window.dispatchEvent(new Event('resetProgress'));
          // Reload page to ensure clean state
          window.location.reload();
        }
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          left: 20px;
        }
        
        button {
          font-family: var(--font-typewriter, monospace);
          font-size: 12px;
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #f5f5f5;
          color: #666;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }
        
        button:hover {
          opacity: 0.8;
          background: #eee;
        }
      </style>
      <button>Reset</button>
    `;
  }
}

customElements.define('reset-button', ResetButton);

export default ResetButton;