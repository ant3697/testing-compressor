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

/**
 * Realistic hermetic compressor motor running audio synthesis
 * Accurately models the acoustic signature of a hermetic refrigeration compressor during a compression test:
 * - Starter relay / contactor mechanical snap
 * - 49.2Hz reciprocating piston compression strokes (2950 RPM under load)
 * - Sharp metallic chatter of the discharge flapper reed valves (ch-ch-ch-ch valve plate impacts)
 * - Compressed gas expulsion jet through the discharge orifice
 * - Magnetic 50Hz/100Hz stator core hum and POE oil bath acoustic dampening
 * - Piston deceleration and valve seating on power cutoff
 */
let compressorBufferSource: AudioBufferSourceNode | null = null;
let compressorSubOsc: OscillatorNode | null = null;
let compressorGain: GainNode | null = null;
let compressorFilter: BiquadFilterNode | null = null;
let compressorLoopBuffer: AudioBuffer | null = null;

function getCompressorLoopBuffer(ctx: AudioContext): AudioBuffer {
  if (compressorLoopBuffer && compressorLoopBuffer.sampleRate === ctx.sampleRate) {
    return compressorLoopBuffer;
  }

  const sampleRate = ctx.sampleRate;
  const strokeFreq = 49.2; // 2950 RPM asynchronous speed under compression load
  const periodSamples = Math.round(sampleRate / strokeFreq);
  const numCycles = Math.round(strokeFreq * 2.0); // ~98 compression cycles (~2.0 seconds)
  const totalSamples = periodSamples * numCycles;

  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Synthesize realistic refrigeration compressor acoustic waveform
  let lowpassState = 0;
  for (let c = 0; c < numCycles; c++) {
    // Subtle cycle-to-cycle micro-jitter (valve impact and gas compression variations)
    const cycleJitter = 1.0 + Math.sin(c * 0.73) * 0.045 + (c % 2 === 0 ? 0.02 : -0.02);
    const cycleOffset = c * periodSamples;

    for (let s = 0; s < periodSamples; s++) {
      const idx = cycleOffset + s;
      const phase = s / periodSamples; // 0.0 to 1.0 within this reciprocating stroke

      // 1. Motor Magnetic Hum & Shaft Torque (50Hz + 100Hz + 150Hz)
      const motorHum =
        0.26 * Math.sin(2 * Math.PI * phase) +
        0.20 * Math.sin(4 * Math.PI * phase + 0.35) +
        0.09 * Math.sin(6 * Math.PI * phase + 0.85);

      // 2. Cylinder Gas Compression Work Hump (connecting rod & crankshaft load)
      // As piston moves toward TDC (phase 0.20 to 0.72)
      let compressionLoad = 0;
      if (phase >= 0.20 && phase <= 0.72) {
        const pNorm = (phase - 0.20) / 0.52;
        compressionLoad = 0.28 * Math.sin(Math.PI * pNorm) ** 2;
      }

      // 3. Discharge Flapper Reed Valve Strike (TDC discharge valve snap)
      // This is the sharp, rhythmic mechanical chatter prominent in real compressor recordings
      let valveStrike = 0;
      if (phase >= 0.62) {
        const dt = (phase - 0.62) * (periodSamples / sampleRate);
        const decay1 = Math.exp(-dt * 360);
        // Resonant metallic reed impact frequencies
        valveStrike =
          decay1 *
          (0.42 * Math.sin(2 * Math.PI * 480 * dt) +
            0.32 * Math.sin(2 * Math.PI * 1160 * dt) +
            0.18 * Math.sin(2 * Math.PI * 2350 * dt)) *
          cycleJitter;
      }

      // 4. Secondary Valve Flutter / Reed Bounce
      let valveBounce = 0;
      if (phase >= 0.71) {
        const dt2 = (phase - 0.71) * (periodSamples / sampleRate);
        const decay2 = Math.exp(-dt2 * 440);
        valveBounce =
          decay2 *
          (0.22 * Math.sin(2 * Math.PI * 560 * dt2) +
            0.15 * Math.sin(2 * Math.PI * 1420 * dt2)) *
          cycleJitter;
      }

      // 5. Pressurized Discharge Gas Puff (Compressed refrigerant/air jet)
      let gasJet = 0;
      if (phase >= 0.62 && phase <= 0.86) {
        const jetPhase = (phase - 0.62) / 0.24;
        const jetEnvelope = Math.sin(Math.PI * jetPhase);
        // High-frequency turbulent noise
        gasJet = (Math.random() * 2 - 1) * 0.16 * jetEnvelope * cycleJitter;
      }

      // 6. Internal Suspension Spring Mechanical Drone (~192Hz shell resonance)
      const shellResonance = 0.08 * Math.sin(2 * Math.PI * 192 * (idx / sampleRate));

      const rawSample = (motorHum + compressionLoad + valveStrike + valveBounce + gasJet + shellResonance) * 0.72;

      // Oil-bath damping (gentle single-pole IIR low-pass smoothing at ~3800Hz)
      lowpassState += (rawSample - lowpassState) * 0.48;
      data[idx] = lowpassState;
    }
  }

  compressorLoopBuffer = buffer;
  return buffer;
}

