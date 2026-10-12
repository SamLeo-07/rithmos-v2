export class ConcertAudio {
  constructor() {
    this.audio = null;
    this.ctx = null;
    this.source = null;
    this.gainNode = null;
    this.filter = null;
    this.isPlaying = false;
    this.targetVolume = 0.70;
    this.fadeDuration = 2.0;
    this.fadeOutDuration = 1.2;
    this.loopFadeDuration = 2.5;
    this.onStateChange = null;
    this.isTransitioning = false;
  }

  init() {
    if (this.audio) return;

    this.audio = new Audio('/assets/rithmos-theme.mp3');
    this.audio.loop = true;
    this.audio.preload = 'auto';

    // Set up Web Audio API routing for smooth master gain ramps & acoustic filter sweep
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      try {
        this.ctx = new AudioContext();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(3200, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        this.source = this.ctx.createMediaElementSource(this.audio);
        this.source.connect(this.filter);
        this.filter.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
      } catch (err) {
        console.warn('Web Audio routing fallback to element volume:', err);
        this.ctx = null;
      }
    }

    this.setupLoopFade();
  }

  setupLoopFade() {
    if (!this.audio) return;

    // Smooth loop boundary fade-out and fade-in
    this.audio.addEventListener('timeupdate', () => {
      if (!this.isPlaying || !this.audio || !this.audio.duration || this.isTransitioning) return;

      const duration = this.audio.duration;
      const current = this.audio.currentTime;
      const fadeOutWindow = this.loopFadeDuration; // 2.5s before end
      const fadeInWindow = 2.0;                   // 2.0s after loop start

      // Approaching end of track -> smooth fade out before loop point
      if (current >= duration - fadeOutWindow) {
        const remaining = duration - current;
        const p = Math.max(0, remaining / fadeOutWindow); // 1.0 -> 0.0
        const vol = Math.max(0.0001, this.targetVolume * p);
        this.setVolumeDirect(vol, 0.1);
      }
      // Just looped back to start -> smooth fade in
      else if (current <= fadeInWindow) {
        const p = Math.min(1, current / fadeInWindow); // 0.0 -> 1.0
        const vol = Math.max(0.0001, this.targetVolume * Math.max(0.08, p));
        this.setVolumeDirect(vol, 0.15);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.isPlaying) {
        this.fadeIn(1.8);
      }
    });
  }

  setVolumeDirect(vol, timeConstant = 0.1) {
    if (this.ctx && this.gainNode) {
      this.gainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, timeConstant);
    } else if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, vol));
    }
  }

  fadeIn(duration = 2.0) {
    if (!this.audio) this.init();

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isTransitioning = true;
    const playPromise = this.audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          if (this.onStateChange) this.onStateChange(true);

          if (this.ctx && this.gainNode) {
            const now = this.ctx.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setValueAtTime(Math.max(0.0001, this.gainNode.gain.value), now);
            this.gainNode.gain.linearRampToValueAtTime(this.targetVolume, now + duration);
          } else if (this.audio) {
            this.fadeVolume(0, this.targetVolume, duration);
          }

          setTimeout(() => {
            this.isTransitioning = false;
          }, duration * 1000);
        })
        .catch((err) => {
          this.isTransitioning = false;
          // Autoplay deferred pending user interaction
        });
    }
  }

  fadeOut(duration = 1.2, pauseAfter = true) {
    if (!this.isPlaying || !this.audio) return;

    this.isTransitioning = true;

    if (this.ctx && this.gainNode) {
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(Math.max(0.0001, this.gainNode.gain.value), now);
      this.gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

      if (pauseAfter) {
        setTimeout(() => {
          if (!this.isPlaying && this.audio) {
            this.audio.pause();
          }
          this.isTransitioning = false;
        }, duration * 1000);
      } else {
        this.isTransitioning = false;
      }
    } else if (this.audio) {
      this.fadeVolume(this.audio.volume, 0, duration, () => {
        if (pauseAfter && this.audio) this.audio.pause();
        this.isTransitioning = false;
      });
    }

    if (pauseAfter) {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    }
  }

  fadeVolume(from, to, duration, onComplete = null) {
    if (!this.audio) return;
    const start = performance.now();
    const durationMs = duration * 1000;

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const val = from + (to - from) * progress;
      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, val));
      }
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  toggle() {
    if (!this.audio) this.init();

    if (this.isPlaying) {
      this.fadeOut(this.fadeOutDuration, true);
      return false;
    } else {
      this.fadeIn(this.fadeDuration);
      return true;
    }
  }

  updateScroll(scrollProgress) {
    if (!this.ctx || !this.filter || !this.isPlaying || this.isTransitioning) return;

    let targetFreq = 3200;
    if (scrollProgress < 0.20) {
      targetFreq = 3200;
    } else if (scrollProgress >= 0.20 && scrollProgress < 0.40) {
      const p = (scrollProgress - 0.20) / 0.20;
      targetFreq = 3200 - p * 1800; // drops to 1400Hz (jam room acoustic warmth)
    } else if (scrollProgress >= 0.40 && scrollProgress < 0.70) {
      const p = (scrollProgress - 0.40) / 0.30;
      targetFreq = 1400 + p * 3000; // expands to 4400Hz
    } else {
      const p = (scrollProgress - 0.70) / 0.30;
      targetFreq = 4400 + p * 3600; // full arena treble brilliance up to 8000Hz
    }

    this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.12);
  }
}
