// Web Audio API based notification sound synthesizer + Device Vibration (2x)
// Works 100% offline with zero external audio assets or network latency

let audioCtx: AudioContext | null = null;
let unlockListenerBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Auto-unlock AudioContext & Vibration user-activation on first touch/click anywhere
if (typeof window !== 'undefined' && !unlockListenerBound) {
  unlockListenerBound = true;
  const unlock = () => {
    getAudioContext();
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

/**
 * Menggetarkan perangkat 2x (pola: getar 220ms - jeda 120ms - getar 220ms)
 * Bekerja pada browser mobile/tablet yang mendukung Web Vibration API (navigator.vibrate)
 */
export function triggerDeviceVibration(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate([220, 120, 220]);
  } catch {
    // Ignore if blocked by OS/browser
  }
}

/**
 * Memutar nada notifikasi "Ting-Tong" elegan (harmoni 3-tone chime) + Getaran 2x di perangkat
 * Ideal untuk lonceng kasir dan notifikasi pesanan masuk
 */
export function playNotificationSound(withVibration: boolean = true): void {
  if (withVibration) {
    triggerDeviceVibration();
  }
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nada 1: C6 (1046.5 Hz) - Ting pertama
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nada 2: E6 (1318.5 Hz) - Nada tengah yang renyah
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Nada 3: G6 (1567.98 Hz) - Harmoni nada penutup cerah
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1567.98, now + 0.24);
    gain3.gain.setValueAtTime(0.28, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.85);
  } catch (err) {
    console.warn('Audio playback not permitted yet by browser:', err);
  }
}
