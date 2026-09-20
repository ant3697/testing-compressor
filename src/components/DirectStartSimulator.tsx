import React, { useState, useEffect, useRef } from 'react';
import directStartImg from '../assets/arranque directo.png';
import { RealisticPushbutton } from './RealisticPushbutton';
import { ZoomPanViewer } from './ZoomPanViewer';
import { KlixonModal } from './KlixonModal';
import {
  Zap,
  Play,
  Square,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Flame,
  Gauge,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Power,
  ShieldAlert,
} from 'lucide-react';

interface DirectStartSimulatorProps {
  rMarcha?: string;
  rArranque?: string;
  onNavigateToWiring?: () => void;
}

export const DirectStartSimulator: React.FC<DirectStartSimulatorProps> = ({
  rMarcha = '9.7',
  rArranque = '13.1',
  onNavigateToWiring
}) => {
  // Simulator State
  const [benchMode, setBenchMode] = useState<'photo' | 'schematic'>('photo');
  const [powerOn, setPowerOn] = useState<boolean>(false);
  const [isBridging, setIsBridging] = useState<boolean>(false); // Button pressed
  const [isMotorRunning, setIsMotorRunning] = useState<boolean>(false);
  const [isSeizedMotor, setIsSeizedMotor] = useState<boolean>(false); // Mechanically locked rotor
  const [klixonTripped, setKlixonTripped] = useState<boolean>(false);
  const [isKlixonModalOpen, setIsKlixonModalOpen] = useState<boolean>(false);
  const [bridgeDurationMs, setBridgeDurationMs] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Amperage simulation
  const [currentAmps, setCurrentAmps] = useState<number>(0.0);

  // Timers and Audio references
  const bridgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const subOscillatorRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const filterNode2Ref = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Web Audio Synthesizer for realistic workshop hum & attenuated compressor operation
  const playSound = (type: 'lra' | 'running' | 'click' | 'stop') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.20, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
        return;
      }

      // Initialize authentic, acoustically-attenuated hermetic compressor sound generator
      if (!oscillatorRef.current) {
        // 1. Primary fundamental motor rotation oscillator (sinusoidal: deep 47.5 Hz representing 2.850 RPM)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(47.5, ctx.currentTime);

        // 2. Secondary gentle piston compression stroke harmonic (sinusoidal: 95.0 Hz)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(95.0, ctx.currentTime);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.09, ctx.currentTime);
        osc2.connect(subGain);

        // 3. Dual-stage acoustic low-pass dampening filter (drawn-steel dome and oil bath isolation)
        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(118, ctx.currentTime);
        filter1.Q.setValueAtTime(0.707, ctx.currentTime);

        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(138, ctx.currentTime);
        filter2.Q.setValueAtTime(0.707, ctx.currentTime);

        osc1.connect(filter1);
        subGain.connect(filter1);
        filter1.connect(filter2);

        // 4. Subtle mechanical compression pulse LFO (23.75 Hz)
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
        // Deeper loaded magnetizing hum during rotor standstill or initial boost
        osc1.frequency.setTargetAtTime(49.0, ctx.currentTime, 0.06);
        if (osc2) osc2.frequency.setTargetAtTime(98.0, ctx.currentTime, 0.06);
        if (filter1) filter1.frequency.setTargetAtTime(108, ctx.currentTime, 0.06);
        if (filter2) filter2.frequency.setTargetAtTime(128, ctx.currentTime, 0.06);
        gain.gain.setTargetAtTime(0.075, ctx.currentTime, 0.06);
      } else if (type === 'running') {
        // Atenuado: Ronroneo suave, sordo y amortiguado de compresor hermético en régimen nominal (2.850 RPM)
        osc1.frequency.setTargetAtTime(47.5, ctx.currentTime, 0.18);
        if (osc2) osc2.frequency.setTargetAtTime(95.0, ctx.currentTime, 0.18);
        if (filter1) filter1.frequency.setTargetAtTime(116, ctx.currentTime, 0.18);
        if (filter2) filter2.frequency.setTargetAtTime(136, ctx.currentTime, 0.18);
        // Nivel atenuado y confortable: 0.034 (amortiguado por carcasa y baño de aceite)
        gain.gain.setTargetAtTime(0.034, ctx.currentTime, 0.20);
      }
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update current amperage dynamically based on system state
  useEffect(() => {
    if (!powerOn || klixonTripped) {
      setCurrentAmps(0.0);
      playSound('stop');
      return;
    }

    if (isSeizedMotor) {
      // Locked rotor: LRA (~5.6 A)
      setCurrentAmps(5.6);
      playSound('lra');
      return;
    }

    if (isBridging) {
      // While bridge button is active: Start + Run windings in parallel (Inrush start peak ~5.2 A)
      setCurrentAmps(5.2);
      playSound('lra');
    } else if (isMotorRunning) {
      // Running stably: Nominal FLA matching the image display: 0.80 A
      setCurrentAmps(0.80);
      playSound('running');
    } else {
      // Power is ON, but bridge was never pressed: only Run winding energized, stalled (Humming ~4.8 A)
      setCurrentAmps(4.8);
      playSound('lra');
    }
  }, [powerOn, isBridging, isMotorRunning, isSeizedMotor, klixonTripped, soundEnabled]);

  // Thermal Protection (Klixon) timer when locked or humming for too long
  useEffect(() => {
    let klixonTimer: NodeJS.Timeout | null = null;
    const isOverheating = powerOn && !klixonTripped && (!isMotorRunning || isSeizedMotor);

    if (isOverheating) {
      // After 4.5 seconds of locked rotor current, Klixon opens with a CLICK
      klixonTimer = setTimeout(() => {
        setKlixonTripped(true);
        setIsMotorRunning(false);
        playSound('click');
      }, 4500);
    }

    return () => {
      if (klixonTimer) clearTimeout(klixonTimer);
    };
  }, [powerOn, klixonTripped, isMotorRunning, isSeizedMotor]);

  // Track bridge button holding time and handle 0.3s auto-start and >3s error
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isBridging && powerOn && !klixonTripped) {
      interval = setInterval(() => {
        setBridgeDurationMs((prev) => {
          const next = prev + 50;
          // Auto-start after 0.3s
          if (next >= 300 && !isMotorRunning && !isSeizedMotor) {
            setIsMotorRunning(true);
            playSound('running');
          }
          // Error and Klixon trip if held > 3.5s
          if (next >= 3500) {
            setKlixonTripped(true);
            setIsMotorRunning(false);
            setIsBridging(false);
            playSound('click');
            playSound('stop');
          }
          return next;
        });
      }, 50);
    } else {
      setBridgeDurationMs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBridging, powerOn, klixonTripped, isMotorRunning, isSeizedMotor]);

  // Handle Power Switch (230V Mains)
  const handleTogglePower = () => {
    playSound('click');
    if (powerOn) {
      setPowerOn(false);
      setIsBridging(false);
      setIsMotorRunning(false);
      setKlixonTripped(false);
      playSound('stop');
    } else {
      setPowerOn(true);
      setKlixonTripped(false);
      setIsMotorRunning(false);
    }
  };

  // Pushbutton / Screwdriver Bridge Actions
  const handleStartBridge = () => {
    if (!powerOn || klixonTripped || isMotorRunning) return;
    playSound('click');
    setIsBridging(true);
  };

  const handleEndBridge = () => {
    if (!isBridging) return;
    setIsBridging(false);

    if (powerOn && !klixonTripped) {
      if (isSeizedMotor) {
        // Seized compressor cannot start
        setIsMotorRunning(false);
      } else if (bridgeDurationMs >= 300) {
        setIsMotorRunning(true);
      } else {
        setIsMotorRunning(false);
      }
    }
  };

  // Quick pulse click handler for the direct start bridge switch
  const handleClickBridge = () => {
    if (!powerOn || klixonTripped || isMotorRunning) return;
    playSound('click');
    setIsBridging(true);

    setTimeout(() => {
      setIsBridging(false);
      if (powerOn && !klixonTripped && !isSeizedMotor) {
        setIsMotorRunning(true);
      }
    }, 350);
  };

  // Reset simulation
  const handleReset = () => {
    setPowerOn(false);
    setIsBridging(false);
    setIsMotorRunning(false);
    setKlixonTripped(false);
    setBridgeDurationMs(0);
    playSound('stop');
  };

  // Determine Clamp meter zone and color
  const getClampStatus = () => {
    if (!powerOn || klixonTripped) {
      return { label: '0.0 A • CIRCUITO SIN CARGA', color: 'text-slate-400', bg: 'bg-slate-800' };
    }
    if (currentAmps > 10) {
      return {
        label: `LRA (Pico de Arranque): ${currentAmps.toFixed(1)} A`,
        color: 'text-amber-400',
        bg: 'bg-amber-950/60 border-amber-500/40'
      };
    }
    return {
      label: `FLA (Régimen Nominal): ${currentAmps.toFixed(1)} A`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/60 border-emerald-500/40'
    };
  };

  const clampInfo = getClampStatus();

  return (
    <div className="w-full space-y-3 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Header Row with quick controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-small font-bold text-slate-900 dark:text-white">
              Simulador de Arranque Directo de Taller (Prueba de Pulsador / Destornillador)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Procedimiento oficial para comprobar si el compresor está mecánicamente trabado o si falla el relé/PTC.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (soundEnabled) playSound('stop');
            }}
            className={`px-2.5 py-1 rounded text-tiny font-mono flex items-center gap-1 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-400/15 border-amber-500/40 text-amber-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
            }`}
            title="Activar/Desactivar sonido de motor"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* Guide toggle */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-2.5 py-1 rounded text-tiny font-mono flex items-center gap-1 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Instrucciones</span>
          </button>
        </div>
      </div>

      {/* Guide Panel Collapsible */}
      {showGuide && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-tiny text-slate-700 dark:text-slate-300 space-y-2 animate-fadeIn">
          <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>Protocolo de Comprobación en Banco (Maestro Cifu):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
            <li>
              <strong>Alimentación directa:</strong> Conecta la <strong>Fase ($L$)</strong> al borne <strong>Común ($C$)</strong> y el <strong>Neutro ($N$)</strong> al borne <strong>Marcha ($R$)</strong>.
            </li>
            <li>
              <strong>Pinza amperimétrica:</strong> Abraza la Fase ($L$) para medir el consumo en tiempo real.
            </li>
            <li>
              <strong>Impulso de arranque:</strong> Con tensión aplicada, haz un puente momentáneo (con <strong>0.3 segundos</strong> es suficiente) entre <strong>Marcha ($R$)</strong> y <strong>Arranque ($S$)</strong> con un pulsador o destornillador aislado.
            </li>
            <li>
              <strong>Criterio de diagnóstico:</strong> Si el compresor arranca y los amperios caen a nominal (~2.4 A), el compresor está perfecto mecánicamente; la avería estaba en el relé o PTC. Si no arranca y el Klixon corta a 18 A, el compresor está clavado (gripado).
            </li>
          </ol>
        </div>
      )}

      {/* Main Bench Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        {/* LEFT COLUMN: INTERACTIVE VISUAL SCHEMATIC & MOTOR (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-inner flex flex-col justify-between relative overflow-hidden">
          {/* Bench Status Header inside schematic */}
          <div className="flex items-center justify-between z-10 mb-2 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  klixonTripped
                    ? 'bg-rose-500 animate-ping'
                    : powerOn
                    ? isMotorRunning
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : 'bg-amber-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
              <span className="font-mono text-tiny font-bold uppercase tracking-wider text-slate-300">
                {klixonTripped
                  ? 'KLIXON DISPARADO (SOBRECARGA)'
                  : powerOn
                  ? isMotorRunning
                    ? 'COMPRESOR EN MARCHA (FLA)'
                    : 'TENSIÓN APLICADA (PARADO - LRA)'
                  : 'BANCO DESCONECTADO (0V)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Rotor RPM Badge */}
              <div className="font-mono text-tiny px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <RotateCw className={`w-3 h-3 ${isMotorRunning ? 'animate-spin text-emerald-400' : 'text-slate-500'}`} />
                <span>{isMotorRunning ? '~2.850 RPM' : '0 RPM'}</span>
              </div>

              {/* View Mode Toggle: Realistic Workshop Photo vs Vector Schematic */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setBenchMode('photo')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    benchMode === 'photo'
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista fotográfica interactiva del banco de taller"
                >
                  <Eye className="w-2.5 h-2.5" />
                  <span>Banco Real</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBenchMode('schematic')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                    benchMode === 'schematic'
                      ? 'bg-amber-400 text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Esquema eléctrico con devanados internos"
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>Esquema</span>
                </button>
              </div>
            </div>
          </div>

          {/* WORKSTATION VIEW: REALISTIC BENCH WITH LIVE OVERLAYS (PHOTO) */}
          {benchMode === 'photo' && (
            <div className="w-full flex-1 flex flex-col items-center justify-center relative select-none py-1">
              <ZoomPanViewer
                className="w-full aspect-[1024/678] max-h-[390px] rounded-xl bg-[#070a12] border border-slate-800 shadow-2xl"
                containerClassName="w-full h-full relative"
                initialZoom={1}
                minZoom={0.8}
                maxZoom={3.5}
                toolbarPosition="top-right"
                title="Banco de trabajo de arranque directo"
              >
                {/* Background Workbench Image from src/assets/arranque directo.png */}
                <img
                  src={directStartImg}
                  onError={(e) => {
                    // Fallback to static public route if needed
                    (e.target as HTMLImageElement).src = '/arranque-directo.png';
                  }}
                  alt="Arranque Directo Compresor - Pulsador, Bornes F y N, Klixon, Amperímetro y Carcasa (src/assets/arranque directo.png)"
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />

                {/* Live Energized Wire Currents Glow SVG Layer matching exact image coordinates */}
                <svg
                  viewBox="0 0 1024 678"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <filter id="wireEnergyGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Phase Wire (Marrón): L (75, 307) -> Clamp (230, 307) -> Klixon -> R (795, 307) */}
                  {powerOn && !klixonTripped && (
                    <path
                      d="M 75 307 L 365 307 M 450 307 L 775 307"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                      className="animate-pulse"
                      opacity="0.8"
                      filter="url(#wireEnergyGlow)"
                    />
                  )}

                  {/* Neutral Wire (Azul): N (83, 414) -> corner -> bottom -> C (846, 422) */}
                  {powerOn && !klixonTripped && (
                    <path
                      d="M 83 414 L 140 414 L 140 650 L 460 650 L 460 422 L 825 422"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                      className="animate-pulse"
                      opacity="0.8"
                      filter="url(#wireEnergyGlow)"
                    />
                  )}

                  {/* Green Wire: Switch Left Pin (840, 180) -> R (782, 307) */}
                  {isBridging && (
                    <path
                      d="M 840 180 L 840 215 L 782 215 L 782 290"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="4.5"
                      strokeDasharray="5 5"
                      className="animate-pulse"
                      filter="url(#wireEnergyGlow)"
                    />
                  )}

                  {/* Yellow Wire: Switch Right Pin (872, 180) -> S (928, 307) */}
                  {isBridging && (
                    <path
                      d="M 872 180 L 872 215 L 928 215 L 928 290"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="4.5"
                      strokeDasharray="5 5"
                      className="animate-pulse"
                      filter="url(#wireEnergyGlow)"
                    />
                  )}

                  {/* Spark arc at switch terminal pins when pressed */}
                  {isBridging && (
                    <g>
                      <circle cx="856" cy="180" r="6" fill="#facc15" className="animate-ping" opacity="0.9" />
                      <circle cx="840" cy="180" r="4" fill="#86efac" />
                      <circle cx="872" cy="180" r="4" fill="#fef08a" />
                    </g>
                  )}
                </svg>

                {/* ---------------------------------------------------- */}
                {/* 1. EL INTERRUPTOR/PULSADOR DE LA IMAGEN (PUENTE R-S) */}
                {/* ---------------------------------------------------- */}
                <div
                  id="switch-pulsador-arranque"
                  className="absolute z-30 cursor-pointer select-none group focus:outline-none"
                  style={{
                    left: '79.2%',
                    top: '8.5%',
                    width: '10.5%',
                    height: '19.5%'
                  }}
                  onClick={handleClickBridge}
                  onMouseDown={handleStartBridge}
                  onMouseUp={handleEndBridge}
                  onMouseLeave={handleEndBridge}
                  onTouchStart={handleStartBridge}
                  onTouchEnd={handleEndBridge}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleClickBridge();
                    }
                  }}
                  title="Pulsador Puente R-S: Haz clic o mantén pulsado (1-2s) para arrancar el compresor"
                  aria-label="Pulsador de arranque directo puente R-S"
                >
                  {/* Realistic Animated Plunger Button matching the photo */}
                  <div className="relative w-full h-full flex flex-col items-center">
                    {/* Button Plunger Cap (Animates Downwards when pressed without outer borders or glowing rings) */}
                    <div
                      className={`w-[68%] aspect-[75/48] rounded-t-lg transition-all duration-100 flex items-center justify-center relative shadow-lg ${
                        isBridging
                          ? 'translate-y-2 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900'
                          : 'bg-gradient-to-b from-blue-400 via-blue-600 to-blue-700 hover:brightness-110 shadow-md'
                      }`}
                    >
                      {/* Metallic bevel rim reflection on the button cap */}
                      <div className="absolute inset-x-1 top-0.5 h-[2px] bg-white/40 rounded-full" />
                      <span className="text-[6px] sm:text-[7.5px] font-mono font-black text-white/95 uppercase drop-shadow-sm">
                        {isBridging ? 'PULSADO' : 'PULSAR'}
                      </span>
                    </div>

                    {/* Metallic threaded nut / bezel matching the switch in the photo */}
                    <div className="w-[82%] h-[18%] bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-sm border border-slate-500 shadow-sm relative -mt-0.5">
                      <div className="w-full h-[1px] bg-white/60 absolute top-0" />
                    </div>

                    {/* Switch Body & Contact Arc Spark */}
                    <div className="w-[74%] flex-1 bg-gradient-to-b from-slate-800 to-slate-950 rounded-b border border-slate-700 relative flex items-center justify-center">
                      {isBridging ? (
                        <div className="flex flex-col items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current animate-ping" />
                          <span className="text-[5.5px] font-mono font-black text-amber-300 leading-none">
                            PUENTE CERRADO
                          </span>
                        </div>
                      ) : (
                        <span className="text-[5px] font-mono text-slate-400 text-center leading-tight">
                          {isMotorRunning ? 'ARRANCADO (ABIERTO)' : 'PARADA (ABIERTO)'}
                        </span>
                      )}
                    </div>

                    {/* Active current spark indicator below switch terminals */}
                    {isBridging && (
                      <div className="absolute -bottom-2 text-amber-400 animate-bounce">
                        <span className="text-[7px] font-mono font-extrabold bg-black/90 px-1 py-0.2 rounded border border-amber-400 text-amber-300 shadow">
                          ⚡ R ⟷ S
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 2. DISPLAY DEL AMPERÍMETRO (PINZA AMPERIMÉTRICA)     */}
                {/* Sits right over the LCD display of the clamp meter   */}
                {/* ---------------------------------------------------- */}
                <div
                  className="absolute rounded-[2px] overflow-hidden flex flex-col justify-between items-center px-1 py-0.5 select-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] border border-black/50 transition-colors z-20"
                  style={{
                    left: '20.6%',
                    top: '70.8%',
                    width: '9.2%',
                    height: '11.0%',
                    backgroundColor: powerOn && !klixonTripped ? '#9eb08d' : '#828e77'
                  }}
                  title="Display LCD del Amperímetro: Medición de corriente en el conductor de Fase (L)"
                >
                  {/* Top LCD indicators */}
                  <div
                    className="w-full flex items-center justify-between text-[5.5px] sm:text-[6.5px] font-mono font-bold leading-none"
                    style={{ color: powerOn && !klixonTripped ? '#1a2717' : '#495243' }}
                  >
                    <span>20A</span>
                    <span className="text-[5px]">{isBridging ? 'PEAK' : powerOn ? 'RMS' : ''}</span>
                    <span>A~</span>
                  </div>

                  {/* Main Digital 7-Segment Value (e.g. 0.80 A nominal as in image) */}
                  <div
                    className="flex items-baseline justify-center font-mono font-black tracking-tight leading-none my-auto"
                    style={{ color: powerOn && !klixonTripped ? '#081309' : '#2b3327' }}
                  >
                    <span className="text-[11px] sm:text-[13px] font-black drop-shadow-[0_0.5px_0_rgba(255,255,255,0.3)]">
                      {powerOn && !klixonTripped ? currentAmps.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-[7.5px] font-bold ml-0.5">A</span>
                  </div>

                  {/* Bottom LCD indicators */}
                  <div
                    className="w-full flex items-center justify-between text-[5px] sm:text-[5.5px] font-mono leading-none"
                    style={{ color: powerOn && !klixonTripped ? '#24321f' : '#495243' }}
                  >
                    <span>HOLD</span>
                    <span className="font-bold">
                      {powerOn && !klixonTripped
                        ? currentAmps > 2
                          ? 'LRA'
                          : isMotorRunning
                          ? 'FLA'
                          : 'STALL'
                        : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 3. BORNES DE ENTRADA L (FASE) Y N (NEUTRO)           */}
                {/* Interactive: Click L or N to connect/disconnect 230V */}
                {/* ---------------------------------------------------- */}
                <div
                  className="absolute z-20 cursor-pointer select-none group"
                  style={{ left: '4.8%', top: '40.5%', width: '6.5%', height: '24.5%' }}
                  onClick={handleTogglePower}
                  title={powerOn ? 'Red 230V CONECTADA en bornes L y N. Clic para desconectar' : 'Red 230V DESCONECTADA. Clic para conectar red'}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleTogglePower();
                    }
                  }}
                >
                  {/* Glowing ring over L when energized */}
                  <div
                    className={`w-7 h-7 rounded-full absolute top-1 left-1/2 -translate-x-1/2 transition-all ${
                      powerOn && !klixonTripped
                        ? 'ring-2 ring-red-400 bg-red-500/20 shadow-[0_0_12px_#ef4444]'
                        : 'hover:ring-1 hover:ring-red-400/50'
                    }`}
                  />
                  {/* Glowing ring over N when energized */}
                  <div
                    className={`w-7 h-7 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 transition-all ${
                      powerOn && !klixonTripped
                        ? 'ring-2 ring-sky-400 bg-sky-500/20 shadow-[0_0_12px_#38bdf8]'
                        : 'hover:ring-1 hover:ring-sky-400/50'
                    }`}
                  />
                </div>

                {/* ---------------------------------------------------- */}
                {/* 4. KLIXON PROTECTOR TÉRMICO (SOBRE LÍNEA DE FASE)    */}
                {/* ---------------------------------------------------- */}
                {klixonTripped && (
                  <div
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ left: '40.0%', top: '46.3%' }}
                    onClick={() => {
                      setKlixonTripped(false);
                      playSound('click');
                    }}
                    title="¡Klixon disparado por sobretemperatura! Haz clic para rearmar"
                  >
                    <div className="bg-rose-600 text-white px-2 py-0.5 rounded shadow-[0_0_15px_#f43f5e] border border-rose-300 flex items-center gap-1 text-[8px] font-mono font-black animate-pulse whitespace-nowrap">
                      <Flame className="w-3 h-3 text-yellow-200 fill-current" />
                      <span>¡KLIXON ABIERTO! (CLIC REARMAR)</span>
                    </div>
                  </div>
                )}

                {/* 4b. ETIQUETA KLIXON INTERACTIVA (SOBRE LA IMAGEN DEL BANCO) */}
                <div
                  id="klixon-simulator-photo-hotspot"
                  className="absolute pointer-events-auto cursor-pointer select-none group z-20"
                  style={{
                    left: '40.04%',
                    top: '46.75%',
                    transform: 'translate(-50%, -50%)',
                    width: '8.98%',
                    height: '10.32%',
                  }}
                  onClick={() => setIsKlixonModalOpen(true)}
                  title="Protector Térmico Klixon: Clic para ver fotografía y despiece en ventana modal"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setIsKlixonModalOpen(true);
                    }
                  }}
                >
                  <div className="w-full h-full rounded-[14px] border-2 border-amber-400/40 group-hover:border-amber-400 group-hover:bg-amber-400/20 group-hover:shadow-[0_0_18px_rgba(251,191,36,0.7)] transition-all flex flex-col items-center justify-center relative">
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-30 bg-slate-950/95 text-amber-300 border border-amber-400/80 rounded-md px-2 py-0.5 text-[9px] font-mono font-black whitespace-nowrap shadow-2xl flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>KLIXON • Clic para ver modal</span>
                    </div>
                  </div>
                </div>
              </ZoomPanViewer>
            </div>
          )}

          {/* VIEW 2: VECTORIAL THEORETICAL SCHEMATIC DIAGRAM */}
          {benchMode === 'schematic' && (
            <div className="w-full flex-1 flex items-center justify-center relative min-h-[260px] py-1">
              <ZoomPanViewer
                className="w-full aspect-[1024/678] max-h-[390px] rounded-xl bg-[#070a12] border border-slate-800 shadow-2xl flex items-center justify-center"
                containerClassName="w-full h-full flex items-center justify-center"
                initialZoom={1}
                minZoom={0.8}
                maxZoom={3.5}
                toolbarPosition="top-right"
                title="Esquema eléctrico vectorial de arranque directo"
              >
                <svg viewBox="0 0 540 290" className="w-full h-auto max-h-[300px] select-none pointer-events-auto">
                  <defs>
                {/* Metallic gradient for compressor housing */}
                <radialGradient id="compressorCanGrad" cx="45%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#2a3346" />
                  <stop offset="70%" stopColor="#141a29" />
                  <stop offset="100%" stopColor="#0a0e17" />
                </radialGradient>

                {/* Rotor center gradient */}
                <radialGradient id="rotorGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="65%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>

                {/* Clamp meter body gradient */}
                <linearGradient id="clampBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="60%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#9a3412" />
                </linearGradient>

                {/* Blue plunger button 3D gradient */}
                <linearGradient id="pbPlungerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="25%" stopColor="#2563eb" />
                  <stop offset="60%" stopColor="#3b82f6" />
                  <stop offset="85%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>

                {/* Plunger top cap specular gradient */}
                <radialGradient id="pbCapGrad" cx="45%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#bfdbfe" />
                  <stop offset="40%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </radialGradient>

                {/* Chrome / metallic collar gradient */}
                <linearGradient id="pbChromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="20%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#f8fafc" />
                  <stop offset="80%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                {/* Housing casing gradient */}
                <linearGradient id="pbHousingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="40%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* Glow filter for active current wires */}
                <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Intense spark filter */}
                <filter id="sparkGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* -------------------------------------------------- */}
              {/* 1. 230V MAINS SUPPLY TERMINALS (LEFT)               */}
              {/* -------------------------------------------------- */}
              <g id="power-source" transform="translate(15, 48)">
                <rect x="0" y="0" width="75" height="175" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <text x="37.5" y="22" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  RED 230V
                </text>
                <text x="37.5" y="34" fill="#64748b" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
                  50 Hz Monof.
                </text>

                {/* Terminal L (Fase - Marrón) */}
                <circle cx="37.5" cy="58" r="9" fill={powerOn && !klixonTripped ? '#b45309' : '#451a03'} stroke="#d97706" strokeWidth="1.5" />
                <text x="37.5" y="61.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">L</text>
                <text x="37.5" y="76" fill="#f59e0b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Fase</text>

                {/* Terminal N (Neutro - Azul) */}
                <circle cx="37.5" cy="102" r="9" fill={powerOn && !klixonTripped ? '#0284c7' : '#082f49'} stroke="#38bdf8" strokeWidth="1.5" />
                <text x="37.5" y="105.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">N</text>
                <text x="37.5" y="120" fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle">Neutro</text>

                {/* Interactive 230V toggle switch */}
                <g
                  id="schematic-switch-230v"
                  transform="translate(10, 134)"
                  className="cursor-pointer group"
                  onClick={handleTogglePower}
                >
                  <title>{powerOn ? 'Interruptor 230V ACTIVO • Clic para apagar' : 'Interruptor 230V APAGADO • Clic para encender'}</title>
                  <rect
                    x="0"
                    y="0"
                    width="55"
                    height="20"
                    rx="5"
                    fill={powerOn ? '#065f46' : '#1e293b'}
                    stroke={powerOn ? '#10b981' : '#64748b'}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={powerOn ? 43 : 12}
                    cy="10"
                    r="6"
                    fill={powerOn ? '#34d399' : '#94a3b8'}
                    stroke="#022c22"
                    strokeWidth="1"
                  />
                  <text
                    x={powerOn ? 22 : 33}
                    y="13"
                    fill={powerOn ? '#ffffff' : '#94a3b8'}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {powerOn ? 'ON' : 'OFF'}
                  </text>
                  <text
                    x="27.5"
                    y="31"
                    fill={powerOn ? '#34d399' : '#94a3b8'}
                    fontSize="6"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    CLIC 230V
                  </text>
                </g>
              </g>

              {/* -------------------------------------------------- */}
              {/* 2. AMPEREMETRIC CLAMP METER (ON PHASE WIRE)        */}
              {/* -------------------------------------------------- */}
              <g id="clamp-meter" transform="translate(100, 22)">
                {/* Clamp Jaws encircling the Phase wire */}
                <path
                  d="M 28 35 C 10 35, 5 65, 5 78 C 5 92, 12 108, 28 108 C 40 108, 48 95, 48 78 C 48 62, 40 35, 28 35 Z"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <circle cx="28" cy="78" r="16" fill="#090d16" stroke="#c2410c" strokeWidth="1" />

                {/* Clamp Body */}
                <rect x="18" y="102" width="60" height="95" rx="8" fill="url(#clampBodyGrad)" stroke="#7c2d12" strokeWidth="1.5" />

                {/* Clamp LCD Display */}
                <rect x="25" y="112" width="46" height="28" rx="3" fill="#a3b18a" stroke="#344e41" strokeWidth="1" />
                <text x="48" y="132" fill="#142617" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {powerOn && !klixonTripped ? currentAmps.toFixed(1) : '0.0'}
                </text>
                <text x="66" y="123" fill="#142617" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                  A~
                </text>

                {/* Dial mark */}
                <circle cx="48" cy="158" r="9" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                <line x1="48" y1="158" x2="48" y2="152" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                <text x="48" y="177" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  PINZA 20A
                </text>
              </g>

              {/* -------------------------------------------------- */}
              {/* 3. KLIXON THERMAL PROTECTOR                        */}
              {/* -------------------------------------------------- */}
              <g
                id="klixon-protector"
                transform="translate(195, 110)"
                onClick={() => setIsKlixonModalOpen(true)}
                className="cursor-pointer group"
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
              >
                <title>Protector Térmico Klixon: Clic para ver fotografía y despiece en ventana modal</title>
                <rect
                  x="0"
                  y="0"
                  width="44"
                  height="34"
                  rx="6"
                  fill={klixonTripped ? '#881337' : '#1e293b'}
                  stroke={klixonTripped ? '#f43f5e' : '#fbbf24'}
                  strokeWidth="1.5"
                  className="transition-all hover:stroke-amber-300 hover:fill-amber-950/40"
                />
                <text x="22" y="14" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  KLIXON
                </text>
                {/* Bimetal contact symbol */}
                {klixonTripped ? (
                  <path d="M 12 24 L 20 24 L 30 18" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M 12 24 L 32 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                )}
                <circle cx="12" cy="24" r="2" fill="#cbd5e1" />
                <circle cx="32" cy="24" r="2" fill="#cbd5e1" />
                {klixonTripped && (
                  <text x="22" y="31" fill="#f43f5e" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                    ¡ABIERTO!
                  </text>
                )}
              </g>

              {/* -------------------------------------------------- */}
              {/* 4. COMPRESSOR CAN & FUSITE TERMINAL PLATE (RIGHT)  */}
              {/* -------------------------------------------------- */}
              <g id="compressor-fusite" transform="translate(280, 25)">
                {/* Compressor Can Outer Rim */}
                <ellipse cx="140" cy="125" rx="115" ry="115" fill="url(#compressorCanGrad)" stroke="#475569" strokeWidth="3" />
                <text x="140" y="24" fill="#94a3b8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  COMPRESOR HERMÉTICO (1/4 HP)
                </text>

                {/* Rotating Internal Rotor Simulation */}
                <g transform="translate(68, 145)">
                  <circle cx="0" cy="0" r="38" fill="url(#rotorGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Rotating Rotor Blades Animation */}
                  <g className={isMotorRunning ? 'animate-spin' : ''} style={{ transformOrigin: 'center' }}>
                    <line x1="-30" y1="0" x2="30" y2="0" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="0" y1="-30" x2="0" y2="30" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="-21" y1="-21" x2="21" y2="21" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="-21" y1="21" x2="21" y2="-21" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="12" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="4.5" fill="#38bdf8" />
                  </g>

                  {/* Rotor status badge */}
                  <rect x="-30" y="44" width="60" height="14" rx="3" fill="#090d16" stroke="#334155" strokeWidth="0.8" />
                  <text
                    x="0"
                    y="54"
                    fill={isMotorRunning ? '#34d399' : isSeizedMotor && powerOn ? '#f87171' : '#94a3b8'}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {isMotorRunning ? '2.850 RPM' : isSeizedMotor && powerOn ? '¡CLAVADO!' : 'PARADO'}
                  </text>
                </g>

                {/* ========================================================= */}
                {/* 5. DASHED FUSITE TERMINAL PLATE (AS IN USER'S IMAGE)      */}
                {/* ========================================================= */}
                <g id="fusite-terminal-plate">
                  {/* Dashed outer box */}
                  <rect
                    x="118"
                    y="112"
                    width="114"
                    height="86"
                    rx="8"
                    fill="#070b14"
                    fillOpacity="0.9"
                    stroke="#64748b"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                  />

                  {/* Borne C (Común / Fase - Top Center) at (175, 132) */}
                  <g transform="translate(175, 132)">
                    <circle cx="0" cy="0" r="9.5" fill="#0f172a" stroke="#d97706" strokeWidth="1.8" />
                    <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
                    <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">C</text>
                    {/* (Fase) badge */}
                    <g transform="translate(0, 16)">
                      <rect x="-18" y="-7" width="36" height="12" rx="3" fill="#000000" stroke="#f59e0b" strokeWidth="1" />
                      <text x="0" y="2" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        (Fase)
                      </text>
                    </g>
                  </g>

                  {/* Borne R (Marcha / Run - Bottom Left) at (142, 172) */}
                  <g transform="translate(142, 172)">
                    <circle cx="0" cy="0" r="9.5" fill="#0f172a" stroke="#22c55e" strokeWidth="1.8" />
                    <circle cx="0" cy="0" r="5.5" fill="#22c55e" />
                    <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">R</text>
                    <text x="-14" y="16" fill="#4ade80" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      Marcha (R)
                    </text>
                  </g>

                  {/* Borne S (Arranque / Start - Bottom Right) at (208, 172) */}
                  <g transform="translate(208, 172)">
                    <circle cx="0" cy="0" r="9.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
                    <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
                    <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">S</text>
                    <text x="14" y="16" fill="#fbbf24" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      S (Start)
                    </text>
                  </g>
                </g>

                {/* ========================================================= */}
                {/* 6. ANIMATED REALISTIC PUSHBUTTON (PUENTE R - S)           */}
                {/* ========================================================= */}
                <g
                  id="schematic-pulsador-rs"
                  transform="translate(175, 42)"
                  className="cursor-pointer group select-none focus:outline-none"
                  onClick={handleClickBridge}
                  onMouseDown={handleStartBridge}
                  onMouseUp={handleEndBridge}
                  onMouseLeave={handleEndBridge}
                  onTouchStart={handleStartBridge}
                  onTouchEnd={handleEndBridge}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleClickBridge();
                    }
                  }}
                >
                  <title>Pulsador Puente R-S: Haz clic o mantén pulsado para iniciar el arranque</title>
                  {/* Header labels */}
                  <text x="0" y="-12" fill="#f1f5f9" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                    PULSADOR
                  </text>
                  <text x="0" y="-3" fill="#fbbf24" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    (PUENTE R - S)
                  </text>

                  {/* BLUE BUTTON PLUNGER (PHYSICALLY DEPRESSES WHEN PRESSED) */}
                  <g
                    id="schematic-blue-plunger"
                    transform={isBridging ? 'translate(0, 6)' : 'translate(0, 0)'}
                    style={{ transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    {/* Plunger stem */}
                    <rect
                      x="-8"
                      y={isBridging ? 10 : 4}
                      width="16"
                      height={isBridging ? 8 : 14}
                      rx="2.5"
                      fill="url(#pbPlungerGrad)"
                      stroke="#1d4ed8"
                      strokeWidth="0.8"
                    />
                    {/* Domed top cap */}
                    <ellipse
                      cx="0"
                      cy={isBridging ? 10 : 4}
                      rx="10"
                      ry="3.5"
                      fill="url(#pbCapGrad)"
                      stroke="#1e40af"
                      strokeWidth="0.8"
                    />
                    {/* Top specular highlight */}
                    <ellipse cx="-1.5" cy={isBridging ? 9.5 : 3.5} rx="5" ry="1.5" fill="#ffffff" opacity="0.5" />
                  </g>

                  {/* Threaded Bushing Neck */}
                  <rect x="-9" y="15" width="18" height="7" rx="1" fill="url(#pbChromeGrad)" stroke="#334155" strokeWidth="0.8" />
                  <line x1="-8" y1="17.5" x2="8" y2="17.5" stroke="#475569" strokeWidth="0.6" />
                  <line x1="-8" y1="19.5" x2="8" y2="19.5" stroke="#475569" strokeWidth="0.6" />

                  {/* Hexagonal Nut / Bezel Collar */}
                  <polygon points="-15,22 15,22 13,27 -13,27" fill="url(#pbChromeGrad)" stroke="#1e293b" strokeWidth="0.8" />
                  <line x1="-12" y1="24.5" x2="12" y2="24.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.75" />

                  {/* Rubber Washer */}
                  <rect x="-14" y="27" width="28" height="2" rx="0.5" fill="#0f172a" stroke="#000000" strokeWidth="0.5" />

                  {/* Main Rectangular Switch Body */}
                  <rect x="-17" y="29" width="34" height="25" rx="2.5" fill="url(#pbHousingGrad)" stroke="#475569" strokeWidth="1" />
                  {/* Screws */}
                  <circle cx="-13.5" cy="41" r="1.3" fill="#94a3b8" />
                  <circle cx="13.5" cy="41" r="1.3" fill="#94a3b8" />

                  {/* Internal switch contact arm inside housing */}
                  <circle cx="-8" cy="41" r="1.5" fill={isBridging && powerOn && !klixonTripped ? '#4ade80' : '#94a3b8'} />
                  <circle cx="8" cy="41" r="1.5" fill={isBridging && powerOn && !klixonTripped ? '#facc15' : '#94a3b8'} />
                  {isBridging ? (
                    <g>
                      <line x1="-8" y1="41" x2="8" y2="41" stroke="#facc15" strokeWidth="2" strokeLinecap="round" filter="url(#sparkGlow)" />
                      <circle cx="0" cy="41" r="2.8" fill="#ffffff" className="animate-ping" />
                      <circle cx="0" cy="41" r="1.5" fill="#f59e0b" />
                    </g>
                  ) : (
                    <line x1="-8" y1="41" x2="5" y2="35" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                  )}

                  {/* Three Terminal Lugs at Bottom */}
                  {/* Lug 1 (Left - Green Wire to R) */}
                  <rect x="-12.5" y="54" width="4" height="8" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                  <circle cx="-10.5" cy="59" r="0.8" fill="#0f172a" />

                  {/* Lug 2 (Center - NC) */}
                  <rect x="-2" y="54" width="4" height="6.5" rx="1" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" opacity="0.6" />

                  {/* Lug 3 (Right - Yellow/Orange Wire to S) */}
                  <rect x="8.5" y="54" width="4" height="8" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                  <circle cx="10.5" cy="59" r="0.8" fill="#0f172a" />

                  {/* State Callout Banner directly under switch */}
                  <g transform="translate(0, 172)">
                    <rect
                      x="-82"
                      y="-8"
                      width="164"
                      height="16"
                      rx="4"
                      fill="#090d16"
                      stroke={
                        isBridging
                          ? '#f59e0b'
                          : isMotorRunning
                          ? '#10b981'
                          : '#475569'
                      }
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill={
                        isBridging
                          ? '#fbbf24'
                          : isMotorRunning
                          ? '#34d399'
                          : '#94a3b8'
                      }
                      fontSize="6.8"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {isBridging
                        ? '⚡ PULSADO: PUENTE R-S ACTIVO (ARRANQUE)'
                        : isMotorRunning
                        ? '✓ SIN PULSAR: MOTOR YA ARRANCADO'
                        : '⚪ SIN PULSAR: ESTADO DE PARADA'}
                    </text>
                  </g>
                </g>

                {/* ========================================================= */}
                {/* 7. CONNECTING WIRES FROM PUSHBUTTON TO R AND S            */}
                {/* ========================================================= */}
                {/* GREEN WIRE: Lug 1 at (164.5, 104) -> Terminal R at (142, 172) */}
                <path
                  d="M 164.5 104 L 164.5 125 L 142 125 L 142 172"
                  fill="none"
                  stroke={isBridging && powerOn && !klixonTripped ? '#22c55e' : '#15803d'}
                  strokeWidth={isBridging ? 3 : 2}
                  strokeLinecap="round"
                  strokeDasharray={isBridging ? '5 3' : undefined}
                  filter={isBridging && powerOn && !klixonTripped ? 'url(#sparkGlow)' : undefined}
                />

                {/* YELLOW/ORANGE WIRE: Lug 3 at (185.5, 104) -> Terminal S at (208, 172) */}
                <path
                  d="M 185.5 104 L 185.5 125 L 208 125 L 208 172"
                  fill="none"
                  stroke={isBridging && powerOn && !klixonTripped ? '#facc15' : '#b45309'}
                  strokeWidth={isBridging ? 3 : 2}
                  strokeLinecap="round"
                  strokeDasharray={isBridging ? '5 3' : undefined}
                  filter={isBridging && powerOn && !klixonTripped ? 'url(#sparkGlow)' : undefined}
                />

                {/* Spark pings at terminals R and S when bridging */}
                {isBridging && powerOn && !klixonTripped && (
                  <g>
                    <circle cx="142" cy="172" r="5" fill="#4ade80" className="animate-ping" opacity="0.8" />
                    <circle cx="208" cy="172" r="5" fill="#facc15" className="animate-ping" opacity="0.8" />
                  </g>
                )}
              </g>

              {/* -------------------------------------------------- */}
              {/* 8. MAINS WIRING TO COMPRESSOR TERMINALS            */}
              {/* -------------------------------------------------- */}
              {/* Phase Wire: L -> Klixon -> C at (455, 157) */}
              <path
                d="M 52 125 L 128 125 L 128 100 L 195 125"
                fill="none"
                stroke={powerOn && !klixonTripped ? '#d97706' : '#523412'}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={powerOn && !klixonTripped ? 'url(#wireGlow)' : undefined}
              />
              <path
                d="M 239 125 L 260 125 L 260 157 L 455 157"
                fill="none"
                stroke={powerOn && !klixonTripped ? '#d97706' : '#523412'}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={powerOn && !klixonTripped ? 'url(#wireGlow)' : undefined}
              />

              {/* Neutral Wire: N -> R (Marcha) at (422, 197) */}
              <path
                d="M 52 175 L 85 175 L 85 245 L 350 245 L 350 197 L 422 197"
                fill="none"
                stroke={powerOn && !klixonTripped ? '#0284c7' : '#0c4a6e'}
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={powerOn && !klixonTripped ? 'url(#wireGlow)' : undefined}
              />
            </svg>
            </ZoomPanViewer>
          </div>
          )}

          {/* Real-Time Live Measurements Banner */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Tensión Entrada</span>
              <span className="text-small font-bold text-slate-200">
                {powerOn ? '230 V ~' : '0 V'}
              </span>
            </div>
            <div className={`p-1.5 rounded-lg border ${clampInfo.bg}`}>
              <span className="text-[10px] text-slate-400 block">Corriente Fase (L)</span>
              <span className={`text-small font-bold ${clampInfo.color}`}>
                {currentAmps.toFixed(1)} A
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Tiempo de Puente</span>
              <span className={`text-small font-bold ${bridgeDurationMs > 2500 ? 'text-rose-400' : 'text-slate-200'}`}>
                {(bridgeDurationMs / 1000).toFixed(1)} s
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKSHOP CONTROLS & DIAGNOSTIC VERDICT (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* CONTROL BOX: 230V POWER & BRIDGE BUTTON */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-mono font-bold text-slate-500 uppercase tracking-wider">
                1. Controles del Banco de Pruebas
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-tiny font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Reiniciar
              </button>
            </div>

            {/* Power Switch (230V) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${powerOn ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-400'}`} />
                <div>
                  <span className="text-small font-bold text-slate-900 dark:text-white block">
                    Alimentación 230V (L y N)
                  </span>
                  <span className="text-tiny text-slate-500 dark:text-slate-400">
                    Fase a Común (C) • Neutro a Marcha (R)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTogglePower}
                className={`px-3 py-1.5 rounded-lg font-mono text-tiny font-bold cursor-pointer transition-all ${
                  powerOn
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {powerOn ? 'DESCONECTAR' : 'ENERGIZAR (230V)'}
              </button>
            </div>

            {/* THE WORKSHOP DIRECT START BUTTON (PUSH & HOLD) */}
            <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-tiny font-bold text-slate-700 dark:text-slate-300">
                <span>Pulsador de Arranque (Puente R ⟷ S)</span>
                <span className="text-[10px] text-amber-500 font-mono">Pulsar 1 - 2 seg. y soltar</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                💡 <em>Haz clic o mantén pulsado directamente sobre el botón azul para cerrar el puente de arranque.</em>
              </p>

              {/* Realistic Animated Pushbutton Widget matching image.png */}
              <div className="py-1 flex justify-center bg-black/40 rounded-xl border border-slate-700/60 p-2">
                <RealisticPushbutton
                  isBridging={isBridging}
                  powerOn={powerOn}
                  isMotorRunning={isMotorRunning}
                  klixonTripped={klixonTripped}
                  onStartBridge={handleStartBridge}
                  onEndBridge={handleEndBridge}
                  onClick={handleClickBridge}
                  compact={false}
                  showTerminals={true}
                />
              </div>

              {/* Direct interactive tactile bar */}
              <button
                type="button"
                disabled={!powerOn || klixonTripped || (isMotorRunning && !isBridging)}
                onClick={handleClickBridge}
                onMouseDown={handleStartBridge}
                onMouseUp={handleEndBridge}
                onMouseLeave={handleEndBridge}
                onTouchStart={handleStartBridge}
                onTouchEnd={handleEndBridge}
                title={
                  isMotorRunning
                    ? 'Compresor en marcha normal. El pulsador queda inactivo. Para parar el motor, desconecta la red eléctrica (230V OFF).'
                    : undefined
                }
                className={`w-full py-2.5 px-3 rounded-xl font-mono text-tiny font-extrabold transition-all select-none shadow-md flex items-center justify-center gap-2 ${
                  !powerOn || klixonTripped
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                    : isBridging
                    ? 'bg-blue-600 text-white scale-[0.98] shadow-inner ring-4 ring-blue-500/40 cursor-pointer'
                    : isMotorRunning
                    ? 'bg-emerald-600/85 text-white border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-not-allowed opacity-90'
                    : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 cursor-pointer'
                }`}
              >
                <Zap className={`w-4 h-4 ${isBridging ? 'fill-current animate-bounce' : ''}`} />
                <span>
                  {isBridging
                    ? isMotorRunning
                      ? '⚡ ¡MOTOR ARRANCADO! SUELTA EL PULSADOR'
                      : '¡PULSADO! INICIANDO ROTOR...'
                    : isMotorRunning
                    ? 'COMPRESOR EN MARCHA • RÉGIMEN NORMAL (2.850 RPM)'
                    : '⚡ MANTÉN PULSADO 0.3s PARA ARRANCAR'}
                </span>
              </button>

              {isMotorRunning && powerOn && !klixonTripped && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono flex items-center justify-between text-slate-300">
                  <span className="text-emerald-400 font-semibold">Pulsador inactivo tras arranque</span>
                  <span className="text-slate-400 text-[10px]">Parada: pulsa <strong>DESCONECTAR</strong></span>
                </div>
              )}

              {bridgeDurationMs > 2500 && (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>¡ADVERTENCIA! Suelta el pulsador; mantenerlo prolongadamente recalienta la bobina auxiliar.</span>
                </div>
              )}
            </div>

            {/* MECHANICAL FAULT TOGGLE (FREE VS SEIZED / GRIPADO) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-tiny font-bold text-slate-800 dark:text-slate-200 block">
                  Estado Mecánico del Compresor:
                </span>
                <span className="text-[10px] text-slate-500">
                  {isSeizedMotor ? 'Pistón/Biela clavado mecánicamente' : 'Mecánica libre y lubricada'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSeizedMotor(!isSeizedMotor);
                  setIsMotorRunning(false);
                }}
                className={`px-2.5 py-1 rounded text-tiny font-mono font-bold transition-all cursor-pointer ${
                  isSeizedMotor
                    ? 'bg-rose-600/20 text-rose-500 border border-rose-500'
                    : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                }`}
              >
                {isSeizedMotor ? 'MECÁNICA CLAVADA' : 'MECÁNICA SANA'}
              </button>
            </div>
          </div>

          {/* DIAGNOSTIC VERDICT CARD */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 flex-1 flex flex-col justify-between">
            <span className="text-tiny font-mono font-bold text-slate-500 uppercase tracking-wider">
              2. Veredicto Técnico de la Prueba
            </span>

            <div className="space-y-2">
              {klixonTripped ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-1">
                  <div className="font-bold text-small flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Klixon Abierto por Sobrecarga Térmica</span>
                  </div>
                  <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                    El protector térmico se abrió al soportar la corriente de rotor bloqueado (<strong className="font-mono">{currentAmps.toFixed(1)} A</strong>) durante más de 4 segundos. El compresor está <strong>clavado mecánicamente</strong> o no recibió el impulso de arranque.
                  </p>
                </div>
              ) : isMotorRunning ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-1">
                  <div className="font-bold text-small flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Compresor Sano: Arranca Directo</span>
                  </div>
                  <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                    El motor venció la inercia, alcanzó velocidad nominal (~2.850 RPM) y la corriente cayó al valor nominal <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentAmps.toFixed(1)} A (FLA)</strong>.
                  </p>
                  <div className="pt-1.5 border-t border-emerald-500/20 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    💡 Diagnóstico: El compresor está en perfecto estado. Si no arrancaba en el equipo, sustituye el relé amperimétrico o el termistor PTC.
                  </div>
                </div>
              ) : powerOn ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-1">
                  <div className="font-bold text-small flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>En Espera de Impulso de Arranque</span>
                  </div>
                  <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                    Tensión presente. El motor monofásico no tiene par de arranque propio y zumba a 50Hz absorbiendo <strong className="font-mono text-amber-600 dark:text-amber-400">{currentAmps.toFixed(1)} A</strong>. Presiona el botón de puente para darle el impulso magnético.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-tiny leading-relaxed">
                  Pulsa <strong>«ENERGIZAR (230V)»</strong> para suministrar corriente y luego mantén presionado el botón de puente <strong className="text-blue-500">R ⟷ S</strong> al menos 0.3 segundos para arrancar el compresor.
                </div>
              )}
            </div>

            {/* Quick Link to Schematics */}
            {onNavigateToWiring && (
              <button
                type="button"
                onClick={onNavigateToWiring}
                className="w-full mt-2 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-900 text-tiny font-bold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ver Esquemas Oficiales de Relé y Condensador</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalle de Protector Térmico Klixon */}
      <KlixonModal
        isOpen={isKlixonModalOpen}
        onClose={() => setIsKlixonModalOpen(false)}
      />
    </div>
  );
};
