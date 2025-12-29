/**
 * Symbol Manager - Handles symbol rendering and animations
 * Uses placeholder graphics until proper assets are loaded
 */

import GameConfig, { SYMBOL_IDS } from '../config/GameConfig.js';

export class SymbolManager {
  constructor(scene) {
    this.scene = scene;
    this.symbolTextures = new Map();
    this.createPlaceholderSymbols();
  }

  /**
   * Create placeholder symbol graphics
   * Replace with actual sprite sheet in production
   */
  createPlaceholderSymbols() {
    const size = 128;

    // High value fruits
    this.createSymbolTexture('BANANA', size, 0xFFE135, '🍌');
    this.createSymbolTexture('GRAPES', size, 0x9B4F96, '🍇');
    this.createSymbolTexture('WATERMELON', size, 0xFF6B6B, '🍉');
    this.createSymbolTexture('PLUM', size, 0x8B4789, '🍑');
    this.createSymbolTexture('APPLE', size, 0xFF5252, '🍎');

    // Low value candies
    this.createSymbolTexture('HEART_CANDY', size, 0xFF69B4, '💗');
    this.createSymbolTexture('SQUARE_CANDY', size, 0x4FC3F7, '🔷');
    this.createSymbolTexture('STAR_CANDY', size, 0xFFD54F, '⭐');
    this.createSymbolTexture('TRIANGLE_CANDY', size, 0x9CCC65, '🔺');

    // Special symbols
    this.createSymbolTexture('LOLLIPOP', size, 0xFF1744, '🍭');
    this.createSymbolTexture('BOMB', size, 0xFF6F00, '💣');
  }

  /**
   * Create a symbol texture with graphics
   * @param {string} symbolId - Symbol identifier
   * @param {number} size - Symbol size
   * @param {number} color - Symbol color
   * @param {string} emoji - Emoji for placeholder
   */
  createSymbolTexture(symbolId, size, color, emoji) {
    const graphics = this.scene.add.graphics();

    // Draw background circle
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2 - 4);

    // Add border
    graphics.lineStyle(4, 0xFFFFFF, 0.8);
    graphics.strokeCircle(size / 2, size / 2, size / 2 - 4);

    // Add shine effect
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillCircle(size / 2 - 15, size / 2 - 15, 20);

    // Add text/emoji
    const text = this.scene.add.text(size / 2, size / 2, emoji, {
      fontSize: '48px',
      align: 'center'
    });
    text.setOrigin(0.5);

    // Generate texture
    const renderTexture = this.scene.add.renderTexture(0, 0, size, size);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.draw(text, 0, 0);
    renderTexture.saveTexture(symbolId);

    // Cleanup
    graphics.destroy();
    text.destroy();
    renderTexture.destroy();

    this.symbolTextures.set(symbolId, symbolId);
  }

  /**
   * Get symbol texture key by ID
   * @param {number} symbolId - Symbol ID
   * @returns {string} Texture key
   */
  getSymbolTexture(symbolId) {
    const symbolKeys = Object.keys(SYMBOL_IDS);
    const symbolName = symbolKeys[symbolId];
    return symbolName || 'BANANA';
  }

  /**
   * Get symbol data by ID
   * @param {number} symbolId - Symbol ID
   * @returns {Object} Symbol data
   */
  getSymbolData(symbolId) {
    const allSymbols = [
      ...GameConfig.SYMBOLS.HIGH_VALUE,
      ...GameConfig.SYMBOLS.LOW_VALUE,
      GameConfig.SYMBOLS.SCATTER,
      GameConfig.SYMBOLS.MULTIPLIER
    ];

    return allSymbols.find(s =>
      s.id === this.getSymbolTexture(symbolId)
    ) || allSymbols[0];
  }

  /**
   * Create symbol sprite
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} symbolId - Symbol ID
   * @returns {Phaser.GameObjects.Sprite} Symbol sprite
   */
  createSymbol(x, y, symbolId) {
    const texture = this.getSymbolTexture(symbolId);
    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setData('symbolId', symbolId);
    sprite.setData('texture', texture);

    // Add interactive properties for debugging
    sprite.setInteractive();

    return sprite;
  }

  /**
   * Animate symbol drop
   * @param {Phaser.GameObjects.Sprite} symbol - Symbol sprite
   * @param {number} fromY - Start Y position
   * @param {number} toY - End Y position
   * @param {number} delay - Animation delay
   * @returns {Promise} Animation complete promise
   */
  animateDrop(symbol, fromY, toY, delay = 0) {
    return new Promise((resolve) => {
      symbol.y = fromY;
      symbol.setAlpha(0);

      this.scene.tweens.add({
        targets: symbol,
        y: toY,
        alpha: 1,
        duration: GameConfig.ANIMATIONS.SYMBOL_DROP,
        delay: delay,
        ease: 'Bounce.easeOut',
        onComplete: () => resolve()
      });
    });
  }

  /**
   * Animate symbol win highlight
   * @param {Phaser.GameObjects.Sprite} symbol - Symbol sprite
   * @returns {Promise} Animation complete promise
   */
  animateWin(symbol) {
    return new Promise((resolve) => {
      // Pulsing glow effect
      this.scene.tweens.add({
        targets: symbol,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: GameConfig.ANIMATIONS.WIN_HIGHLIGHT / 2,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
        onComplete: () => resolve()
      });

      // Add glow
      symbol.setTint(0xFFFFFF);
      this.scene.time.delayedCall(GameConfig.ANIMATIONS.WIN_HIGHLIGHT, () => {
        symbol.clearTint();
      });
    });
  }

  /**
   * Animate symbol explosion
   * @param {Phaser.GameObjects.Sprite} symbol - Symbol sprite
   * @returns {Promise} Animation complete promise
   */
  animateExplode(symbol) {
    return new Promise((resolve) => {
      // Create particle effect
      const particles = this.scene.add.particles(symbol.x, symbol.y, symbol.texture.key, {
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        gravityY: 300,
        quantity: 10
      });

      // Explode animation
      this.scene.tweens.add({
        targets: symbol,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: GameConfig.ANIMATIONS.SYMBOL_EXPLODE,
        ease: 'Power2',
        onComplete: () => {
          symbol.destroy();
          particles.destroy();
          resolve();
        }
      });
    });
  }

  /**
   * Animate multiplier symbol
   * @param {Phaser.GameObjects.Sprite} symbol - Symbol sprite
   * @param {number} multiplier - Multiplier value
   */
  animateMultiplier(symbol, multiplier) {
    // Add multiplier text
    const text = this.scene.add.text(symbol.x, symbol.y, `${multiplier}x`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);

    // Animate text
    this.scene.tweens.add({
      targets: text,
      y: symbol.y - 100,
      alpha: 0,
      duration: GameConfig.ANIMATIONS.MULTIPLIER_SHOW,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });

    // Symbol pulse
    this.scene.tweens.add({
      targets: symbol,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.symbolTextures.clear();
  }
}

export default SymbolManager;
