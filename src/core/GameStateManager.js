/**
 * Game State Manager
 * Manages game state, spin logic, and tumble sequences
 * All outcomes controlled by backend API
 */

import { GAME_STATES } from '../config/GameConfig.js';
import GameConfig from '../config/GameConfig.js';

export class GameStateManager {
  constructor(scene, gameAPI, gridManager) {
    this.scene = scene;
    this.gameAPI = gameAPI;
    this.gridManager = gridManager;

    // Game state
    this.currentState = GAME_STATES.IDLE;
    this.previousState = null;

    // Balance and bet
    this.balance = 0;
    this.currentBet = GameConfig.BET_SETTINGS.DEFAULT_BET;
    this.anteBetEnabled = false;

    // Free spins
    this.freeSpinsRemaining = 0;
    this.freeSpinsTotalWin = 0;
    this.freeSpinsAccumulatedMultiplier = 1;

    // Autoplay
    this.autoplayEnabled = false;
    this.autoplayRemaining = 0;
    this.autoplayStopConditions = {};

    // Current spin data
    this.currentSpinData = null;
    this.currentTumbleIndex = 0;

    // Session tracking
    this.sessionStartTime = Date.now();
    this.totalSpins = 0;
    this.totalWins = 0;
    this.totalLosses = 0;
  }

  /**
   * Change game state
   * @param {string} newState - New state
   */
  setState(newState) {
    this.previousState = this.currentState;
    this.currentState = newState;

    this.scene.events.emit('stateChanged', {
      from: this.previousState,
      to: newState
    });
  }

  /**
   * Initialize game session
   * @param {Object} sessionData - Session data from API
   */
  initSession(sessionData) {
    this.balance = sessionData.balance;
    this.setState(GAME_STATES.IDLE);
  }

  /**
   * Request and execute spin
   * @returns {Promise} Spin complete promise
   */
  async requestSpin() {
    if (this.currentState !== GAME_STATES.IDLE) {
      throw new Error('Cannot spin - game not in idle state');
    }

    // Validate balance
    const betAmount = this.anteBetEnabled
      ? this.currentBet * GameConfig.ANTE_BET.COST_MULTIPLIER
      : this.currentBet;

    if (this.balance < betAmount && this.freeSpinsRemaining === 0) {
      throw new Error('Insufficient balance');
    }

    this.setState(GAME_STATES.SPINNING);

    try {
      // Request spin from backend
      const spinData = await this.gameAPI.requestSpin({
        betAmount: this.currentBet,
        anteBet: this.anteBetEnabled,
        isFreeSpins: this.freeSpinsRemaining > 0,
        freeSpinsRemaining: this.freeSpinsRemaining,
        accumulatedMultiplier: this.freeSpinsAccumulatedMultiplier
      });

      this.currentSpinData = spinData;
      this.balance = spinData.balance;
      this.totalSpins++;

      // Execute spin sequence
      await this.executeSpinSequence(spinData);

      // Update free spins
      if (spinData.freeSpins.triggered) {
        this.freeSpinsRemaining = spinData.freeSpins.remaining;
      } else if (this.freeSpinsRemaining > 0) {
        this.freeSpinsRemaining--;
      }

      // Check autoplay
      if (this.autoplayEnabled) {
        this.autoplayRemaining--;
        if (this.autoplayRemaining <= 0 || this.shouldStopAutoplay(spinData)) {
          this.stopAutoplay();
        }
      }

      this.setState(GAME_STATES.IDLE);

      return spinData;
    } catch (error) {
      this.setState(GAME_STATES.ERROR);
      throw error;
    }
  }

  /**
   * Execute complete spin sequence including tumbles
   * @param {Object} spinData - Spin data from backend
   */
  async executeSpinSequence(spinData) {
    // Clear grid
    this.gridManager.clearGrid();

    // Show initial grid from backend
    await this.gridManager.populateGrid(spinData.grid);

    // Process initial wins and tumbles
    this.currentTumbleIndex = 0;
    await this.processTumbleSequence(spinData);
  }

  /**
   * Process tumble sequence
   * @param {Object} spinData - Spin data with tumbles
   */
  async processTumbleSequence(spinData) {
    if (!spinData.tumbles || spinData.tumbles.length === 0) {
      // No tumbles, check for wins on initial grid
      if (spinData.winData.clusters.length > 0) {
        await this.showWins(spinData.winData);
      }
      return;
    }

    // Process each tumble from backend
    for (const tumble of spinData.tumbles) {
      this.setState(GAME_STATES.CHECKING_WIN);

      // Highlight wins from this tumble
      if (tumble.clusters && tumble.clusters.length > 0) {
        await this.gridManager.highlightWins(tumble.clusters);

        // Show win amount
        if (tumble.winAmount > 0) {
          this.scene.events.emit('winUpdate', {
            amount: tumble.winAmount,
            multiplier: tumble.multiplier || 1
          });
        }
      }

      // Show multipliers if present
      if (tumble.multipliers && tumble.multipliers.length > 0) {
        await this.showMultipliers(tumble.multipliers);
      }

      // Remove winning symbols
      if (tumble.removePositions) {
        this.setState(GAME_STATES.TUMBLING);
        await this.gridManager.removeSymbols(tumble.removePositions);

        // Wait for tumble delay
        await this.delay(GameConfig.ANIMATIONS.TUMBLE_DELAY);

        // Add new symbols from backend
        if (tumble.newSymbols) {
          await this.gridManager.updateGrid(tumble.newSymbols);
        }
      }
    }

    // Show final total win
    if (spinData.winData.totalWin > 0) {
      await this.showFinalWin(spinData.winData);
    }

    // Check for free spins trigger
    if (spinData.freeSpins.triggered) {
      await this.triggerFreeSpins(spinData.freeSpins);
    }
  }

