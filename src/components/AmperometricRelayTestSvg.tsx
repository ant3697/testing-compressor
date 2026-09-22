import React, { useState, useEffect, useRef } from 'react';
import polimetroImg from '../assets/polimetro-transparent.png';
import { playMultimeterBuzzer, stopMultimeterBuzzer } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export type RelayPosition = 'vertical' | 'inverted';
export type RelayFaultState = 'normal' | 'stuck_closed' | 'stuck_open';
export type CheckPointId = 'P1' | 'P2' | 'P3';
export type TestMissionId = 'contacts' | 'coil' | 'isolation' | 'free';

interface CheckPointDef {
  id: CheckPointId;
  name: string;
  terminalCode: string;
  role: string;
  verticalPos: { x: number; y: number };
  invertedPos: { x: number; y: number };
}

const CHECK_POINTS: Record<CheckPointId, CheckPointDef> = {
  P1: {
    id: 'P1',
    name: 'P1',
    terminalCode: 'L (Línea Común)',
    role: 'Borne común de entrada (une la alimentación del contacto y de la bobina de intensidad)',
    verticalPos: { x: 55, y: 140 },
    invertedPos: { x: 55, y: 140 },
  },
  P2: {
    id: 'P2',
    name: 'P2',
    terminalCode: 'S (Arranque / Aux)',
    role: 'Borne salida contacto móvil -> devanado auxiliar de arranque',
    verticalPos: { x: 245, y: 70 },
    invertedPos: { x: 245, y: 220 },
  },
  P3: {
    id: 'P3',
    name: 'P3',
    terminalCode: 'R (Marcha / Principal)',
    role: 'Borne salida bobina de intensidad -> devanado de marcha',
    verticalPos: { x: 245, y: 240 },
    invertedPos: { x: 245, y: 65 },
  },
};

export interface AmperometricRelayTestSvgProps {
  className?: string;
}

