import React, { useState, useEffect, useRef } from 'react';
import polimetroImg from '../assets/polimetro-transparent.png';
import { playMultimeterBuzzer, stopMultimeterBuzzer } from '../utils/audio';
import { Volume2, VolumeX, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export type KlixonTestType = '1-3';
export type KlixonCondition = 'cold' | 'tripped' | 'burned_resistor';
export type KlixonTerminalId = 1 | 3;

export interface KlixonTestSvgProps {
  className?: string;
  onOpenKlixonModal?: () => void;
}

interface TestConfig {
  label: string;
  shortLabel: string;
  description: string;
  terminals: [KlixonTerminalId, KlixonTerminalId];
  probeRedTerminal: KlixonTerminalId;
  probeBlackTerminal: KlixonTerminalId;
}

const TESTS: Record<KlixonTestType, TestConfig> = {
  '1-3': {
    label: 'Prueba 1-3: Circuito Serie Completo (Bornes Externos)',
    shortLabel: '1 - 3 (Serie Completa)',
    description: 'Comprueba el protector térmico entre sus dos bornes externos accesibles (1 y 3). El punto 2 es un nodo de unión interna sellado dentro de la cápsula (no accesible para punteras). En frío mide la serie completa de bimetal y calefactor (~2.3 Ω).',
    terminals: [1, 3],
    probeRedTerminal: 1,
    probeBlackTerminal: 3,
  },
};

const TERMINALS_INFO: Record<KlixonTerminalId, { x: number; y: number; label: string; desc: string }> = {
  1: { x: 202, y: 145, label: 'Borne 1', desc: 'Contacto Bimetal (Conexión Compresor C)' },
  3: { x: 144, y: 209, label: 'Borne 3', desc: 'Base Resistencia Calefactora (Conexión Línea)' },
};

export const KlixonTestSvg: React.FC<KlixonTestSvgProps> = ({
  className = '',
  onOpenKlixonModal: _onOpenKlixonModal,
}) => {
  const activeTest: KlixonTestType = '1-3';
  const [condition, setCondition] = useState<KlixonCondition>('cold');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Multimeter probe state: can be attached to external terminal 1 or 3 or null (in the air)
  const [redTerminal, setRedTerminal] = useState<KlixonTerminalId | null>(1);
  const [blackTerminal, setBlackTerminal] = useState<KlixonTerminalId | null>(3);
  const [redFreePos, setRedFreePos] = useState<{ x: number; y: number } | null>(null);
  const [blackFreePos, setBlackFreePos] = useState<{ x: number; y: number } | null>(null);
  const [draggingProbe, setDraggingProbe] = useState<'red' | 'black' | null>(null);
  const [hoveredTerminal, setHoveredTerminal] = useState<KlixonTerminalId | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentTest = TESTS[activeTest];

  // Multimeter DT832 Banana Jack coordinates in SVG space
  const mmRedJack = { x: 454.4, y: 183.9 };
  const mmBlackJack = { x: 454.4, y: 205.6 };

  // Determine current probe coordinates
  const redCoords = redTerminal ? TERMINALS_INFO[redTerminal] : redFreePos || { x: 300, y: 160 };
  const blackCoords = blackTerminal ? TERMINALS_INFO[blackTerminal] : blackFreePos || { x: 300, y: 220 };

  const isBothConnected = redTerminal !== null && blackTerminal !== null;
  const isMissionMatch =
    isBothConnected &&
    ((redTerminal === 1 && blackTerminal === 3) || (redTerminal === 3 && blackTerminal === 1));

  // Calculate measurement reading based on probe connections & Klixon condition
  let lcdDigits = '1 .';
  let lcdUnit = '';
  let isContinuityMode = false;
  let isBuzzerActive = false;
  let statusVerdict = '';
  let statusTone: 'success' | 'warning' | 'danger' = 'warning';

  if (!isBothConnected) {
    // Probes disconnected / in the air
    lcdDigits = '1 .';
    lcdUnit = '';
    isBuzzerActive = false;
    statusVerdict = 'PUNTERAS AL AIRE: Circuito abierto (O.L). Conecta las punteras 🔴 y ⚫ a los bornes externos 1 y 3 para medir.';
    statusTone = 'warning';
  } else if (redTerminal === blackTerminal) {
    // Both probes touching same terminal -> direct short circuit
    lcdDigits = '0.0';
    lcdUnit = 'Ω';
    isContinuityMode = true;
    isBuzzerActive = true;
    statusVerdict = `CORTOCIRCUITO DIRECTO: Ambas punteras en Borne ${redTerminal} = 0.0 Ω`;
    statusTone = 'success';
  } else {
    // Both probes connected to 1 and 3 (the only accessible external terminals)
    isContinuityMode = false;
    if (condition === 'cold') {
      lcdDigits = '2.3';
      lcdUnit = 'Ω';
      isBuzzerActive = false;
      statusVerdict = '✓ MEDIDA 1-3 CORRECTA: Protector en frío y en perfecto estado. Serie completa (Bimetal + Calefactor) = 2.3 Ω';
      statusTone = 'success';
    } else if (condition === 'tripped') {
      lcdDigits = '1 .';
      lcdUnit = '';
      isBuzzerActive = false;
      statusVerdict = 'DISPARADO POR CALOR (>105°C): Disco bimetálico interno abierto por sobretemperatura -> Circuito Abierto (O.L)';
      statusTone = 'warning';
    } else {
      // burned_resistor
      lcdDigits = '1 .';
      lcdUnit = '';
      isBuzzerActive = false;
      statusVerdict = 'CALEFACTOR QUEMADO: Resistencia interna abierta/fundida -> Circuito Abierto (O.L). Sustituir Klixon';
      statusTone = 'danger';
    }
  }

  // Handle acoustic buzzer for continuity
  useEffect(() => {
    if (soundEnabled && isBuzzerActive) {
      playMultimeterBuzzer(true);
      const timer = setTimeout(() => {
        stopMultimeterBuzzer();
      }, 350);
      return () => {
        clearTimeout(timer);
        stopMultimeterBuzzer();
      };
    } else {
      stopMultimeterBuzzer();
    }
  }, [soundEnabled, isBuzzerActive, activeTest, condition, redTerminal, blackTerminal]);

  // Coordinate transformation from screen pointer to SVG viewBox (520 x 280)
  const getSvgCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 520 / rect.width;
    const scaleY = 280 / rect.height;
    return {
      x: Math.max(20, Math.min(500, (e.clientX - rect.left) * scaleX)),
      y: Math.max(15, Math.min(265, (e.clientY - rect.top) * scaleY)),
    };
  };

  // Find nearest Klixon terminal within snap distance (28px) - only external terminals 1 and 3
  const getNearestTerminal = (pos: { x: number; y: number }): KlixonTerminalId | null => {
    const snapDistance = 28;
    let closest: KlixonTerminalId | null = null;
    let minD = snapDistance;

    for (const id of [1, 3] as KlixonTerminalId[]) {
      const tCoord = TERMINALS_INFO[id];
      const d = Math.hypot(tCoord.x - pos.x, tCoord.y - pos.y);
      if (d < minD) {
        minD = d;
        closest = id;
      }
    }
    return closest;
  };

  // Dragging event handlers
  const handleProbePointerDown = (probe: 'red' | 'black', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDraggingProbe(probe);

    const coords = getSvgCoords(e);
    if (probe === 'red') {
      setRedFreePos(coords);
      setRedTerminal(null);
    } else {
      setBlackFreePos(coords);
      setBlackTerminal(null);
    }
    setHoveredTerminal(getNearestTerminal(coords));
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = getSvgCoords(e);
    const nearest = getNearestTerminal(coords);
    setHoveredTerminal(nearest);

    if (draggingProbe === 'red') {
      setRedFreePos(coords);
    } else {
      setBlackFreePos(coords);
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = getSvgCoords(e);
    const nearest = getNearestTerminal(coords);

    if (draggingProbe === 'red') {
      if (nearest) {
        setRedTerminal(nearest);
        setRedFreePos(null);
      } else {
        setRedTerminal(null);
        setRedFreePos(coords);
      }
    } else {
      if (nearest) {
        setBlackTerminal(nearest);
        setBlackFreePos(null);
      } else {
        setBlackTerminal(null);
        setBlackFreePos(coords);
      }
    }

    setDraggingProbe(null);
    setHoveredTerminal(null);
  };

  // Click on a Borne directly to connect/toggle probe (only 1 and 3 are accessible)
  const handleTerminalClick = (id: KlixonTerminalId) => {
    if (redTerminal === id) {
      // Disconnect red
      setRedTerminal(null);
      setRedFreePos({ x: 300, y: 160 });
    } else if (blackTerminal === id) {
      // Disconnect black
      setBlackTerminal(null);
      setBlackFreePos({ x: 300, y: 220 });
    } else if (!redTerminal) {
      setRedTerminal(id);
      setRedFreePos(null);
    } else if (!blackTerminal) {
      setBlackTerminal(id);
      setBlackFreePos(null);
    } else {
      // Cycle red to clicked terminal
      setRedTerminal(id);
      setRedFreePos(null);
    }
  };

  const handleAutoConnectMission = () => {
    setRedTerminal(1);
    setBlackTerminal(3);
    setRedFreePos(null);
    setBlackFreePos(null);
  };

  const handleReleaseProbes = () => {
    setRedTerminal(null);
    setBlackTerminal(null);
    setRedFreePos({ x: 300, y: 160 });
    setBlackFreePos({ x: 300, y: 220 });
  };

  const handleSelectCondition = (cond: KlixonCondition) => {
    setCondition(cond);
  };

  // Compute probe angles pointing naturally towards terminal or multimeter jack
  const getProbeAngle = (pos: { x: number; y: number }, termId: KlixonTerminalId | null, isRed: boolean) => {
    if (termId === 1) return 26;
    if (termId === 3) return 140;
    const jack = isRed ? mmRedJack : mmBlackJack;
    const dx = jack.x - pos.x;
    const dy = jack.y - pos.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const redAngleDeg = getProbeAngle(redCoords, redTerminal, true);
  const redRad = (redAngleDeg * Math.PI) / 180;
  const redCableEnd = {
    x: redCoords.x + 28 * Math.cos(redRad),
    y: redCoords.y + 28 * Math.sin(redRad),
  };
  const redCp1 = { x: mmRedJack.x - 55, y: mmRedJack.y - 12 };
  const redCp2 = {
    x: redCableEnd.x + 40 * Math.cos(redRad),
    y: redCableEnd.y + 35 * Math.sin(redRad),
  };

  const blackAngleDeg = getProbeAngle(blackCoords, blackTerminal, false);
  const blackRad = (blackAngleDeg * Math.PI) / 180;
  const blackCableEnd = {
    x: blackCoords.x + 28 * Math.cos(blackRad),
    y: blackCoords.y + 28 * Math.sin(blackRad),
  };
  const blackCp1 = { x: mmBlackJack.x - 30, y: 268 };
  const blackCp2 = {
    x: blackCableEnd.x + 15,
    y: 272,
  };

  const isBimetalOpen = condition === 'tripped';
  const isResistorBurnt = condition === 'burned_resistor';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}>
      {/* 1. Misión de Medida Klixon (Bornes externos 1 y 3) */}
      <div className="w-full mb-1.5 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-1 mb-1 text-[10px] font-mono text-slate-400">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            MISIÓN DE MEDIDA KLIXON CON POLÍMETRO DIGITAL DT832:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleAutoConnectMission}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-700/80 text-blue-300 hover:text-white cursor-pointer"
              title="Colocar punteras automáticamente en los bornes externos 1 y 3"
            >
              <span>Auto-conectar (1 y 3)</span>
            </button>
            <button
              type="button"
              onClick={handleReleaseProbes}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Dejar punteras al aire para práctica libre"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Soltar</span>
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>Buzzer ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-slate-400" />
                  <span>Silencio</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-black font-mono bg-amber-400 text-black shadow-sm shrink-0">
              Prueba 1 - 3 (Bornes Externos)
            </span>
            <span className="text-[11px] text-slate-200 font-mono">
              Serie Bimetal + Calefactor = <strong className="text-emerald-400">~2.3 Ω</strong> en frío
            </span>
          </div>
          <span className="text-[10px] text-amber-300/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
            ℹ El punto 2 es unión interna sellada (no accesible para medir)
          </span>
        </div>
      </div>

      {/* 2. Selector de Estado de Fallo del Klixon */}
      <div className="w-full flex items-center justify-between gap-1 mb-1.5 bg-slate-900/80 p-1 rounded-md border border-slate-800 text-[10px] font-mono shrink-0">
        <span className="text-slate-400 px-1 font-bold shrink-0">ESTADO DEL KLIXON:</span>
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectCondition('cold')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
              condition === 'cold'
                ? 'bg-emerald-500 text-black shadow font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ✓ En Frío (Sano)
          </button>
          <button
            type="button"
            onClick={() => handleSelectCondition('tripped')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
              condition === 'tripped'
                ? 'bg-amber-500 text-black shadow font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 Disparado (Calor)
          </button>
          <button
            type="button"
            onClick={() => handleSelectCondition('burned_resistor')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
              condition === 'burned_resistor'
                ? 'bg-red-500 text-white shadow font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Calefactor Roto
          </button>
        </div>
      </div>

      {/* BANNER DINÁMICO DE VALIDACIÓN DE POSICIÓN CORRECTA */}
      <div
        className={`w-full mb-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center justify-between transition-all shrink-0 ${
          isMissionMatch
            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            : isBothConnected
            ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
            : 'bg-slate-900 border border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isMissionMatch ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                ¡POSICIÓN CORRECTA! Punteras en Bornes {currentTest.terminals[0]} y {currentTest.terminals[1]} -&gt; Medición activa en polímetro
              </span>
            </>
          ) : isBothConnected ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                Punteras en Bornes {redTerminal} y {blackTerminal}. Para {currentTest.shortLabel}, conecta a Bornes {currentTest.terminals[0]} y {currentTest.terminals[1]}.
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span className="truncate">
                Arrastra las punteras 🔴 y ⚫ a los bornes 1, 2 o 3 para medir en el polímetro
              </span>
            </>
          )}
        </div>
        <div className="text-[10px] text-slate-400 whitespace-nowrap pl-2">
          {redTerminal ? `🔴 B${redTerminal}` : '🔴 Aire'} | {blackTerminal ? `⚫ B${blackTerminal}` : '⚫ Aire'}
        </div>
      </div>

      {/* 3. SVG Principal: Esquema Klixon (Izquierda) + Polímetro DT832 Real (Derecha) */}
      <svg
        ref={svgRef}
        viewBox="0 0 520 280"
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerLeave={handleSvgPointerUp}
        className="w-full h-auto max-h-[360px] drop-shadow-2xl font-sans touch-none"
      >
        <defs>
          {/* Probe Needle Metallic Gradient */}
          <linearGradient id="klixonNeedleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Lead Drop Shadow */}
          <filter id="klixonLeadShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* High-contrast ambient glow for black cable */}
          <filter id="klixonBlackCableShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#94a3b8" floodOpacity="0.65" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#f8fafc" floodOpacity="0.4" />
          </filter>

          <filter id="klixonCorrectGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Fondo del módulo */}
        <rect
          x="4"
          y="4"
          width="512"
          height="272"
          rx="12"
          fill="#060b14"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Encabezado SVG */}
        <text
          x="18"
          y="22"
          fill="#94a3b8"
          fontSize="9"
          fontWeight="bold"
          fontFamily="monospace"
        >
          COMPROBACIÓN DEL PROTECTOR TÉRMICO (KLIXON) CON POLÍMETRO DIGITAL
        </text>

        {/* ================================================================= */}
        {/* LADO IZQUIERDO: ESQUEMA VECTORIAL KLIXON                         */}
        {/* ================================================================= */}
        <g id="klipson_schematic">
          {/* Círculo límite del cuerpo del Klixon (Línea punto-raya) */}
          <circle
            cx="150"
            cy="145"
            r="66"
            fill="#090e1a"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeDasharray="9 4 2.5 4"
          />

          {/* Líneas externas del circuito: */}
          {/* Línea desde Borne 1 hacia la derecha y hacia arriba */}
          <path
            d="M 212 145 L 240 145 L 240 25"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="square"
          />

          {/* Línea desde Borne 3 hacia la izquierda y hacia arriba */}
          <path
            d="M 125 209 L 45 209 L 45 25"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="square"
          />

          {/* =============================================================== */}
          {/* ARCO DEL DISCO BIMETÁLICO (ENTRE BORNE 2 Y BORNE 1)             */}
          {/* =============================================================== */}
          {!isBimetalOpen ? (
            /* Estado Normal / Frío: Arco cerrado de 2 a 1 con contacto firme */
            <g>
              <path
                d="M 108 145 A 42 40 0 0 1 192 145"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="192" cy="145" r="3.5" fill="#34d399" />
              {/* Círculo de contacto cerrado con animación nativa SVG sin fugas */}
              {isBothConnected && isMissionMatch && !isBimetalOpen && (
                <circle cx="192" cy="145" r="6" fill="none" stroke="#34d399" strokeWidth="1.2">
                  <animate attributeName="r" values="4; 8; 4" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9; 0.2; 0.9" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ) : (
            /* Estado Disparado / Caliente: El bimetal se curva y SE ABRE en el borne 1 */
            <g>
              <path
                d="M 108 145 C 118 100, 160 85, 182 120"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="182" cy="120" r="3.5" fill="#ef4444" />
              <line
                x1="182"
                y1="120"
                x2="192"
                y2="142"
                stroke="#f87171"
                strokeWidth="1.8"
                strokeDasharray="2 2"
              />
              <text x="198" y="118" fill="#ef4444" fontSize="9" fontWeight="900" fontFamily="monospace">
                ¡ABIERTO!
              </text>
            </g>
          )}

          {/* =============================================================== */}
          {/* RESISTENCIA CALEFACTORA (ZIG-ZAG DESDE NODO 2 A BORNE 3)         */}
          {/* =============================================================== */}
          {!isResistorBurnt ? (
            /* Resistencia Sana: Zig-zag continuo */
            <path
              d="M 108 152 L 118 163 L 109 173 L 126 183 L 117 193 L 133 201 L 128 209 L 163 209"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            /* Resistencia Quemada con corte y chispa */
            <g>
              <path
                d="M 108 152 L 118 163 L 109 173 L 117 178"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 124 190 L 133 201 L 128 209 L 163 209"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="117" y="187" fill="#ef4444" fontSize="11" fontWeight="bold">
                ⚡
              </text>
              <text x="88" y="196" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">
                FUNDIDA
              </text>
            </g>
          )}

          {/* Títulos en el esquema */}
          <text
            x="150"
            y="92"
            fill="#94a3b8"
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            DISCO BIMETÁLICO
          </text>
          <text
            x="148"
            y="178"
            fill="#fbbf24"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            RESISTENCIA CALEFACTORA
          </text>

          {/* =============================================================== */}
          {/* BORNES EXTERNOS (1 Y 3) Y NODO INTERNO (2 NO MEDIBLE)           */}
          {/* =============================================================== */}

          {/* BORNE 1 (EXTERNO Y MEDIBLE) */}
          {(() => {
            const isTarget = currentTest.terminals.includes(1);
            const isRedHere = redTerminal === 1;
            const isBlackHere = blackTerminal === 1;
            const isOccupied = isRedHere || isBlackHere;
            const isHovered = hoveredTerminal === 1;
            const isCorrect = isTarget && isOccupied && isMissionMatch;

            return (
              <g
                id="klixon-borne-1"
                className="cursor-pointer group"
                onClick={() => handleTerminalClick(1)}
              >
                <title>Borne 1 (Contacto externo bimetálico) - Haz clic o arrastra puntera aquí</title>

                {/* Zona táctil de clic */}
                <rect x="180" y="125" width="44" height="40" fill="transparent" />

                {/* Halo de posición correcta */}
                {isCorrect ? (
                  <circle
                    cx="202"
                    cy="145"
                    r="16"
                    fill="rgba(16, 185, 129, 0.35)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    filter="url(#klixonCorrectGlow)"
                  >
                    <animate attributeName="r" values="14; 18; 14" dur="2s" repeatCount="indefinite" />
                  </circle>
                ) : isHovered ? (
                  /* Imán de atracción de puntera */
                  <circle
                    cx="202"
                    cy="145"
                    r="17"
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38bdf8"
                    strokeWidth="2.8"
                    strokeDasharray="4 3"
                  >
                    <animate attributeName="stroke-dashoffset" values="0; 14" dur="1s" repeatCount="indefinite" />
                  </circle>
                ) : isTarget ? (
                  /* Borne objetivo para la misión actual */
                  <circle
                    cx="202"
                    cy="145"
                    r="14"
                    fill="rgba(245, 158, 11, 0.2)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                ) : null}

                <rect
                  x="192"
                  y="138"
                  width="20"
                  height="14"
                  fill={isOccupied ? '#10b981' : isTarget ? '#d97706' : '#1e293b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Etiqueta 1 */}
                <text
                  x="180"
                  y="135"
                  fill="#ffffff"
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  1
                </text>

                {isCorrect && (
                  <g transform="translate(202, 170)">
                    <rect x="-24" y="-8" width="48" height="15" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x="0" y="3" fill="#6ee7b7" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ✓ CORRECTA
                    </text>
                  </g>
                )}
              </g>
            );
          })()}

          {/* NODO 2: UNIÓN INTERNA SELLADA (NO ACCESIBLE PARA MEDICIÓN) */}
          <g id="klixon-nodo-2-interno" className="select-none pointer-events-none">
            {/* Punto de unión / remache bimetal-calefactor */}
            <circle
              cx="98"
              cy="145"
              r="6.5"
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth="2"
            />
            <circle cx="98" cy="145" r="2.5" fill="#cbd5e1" />

            {/* Cartela explicativa identificando que el nodo 2 es interno y no accesible */}
            <g transform="translate(30, 134)">
              <rect x="0" y="0" width="62" height="23" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1" opacity="0.95" />
              <text
                x="31"
                y="10"
                fill="#94a3b8"
                fontSize="7.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                2 (Unión interna)
              </text>
              <text
                x="31"
                y="19"
                fill="#f87171"
                fontSize="6.2"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                🚫 No accesible
              </text>
              <line x1="62" y1="11" x2="68" y2="11" stroke="#64748b" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
            </g>
          </g>

          {/* BORNE 3 (EXTERNO Y MEDIBLE) */}
          {(() => {
            const isTarget = currentTest.terminals.includes(3);
            const isRedHere = redTerminal === 3;
            const isBlackHere = blackTerminal === 3;
            const isOccupied = isRedHere || isBlackHere;
            const isHovered = hoveredTerminal === 3;
            const isCorrect = isTarget && isOccupied && isMissionMatch;

            return (
              <g
                id="klixon-borne-3"
                className="cursor-pointer group"
                onClick={() => handleTerminalClick(3)}
              >
                <title>Borne 3 (Conexión inferior resistencia calefactora) - Haz clic o arrastra puntera aquí</title>

                {/* Zona táctil de clic */}
                <rect x="115" y="195" width="55" height="40" fill="transparent" />

                {/* Halo de posición correcta */}
                {isCorrect ? (
                  <circle
                    cx="144"
                    cy="209"
                    r="16"
                    fill="rgba(16, 185, 129, 0.35)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    filter="url(#klixonCorrectGlow)"
                  >
                    <animate attributeName="r" values="14; 18; 14" dur="2s" repeatCount="indefinite" />
                  </circle>
                ) : isHovered ? (
                  /* Imán de atracción de puntera */
                  <circle
                    cx="144"
                    cy="209"
                    r="17"
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38bdf8"
                    strokeWidth="2.8"
                    strokeDasharray="4 3"
                  >
                    <animate attributeName="stroke-dashoffset" values="0; 14" dur="1s" repeatCount="indefinite" />
                  </circle>
                ) : isTarget ? (
                  /* Borne objetivo para la misión actual */
                  <circle
                    cx="144"
                    cy="209"
                    r="14"
                    fill="rgba(245, 158, 11, 0.2)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                ) : null}

                <rect
                  x="125"
                  y="202"
                  width="38"
                  height="14"
                  fill={isOccupied ? '#10b981' : isTarget ? '#d97706' : '#1e293b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Etiqueta 3 */}
                <text
                  x="175"
                  y="214"
                  fill="#ffffff"
                  fontSize="15"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  3
                </text>

                {isCorrect && (
                  <g transform="translate(144, 238)">
                    <rect x="-24" y="-8" width="48" height="15" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x="0" y="3" fill="#6ee7b7" fontSize="7.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                      ✓ CORRECTA
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </g>

        {/* ================================================================= */}
        {/* LADO DERECHO: POLÍMETRO DIGITAL REAL DT832                        */}
        {/* ================================================================= */}
        <g id="multimeter-dt832-unit" transform="translate(352, 10) scale(1.10) translate(-236, -6)">
          {/* Multimeter Image (Loaded from polimetro.png) */}
          <image
            href={polimetroImg}
            x="236"
            y="6"
            width="117"
            height="199.6"
            preserveAspectRatio="none"
            filter="drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45))"
          />

          {/* ACTIVE DYNAMIC LCD DISPLAY OVERLAY */}
          <rect
            x="256.4"
            y="25.2"
            width="71.6"
            height="22.8"
            rx="2"
            fill="#1c1917"
            opacity="0.92"
          />
          {/* LCD Screen Glass */}
          <rect
            x="257.4"
            y="26.0"
            width="69.6"
            height="21.2"
            rx="1.5"
            fill="#737763"
            stroke="#575b4a"
            strokeWidth="0.6"
          />
          {/* LCD Glass sheen */}
          <path
            d="M 258 26.6 L 326.5 26.6 L 316 32 L 258 32 Z"
            fill="#ffffff"
            opacity="0.16"
          />

          {/* LCD Top Mode Indicators */}
          <text x="261" y="32.8" fill="#202517" fontSize="4.8" fontWeight="bold" fontFamily="monospace">
            {isContinuityMode ? '▶|' : 'Ω'}
          </text>
          <text x="324" y="32.8" fill="#202517" fontSize="4.2" fontWeight="bold" textAnchor="end" fontFamily="monospace">
            {lcdDigits === '1 .' ? 'OL' : '200'}
          </text>

          {/* Active LCD Digital 7-Segment Readout Value */}
          <text
            x="319"
            y="44.2"
            fill="#10180a"
            fontSize="14"
            fontWeight="900"
            textAnchor="end"
            fontFamily="monospace"
            letterSpacing={lcdDigits === '1 .' ? '0.12em' : '0.02em'}
          >
            {lcdDigits}
          </text>
          {lcdUnit && (
            <text x="321" y="43.8" fill="#10180a" fontSize="6.5" fontWeight="bold" textAnchor="start" fontFamily="sans-serif">
              {lcdUnit}
            </text>
          )}

          {/* ROTARY SELECTOR KNOB */}
          <g id="multimeter-rotary-dial" className="select-none">
            {/* Yellow faceplate patch */}
            <path d="M 288.5,65 Q 293,63.5 297.5,65 L 296,75 Q 293,76 290,75 Z" fill="#ecb409" />

            {/* Outer bezel ring and skirt */}
            <circle cx="293.0" cy="109.0" r="34.0" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
            <circle cx="293.0" cy="109.0" r="32.0" fill="#c2410c" />
            <circle cx="293.0" cy="109.0" r="30.0" fill="#f97316" stroke="#ea580c" strokeWidth="0.8" />
            <circle cx="293.0" cy="109.0" r="24.5" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
            <circle cx="293.0" cy="109.0" r="22.5" fill="#fb923c" opacity="0.25" />

            {/* Raised Ergonomic Bar Pointer */}
            <g
              transform={`translate(293.0, 109.0) rotate(${isContinuityMode ? 157.5 : 200.0})`}
              className="transition-transform duration-300 ease-out"
            >
              <rect
                x="-4.0"
                y="-24"
                width="8.0"
                height="48"
                rx="4.0"
                fill="rgba(0,0,0,0.28)"
                transform="translate(1.2, 1.4)"
              />
              <polygon points="-4.0,-16 4.0,-16 2.2,-31 -2.2,-31" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
              <rect
                x="-4.0"
                y="-24"
                width="8.0"
                height="48"
                rx="4.0"
                fill="#fb923c"
                stroke="#c2410c"
                strokeWidth="1"
              />
              <polygon points="-2.2,-23 2.2,-23 0,-29" fill="#ffffff" />
              <line x1="0" y1="-19" x2="0" y2="19" stroke="#fed7aa" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="-2.0" y1="-15" x2="-2.0" y2="15" stroke="#ea580c" strokeWidth="0.7" strokeLinecap="round" />
              <line x1="2.0" y1="-15" x2="2.0" y2="15" stroke="#ea580c" strokeWidth="0.7" strokeLinecap="round" />
              <circle cx="0" cy="0" r="4.8" fill="#c2410c" />
              <circle cx="0" cy="0" r="2.8" fill="#ea580c" />
              <circle cx="0" cy="0" r="1.4" fill="#f97316" />
            </g>

            {/* Active Scale LED Indicator */}
            {isContinuityMode ? (
              <g transform="translate(308.9, 147.4)">
                <circle cx="0" cy="0" r="3.0" fill="#16a34a" stroke="#ffffff" strokeWidth="0.6">
                  <animate attributeName="opacity" values="0.7; 1; 0.7" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="0.9" fill="#ffffff" fontSize="2.4" fontWeight="900" textAnchor="middle">▶|</text>
              </g>
            ) : (
              <g transform="translate(279.3, 146.6)">
                <circle cx="0" cy="0" r="3.0" fill="#16a34a" stroke="#ffffff" strokeWidth="0.6">
                  <animate attributeName="opacity" values="0.7; 1; 0.7" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="1.0" fill="#ffffff" fontSize="2.8" fontWeight="900" textAnchor="middle">Ω</text>
              </g>
            )}
          </g>

          {/* Multimeter Banana Jacks */}
          <g transform="translate(329.1, 146.5)">
            <circle cx="0" cy="0" r="4.8" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" opacity="0.9" />
            <circle cx="0" cy="0" r="2.2" fill="#262626" />
          </g>

          {/* VΩmA Jack Socket (Red probe plug) */}
          <g transform="translate(329.1, 164.1)">
            <circle cx="0" cy="0" r="5.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
            <circle cx="0" cy="0" r="3" fill="#b91c1c" />
            <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#7f1d1d" opacity="0.95" />
            <circle cx="0" cy="0" r="1.5" fill="#fca5a5" opacity="0.8" />
          </g>

          {/* COM Jack Socket (Black probe plug) */}
          <g transform="translate(329.1, 183.8)">
            <circle cx="0" cy="0" r="5.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="0" cy="0" r="3" fill="#09090b" />
            <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#030712" opacity="0.95" />
            <circle cx="0" cy="0" r="1.5" fill="#94a3b8" opacity="0.8" />
          </g>
        </g>

        {/* ================================================================= */}
        {/* CABLES DE PRUEBA FLEXIBLES DINÁMICOS Y PUNTERAS MÓVILES          */}
        {/* ================================================================= */}

        {/* CABLE NEGRO (Desde Borne COM jack hasta punta de prueba negra) */}
        <path
          d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${blackCp1.x} ${blackCp1.y}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity="0.85"
          filter="url(#klixonBlackCableShadow)"
        />
        <path
          d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${blackCp1.x} ${blackCp1.y}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
          fill="none"
          stroke="#0f172a"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${blackCp1.x} ${blackCp1.y}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* PUNTERA NEGRA (ARRASTRABLE CON EL DEDO O RATÓN) */}
        <g
          transform={`translate(${blackCoords.x}, ${blackCoords.y}) rotate(${blackAngleDeg})`}
          onPointerDown={(e) => handleProbePointerDown('black', e)}
          className="cursor-grab active:cursor-grabbing group select-none"
          filter="drop-shadow(0 0 5px rgba(56, 189, 248, 0.7))"
        >
          {/* Zona táctil de agarre generosa */}
          <rect x="-8" y="-14" width="46" height="28" rx="6" fill="transparent" />

          {/* Halo de arrastre activo */}
          {draggingProbe === 'black' && (
            <rect
              x="5"
              y="-8"
              width="30"
              height="16"
              rx="4"
              fill="rgba(56, 189, 248, 0.3)"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}

          <line x1="0" y1="0" x2="8" y2="0" stroke="url(#klixonNeedleGrad)" strokeWidth="2" strokeLinecap="round" />
          <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" />
          <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
          <line x1="14" y1="-2" x2="14" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="18" y1="-2" x2="18" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="22" y1="-2" x2="22" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="0.5" />

          {/* Chispa / punto de contacto con animación nativa SVG sin fugas */}
          {blackTerminal && (
            <circle cx="0" cy="0" r="3.2" fill="#38bdf8" opacity="0.85">
              <animate attributeName="r" values="2.5; 4.5; 2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Etiqueta visible de arrastre */}
          <text x="18" y="-7" fill="#f8fafc" stroke="#020617" strokeWidth="0.5" fontSize="4.8" fontWeight="bold" textAnchor="middle">
            {blackTerminal ? `⚫ B${blackTerminal}` : 'Mover ⚫'}
          </text>
        </g>

        {/* CABLE ROJO (Desde Borne VΩmA jack hasta punta de prueba roja) */}
        <path
          d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${redCp1.x} ${redCp1.y}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
          fill="none"
          stroke="#dc2626"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#klixonLeadShadow)"
        />
        <path
          d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${redCp1.x} ${redCp1.y}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* PUNTERA ROJA (ARRASTRABLE CON EL DEDO O RATÓN) */}
        <g
          transform={`translate(${redCoords.x}, ${redCoords.y}) rotate(${redAngleDeg})`}
          onPointerDown={(e) => handleProbePointerDown('red', e)}
          className="cursor-grab active:cursor-grabbing group select-none"
          filter="drop-shadow(0 0 5px rgba(239, 68, 68, 0.7))"
        >
          {/* Zona táctil de agarre generosa */}
          <rect x="-8" y="-14" width="46" height="28" rx="6" fill="transparent" />

          {/* Halo de arrastre activo */}
          {draggingProbe === 'red' && (
            <rect
              x="5"
              y="-8"
              width="30"
              height="16"
              rx="4"
              fill="rgba(239, 68, 68, 0.35)"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          )}

          <line x1="0" y1="0" x2="8" y2="0" stroke="url(#klixonNeedleGrad)" strokeWidth="2" strokeLinecap="round" />
          <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.8" />
          <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          <line x1="14" y1="-2" x2="14" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <line x1="18" y1="-2" x2="18" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <line x1="22" y1="-2" x2="22" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#7f1d1d" />

          {/* Chispa / punto de contacto con animación nativa SVG sin fugas */}
          {redTerminal && (
            <circle cx="0" cy="0" r="3.2" fill="#f87171" opacity="0.85">
              <animate attributeName="r" values="2.5; 4.5; 2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Etiqueta visible de arrastre */}
          <text x="18" y="-7" fill="#ffffff" stroke="#020617" strokeWidth="0.5" fontSize="4.8" fontWeight="bold" textAnchor="middle">
            {redTerminal ? `🔴 B${redTerminal}` : 'Mover 🔴'}
          </text>
        </g>
      </svg>

      {/* 4. Tarjeta Informativa Inferior de Diagnóstico Técnico */}
      <div
        className={`w-full mt-1.5 p-2 rounded-lg border text-left font-mono transition-colors shrink-0 ${
          statusTone === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            : statusTone === 'warning'
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            : 'bg-red-950/40 border-red-800/80 text-red-300'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-[11px] flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                statusTone === 'success'
                  ? 'bg-emerald-400'
                  : statusTone === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            ></span>
            <span>{statusVerdict}</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-300 mt-1 font-sans">
          {currentTest.description}
        </p>
      </div>
    </div>
  );
};
