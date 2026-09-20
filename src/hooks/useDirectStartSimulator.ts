import { useState, useEffect, useRef, useCallback } from 'react';

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
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
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
        return;
      }

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
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

      // Initialize pleasant, acoustically-damped compressor engine sound chain
      if (!oscillatorRef.current) {
        // 1. Primary fundamental motor rotation oscillator (sine wave: velvety deep 48 Hz)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(48, ctx.currentTime);

        // 2. Secondary gentle mechanical pumping harmonic (triangle wave: 96 Hz)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(96, ctx.currentTime);

        // Sub-gain to blend mechanical harmonic subtly
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.18, ctx.currentTime);
        osc2.connect(subGain);

        // 3. Low-pass acoustic dampening filter (models the hermetic steel dome and oil bath)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        osc1.connect(filter);
        subGain.connect(filter);

        // 4. Master compressor gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);

        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        oscillatorRef.current = osc1;
        subOscillatorRef.current = osc2;
        filterNodeRef.current = filter;
        gainNodeRef.current = masterGain;
      }

      const osc1 = oscillatorRef.current;
      const osc2 = subOscillatorRef.current;
      const filter = filterNodeRef.current;
      const gain = gainNodeRef.current;
      if (!osc1 || !gain) return;

      if (type === 'lra') {
        // Deeper loaded humming during rotor standstill or initial boost
        osc1.frequency.setTargetAtTime(48, ctx.currentTime, 0.05);
        if (osc2) osc2.frequency.setTargetAtTime(96, ctx.currentTime, 0.05);
        if (filter) filter.frequency.setTargetAtTime(130, ctx.currentTime, 0.05);
        gain.gain.setTargetAtTime(0.10, ctx.currentTime, 0.05);
      } else if (type === 'running') {
        // Smooth, soothing, pleasant purr of a well-lubricated hermetic compressor in nominal regime
        osc1.frequency.setTargetAtTime(50, ctx.currentTime, 0.12);
        if (osc2) osc2.frequency.setTargetAtTime(100, ctx.currentTime, 0.12);
        if (filter) filter.frequency.setTargetAtTime(155, ctx.currentTime, 0.12);
        gain.gain.setTargetAtTime(0.055, ctx.currentTime, 0.12);
      }
    } catch {
      // Audio context may fail if user hasn't interacted yet
    }
  }, [soundEnabled]);

  // Stop sounds immediately if user disables sound
  useEffect(() => {
    if (!soundEnabled) {
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
    }
  }, [soundEnabled]);

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
    if (!powerOn || klixonTripped || isBridging) return;
    playSound('click');
    setIsBridging(true);
    setIsAlarmActive(false);
    setAlarmMessage('');
    setFeedbackMessage('');
    const startTs = Date.now();
    bridgeHoldStartTsRef.current = startTs;

    if (bridgeTimerRef.current) clearInterval(bridgeTimerRef.current);
    bridgeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTs;
      setBridgeDurationMs(elapsed);

      // A partir de 2.8 segundos: Alarma sonora y visual advirtiendo peligro de daño en el motor
      if (elapsed >= 2800 && elapsed < 3500) {
        setIsAlarmActive(true);
        setAlarmMessage('🚨 ¡PELIGRO! Pulsador retenido > 3s. Sobrecalentamiento crítico de la bobina auxiliar (S). ¡Suelta inmediatamente o se quemará!');
      } else if (elapsed >= 3500) {
        // Al superar los 3.5 segundos con el pulsador retenido: Disparo del protector térmico Klixon para evitar que el motor se queme
        if (bridgeTimerRef.current) {
          clearInterval(bridgeTimerRef.current);
          bridgeTimerRef.current = null;
        }
        setIsBridging(false);
        setIsMotorRunning(false);
        setIsAlarmActive(false);
        setKlixonTripped(true);
        setAlarmMessage('🔥 ¡DISPARO TÉRMICO KLIXON! Bobina auxiliar (S) sobrecalentada por pulsador retenido > 3s.');
        setFeedbackMessage(`🔥 ¡PELIGRO DE DAÑO EN EL MOTOR! Mantuviste pulsado el botón ${(elapsed / 1000).toFixed(1)}s (> 3 s). La bobina auxiliar de arranque (S) está construida con hilo muy delgado y no tolera servicio continuo. El protector térmico Klixon ha saltado para evitar que el motor se queme. Haz clic en "REARMAR KLIXON" para volver a intentar.`);
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
      } else {
        // El tiempo seguro de impulso para vencer la inercia sin dañar el bobinado es de 1.2s a 3.0s
        if (elapsed < 1200) {
          setIsMotorRunning(false);
          setFeedbackMessage(`⚠️ Impulso insuficiente (${(elapsed / 1000).toFixed(1)}s): El rotor no alcanzó suficiente inercia. Mantén pulsado el botón entre 1.5 y 2.5 segundos para arrancar.`);
        } else if (elapsed <= 3000) {
          setIsMotorRunning(true);
          setFeedbackMessage(`✅ ¡Arranque exitoso! Impulso de ${(elapsed / 1000).toFixed(1)}s. El compresor ha alcanzado régimen normal (~2.850 RPM) y funciona de forma estable.`);
        } else {
          setIsMotorRunning(true);
          setFeedbackMessage(`⚠️ ¡ALERTA DE DAÑO EN EL MOTOR! Mantuviste pulsado ${(elapsed / 1000).toFixed(1)}s (> 3 s). La bobina de arranque (S) ha sufrido un sobrecalentamiento severo. Si el pulsador se mantiene más de 3 segundos de forma continuada, el esmalte se carboniza y el motor queda inutilizado o salta el Klixon.`);
        }
      }
    }
    setBridgeDurationMs(0);
  };

  // Clic directo: si el usuario hace clic rápido sin mantener, se le recuerda que debe mantener pulsado
  const handleClickBridge = () => {
    if (!powerOn || klixonTripped) return;
    if (!isBridging && !isMotorRunning) {
      setFeedbackMessage('👇 Haz clic y MANTÉN PULSADO el botón durante 1.5 a 2.5 segundos para que el rotor arranque.');
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