/**
 * Generates the authentic acoustic transient of a hermetic compressor startup:
 * 1. Relay / contactor mechanical snap (clack)
 * 2. Heavy locked-rotor magnetic surge (LRA inrush kick) & inertia breakaway
 * 3. Initial cylinder suction & discharge valve flutter
 */
export function playCompressorStartupSound(volume = 0.05) {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    // 1. Sharp mechanical relay/switch contact snap
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1450, now);
    clickOsc.frequency.exponentialRampToValueAtTime(160, now + 0.024);
    clickGain.gain.setValueAtTime(0.18, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.03);

    // 2. Initial mechanical piston thump / breakaway inertia kick
    const kickOsc = audioCtx.createOscillator();
    const kickGain = audioCtx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(95, now + 0.003);
    kickOsc.frequency.exponentialRampToValueAtTime(28, now + 0.14);
    kickGain.gain.setValueAtTime(0.16, now + 0.003);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    kickOsc.connect(kickGain);
    kickGain.connect(audioCtx.destination);
    kickOsc.start(now + 0.003);
    kickOsc.stop(now + 0.17);

    // 3. Suction valve initial intake puff (flapper valve pressure pulse)
    const puffOsc = audioCtx.createOscillator();
    const puffFilter = audioCtx.createBiquadFilter();
    const puffGain = audioCtx.createGain();
    puffOsc.type = 'sawtooth';
    puffOsc.frequency.setValueAtTime(70, now + 0.015);
    puffFilter.type = 'bandpass';
    puffFilter.frequency.setValueAtTime(190, now + 0.015);
    puffFilter.Q.setValueAtTime(1.6, now + 0.015);
    puffGain.gain.setValueAtTime(0.08, now + 0.015);
    puffGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    puffOsc.connect(puffFilter);
    puffFilter.connect(puffGain);
    puffGain.connect(audioCtx.destination);
    puffOsc.start(now + 0.015);
    puffOsc.stop(now + 0.18);
  } catch {
    // safe fallback
  }
}

