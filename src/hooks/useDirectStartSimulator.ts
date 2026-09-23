import { useState, useEffect, useRef, useCallback } from 'react';
import { startCompressorHum, stopCompressorHum } from '../utils/audio';

export interface UseDirectStartSimulatorReturn {
  benchMode: 'photo' | 'schematic';
  setBenchMode: (mode: 'photo' | 'schematic') => void;
  powerOn: boolean;
  isBridging: boolean;
  isMotorRunning: boolean;
  isSeizedMotor: boolean;
  setIsSeizedMotor: (seized: boolean) => void;
  klixonTripped: boolean;
  bridgeDurationMs: number;
  isAlarmActive: boolean;
  alarmMessage: string;
  feedbackMessage: string;
  setFeedbackMessage: (msg: string) => void;
  motorRpm: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  currentAmps: number;
  handleTogglePower: () => void;
  handleStartBridge: () => void;
  handleEndBridge: () => void;
  handleClickBridge: () => void;
  handleReset: () => void;
  handleResetKlixon: () => void;
}

export function useDirectStartSimulator(
  rMarcha: string = '9.7',
  rArranque: string = '13.1'
): UseDirectStartSimulatorReturn {
  const [benchMode, setBenchMode] = useState<'photo' | 'schematic'>('photo');
  const [powerOn, setPowerOn] = useState<boolean>(false);
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [isMotorRunning, setIsMotorRunning] = useState<boolean>(false);
  const [isSeizedMotor, setIsSeizedMotor] = useState<boolean>(false);
  const [klixonTripped, setKlixonTripped] = useState<boolean>(false);
  const [bridgeDurationMs, setBridgeDurationMs] = useState<number>(0);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [alarmMessage, setAlarmMessage] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [motorRpm, setMotorRpm] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [currentAmps, setCurrentAmps] = useState<number>(0.0);

  const bridgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bridgeHoldStartTsRef = useRef<number>(0);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const subOscillatorRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const filterNode2Ref = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const playSound = useCallback((type: 'lra' | 'running' | 'click' | 'stop' | 'alarm') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'stop') {
        if (gainNodeRef.current && ctx) {
          gainNodeRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        }
        stopCompressorHum();
        return;
      }

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.20, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
        return;
      }

      if (type === 'alarm') {
        // High-pitched warning buzzer burst for switch overheld alarm
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(950, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        return;
      }

      // Initialize authentic, acoustically-attenuated hermetic compressor sound generator
      if (!oscillatorRef.current) {
        // 1. Primary fundamental motor rotation oscillator (pure sinusoidal: velvety deep ~47.5 Hz representing 2.850 RPM)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(47.5, ctx.currentTime);

        // 2. Secondary gentle piston compression stroke harmonic (sinusoidal: 95.0 Hz)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(95.0, ctx.currentTime);

        // Sub-gain to blend the piston stroke harmonic with extreme subtlety
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.09, ctx.currentTime);
        osc2.connect(subGain);

        // 3. Dual-stage acoustic low-pass dampening filter (models the drawn-steel hermetic dome and oil bath isolation)
        // Stage 1: Steep cutoff absorbing electrical high-frequency buzzing
        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(118, ctx.currentTime);
        filter1.Q.setValueAtTime(0.707, ctx.currentTime);

        // Stage 2: Second pole completely rolling off any synthetic edge
        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(138, ctx.currentTime);
        filter2.Q.setValueAtTime(0.707, ctx.currentTime);

        osc1.connect(filter1);
        subGain.connect(filter1);
        filter1.connect(filter2);

        // 4. Subtle sub-mechanical compression pulse (LFO tremolo at 23.75 Hz for organic breathing)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(23.75, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.0035, ctx.currentTime);
        lfo.connect(lfoGain);

        // 5. Master compressor gain node
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        lfoGain.connect(masterGain.gain);

        filter2.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        lfo.start();

        oscillatorRef.current = osc1;
        subOscillatorRef.current = osc2;
        lfoRef.current = lfo;
        lfoGainRef.current = lfoGain;
        filterNodeRef.current = filter1;
        filterNode2Ref.current = filter2;
        gainNodeRef.current = masterGain;
      }

      const osc1 = oscillatorRef.current;
      const osc2 = subOscillatorRef.current;
      const filter1 = filterNodeRef.current;
      const filter2 = filterNode2Ref.current;
      const gain = gainNodeRef.current;
      if (!osc1 || !gain) return;

      if (type === 'lra') {
        stopCompressorHum();
        // Deeper loaded magnetizing hum during rotor standstill or initial boost
        osc1.frequency.setTargetAtTime(49.0, ctx.currentTime, 0.06);
        if (osc2) osc2.frequency.setTargetAtTime(98.0, ctx.currentTime, 0.06);
        if (filter1) filter1.frequency.setTargetAtTime(108, ctx.currentTime, 0.06);
        if (filter2) filter2.frequency.setTargetAtTime(128, ctx.currentTime, 0.06);
        gain.gain.setTargetAtTime(0.075, ctx.currentTime, 0.06);
      } else if (type === 'running') {
        // Stop any residual basic synth audio and play realistic refrigeration compressor audio
        if (gainNodeRef.current && ctx) {
          gainNodeRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        }
        startCompressorHum(0.055, true);
        return;
      }
    } catch {
      // Audio context may fail if user hasn't interacted yet
    }
  }, [soundEnabled]);

  // Stop sounds immediately if user disables sound, or resume if running
  useEffect(() => {
    if (!soundEnabled) {
      stopCompressorHum();
      if (gainNodeRef.current && audioCtxRef.current) {
        try {
          gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.02);
        } catch {
          // ignore
        }
      }
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    } else {
      if (isMotorRunning && powerOn && !klixonTripped && !isSeizedMotor) {
        startCompressorHum(0.055, false);
      }
    }
  }, [soundEnabled, isMotorRunning, powerOn, klixonTripped, isSeizedMotor]);

  // Handle Alarm Audio Interval
  useEffect(() => {
    if (isAlarmActive && soundEnabled) {
      playSound('alarm');
      alarmIntervalRef.current = setInterval(() => {
        playSound('alarm');
      }, 350);
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [isAlarmActive, soundEnabled, playSound]);

  // Clean up Web Audio Context when unmounting
  useEffect(() => {
    return () => {
      stopCompressorHum();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close().catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Handle Motor RPM Smooth Transition
  useEffect(() => {
    if (rpmIntervalRef.current) clearInterval(rpmIntervalRef.current);

    if (isMotorRunning && powerOn && !klixonTripped && !isSeizedMotor) {
      // Accelerate to ~2850 RPM
      rpmIntervalRef.current = setInterval(() => {
        setMotorRpm((prev) => {
          if (prev >= 2850) {
            return 2850 + Math.floor((Math.random() - 0.5) * 15);
          }
          return Math.min(2850, prev + 180);
        });
      }, 50);
    } else if (isBridging && powerOn && !klixonTripped && !isSeizedMotor) {
      // Starting rotation during the 2-3s impulse
      rpmIntervalRef.current = setInterval(() => {
        setMotorRpm((prev) => Math.min(2400, prev + 120));
      }, 50);
    } else {
      // Decelerate / stop
      rpmIntervalRef.current = setInterval(() => {
        setMotorRpm((prev) => {
          if (prev <= 0) return 0;
          return Math.max(0, prev - 250);
        });
      }, 50);
    }

    return () => {
      if (rpmIntervalRef.current) clearInterval(rpmIntervalRef.current);
    };
  }, [isMotorRunning, isBridging, powerOn, klixonTripped, isSeizedMotor]);

  // Current Calculation
  useEffect(() => {
    if (!powerOn || klixonTripped) {
      setCurrentAmps(0.0);
      playSound('stop');
      return;
    }

    if (isSeizedMotor) {
      setCurrentAmps(isBridging ? 18.4 : 14.2);
      playSound('lra');
      return;
    }

    if (isBridging) {
      // Inrush current during start pulse
      setCurrentAmps(5.2);
      playSound('lra');
    } else if (isMotorRunning) {
      const rm = parseFloat(rMarcha) || 9.7;
      const baseFla = Math.max(0.65, Math.min(1.4, 7.5 / Math.max(rm, 4)));
      const jitter = (Math.random() - 0.5) * 0.04;
      setCurrentAmps(parseFloat((baseFla + jitter).toFixed(2)));
      playSound('running');
    } else {
      // Motor stalled without start winding assist
      setCurrentAmps(3.8);
      playSound('lra');
    }
  }, [powerOn, isBridging, isMotorRunning, isSeizedMotor, klixonTripped, rMarcha, playSound]);

  // Klixon thermal protection when overloaded (e.g. stalled, seized, or pushbutton held > 3.5s)
  useEffect(() => {
    let klixonTimer: NodeJS.Timeout | null = null;
    const isOverloading = powerOn && !klixonTripped && (!isMotorRunning || isSeizedMotor || isBridging);

    if (isOverloading) {
      // If bridging is held too long (> 3.5s) or seized motor (> 3.5s) or locked rotor without starting (> 5.5s), trip Klixon
      const tripDelay = isSeizedMotor ? 3500 : (isBridging ? 3600 : 5500);
      klixonTimer = setTimeout(() => {
        setKlixonTripped(true);
        setIsMotorRunning(false);
        setIsBridging(false);
        setIsAlarmActive(false);
        setAlarmMessage('🔥 ¡DISPARO TÉRMICO KLIXON! Bobina auxiliar (S) sobrecalentada por sobreintensidad prolongada (> 3s).');
        setFeedbackMessage('🔥 ¡PELIGRO DE DAÑO EN EL MOTOR! El pulsador de arranque se mantuvo más de 3 segundos. La bobina auxiliar (S) no soporta servicio continuo y ha alcanzado temperatura crítica; el protector Klixon ha saltado para evitar quemar el devanado.');
        playSound('click');
        playSound('stop');
      }, tripDelay);
    }

    return () => {
      if (klixonTimer) clearTimeout(klixonTimer);
    };
  }, [powerOn, klixonTripped, isMotorRunning, isSeizedMotor, isBridging, playSound]);

  const handleTogglePower = () => {
    if (!powerOn) {
      playSound('click');
      setPowerOn(true);
      setKlixonTripped(false);
      setIsMotorRunning(false);
      setIsBridging(false);
      setIsAlarmActive(false);
      setAlarmMessage('');
      setFeedbackMessage('');
    } else {
      playSound('click');
      playSound('stop');
      setPowerOn(false);
      setIsMotorRunning(false);
      setIsBridging(false);
      setIsAlarmActive(false);
      setAlarmMessage('');
      setFeedbackMessage('');
      setKlixonTripped(false);
      setBridgeDurationMs(0);
      setMotorRpm(0);
      bridgeHoldStartTsRef.current = 0;
      if (bridgeTimerRef.current) clearInterval(bridgeTimerRef.current);
    }
  };

  const handleStartBridge = () => {
    if (!powerOn || klixonTripped || isBridging || isMotorRunning) return;
    playSound('click');
    setIsBridging(true);
    setIsAlarmActive(false);
    setAlarmMessage('');
    setFeedbackMessage('⚡ Suministrando impulso de arranque puenteando Marcha (R) y Arranque (S)...');
    const startTs = Date.now();
    bridgeHoldStartTsRef.current = startTs;

    let autoStarted = false;

    if (bridgeTimerRef.current) clearInterval(bridgeTimerRef.current);
    bridgeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs;
      setBridgeDurationMs(elapsed);

      // 1. ARRANQUE AUTOMÁTICO TRAS 0.3 SEGUNDOS DE IMPULSO
      if (elapsed >= 300 && !autoStarted) {
        if (isSeizedMotor) {
          setFeedbackMessage('⚠️ Mecánica clavada: El rotor no puede girar debido a bloqueo mecánico. Consumo en LRA (~18.4 A).');
        } else {
          autoStarted = true;
          setIsMotorRunning(true);
          setMotorRpm(2850);
          setFeedbackMessage('⚡ ¡Compresor arrancado automáticamente tras 0.3s! Suelta el pulsador para desconectar el devanado auxiliar (S).');
        }
      }

      // 2. ADVERTENCIA PREVENTIVA (si sigue pulsado a partir de 2.2s con el motor ya en marcha)
      if (elapsed >= 2200 && elapsed < 3000) {
        setIsAlarmActive(true);
        setAlarmMessage('⚠️ ¡ATENCIÓN! El compresor ya arrancó. ¡Suelta el pulsador para no sobrecalentar el devanado auxiliar (S)!');
      }

      // 3. ERROR TRAS MÁS DE 3 SEGUNDOS (> 3.000 ms) CON EL MOTOR FUNCIONANDO A LA VEZ
      if (elapsed >= 3000 && elapsed < 3600) {
        setIsAlarmActive(true);
        setAlarmMessage('🚨 ¡ERROR CRÍTICO! Pulsador retenido > 3s con motor en marcha. Devanado auxiliar (S) sometido a sobrecalentamiento destructivo.');
        setFeedbackMessage('❌ ¡ERROR POR EXCESO DE TIEMPO (> 3s)! El devanado de arranque (S) está funcionando a la vez que el compresor ya ha arrancado. El hilo fino de arranque se carbonizará si no se desconecta.');
      } else if (elapsed >= 3600) {
        // Al superar 3.6 segundos con el pulsador retenido: Disparo del protector térmico Klixon
        if (bridgeTimerRef.current) {
          clearInterval(bridgeTimerRef.current);
          bridgeTimerRef.current = null;
        }
        setIsBridging(false);
        setIsMotorRunning(false);
        setIsAlarmActive(false);
        setKlixonTripped(true);
        setMotorRpm(0);
        setAlarmMessage('🔥 ¡DISPARO TÉRMICO KLIXON! Bobina auxiliar (S) sobrecalentada por pulsador retenido > 3s con motor en marcha.');
        setFeedbackMessage(`🔥 ¡ERROR CRÍTICO: DISPARO DEL KLIXON! Mantuviste pulsado ${(elapsed / 1000).toFixed(1)}s (> 3 s) con el motor arrancado. La bobina auxiliar de arranque (S) no tolera servicio continuo; el protector Klixon ha saltado para evitar quemar el motor. Pulsa "REARMAR KLIXON" para volver a intentar.`);
        playSound('click');
        playSound('stop');
      }
    }, 50);
  };

  const handleEndBridge = () => {
    if (!isBridging) return;
    setIsBridging(false);
    setIsAlarmActive(false);
    playSound('click');

    const elapsed = bridgeHoldStartTsRef.current > 0
      ? Date.now() - bridgeHoldStartTsRef.current
      : bridgeDurationMs;

    if (bridgeTimerRef.current) {
      clearInterval(bridgeTimerRef.current);
      bridgeTimerRef.current = null;
    }

    bridgeHoldStartTsRef.current = 0;

    if (powerOn && !klixonTripped) {
      if (isSeizedMotor) {
        setIsMotorRunning(false);
        setFeedbackMessage('⚠️ Mecánica clavada: El rotor no puede girar debido a bloqueo mecánico.');
      } else if (elapsed < 300) {
        setIsMotorRunning(false);
        setMotorRpm(0);
        setFeedbackMessage(`⚠️ Impulso muy breve (${(elapsed / 1000).toFixed(2)}s): El compresor no arrancó. Mantén presionado al menos 0.3 segundos para que arranque automáticamente.`);
      } else if (elapsed <= 3000) {
        setIsMotorRunning(true);
        setFeedbackMessage(`✅ ¡Arranque exitoso! Impulso de ${(elapsed / 1000).toFixed(1)}s. El compresor ha arrancado y continúa en marcha normal permanente (~2.850 RPM). El pulsador queda inactivo.`);
      } else {
        setIsMotorRunning(true);
        setFeedbackMessage(`⚠️ ¡ALERTA DE DAÑO EN EL MOTOR! Mantuviste pulsado ${(elapsed / 1000).toFixed(1)}s (> 3 s) funcionando a la vez con el compresor ya en marcha. La bobina auxiliar sufrió un sobrecalentamiento severo.`);
      }
    }
    setBridgeDurationMs(0);
  };

  // Clic directo en el pulsador
  const handleClickBridge = () => {
    if (!powerOn || klixonTripped) return;
    if (isMotorRunning) {
      setFeedbackMessage('ℹ️ El compresor ya está en marcha. El pulsador de arranque ha quedado inactivo (no detiene el motor). Para apagarlo, pulsa «230V OFF / DESCONECTAR».');
      return;
    }
    if (!isBridging) {
      setFeedbackMessage('👇 Mantén pulsado el botón al menos 0.3 segundos para que el motor arranque de forma automática.');
    }
  };

  const handleResetKlixon = () => {
    playSound('click');
    setKlixonTripped(false);
    setIsMotorRunning(false);
    setIsBridging(false);
    setIsAlarmActive(false);
    setAlarmMessage('');
    setFeedbackMessage('');
    setBridgeDurationMs(0);
    bridgeHoldStartTsRef.current = 0;
  };

  const handleReset = () => {
    playSound('stop');
    setPowerOn(false);
    setIsMotorRunning(false);
    setIsBridging(false);
    setIsAlarmActive(false);
    setAlarmMessage('');
    setFeedbackMessage('');
    setKlixonTripped(false);
    setIsSeizedMotor(false);
    setBridgeDurationMs(0);
    setMotorRpm(0);
    bridgeHoldStartTsRef.current = 0;
    if (bridgeTimerRef.current) clearInterval(bridgeTimerRef.current);
  };

  return {
    benchMode,
    setBenchMode,
    powerOn,
    isBridging,
    isMotorRunning,
    isSeizedMotor,
    setIsSeizedMotor,
    klixonTripped,
    bridgeDurationMs,
    isAlarmActive,
    alarmMessage,
    feedbackMessage,
    setFeedbackMessage,
    motorRpm,
    soundEnabled,
    setSoundEnabled,
    showGuide,
    setShowGuide,
    currentAmps,
    handleTogglePower,
    handleStartBridge,
    handleEndBridge,
    handleClickBridge,
    handleReset,
    handleResetKlixon,
  };
}
