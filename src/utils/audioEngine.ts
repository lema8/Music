import { Track, EQPreset } from '../types';
import { triggerHaptic } from './haptics';

class SoundVaultAudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;

  // Synthesizer nodes for generative audio when no audio stream exists
  private synthInterval: number | null = null;
  private synthGain: GainNode | null = null;
  private isSynthesizing: boolean = false;

  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 288;
  private volume: number = 0.75;
  private eqPreset: EQPreset = 'Studio Warmth';

  // Object URL we created from a stored audioBlob — revoked when replaced.
  private managedObjectUrl: string | null = null;

  private listeners: Set<() => void> = new Set();
  private animFrameId: number | null = null;

  // Track navigation callbacks for Android MediaSession controls
  private onNextCallback: (() => void) | null = null;
  private onPrevCallback: (() => void) | null = null;

  constructor() {
    // Initialized lazily on first user interaction
  }

  public registerNavigationCallbacks(onPrev: () => void, onNext: () => void) {
    this.onPrevCallback = onPrev;
    this.onNextCallback = onNext;
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();

      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';

      // Master Gain Node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      // 3-Band Biquad Filters for Hardware-Style EQ
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 250;

      this.midFilter = this.audioCtx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1200;
      this.midFilter.Q.value = 1.0;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 4000;

      // Analyser for real-time visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Synth gain
      this.synthGain = this.audioCtx.createGain();
      this.synthGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

      // Connect graph: Source -> Bass -> Mid -> Treble -> Analyser -> Master Gain -> Destination
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.bassFilter);
      } catch {
        // Safe fallback
      }

      this.synthGain.connect(this.bassFilter);
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.applyEQ(this.eqPreset);

      // Audio element event handlers
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && !this.isSynthesizing) {
          this.currentTime = this.audioElement.currentTime;
          this.updateMediaSessionPosition();
          this.notify();
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
        if (this.onNextCallback) {
          this.onNextCallback();
        } else {
          this.notify();
        }
      });

      this.setupMediaSessionHandlers();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Android MediaSession API Integration
   * Powers Android Notification Shade, Lockscreen controls & Bluetooth metadata
   */
  private setupMediaSessionHandlers() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          this.play();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.pause();
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.seek(details.seekTime);
          }
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (this.onPrevCallback) this.onPrevCallback();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (this.onNextCallback) this.onNextCallback();
        });
      } catch {
        // Handlers may not be supported on all browsers
      }
    }
  }

  private updateMediaSessionMetadata() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && this.currentTrack) {
      try {
        const track = this.currentTrack;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'SoundVault Vault',
          artwork: [
            { src: track.coverArt, sizes: '96x96', type: 'image/jpeg' },
            { src: track.coverArt, sizes: '128x128', type: 'image/jpeg' },
            { src: track.coverArt, sizes: '192x192', type: 'image/png' },
            { src: track.coverArt, sizes: '256x256', type: 'image/jpeg' },
            { src: track.coverArt, sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
      } catch {
        // Safe fallback
      }
    }
  }

  private updateMediaSessionPosition() {
    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      this.duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: this.duration,
          playbackRate: 1,
          position: Math.min(this.currentTime, this.duration),
        });
      } catch {
        // Ignore
      }
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * Resolve a playable audio source for a track.
   *
   * Imported audio is persisted as an `audioBlob` inside IndexedDB. The
   * `audioUrl` recorded at import time is a `blob:` object URL that dies as
   * soon as the page/app is closed, so after a reload we always mint a
   * fresh object URL from the stored Blob.
   */
  private resolveAudioSourceUrl(track: Track): string | null {
    if (!track) return null;
    if (track.audioUrl?.startsWith('http')) return track.audioUrl;
    if (track.audioUrl?.startsWith('data:')) return track.audioUrl;
    if (track.audioBlob) return URL.createObjectURL(track.audioBlob);
    // Blob URL created earlier in this same session — still alive.
    if (track.audioUrl?.startsWith('blob:')) return track.audioUrl;
    return null;
  }

  public setTrack(track: Track, autoPlay: boolean = true) {
    this.initAudioContext();
    this.currentTrack = track;
    this.duration = track.duration || 288;
    this.currentTime = 0;

    this.stopSynth();

    // Release the object URL we created for the previous track (if any).
    if (this.managedObjectUrl) {
      try {
        URL.revokeObjectURL(this.managedObjectUrl);
      } catch {
        // ignore
      }
      this.managedObjectUrl = null;
    }

    const sourceUrl = this.resolveAudioSourceUrl(track);
    if (sourceUrl?.startsWith('blob:')) {
      // Remember URLs we mint so they can be released when the track changes.
      this.managedObjectUrl = sourceUrl;
    }

    this.updateMediaSessionMetadata();

    if (sourceUrl) {
      // Real local audio file imported by user
      this.isSynthesizing = false;
      if (this.audioElement) {
        this.audioElement.src = sourceUrl;
        this.audioElement.currentTime = 0;
        if (autoPlay) {
          this.audioElement.play().catch(() => {});
          this.isPlaying = true;
          triggerHaptic('medium');
        }
      }
    } else {
      // Procedural hi-res generative ambient synth track
      this.isSynthesizing = true;
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
      }
      if (autoPlay) {
        this.startSynth();
        this.isPlaying = true;
        triggerHaptic('medium');
      }
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    }

    this.notify();
  }

  public updateTrackMetadata(track: Track) {
    if (this.currentTrack?.id === track.id) {
      this.currentTrack = track;
      this.updateMediaSessionMetadata();
      this.notify();
    }
  }

  public togglePlay() {
    this.initAudioContext();
    triggerHaptic('light');
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.initAudioContext();
    this.isPlaying = true;

    if (this.isSynthesizing) {
      this.startSynth();
    } else if (this.audioElement && this.audioElement.src) {
      this.audioElement.play().catch(() => {});
    } else {
      this.isSynthesizing = true;
      this.startSynth();
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.isSynthesizing) {
      this.stopSynth();
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }

    this.notify();
  }

  public seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, this.duration));
    this.currentTime = clamped;
    if (this.audioElement && !this.isSynthesizing) {
      this.audioElement.currentTime = clamped;
    }
    this.updateMediaSessionPosition();
    this.notify();
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    this.notify();
  }

  public setEQ(preset: EQPreset) {
    this.eqPreset = preset;
    this.applyEQ(preset);
    this.notify();
  }

  private applyEQ(preset: EQPreset) {
    if (!this.bassFilter || !this.midFilter || !this.trebleFilter || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    switch (preset) {
      case 'Studio Warmth':
        this.bassFilter.gain.setValueAtTime(2.5, now);
        this.midFilter.gain.setValueAtTime(0.5, now);
        this.trebleFilter.gain.setValueAtTime(-1.0, now);
        break;
      case 'Bass Boost':
        this.bassFilter.gain.setValueAtTime(5.0, now);
        this.midFilter.gain.setValueAtTime(-1.0, now);
        this.trebleFilter.gain.setValueAtTime(-0.5, now);
        break;
      case 'Hi-Res Clarity':
        this.bassFilter.gain.setValueAtTime(1.0, now);
        this.midFilter.gain.setValueAtTime(1.5, now);
        this.trebleFilter.gain.setValueAtTime(4.0, now);
        break;
      case 'Vocal Focus':
        this.bassFilter.gain.setValueAtTime(-2.0, now);
        this.midFilter.gain.setValueAtTime(4.5, now);
        this.trebleFilter.gain.setValueAtTime(1.0, now);
        break;
      case 'Direct Neutral':
      default:
        this.bassFilter.gain.setValueAtTime(0, now);
        this.midFilter.gain.setValueAtTime(0, now);
        this.trebleFilter.gain.setValueAtTime(0, now);
        break;
    }
  }

  // Generative fallback chords
  private startSynth() {
    this.stopSynth();
    if (!this.audioCtx || !this.synthGain) return;

    const chords = [
      [146.83, 220.0, 261.63, 329.63], // D minor 7
      [130.81, 196.0, 261.63, 329.63], // C major 9
      [116.54, 174.61, 220.0, 293.66], // Bb major 7
      [98.0, 146.83, 220.0, 293.66],  // G minor 7
    ];

    let chordIdx = 0;

    const playChord = () => {
      if (!this.isPlaying || !this.audioCtx || !this.synthGain) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, i) => {
        if (!this.audioCtx || !this.synthGain) return;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        const now = this.audioCtx.currentTime;
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.08 / (i + 1), now + 0.6);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain);

        osc.start(now);
        osc.stop(now + 4.0);
      });
    };

    playChord();
    this.synthInterval = window.setInterval(playChord, 3600);

    const startTime = Date.now() - this.currentTime * 1000;
    const tick = () => {
      if (this.isPlaying && this.isSynthesizing) {
        this.currentTime = (Date.now() - startTime) / 1000;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
          if (this.onNextCallback) {
            this.onNextCallback();
          }
        }
        this.notify();
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopSynth() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getAnalyserData(): Uint8Array {
    if (!this.analyserNode) {
      return new Uint8Array(32).fill(10);
    }
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getState() {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      eqPreset: this.eqPreset,
      isSynthesizing: this.isSynthesizing,
    };
  }
}

export const audioEngine = new SoundVaultAudioEngine();
