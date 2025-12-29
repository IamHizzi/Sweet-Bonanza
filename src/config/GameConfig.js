/**
 * Sweet Bonanza Game Configuration
 * Production-grade configuration matching Pragmatic Play specifications
 */

export const GameConfig = {
  // Game Dimensions
  GRID: {
    COLS: 6,
    ROWS: 5,
    TOTAL_POSITIONS: 30
  },

  // Symbol Configuration
  SYMBOLS: {
    // High-value fruit symbols
    HIGH_VALUE: [
      { id: 'BANANA', name: 'Banana', value: 50, color: 0xFFE135 },
      { id: 'GRAPES', name: 'Grapes', value: 40, color: 0x9B4F96 },
      { id: 'WATERMELON', name: 'Watermelon', value: 35, color: 0xFF6B6B },
      { id: 'PLUM', name: 'Plum', value: 30, color: 0x8B4789 },
      { id: 'APPLE', name: 'Apple', value: 25, color: 0xFF5252 }
    ],

    // Low-value candy symbols
    LOW_VALUE: [
      { id: 'HEART_CANDY', name: 'Heart Candy', value: 10, color: 0xFF69B4 },
      { id: 'SQUARE_CANDY', name: 'Square Candy', value: 8, color: 0x4FC3F7 },
      { id: 'STAR_CANDY', name: 'Star Candy', value: 6, color: 0xFFD54F },
      { id: 'TRIANGLE_CANDY', name: 'Triangle Candy', value: 5, color: 0x9CCC65 }
    ],

    // Special symbols
    SCATTER: { id: 'LOLLIPOP', name: 'Lollipop Scatter', color: 0xFF1744 },
    MULTIPLIER: { id: 'BOMB', name: 'Multiplier Bomb', color: 0xFF6F00 }
  },

  // Win Configuration
  WIN_RULES: {
    MIN_CLUSTER_SIZE: 8,
    CLUSTER_DETECTION: 'ADJACENT', // Adjacent touching symbols
    WIN_CALCULATION: 'TOTAL_CLUSTER_SIZE'
  },

  // Multiplier Configuration
  MULTIPLIERS: {
    BASE_GAME: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50, 100],
    FREE_SPINS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 50, 100],
    ACCUMULATE_IN_FREE_SPINS: true
  },

  // Free Spins Configuration
  FREE_SPINS: {
    TRIGGER_SCATTERS: 4,
    INITIAL_SPINS: 10,
    RETRIGGER_SCATTERS: 3,
    RETRIGGER_SPINS: 5
  },

  // Ante Bet Configuration
  ANTE_BET: {
    ENABLED: true,
    COST_MULTIPLIER: 1.25,
    SCATTER_CHANCE_MULTIPLIER: 2
  },

  // Betting Configuration
  BET_SETTINGS: {
    MIN_BET: 0.20,
    MAX_BET: 100.00,
    DEFAULT_BET: 1.00,
    BET_LEVELS: [
      0.20, 0.40, 0.60, 0.80, 1.00,
      2.00, 3.00, 4.00, 5.00, 10.00,
      20.00, 50.00, 100.00
    ]
  },

  // Animation Timings (milliseconds)
  ANIMATIONS: {
    SYMBOL_DROP: 100,
    SYMBOL_LAND: 50,
    WIN_HIGHLIGHT: 800,
    SYMBOL_EXPLODE: 300,
    TUMBLE_DELAY: 400,
    MULTIPLIER_SHOW: 600,
    FREE_SPIN_TRIGGER: 2000,
    WIN_COUNT_UP: 1500
  },

  // Autoplay Configuration
  AUTOPLAY: {
    OPTIONS: [10, 25, 50, 100, 250, 500, 1000],
    STOP_CONDITIONS: {
      ON_ANY_WIN: true,
      ON_FREE_SPINS: true,
      ON_SINGLE_WIN_EXCEEDS: true,
      ON_BALANCE_DECREASE: true,
      ON_BALANCE_INCREASE: true
    }
  },

  // Responsible Gaming
  RESPONSIBLE_GAMING: {
    SESSION_REMINDER_INTERVAL: 3600000, // 1 hour
    LOSS_LIMIT_WARNING: true,
    TIME_PLAYED_DISPLAY: true,
    REALITY_CHECK: true
  },

  // API Configuration
  API: {
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },

  // RTP Information (for display only - actual RTP controlled by backend)
  RTP: {
    DISPLAY_RTP: 96.51,
    VOLATILITY: 'HIGH',
    MAX_WIN: '21,100x'
  },

  // Audio Configuration
  AUDIO: {
    MASTER_VOLUME: 0.7,
    MUSIC_VOLUME: 0.5,
    SFX_VOLUME: 0.8,
    SOUNDS: {
      SPIN: 'spin.mp3',
      WIN: 'win.mp3',
      BIG_WIN: 'bigwin.mp3',
      MEGA_WIN: 'megawin.mp3',
      SCATTER: 'scatter.mp3',
      SYMBOL_LAND: 'land.mp3',
      TUMBLE: 'tumble.mp3',
      MULTIPLIER: 'multiplier.mp3',
      FREE_SPINS_START: 'freespins_start.mp3',
      FREE_SPINS_END: 'freespins_end.mp3',
      BACKGROUND_MUSIC: 'background.mp3',
      BUTTON_CLICK: 'button.mp3'
    }
  }
};

// Symbol weights are controlled by backend
export const SYMBOL_IDS = {
  BANANA: 0,
  GRAPES: 1,
  WATERMELON: 2,
  PLUM: 3,
  APPLE: 4,
  HEART_CANDY: 5,
  SQUARE_CANDY: 6,
  STAR_CANDY: 7,
  TRIANGLE_CANDY: 8,
  LOLLIPOP: 9, // Scatter
  BOMB: 10 // Multiplier
};

export const GAME_STATES = {
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  CHECKING_WIN: 'CHECKING_WIN',
  SHOWING_WIN: 'SHOWING_WIN',
  TUMBLING: 'TUMBLING',
  FREE_SPINS: 'FREE_SPINS',
  AUTOPLAY: 'AUTOPLAY',
  ERROR: 'ERROR'
};

export default GameConfig;