export function startCompressorHum(volume = 0.055, playStartupTransient = true) {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (compressorBufferSource) {
      // Already running, adjust volume if needed
      compressorGain?.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.05);
      return;
    }

    const now = audioCtx.currentTime;

    if (playStartupTransient) {
      playCompressorStartupSound(volume);
    }

    // 1. High-fidelity looping refrigeration compressor buffer
    const loopBuffer = getCompressorLoopBuffer(audioCtx);
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = loopBuffer;
    bufferSource.loop = true;

    // 2. Dome acoustic filter: lowpass at 3400Hz with slight body warmth
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(1.1, now);

    // 3. Sub-bass motor body tone (49.2Hz fundamental)
    const subOsc = audioCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(49.2, now);
    const subGain = audioCtx.createGain();
    subGain.gain.setValueAtTime(volume * 0.45, now);

    // 4. Master compressor output gain
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    // Dynamic surge on startup, settling to steady state
    masterGain.gain.linearRampToValueAtTime(volume * 1.5, now + 0.06);
    masterGain.gain.exponentialRampToValueAtTime(volume, now + 0.28);

    bufferSource.connect(filter);
    filter.connect(masterGain);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    masterGain.connect(audioCtx.destination);

    bufferSource.start(now);
    subOsc.start(now);

    compressorBufferSource = bufferSource;
    compressorSubOsc = subOsc;
    compressorFilter = filter;
    compressorGain = masterGain;
  } catch {
    // safe fallback
  }
}

export function stopCompressorHum() {
  try {
    if (compressorGain && audioCtx) {
      const now = audioCtx.currentTime;
      // Realistic spin-down: rotor deceleration against cylinder backpressure
      if (compressorBufferSource) {
        compressorBufferSource.playbackRate.setTargetAtTime(0.35, now, 0.15);
      }
      if (compressorSubOsc) {
        compressorSubOsc.frequency.setTargetAtTime(24, now, 0.15);
      }
      compressorGain.gain.setTargetAtTime(0, now, 0.12);

      // Play subtle final valve seating click
      try {
        const stopClick = audioCtx.createOscillator();
        const stopGain = audioCtx.createGain();
        stopClick.type = 'triangle';
        stopClick.frequency.setValueAtTime(380, now + 0.08);
        stopClick.frequency.exponentialRampToValueAtTime(90, now + 0.14);
        stopGain.gain.setValueAtTime(0.06, now + 0.08);
        stopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        stopClick.connect(stopGain);
        stopGain.connect(audioCtx.destination);
        stopClick.start(now + 0.08);
        stopClick.stop(now + 0.16);
      } catch {
        // safe
      }

      const prevSource = compressorBufferSource;
      const prevSub = compressorSubOsc;
      const prevGain = compressorGain;
      const prevFilter = compressorFilter;

      compressorBufferSource = null;
      compressorSubOsc = null;
      compressorGain = null;
      compressorFilter = null;

      setTimeout(() => {
        try {
          prevSource?.stop();
          prevSub?.stop();
          prevSource?.disconnect();
          prevSub?.disconnect();
          prevFilter?.disconnect();
          prevGain?.disconnect();
        } catch {
          // safe cleanup
        }
      }, 300);
    }
  } catch {
    compressorBufferSource = null;
    compressorSubOsc = null;
    compressorFilter = null;
    compressorGain = null;
  }
}

let activeCase1Audio: {
  stop: () => void;
} | null = null;

export function stopCase1LockedRotorSound() {
  if (activeCase1Audio) {
    try {
      activeCase1Audio.stop();
    } catch {
      // safe
    }
    activeCase1Audio = null;
  }
}

/**
 * Synthesizes the authentic acoustic signature of Case 1:
 * - Rotor mechanically blocked / starting system failure.
 * - Compressor energizes drawing high LRA (Locked Rotor Amps ~28.5A).
 * - Deep, straining 50Hz/100Hz electromagnetic growl and shell vibration for exactly 3.0 seconds.
 * - At 3.0 seconds: Sharp bimetallic snap ("CLIC") as the Klixon reaches trip temperature (>105°C).
 * - Instant electrical cutoff (sound drops immediately to zero, followed by faint mechanical spring recoil).
 */
