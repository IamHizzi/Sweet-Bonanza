/**
 * Backend API Integration Layer
 * ALL game logic (RNG, payouts, outcomes) is controlled by the backend
 * NO client-side manipulation or RNG
 */

import axios from 'axios';
import GameConfig from '../config/GameConfig.js';

export class GameAPI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.VITE_API_BASE_URL || 'https://api.example.com';
    this.apiKey = config.apiKey || process.env.VITE_API_KEY;
    this.sessionToken = null;
    this.playerId = null;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: GameConfig.API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Type': 'sweet-bonanza',
        'X-Game-Version': '1.0.0'
      }
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['X-API-Key'] = this.apiKey;
        }
        if (this.sessionToken) {
          config.headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleAPIError(error)
    );
  }

  /**
   * Initialize game session
   * @param {Object} params - Session parameters
   * @returns {Promise<Object>} Session data
   */
  async initSession(params = {}) {
    try {
      const response = await this.client.post('/game/init', {
        playerId: params.playerId,
        currency: params.currency || 'USD',
        gameMode: params.gameMode || 'real', // 'real' or 'demo'
        locale: params.locale || 'en'
      });

      this.sessionToken = response.data.sessionToken;
      this.playerId = response.data.playerId;

      return {
        success: true,
        sessionId: response.data.sessionId,
        balance: response.data.balance,
        currency: response.data.currency,
        playerData: response.data.playerData
      };
    } catch (error) {
      throw new Error(`Session initialization failed: ${error.message}`);
    }
  }

  /**
   * Request spin outcome from backend
   * CRITICAL: All RNG and game logic happens server-side
   * @param {Object} spinRequest - Spin parameters
   * @returns {Promise<Object>} Spin result with predetermined outcome
   */
  async requestSpin(spinRequest) {
    try {
      const response = await this.client.post('/game/spin', {
        betAmount: spinRequest.betAmount,
        anteBet: spinRequest.anteBet || false,
        isFreeSpins: spinRequest.isFreeSpins || false,
        freeSpinsRemaining: spinRequest.freeSpinsRemaining || 0,
        accumulatedMultiplier: spinRequest.accumulatedMultiplier || 1,
        timestamp: Date.now(),

        // Security: Request signature (implement HMAC signing)
        requestId: this.generateRequestId(),
        signature: this.generateSignature(spinRequest)
      });

      // Validate response signature
      if (!this.validateResponseSignature(response.data)) {
        throw new Error('Invalid response signature - potential tampering detected');
      }

      return this.parseSpinResponse(response.data);
    } catch (error) {
      throw new Error(`Spin request failed: ${error.message}`);
    }
  }

  /**
   * Parse and validate spin response from backend
   * @param {Object} data - Raw response data
   * @returns {Object} Validated spin result
   */
  parseSpinResponse(data) {
    // Validate required fields
    const requiredFields = ['spinId', 'grid', 'winData', 'balance', 'timestamp'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Invalid response: missing ${field}`);
      }
    }

    // Validate grid structure
    if (!Array.isArray(data.grid) || data.grid.length !== GameConfig.GRID.COLS) {
      throw new Error('Invalid grid structure');
    }

    for (const reel of data.grid) {
      if (!Array.isArray(reel) || reel.length !== GameConfig.GRID.ROWS) {
        throw new Error('Invalid reel structure');
      }
    }

    return {
      spinId: data.spinId,

      // Grid result (predetermined by backend)
      grid: data.grid, // 6x5 array of symbol IDs

      // Tumble sequence (all tumbles predetermined)
      tumbles: data.tumbles || [], // Array of tumble results

      // Win information
      winData: {
        clusters: data.winData.clusters || [], // Array of winning clusters
        totalWin: data.winData.totalWin || 0,
        multipliers: data.winData.multipliers || [],
        finalMultiplier: data.winData.finalMultiplier || 1
      },

      // Free spins data
      freeSpins: {
        triggered: data.freeSpins?.triggered || false,
        remaining: data.freeSpins?.remaining || 0,
        totalAwarded: data.freeSpins?.totalAwarded || 0,
        retriggered: data.freeSpins?.retriggered || false
      },

      // Updated balance
      balance: data.balance,

      // Additional data
      timestamp: data.timestamp,
      roundId: data.roundId,

      // Signature for verification
      signature: data.signature
    };
  }

  /**
   * Get current balance
   * @returns {Promise<number>} Current balance
   */
  async getBalance() {
    try {
      const response = await this.client.get('/game/balance');
      return response.data.balance;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get game history
   * @param {number} limit - Number of records to fetch
   * @returns {Promise<Array>} Game history
   */
  async getHistory(limit = 50) {
    try {
      const response = await this.client.get('/game/history', {
        params: { limit }
      });
      return response.data.history;
    } catch (error) {
      throw new Error(`Failed to get history: ${error.message}`);
    }
  }

  /**
   * End game session
   * @returns {Promise<Object>} Session summary
   */
  async endSession() {
    try {
      const response = await this.client.post('/game/end');
      this.sessionToken = null;
      return response.data;
    } catch (error) {
      throw new Error(`Failed to end session: ${error.message}`);
    }
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate HMAC signature for request
   * @param {Object} data - Request data
   * @returns {string} Signature
   */
  generateSignature(data) {
    // TODO: Implement proper HMAC-SHA256 signing
    // This should use a shared secret between client and server
    // For now, return placeholder
    const payload = JSON.stringify(data);
    return btoa(payload); // Replace with actual HMAC implementation
  }

  /**
   * Validate response signature
   * @param {Object} data - Response data
   * @returns {boolean} Is valid
   */
  validateResponseSignature(data) {
    // TODO: Implement proper signature validation
    // Verify HMAC signature from backend
    return true; // Replace with actual validation
  }

  /**
   * Handle API errors with retry logic
   * @param {Error} error - Error object
   * @returns {Promise} Rejected promise
   */
  async handleAPIError(error) {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(`Invalid request: ${data.message}`);
        case 401:
          throw new Error('Session expired - please login again');
        case 403:
          throw new Error('Insufficient funds or access denied');
        case 429:
          throw new Error('Too many requests - please wait');
        case 500:
          throw new Error('Server error - please try again');
        default:
          throw new Error(`API error: ${data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }

  /**
   * Heartbeat to keep session alive
   * @returns {Promise<boolean>} Success status
   */
  async heartbeat() {
    try {
      await this.client.post('/game/heartbeat');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default GameAPI;
