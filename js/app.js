import './letter-display.js';
import './visual-keyboard.js';
import './button-group.js';
import './sentence-display.js';
import './reset-button.js';
import './typing-stats.js';
import './score-card.js';
import './particle-effect.js';

// Initialize score card listener
window.addEventListener('DOMContentLoaded', () => {
  const scoreCard = document.querySelector('score-card');
  
  window.addEventListener('sentenceComplete', (e) => {
    if (scoreCard) {
      scoreCard.show(e.detail.time, e.detail.wpm);
    }
  });
});