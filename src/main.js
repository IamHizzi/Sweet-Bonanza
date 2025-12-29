/**
 * Sweet Bonanza - Main Entry Point
 * Production-grade HTML5 Cluster Slot Game
 */

import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

/**
 * Phaser game configuration
 */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a0033',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  physics: {
    default: false
  },
  scene: [GameScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  audio: {
    disableWebAudio: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  banner: {
    hidePhaser: true,
    text: '#ffffff',
    background: [
      '#667eea',
      '#764ba2',
      '#667eea',
      '#764ba2'
    ]
  }
};

/**
 * Initialize game
 */
function initGame() {
  console.log('[SweetBonanza] Initializing game...');

  // Create Phaser game instance
  const game = new Phaser.Game(config);

  // Global error handling
  window.addEventListener('error', (event) => {
    console.error('[SweetBonanza] Runtime error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[SweetBonanza] Unhandled promise rejection:', event.reason);
  });

  // Expose game instance for debugging
  if (import.meta.env.DEV) {
    window.__SWEET_BONANZA_GAME__ = game;
  }

  // Handle window visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('[SweetBonanza] Game paused (tab hidden)');
      game.sound.pauseAll();
    } else {
      console.log('[SweetBonanza] Game resumed (tab visible)');
      game.sound.resumeAll();
    }
  });

  console.log('[SweetBonanza] Game initialized successfully');

  return game;
}

// Start game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

export default initGame;
