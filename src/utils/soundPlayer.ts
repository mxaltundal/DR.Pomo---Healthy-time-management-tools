/** Singleton AudioContext – created on first use and kept alive */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Call this on the first user interaction so the AudioContext is
 * already in the "running" state when a block ends automatically.
 */
export function unlockAudio(): void {
  getAudioContext();
}

/**
 * Play a pleasant multi-note chime when a block finishes.
 *
 * Work block  → ascending C-E-G-C' (bright, celebratory)
 * Break block → descending G-E-C    (soft, calming)
 */
export function playBlockEndSound(blockType: string): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const isWork = blockType === 'work';
  // Frequencies (Hz): major chord arpeggio
  const notes: number[] = isWork
    ? [523.25, 659.25, 783.99, 1046.5]  // C5 E5 G5 C6
    : [783.99, 659.25, 523.25];          // G5 E5 C5

  const spacing = 0.18; // seconds between notes
  const noteDuration = 1.4; // how long each note rings (with decay)

  notes.forEach((freq, i) => {
    const t0 = ctx.currentTime + i * spacing;

    // Oscillator (sine for warmth)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);

    // Envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.32, t0 + 0.018);  // fast attack
    gain.gain.setValueAtTime(0.32, t0 + 0.06);            // brief sustain
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + noteDuration);

    // Slight "shimmer" overtone – an octave up at low volume
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t0);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, t0);
    gain2.gain.linearRampToValueAtTime(0.06, t0 + 0.018);
    gain2.gain.exponentialRampToValueAtTime(0.001, t0 + noteDuration * 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + noteDuration);
    osc2.start(t0);
    osc2.stop(t0 + noteDuration);
  });
}
