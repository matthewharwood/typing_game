class AudioManager {
  constructor() {
    this.audioContext = null;
    this.buffers = {};
    this.initialized = false;
    this.volume = 0.3; // Lower volume for less jarring sounds
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Create Web Audio API context for zero-latency playback
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load all sound files
      await Promise.all([
        this.loadSound('correct', 'img/correct.mp3'),
        this.loadSound('wrong', 'img/wrong.mp3'),
        this.loadSound('win', 'img/win.mp3')
      ]);
      
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not available, falling back to Audio element');
      this.useFallback();
    }
  }

  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
    } catch (error) {
      console.error(`Failed to load ${name} sound:`, error);
    }
  }

  play(soundName) {
    if (!this.initialized || !this.audioContext) {
      this.playFallback(soundName);
      return;
    }

    const buffer = this.buffers[soundName];
    if (!buffer) return;

    try {
      // Create a new source node for each playback (allows overlap)
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Play immediately
      source.start(0);
    } catch (error) {
      console.error('Error playing sound:', error);
      this.playFallback(soundName);
    }
  }

  // Fallback audio pool for browsers without Web Audio API
  useFallback() {
    this.audioPool = {
      correct: this.createAudioPool('img/correct.mp3', 3),
      wrong: this.createAudioPool('img/wrong.mp3', 3),
      win: this.createAudioPool('img/win.mp3', 2)
    };
    this.initialized = true;
  }

  createAudioPool(url, size) {
    const pool = [];
    for (let i = 0; i < size; i++) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.volume;
      pool.push(audio);
    }
    return { pool, currentIndex: 0 };
  }

  playFallback(soundName) {
    if (!this.audioPool || !this.audioPool[soundName]) return;
    
    const soundPool = this.audioPool[soundName];
    const audio = soundPool.pool[soundPool.currentIndex];
    
    // Reset and play
    audio.currentTime = 0;
    const playPromise = audio.play();
    
    // Handle play promise to avoid console errors
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Silently handle autoplay errors
      });
    }
    
    // Rotate to next audio in pool
    soundPool.currentIndex = (soundPool.currentIndex + 1) % soundPool.pool.length;
  }

  // Initialize on first user interaction
  async initOnInteraction() {
    if (!this.initialized) {
      await this.init();
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Create singleton instance
const audioManager = new AudioManager();

// Initialize on first user interaction
document.addEventListener('keydown', () => {
  audioManager.initOnInteraction();
}, { once: true });

// Also try to initialize on click
document.addEventListener('click', () => {
  audioManager.initOnInteraction();
}, { once: true });

// Export for use in components
window.audioManager = audioManager;

export default audioManager;