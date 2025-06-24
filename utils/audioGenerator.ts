// Audio generation utilities for the Sound Discrimination Test
// Since we can't use external audio files, we'll generate tones using Web Audio API

export class AudioGenerator {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.isInitialized = true;
    }
  }

  async initializeAudio(): Promise<void> {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  generateTone(frequency: number, duration: number, volume: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.isInitialized) {
        // Fallback for environments without Web Audio API
        setTimeout(resolve, duration);
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Create envelope for smoother sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration - 0.01);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      oscillator.onended = () => resolve();
    });
  }

  async playSequence(frequencies: number[], toneDuration: number = 0.5, gap: number = 0.1): Promise<void> {
    await this.initializeAudio();
    
    for (let i = 0; i < frequencies.length; i++) {
      await this.generateTone(frequencies[i], toneDuration);
      if (i < frequencies.length - 1) {
        await this.delay(gap);
      }
    }
  }

  private delay(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  // Predefined frequencies for the test (in Hz)
  static readonly FREQUENCIES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
  };

  static getFrequencyName(frequency: number): string {
    const frequencies = AudioGenerator.FREQUENCIES;
    const entry = Object.entries(frequencies).find(([_, freq]) => Math.abs(freq - frequency) < 1);
    return entry ? entry[0] : `${frequency.toFixed(1)}Hz`;
  }
}