import React, { useState, useEffect, useRef } from 'react';
import {
  Gauge,
  Play,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Wrench,
  Wind,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export type CompressionPreset = 'optimo' | 'valvula_rota' | 'desgaste' | 'biela_rota';

interface MechanicalCaseConfig {
  name: string;
  shortDesc: string;
  targetPsi: number;
  dropRatePercentPerSec: number; // % drop per second when stopped
  verdict: 'OPTIMO' | 'VALVULA_ROTA' | 'DESGASTE' | 'BIELA_ROTA';
  title: string;
  symptomInSystem: string;
  rootCause: string;
  recommendedAction: string;
}

const COMPRESSION_CASES: Record<CompressionPreset, MechanicalCaseConfig> = {
  optimo: {
    name: 'Rendimiento Volumétrico Óptimo',
    shortDesc: 'Supera > 420 PSI y retiene la presión al cortar corriente.',
    targetPsi: 430,
    dropRatePercentPerSec: 0.5, // Holds pressure solidly
    verdict: 'OPTIMO',
    title: 'Compresor Mecánicamente Sano (Láminas Estancas)',
    symptomInSystem: 'Presiones de trabajo correctas. Salto térmico óptimo en el evaporador y condensador caliente homogéneo.',
    rootCause: 'Láminas flapper de succión y descarga con cierre hermético sobre la placa de válvulas. Tolerancia pistón-cilindro perfecta.',
    recommendedAction: 'Apto para servicio. Mantener lubricación adecuada y montar filtro deshidratador nuevo.',
  },
  valvula_rota: {
    name: 'Válvula de Alta Rota / Comunicada',
    shortDesc: 'Llega con dificultad a 180-210 PSI y cae inmediatamente a 0 al parar.',
    targetPsi: 195,
    dropRatePercentPerSec: 45, // Drops immediately in < 2.5s
    verdict: 'VALVULA_ROTA',
    title: 'Lámina Flapper de Descarga Rota o Deformada',
    symptomInSystem: 'En la máquina: Presión de alta muy baja y presión de baja anormalmente alta. El compresor trabaja pero no produce frío en absoluto.',
    rootCause: 'Fractura por fatiga de la lámina de acero templado o restos de carbonilla/viruta impidiendo el asentamiento. El gas comprimido retrocede al cárter.',
    recommendedAction: 'Compresor inservible. En motocompresores herméticos soldados no se sustituyen láminas: sustitución completa del compresor.',
  },
  desgaste: {
    name: 'Falta de Compresión por Desgaste',
    shortDesc: 'No supera 210-240 PSI tras 15s comprimiendo, pero retiene algo de presión.',
    targetPsi: 225,
    dropRatePercentPerSec: 3.5, // Slow blow-by drop
    verdict: 'DESGASTE',
    title: 'Pérdida de Rendimiento Volumétrico (Desgaste Mecánico)',
    symptomInSystem: 'El equipo enfría muy poco o no alcanza temperatura de consigna en verano. El compresor funciona de continuo sin parar por termostato.',
    rootCause: 'Holgura excesiva entre pistón, segmentos y cilindro por rozamiento prolongado o falta de lubricación (blow-by).',
    recommendedAction: 'Sustituir compresor. El bajo rendimiento volumétrico dispara el consumo eléctrico y recalienta el motor.',
  },
  biela_rota: {
    name: 'Rotura Mecánica de Biela / Pistón',
    shortDesc: 'El motor eléctrico gira pero no genera ninguna presión (0 PSI).',
    targetPsi: 0,
    dropRatePercentPerSec: 100,
    verdict: 'BIELA_ROTA',
    title: 'Desacople Mecánico Interno (Biela Partida)',
    symptomInSystem: 'Consumo eléctrico muy bajo (casi en vacío, ~0.4-0.5 A). Sin flujo de refrigerante ni compresión alguna.',
    rootCause: 'Golpe de líquido frigorífico incompresible en la aspiración que fracturó la biela de aluminio o el bulón del pistón.',
    recommendedAction: 'Compresor destruido mecánicamente. Obligatorio verificar causa del golpe de líquido antes de colocar el compresor nuevo.',
  },
};

export const MechanicalCompressionTester: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<CompressionPreset>('optimo');
  const [currentPsi, setCurrentPsi] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isMeasuringRetention, setIsMeasuringRetention] = useState<boolean>(false);
  const [retentionElapsedSec, setRetentionElapsedSec] = useState<number>(0);
  const [initialRetentionPsi, setInitialRetentionPsi] = useState<number>(0);

  // Manual adjustment controls
  const [customMaxPsi, setCustomMaxPsi] = useState<number>(430);
  const [customRetentionSpeed, setCustomRetentionSpeed] = useState<'holds' | 'slow_drop' | 'fast_drop'>('holds');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const activeConfig = COMPRESSION_CASES[selectedCase];

  // Load preset parameters
  const handleSelectCase = (key: CompressionPreset) => {
    setSelectedCase(key);
    setIsManualMode(false);
    resetSimulation();
    const config = COMPRESSION_CASES[key];
    setCustomMaxPsi(config.targetPsi);
    if (config.dropRatePercentPerSec <= 1) {
      setCustomRetentionSpeed('holds');
    } else if (config.dropRatePercentPerSec <= 10) {
      setCustomRetentionSpeed('slow_drop');
    } else {
      setCustomRetentionSpeed('fast_drop');
    }
  };

  const resetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentPsi(0);
    setIsCompressing(false);
    setIsMeasuringRetention(false);
    setRetentionElapsedSec(0);
    setInitialRetentionPsi(0);
  };

  // Start Compression Simulation
  const handleStartCompression = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsMeasuringRetention(false);
    setIsCompressing(true);
    setRetentionElapsedSec(0);

    const target = isManualMode ? customMaxPsi : activeConfig.targetPsi;

    timerRef.current = window.setInterval(() => {
      setCurrentPsi((prev) => {
        if (target === 0) return 0;
        // Natural compressor pumping curve with slight piston vibration
        const step = Math.max(15, (target - prev) * 0.28);
        const next = Math.min(target, prev + step);
        const vibration = next >= target ? (Math.random() * 4 - 2) : (Math.random() * 2 - 1);
        return Math.max(0, Math.round(next + vibration));
      });
    }, 150);
  };

  // Stop Compressor and measure retention (Cut power to 0V)
  const handleStopAndMeasureRetention = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompressing(false);
    setIsMeasuringRetention(true);
    setInitialRetentionPsi(currentPsi);
    setRetentionElapsedSec(0);

    const dropRate = isManualMode
      ? customRetentionSpeed === 'holds'
        ? 0.5
        : customRetentionSpeed === 'slow_drop'
        ? 3.5
        : 45
      : activeConfig.dropRatePercentPerSec;

    timerRef.current = window.setInterval(() => {
      setRetentionElapsedSec((s) => s + 0.2);
      setCurrentPsi((prev) => {
        if (prev <= 0) return 0;
        // Calculate pressure drop based on valve seal condition
        const dropFactor = (dropRate / 100) * prev * 0.2;
        const nextVal = Math.max(0, prev - dropFactor);
        return Math.round(nextVal * 10) / 10;
      });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Conversions & Diagnostics
  const currentBar = Math.round((currentPsi * 0.0689476) * 10) / 10;
  
  // Calculate gauge needle angle: 0 PSI -> -135 deg, 500 PSI -> +135 deg
  const needleAngle = Math.min(135, Math.max(-135, -135 + (currentPsi / 500) * 270));

  // Determine dynamic diagnostic status based on current/custom readings
  const calculatedVerdict = () => {
    const peak = isMeasuringRetention ? initialRetentionPsi : currentPsi;
    const current = currentPsi;
    const dropAfterStop = initialRetentionPsi > 0 ? (initialRetentionPsi - current) : 0;
    const fastLeak = isMeasuringRetention && initialRetentionPsi > 50 && (current < initialRetentionPsi * 0.4 || dropAfterStop > 120);

    if (peak === 0 && !isCompressing) return 'SIN_PRUEBA';
    if (peak < 30 && isCompressing) return 'BIELA_ROTA';
    if (fastLeak) return 'VALVULA_ROTA';
    if (peak < 260 && (peak >= 80)) return 'DESGASTE';
    if (peak >= 350 && (!isMeasuringRetention || current >= initialRetentionPsi * 0.8)) return 'OPTIMO';
    if (peak >= 260 && peak < 350) return 'ACEPTABLE';
    return 'EVALUANDO';
  };

  const verdictState = calculatedVerdict();

  return (
    <div className="space-y-3 font-secondary select-none">
      {/* 1. Header with Technician Method summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-500" />
            Diagnóstico Mecánico y Válvulas Flapper (Prueba de Compresión)
          </h3>
          <p className="text-tiny text-slate-500 dark:text-slate-400">
            Comprobación de presión manométrica en descarga y retención interna según el método de taller (Maestro Cifu).
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold self-start sm:self-auto">
          Alta: 0 - 500 PSI (0 - 35 Bar)
        </span>
      </div>

      {/* 2. Preset Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {(Object.keys(COMPRESSION_CASES) as CompressionPreset[]).map((key) => {
          const c = COMPRESSION_CASES[key];
          const isSelected = selectedCase === key && !isManualMode;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectCase(key)}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-[#0c101b] border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <div>
                <span className={`text-[11px] font-bold block leading-tight ${
                  key === 'optimo' ? 'text-emerald-600 dark:text-emerald-400' :
                  key === 'valvula_rota' ? 'text-rose-600 dark:text-rose-400' :
                  key === 'desgaste' ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {c.name}
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {c.shortDesc}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold mt-1 text-slate-400">
                Ref: {c.targetPsi} PSI
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Interactive Workbench: High-Pressure Gauge + Workbench Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-inner">
        {/* Left: Realistic SVG High Pressure Gauge (Manómetro de Alta) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative">
          <div className="w-56 h-56 relative flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
              {/* Outer Metallic Bezel */}
              <circle cx="100" cy="100" r="94" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
              <circle cx="100" cy="100" r="88" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="83" fill="#020617" />

              {/* Color arcs: Red (insufficient < 250), Yellow (250-350), Green (350-450), Dark Red (> 450) */}
              {/* Arc background circle base with dasharray */}
              <path
                d="M 40 160 A 72 72 0 1 1 160 160"
                fill="none"
                stroke="#334155"
                strokeWidth="7"
                strokeLinecap="round"
              />
              {/* Red Zone (0 - 250 PSI: ~135 deg) */}
              <path
                d="M 40 160 A 72 72 0 0 1 100 28"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="7"
                opacity="0.85"
              />
              {/* Yellow Zone (250 - 350 PSI) */}
              <path
                d="M 100 28 A 72 72 0 0 1 144 50"
                fill="none"
                stroke="#eab308"
                strokeWidth="7"
                opacity="0.85"
              />
              {/* Green Optimal Zone (350 - 450 PSI) */}
              <path
                d="M 144 50 A 72 72 0 0 1 163 125"
                fill="none"
                stroke="#10b981"
                strokeWidth="7"
                opacity="0.95"
              />

              {/* Major Tick Marks and Labels */}
              <text x="35" y="160" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">0</text>
              <text x="30" y="105" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">100</text>
              <text x="50" y="55" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">200</text>
              <text x="94" y="42" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="monospace">300</text>
              <text x="135" y="58" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace">400</text>
              <text x="155" y="110" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">500</text>

              {/* Gauge Title & Units */}
              <text x="100" y="125" fill="#e2e8f0" fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                ALTA PRESIÓN
              </text>
              <text x="100" y="135" fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                PSI / BAR
              </text>

              {/* Needle Indicator */}
              <g transform={`rotate(${needleAngle} 100 100)`}>
                <line
                  x1="100"
                  y1="112"
                  x2="100"
                  y2="32"
                  stroke="#f43f5e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 4px #ef4444)"
                />
                <circle cx="100" cy="100" r="6.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              </g>

              {/* Center Pivot Cap */}
              <circle cx="100" cy="100" r="3.5" fill="#0f172a" />
            </svg>

            {/* Digital readout badge floating at the bottom */}
            <div className="absolute bottom-2 px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-700 text-center font-mono shadow-md backdrop-blur">
              <div className="text-[13px] font-black text-amber-400 leading-tight">
                {currentPsi} <span className="text-[10px] text-slate-400">PSI</span>
              </div>
              <div className="text-[10px] text-sky-400 font-semibold leading-tight">
                {currentBar} <span className="text-[9px] text-slate-400">Bar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls & Status Feedback */}
        <div className="md:col-span-6 space-y-2.5">
          {/* Action Buttons */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleStartCompression}
              disabled={isCompressing}
              className={`w-full py-2 px-3 rounded-lg font-mono text-tiny font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                isCompressing
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompressing ? 'COMPRIMIENDO EN BANCO...' : '1. ARRANCAR COMPRESIÓN (MANTENER TAPADO)'}</span>
            </button>

            <button
              type="button"
              onClick={handleStopAndMeasureRetention}
              disabled={!isCompressing && currentPsi === 0}
              className={`w-full py-2 px-3 rounded-lg font-mono text-tiny font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                isMeasuringRetention
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>2. DESCONECTAR (0V) Y MEDIR RETENCIÓN</span>
            </button>

            <button
              type="button"
              onClick={resetSimulation}
              className="w-full py-1 rounded bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Purgar manómetro y reiniciar prueba</span>
            </button>
          </div>

          {/* Retention Timer & Drop Stats */}
          {isMeasuringRetention && (
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Tiempo corte (0V):</span>
                <span className="font-bold text-amber-400">{retentionElapsedSec.toFixed(1)} s</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Presión inicial al corte:</span>
                <span className="font-bold">{initialRetentionPsi} PSI</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Caída de presión (fuga):</span>
                <span className={`font-bold ${
                  initialRetentionPsi - currentPsi > 50 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  -{(initialRetentionPsi - currentPsi).toFixed(0)} PSI
                </span>
              </div>
            </div>
          )}

          {/* Custom Workshop Sliders */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5 text-tiny font-mono">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">Ajuste manual de presión máxima:</span>
              <span className="font-bold text-amber-400">{customMaxPsi} PSI ({Math.round(customMaxPsi * 0.0689)} Bar)</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={customMaxPsi}
              onChange={(e) => {
                setIsManualMode(true);
                setCustomMaxPsi(Number(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 4. Official Mechanical Verdict Banner */}
      <div className={`p-3 rounded-xl border transition-all ${
        verdictState === 'OPTIMO'
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
          : verdictState === 'VALVULA_ROTA'
          ? 'bg-rose-500/15 border-rose-500 text-rose-950 dark:text-rose-200 shadow-sm'
          : verdictState === 'DESGASTE'
          ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200'
          : verdictState === 'BIELA_ROTA'
          ? 'bg-purple-500/15 border-purple-500 text-purple-950 dark:text-purple-200'
          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
      }`}>
        <div className="flex items-start gap-2.5">
          {verdictState === 'OPTIMO' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : verdictState === 'SIN_PRUEBA' ? (
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-small font-black uppercase tracking-wide">
                Dictamen: {activeConfig.title}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                verdictState === 'OPTIMO'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : verdictState === 'SIN_PRUEBA'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-400'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                {verdictState === 'OPTIMO' ? 'ESTANQUEIDAD Y PRESIÓN ÓPTIMAS' :
                 verdictState === 'VALVULA_ROTA' ? 'VÁLVULA DE ALTA COMUNICADA' :
                 verdictState === 'DESGASTE' ? 'FALTA DE COMPRESIÓN (BLOW-BY)' :
                 verdictState === 'BIELA_ROTA' ? 'DESACOPLE MECÁNICO TOTAL' : 'EN ESPERA DE PRUEBA'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-tiny pt-1">
              <div>
                <strong className="block text-slate-900 dark:text-white">Síntoma en la Instalación Frigorífica:</strong>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  {activeConfig.symptomInSystem}
                </p>
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white">Causa Raíz y Acción Técnica:</strong>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                  {activeConfig.rootCause} — <em>{activeConfig.recommendedAction}</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
