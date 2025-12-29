/**
 * Mock Game API for Demo/Testing
 * Simulates backend responses for standalone testing
 * NO REAL MONEY - DEMO ONLY
 */

import GameConfig from '../config/GameConfig.js';

export class MockGameAPI {
  constructor() {
    this.balance = 1000.00;
    this.sessionId = 'demo_session_' + Date.now();
    this.playerId = 'demo_player';
    this.spinCounter = 0;
    this.history = [];
  }

  /**
   * Initialize demo session
   */
  async initSession(params = {}) {
    await this.delay(500);

    return {
      success: true,
      sessionId: this.sessionId,
      sessionToken: 'demo_token_' + Date.now(),
      playerId: this.playerId,
      balance: this.balance,
      currency: params.currency || 'USD',
      playerData: {
        username: 'Demo Player',
        vipLevel: 1
      }
    };
  }

  /**
   * Request spin outcome - DEMO RNG (client-side for demo only)
   */
  async requestSpin(spinRequest) {
    await this.delay(800);

    const { betAmount, anteBet, isFreeSpins, accumulatedMultiplier } = spinRequest;

    // Deduct bet from balance (unless free spins)
    if (!isFreeSpins) {
      const actualBet = anteBet ? betAmount * 1.25 : betAmount;
      this.balance -= actualBet;
    }

    // Generate demo outcome
    const outcome = this.generateDemoOutcome({
      betAmount,
      anteBet,
      isFreeSpins,
      accumulatedMultiplier: accumulatedMultiplier || 1
    });

    // Add win to balance
    this.balance += outcome.winData.totalWin;

    // Store in history
    this.history.unshift({
      spinId: outcome.spinId,
      betAmount,
      winAmount: outcome.winData.totalWin,
      timestamp: Date.now()
    });

    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    return {
      ...outcome,
      balance: this.balance
    };
  }

  /**
   * Generate demo game outcome
   */
  generateDemoOutcome(params) {
    const spinId = 'spin_' + (++this.spinCounter);

    // Generate initial grid
    const grid = this.generateGrid(params.anteBet);

    // Process tumbles
    const tumbles = this.processTumbles(grid, params);

    // Calculate total win
    let totalWin = 0;
    const allClusters = [];
    const allMultipliers = [];

    tumbles.forEach(tumble => {
      totalWin += tumble.winAmount;
      if (tumble.clusters) {
        allClusters.push(...tumble.clusters);
      }
      if (tumble.multipliers) {
        allMultipliers.push(...tumble.multipliers);
      }
    });

    // Calculate final multiplier
    let finalMultiplier = 1;
    if (params.isFreeSpins && allMultipliers.length > 0) {
      finalMultiplier = params.accumulatedMultiplier +
        allMultipliers.reduce((sum, m) => sum + m.value, 0);
      totalWin *= finalMultiplier;
    }

    // Check for free spins trigger
    const scatterCount = this.countScatters(grid);
    const freeSpinsTriggered = scatterCount >= 4;

    return {
      spinId,
      roundId: 'round_' + spinId,
      grid,
      tumbles,
      winData: {
        clusters: allClusters,
        totalWin: totalWin * params.betAmount,
        multipliers: allMultipliers,
        finalMultiplier
      },
      freeSpins: {
        triggered: freeSpinsTriggered,
        remaining: freeSpinsTriggered ? 10 : 0,
        totalAwarded: freeSpinsTriggered ? 10 : 0,
        retriggered: false
      },
      timestamp: Date.now(),
      signature: 'demo_signature'
    };
  }

  /**
   * Generate random grid
   */
  generateGrid(anteBet = false) {
    const grid = [];

    for (let col = 0; col < 6; col++) {
      grid[col] = [];
      for (let row = 0; row < 5; row++) {
        grid[col][row] = this.getRandomSymbol(anteBet);
      }
    }

    return grid;
  }

  /**
   * Get random symbol with weighted distribution
   */
  getRandomSymbol(anteBet = false) {
    const rand = Math.random() * 100;

    // Weighted symbol distribution
    if (rand < 5) return 0;  // Banana (5%)
    if (rand < 10) return 1; // Grapes (5%)
    if (rand < 15) return 2; // Watermelon (5%)
    if (rand < 20) return 3; // Plum (5%)
    if (rand < 25) return 4; // Apple (5%)
    if (rand < 40) return 5; // Heart Candy (15%)
    if (rand < 55) return 6; // Square Candy (15%)
    if (rand < 70) return 7; // Star Candy (15%)
    if (rand < 85) return 8; // Triangle Candy (15%)

    // Scatter (Lollipop) - more likely with ante bet
    if (rand < (anteBet ? 95 : 92)) return 9;

    // Multiplier (Bomb)
    return 10;
  }

