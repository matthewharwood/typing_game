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
    
    // Create 15-25 particles from top of the letter position
    const particleCount = 15 + Math.floor(Math.random() * 10);
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
    
    // Separate particles by layer
    const frontParticles = [];
    const backParticles = [];
    
    // Update and categorize particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity
      particle.vy += 0.3;
      
      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Update life
      particle.life--;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Sort into layers
      if (particle.layer === 'front') {
        frontParticles.push(particle);
      } else {
        backParticles.push(particle);
      }
    }
    
    // Draw back layer particles (behind letter)
    backParticles.forEach(particle => {
      this.drawParticle(this.ctxBg, particle);
    });
    
    // Draw front layer particles (in front of letter)
    frontParticles.forEach(particle => {
      this.drawParticle(this.ctx, particle);
    });
    
    
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
    
    // Draw particle with glow effect
    ctx.save();
    
    // Draw glow
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw particle core
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// Create singleton instance
const particleEffect = new ParticleEffect();

// Export for use in other components
window.particleEffect = particleEffect;

export default particleEffect;