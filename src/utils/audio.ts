/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Synthesizes organic sound effects using the Web Audio API */
export function playWaterSound(type: 'droplet' | 'bubbles' | 'sparkle'): void {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'droplet') {
      // Direct physical modeling of a water droplet sound
      // Sine wave sweeping up quickly accompanied by an exponential decay envelope
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Low to high sweep makes it sound like a droplet "plip"
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.16);

    } else if (type === 'bubbles') {
      // Simulate multiple fast water bubble pops
      for (let i = 0; i < 5; i++) {
        const popTime = now + (i * 0.06);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        const baseFreq = 500 + Math.random() * 300;
        osc.frequency.setValueAtTime(baseFreq, popTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, popTime + 0.03);
        
        gain.gain.setValueAtTime(0.15, popTime);
        gain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(popTime);
        osc.stop(popTime + 0.05);
      }

    } else if (type === 'sparkle') {
      // Beautiful chime harmony for achievements and goal completions
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const noteTime = now + (idx * 0.08);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Subtly sweep frequency down slightly for bell-like tone
        osc.frequency.exponentialRampToValueAtTime(freq * 0.99, noteTime + 0.4);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, noteTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.55);
      });
    }
  } catch (error) {
    console.warn('Web Audio API not supported or dynamic interaction blocked', error);
  }
}

/** Triggers short haptic vibration if supported by device */
export function triggerVibration(): void {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  } catch (e) {
    // no-op if blocked/unsupported
  }
}
