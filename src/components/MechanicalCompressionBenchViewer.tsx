import React from 'react';
import { UseMechanicalCompressionSimulatorReturn } from '../hooks/useMechanicalCompressionSimulator';
import {
  Gauge,
  AlertTriangle,
  ShieldAlert,
  Wind,
  Droplets,
  Clock,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';

interface MechanicalCompressionBenchViewerProps {
  simulator: UseMechanicalCompressionSimulatorReturn;
}

export const MechanicalCompressionBenchViewer: React.FC<MechanicalCompressionBenchViewerProps> = ({
  simulator,
}) => {
  const {
    currentPsi,
    currentBar,
    isCompressing,
    isMeasuringRetention,
    initialRetentionPsi,
    retentionElapsedSec,
    needleAngle,
    methodType,
    setMethodType,
    verdict,
    activeCaseInfo,
  } = simulator;

  const pressureDrop = initialRetentionPsi > 0 ? Math.max(0, initialRetentionPsi - currentPsi) : 0;
  const initialRetentionBar = Math.round(initialRetentionPsi * 0.0689476 * 10) / 10;
  const pressureDropBar = Math.round(pressureDrop * 0.0689476 * 10) / 10;

  // Concentric dial geometry helper: all arcs and ticks centered exactly at (100, 100)
  const getDialCoord = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: Math.round((100 + radius * Math.sin(rad)) * 100) / 100,
      y: Math.round((100 - radius * Math.cos(rad)) * 100) / 100,
    };
  };

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const p1 = getDialCoord(startAngle, radius);
    const p2 = getDialCoord(endAngle, radius);
    const arcSpan = endAngle - startAngle;
    const largeArc = Math.abs(arcSpan) > 180 ? 1 : 0;
    const sweep = arcSpan > 0 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
  };

  // Dial scale: 0 to 35 bar corresponds to -135deg to +135deg (span 270deg)
  const barToAngle = (bar: number) => -135 + (bar / 35) * 270;

  const arcBase = createArcPath(-135, 135, 72);
  const arcRedLow = createArcPath(barToAngle(0), barToAngle(18), 72);
  const arcYellow = createArcPath(barToAngle(18), barToAngle(24), 72);
  const arcGreenOpt = createArcPath(barToAngle(24), barToAngle(32), 72);
  const arcRedOver = createArcPath(barToAngle(32), barToAngle(35), 72);
  const arcInnerScale = createArcPath(-135, 135, 62);

  const majorTicks = [0, 5, 10, 15, 20, 25, 30, 35];
  const minorTicks = Array.from({ length: 36 }, (_, i) => i).filter((b) => b % 5 !== 0);

  return (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-white rounded-xl border border-slate-800 p-3 shadow-inner relative overflow-hidden select-none font-secondary">
      {/* Top Header Bar with Mode Toggle */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-small font-bold text-white leading-tight flex items-center gap-1.5">
              Banco de Prueba de Compresión y Láminas Flapper
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Método de taller Maestro Cifu • Estanqueidad de válvula de descarga
            </span>
          </div>
        </div>

        {/* Method selector buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setMethodType('gauge')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer font-semibold ${
              methodType === 'gauge'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manómetro de Alta
          </button>
          <button
            type="button"
            onClick={() => setMethodType('finger')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer font-semibold ${
              methodType === 'finger'
                ? 'bg-amber-400 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tapar con el Dedo
          </button>
        </div>
      </div>

      {/* Main Center Area: Gauge and Visual Compressor Illustration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center flex-1 my-1">
        {/* Left / Top (6 cols): Realistic High-Pressure Gauge (0-500 PSI / 0-35 Bar) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative">
          <div className="w-48 h-48 sm:w-52 sm:h-52 relative flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {/* Outer Metallic Bezel */}
              <circle cx="100" cy="100" r="95" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
              <circle cx="100" cy="100" r="89" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="84" fill="#020617" />

              {/* Arc background base (strictly concentric R=72) */}
              <path
                d={arcBase}
                fill="none"
                stroke="#334155"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Red Zone (0 - 18 Bar: ~0 - 260 PSI, Baja compresión / Válvula rota) */}
              <path
                d={arcRedLow}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="7"
                opacity="0.85"
              />

              {/* Yellow Zone (18 - 24 Bar: ~260 - 350 PSI, Zona de transición / Desgaste) */}
              <path
                d={arcYellow}
                fill="none"
                stroke="#eab308"
                strokeWidth="7"
                opacity="0.85"
              />

              {/* Green Zone (24 - 32 Bar: ~350 - 465 PSI, Rendimiento Volumétrico Óptimo) */}
              <path
                d={arcGreenOpt}
                fill="none"
                stroke="#10b981"
                strokeWidth="7"
                opacity="0.95"
              />

              {/* High / Overpressure Warning Zone (32 - 35 Bar) */}
              <path
                d={arcRedOver}
                fill="none"
                stroke="#e11d48"
                strokeWidth="7"
                opacity="0.85"
              />

              {/* Concentric Inner Scale Line (R=62) */}
              <path
                d={arcInnerScale}
                fill="none"
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />

              {/* Minor tick marks (every 1 bar) */}
              {minorTicks.map((b) => {
                const angle = barToAngle(b);
                const pInner = getDialCoord(angle, 62);
                const pOuter = getDialCoord(angle, 65);
                return (
                  <line
                    key={`min-tick-${b}`}
                    x1={pInner.x}
                    y1={pInner.y}
                    x2={pOuter.x}
                    y2={pOuter.y}
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Major tick marks (every 5 bar) */}
              {majorTicks.map((b) => {
                const angle = barToAngle(b);
                const pInner = getDialCoord(angle, 62);
                const pOuter = getDialCoord(angle, 67.5);
                return (
                  <line
                    key={`maj-tick-${b}`}
                    x1={pInner.x}
                    y1={pInner.y}
                    x2={pOuter.x}
                    y2={pOuter.y}
                    stroke={b >= 24 && b <= 30 ? '#10b981' : b === 20 ? '#eab308' : '#94a3b8'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Major Tick Labels in BAR (R=50) */}
              {majorTicks.map((b) => {
                const angle = barToAngle(b);
                const pText = getDialCoord(angle, 50);
                const isGreen = b >= 24 && b <= 30;
                const isYellow = b === 20;
                return (
                  <text
                    key={`lbl-bar-${b}`}
                    x={pText.x}
                    y={pText.y + 2.5}
                    fill={isGreen ? '#34d399' : isYellow ? '#facc15' : '#94a3b8'}
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {b}
                  </text>
                );
              })}

              {/* Dial Title: BAR as primary */}
              <text x="100" y="121" fill="#e2e8f0" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
                DESCARGA / ALTA
              </text>
              <text x="100" y="131" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                BAR <tspan fill="#64748b" fontSize="6.5">(PSI)</tspan>
              </text>

              {/* Needle */}
              <g transform={`rotate(${needleAngle} 100 100)`}>
                <line
                  x1="100"
                  y1="112"
                  x2="100"
                  y2="33"
                  stroke="#ef4444"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 4px #ef4444)"
                />
                <circle cx="100" cy="100" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              </g>

              {/* Center Pivot */}
              <circle cx="100" cy="100" r="3.5" fill="#0f172a" />
            </svg>

            {/* Digital readout badge: BAR as primary */}
            <div className="absolute bottom-1 px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-700 text-center font-mono shadow-md backdrop-blur">
              <div className="text-small font-black text-sky-400 leading-tight">
                {currentBar} <span className="text-[10px] text-sky-300 font-bold">bar</span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold leading-tight">
                {currentPsi} <span className="text-[9px] text-slate-400">PSI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (6 cols): Bench & Compressor Physical Representation */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-2">
          {/* Compressor Body Graphical SVG */}
          <div className="relative p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[140px]">
            <svg viewBox="0 0 240 120" className="w-full max-w-[230px] h-auto">
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="metalPipe" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* Workbench surface */}
              <rect x="10" y="105" width="220" height="8" rx="2" fill="#1e293b" stroke="#334155" />

              {/* Rubber mounting feet */}
              <rect x="40" y="96" width="20" height="9" rx="2" fill="#020617" stroke="#475569" />
              <rect x="180" y="96" width="20" height="9" rx="2" fill="#020617" stroke="#475569" />

              {/* Hermetic Compressor Dome Body */}
              <g className={isCompressing ? 'animate-[bounce_0.15s_infinite]' : ''}>
                <rect x="45" y="30" width="150" height="68" rx="34" fill="url(#compGrad)" stroke="#475569" strokeWidth="2" />
                {/* Horizontal welding seam */}
                <line x1="46" y1="64" x2="194" y2="64" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Electrical terminal housing cover */}
                <rect x="85" y="70" width="30" height="20" rx="3" fill="#020617" stroke="#fbbf24" strokeWidth="1" />
                <text x="100" y="83" fill="#fbbf24" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">C R S</text>

                {/* Suction Pipe (Aspiración - Tubo grueso) */}
                <rect x="55" y="16" width="10" height="18" fill="url(#metalPipe)" stroke="#334155" />
                <text x="60" y="12" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">ASPIRACIÓN</text>

                {/* Service/Process Tube (Carga) */}
                <rect x="175" y="16" width="10" height="18" fill="url(#metalPipe)" stroke="#334155" />
                <text x="180" y="12" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">SERVICIO</text>

                {/* Discharge Pipe (Descarga / Alta - Tubo fino) */}
                <rect x="130" y="10" width="7" height="24" fill="url(#metalPipe)" stroke="#ef4444" strokeWidth="1" />
                <text x="133" y="6" fill="#f87171" fontSize="6.5" fontWeight="bold" textAnchor="middle">DESCARGA</text>

                {/* When method is GAUGE: Red high-pressure manifold hose connected */}
                {methodType === 'gauge' && (
                  <g>
                    <path
                      d="M 133 10 C 133 -10, 80 -10, 80 5"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="133" cy="10" r="4" fill="#fbbf24" stroke="#000" strokeWidth="0.8" />
                  </g>
                )}

                {/* When method is FINGER: Hand icon/finger pressing on pipe */}
                {methodType === 'finger' && (
                  <g transform="translate(125, -2)">
                    {/* Finger block */}
                    <rect x="0" y="0" width="16" height="14" rx="5" fill="#fca5a5" stroke="#b91c1c" strokeWidth="1" />
                    <text x="8" y="9" fill="#991b1b" fontSize="6" fontWeight="bold" textAnchor="middle">DEDO</text>
                  </g>
                )}

                {/* Pumping action gas or pressure bubbles */}
                {isCompressing && (
                  <g className="animate-pulse">
                    <circle cx="133" cy="18" r="3" fill="#ef4444" opacity="0.8" />
                    <circle cx="133" cy="22" r="2" fill="#facc15" opacity="0.9" />
                  </g>
                )}
              </g>
            </svg>

            {/* Test Status Banner inside illustration */}
            <div className="w-full flex items-center justify-between text-[10.5px] font-mono mt-1 pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">Estado de Motor:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${
                isCompressing
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : isMeasuringRetention
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isCompressing ? 'ENERGIZADO 230V • COMPRIMIENDO' : isMeasuringRetention ? 'CORTE A 0V • MIDIENDO RETENCIÓN' : 'PARADO (0V)'}
              </span>
            </div>
          </div>

          {/* Retention measurement live stats badge */}
          {isMeasuringRetention && (
            <div className="p-2 rounded-lg bg-slate-950 border border-amber-500/40 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Tiempo transcurrido (corte 0V):
                </span>
                <span className="font-bold text-amber-400">{retentionElapsedSec.toFixed(1)} s</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Presión inicial al corte:</span>
                <span className="font-bold text-sky-400">{initialRetentionBar} bar <span className="text-[10px] text-slate-400">({initialRetentionPsi} PSI)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Caída de presión (fuga):</span>
                <span className={`font-bold ${pressureDropBar > 3.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  -{pressureDropBar.toFixed(1)} bar <span className="text-[10px] opacity-80">(-{pressureDrop.toFixed(0)} PSI)</span> {pressureDropBar > 7 ? '(RETROCESO RÁPIDO)' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Workshop Safety Warnings (Maestro Cifu) */}
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] space-y-1 text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Advertencias Críticas de Taller (Maestro Cifu):</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[9.5px] text-slate-300 leading-tight pl-1">
              <li>
                <strong className="text-rose-400">Proyecciones de aceite:</strong> Cubrir con trapo o deflector la descarga abierta al arrancar; usar siempre gafas de seguridad.
              </li>
              <li>
                <strong className="text-amber-400">Límite 20-30 seg:</strong> No aspirar aire húmedo ambiente por tiempo prolongado para no degradar ni acidificar el aceite sintético POE/PAG.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Verdict Quick Ribbon */}
      <div className={`p-2 rounded-lg border text-tiny flex items-center justify-between shrink-0 ${
        verdict === 'OPTIMO'
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          : verdict === 'VALVULA_ROTA'
          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
          : verdict === 'DESGASTE'
          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
          : 'bg-purple-500/20 border-purple-500 text-purple-300'
      }`}>
        <div className="flex items-center gap-1.5 font-bold">
          {verdict === 'OPTIMO' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>Dictamen Mecánico: {activeCaseInfo.title}</span>
        </div>
        <span className="font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-[9.5px]">
          {activeCaseInfo.badge}
        </span>
      </div>
    </div>
  );
};
