/**
 * Audio Manager
 * Manages all game sounds and music
 */

import GameConfig from '../config/GameConfig.js';

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.musicTrack = null;

    this.masterVolume = GameConfig.AUDIO.MASTER_VOLUME;
    this.musicVolume = GameConfig.AUDIO.MUSIC_VOLUME;
    this.sfxVolume = GameConfig.AUDIO.SFX_VOLUME;

    this.muted = false;
  }

  /**
   * Initialize audio system
   * Load and setup all sounds
   */
  init() {
    // In production, load actual audio files
    // For now, we'll use placeholder/silent approach

    // Create sound instances (placeholder)
    this.createPlaceholderSounds();
  }

  /**
   * Create placeholder sound objects
   * Replace with actual audio loading in production
   */
  createPlaceholderSounds() {
    const soundKeys = Object.keys(GameConfig.AUDIO.SOUNDS);

    for (const key of soundKeys) {
      // In production: this.scene.sound.add(key)
      this.sounds.set(key, {
        key,
        placeholder: true,
        play: () => this.playPlaceholder(key),
        stop: () => {},
        setVolume: () => {}
      });
    }
  }

  /**
   * Placeholder play function
   * @param {string} key - Sound key
   */
  playPlaceholder(key) {
    // Silent placeholder for development
    // In production, this would play actual audio
    console.log(`[Audio] Playing: ${key}`);
  }

  /**
   * Play sound effect
   * @param {string} soundKey - Sound identifier
   * @param {Object} options - Playback options
   */
  playSFX(soundKey, options = {}) {
    if (this.muted) return;

    const sound = this.sounds.get(soundKey);
    if (!sound) {
      console.warn(`Sound not found: ${soundKey}`);
      return;
    }

    const volume = (options.volume || 1) * this.sfxVolume * this.masterVolume;

    if (sound.placeholder) {
      sound.play();
    } else {
      this.scene.sound.play(soundKey, {
        volume,
        ...options
      });
    }
  }

  /**
   * Play background music
   * @param {string} trackKey - Music track key
   */
  playMusic(trackKey) {
    if (this.muted) return;

    this.stopMusic();

    const sound = this.sounds.get(trackKey);
    if (!sound) {
      console.warn(`Music track not found: ${trackKey}`);
      return;
    }

    if (sound.placeholder) {
      sound.play();
      this.musicTrack = sound;
    } else {
      this.musicTrack = this.scene.sound.add(trackKey, {
        loop: true,
        volume: this.musicVolume * this.masterVolume
      });
      this.musicTrack.play();
    }
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.musicTrack && !this.musicTrack.placeholder) {
      this.musicTrack.stop();
    }
    this.musicTrack = null;
  }

  /**
   * Play spin sound
   */
  playSpinSound() {
    this.playSFX('SPIN');
  }

  /**
   * Play win sound
   * @param {string} winType - Win type (normal, big, mega)
   */
  playWinSound(winType = 'normal') {
    if (winType === 'mega') {
      this.playSFX('MEGA_WIN');
    } else if (winType === 'big') {
      this.playSFX('BIG_WIN');
    } else {
      this.playSFX('WIN');
    }
  }

  /**
   * Play symbol land sound
   */
  playLandSound() {
    this.playSFX('SYMBOL_LAND', { volume: 0.5 });
  }

  /**
   * Play tumble sound
   */
  playTumbleSound() {
    this.playSFX('TUMBLE');
  }

  /**
   * Play multiplier sound
   */
  playMultiplierSound() {
    this.playSFX('MULTIPLIER');
  }

  /**
   * Play scatter sound
   */
  playScatterSound() {
    this.playSFX('SCATTER');
  }

  /**
   * Play free spins trigger sound
   */
  playFreeSpinsStartSound() {
    this.playSFX('FREE_SPINS_START');
  }

  /**
   * Play free spins end sound
   */
  playFreeSpinsEndSound() {
    this.playSFX('FREE_SPINS_END');
  }

  /**
   * Play button click sound
   */
  playButtonSound() {
    this.playSFX('BUTTON_CLICK', { volume: 0.6 });
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * Set music volume
   * @param {number} volume - Volume (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * Set SFX volume
   * @param {number} volume - Volume (0-1)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Update music volume
   */
  updateMusicVolume() {
    if (this.musicTrack && !this.musicTrack.placeholder) {
      this.musicTrack.setVolume(this.musicVolume * this.masterVolume);
    }
  }

  /**
   * Mute all audio
   */
  mute() {
    this.muted = true;
    this.stopMusic();
  }

  /**
   * Unmute all audio
   */
  unmute() {
    this.muted = false;
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopMusic();
    this.sounds.clear();
  }
}

export default AudioManager;