export function playCase1LockedRotorSound(
  onStateChange?: (phase: 'idle' | 'buzzing' | 'clicked') => void
): () => void {
  stopCase1LockedRotorSound();

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const ctx = audioCtx;
    const now = ctx.currentTime;
    const buzzDuration = 3.0; // Exactly 3 seconds of locked rotor hum

    onStateChange?.('buzzing');

    // Master gain for the 3-second hum
    const humMasterGain = ctx.createGain();
    humMasterGain.gain.setValueAtTime(0.001, now);
    // Fast attack inrush kick
    humMasterGain.gain.linearRampToValueAtTime(0.19, now + 0.04);
    // Gradual strain as winding temp rises under 28.5A
    humMasterGain.gain.linearRampToValueAtTime(0.22, now + 2.9);
    // Instant shutoff at 3.0s when bimetal contacts snap open
    humMasterGain.gain.setValueAtTime(0.22, now + buzzDuration - 0.003);
    humMasterGain.gain.linearRampToValueAtTime(0.0001, now + buzzDuration);

    // 1. 50Hz fundamental (European mains frequency)
    const osc50 = ctx.createOscillator();
    osc50.type = 'sawtooth';
    osc50.frequency.setValueAtTime(50.0, now);

    // Filter to simulate steel compressor shell acoustic lowpass resonance
    const filter50 = ctx.createBiquadFilter();
    filter50.type = 'lowpass';
    filter50.frequency.setValueAtTime(280, now);
    filter50.Q.setValueAtTime(2.2, now);

    // 2. 100Hz electromagnetic double-frequency magnetic pull
    const osc100 = ctx.createOscillator();
    osc100.type = 'triangle';
    osc100.frequency.setValueAtTime(100.0, now);

    const gain100 = ctx.createGain();
    gain100.gain.setValueAtTime(0.48, now);

    // 3. Stator lamination buzz (150Hz odd harmonics under magnetic saturation)
    const osc150 = ctx.createOscillator();
    osc150.type = 'sawtooth';
    osc150.frequency.setValueAtTime(150.0, now);

    const gain150 = ctx.createGain();
    gain150.gain.setValueAtTime(0.2, now);

    // 4. Subtle 50Hz mechanical vibration tremolo
    const tremoloLfo = ctx.createOscillator();
    tremoloLfo.type = 'sine';
    tremoloLfo.frequency.setValueAtTime(25.0, now);
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.setValueAtTime(0.035, now);

    // Connect buzzing nodes
    osc50.connect(filter50);
    filter50.connect(humMasterGain);

    osc100.connect(gain100);
    gain100.connect(humMasterGain);

    osc150.connect(gain150);
    gain150.connect(humMasterGain);

    tremoloLfo.connect(tremoloGain);
    tremoloGain.connect(humMasterGain.gain);

    humMasterGain.connect(ctx.destination);

    // Start buzzing oscillators
    osc50.start(now);
    osc100.start(now);
    osc150.start(now);
    tremoloLfo.start(now);

    osc50.stop(now + buzzDuration + 0.05);
    osc100.stop(now + buzzDuration + 0.05);
    osc150.stop(now + buzzDuration + 0.05);
    tremoloLfo.stop(now + buzzDuration + 0.05);

    // 5. At t = 3.0s: The Klixon bimetallic snap "CLIC"
    const clickTime = now + buzzDuration;

    // A) High crisp bimetal disc ping (2100Hz down to 340Hz in 28ms)
    const clickPing = ctx.createOscillator();
    const pingGain = ctx.createGain();
    clickPing.type = 'triangle';
    clickPing.frequency.setValueAtTime(2100, clickTime);
    clickPing.frequency.exponentialRampToValueAtTime(340, clickTime + 0.028);
    pingGain.gain.setValueAtTime(0.0001, clickTime);
    pingGain.gain.setValueAtTime(0.35, clickTime + 0.001);
    pingGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.045);
    clickPing.connect(pingGain);
    pingGain.connect(ctx.destination);
    clickPing.start(clickTime);
    clickPing.stop(clickTime + 0.06);

    // B) Sharp contact arc break pop
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'square';
    popOsc.frequency.setValueAtTime(3400, clickTime);
    popOsc.frequency.exponentialRampToValueAtTime(110, clickTime + 0.016);
    popGain.gain.setValueAtTime(0.0001, clickTime);
    popGain.gain.setValueAtTime(0.26, clickTime + 0.001);
    popGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.022);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(clickTime);
    popOsc.stop(clickTime + 0.03);

    // C) Compressor shell / internal spring release shudder
    const shudderOsc = ctx.createOscillator();
    const shudderGain = ctx.createGain();
    shudderOsc.type = 'sine';
    shudderOsc.frequency.setValueAtTime(74, clickTime + 0.004);
    shudderOsc.frequency.exponentialRampToValueAtTime(24, clickTime + 0.16);
    shudderGain.gain.setValueAtTime(0.0001, clickTime + 0.004);
    shudderGain.gain.setValueAtTime(0.14, clickTime + 0.006);
    shudderGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.18);
    shudderOsc.connect(shudderGain);
    shudderGain.connect(ctx.destination);
    shudderOsc.start(clickTime + 0.004);
    shudderOsc.stop(clickTime + 0.2);

    // Scheduled UI state changes
    const timeoutClick = window.setTimeout(() => {
      onStateChange?.('clicked');
    }, 3000);

    const timeoutIdle = window.setTimeout(() => {
      onStateChange?.('idle');
      activeCase1Audio = null;
    }, 4200);

    const stopFn = () => {
      clearTimeout(timeoutClick);
      clearTimeout(timeoutIdle);
      try {
        humMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        osc50.stop();
        osc100.stop();
        osc150.stop();
        tremoloLfo.stop();
        clickPing.stop();
        popOsc.stop();
        shudderOsc.stop();
      } catch {
        // safe
      }
      onStateChange?.('idle');
    };

    activeCase1Audio = { stop: stopFn };
    return stopFn;
  } catch {
    onStateChange?.('idle');
    return () => {};
  }
}

