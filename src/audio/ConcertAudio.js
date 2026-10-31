// Gapless "Live Track" loop.
// The theme is decoded once and played as a looping Web Audio buffer, so the loop point has no restart gap
// and no volume dip. rithmos-theme-loop.mp3 is a loop-ready edit of the theme (silence trimmed, end blended
// into the start); any codec padding left after decoding is trimmed below by setting loopStart / loopEnd.
const LOOP_URL = '/assets/rithmos-theme-loop.mp3';

export class ConcertAudio {
  constructor() {
    this.ctx = null;
    this.gainNode = null;
    this.filter = null;
    this.source = null;
    this.buffer = null;
    this.loopStart = 0;
    this.loopEnd = 0;
    this.ready = null;
    this.fallback = null;
    this.isPlaying = false;
    this.wantPlaying = false;
    this.targetVolume = 0.70;
    this.fadeDuration = 2.0;
    this.fadeOutDuration = 1.2;
    this.onStateChange = null;
    this.isTransitioning = false;
    this.suspendTimer = null;
    this.transitionTimer = null;
  }

  init() {
    if (this.ready) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.useFallback();
      return;
    }

    try {
      this.ctx = new AudioContext();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      // Lowpass sweep driven by scroll position (see updateScroll)
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    } catch (err) {
      console.warn('Web Audio unavailable, using plain audio loop:', err);
      this.ctx = null;
      this.useFallback();
      return;
    }

    this.ready = fetch(LOOP_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => this.ctx.decodeAudioData(data))
      .then((buf) => {
        this.buffer = buf;
        this.trimLoopPoints(buf);
      })
      .catch((err) => {
        console.warn('Loop decode failed, using plain audio loop:', err);
        this.useFallback();
      });
  }

  // Loop only the audible part of the decoded buffer (drops any encoder / decoder padding)
  trimLoopPoints(buf) {
    const data = buf.getChannelData(0);
    const threshold = 0.0005;
    let first = 0;
    let last = data.length - 1;
    while (first < last && Math.abs(data[first]) < threshold) first++;
    while (last > first && Math.abs(data[last]) < threshold) last--;
    this.loopStart = first / buf.sampleRate;
    this.loopEnd = (last + 1) / buf.sampleRate;
  }

  useFallback() {
    if (this.fallback) return;
    this.fallback = new Audio(LOOP_URL);
    this.fallback.loop = true;
    this.fallback.preload = 'auto';
    this.fallback.volume = 0;
    this.ready = this.ready || Promise.resolve();
  }

  startSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = true;
    src.loopStart = this.loopStart;
    src.loopEnd = this.loopEnd;
    src.connect(this.filter);
    src.start(0, this.loopStart);
    this.source = src;
  }

  async fadeIn(duration = 2.0) {
    this.init();
    this.wantPlaying = true;
    clearTimeout(this.suspendTimer);
    clearTimeout(this.transitionTimer);
    this.isTransitioning = true;

    try {
      if (this.ctx) await this.ctx.resume(); // stays pending / rejects until the first user gesture
      await this.ready;
    } catch (err) {
      this.isTransitioning = false;
      return; // autoplay deferred until a user gesture calls fadeIn again
    }

    if (!this.wantPlaying) return;

    if (this.fallback) {
      try {
        await this.fallback.play();
      } catch (err) {
        this.isTransitioning = false;
        return;
      }
      this.fadeElement(this.fallback.volume, this.targetVolume, duration);
    } else {
      if (this.ctx.state !== 'running') {
        this.isTransitioning = false;
        return;
      }
      if (!this.source) this.startSource();
      const now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(Math.max(0.0001, this.gainNode.gain.value), now);
      this.gainNode.gain.linearRampToValueAtTime(this.targetVolume, now + duration);
    }

    this.isPlaying = true;
    if (this.onStateChange) this.onStateChange(true);
    this.transitionTimer = setTimeout(() => {
      this.isTransitioning = false;
    }, duration * 1000);
  }

  fadeOut(duration = 1.2) {
    this.wantPlaying = false;
    if (!this.isPlaying) return;

    clearTimeout(this.transitionTimer);
    this.isTransitioning = true;
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange(false);

    if (this.fallback) {
      this.fadeElement(this.fallback.volume, 0, duration, () => {
        this.fallback.pause();
        this.isTransitioning = false;
      });
      return;
    }

    const now = this.ctx.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(Math.max(0.0001, this.gainNode.gain.value), now);
    this.gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

    // Suspending keeps the loop position, so the next fade-in carries on where it stopped
    this.suspendTimer = setTimeout(() => {
      if (!this.wantPlaying) this.ctx.suspend();
      this.isTransitioning = false;
    }, duration * 1000);
  }

  fadeElement(from, to, duration, onComplete = null) {
    const start = performance.now();
    const durationMs = duration * 1000;
    const step = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      this.fallback.volume = Math.max(0, Math.min(1, from + (to - from) * progress));
      if (progress < 1) requestAnimationFrame(step);
      else if (onComplete) onComplete();
    };
    requestAnimationFrame(step);
  }

  toggle() {
    if (this.isPlaying) {
      this.fadeOut(this.fadeOutDuration);
      return false;
    }
    this.fadeIn(this.fadeDuration);
    return true;
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
