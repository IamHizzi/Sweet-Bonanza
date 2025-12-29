/**
 * Game UI Components
 * Manages all UI elements including controls, displays, and overlays
 */

import GameConfig from '../config/GameConfig.js';

export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};

    this.createUI();
  }

  /**
   * Create all UI elements
   */
  createUI() {
    this.createBackground();
    this.createHeader();
    this.createControlPanel();
    this.createWinDisplay();
    this.createFreeSpinsOverlay();
  }

  /**
   * Create background
   */
  createBackground() {
    const { width, height } = this.scene.scale;

    // Gradient background
    const graphics = this.scene.add.graphics();
    graphics.fillGradientStyle(0x1a0033, 0x1a0033, 0x330066, 0x330066, 1);
    graphics.fillRect(0, 0, width, height);

    // Decorative elements
    const stars = this.scene.add.graphics();
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 1;

      stars.fillStyle(0xFFFFFF, Math.random() * 0.5 + 0.5);
      stars.fillCircle(x, y, size);
    }
  }

  /**
   * Create header with balance and title
   */
  createHeader() {
    const { width } = this.scene.scale;

    // Title
    this.elements.title = this.scene.add.text(width / 2, 30, 'SWEET BONANZA', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#FF1493',
      strokeThickness: 6,
      fontStyle: 'bold'
    });
    this.elements.title.setOrigin(0.5);

    // Balance container
    const balanceX = width - 200;
    const balanceY = 30;

    this.elements.balanceBg = this.scene.add.rectangle(
      balanceX, balanceY, 180, 60, 0x000000, 0.7
    );
    this.elements.balanceBg.setStrokeStyle(2, 0xFFD700);

    this.elements.balanceLabel = this.scene.add.text(
      balanceX, balanceY - 15, 'BALANCE', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }
    );
    this.elements.balanceLabel.setOrigin(0.5);

    this.elements.balanceText = this.scene.add.text(
      balanceX, balanceY + 10, '$0.00', {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#FFD700',
        fontStyle: 'bold'
      }
    );
    this.elements.balanceText.setOrigin(0.5);

    // Free spins counter (hidden initially)
    this.elements.freeSpinsCounter = this.scene.add.container(150, 30);
    this.elements.freeSpinsCounter.setVisible(false);

    const fsBg = this.scene.add.rectangle(0, 0, 180, 60, 0x8B008B, 0.9);
    fsBg.setStrokeStyle(2, 0xFF1493);

    const fsLabel = this.scene.add.text(0, -15, 'FREE SPINS', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });
    fsLabel.setOrigin(0.5);

    this.elements.freeSpinsText = this.scene.add.text(0, 10, '0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    this.elements.freeSpinsText.setOrigin(0.5);

    this.elements.freeSpinsCounter.add([fsBg, fsLabel, this.elements.freeSpinsText]);
  }

  /**
   * Create control panel at bottom
   */
  createControlPanel() {
    const { width, height } = this.scene.scale;
    const panelY = height - 100;

    // Panel background
    const panel = this.scene.add.rectangle(
      width / 2, panelY, width, 150, 0x000000, 0.8
    );

    // Bet controls
    this.createBetControls(width / 2 - 300, panelY);

    // Spin button
    this.createSpinButton(width / 2, panelY);

    // Autoplay button
    this.createAutoplayButton(width / 2 + 200, panelY);

    // Ante bet toggle
    this.createAnteBetToggle(width / 2 + 400, panelY);
  }

  /**
   * Create bet controls
   */
  createBetControls(x, y) {
    // Bet label
    const betLabel = this.scene.add.text(x, y - 30, 'BET', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF'
    });
    betLabel.setOrigin(0.5);

    // Bet amount
    this.elements.betText = this.scene.add.text(x, y, '$1.00', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    this.elements.betText.setOrigin(0.5);

    // Decrease button
    this.elements.betDecreaseBtn = this.createButton(
      x - 60, y, 40, 40, '-', 0xFF4444
    );
    this.elements.betDecreaseBtn.on('pointerdown', () => {
      this.scene.events.emit('decreaseBet');
    });

    // Increase button
    this.elements.betIncreaseBtn = this.createButton(
      x + 60, y, 40, 40, '+', 0x44FF44
    );
    this.elements.betIncreaseBtn.on('pointerdown', () => {
      this.scene.events.emit('increaseBet');
    });
  }

  /**
   * Create spin button
   */
  createSpinButton(x, y) {
    this.elements.spinButton = this.createButton(
      x, y, 120, 120, 'SPIN', 0x00AA00, 0x00FF00
    );

    this.elements.spinButton.on('pointerdown', () => {
      this.scene.events.emit('spinRequested');
    });
  }

  /**
   * Create autoplay button
   */
  createAutoplayButton(x, y) {
    this.elements.autoplayButton = this.createButton(
      x, y - 15, 100, 50, 'AUTO', 0x4444FF
    );

    this.elements.autoplayButton.on('pointerdown', () => {
      this.scene.events.emit('autoplayToggle');
    });
  }

  /**
   * Create ante bet toggle
   */
  createAnteBetToggle(x, y) {
    const container = this.scene.add.container(x, y);

    const label = this.scene.add.text(0, -25, 'ANTE BET\n(+25%)', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'center'
    });
    label.setOrigin(0.5);

    this.elements.anteBetToggle = this.scene.add.rectangle(
      0, 10, 60, 30, 0x666666
    );
    this.elements.anteBetToggle.setStrokeStyle(2, 0xFFFFFF);
    this.elements.anteBetToggle.setInteractive({ useHandCursor: true });
    this.elements.anteBetToggle.setData('enabled', false);

    this.elements.anteBetToggle.on('pointerdown', () => {
      const enabled = !this.elements.anteBetToggle.getData('enabled');
      this.elements.anteBetToggle.setData('enabled', enabled);
      this.elements.anteBetToggle.setFillStyle(enabled ? 0x00AA00 : 0x666666);
      this.scene.events.emit('anteBetToggle', { enabled });
    });

    container.add([label, this.elements.anteBetToggle]);
  }

  /**
   * Create win display overlay
   */
  createWinDisplay() {
    const { width, height } = this.scene.scale;

    this.elements.winOverlay = this.scene.add.container(width / 2, height / 2);
    this.elements.winOverlay.setVisible(false);
    this.elements.winOverlay.setDepth(1000);

    // Win background
    const winBg = this.scene.add.rectangle(0, 0, 600, 300, 0x000000, 0.9);
    winBg.setStrokeStyle(4, 0xFFD700);

    // Win text
    this.elements.winAmountText = this.scene.add.text(0, -50, 'WIN!', {
      fontSize: '72px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#FF1493',
      strokeThickness: 8,
      fontStyle: 'bold'
    });
    this.elements.winAmountText.setOrigin(0.5);

    this.elements.winValueText = this.scene.add.text(0, 50, '$0.00', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
    this.elements.winValueText.setOrigin(0.5);

    this.elements.winOverlay.add([winBg, this.elements.winAmountText, this.elements.winValueText]);
  }

  /**
   * Create free spins overlay
   */
  createFreeSpinsOverlay() {
    const { width, height } = this.scene.scale;

    this.elements.freeSpinsOverlay = this.scene.add.container(width / 2, height / 2);
    this.elements.freeSpinsOverlay.setVisible(false);
    this.elements.freeSpinsOverlay.setDepth(1001);

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x8B008B, 0.95);

    const title = this.scene.add.text(0, -100, 'FREE SPINS!', {
      fontSize: '96px',
      fontFamily: 'Arial',
      color: '#FFD700',
      stroke: '#FF1493',
      strokeThickness: 10,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    this.elements.freeSpinsAwardText = this.scene.add.text(0, 50, '10 FREE SPINS', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
    this.elements.freeSpinsAwardText.setOrigin(0.5);

    this.elements.freeSpinsOverlay.add([bg, title, this.elements.freeSpinsAwardText]);
  }

  /**
   * Create button helper
   */
  createButton(x, y, width, height, text, color, hoverColor) {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, width, height, color);
    bg.setStrokeStyle(3, 0xFFFFFF);
    bg.setInteractive({ useHandCursor: true });

    const label = this.scene.add.text(0, 0, text, {
      fontSize: height > 60 ? '32px' : '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor || color);
      bg.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(color);
      bg.setScale(1);
    });

    container.add([bg, label]);
    container.setData('button', bg);

    return container;
  }

  /**
   * Update balance display
   */
  updateBalance(balance) {
    this.elements.balanceText.setText(`$${balance.toFixed(2)}`);
  }

  /**
   * Update bet display
   */
  updateBet(bet) {
    this.elements.betText.setText(`$${bet.toFixed(2)}`);
  }

  /**
   * Update free spins counter
   */
  updateFreeSpins(remaining) {
    if (remaining > 0) {
      this.elements.freeSpinsCounter.setVisible(true);
      this.elements.freeSpinsText.setText(remaining.toString());
    } else {
      this.elements.freeSpinsCounter.setVisible(false);
    }
  }

  /**
   * Show win overlay
   */
  showWin(amount, type = 'normal') {
    this.elements.winOverlay.setVisible(true);

    let title = 'WIN!';
    let color = '#FFD700';

    if (type === 'big') {
      title = 'BIG WIN!';
      color = '#FF8C00';
    } else if (type === 'mega') {
      title = 'MEGA WIN!';
      color = '#FF1493';
    }

    this.elements.winAmountText.setText(title);
    this.elements.winAmountText.setColor(color);
    this.elements.winValueText.setText(`$${amount.toFixed(2)}`);

    // Animate
    this.scene.tweens.add({
      targets: this.elements.winOverlay,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Hide after delay
    this.scene.time.delayedCall(3000, () => {
      this.hideWin();
    });
  }

  /**
   * Hide win overlay
   */
  hideWin() {
    this.scene.tweens.add({
      targets: this.elements.winOverlay,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.elements.winOverlay.setVisible(false);
        this.elements.winOverlay.setAlpha(1);
      }
    });
  }

  /**
   * Show free spins trigger overlay
   */
  showFreeSpinsTrigger(spins) {
    this.elements.freeSpinsAwardText.setText(`${spins} FREE SPINS`);
    this.elements.freeSpinsOverlay.setVisible(true);

    // Animate
    this.scene.tweens.add({
      targets: this.elements.freeSpinsOverlay,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });

    // Hide after delay
    this.scene.time.delayedCall(3000, () => {
      this.hideFreeSpinsTrigger();
    });
  }

  /**
   * Hide free spins overlay
   */
  hideFreeSpinsTrigger() {
    this.scene.tweens.add({
      targets: this.elements.freeSpinsOverlay,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.elements.freeSpinsOverlay.setVisible(false);
        this.elements.freeSpinsOverlay.setAlpha(1);
      }
    });
  }

  /**
   * Enable/disable spin button
   */
  setSpinEnabled(enabled) {
    const button = this.elements.spinButton.getData('button');
    button.setInteractive(enabled);
    button.setAlpha(enabled ? 1 : 0.5);
  }
}

export default GameUI;
