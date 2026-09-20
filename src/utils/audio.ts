/**
 * Utility for multimeter audio feedback (continuity buzzer)
 */
let audioCtx: AudioContext | null = null;
let buzzerOsc: OscillatorNode | null = null;
let buzzerGain: GainNode | null = null;

export function playMultimeterBuzzer(enabled: boolean = true) {
  if (!enabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (buzzerOsc) {
      return; // Already buzzing
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2800, audioCtx.currentTime); // Typical multimeter buzzer ~2.8kHz

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Soft volume

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    buzzerOsc = osc;
    buzzerGain = gain;
  } catch {
    // Audio might be blocked or unavailable in some environments
  }
}

export function stopMultimeterBuzzer() {
  try {
    if (buzzerOsc && audioCtx) {
      buzzerGain?.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
      setTimeout(() => {
        try {
          buzzerOsc?.stop();
          buzzerOsc?.disconnect();
          buzzerGain?.disconnect();
          buzzerOsc = null;
          buzzerGain = null;
        } catch {
          // cleanup safe
        }
      }, 30);
    }
  } catch {
    buzzerOsc = null;
    buzzerGain = null;
  }
}
