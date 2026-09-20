import React, { useState } from 'react';
import { SchematicVariant } from './IntuitiveSchematicDiagram';
import { Zap, Play, CheckCircle2, AlertCircle, RefreshCw, Cpu, Layers } from 'lucide-react';

interface RealCompressorWiringProps {
  variant: SchematicVariant;
  simState?: 'idle' | 'starting' | 'running' | 'overload';
}

export const RealCompressorWiringSimulation: React.FC<RealCompressorWiringProps> = ({
  variant,
  simState: externalSimState,
}) => {
  const [internalSimState, setInternalSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [activeWireHighlight, setActiveWireHighlight] = useState<string | null>(null);

  const simState = externalSimState || internalSimState;

  const isStarting = simState === 'starting';
  const isRunning = simState === 'running';
  const isOverload = simState === 'overload';
  const isActive = isStarting || isRunning;

  const hasStartCapacitor =
    variant === 'HST_CSR_RELE' ||
    variant === 'HST_CSR_PTC' ||
    variant === 'HST_CSIR_RELE' ||
    variant === 'HST_CSIR_PTC' ||
    variant === 'CSIR_RELE' ||
    variant === 'CSR_POTENCIAL';

  const hasRunCapacitor =
    variant === 'RSCR_RELE' ||
    variant === 'RSCR_PTC' ||
    variant === 'HST_CSIR_RELE' ||
    variant === 'HST_CSIR_PTC' ||
    variant === 'CSR_POTENCIAL';

  const isRelay =
    variant === 'RSIR_RELE' ||
    variant === 'RSCR_RELE' ||
    variant === 'CSIR_RELE' ||
    variant === 'HST_CSR_RELE' ||
    variant === 'HST_CSIR_RELE';

  const isPTC =
    variant === 'RSIR_PTC' ||
    variant === 'RSCR_PTC' ||
    variant === 'HST_CSR_PTC' ||
    variant === 'HST_CSIR_PTC';

  const handleTestSequence = () => {
    setInternalSimState('starting');
    setTimeout(() => {
      setInternalSimState('running');
    }, 2200);
  };

  return (
    <div className="w-full space-y-4">
      {/* Simulation Controls for Bornes */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-[#0c1220] rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Flujo de Conexión Real:
          </span>
          <button
            type="button"
            onClick={handleTestSequence}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simular Tensión Red</span>
          </button>
          <button
            type="button"
            onClick={() => setInternalSimState('overload')}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Simular Klixon Abierto</span>
          </button>
          <button
            type="button"
            onClick={() => setInternalSimState('idle')}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Restablecer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-tiny font-mono text-slate-400 hidden sm:inline">Pase el cursor por los bornes para resaltar</span>
        </div>
      </div>

      {/* SVG Interactive Real Compressor Bornes Visualization */}
      <div className="w-full bg-slate-900 rounded-2xl p-4 border-2 border-slate-700 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Top Info Banner */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-300 mb-2 px-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Carcasa Compresor Hermético (Vista Frontal Bornas)
          </span>
          <span className="text-amber-400 font-bold">
            Configuración: {isRelay ? 'Relé Amperimétrico' : isPTC ? 'Pastilla PTC' : 'Relé Voltimétrico'}
          </span>
        </div>

        <svg
          viewBox="0 0 680 380"
          className="w-full max-w-2xl h-auto drop-shadow-md select-none font-sans"
        >
          <defs>
            {/* Metallic Gradients */}
            <radialGradient id="compressorHousing" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="85%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <linearGradient id="brassPin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Pulsing glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* COMPRESSOR HERMETIC DOME BASE */}
          <rect x="20" y="30" width="380" height="320" rx="28" fill="url(#compressorHousing)" stroke="#334155" strokeWidth="3" />
          <circle cx="210" cy="180" r="140" fill="#090d16" stroke="#1e293b" strokeWidth="2" />

          {/* FUSITE GLASS-TO-METAL SEAL TERMINAL PLATE */}
          <circle cx="210" cy="175" r="95" fill="#182032" stroke="#475569" strokeWidth="3" />
          <circle cx="210" cy="175" r="90" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 2" />

          {/* TERMINAL PINS (TRIANGLE CONFIGURATION) */}
          {/* 1. PIN C (COMÚN) - Top Apex */}
          <g
            id="pin-c"
            onMouseEnter={() => setActiveWireHighlight('C')}
            onMouseLeave={() => setActiveWireHighlight(null)}
            className="cursor-pointer group"
          >
            <circle cx="210" cy="115" r="14" fill="#020617" stroke="#64748b" strokeWidth="2" />
            <circle cx="210" cy="115" r="9" fill="url(#brassPin)" filter={activeWireHighlight === 'C' ? 'url(#glow)' : undefined} />
            <circle cx="210" cy="115" r="4" fill="#451a03" />
            <text x="210" y="93" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">
              C (Común)
            </text>
          </g>

          {/* 2. PIN S (START / AUXILIAR) - Bottom Left */}
          <g
            id="pin-s"
            onMouseEnter={() => setActiveWireHighlight('S')}
            onMouseLeave={() => setActiveWireHighlight(null)}
            className="cursor-pointer group"
          >
            <circle cx="160" cy="215" r="14" fill="#020617" stroke="#64748b" strokeWidth="2" />
            <circle cx="160" cy="215" r="9" fill="url(#brassPin)" filter={activeWireHighlight === 'S' ? 'url(#glow)' : undefined} />
            <circle cx="160" cy="215" r="4" fill="#451a03" />
            <text x="135" y="240" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">
              S (Auxiliar)
            </text>
          </g>

          {/* 3. PIN R (RUN / MARCHA) - Bottom Right */}
          <g
            id="pin-r"
            onMouseEnter={() => setActiveWireHighlight('R')}
            onMouseLeave={() => setActiveWireHighlight(null)}
            className="cursor-pointer group"
          >
            <circle cx="260" cy="215" r="14" fill="#020617" stroke="#64748b" strokeWidth="2" />
            <circle cx="260" cy="215" r="9" fill="url(#brassPin)" filter={activeWireHighlight === 'R' ? 'url(#glow)' : undefined} />
            <circle cx="260" cy="215" r="4" fill="#451a03" />
            <text x="285" y="240" fill="#4ade80" fontSize="13" fontWeight="bold" textAnchor="middle">
              R (Marcha)
            </text>
          </g>

          {/* EXTERNAL AUXILIARY HARDWARE (Right Panel) */}
          
          {/* A. RED 230V MAINS INLET */}
          <g id="mains-inlet">
            <rect x="440" y="40" width="220" height="60" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <text x="455" y="62" fill="#94a3b8" fontSize="11" fontWeight="bold">ALIMENTACIÓN 230V CA</text>
            
            {/* L1 terminal */}
            <circle cx="470" cy="80" r="6" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="485" y="84" fill="#f59e0b" fontSize="11" fontWeight="bold">L1 (Fase / C1)</text>

            {/* N terminal */}
            <circle cx="560" cy="80" r="6" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="575" y="84" fill="#60a5fa" fontSize="11" fontWeight="bold">N (Neutro / C2)</text>
          </g>

          {/* B. PROTECTOR TÉRMICO KLIXON */}
          <g id="hardware-klixon">
            <rect x="440" y="115" width="220" height="50" rx="8" fill="#1e293b" stroke={isOverload ? '#ef4444' : '#475569'} strokeWidth="2" />
            <circle cx="465" cy="140" r="12" fill={isOverload ? '#ef4444' : '#334155'} stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="465" y="144" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">K</text>
            <text x="488" y="136" fill="#f8fafc" fontSize="12" fontWeight="bold">Protector Térmico (Klixon)</text>
            <text x="488" y="152" fill={isOverload ? '#f87171' : '#94a3b8'} fontSize="10">
              {isOverload ? 'CONTACTO DISPARADO' : 'Cerrado / Paso a Borne C'}
            </text>
          </g>

          {/* C. STARTING DEVICE (RELAY or PTC) */}
          <g id="hardware-starter">
            <rect x="440" y="180" width="220" height="60" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="455" y="202" fill="#f8fafc" fontSize="12" fontWeight="bold">
              {isRelay ? 'Relé de Arranque Amperimétrico' : isPTC ? 'Dispositivo de Arranque PTC' : 'Relé Voltimétrico Potencial'}
            </text>
            <text x="455" y="222" fill="#94a3b8" fontSize="10">
              {isRelay
                ? (isStarting ? '⚡ Contacto Cerrado hacia S' : '⚪ Contacto Abierto (Marcha)')
                : isPTC
                ? (isStarting ? '⚡ Pastilla Fría: Conduce a S' : '🔥 Pastilla Caliente: Bloqueada')
                : 'Contacto Potencial N.C.'}
            </text>
          </g>

          {/* D. CAPACITORS (If Present) */}
          {hasStartCapacitor && (
            <g id="hardware-start-cap">
              <rect x="440" y="255" width="220" height="48" rx="8" fill="#1e293b" stroke="#d97706" strokeWidth="1.5" />
              <rect x="450" y="264" width="20" height="30" rx="4" fill="#b45309" stroke="#fef3c7" strokeWidth="1" />
              <text x="480" y="276" fill="#f59e0b" fontSize="11" fontWeight="bold">Condensador de Arranque</text>
              <text x="480" y="292" fill="#94a3b8" fontSize="10">
                {isStarting ? '⚡ Aporte de Par Inicial (90°)' : '⚪ Desconectado'}
              </text>
            </g>
          )}

          {hasRunCapacitor && (
            <g id="hardware-run-cap">
              <rect x="440" y={hasStartCapacitor ? "312" : "255"} width="220" height="48" rx="8" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
              <rect x="450" y={hasStartCapacitor ? "321" : "264"} width="20" height="30" rx="4" fill="#0369a1" stroke="#e0f2fe" strokeWidth="1" />
              <text x="480" y={hasStartCapacitor ? "333" : "276"} fill="#38bdf8" fontSize="11" fontWeight="bold">Condensador de Marcha</text>
              <text x="480" y={hasStartCapacitor ? "349" : "292"} fill="#94a3b8" fontSize="10">
                Permanente entre bornes S y R
              </text>
            </g>
          )}

          {/* WIRES ROUTING (REAL COLORS & ANIMATED CURRENTS) */}

          {/* 1. Wire L1 -> Klixon (Brown / Marrón) */}
          <path
            d="M 470 86 L 470 115"
            fill="none"
            stroke={isActive && !isOverload ? '#f59e0b' : '#92400e'}
            strokeWidth="3.5"
          />

          {/* 2. Wire Klixon Output -> Borne C (Marrón con corriente) */}
          <path
            d="M 440 140 L 320 140 L 320 115 L 224 115"
            fill="none"
            stroke={isActive && !isOverload ? '#22c55e' : isOverload ? '#ef4444' : '#64748b'}
            strokeWidth={activeWireHighlight === 'C' ? '5' : '3.5'}
            strokeDasharray={isActive && !isOverload ? '6 3' : undefined}
          />

          {/* 3. Wire Neutro N -> Starter (Blue / Azul) */}
          <path
            d="M 560 86 L 560 180"
            fill="none"
            stroke={isActive && !isOverload ? '#38bdf8' : '#1e3a8a'}
            strokeWidth="3.5"
          />

          {/* 4. Wire Starter -> Borne R (Devanado de Marcha) */}
          <path
            d="M 440 215 L 340 215 L 340 215 L 274 215"
            fill="none"
            stroke={isActive && !isOverload ? '#4ade80' : '#334155'}
            strokeWidth={activeWireHighlight === 'R' ? '5' : '3.5'}
            strokeDasharray={isActive && !isOverload ? '6 3' : undefined}
          />

          {/* 5. Wire to Borne S (Auxiliar de Arranque) */}
          {hasStartCapacitor ? (
            /* Passes through Start Capacitor to Borne S */
            <g>
              <path
                d="M 440 200 L 410 200 L 410 279 L 440 279"
                fill="none"
                stroke={isStarting ? '#f59e0b' : '#475569'}
                strokeWidth="3"
              />
              <path
                d="M 440 285 L 380 285 L 380 235 L 290 235 L 290 215 L 174 215"
                fill="none"
                stroke={isStarting ? '#f59e0b' : '#475569'}
                strokeWidth={activeWireHighlight === 'S' ? '5' : '3'}
                strokeDasharray={isStarting ? '5 3' : undefined}
              />
            </g>
          ) : (
            /* Direct wire from Starter (Relay/PTC) to Borne S */
            <path
              d="M 440 200 L 370 200 L 370 205 L 174 205 L 174 210"
              fill="none"
              stroke={isStarting ? '#f59e0b' : '#475569'}
              strokeWidth={activeWireHighlight === 'S' ? '5' : '3'}
              strokeDasharray={isStarting ? '5 3' : undefined}
            />
          )}

          {/* 6. Permanent Run Capacitor Bridge (between S and R) */}
          {hasRunCapacitor && (
            <g id="run-cap-bridge">
              {/* Loop between S and R terminals */}
              <path
                d="M 160 229 L 160 265 L 260 265 L 260 229"
                fill="none"
                stroke={isRunning ? '#38bdf8' : '#0284c7'}
                strokeWidth="2.8"
                strokeDasharray={isRunning ? '4 2' : undefined}
              />
              <rect x="195" y="255" width="30" height="20" rx="4" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1" />
              <text x="210" y="269" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">CR</text>
            </g>
          )}
        </svg>

        {/* Legend beneath the diagram */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800 text-tiny font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Borne C: Línea C1 con Klixon térmico</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-slate-300">Borne R: Bobina principal de marcha</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-400" />
            <span className="text-slate-300">Borne S: Bobina auxiliar de arranque</span>
          </div>
          {hasRunCapacitor && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-cyan-300">Puente S-R: Condensador de Marcha</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
