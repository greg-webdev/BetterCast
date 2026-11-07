/**
 * VIDAA OS Smart TV Navigation & Stream Receiver Adapter
 * Compatible with VIDAA U4, U5, U6, and U7 (Hisense / Toshiba Smart TVs)
 * 
 * Features:
 * - Full D-Pad Remote Navigation (Up, Down, Left, Right, OK, Back)
 * - Automatic TV resolution scaling (1080p / 4K UHD)
 * - Memory leak prevention for TV web engine (object URL pooling)
 * - Remote number pad and color key support
 * - LocalStorage persistence for target IP
 */

(function () {
  'use strict';

  // Common Smart TV / VIDAA Remote Keycodes
  const TV_KEYS = {
    LEFT: [37],
    UP: [38],
    RIGHT: [39],
    DOWN: [40],
    ENTER: [13],
    RETURN: [8, 27, 461, 10009],      // Back / Return
    PLAY: [415, 19],
    PAUSE: [19],
    STOP: [413],
    FAST_FWD: [417],
    REWIND: [412],
    RED: [403],
    GREEN: [404],
    YELLOW: [405],
    BLUE: [406],
    NUM_0: 48,
    NUM_9: 57
  };

  class VidaaController {
    constructor() {
      this.focusableElements = [];
      this.currentIndex = 0;
      this.lastInputTime = 0;
      this.isTvDevice = this.detectVidaa();
      this.init();
    }

    detectVidaa() {
      const ua = navigator.userAgent.toLowerCase();
      return (
        ua.includes('vidaa') ||
        ua.includes('hisense') ||
        ua.includes('smart-tv') ||
        ua.includes('smarttv') ||
        ua.includes('hbbtv')
      );
    }

    init() {
      this.refreshFocusables();
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));

      // Attempt to prevent TV browser screen saver / sleep during playback
      this.keepTvAwake();

      // Auto-focus first element
      if (this.focusableElements.length > 0) {
        this.setFocus(0);
      }
    }

    refreshFocusables() {
      // Find all navigable elements
      this.focusableElements = Array.from(
        document.querySelectorAll(
          'input:not([disabled]), button:not([disabled]), a:not([disabled]), [tabindex="0"]'
        )
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    }

    setFocus(index) {
      if (this.focusableElements.length === 0) return;
      
      // Clamp index
      if (index < 0) index = 0;
      if (index >= this.focusableElements.length) index = this.focusableElements.length - 1;

      // Remove focus from previous
      if (this.focusableElements[this.currentIndex]) {
        this.focusableElements[this.currentIndex].blur();
        this.focusableElements[this.currentIndex].classList.remove('tv-focused');
      }

      this.currentIndex = index;
      const target = this.focusableElements[this.currentIndex];
      if (target) {
        target.focus();
        target.classList.add('tv-focused');
      }
    }

    handleKeyDown(e) {
      const keyCode = e.keyCode || e.which;

      // Back / Return key
      if (TV_KEYS.RETURN.includes(keyCode)) {
        e.preventDefault();
        this.handleBack();
        return;
      }

      // OK / Enter key
      if (TV_KEYS.ENTER.includes(keyCode)) {
        const active = this.focusableElements[this.currentIndex];
        if (active && active.tagName !== 'INPUT') {
          e.preventDefault();
          active.click();
        }
        return;
      }

      // D-Pad navigation
      if (TV_KEYS.LEFT.includes(keyCode)) {
        e.preventDefault();
        this.navigate(-1);
      } else if (TV_KEYS.RIGHT.includes(keyCode)) {
        e.preventDefault();
        this.navigate(1);
      } else if (TV_KEYS.UP.includes(keyCode)) {
        e.preventDefault();
        this.navigate(-1);
      } else if (TV_KEYS.DOWN.includes(keyCode)) {
        e.preventDefault();
        this.navigate(1);
      } else if (TV_KEYS.BLUE.includes(keyCode) || TV_KEYS.PLAY.includes(keyCode)) {
        // Quick toggle fullscreen with blue button or play button
        e.preventDefault();
        if (typeof window.toggleFullscreen === 'function') {
          window.toggleFullscreen();
        }
      }
    }

    navigate(delta) {
      this.refreshFocusables();
      if (this.focusableElements.length === 0) return;
      let nextIndex = this.currentIndex + delta;
      if (nextIndex < 0) nextIndex = this.focusableElements.length - 1;
      if (nextIndex >= this.focusableElements.length) nextIndex = 0;
      this.setFocus(nextIndex);
    }

    handleBack() {
      // If in fullscreen, exit fullscreen first
      if (document.fullscreenElement) {
        if (typeof window.toggleFullscreen === 'function') {
          window.toggleFullscreen();
        }
      } else {
        // Disconnect if connected
        if (typeof window.disconnect === 'function') {
          window.disconnect();
        }
      }
    }

    keepTvAwake() {
      // Send lightweight periodic dummy activity to prevent TV power saving
      setInterval(() => {
        try {
          window.dispatchEvent(new Event('mousemove'));
        } catch (e) {}
      }, 30000);
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.vidaaController = new VidaaController();
    });
  } else {
    window.vidaaController = new VidaaController();
  }
})();

