import React, { useState, useEffect } from 'react';
import {
  Play,
  AlertTriangle,
  RefreshCw,
  Zap,
  Maximize2,
  Sparkles,
  Info,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Gauge,
  Layers,
  Cpu,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { playFaultAcousticSound, startCompressorHum, stopCompressorHum } from '../utils/audio';

export type PotentialRelayCircuitType = 'CSIR_POTENTIAL' | 'CSR_POTENTIAL';

interface PotentialRelaySchematicSheetProps {
  onOpenModal?: (variant: 'CSIR_POTENTIAL' | 'CSR_POTENTIAL') => void;
}

export const PotentialRelaySchematicSheet: React.FC<PotentialRelaySchematicSheetProps> = () => {
  const [circuitType, setCircuitType] = useState<'both' | 'CSIR_POTENTIAL' | 'CSR_POTENTIAL'>('both');
  const [simState, setSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [selectedPinInfo, setSelectedPinInfo] = useState<string | null>(null);
  const [fcemVoltage, setFcemVoltage] = useState<number>(0);
  const [lineAmps, setLineAmps] = useState<number>(0);

  // Sound and simulation step timing
  useEffect(() => {
    let timer1: NodeJS.Timeout | null = null;

    if (simState === 'starting') {
      setFcemVoltage(110);
      setLineAmps(16.8);
      startCompressorHum(0.35);

      timer1 = setTimeout(() => {
        // After 1.4 seconds, motor reaches 75% speed -> f.c.e.m. jumps over pick-up voltage (~340V)
        setFcemVoltage(385);
        setLineAmps(3.8);
        setSimState('running');
      }, 1400);
    } else if (simState === 'running') {
      setFcemVoltage(395);
      setLineAmps(3.2);
    } else if (simState === 'overload') {
      stopCompressorHum();
      playFaultAcousticSound('open_klixon');
      setFcemVoltage(0);
      setLineAmps(0);
    } else {
      stopCompressorHum();
      setFcemVoltage(0);
      setLineAmps(0);
    }

    return () => {
      if (timer1) clearTimeout(timer1);
    };
  }, [simState]);

  const handleStart = () => {
    setSimState('starting');
  };

  const handleOverload = () => {
    setSimState('overload');
  };

  const handleReset = () => {
    setSimState('idle');
  };

  // Pin reference documentation for Mars/GE/Supco standard potential relays
  const PIN_DETAILS: Record<string, { name: string; standard: string; connection: string; role: string }> = {
    '5': {
      name: 'Borne 5 (Bobina voltimétrica - Lado Común)',
      standard: 'Conexión a Línea C1 y Borne Común (C)',
      connection: 'Conectado a la fase de entrada C1 y al borne C del compresor (a través del Klixon).',
      role: 'Punto de referencia común de la bobina del relé. La bobina voltimétrica queda en serie entre 5 y 2, midiendo la tensión que se genera en el bobinado auxiliar S.',
    },
    '2': {
      name: 'Borne 2 (Bobina voltimétrica - Lado Devanado Auxiliar)',
      standard: 'Conexión a Borne S (Arranque) y Contacto NC',
      connection: 'Conectado directamente al borne S del compresor y al contacto interno del relé.',
      role: 'Recibe la fuerza contraelectromotriz (f.c.e.m.) generada por la bobina de arranque cuando el rotor gira. En CSR, también recibe la salida del condensador de marcha permanente.',
    },
    '1': {
      name: 'Borne 1 (Contacto Normalmente Cerrado - Salida a Condensador de Arranque)',
      standard: 'Conexión exclusiva al Condensador de Arranque',
      connection: 'Conectado a un extremo del condensador electrolítico de arranque.',
      role: 'El contacto normalmente cerrado (NC) se encuentra entre los bornes 1 y 2. En reposo y arranque conduce. Al activarse la bobina 5-2, el contacto se abre y aísla el borne 1.',
    },
    '4': {
      name: 'Borne 4 (Borne Ciego / Neutro de Conexión y Condensadores)',
      standard: 'Entrada C2, Marcha (R) y Condensadores',
      connection: 'Conectado a la línea de alimentación C2, al borne R de marcha y al otro extremo de los condensadores.',
      role: 'Actúa como punto de empalme o puente sin conexión eléctrica interna a la bobina del relé. Es el punto común de alimentación de los condensadores.',
    },
    '6': {
      name: 'Borne 6 (Borne Auxiliar / Ciego)',
      standard: 'Sin conexión eléctrica interna (Libre)',
      connection: 'Libre o utilizado por técnicos como regleta de unión auxiliar para resistencias de descarga.',
      role: 'Terminal ficticio de soporte mecánico en el chasis del relé. No interviene eléctricamente en el funcionamiento interno.',
    },
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* 1. TOP SIMULATION & CONTROLS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-tiny font-mono font-bold text-purple-600 dark:text-purple-400 uppercase flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            Simulación Relé de Potencial:
          </span>

          <button
            type="button"
            onClick={handleStart}
            disabled={simState === 'starting'}
            className="px-3 py-1 rounded text-tiny font-bold bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{simState === 'starting' ? 'Arrancando...' : 'Arrancar'}</span>
          </button>

          <button
            type="button"
            onClick={handleOverload}
            className="px-2.5 py-1 rounded text-tiny font-bold bg-rose-600/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-600/25 transition-colors flex items-center gap-1 cursor-pointer"
            title="Disparo térmico del Klixon en serie con el borne Común (C)"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Corte Klixon</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Restablecer circuito a reposo"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Live Gauges: FCEM & Line Status */}
        <div className="flex items-center gap-3 flex-wrap text-tiny font-mono">
          {/* FCEM Gauge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
            <Gauge className="w-3.5 h-3.5 text-purple-500" />
            <span>
              f.c.e.m. (Bornes 5-2):{' '}
              <strong className="text-purple-600 dark:text-purple-300 font-bold">
                {fcemVoltage} V
              </strong>
            </span>
          </div>

          {/* Contact 1-2 state */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <span>Contacto 1-2 (NC):</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                simState === 'running'
                  ? 'bg-rose-500 text-white'
                  : simState === 'starting'
                  ? 'bg-amber-400 text-black animate-pulse'
                  : simState === 'overload'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {simState === 'running' ? 'ABIERTO (Despegue)' : 'CERRADO (NC)'}
            </span>
          </div>

          {/* Motor Line Status */}
          <div
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
              simState === 'idle'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : simState === 'starting'
                ? 'bg-amber-400 text-black animate-pulse'
                : simState === 'running'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {simState === 'idle' && '⚪ REPOSO'}
            {simState === 'starting' && '⚡ ARRANQUE (PICO)'}
            {simState === 'running' && '🟢 MARCHA NOMINAL'}
            {simState === 'overload' && '🔴 KLIXON ABIERTO'}
          </div>
        </div>
      </div>

      {/* 2. CIRCUIT SELECTOR TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 text-tiny font-mono">
          <button
            type="button"
            onClick={() => setCircuitType('both')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              circuitType === 'both'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            Ver Ambos Esquemas (Comparativa)
          </button>
          <button
            type="button"
            onClick={() => setCircuitType('CSIR_POTENTIAL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              circuitType === 'CSIR_POTENTIAL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            1. CSIR con Relé de Potencial
          </button>
          <button
            type="button"
            onClick={() => setCircuitType('CSR_POTENTIAL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              circuitType === 'CSR_POTENTIAL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            2. CSR con Relé de Potencial (Doble Cond.)
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1 font-mono">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          <span>Haz clic en los bornes (5, 2, 1, 4, 6) para ver su función técnica</span>
        </div>
      </div>

      {/* 3. PIN INFO BANNER IF CLICKED */}
      {selectedPinInfo && PIN_DETAILS[selectedPinInfo] && (
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-start justify-between gap-3 text-xs text-purple-100 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center font-mono">
                {selectedPinInfo}
              </span>
              <strong className="text-sm font-bold text-white">
                {PIN_DETAILS[selectedPinInfo].name}
              </strong>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                {PIN_DETAILS[selectedPinInfo].standard}
              </span>
            </div>
            <p className="text-[11px] text-purple-200">
              <strong>Conexión:</strong> {PIN_DETAILS[selectedPinInfo].connection}
            </p>
            <p className="text-[11px] text-purple-300/90">
              <strong>Función técnica:</strong> {PIN_DETAILS[selectedPinInfo].role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPinInfo(null)}
            className="text-purple-300 hover:text-white font-bold text-xs px-2 py-1 rounded bg-purple-900/50 hover:bg-purple-800 cursor-pointer"
          >
            Cerrar ✕
          </button>
        </div>
      )}

      {/* 4. MAIN SCHEMATIC CONTAINER */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* ESQUEMA 1: CSIR CON RELÉ DE POTENCIAL (SUPERIOR DE LA IMAGEN)             */}
        {/* ========================================================================= */}
        {(circuitType === 'both' || circuitType === 'CSIR_POTENTIAL') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070b13] border-2 border-purple-500/40 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    1. CSIR con Relé de Potencial (Capacitor Start - Induction Run)
                  </h3>
                  <span className="text-tiny font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                    Solo Condensador de Arranque
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Esquema superior de la imagen: Desconexión por apertura del contacto normalmente cerrado (1-2) al elevarse la f.c.e.m. en la bobina (5-2).
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Aplicación: Compresores comerciales con TXV sin condensador permanente</span>
              </div>
            </div>

            {/* SVG RENDERING OF DIAGRAM 1 */}
            <div className="bg-slate-50/50 dark:bg-[#050811] rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800/80 overflow-x-auto">
              <PotentialRelaySvgDiagram
                variant="CSIR"
                simState={simState}
                fcemVoltage={fcemVoltage}
                onSelectPin={(pin) => setSelectedPinInfo(pin)}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ESQUEMA 2: CSR CON RELÉ DE POTENCIAL (INFERIOR DE LA IMAGEN)              */}
        {/* ========================================================================= */}
        {(circuitType === 'both' || circuitType === 'CSR_POTENTIAL') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070b13] border-2 border-purple-500/60 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    2. CSR con Relé de Potencial (Capacitor Start and Run)
                  </h3>
                  <span className="text-tiny font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    Doble Condensador: Arranque + Marcha
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Esquema inferior de la imagen: Incorpora condensador de marcha permanente conectado entre el borne 4 (C2/R) y el borne 2 (S).
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Aplicación: Climatización y refrigeración comercial de alta potencia y máxima eficiencia</span>
              </div>
            </div>

            {/* SVG RENDERING OF DIAGRAM 2 */}
            <div className="bg-slate-50/50 dark:bg-[#050811] rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800/80 overflow-x-auto">
              <PotentialRelaySvgDiagram
                variant="CSR"
                simState={simState}
                fcemVoltage={fcemVoltage}
                onSelectPin={(pin) => setSelectedPinInfo(pin)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. TECHNICAL SUMMARY CARDS & OPERATING PRINCIPLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Card 1: Por qué se abren los contactos (f.c.e.m.) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
            <Radio className="w-4 h-4" />
            <span>Fuerza Contraelectromotriz (f.c.e.m.)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            La bobina del relé está conectada entre los bornes <strong>5</strong> (Común) y <strong>2</strong> (Arranque S). Al acelerar el rotor, el devanado auxiliar corta las líneas del campo magnético y actúa como generador, induciendo un voltaje que puede superar los <strong>350V a 420V AC</strong>.
          </p>
          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-700 dark:text-purple-300 font-mono">
            Tensión de Despegue (Pick-up): ~260V – 400V AC
          </div>
        </div>

        {/* Card 2: Contacto 1-2 Normalmente Cerrado */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <Zap className="w-4 h-4" />
            <span>Contacto 1-2 Normalmente Cerrado (NC)</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            A diferencia de los relés de intensidad (que tienen contacto normalmente abierto NA), el relé de potencial tiene contacto <strong>Normalmente Cerrado (NC)</strong>. En reposo y al arrancar, el condensador de arranque siempre está conectado. Al activarse la bobina voltimétrica, el contacto se abre y lo desconecta.
          </p>
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 font-mono">
            Comprobación: 0 Ω entre 1 y 2 en frío/reposo
          </div>
        </div>

        {/* Card 3: Diferencia clave CSIR vs CSR con relé de potencial */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <Layers className="w-4 h-4" />
            <span>CSIR vs CSR: El Condensador de Marcha</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
            En <strong>CSIR</strong>, al abrir el contacto 1-2 la bobina auxiliar S queda inactiva. En <strong>CSR</strong>, el condensador de marcha está conectado en paralelo permanentemente entre el borne 4 (C2) y el borne 2 (S), manteniendo el devanado auxiliar en servicio continuo con un cos φ ≈ 0.98.
          </p>
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
            CSR = C. Arranque (1-4) + C. Marcha permanente (2-4)
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* SVG VECTORIAL INTERACTIVO QUE REPLICA EXACTAMENTE EL ESQUEMA DE LA IMAGEN */
/* ========================================================================= */

interface PotentialRelaySvgDiagramProps {
  variant: 'CSIR' | 'CSR';
  simState: 'idle' | 'starting' | 'running' | 'overload';
  fcemVoltage: number;
  onSelectPin: (pin: string) => void;
}

const PotentialRelaySvgDiagram: React.FC<PotentialRelaySvgDiagramProps> = ({
  variant,
  simState,
  fcemVoltage,
  onSelectPin,
}) => {
  const isStarting = simState === 'starting';
  const isRunning = simState === 'running';
  const isOverload = simState === 'overload';
  const isActive = isStarting || isRunning;

  // Contact 1-2 status: Closed at idle and starting, OPEN at running (when f.c.e.m. excites coil)
  const isContact12Open = isRunning;
  const isCoilEnergized = isRunning; // Energized by f.c.e.m.

  // Dynamic wire colors
  const activeColorL1 = isOverload ? '#64748b' : isActive ? '#38bdf8' : '#64748b'; // Cyan/Blue for C1
  const activeColorL2 = isOverload ? '#64748b' : isActive ? '#10b981' : '#64748b'; // Emerald for C2/R
  const startBranchColor = isOverload
    ? '#64748b'
    : isStarting
    ? '#f59e0b'
    : isRunning
    ? '#475569'
    : '#64748b'; // Amber during start, dim gray when open
  const runCapBranchColor = isOverload
    ? '#64748b'
    : isStarting
    ? '#0284c7'
    : isRunning
    ? '#06b6d4'
    : '#64748b'; // Cyan for run capacitor
  const coilColor = isCoilEnergized ? '#a855f7' : isStarting ? '#c084fc' : '#64748b'; // Purple when sensing f.c.e.m.

  return (
    <div className="w-full flex justify-center py-2">
      <svg
        viewBox="0 0 740 440"
        className="w-full max-w-[720px] h-auto select-none"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
      >
        <defs>
          {/* Subtle grid background */}
          <pattern id="pr-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(148, 163, 184, 0.05)"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Glow filter for energized elements */}
          <filter id="glow-coil" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="740" height="440" fill="url(#pr-grid)" rx="12" />

        {/* ========================================================================= */}
        {/* 1. TERMINALES DE ALIMENTACIÓN DE ENTRADA: C1 Y C2 (LADO IZQUIERDO)         */}
        {/* ========================================================================= */}
        {/* Borne C1 */}
        <g id="line-c1" className="cursor-pointer">
          <rect
            x="20"
            y="70"
            width="42"
            height="30"
            rx="4"
            fill="#0f172a"
            stroke={activeColorL1}
            strokeWidth="2"
          />
          <text
            x="41"
            y="91"
            fontSize="15"
            fontWeight="bold"
            fontFamily="monospace"
            fill="#ffffff"
            textAnchor="middle"
          >
            C1
          </text>
        </g>

        {/* Borne C2 */}
        <g id="line-c2" className="cursor-pointer">
          <rect
            x="20"
            y="190"
            width="42"
            height="30"
            rx="4"
            fill="#0f172a"
            stroke={activeColorL2}
            strokeWidth="2"
          />
          <text
            x="41"
            y="211"
            fontSize="15"
            fontWeight="bold"
            fontFamily="monospace"
            fill="#ffffff"
            textAnchor="middle"
          >
            C2
          </text>
        </g>

        {/* ========================================================================= */}
        {/* 2. CAJA DEL RELÉ DE POTENCIAL (Con terminales circulares 5, 2, 4, 1, 6)   */}
        {/* ========================================================================= */}
        <g id="potential-relay-box">
          {/* Main Box outline */}
          <rect
            x="140"
            y="50"
            width="145"
            height="185"
            rx="8"
            fill="#090d16"
            stroke={isCoilEnergized ? '#a855f7' : '#334155'}
            strokeWidth="2"
            strokeDasharray={isCoilEnergized ? 'none' : 'none'}
          />
          <text
            x="212"
            y="42"
            fontSize="11"
            fontWeight="bold"
            fill="#94a3b8"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            RELÉ DE POTENCIAL
          </text>

          {/* Borne (5) - Arriba Izquierda */}
          <g
            onClick={() => onSelectPin('5')}
            className="cursor-pointer group"
          >
            <title>Borne 5: Bobina voltimétrica (Línea C1 y Común C)</title>
            <circle
              cx="170"
              cy="85"
              r="14"
              fill="#1e293b"
              stroke={activeColorL1}
              strokeWidth="2"
              className="group-hover:stroke-purple-400 group-hover:scale-105 transition-all"
            />
            <text
              x="170"
              y="90"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#ffffff"
              textAnchor="middle"
            >
              5
            </text>
          </g>

          {/* Borne (2) - Arriba Derecha */}
          <g
            onClick={() => onSelectPin('2')}
            className="cursor-pointer group"
          >
            <title>Borne 2: Bobina voltimétrica y Contacto NC (hacia S)</title>
            <circle
              cx="255"
              cy="85"
              r="14"
              fill="#1e293b"
              stroke={coilColor}
              strokeWidth="2"
              className="group-hover:stroke-purple-400 group-hover:scale-105 transition-all"
            />
            <text
              x="255"
              y="90"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#ffffff"
              textAnchor="middle"
            >
              2
            </text>
          </g>

          {/* Borne (4) - Abajo Izquierda */}
          <g
            onClick={() => onSelectPin('4')}
            className="cursor-pointer group"
          >
            <title>Borne 4: Punto neutro de condensadores y Línea C2 (hacia R)</title>
            <circle
              cx="170"
              cy="205"
              r="14"
              fill="#1e293b"
              stroke={activeColorL2}
              strokeWidth="2"
              className="group-hover:stroke-purple-400 group-hover:scale-105 transition-all"
            />
            <text
              x="170"
              y="210"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#ffffff"
              textAnchor="middle"
            >
              4
            </text>
          </g>

          {/* Borne (1) - Abajo Derecha */}
          <g
            onClick={() => onSelectPin('1')}
            className="cursor-pointer group"
          >
            <title>Borne 1: Contacto Normalmente Cerrado (NC) a Condensador de Arranque</title>
            <circle
              cx="255"
              cy="205"
              r="14"
              fill="#1e293b"
              stroke={startBranchColor}
              strokeWidth="2"
              className="group-hover:stroke-purple-400 group-hover:scale-105 transition-all"
            />
            <text
              x="255"
              y="210"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#ffffff"
              textAnchor="middle"
            >
              1
            </text>
          </g>

          {/* Borne (6) - Centro (Borne ciego / no conectado) */}
          <g
            onClick={() => onSelectPin('6')}
            className="cursor-pointer group opacity-80 hover:opacity-100"
          >
            <title>Borne 6: Borne auxiliar / ciego (sin conexión interna)</title>
            <circle
              cx="212"
              cy="145"
              r="12"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="1.5"
              className="group-hover:stroke-slate-300 transition-all"
            />
            <text
              x="212"
              y="149.5"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
              textAnchor="middle"
            >
              6
            </text>
          </g>

          {/* Bobina del relé entre Borne (5) y Borne (2) */}
          <g id="potential-coil" filter={isCoilEnergized ? 'url(#glow-coil)' : undefined}>
            <line x1="184" y1="85" x2="192" y2="85" stroke={coilColor} strokeWidth="2.5" />
            {/* Coil loops */}
            <path
              d="M 192 85 Q 197 73 202 85 Q 207 73 212 85 Q 217 73 222 85 Q 227 73 232 85 Q 237 73 241 85"
              fill="none"
              stroke={coilColor}
              strokeWidth="2.5"
            />
            <line x1="241" y1="85" x2="241" y2="85" stroke={coilColor} strokeWidth="2.5" />
            <text
              x="212"
              y="104"
              fontSize="8.5"
              fill={isCoilEnergized ? '#e9d5ff' : '#94a3b8'}
              textAnchor="middle"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              {isCoilEnergized ? 'Bobina EXCITADA' : 'Bobina voltimétrica'}
            </text>
          </g>

          {/* Contacto Normalmente Cerrado (NC) entre Borne (2) y Borne (1) */}
          <g id="contact-1-2">
            {/* Wire from pin 2 down toward contact */}
            <line x1="255" y1="99" x2="255" y2="125" stroke={coilColor} strokeWidth="2" />

            {/* Contact NC Symbol */}
            {isContact12Open ? (
              /* Contact OPEN (Motor reached speed, coil pulled contact open) */
              <g id="contact-open">
                {/* Fixed upper plate */}
                <line x1="247" y1="128" x2="263" y2="128" stroke="#ef4444" strokeWidth="2.5" />
                {/* Moving contact tilted OPEN */}
                <line
                  x1="245"
                  y1="138"
                  x2="265"
                  y2="150"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Diagonal NC bar open */}
                <line
                  x1="244"
                  y1="124"
                  x2="266"
                  y2="152"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
                <text
                  x="280"
                  y="142"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#ef4444"
                  fontFamily="monospace"
                >
                  ABIERTO
                </text>
              </g>
            ) : (
              /* Contact CLOSED (NC - at rest and during initial startup) */
              <g id="contact-closed">
                {/* Upper plate */}
                <line
                  x1="246"
                  y1="132"
                  x2="264"
                  y2="132"
                  stroke={isStarting ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="2.5"
                />
                {/* Lower plate */}
                <line
                  x1="246"
                  y1="140"
                  x2="264"
                  y2="140"
                  stroke={isStarting ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="2.5"
                />
                {/* Diagonal slash for NC contact */}
                <line
                  x1="243"
                  y1="145"
                  x2="267"
                  y2="127"
                  stroke={isStarting ? '#f59e0b' : '#94a3b8'}
                  strokeWidth="1.8"
                />
                <text
                  x="280"
                  y="140"
                  fontSize="8"
                  fontWeight="bold"
                  fill={isStarting ? '#f59e0b' : '#94a3b8'}
                  fontFamily="monospace"
                >
                  CERRADO (NC)
                </text>
              </g>
            )}

            {/* Wire from contact down to pin 1 */}
            <line
              x1="255"
              y1="145"
              x2="255"
              y2="191"
              stroke={startBranchColor}
              strokeWidth="2"
            />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 3. CONDENSADOR DE ARRANQUE (Debajo del relé, entre borne 4 y 1)           */}
        {/* ========================================================================= */}
        <g id="start-capacitor">
          {/* Wire from pin 4 down to start capacitor */}
          <line x1="170" y1="219" x2="170" y2="265" stroke={activeColorL2} strokeWidth="2.2" />
          <line x1="170" y1="265" x2="204" y2="265" stroke={activeColorL2} strokeWidth="2.2" />

          {/* Wire from pin 1 down to start capacitor */}
          <line x1="255" y1="219" x2="255" y2="265" stroke={startBranchColor} strokeWidth="2.2" />
          <line x1="255" y1="265" x2="222" y2="265" stroke={startBranchColor} strokeWidth="2.2" />

          {/* Capacitor Plates (Arranque) */}
          <line
            x1="204"
            y1="253"
            x2="204"
            y2="277"
            stroke={activeColorL2}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="222"
            y1="253"
            x2="222"
            y2="277"
            stroke={startBranchColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Label for Start Capacitor */}
          <text
            x="213"
            y="295"
            fontSize="10.5"
            fontWeight="bold"
            fill={isStarting ? '#f59e0b' : '#94a3b8'}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            {variant === 'CSR' ? 'Cond. arranque' : 'Condensador de arranque'}
          </text>
          <text
            x="213"
            y="308"
            fontSize="8"
            fontFamily="monospace"
            fill="#64748b"
            textAnchor="middle"
          >
            {isStarting ? '⚡ Activo (60-120 µF)' : 'Electrolítico (Desconectado en marcha)'}
          </text>
        </g>

        {/* ========================================================================= */}
        {/* 4. CONDENSADOR DE MARCHA (SOLO EN VARIANTE CSR)                           */}
        {/* ========================================================================= */}
        {variant === 'CSR' && (
          <g id="run-capacitor">
            {/* Node on pin 4 wire going down to run capacitor */}
            <circle cx="170" cy="265" r="3.5" fill={activeColorL2} />
            <line x1="170" y1="265" x2="170" y2="335" stroke={activeColorL2} strokeWidth="2.2" />
            <line x1="170" y1="335" x2="204" y2="335" stroke={activeColorL2} strokeWidth="2.2" />

            {/* Run Capacitor Plates */}
            <line
              x1="204"
              y1="323"
              x2="204"
              y2="347"
              stroke={activeColorL2}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1="222"
              y1="323"
              x2="222"
              y2="347"
              stroke={runCapBranchColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Wire from right plate of run capacitor going up to join S line (borne 2) */}
            <line x1="222" y1="335" x2="350" y2="335" stroke={runCapBranchColor} strokeWidth="2.2" />
            <line x1="350" y1="335" x2="350" y2="105" stroke={runCapBranchColor} strokeWidth="2.2" />
            <line x1="350" y1="105" x2="360" y2="105" stroke={runCapBranchColor} strokeWidth="2.2" />
            <circle cx="360" cy="105" r="3.5" fill={runCapBranchColor} />

            {/* Label for Run Capacitor */}
            <text
              x="213"
              y="363"
              fontSize="10.5"
              fontWeight="bold"
              fill={isRunning ? '#38bdf8' : '#94a3b8'}
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Cond. marcha
            </text>
            <text
              x="213"
              y="376"
              fontSize="8"
              fontFamily="monospace"
              fill="#0284c7"
              textAnchor="middle"
            >
              {isRunning ? '🟢 En servicio continuo (15-35 µF)' : 'Polipropileno 450V'}
            </text>
          </g>
        )}

        {/* ========================================================================= */}
        {/* 5. CABLEADO DE ALIMENTACIÓN Y CONEXIONES AL MOTOR                          */}
        {/* ========================================================================= */}
        {/* Wire C1 -> Pin 5 */}
        <line x1="62" y1="85" x2="156" y2="85" stroke={activeColorL1} strokeWidth="2.4" />

        {/* Wire from C1/Pin 5 to Terminal C of Motor */}
        <circle cx="100" cy="85" r="3.5" fill={activeColorL1} />
        <line x1="100" y1="85" x2="100" y2="60" stroke={activeColorL1} strokeWidth="2.4" />
        <line x1="100" y1="60" x2="415" y2="60" stroke={activeColorL1} strokeWidth="2.4" />

        {/* Wire C2 -> Pin 4 */}
        <line x1="62" y1="205" x2="156" y2="205" stroke={activeColorL2} strokeWidth="2.4" />

        {/* Wire from C2/Pin 4 down and right straight to Terminal R of Motor */}
        <circle cx="78" cy="205" r="3.5" fill={activeColorL2} />
        <line x1="78" y1="205" x2="78" y2="400" stroke={activeColorL2} strokeWidth="2.4" />
        <line x1="78" y1="400" x2="415" y2="400" stroke={activeColorL2} strokeWidth="2.4" />

        {/* Wire from Pin 2 of relay to Terminal S of Motor */}
        <line x1="269" y1="85" x2="360" y2="85" stroke={coilColor} strokeWidth="2.4" />
        <line x1="360" y1="85" x2="360" y2="195" stroke={coilColor} strokeWidth="2.4" />
        <line x1="360" y1="195" x2="415" y2="195" stroke={coilColor} strokeWidth="2.4" />

        {/* ========================================================================= */}
        {/* 6. BORNES DEL MOTOR: C, S, R                                              */}
        {/* ========================================================================= */}
        {/* Borne C */}
        <g id="motor-terminal-c">
          <circle
            cx="420"
            cy="60"
            r="8"
            fill="#0f172a"
            stroke={isOverload ? '#ef4444' : activeColorL1}
            strokeWidth="2"
          />
          <text
            x="403"
            y="64"
            fontSize="14"
            fontWeight="bold"
            fontFamily="monospace"
            fill="#ffffff"
          >
            C
          </text>
        </g>

        {/* Borne S */}
        <g id="motor-terminal-s">
          <circle
            cx="420"
            cy="195"
            r="8"
            fill="#0f172a"
            stroke={coilColor}
            strokeWidth="2"
          />
          <text
            x="403"
            y="199"
            fontSize="14"
            fontWeight="bold"
            fontFamily="monospace"
            fill="#ffffff"
          >
            S
          </text>
        </g>

        {/* Borne R */}
        <g id="motor-terminal-r">
          <circle
            cx="420"
            cy="400"
            r="8"
            fill="#0f172a"
            stroke={activeColorL2}
            strokeWidth="2"
          />
          <text
            x="403"
            y="404"
            fontSize="14"
            fontWeight="bold"
            fontFamily="monospace"
            fill="#ffffff"
          >
            R
          </text>
        </g>

        {/* ========================================================================= */}
        {/* 7. PROTECTOR DE MOTOR (KLIXON OVALADO EN BORNE C)                         */}
        {/* ========================================================================= */}
        <g id="motor-protector-klixon">
          <line
            x1="428"
            y1="60"
            x2="455"
            y2="60"
            stroke={isOverload ? '#ef4444' : activeColorL1}
            strokeWidth="2.2"
          />

          {/* Oval Capsule of Motor Protector (Klixon) */}
          <rect
            x="455"
            y="47"
            width="60"
            height="26"
            rx="13"
            fill={isOverload ? 'rgba(239, 68, 68, 0.2)' : '#0f172a'}
            stroke={isOverload ? '#ef4444' : '#eab308'}
            strokeWidth="2"
          />

          {/* Bimetal element inside */}
          {isOverload ? (
            /* Open bimetal contact */
            <g>
              <circle cx="470" cy="60" r="2.5" fill="#ef4444" />
              <circle cx="500" cy="60" r="2.5" fill="#ef4444" />
              <path
                d="M 470 60 Q 485 48 497 53"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            </g>
          ) : (
            /* Closed bimetal contact */
            <g>
              <circle cx="470" cy="60" r="2.5" fill="#eab308" />
              <circle cx="500" cy="60" r="2.5" fill="#eab308" />
              <path
                d="M 470 60 Q 485 55 500 60"
                fill="none"
                stroke={isActive ? '#38bdf8' : '#eab308'}
                strokeWidth="2"
              />
            </g>
          )}

          {/* Label "Protector de motor" */}
          <text
            x="485"
            y="37"
            fontSize="10.5"
            fontWeight="bold"
            fill={isOverload ? '#ef4444' : '#facc15'}
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Protector de motor
          </text>
          {isOverload && (
            <text
              x="485"
              y="22"
              fontSize="9"
              fontWeight="bold"
              fill="#ef4444"
              textAnchor="middle"
              fontFamily="monospace"
            >
              ⚠ DISPARADO
            </text>
          )}

          {/* Wire from Klixon to common node of motor coils */}
          <line
            x1="515"
            y1="60"
            x2="560"
            y2="60"
            stroke={isOverload ? '#64748b' : activeColorL1}
            strokeWidth="2.2"
          />
        </g>

        {/* ========================================================================= */}
        {/* 8. BOBINAS DEL MOTOR: BOBINA DE ARRANQUE Y BOBINA DE MARCHA                */}
        {/* ========================================================================= */}
        {/* Node uniting both coils at top */}
        <circle cx="560" cy="60" r="3.5" fill={isOverload ? '#64748b' : activeColorL1} />

        {/* Lead going down into Bobina de arranque */}
        <line
          x1="560"
          y1="60"
          x2="560"
          y2="90"
          stroke={isOverload ? '#64748b' : activeColorL1}
          strokeWidth="2"
        />

        {/* Lead going right into Bobina de marcha */}
        <line
          x1="560"
          y1="60"
          x2="660"
          y2="60"
          stroke={isOverload ? '#64748b' : activeColorL1}
          strokeWidth="2"
        />
        <line
          x1="660"
          y1="60"
          x2="660"
          y2="90"
          stroke={isOverload ? '#64748b' : activeColorL1}
          strokeWidth="2"
        />

        {/* --- BOBINA DE ARRANQUE (DEV. AUXILIAR) --- */}
        <g id="bobina-de-arranque">
          <path
            d="M 560 90
               Q 546 99 560 108
               Q 546 117 560 126
               Q 546 135 560 144
               Q 546 153 560 162
               Q 546 171 560 180"
            fill="none"
            stroke={
              isOverload
                ? '#64748b'
                : isStarting
                ? '#f59e0b'
                : isRunning
                ? variant === 'CSR'
                  ? '#06b6d4'
                  : '#a855f7'
                : '#64748b'
            }
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Connection from bottom of Bobina de Arranque to Terminal S */}
          <line
            x1="560"
            y1="180"
            x2="560"
            y2="195"
            stroke={coilColor}
            strokeWidth="2.2"
          />
          <line
            x1="560"
            y1="195"
            x2="428"
            y2="195"
            stroke={coilColor}
            strokeWidth="2.2"
          />

          {/* Label "Bobina de arranque" */}
          <text
            x="540"
            y="135"
            fontSize="11"
            fontWeight="bold"
            fill={isStarting ? '#f59e0b' : '#cbd5e1'}
            textAnchor="end"
            fontFamily="sans-serif"
          >
            Bobina de
          </text>
          <text
            x="540"
            y="150"
            fontSize="11"
            fontWeight="bold"
            fill={isStarting ? '#f59e0b' : '#cbd5e1'}
            textAnchor="end"
            fontFamily="sans-serif"
          >
            arranque
          </text>
        </g>

        {/* --- BOBINA DE MARCHA (DEV. PRINCIPAL) --- */}
        <g id="bobina-de-marcha">
          <path
            d="M 660 90
               Q 644 102 660 114
               Q 644 126 660 138
               Q 644 150 660 162
               Q 644 174 660 186
               Q 644 198 660 210
               Q 644 222 660 234
               Q 644 246 660 258
               Q 644 270 660 282
               Q 644 294 660 306
               Q 644 318 660 330
               Q 644 342 660 354
               Q 644 366 660 378"
            fill="none"
            stroke={isOverload ? '#64748b' : isActive ? '#10b981' : '#64748b'}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Connection from bottom of Bobina de Marcha to Terminal R */}
          <line
            x1="660"
            y1="378"
            x2="660"
            y2="400"
            stroke={activeColorL2}
            strokeWidth="2.2"
          />
          <line
            x1="660"
            y1="400"
            x2="428"
            y2="400"
            stroke={activeColorL2}
            strokeWidth="2.2"
          />

          {/* Label "Bobina de marcha" */}
          <text
            x="640"
            y="235"
            fontSize="11.5"
            fontWeight="bold"
            fill={isActive ? '#34d399' : '#cbd5e1'}
            textAnchor="end"
            fontFamily="sans-serif"
          >
            Bobina de
          </text>
          <text
            x="640"
            y="252"
            fontSize="11.5"
            fontWeight="bold"
            fill={isActive ? '#34d399' : '#cbd5e1'}
            textAnchor="end"
            fontFamily="sans-serif"
          >
            marcha
          </text>
        </g>
      </svg>
    </div>
  );
};
