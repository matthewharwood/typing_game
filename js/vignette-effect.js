class VignetteEffect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  disconnectedCallback() {
    this.removeListeners();
  }

  setupListeners() {
    // Listen for wrong key events
    this.wrongKeyHandler = () => {
      this.pulse();
    };
    window.addEventListener('wrongKey', this.wrongKeyHandler);
  }

  removeListeners() {
    if (this.wrongKeyHandler) {
      window.removeEventListener('wrongKey', this.wrongKeyHandler);
    }
  }

  pulse() {
    const vignette = this.shadowRoot.querySelector('.vignette');
    if (!vignette) return;
    
    // Remove animation class to reset it
    vignette.classList.remove('pulse');
    
    // Force reflow to restart animation
    void vignette.offsetWidth;
    
    // Add animation class
    vignette.classList.add('pulse');
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
          pointer-events: none;
          z-index: 9998;
        }
        
        .vignette {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 40%,
            rgba(255, 0, 0, 0.15) 70%,
            rgba(255, 0, 0, 0.25) 100%
          );
          box-shadow: inset 0 0 100px rgba(255, 0, 0, 0.3);
        }
        
        .vignette.pulse {
          animation: vignettePulse 0.3s ease-out;
        }
        
        @keyframes vignettePulse {
          0% {
            opacity: 0;
            transform: scale(1.1);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }
      </style>
      <div class="vignette"></div>
    `;
  }
}

customElements.define('vignette-effect', VignetteEffect);

// Create global function to trigger the effect
window.triggerWrongKeyVignette = () => {
  window.dispatchEvent(new Event('wrongKey'));
};

export default VignetteEffect;