  /**
   * Show wins with animation
   * @param {Object} winData - Win data
   */
  async showWins(winData) {
    this.setState(GAME_STATES.SHOWING_WIN);

    // Highlight winning clusters
    await this.gridManager.highlightWins(winData.clusters);

    // Emit win event
    this.scene.events.emit('win', {
      amount: winData.totalWin,
      multiplier: winData.finalMultiplier,
      clusters: winData.clusters
    });

    await this.delay(GameConfig.ANIMATIONS.WIN_HIGHLIGHT);
  }

  /**
   * Show multipliers
   * @param {Array} multipliers - Multiplier data
   */
  async showMultipliers(multipliers) {
    for (const mult of multipliers) {
      const symbol = this.gridManager.grid[mult.col][mult.row];
      if (symbol) {
        this.scene.symbolManager.animateMultiplier(symbol, mult.value);
      }
    }

    // Update accumulated multiplier in free spins
    if (this.freeSpinsRemaining > 0) {
      const totalMult = multipliers.reduce((sum, m) => sum + m.value, 0);
      this.freeSpinsAccumulatedMultiplier += totalMult;

      this.scene.events.emit('multiplierUpdate', {
        value: this.freeSpinsAccumulatedMultiplier
      });
    }

    await this.delay(GameConfig.ANIMATIONS.MULTIPLIER_SHOW);
  }

  /**
   * Show final win amount
   * @param {Object} winData - Win data
   */
  async showFinalWin(winData) {
    const winAmount = winData.totalWin;
    const betAmount = this.currentBet;
    const winMultiplier = winAmount / betAmount;

    let winType = 'normal';
    if (winMultiplier >= 100) {
      winType = 'mega';
    } else if (winMultiplier >= 25) {
      winType = 'big';
    }

    this.scene.events.emit('finalWin', {
      amount: winAmount,
      multiplier: winData.finalMultiplier,
      type: winType
    });

    await this.delay(GameConfig.ANIMATIONS.WIN_COUNT_UP);
  }

  /**
   * Trigger free spins
   * @param {Object} freeSpinsData - Free spins data
   */
  async triggerFreeSpins(freeSpinsData) {
    this.setState(GAME_STATES.FREE_SPINS);

    this.scene.events.emit('freeSpinsTrigger', {
      spins: freeSpinsData.totalAwarded,
      retriggered: freeSpinsData.retriggered
    });

    // Reset accumulated multiplier if new free spins
    if (!freeSpinsData.retriggered) {
      this.freeSpinsAccumulatedMultiplier = 1;
    }

    await this.delay(GameConfig.ANIMATIONS.FREE_SPIN_TRIGGER);
  }

  /**
   * Start autoplay
   * @param {number} spins - Number of spins
   * @param {Object} stopConditions - Stop conditions
   */
  startAutoplay(spins, stopConditions = {}) {
    this.autoplayEnabled = true;
    this.autoplayRemaining = spins;
    this.autoplayStopConditions = stopConditions;
    this.setState(GAME_STATES.AUTOPLAY);

    this.scene.events.emit('autoplayStart', {
      spins,
      stopConditions
    });
  }

  /**
   * Stop autoplay
   */
  stopAutoplay() {
    this.autoplayEnabled = false;
    this.autoplayRemaining = 0;

    this.scene.events.emit('autoplayStop');
  }

  /**
   * Check if autoplay should stop
   * @param {Object} spinData - Last spin data
   * @returns {boolean} Should stop
   */
  shouldStopAutoplay(spinData) {
    const conditions = this.autoplayStopConditions;

    if (conditions.onAnyWin && spinData.winData.totalWin > 0) {
      return true;
    }

    if (conditions.onFreeSpins && spinData.freeSpins.triggered) {
      return true;
    }

    if (conditions.onSingleWinExceeds) {
      const threshold = conditions.onSingleWinExceeds;
      if (spinData.winData.totalWin >= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set bet amount
   * @param {number} amount - Bet amount
   */
  setBet(amount) {
    if (this.currentState !== GAME_STATES.IDLE) {
      throw new Error('Cannot change bet while game is running');
    }

    if (amount < GameConfig.BET_SETTINGS.MIN_BET || amount > GameConfig.BET_SETTINGS.MAX_BET) {
      throw new Error('Invalid bet amount');
    }

    this.currentBet = amount;

    this.scene.events.emit('betChanged', { amount });
  }

  /**
   * Toggle ante bet
   * @param {boolean} enabled - Enable ante bet
   */
  setAnteBet(enabled) {
    if (!GameConfig.ANTE_BET.ENABLED) {
      return;
    }

    this.anteBetEnabled = enabled;

    this.scene.events.emit('anteBetChanged', { enabled });
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get session statistics
   * @returns {Object} Session stats
   */
  getSessionStats() {
    return {
      sessionTime: Date.now() - this.sessionStartTime,
      totalSpins: this.totalSpins,
      totalWins: this.totalWins,
      totalLosses: this.totalLosses,
      balance: this.balance
    };
  }
}

export default GameStateManager;
