// Gentle Web Audio API synthesizer for study timer alerts
// Zero external assets required, works offline and in any browser

let sharedAudioCtx: AudioContext | null = null;

function getSafeAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playChimeSound() {
  try {
    const ctx = getSafeAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Beautiful harmonic triad (F5, A5, C6)
    playNote(698.46, now, 0.45, 0.2);
    playNote(880.00, now + 0.12, 0.55, 0.22);
    playNote(1046.50, now + 0.26, 0.85, 0.25);
  } catch {
    // Silently ignore audio playback issues if user gesture has not happened yet
  }
}

export function playTickSound() {
  try {
    const ctx = getSafeAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // silently ignore tick errors
  }
}

