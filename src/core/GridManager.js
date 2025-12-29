/**
 * Grid Manager - Manages the 6x5 symbol grid
 * Handles symbol positioning, grid state, and cluster detection
 */

import GameConfig from '../config/GameConfig.js';

export class GridManager {
  constructor(scene, symbolManager) {
    this.scene = scene;
    this.symbolManager = symbolManager;

    // Grid configuration
    this.cols = GameConfig.GRID.COLS;
    this.rows = GameConfig.GRID.ROWS;

    // Symbol size and spacing
    this.symbolSize = 100;
    this.symbolSpacing = 10;

    // Grid offset (centered on screen)
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    // Grid state - 2D array of symbol sprites
    this.grid = Array(this.cols).fill(null).map(() => Array(this.rows).fill(null));

    this.calculateGridPosition();
  }

  /**
   * Calculate grid position to center it on screen
   */
  calculateGridPosition() {
    const totalWidth = this.cols * (this.symbolSize + this.symbolSpacing);
    const totalHeight = this.rows * (this.symbolSize + this.symbolSpacing);

    this.gridOffsetX = (this.scene.scale.width - totalWidth) / 2 + this.symbolSize / 2;
    this.gridOffsetY = 150; // Offset from top for UI
  }

  /**
   * Get screen position for grid cell
   * @param {number} col - Column index
   * @param {number} row - Row index
   * @returns {Object} {x, y} screen coordinates
   */
  getPosition(col, row) {
    return {
      x: this.gridOffsetX + col * (this.symbolSize + this.symbolSpacing),
      y: this.gridOffsetY + row * (this.symbolSize + this.symbolSpacing)
    };
  }

  /**
   * Populate grid with symbols from backend data
   * @param {Array} gridData - 2D array of symbol IDs from backend
   * @returns {Promise} Animation complete promise
   */
  async populateGrid(gridData) {
    const promises = [];

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const symbolId = gridData[col][row];
        const pos = this.getPosition(col, row);

        // Create symbol
        const symbol = this.symbolManager.createSymbol(pos.x, pos.y, symbolId);
        this.grid[col][row] = symbol;

        // Animate drop from top
        const delay = col * 50 + row * 30;
        promises.push(
          this.symbolManager.animateDrop(symbol, -100, pos.y, delay)
        );
      }
    }

    await Promise.all(promises);
  }

  /**
   * Update specific cells in the grid (for tumbles)
   * @param {Array} updates - Array of {col, row, symbolId}
   * @returns {Promise} Animation complete promise
   */
  async updateGrid(updates) {
    const promises = [];

    for (const update of updates) {
      const { col, row, symbolId } = update;
      const pos = this.getPosition(col, row);

      // Remove old symbol if exists
      if (this.grid[col][row]) {
        this.grid[col][row].destroy();
      }

      // Create new symbol
      const symbol = this.symbolManager.createSymbol(pos.x, -100, symbolId);
      this.grid[col][row] = symbol;

      // Animate drop
      promises.push(
        this.symbolManager.animateDrop(symbol, -100, pos.y, row * 50)
      );
    }

    await Promise.all(promises);
  }

  /**
   * Remove symbols at specified positions (for tumbles)
   * @param {Array} positions - Array of {col, row}
   * @returns {Promise} Animation complete promise
   */
  async removeSymbols(positions) {
    const promises = [];

    for (const pos of positions) {
      const symbol = this.grid[pos.col][pos.row];
      if (symbol) {
        promises.push(this.symbolManager.animateExplode(symbol));
        this.grid[pos.col][pos.row] = null;
      }
    }

    await Promise.all(promises);
  }

  /**
   * Highlight winning clusters
   * @param {Array} clusters - Array of winning clusters
   * @returns {Promise} Animation complete promise
   */
  async highlightWins(clusters) {
    const promises = [];

    for (const cluster of clusters) {
      for (const pos of cluster.positions) {
        const symbol = this.grid[pos.col][pos.row];
        if (symbol) {
          promises.push(this.symbolManager.animateWin(symbol));
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Detect clusters in current grid
   * Uses flood-fill algorithm to find connected matching symbols
   * @returns {Array} Array of cluster objects
   */
  detectClusters() {
    const visited = Array(this.cols).fill(null).map(() => Array(this.rows).fill(false));
    const clusters = [];

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (!visited[col][row] && this.grid[col][row]) {
          const cluster = this.floodFill(col, row, visited);

          if (cluster.positions.length >= GameConfig.WIN_RULES.MIN_CLUSTER_SIZE) {
            clusters.push(cluster);
          }
        }
      }
    }

    return clusters;
  }

  /**
   * Flood fill algorithm to find connected symbols
   * @param {number} startCol - Starting column
   * @param {number} startRow - Starting row
   * @param {Array} visited - Visited cells tracker
   * @returns {Object} Cluster object
   */
  floodFill(startCol, startRow, visited) {
    const symbol = this.grid[startCol][startRow];
    const symbolId = symbol.getData('symbolId');
    const positions = [];
    const queue = [{ col: startCol, row: startRow }];

    while (queue.length > 0) {
      const { col, row } = queue.shift();

      // Skip if out of bounds or already visited
      if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
        continue;
      }
      if (visited[col][row]) {
        continue;
      }

      const currentSymbol = this.grid[col][row];
      if (!currentSymbol) {
        continue;
      }

      const currentId = currentSymbol.getData('symbolId');

      // Skip if different symbol or special symbol
      if (currentId !== symbolId) {
        continue;
      }

      // Skip scatter and multiplier symbols in cluster detection
      if (currentId === 9 || currentId === 10) {
        continue;
      }

      // Mark as visited and add to cluster
      visited[col][row] = true;
      positions.push({ col, row });

      // Check adjacent cells (horizontal and vertical)
      queue.push({ col: col + 1, row });
      queue.push({ col: col - 1, row });
      queue.push({ col, row: row + 1 });
      queue.push({ col, row: row - 1 });
    }

    return {
      symbolId,
      positions,
      size: positions.length
    };
  }

  /**
   * Count scatter symbols on grid
   * @returns {number} Number of scatters
   */
  countScatters() {
    let count = 0;
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const symbol = this.grid[col][row];
        if (symbol && symbol.getData('symbolId') === 9) { // LOLLIPOP scatter
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get all multiplier symbols and their values
   * @returns {Array} Array of {col, row, value} for multipliers
   */
  getMultipliers() {
    const multipliers = [];

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        const symbol = this.grid[col][row];
        if (symbol && symbol.getData('symbolId') === 10) { // BOMB multiplier
          // In real implementation, multiplier value would come from backend
          const value = this.getRandomMultiplier();
          multipliers.push({ col, row, value });
        }
      }
    }

    return multipliers;
  }

  /**
   * Get random multiplier value (PLACEHOLDER - backend controls this)
   * @returns {number} Multiplier value
   */
  getRandomMultiplier() {
    const values = GameConfig.MULTIPLIERS.BASE_GAME;
    return values[Math.floor(Math.random() * values.length)];
  }

  /**
   * Clear entire grid
   */
  clearGrid() {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.grid[col][row]) {
          this.grid[col][row].destroy();
          this.grid[col][row] = null;
        }
      }
    }
  }

  /**
   * Get grid state as 2D array of symbol IDs
   * @returns {Array} 2D array of symbol IDs
   */
  getGridState() {
    return this.grid.map(col =>
      col.map(symbol => symbol ? symbol.getData('symbolId') : null)
    );
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.clearGrid();
  }
}

export default GridManager;
