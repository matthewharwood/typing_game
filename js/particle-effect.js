class ParticleEffect {
  constructor() {
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.colors = [
      'oklch(91.7% 0.08 205.041)',  // cyan-300
      'oklch(71.5% 0.143 215.221)', // cyan-500
      'oklch(52% 0.105 223.128)',   // cyan-600
      '#ffffff',
      '#00ffff',
      '#00ccff',
      '#0099ff'
    ];
  }

  init() {
    // Create background canvas (for particles going behind)
    if (!this.canvasBg) {
      this.canvasBg = document.createElement('canvas');
      this.canvasBg.style.position = 'fixed';
      this.canvasBg.style.top = '0';
      this.canvasBg.style.left = '0';
      this.canvasBg.style.width = '100%';
      this.canvasBg.style.height = '100%';
      this.canvasBg.style.pointerEvents = 'none';
      this.canvasBg.style.zIndex = '998';
      document.body.appendChild(this.canvasBg);
      
      this.ctxBg = this.canvasBg.getContext('2d');
    }
    
    // Create foreground canvas (for particles going in front)
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '10000';
      document.body.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
      this.updateCanvasSize();
      
      window.addEventListener('resize', () => this.updateCanvasSize());
    }
  }

  updateCanvasSize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    if (this.canvasBg) {
      this.canvasBg.width = window.innerWidth;
      this.canvasBg.height = window.innerHeight;
    }
  }

  createParticle(x, y, originX) {
    // Particles shoot upward and outward from top of letter
    const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8; // Mostly upward
    const velocity = 3 + Math.random() * 5;
    const lifetime = 30 + Math.random() * 30;
    const size = 2 + Math.random() * 3;
    
    const particle = {
      x: x,
      y: y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: lifetime,
      maxLife: lifetime,
      size: size,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      originX: originX // Store original X to determine which side particle is on
    };
    
    // Determine if particle goes in front (left side) or behind (right side)
    particle.layer = particle.vx < 0 ? 'front' : 'back';
    
    return particle;
  }

  explode(x, y) {
    this.init();
    
    // REDUCED particle count for performance (8-12 instead of 15-25)
    const particleCount = 8 + Math.floor(Math.random() * 4);
    const topY = y - 40; // Start from top of letter
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle(x, topY, x));
    }
    
    if (!this.animationId) {
      this.animate();
    }
  }

  explodeAtElement(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    this.explode(x, y);
  }

  animate() {
    // Clear both canvases
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctxBg.clearRect(0, 0, this.canvasBg.width, this.canvasBg.height);
    
    // OPTIMIZED: Single pass update and draw
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update physics (simplified operations)
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life--;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Draw immediately based on layer (no intermediate arrays)
      const ctx = particle.layer === 'front' ? this.ctx : this.ctxBg;
      this.drawParticle(ctx, particle);
    }
    
    
    // Continue animation if there are particles
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationId = null;
    }
  }
  
  drawParticle(ctx, particle) {
    // Calculate alpha based on life
    const lifeRatio = particle.life / particle.maxLife;
    const alpha = lifeRatio;
    
    // OPTIMIZED: Removed shadows and reduced draw calls
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = particle.color;
    
    // Single circle instead of glow + core (massive performance gain)
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Create singleton instance
const particleEffect = new ParticleEffect();

// Export for use in other components
window.particleEffect = particleEffect;

export default particleEffect;