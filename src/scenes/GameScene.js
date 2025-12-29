/**
 * Main Game Scene
 * Primary Phaser scene that orchestrates all game components
 */

import Phaser from 'phaser';
import GameConfig from '../config/GameConfig.js';
import GameAPI from '../api/GameAPI.js';
import MockGameAPI from '../api/MockGameAPI.js';
import SymbolManager from '../utils/SymbolManager.js';
import GridManager from '../core/GridManager.js';
import GameStateManager from '../core/GameStateManager.js';
import GameUI from '../ui/GameUI.js';
import AudioManager from '../utils/AudioManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    this.gameAPI = null;
    this.symbolManager = null;
    this.gridManager = null;
    this.stateManager = null;
    this.gameUI = null;
    this.audioManager = null;
  }

  /**
   * Preload assets
   */
  preload() {
    // Set loading progress callback
    this.load.on('progress', (value) => {
      const progressEl = document.getElementById('loading-progress');
      if (progressEl) {
        progressEl.textContent = `${Math.round(value * 100)}%`;
      }
    });

    // In production, load actual assets here
    // this.load.image('symbol_banana', 'assets/symbols/banana.png');
    // this.load.audio('spin', 'assets/audio/spin.mp3');
    // etc.
  }

  /**
   * Create game
   */
  async create() {
    try {
      // Hide loading screen
      this.hideLoadingScreen();

      // Initialize managers
      this.initializeManagers();

      // Create UI
      this.gameUI = new GameUI(this);

      // Setup event listeners
      this.setupEventListeners();

      // Initialize game session
      await this.initializeSession();

      // Start background music
      this.audioManager.playMusic('BACKGROUND_MUSIC');

      console.log('[GameScene] Initialization complete');
    } catch (error) {
      console.error('[GameScene] Initialization failed:', error);
      this.showError('Failed to initialize game: ' + error.message);
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Initialize all game managers
   */
  initializeManagers() {
    // Initialize API client (use MockAPI if no backend configured)
    const useDemo = !import.meta.env.VITE_API_BASE_URL ||
                    import.meta.env.VITE_API_BASE_URL === 'demo';

    if (useDemo) {
      console.log('[GameScene] Using Mock API (Demo Mode)');
      this.gameAPI = new MockGameAPI();
    } else {
      console.log('[GameScene] Using Real API');
      this.gameAPI = new GameAPI({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        apiKey: import.meta.env.VITE_API_KEY
      });
    }

    // Initialize symbol manager
    this.symbolManager = new SymbolManager(this);

    // Initialize grid manager
    this.gridManager = new GridManager(this, this.symbolManager);

    // Initialize state manager
    this.stateManager = new GameStateManager(this, this.gameAPI, this.gridManager);

    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    this.audioManager.init();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Spin button
    this.events.on('spinRequested', this.handleSpin, this);

    // Bet controls
    this.events.on('increaseBet', this.handleIncreaseBet, this);
    this.events.on('decreaseBet', this.handleDecreaseBet, this);

    // Ante bet
    this.events.on('anteBetToggle', this.handleAnteBetToggle, this);

    // Autoplay
    this.events.on('autoplayToggle', this.handleAutoplayToggle, this);

    // State changes
    this.events.on('stateChanged', this.handleStateChange, this);

    // Win events
    this.events.on('win', this.handleWin, this);
    this.events.on('finalWin', this.handleFinalWin, this);

    // Free spins events
    this.events.on('freeSpinsTrigger', this.handleFreeSpinsTrigger, this);

    // Balance updates
    this.events.on('balanceUpdate', this.handleBalanceUpdate, this);
  }

  /**
   * Initialize game session with backend
   */
  async initializeSession() {
    try {
      // Get player ID from URL params or use demo mode
      const urlParams = new URLSearchParams(window.location.search);
      const playerId = urlParams.get('playerId') || 'demo';
      const gameMode = urlParams.get('mode') || 'demo';

      const sessionData = await this.gameAPI.initSession({
        playerId,
        gameMode,
        currency: 'USD'
      });

      this.stateManager.initSession(sessionData);
      this.gameUI.updateBalance(sessionData.balance);

      console.log('[GameScene] Session initialized:', sessionData);

      // Start heartbeat
      this.startHeartbeat();
    } catch (error) {
      throw new Error(`Session initialization failed: ${error.message}`);
    }
  }

  /**
   * Start heartbeat to keep session alive
   */
  startHeartbeat() {
    this.time.addEvent({
      delay: 30000, // 30 seconds
      callback: () => {
        this.gameAPI.heartbeat().catch(err => {
          console.error('[GameScene] Heartbeat failed:', err);
        });
      },
      loop: true
    });
  }

  /**
   * Handle spin request
   */
  async handleSpin() {
    try {
      this.audioManager.playSpinSound();
      this.gameUI.setSpinEnabled(false);

      const result = await this.stateManager.requestSpin();

      this.gameUI.updateBalance(result.balance);
      this.gameUI.updateFreeSpins(this.stateManager.freeSpinsRemaining);

      // If autoplay is active, continue
      if (this.stateManager.autoplayEnabled && this.stateManager.autoplayRemaining > 0) {
        this.time.delayedCall(1000, () => {
          this.handleSpin();
        });
      } else {
        this.gameUI.setSpinEnabled(true);
      }
    } catch (error) {
      console.error('[GameScene] Spin failed:', error);
      this.showError(error.message);
      this.gameUI.setSpinEnabled(true);
    }
  }

  /**
   * Handle increase bet
   */
  handleIncreaseBet() {
    this.audioManager.playButtonSound();

    const levels = GameConfig.BET_SETTINGS.BET_LEVELS;
    const currentBet = this.stateManager.currentBet;
    const currentIndex = levels.indexOf(currentBet);

    if (currentIndex < levels.length - 1) {
      const newBet = levels[currentIndex + 1];
      this.stateManager.setBet(newBet);
      this.gameUI.updateBet(newBet);
    }
  }

  /**
   * Handle decrease bet
   */
  handleDecreaseBet() {
    this.audioManager.playButtonSound();

    const levels = GameConfig.BET_SETTINGS.BET_LEVELS;
    const currentBet = this.stateManager.currentBet;
    const currentIndex = levels.indexOf(currentBet);

    if (currentIndex > 0) {
      const newBet = levels[currentIndex - 1];
      this.stateManager.setBet(newBet);
      this.gameUI.updateBet(newBet);
    }
  }

  /**
   * Handle ante bet toggle
   */
  handleAnteBetToggle(data) {
    this.audioManager.playButtonSound();
    this.stateManager.setAnteBet(data.enabled);
  }

  /**
   * Handle autoplay toggle
   */
  handleAutoplayToggle() {
    this.audioManager.playButtonSound();

    if (this.stateManager.autoplayEnabled) {
      this.stateManager.stopAutoplay();
    } else {
      // For demo, start with 10 spins
      // In production, show autoplay settings modal
      this.stateManager.startAutoplay(10, {
        onFreeSpins: true
      });

      // Start first autoplay spin
      this.handleSpin();
    }
  }

  /**
   * Handle state change
   */
  handleStateChange(data) {
    console.log('[GameScene] State changed:', data.from, '->', data.to);

    // Update UI based on state
    // Enable/disable controls, show overlays, etc.
  }

  /**
   * Handle win
   */
  handleWin(data) {
    this.audioManager.playWinSound('normal');
    console.log('[GameScene] Win:', data);
  }

  /**
   * Handle final win display
   */
  handleFinalWin(data) {
    this.audioManager.playWinSound(data.type);
    this.gameUI.showWin(data.amount, data.type);
  }

  /**
   * Handle free spins trigger
   */
  handleFreeSpinsTrigger(data) {
    this.audioManager.playFreeSpinsStartSound();
    this.gameUI.showFreeSpinsTrigger(data.spins);
    this.gameUI.updateFreeSpins(data.spins);
  }

  /**
   * Handle balance update
   */
  handleBalanceUpdate(data) {
    this.gameUI.updateBalance(data.balance);
  }

  /**
   * Show error message
   */
  showError(message) {
    // In production, show proper error modal/toast
    console.error('[GameScene] Error:', message);
    alert(`Error: ${message}`);
  }

  /**
   * Update loop
   */
  update(time, delta) {
    // Game loop updates if needed
  }

  /**
   * Shutdown scene
   */
  shutdown() {
    // Clean up resources
    if (this.symbolManager) {
      this.symbolManager.destroy();
    }
    if (this.gridManager) {
      this.gridManager.destroy();
    }
    if (this.audioManager) {
      this.audioManager.destroy();
    }

    // End session
    if (this.gameAPI) {
      this.gameAPI.endSession().catch(err => {
        console.error('[GameScene] Failed to end session:', err);
      });
    }

    // Remove event listeners
    this.events.off('spinRequested');
    this.events.off('increaseBet');
    this.events.off('decreaseBet');
    this.events.off('anteBetToggle');
    this.events.off('autoplayToggle');
  }
}

export default GameScene;