  /**
   * Process tumbles and wins
   */
  processTumbles(initialGrid, params) {
    const tumbles = [];
    let currentGrid = JSON.parse(JSON.stringify(initialGrid));
    let tumbleIndex = 0;

    // Process up to 5 tumbles
    while (tumbleIndex < 5) {
      const clusters = this.detectClusters(currentGrid);

      if (clusters.length === 0) {
        break;
      }

      // Find multipliers in current grid
      const multipliers = this.findMultipliers(currentGrid);

      // Calculate win for this tumble
      const winAmount = this.calculateWin(clusters, params.betAmount);

      // Get positions to remove
      const removePositions = [];
      clusters.forEach(cluster => {
        cluster.positions.forEach(pos => {
          if (!removePositions.find(p => p.col === pos.col && p.row === pos.row)) {
            removePositions.push(pos);
          }
        });
      });

      // Generate new symbols
      const newSymbols = removePositions.map(pos => ({
        col: pos.col,
        row: pos.row,
        symbolId: this.getRandomSymbol(params.anteBet)
      }));

      // Update grid
      newSymbols.forEach(ns => {
        currentGrid[ns.col][ns.row] = ns.symbolId;
      });

      tumbles.push({
        tumbleIndex,
        clusters,
        multipliers,
        winAmount,
        multiplier: multipliers.length > 0 ?
          multipliers.reduce((sum, m) => sum + m.value, 0) : 1,
        removePositions,
        newSymbols
      });

      tumbleIndex++;
    }

    return tumbles;
  }

  /**
   * Detect winning clusters
   */
  detectClusters(grid) {
    const visited = Array(6).fill(null).map(() => Array(5).fill(false));
    const clusters = [];

    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 5; row++) {
        if (!visited[col][row]) {
          const symbolId = grid[col][row];

          // Skip scatter and multiplier
          if (symbolId === 9 || symbolId === 10) {
            visited[col][row] = true;
            continue;
          }

          const cluster = this.floodFill(grid, col, row, symbolId, visited);

          if (cluster.length >= 8) {
            clusters.push({
              symbolId,
              positions: cluster,
              size: cluster.length
            });
          }
        }
      }
    }

    return clusters;
  }

  /**
   * Flood fill algorithm
   */
  floodFill(grid, startCol, startRow, targetSymbol, visited) {
    const positions = [];
    const queue = [{ col: startCol, row: startRow }];

    while (queue.length > 0) {
      const { col, row } = queue.shift();

      if (col < 0 || col >= 6 || row < 0 || row >= 5) continue;
      if (visited[col][row]) continue;
      if (grid[col][row] !== targetSymbol) continue;

      visited[col][row] = true;
      positions.push({ col, row });

      queue.push({ col: col + 1, row });
      queue.push({ col: col - 1, row });
      queue.push({ col, row: row + 1 });
      queue.push({ col, row: row - 1 });
    }

    return positions;
  }

  /**
   * Find multipliers in grid
   */
  findMultipliers(grid) {
    const multipliers = [];

    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 5; row++) {
        if (grid[col][row] === 10) {
          const multiplierValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50, 100];
          const value = multiplierValues[Math.floor(Math.random() * multiplierValues.length)];

          multipliers.push({ col, row, value });
        }
      }
    }

    return multipliers;
  }

  /**
   * Count scatter symbols
   */
  countScatters(grid) {
    let count = 0;
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 5; row++) {
        if (grid[col][row] === 9) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Calculate win amount
   */
  calculateWin(clusters, betAmount) {
    let totalPayout = 0;

    clusters.forEach(cluster => {
      // Simple payout based on cluster size
      const size = cluster.size;
      let payout = 0;

      if (size >= 8 && size < 10) payout = 0.5;
      else if (size >= 10 && size < 12) payout = 1;
      else if (size >= 12 && size < 15) payout = 2;
      else if (size >= 15 && size < 20) payout = 5;
      else if (size >= 20 && size < 25) payout = 10;
      else if (size >= 25) payout = 20;

      totalPayout += payout;
    });

    return totalPayout;
  }

  /**
   * Get balance
   */
  async getBalance() {
    await this.delay(200);
    return this.balance;
  }

  /**
   * Get history
   */
  async getHistory(limit = 50) {
    await this.delay(200);
    return this.history.slice(0, limit);
  }

  /**
   * End session
   */
  async endSession() {
    await this.delay(300);
    return {
      success: true,
      sessionSummary: {
        totalSpins: this.spinCounter,
        finalBalance: this.balance
      }
    };
  }

  /**
   * Heartbeat
   */
  async heartbeat() {
    return true;
  }

  /**
   * Utility delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Unused methods for compatibility
  generateRequestId() {
    return 'demo_' + Date.now();
  }

  generateSignature() {
    return 'demo_signature';
  }

  validateResponseSignature() {
    return true;
  }
}

export default MockGameAPI;
