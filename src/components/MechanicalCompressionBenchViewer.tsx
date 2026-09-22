import React, { useState } from 'react';
import { UseMechanicalCompressionSimulatorReturn } from '../hooks/useMechanicalCompressionSimulator';
import { ZoomPanViewer } from './ZoomPanViewer';
import { FingerSealingIllustration } from './FingerSealingIllustration';
import {
  Gauge,
  AlertTriangle,
  ShieldAlert,
  Wind,
  Droplets,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Volume2,
  VolumeX
} from 'lucide-react';
import { startCompressorHum, stopCompressorHum } from '../utils/audio';

interface MechanicalCompressionBenchViewerProps {
  simulator: UseMechanicalCompressionSimulatorReturn;
}

export const MechanicalCompressionBenchViewer: React.FC<MechanicalCompressionBenchViewerProps> = ({
  simulator,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

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

  // Sync sound with compression state and user mute toggle
  React.useEffect(() => {
    if (isCompressing && soundEnabled) {
      startCompressorHum(0.055, true);
    } else {
      stopCompressorHum();
    }
  }, [isCompressing, soundEnabled]);

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

        {/* Audio Toggle and Method selector buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Silenciar sonido motor compresor' : 'Activar sonido motor compresor'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Mute'}</span>
          </button>

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
          {/* Compressor Body Graphical SVG with Zoom & Pan */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden shadow-inner">
            <div className="relative w-full h-[240px] sm:h-[270px] overflow-hidden bg-slate-950">
              <ZoomPanViewer
                className="w-full h-full relative"
                containerClassName="w-full h-full relative flex items-center justify-center p-2"
                initialZoom={1}
                minZoom={0.75}
                maxZoom={3.5}
                toolbarPosition="top-right"
                title="Compresor hermético y tomas de alta/baja presión"
              >
                <div className="w-full h-full flex items-center justify-center select-none">
                  <svg viewBox="0 -70 650 550" className="w-full max-w-[340px] h-auto drop-shadow-2xl">
              <defs>
                {/* Filtros de sombra y profundidad */}
                <filter id="floorShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="innerDepth" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feOffset dx="0" dy="3"/>
                  <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
                  <feFlood floodColor="#000000" floodOpacity="0.8"/>
                  <feComposite in2="shadowDiff" operator="in"/>
                  <feComposite in2="SourceGraphic" operator="over"/>
                </filter>

                {/* Gradientes Carcasa Pintura Epoxi Negra / Charcoal Premium */}
                <radialGradient id="body3D" cx="45%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="35%" stopColor="#1f2937" />
                  <stop offset="70%" stopColor="#111827" />
                  <stop offset="100%" stopColor="#030712" />
                </radialGradient>

                <linearGradient id="metalSpec" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
                  <stop offset="30%" stopColor="#ffffff" stopOpacity="0.18" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                </linearGradient>

                {/* Gradientes Cobre / Bronce Realistas */}
                <linearGradient id="copperPipe" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="25%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#fef3c7" />
                  <stop offset="75%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                <linearGradient id="copperPipeH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="30%" stopColor="#fef3c7" />
                  <stop offset="70%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                {/* Gradientes Acero y Goma */}
                <linearGradient id="rubberFoot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="50%" stopColor="#111827" />
                  <stop offset="100%" stopColor="#030712" />
                </linearGradient>
                <linearGradient id="steelPlate" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* Sombra de apoyo proyectada en el suelo del banco */}
              <ellipse cx="325" cy="440" rx="220" ry="24" fill="#000000" opacity="0.65" filter="url(#floorShadow)" />

              {/* Bancada de fijación inferior con silentblocks de caucho */}
              <g id="mountingBase">
                {/* Patas de anclaje de acero */}
                <path d="M 145 390 L 165 425 L 235 425 L 245 390 Z" fill="url(#steelPlate)" stroke="#1e293b" strokeWidth="2" />
                <path d="M 405 390 L 415 425 L 485 425 L 505 390 Z" fill="url(#steelPlate)" stroke="#1e293b" strokeWidth="2" />

                {/* Silentblocks de goma amortiguadora */}
                <rect x="175" y="420" width="50" height="18" rx="5" fill="url(#rubberFoot)" stroke="#374151" strokeWidth="1.5" />
                <circle cx="200" cy="429" r="5" fill="#64748b" stroke="#000" strokeWidth="1" />

                <rect x="425" y="420" width="50" height="18" rx="5" fill="url(#rubberFoot)" stroke="#374151" strokeWidth="1.5" />
                <circle cx="450" cy="429" r="5" fill="#64748b" stroke="#000" strokeWidth="1" />
              </g>

              {/* Grupo animable del cuerpo del compresor (vibración mecánica contenida al comprimir) */}
              <g className={isCompressing ? 'compressor-running-vibration' : ''}>
                {/* Carcasa inferior semiesférica */}
                <path
                  d="M 170 230 C 170 370, 200 410, 325 410 C 450 410, 480 370, 480 230 Z"
                  fill="url(#body3D)"
                  stroke="#1f2937"
                  strokeWidth="2"
                />

                {/* Domo superior semiesférico */}
                <path
                  d="M 170 230 C 170 120, 210 75, 325 75 C 440 75, 480 120, 480 230 Z"
                  fill="url(#body3D)"
                  stroke="#1f2937"
                  strokeWidth="2"
                />

                {/* Capa de reflejo especular metálico brillante */}
                <path
                  d="M 180 230 C 180 135, 215 90, 325 90 C 435 90, 470 135, 470 230 C 470 355, 435 395, 325 395 C 215 395, 180 355, 180 230 Z"
                  fill="url(#metalSpec)"
                />

                {/* Cordón de soldadura circunferencial central reforzado */}
                <g id="weldSeam">
                  <ellipse cx="325" cy="230" rx="158" ry="14" fill="#0b0f19" stroke="#374151" strokeWidth="2" />
                  <ellipse cx="325" cy="230" rx="155" ry="11" fill="none" stroke="#4b5563" strokeWidth="2.5" strokeDasharray="6 3" />
                  <ellipse cx="325" cy="229" rx="154" ry="10" fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                </g>

                {/* Placa de características técnica metálica (Nameplate) */}
                <g id="nameplate" transform="translate(240, 255)">
                  <rect x="0" y="0" width="170" height="90" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                  <rect x="2" y="2" width="166" height="86" rx="4" fill="none" stroke="#334155" strokeWidth="1" />
                  {/* Remaches de fijación */}
                  <circle cx="8" cy="8" r="2.5" fill="#cbd5e1" stroke="#000" strokeWidth="0.5" />
                  <circle cx="162" cy="8" r="2.5" fill="#cbd5e1" stroke="#000" strokeWidth="0.5" />
                  <circle cx="8" cy="82" r="2.5" fill="#cbd5e1" stroke="#000" strokeWidth="0.5" />
                  <circle cx="162" cy="82" r="2.5" fill="#cbd5e1" stroke="#000" strokeWidth="0.5" />

                  {/* Textos de placa técnica */}
                  <text x="85" y="19" fill="#38bdf8" fontSize="10.5" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                    HERMETIC COMPRESSOR
                  </text>
                  <text x="12" y="36" fill="#94a3b8" fontSize="8" fontFamily="monospace">MOD: GL90TB • R134a / R600a</text>
                  <text x="12" y="49" fill="#94a3b8" fontSize="8" fontFamily="monospace">VOLT: 220-240V ~ 50Hz 1PH</text>
                  <text x="12" y="62" fill="#94a3b8" fontSize="8" fontFamily="monospace">LRA: 14.2A • THERMALLY PROT.</text>
                  <text x="12" y="76" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">POE OIL 300cc • HIGH TORQUE</text>
                </g>

                {/* Caja de bornes eléctricos y conexión hermética (Fusite C-R-S) */}
                <g id="terminalBox" transform="translate(140, 195)">
                  {/* Soporte y carcasa de baquelita/plástico ignífugo */}
                  <rect x="0" y="0" width="46" height="68" rx="6" fill="#030712" stroke="#475569" strokeWidth="2" filter="url(#innerDepth)" />
                  <rect x="5" y="5" width="36" height="58" rx="4" fill="#0b0f19" stroke="#1f2937" strokeWidth="1" />

                  {/* Bornes Fusite (Pasamuros de vidrio aislante sellado) */}
                  {/* Común C */}
                  <circle cx="23" cy="20" r="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="23" cy="20" r="2.5" fill="#fbbf24" />
                  <text x="23" y="12" fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">C</text>

                  {/* Run / Marcha R */}
                  <circle cx="14" cy="46" r="6" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
                  <circle cx="14" cy="46" r="2.5" fill="#4ade80" />
                  <text x="14" y="61" fill="#22c55e" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">R</text>

                  {/* Start / Arranque S */}
                  <circle cx="32" cy="46" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                  <circle cx="32" cy="46" r="2.5" fill="#60a5fa" />
                  <text x="32" y="61" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">S</text>
                </g>

                {/* ==================================================== */}
                {/* TUBERÍAS DE COBRE REALISTAS (Aspiración, Servicio, Descarga) */}
                {/* ==================================================== */}

                {/* 1. Tubería de Aspiración / Retorno (Lado Izquierdo - Tubo Grueso 3/8") */}
                <g id="suctionPipe">
                  {/* Zona de unión / boquilla soldada a carcasa */}
                  <path d="M 180 130 C 140 120, 100 130, 80 150" fill="none" stroke="#000000" strokeWidth="22" opacity="0.4" filter="url(#floorShadow)" />
                  <path d="M 182 128 C 145 115, 105 125, 80 150" fill="none" stroke="url(#copperPipe)" strokeWidth="18" strokeLinecap="round" />
                  <path d="M 182 128 C 145 115, 105 125, 80 150" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                  {/* Anillo de soldadura de plata */}
                  <ellipse cx="178" cy="130" rx="4" ry="11" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                  {/* Boca de tubo abierta */}
                  <ellipse cx="80" cy="150" rx="5" ry="9" fill="#451a03" stroke="#d97706" strokeWidth="1.5" />
                  <text x="75" y="175" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ASPIRACIÓN</text>
                  <text x="75" y="186" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">(3/8" Baja)</text>
                </g>

                {/* 2. Tubería de Servicio / Proceso (Lado Derecho - Carga de Gas 1/4") */}
                <g id="servicePipe">
                  <path d="M 465 145 C 505 135, 545 145, 570 170" fill="none" stroke="url(#copperPipe)" strokeWidth="14" strokeLinecap="round" />
                  <path d="M 465 145 C 505 135, 545 145, 570 170" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                  {/* Anillo de soldadura */}
                  <ellipse cx="468" cy="146" rx="3.5" ry="8.5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                  {/* Extremo cerrado o con válvula de obús */}
                  <ellipse cx="570" cy="170" rx="4" ry="7" fill="#451a03" stroke="#d97706" strokeWidth="1" />
                  <text x="575" y="195" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SERVICIO</text>
                  <text x="575" y="206" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">(1/4" Carga)</text>
                </g>

                {/* 3. Tubería de Descarga / Alta Presión (Superior - Tubo Fino 1/4" / 5/16" para prueba) */}
                <g id="dischargePipe">
                  {/* Cuello de salida vertical */}
                  <path d="M 370 85 L 370 30" fill="none" stroke="url(#copperPipe)" strokeWidth="13" strokeLinecap="square" />
                  <path d="M 368 85 L 368 30" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                  {/* Anillo de unión soldada a carcasa */}
                  <ellipse cx="370" cy="85" rx="9" ry="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

                  {/* Codo o boca de salida */}
                  <ellipse cx="370" cy="30" rx="6.5" ry="3.5" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />

                  {/* Cartela / Etiqueta de Descarga */}
                  <g transform="translate(390, 32)">
                    <rect x="0" y="0" width="85" height="24" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.2" />
                    <text x="42.5" y="13" fill="#fca5a5" fontSize="8.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">DESCARGA</text>
                    <text x="42.5" y="21" fill="#fecaca" fontSize="7" fontFamily="monospace" textAnchor="middle">(ALTA PRESIÓN)</text>
                  </g>

                  {/* CASO A: MÉTODO MANÓMETRO (Latiguillo rojo reforzado de alta presión conectado) */}
                  {methodType === 'gauge' && (
                    <g id="manifoldHoseAttachment">
                      {/* Acoplador rápido de latón moleteado */}
                      <rect x="362" y="20" width="16" height="15" rx="2" fill="#d97706" stroke="#fef08a" strokeWidth="1.5" />
                      <line x1="363" y1="25" x2="377" y2="25" stroke="#78350f" strokeWidth="1.5" />
                      <line x1="363" y1="30" x2="377" y2="30" stroke="#78350f" strokeWidth="1.5" />

                      {/* Manguera roja de 800 PSI con curva hacia el manómetro */}
                      <path
                        d="M 370 20 C 370 -20, 260 -30, 200 -10"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 370 20 C 370 -20, 260 -30, 200 -10"
                        fill="none"
                        stroke="#fca5a5"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    </g>
                  )}

                  {/* CASO B: MÉTODO TAPAR CON EL DEDO (Dedo índice realista presionando firmemente la descarga) */}
                  {methodType === 'finger' && (
                    <FingerSealingIllustration
                      currentPsi={currentPsi}
                      isCompressing={isCompressing}
                      isMeasuringRetention={isMeasuringRetention}
                      verdict={verdict}
                    />
                  )}

                  {/* Efecto de gas a presión / burbujas de proyección al comprimir en método manómetro */}
                  {methodType === 'gauge' && isCompressing && (
                    <g id="compressionGasEffects" className="animate-pulse">
                      <circle cx="370" cy="18" r="6" fill="#ef4444" opacity="0.7" />
                      <circle cx="370" cy="8" r="4.5" fill="#fbbf24" opacity="0.9" />
                      <circle cx="370" cy="-2" r="3" fill="#ffffff" opacity="0.8" />
                    </g>
                  )}
                </g>
              </g>
            </svg>
                </div>
              </ZoomPanViewer>
            </div>

            {/* Test Status Banner inside illustration */}
            <div className="w-full flex items-center justify-between text-[10.5px] font-mono px-3 py-1.5 bg-slate-950/95 border-t border-slate-800 shrink-0 z-10">
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