export const AmperometricRelayTestSvg: React.FC<AmperometricRelayTestSvgProps> = ({
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Relay physical orientation and fault simulator
  const [position, setPosition] = useState<RelayPosition>('vertical');
  const [faultState, setFaultState] = useState<RelayFaultState>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Selected guided test mission
  const [mission, setMission] = useState<TestMissionId>('contacts');

  // Probe positions: either attached to a CheckPointId or positioned freely at (x, y)
  const [redBorna, setRedBorna] = useState<CheckPointId | null>('P2');
  const [blackBorna, setBlackBorna] = useState<CheckPointId | null>('P1');
  const [redFreePos, setRedFreePos] = useState<{ x: number; y: number } | null>(null);
  const [blackFreePos, setBlackFreePos] = useState<{ x: number; y: number } | null>(null);

  // Dragging state
  const [draggingProbe, setDraggingProbe] = useState<'red' | 'black' | null>(null);
  const [hoveredBorna, setHoveredBorna] = useState<CheckPointId | null>(null);

  const isVertical = position === 'vertical';

  // Multimeter DT832 Banana Jack coordinates
  // Transformed by: translate(352, 10) scale(1.10) translate(-236, -6)
  const mmRedJack = { x: 454.4, y: 183.9 };
  const mmBlackJack = { x: 454.4, y: 205.6 };

  // Helper to get coordinates of a CheckPoint based on current orientation
  const getBornaCoords = (id: CheckPointId) => {
    return isVertical ? CHECK_POINTS[id].verticalPos : CHECK_POINTS[id].invertedPos;
  };

  // Current coordinates for Red and Black probes
  const redCoords = redFreePos ? redFreePos : redBorna ? getBornaCoords(redBorna) : { x: 310, y: 175 };
  const blackCoords = blackFreePos ? blackFreePos : blackBorna ? getBornaCoords(blackBorna) : { x: 310, y: 225 };

  // Evaluate whether current probe connection matches the guided mission
  const isMissionMatch = (() => {
    if (!redBorna || !blackBorna) return false;
    const pair = [redBorna, blackBorna].sort().join('-');
    if (mission === 'contacts') return pair === 'P1-P2';
    if (mission === 'coil') return pair === 'P1-P3';
    if (mission === 'isolation') return pair === 'P2-P3';
    return true; // in 'free' mode, any connection is valid
  })();

  const isBothConnected = redBorna !== null && blackBorna !== null;

  // Determine multimeter LCD display values based on connected bornas and conditions
  let lcdDigits = '1 .';
  let lcdUnit = '';
  let isContinuity = false;
  let isBuzzerActive = false;
  let statusVerdict = '';
  let statusTone: 'success' | 'warning' | 'danger' = 'warning';

  if (!isBothConnected) {
    // At least one probe in the air
    lcdDigits = '1 .';
    lcdUnit = '';
    isContinuity = false;
    isBuzzerActive = false;
    statusVerdict = 'PUNTERAS AL AIRE: Circuito abierto (O.L). Arrastra las punteras hasta las bornas.';
    statusTone = 'warning';
  } else if (redBorna === blackBorna) {
    // Both probes touching same terminal -> direct short
    lcdDigits = '0.0';
    lcdUnit = 'Ω';
    isContinuity = true;
    isBuzzerActive = true;
    statusVerdict = `CORTOCIRCUITO DIRECTO: Ambas punteras en ${CHECK_POINTS[redBorna].name} (${CHECK_POINTS[redBorna].terminalCode}) = 0.0 Ω`;
    statusTone = 'success';
  } else {
    const pair = [redBorna, blackBorna].sort().join('-');
    if (pair === 'P1-P2') {
      // CONTACTS TEST (L - S)
      if (faultState === 'stuck_closed') {
        lcdDigits = '0.0';
        lcdUnit = 'Ω';
        isContinuity = true;
        isBuzzerActive = true;
        statusVerdict = '¡AVERÍA! Contactos pegados/soldados: Dan 0.0 Ω en vertical (quemaría el devanado arranque)';
        statusTone = 'danger';
      } else if (faultState === 'stuck_open') {
        lcdDigits = '1 .';
        lcdUnit = '';
        isContinuity = false;
        isBuzzerActive = false;
        statusVerdict = '¡AVERÍA! Émbolo trabado o carbonizado: No cierra al invertir (el compresor no arrancará)';
        statusTone = 'danger';
      } else {
        if (isVertical) {
          lcdDigits = '1 .';
          lcdUnit = '';
          isContinuity = false;
          isBuzzerActive = false;
          statusVerdict = '✓ POSICIÓN CORRECTA (P1-P2 Vertical): Contactos abiertos por gravedad en reposo -> O.L ("1 .")';
          statusTone = 'success';
        } else {
          lcdDigits = '0.0';
          lcdUnit = 'Ω';
          isContinuity = true;
          isBuzzerActive = true;
          statusVerdict = '✓ POSICIÓN CORRECTA (P1-P2 Invertido): Émbolo cae por gravedad y CIERRA contactos -> 0.0 Ω (Pitido)';
          statusTone = 'success';
        }
      }
    } else if (pair === 'P1-P3') {
      // COIL TEST (L - R)
      lcdDigits = '0.3';
      lcdUnit = 'Ω';
      isContinuity = false;
      isBuzzerActive = false;
      statusVerdict = '✓ POSICIÓN CORRECTA (P1-P3): Bobina de intensidad sana, hilo de cobre grueso calibrado a 0.3 Ω';
      statusTone = 'success';
    } else if (pair === 'P2-P3') {
      // S TO R (CONTACT + COIL)
      if (isVertical) {
        lcdDigits = '1 .';
        lcdUnit = '';
        isContinuity = false;
        isBuzzerActive = false;
        statusVerdict = '✓ POSICIÓN CORRECTA (P2-P3 Vertical): Contacto P1-P2 abierto en reposo -> Circuito abierto O.L ("1 .")';
        statusTone = 'success';
      } else {
        lcdDigits = '0.3';
        lcdUnit = 'Ω';
        isContinuity = false;
        isBuzzerActive = false;
        statusVerdict = '✓ POSICIÓN CORRECTA (P2-P3 Invertido): Contacto P1-P2 cerrado (0 Ω) + Bobina P1-P3 (0.3 Ω) = 0.3 Ω';
        statusTone = 'success';
      }
    } else {
      lcdDigits = '1 .';
      lcdUnit = '';
      isContinuity = false;
      isBuzzerActive = false;
      statusVerdict = `MEDICIÓN LIBRE (${redBorna}-${blackBorna}): Circuito abierto -> O.L ("1 .")`;
      statusTone = 'warning';
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
  }, [soundEnabled, isBuzzerActive, position, faultState, redBorna, blackBorna]);

  // Coordinate transformation from screen to SVG viewBox (520 x 280)
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

  // Find nearest check point within snap distance
  const getNearestBorna = (pos: { x: number; y: number }): CheckPointId | null => {
    const snapDistance = 30;
    let closest: CheckPointId | null = null;
    let minD = snapDistance;

    for (const id of ['P1', 'P2', 'P3'] as CheckPointId[]) {
      const bCoord = getBornaCoords(id);
      const d = Math.hypot(bCoord.x - pos.x, bCoord.y - pos.y);
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
      setRedBorna(null);
    } else {
      setBlackFreePos(coords);
      setBlackBorna(null);
    }
    setHoveredBorna(getNearestBorna(coords));
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = getSvgCoords(e);
    const nearest = getNearestBorna(coords);
    setHoveredBorna(nearest);

    if (draggingProbe === 'red') {
      setRedFreePos(coords);
    } else {
      setBlackFreePos(coords);
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = getSvgCoords(e);
    const nearest = getNearestBorna(coords);

    if (draggingProbe === 'red') {
      if (nearest) {
        setRedBorna(nearest);
        setRedFreePos(null);
      } else {
        setRedBorna(null);
        setRedFreePos(coords);
      }
    } else {
      if (nearest) {
        setBlackBorna(nearest);
        setBlackFreePos(null);
      } else {
        setBlackBorna(null);
        setBlackFreePos(coords);
      }
    }

    setDraggingProbe(null);
    setHoveredBorna(null);
  };

  // Click on a Borna directly to connect the active probe
  const handleBornaClick = (id: CheckPointId) => {
    if (redBorna === id) {
      // Disconnect red
      setRedBorna(null);
      setRedFreePos({ x: 320, y: 175 });
    } else if (blackBorna === id) {
      // Disconnect black
      setBlackBorna(null);
      setBlackFreePos({ x: 320, y: 225 });
    } else if (!redBorna) {
      setRedBorna(id);
      setRedFreePos(null);
    } else if (!blackBorna) {
      setBlackBorna(id);
      setBlackFreePos(null);
    } else {
      // Default: cycle red to new borna
      setRedBorna(id);
      setRedFreePos(null);
    }
  };

  // Preset button to place probes on target terminals instantly
  const setPresetPair = (red: CheckPointId, black: CheckPointId, missionId: TestMissionId) => {
    setMission(missionId);
    setRedBorna(red);
    setRedFreePos(null);
    setBlackBorna(black);
    setBlackFreePos(null);
  };

  // Disconnect probes to table
  const disconnectProbes = () => {
    setRedBorna(null);
    setBlackBorna(null);
    setRedFreePos({ x: 320, y: 175 });
    setBlackFreePos({ x: 320, y: 225 });
  };

  // Calculate probe angles and smooth Bezier cable paths
  const redAngleDeg = redCoords.x < 150 ? 140 : redCoords.y < 120 ? 25 : 30;
  const redRad = (redAngleDeg * Math.PI) / 180;
  const redCableEnd = {
    x: redCoords.x + 28 * Math.cos(redRad),
    y: redCoords.y + 28 * Math.sin(redRad),
  };
  const redCp1 = { x: mmRedJack.x - 55, y: mmRedJack.y - 10 };
  const redCp2 = {
    x: redCableEnd.x + 35 * Math.cos(redRad),
    y: redCableEnd.y + 35 * Math.sin(redRad),
  };

  const blackAngleDeg = blackCoords.x < 150 ? 155 : 35;
  const blackRad = (blackAngleDeg * Math.PI) / 180;
  const blackCableEnd = {
    x: blackCoords.x + 28 * Math.cos(blackRad),
    y: blackCoords.y + 28 * Math.sin(blackRad),
  };
  const blackCp1 = { x: mmBlackJack.x - 30, y: 270 };
  const blackCp2 = {
    x: blackCableEnd.x - 15,
    y: 275,
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}>
      {/* 1. Barra de Controles: Posición del Relé + Zumbador */}
      <div className="w-full mb-1.5 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-1 mb-1 text-[10px] font-mono text-slate-400">
          <span className="font-bold text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            COMPROBACIÓN DEL RELÉ DE INTENSIDAD (R. INT):
          </span>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span>Zumbador ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-slate-400" />
                <span>Silenciado</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setPosition('vertical')}
            className={`py-1.5 px-2 rounded text-center font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isVertical
                ? 'bg-amber-400 text-black font-black shadow-md ring-1 ring-amber-500'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="text-[11px] font-black leading-tight">1. Posición Vertical</div>
              <div className="text-[9px] opacity-80">Trabajo: Contactos Abiertos (O.L)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPosition('inverted')}
            className={`py-1.5 px-2 rounded text-center font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !isVertical
                ? 'bg-emerald-500 text-black font-black shadow-md ring-1 ring-emerald-600'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="text-[11px] font-black leading-tight">2. Invertido 180°</div>
              <div className="text-[9px] opacity-80">Boca abajo: Émbolo Cierra (0.0 Ω)</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE MISIÓN INTERACTIVA Y POSICIÓN CORRECTA */}
      <div className="w-full flex flex-col gap-1 mb-1.5 bg-slate-900/90 p-1.5 rounded-md border border-slate-800 text-[10px] font-mono shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1 text-slate-400">
            <span className="font-bold text-amber-400">MISIÓN:</span>
            <button
              type="button"
              onClick={() => setPresetPair('P2', 'P1', 'contacts')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                mission === 'contacts'
                  ? 'bg-blue-600 text-white font-black ring-1 ring-blue-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              1. Contactos (P1 - P2)
            </button>
            <button
              type="button"
              onClick={() => setPresetPair('P3', 'P1', 'coil')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                mission === 'coil'
                  ? 'bg-blue-600 text-white font-black ring-1 ring-blue-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              2. Bobina (P1 - P3)
            </button>
            <button
              type="button"
              onClick={() => setPresetPair('P3', 'P2', 'isolation')}
              className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                mission === 'isolation'
                  ? 'bg-purple-600 text-white font-black ring-1 ring-purple-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              3. Contacto a Marcha (P2 - P3)
            </button>
            <button
              type="button"
              onClick={disconnectProbes}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white text-[9px] cursor-pointer"
              title="Separar punteras en el aire"
            >
              Soltar punteras
            </button>
          </div>

          {/* Estado de conexión de las punteras */}
          <div className="flex items-center gap-1 text-[9px]">
            <span className={`px-1.5 py-0.5 rounded font-bold ${redBorna ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-400'}`}>
              🔴 Roja: {redBorna ? `${redBorna}` : 'Al aire'}
            </span>
            <span className={`px-1.5 py-0.5 rounded font-bold ${blackBorna ? 'bg-slate-200 text-slate-900 border border-white' : 'bg-slate-800 text-slate-400'}`}>
              ⚫ Negra: {blackBorna ? `${blackBorna}` : 'Al aire'}
            </span>
          </div>
        </div>

        {/* Indicador de POSICIÓN CORRECTA / ALERTA DE PUNTERAS */}
        <div
          className={`flex items-center justify-between px-2 py-1 rounded border text-[10px] font-bold transition-all ${
            isMissionMatch && isBothConnected
              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-900/30'
              : isBothConnected
              ? 'bg-blue-950/70 border-blue-500 text-blue-300'
              : 'bg-amber-950/40 border-amber-600/60 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isMissionMatch && isBothConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span className="font-black tracking-wide text-emerald-200">
                  ¡POSICIÓN CORRECTA!
                </span>
                <span className="font-normal text-emerald-300 hidden sm:inline">
                  Punteras conectadas a bornes {redBorna} y {blackBorna} -&gt; Medición activa en el polímetro
                </span>
              </>
            ) : isBothConnected ? (
              <>
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Punteras en {redBorna} y {blackBorna} (Medición libre activa)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  ARRASTRA LAS PUNTERAS: Sujeta las puntas 🔴 y ⚫ y colócalas sobre las bornas {mission === 'contacts' ? 'P1 y P2' : mission === 'coil' ? 'P1 y P3' : 'P2 y P3'}.
                </span>
              </>
            )}
          </div>
          <span className="text-[9px] opacity-80 font-mono">
            {draggingProbe ? `Moviendo punta ${draggingProbe === 'red' ? 'roja' : 'negra'}...` : 'Arrastra o toca para medir'}
          </span>
        </div>
      </div>

      {/* 3. SVG PRINCIPAL: Esquema Interactivo con Punteras Móviles por Arrastre */}
      <svg
        ref={svgRef}
        viewBox="0 0 520 280"
        className="w-full h-auto max-h-[360px] drop-shadow-2xl font-sans select-none touch-none"
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
        style={{ touchAction: 'none' }}
      >
        <defs>
          <linearGradient id="relayNeedleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <filter id="relayLeadShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          <filter id="relayBlackCableShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#94a3b8" floodOpacity="0.65" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#f8fafc" floodOpacity="0.4" />
          </filter>

          <filter id="testPointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.9" />
          </filter>

          <filter id="correctBornaGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#10b981" floodOpacity="1" />
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
          COMPROBACIÓN DEL RELÉ DE INTENSIDAD (R. INT) - ARRASTRA LAS PUNTERAS A LAS BORNAS
        </text>

        {/* ================================================================= */}
        {/* LADO IZQUIERDO: ESQUEMA DEL RELÉ DE INTENSIDAD                    */}
        {/* ================================================================= */}
        <g id="amperometric_relay_schematic">
          <rect
            x="35"
            y="35"
            width="240"
            height="228"
            rx="16"
            fill="#090e1a"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {isVertical ? (
            /* POSICIÓN 1: VERTICAL NORMAL (REPOSO) */
            <g id="relay_vertical_group">
              <text x="155" y="52" fill="#94a3b8" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                POSICIÓN 1: VERTICAL NORMAL (REPOSO)
              </text>

              {/* TERMINALES FIJOS Y UNIÓN P1-P3 */}
              {/* Borne P1 (x=55, y=140) hacia nodo de unión común en (85, 140) */}
              <path d="M 50 140 L 85 140" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

              {/* Nodo de unión común P1 (alimenta contacto móvil y bobina) */}
              <circle cx="85" cy="140" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
              <text x="85" y="131" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                Unión P1
              </text>

              {/* Rama hacia arriba desde unión P1 al contacto izquierdo fijo en (105, 70) */}
              <path d="M 85 140 L 85 70 L 105 70" fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="105" cy="70" r="5.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Contacto derecho fijo en (205, 70) hacia Borne P2 en (245, 70) */}
              <circle cx="205" cy="70" r="5.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M 205 70 L 260 70" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

              {/* PUENTE MÓVIL Y ÉMBOLO: DISTANCIADO Y SEPARADO DE LOS CONTACTOS */}
              {faultState === 'stuck_closed' ? (
                <g id="stuck_closed_bridge">
                  {/* Barra puente móvil soldada reposando sobre los contactos fijos */}
                  <path d="M 96 64 L 214 64" fill="none" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                  <circle cx="105" cy="67" r="3.5" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                  <circle cx="205" cy="67" r="3.5" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                  <line x1="155" y1="64" x2="155" y2="150" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" />
                  {/* Punto de soldadura/contacto en la interfase y=70 */}
                  <ellipse cx="105" cy="70" rx="5" ry="2" fill="#ef4444" opacity="0.85" />
                  <ellipse cx="205" cy="70" rx="5" ry="2" fill="#ef4444" opacity="0.85" />
                  <text x="155" y="58" fill="#ef4444" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                    ¡CONTACTOS SOLDADOS! (0.0 Ω)
                  </text>
                </g>
              ) : (
                /* CONTACTOS SEPARADOS Y DISTANCIADOS POR GRAVEDAD (GAP DE 42px) */
                <g id="separated_contacts_group">
                  {/* Zona de separación delimitada con línea indicadora */}
                  <rect x="90" y="74" width="130" height="34" rx="4" fill="rgba(245, 158, 11, 0.04)" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 2" />

                  {/* Barra puente móvil reposando abajo en y=112 */}
                  <path d="M 95 112 L 215 112" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="105" cy="112" r="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                  <circle cx="205" cy="112" r="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

                  {/* Vástago del émbolo que baja hacia el núcleo de la bobina */}
                  <line x1="155" y1="112" x2="155" y2="175" stroke="#64748b" strokeWidth="2.2" strokeDasharray="4 3" />

                  {/* Flechas indicadoras de caída por gravedad separando los contactos */}
                  <polygon points="155,94 151,87 159,87" fill="#f59e0b" />
                  <polygon points="115,92 112,86 118,86" fill="#f59e0b" />
                  <polygon points="195,92 192,86 198,86" fill="#f59e0b" />

                  {/* Textos explicativos en el espacio distanciado */}
                  <text x="155" y="85" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    ABIERTO (O.L)
                  </text>
                  <text x="155" y="105" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
                    Contactos distanciados por gravedad
                  </text>
                </g>
              )}

              {/* BOBINA DE INTENSIDAD (Alimentada desde unión P1 en (85, 140) y saliendo a P3 en (245, 240)) */}
              <g id="coil_vertical">
                {/* Conexión desde el nodo de unión P1 a la entrada de la bobina */}
                <path d="M 85 140 L 155 140" fill="none" stroke="#64748b" strokeWidth="3.5" />
                <path
                  d="M 155 140 L 115 155 L 195 170 L 115 185 L 195 200 L 155 215"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M 155 215 L 155 240 L 260 240" fill="none" stroke="#64748b" strokeWidth="3.5" />
                <text x="155" y="230" fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BOBINA INTENSIDAD (P1-P3)
                </text>
              </g>

              {/* Etiquetas informativas del circuito */}
              <text x="50" y="160" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Línea (L)
              </text>
              <text x="200" y="60" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Arr. (S)
              </text>
              <text x="200" y="254" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Marcha (R)
              </text>
            </g>
          ) : (
            /* POSICIÓN 2: INVERTIDO 180° (BOCA ABAJO) */
            <g id="relay_inverted_group">
              <text x="155" y="52" fill="#10b981" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                POSICIÓN 2: INVERTIDO 180° (BOCA ABAJO)
              </text>

              {/* BOBINA (ARRIBA EN INVERTIDO) */}
              <g id="coil_inverted">
                <path d="M 155 60 L 155 65 L 260 65" fill="none" stroke="#64748b" strokeWidth="3.5" />
                <path
                  d="M 155 65 L 115 80 L 195 95 L 115 110 L 195 125 L 155 140"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M 85 140 L 155 140" fill="none" stroke="#64748b" strokeWidth="3.5" />
                <text x="155" y="60" fill="#38bdf8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BOBINA (P1-P3)
                </text>
              </g>

              {/* Unión P1 en posición invertida */}
              <path d="M 50 140 L 85 140" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="85" cy="140" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
              <text x="85" y="152" fill="#38bdf8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                Unión P1
              </text>

              {/* Vástago del émbolo descendiendo hacia los contactos */}
              <line x1="155" y1="140" x2="155" y2="206" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 3" />
              <polygon points="155,190 151,182 159,182" fill="#10b981" />
              <text x="155" y="180" fill="#10b981" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                ↓ PESO DEL ÉMBOLO
              </text>

              {/* TERMINALES FIJOS INFERIORES (Soportes y pastillas fijas de contacto) */}
              {/* Rama desde Unión P1 bajando al soporte del contacto izquierdo en (105, 220) */}
              <path d="M 85 140 L 85 220 L 105 220" fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinejoin="round" />
              {/* Soporte fijo y pastilla inferior izquierda */}
              <rect x="98" y="215" width="14" height="8" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="105" cy="219" r="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <path d="M 100 215 L 110 215" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

              {/* Soporte fijo y pastilla inferior derecha hacia Borne P2 en (245, 220) */}
              <rect x="198" y="215" width="14" height="8" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="205" cy="219" r="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
              <path d="M 200 215 L 210 215" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 205 220 L 260 220" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />

              {faultState === 'stuck_open' ? (
                /* ÉMBOLO ATASCADO ARRIBA: EL PUENTE NO LLEGA A TOCAR LOS CONTACTOS */
                <g id="stuck_open_bridge">
                  <path d="M 96 174 L 214 174" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="105" cy="177" r="4" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                  <circle cx="205" cy="177" r="4" fill="#f87171" stroke="#ef4444" strokeWidth="1" />
                  <circle cx="155" cy="174" r="3" fill="#ef4444" />
                  <text x="155" y="196" fill="#ef4444" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                    ¡ÉMBOLO ATASCADO - CONTACTOS ABIERTOS!
                  </text>
                  <text x="155" y="207" fill="#f87171" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
                    Separación de 38px por fricción mecánica (O.L)
                  </text>
                </g>
              ) : (
                /* CONTACTO CERRADO VISIBLE SIN SOLAPAR: PUENTE MÓVIL REPOSA EXACTAMENTE SOBRE LOS CONTACTOS FIJOS */
                <g id="closed_contacts_distinct_group">
                  {/* Barra horizontal del puente móvil (situada arriba de los contactos fijos) */}
                  <path d="M 96 207 L 214 207" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />

                  {/* Pin central que une el vástago del émbolo al puente móvil */}
                  <circle cx="155" cy="207" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />

                  {/* Pastilla móvil izquierda (reposa sobre la pastilla fija en y=215) */}
                  <circle cx="105" cy="211" r="4" fill="#34d399" stroke="#059669" strokeWidth="1.2" />

                  {/* Pastilla móvil derecha (reposa sobre la pastilla fija en y=215) */}
                  <circle cx="205" cy="211" r="4" fill="#34d399" stroke="#059669" strokeWidth="1.2" />

                  {/* EFECTO VISUAL DE CIERRE DE CONTACTO EN LA LÍNEA DE CONTACTO (y=215) */}
                  <ellipse cx="105" cy="215" rx="6" ry="2.5" fill="#34d399" opacity="0.6">
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.4s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="205" cy="215" rx="6" ry="2.5" fill="#34d399" opacity="0.6">
                    <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.4s" repeatCount="indefinite" />
                  </ellipse>

                  {/* Textos explicativos situados debajo con espacio despejado */}
                  <text x="155" y="236" fill="#10b981" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                    CERRADO POR GRAVEDAD (0.0 Ω)
                  </text>
                  <text x="155" y="247" fill="#6ee7b7" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
                    El puente móvil hace contacto visible sobre las bornas fijas
                  </text>
                </g>
              )}

              {/* Etiquetas informativas del circuito sin colisiones */}
              <text x="50" y="125" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Línea (L)
              </text>
              <text x="210" y="55" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Marcha (R)
              </text>
              <text x="250" y="206" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                Arr. (S)
              </text>
            </g>
          )}

          {/* =============================================================== */}
          {/* 3 BORNAS INTERACTIVAS CON RETROALIMENTACIÓN DE POSICIÓN CORRECTA */}
          {/* =============================================================== */}
          {(['P1', 'P2', 'P3'] as CheckPointId[]).map((ptId) => {
            const ptDef = CHECK_POINTS[ptId];
            const coord = getBornaCoords(ptId);
            const isRedHere = redBorna === ptId;
            const isBlackHere = blackBorna === ptId;
            const isOccupied = isRedHere || isBlackHere;
            const isHovered = hoveredBorna === ptId;

            // Target borna for current mission
            const isTargetBorna =
              (mission === 'contacts' && (ptId === 'P1' || ptId === 'P2')) ||
              (mission === 'coil' && (ptId === 'P1' || ptId === 'P3')) ||
              (mission === 'isolation' && (ptId === 'P2' || ptId === 'P3'));

            // Is correctly connected matching mission
            const isCorrectPosition = isTargetBorna && isOccupied && isMissionMatch;

            return (
              <g
                key={ptId}
                id={`borna-group-${ptId}`}
                className="cursor-pointer group"
                onClick={() => handleBornaClick(ptId)}
              >
                <title>{`Borna ${ptDef.name} (${ptDef.terminalCode}) - Haz clic o arrastra puntera aquí`}</title>

                {/* Área táctil extendida de agarre */}
                <circle cx={coord.x} cy={coord.y} r="22" fill="transparent" />

                {/* HALO DE POSICIÓN CORRECTA (Verde esmeralda palpitante cuando está conectado en la borna correcta) */}
                {isCorrectPosition ? (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="16"
                    fill="rgba(16, 185, 129, 0.35)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    filter="url(#correctBornaGlow)"
                    className="animate-pulse"
                  />
                ) : isHovered ? (
                  /* Imán de atracción cuando la puntera se arrastra encima */
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="17"
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38bdf8"
                    strokeWidth="2.8"
                    strokeDasharray="4 3"
                  >
                    <animate attributeName="stroke-dashoffset" values="0; 14" dur="1s" repeatCount="indefinite" />
                  </circle>
                ) : isTargetBorna ? (
                  /* Borna objetivo esperada para la misión */
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="14"
                    fill="rgba(245, 158, 11, 0.22)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    filter="url(#testPointGlow)"
                  />
                ) : (
                  /* Borna en reposo */
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="12"
                    fill="rgba(245, 158, 11, 0.12)"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                )}

                {/* Pad metálico interior */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="7.5"
                  fill={isRedHere ? '#dc2626' : isBlackHere ? '#1e293b' : '#d97706'}
                  stroke={isCorrectPosition ? '#10b981' : '#ffffff'}
                  strokeWidth={isCorrectPosition ? '2' : '1.2'}
                />

                {/* Centro plateado */}
                <circle cx={coord.x} cy={coord.y} r="2.5" fill="#ffffff" />

                {/* Texto identificador de la borna */}
                <text
                  x={coord.x}
                  y={coord.y - 12}
                  fill={
                    isCorrectPosition
                      ? '#34d399'
                      : isRedHere
                      ? '#fca5a5'
                      : isBlackHere
                      ? '#cbd5e1'
                      : '#fcd34d'
                  }
                  fontSize="8"
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isCorrectPosition ? `✓ ${ptDef.id}` : ptDef.id}
                </text>

                {/* Etiqueta de posición correcta */}
                {isCorrectPosition && (
                  <g transform={`translate(${coord.x}, ${coord.y + 16})`}>
                    <rect x="-24" y="-5" width="48" height="10" rx="3" fill="#065f46" stroke="#34d399" strokeWidth="0.8" />
                    <text x="0" y="2.5" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      CORRECTA
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* ================================================================= */}
        {/* LADO DERECHO: POLÍMETRO DIGITAL DT832                             */}
        {/* ================================================================= */}
        <g id="multimeter-dt832-unit" transform="translate(352, 10) scale(1.10) translate(-236, -6)">
          <image
            href={polimetroImg}
            x="236"
            y="6"
            width="117"
            height="199.6"
            preserveAspectRatio="none"
            filter="drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45))"
          />

          {/* DISPLAY LCD */}
          <rect
            x="256.4"
            y="25.2"
            width="71.6"
            height="22.8"
            rx="2"
            fill="#1c1917"
            opacity="0.92"
          />
          <rect
            x="257.4"
            y="26.0"
            width="69.6"
            height="21.2"
            rx="1.5"
            fill={isBothConnected ? '#737763' : '#4d5140'}
            stroke="#575b4a"
            strokeWidth="0.6"
          />
          <path
            d="M 258 26.6 L 326.5 26.6 L 316 32 L 258 32 Z"
            fill="#ffffff"
            opacity="0.16"
          />

          {/* Indicadores de modo en LCD */}
          <text x="261" y="32.8" fill="#202517" fontSize="4.8" fontWeight="bold" fontFamily="monospace">
            {isContinuity ? '▶|' : 'Ω'}
          </text>
          <text x="324" y="32.8" fill="#202517" fontSize="4.2" fontWeight="bold" textAnchor="end" fontFamily="monospace">
            {lcdDigits === '1 .' ? 'OL' : '200'}
          </text>

          {/* DÍGITOS DIGITALES EN PANTALLA LCD */}
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

          {/* SELECTOR ROTATIVO */}
          <g id="multimeter-rotary-dial" className="select-none">
            <path d="M 288.5,65 Q 293,63.5 297.5,65 L 296,75 Q 293,76 290,75 Z" fill="#ecb409" />

            <circle cx="293.0" cy="109.0" r="34.0" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
            <circle cx="293.0" cy="109.0" r="32.0" fill="#c2410c" />
            <circle cx="293.0" cy="109.0" r="30.0" fill="#f97316" stroke="#ea580c" strokeWidth="0.8" />
            <circle cx="293.0" cy="109.0" r="24.5" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
            <circle cx="293.0" cy="109.0" r="22.5" fill="#fb923c" opacity="0.25" />

            <g
              transform={`translate(293.0, 109.0) rotate(${isContinuity ? 157.5 : 200.0})`}
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

            {isContinuity ? (
              <g transform="translate(308.9, 147.4)">
                <circle cx="0" cy="0" r="3.0" fill="#16a34a" stroke="#ffffff" strokeWidth="0.6" className="animate-pulse" />
                <text x="0" y="0.9" fill="#ffffff" fontSize="2.4" fontWeight="900" textAnchor="middle">▶|</text>
              </g>
            ) : (
              <g transform="translate(279.3, 146.6)">
                <circle cx="0" cy="0" r="3.0" fill="#16a34a" stroke="#ffffff" strokeWidth="0.6" className="animate-pulse" />
                <text x="0" y="1.0" fill="#ffffff" fontSize="2.8" fontWeight="900" textAnchor="middle">Ω</text>
              </g>
            )}
          </g>

          {/* BANANA JACKS */}
          <g transform="translate(329.1, 146.5)">
            <circle cx="0" cy="0" r="4.8" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" opacity="0.9" />
            <circle cx="0" cy="0" r="2.2" fill="#262626" />
          </g>
          <g transform="translate(329.1, 164.1)">
            <circle cx="0" cy="0" r="5.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
            <circle cx="0" cy="0" r="3" fill="#b91c1c" />
            <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#7f1d1d" opacity="0.95" />
            <circle cx="0" cy="0" r="1.5" fill="#fca5a5" opacity="0.8" />
          </g>
          <g transform="translate(329.1, 183.8)">
            <circle cx="0" cy="0" r="5.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="0" cy="0" r="3" fill="#09090b" />
            <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#030712" opacity="0.95" />
            <circle cx="0" cy="0" r="1.5" fill="#94a3b8" opacity="0.8" />
          </g>
        </g>

        {/* ================================================================= */}
        {/* CABLES FLEXIBLES Y PUNTERAS INTERACTIVAS POR ARRASTRE            */}
        {/* ================================================================= */}

        {/* CABLE NEGRO */}
        <path
          d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${blackCp1.x} ${blackCp1.y}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity="0.85"
          filter="url(#relayBlackCableShadow)"
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

        {/* PUNTERA NEGRA (ARRASTRABLE CON EL DEDO / RATÓN) */}
        <g
          transform={`translate(${blackCoords.x}, ${blackCoords.y}) rotate(${blackAngleDeg})`}
          onPointerDown={(e) => handleProbePointerDown('black', e)}
          className="cursor-grab active:cursor-grabbing group select-none"
          filter="drop-shadow(0 0 4px rgba(148, 163, 184, 0.8))"
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
              className="animate-pulse"
            />
          )}

          <line x1="0" y1="0" x2="8" y2="0" stroke="url(#relayNeedleGrad)" strokeWidth="2" strokeLinecap="round" />
          <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" />
          <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
          <line x1="14" y1="-2" x2="14" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="18" y1="-2" x2="18" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="22" y1="-2" x2="22" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
          <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="0.5" />

          {/* Chispa de contacto */}
          {blackBorna && (
            <circle cx="0" cy="0" r="3.2" fill="#38bdf8" opacity="0.85">
              <animate attributeName="r" values="2.5; 4.5; 2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Etiqueta visible de arrastre */}
          <text x="18" y="-7" fill="#f8fafc" stroke="#020617" strokeWidth="0.5" fontSize="4.8" fontWeight="bold" textAnchor="middle">
            {blackBorna ? `⚫ ${blackBorna}` : 'Mover ⚫'}
          </text>
        </g>

        {/* CABLE ROJO */}
        <path
          d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${redCp1.x} ${redCp1.y}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
          fill="none"
          stroke="#dc2626"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#relayLeadShadow)"
        />
        <path
          d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${redCp1.x} ${redCp1.y}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* PUNTERA ROJA (ARRASTRABLE CON EL DEDO / RATÓN) */}
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
              className="animate-pulse"
            />
          )}

          <line x1="0" y1="0" x2="8" y2="0" stroke="url(#relayNeedleGrad)" strokeWidth="2" strokeLinecap="round" />
          <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.8" />
          <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          <line x1="14" y1="-2" x2="14" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <line x1="18" y1="-2" x2="18" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <line x1="22" y1="-2" x2="22" y2="2" stroke="#ef4444" strokeWidth="0.8" />
          <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#7f1d1d" />

          {/* Chispa de contacto */}
          {redBorna && (
            <circle cx="0" cy="0" r="3.2" fill="#f87171" opacity="0.85">
              <animate attributeName="r" values="2.5; 4.5; 2.5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9; 0.35; 0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Etiqueta visible de arrastre */}
          <text x="18" y="-7" fill="#ffffff" stroke="#020617" strokeWidth="0.5" fontSize="4.8" fontWeight="bold" textAnchor="middle">
            {redBorna ? `🔴 ${redBorna}` : 'Mover 🔴'}
          </text>
        </g>
      </svg>

      {/* 4. TARJETA INFORMATIVA INFERIOR DE DIAGNÓSTICO TÉCNICO */}
      <div
        className={`w-full mt-1.5 p-2 rounded-lg border text-left font-mono transition-colors shrink-0 ${
          statusTone === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            : statusTone === 'warning'
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            : 'bg-red-950/40 border-red-800/80 text-red-300'
        }`}
      >
        <div className="font-bold text-[11px] flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
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
          <span className="text-[10px] text-slate-400 font-normal">
            Puntas: 🔴 {redBorna ? `${redBorna}` : 'Al aire'} ↔ ⚫ {blackBorna ? `${blackBorna}` : 'Al aire'}
          </span>
        </div>
        <p className="text-[10px] text-slate-300 mt-1 font-sans">
          {redBorna && blackBorna
            ? isMissionMatch
              ? position === 'vertical'
                ? 'Conexión correcta en posición vertical: El émbolo reposa en el fondo por su propio peso. Verifica si los contactos están debidamente abiertos.'
                : 'Conexión correcta en posición invertida: Al voltear el relé 180°, la gravedad empuja el émbolo cerrando los contactos de arranque (0.0 Ω con pitido).'
              : 'Punteras conectadas a bornas. Puedes cambiar la misión arriba o arrastrar las punteras a otras bornas para continuar comprobando.'
            : 'Toma la puntera roja o negra arrastrándola con el dedo o ratón y suéltala sobre la borna deseada (P1, P2 o P3), o pulsa directamente sobre cualquier borna.'}
        </p>
      </div>
    </div>
  );
};