/**
 * Play acoustic electrical fault / mechanical simulation sounds for diagnostic training
 */
export function playFaultAcousticSound(
  rawType:
    | 'healthy'
    | 'ground_fault'
    | 'open_winding'
    | 'shorted_turns'
    | 'open_klixon'
    | 'bad_relay'
    | 'case1'
    | 'case2'
    | 'case3'
    | 'case4'
    | 'case5'
    | 'case6'
    | string
) {
  if (rawType === 'case1') {
    playCase1LockedRotorSound();
    return;
  }
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const type =
      rawType === 'case1'
        ? 'open_klixon'
        : rawType === 'case2'
        ? 'ground_fault'
        : rawType === 'case3'
        ? 'open_winding'
        : rawType === 'case4'
        ? 'shorted_turns'
        : rawType === 'case5'
        ? 'open_klixon'
        : rawType === 'case6'
        ? 'bad_relay'
        : rawType;

    const now = audioCtx.currentTime;

    if (type === 'healthy') {
      // Smooth 50Hz nominal running hum for 1.2 seconds
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(49.0, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(130, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      gain.gain.linearRampToValueAtTime(0.035, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.26);
    } else if (type === 'ground_fault') {
      // Electrical arc discharge crackle + circuit breaker trip click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.22);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.26);

      // Add a quick high-frequency pop (spark)
      const popOsc = audioCtx.createOscillator();
      const popGain = audioCtx.createGain();
      popOsc.type = 'square';
      popOsc.frequency.setValueAtTime(950, now);
      popOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      popGain.gain.setValueAtTime(0.09, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      popOsc.connect(popGain);
      popGain.connect(audioCtx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.1);
    } else if (type === 'open_winding') {
      // Dull magnetic hum that fails to build torque (stalled)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(50.0, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } else if (type === 'shorted_turns') {
      // Intense buzzing LRA growl (heavy overcurrent)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100.0, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.66);
    } else if (type === 'open_klixon') {
      // Sharp metallic bimetal snap click (Klixon trip)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'bad_relay') {
      // Rapid dry relay contact chattering / clicking
      [0, 0.07, 0.14].forEach((delay) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, now + delay);
        gain.gain.setValueAtTime(0.05, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx!.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.04);
      });
    }
  } catch {
    // safe fallback
  }
}
