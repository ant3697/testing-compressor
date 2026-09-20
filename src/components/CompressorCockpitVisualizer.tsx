import React, { useState } from 'react';
import { TerminalId, TerminalRole } from '../types';
import { Volume2, VolumeX, ShieldCheck, Sparkles, HelpCircle, RotateCw, Camera, X } from 'lucide-react';
import { playMultimeterBuzzer, stopMultimeterBuzzer } from '../utils/audio';
import polimetroImg from '../assets/polimetro-transparent.png';
import compresorImg from '../assets/compresor.png';
import { ZoomPanViewer } from './ZoomPanViewer';

interface CompressorCockpitVisualizerProps {
  orientation: 'apexDown' | 'apexUp';
  selectedPins: [TerminalId | null, TerminalId | null]; // [black, red]
  identifiedRoles: {
    pin1: TerminalRole | null;
    pin2: TerminalRole | null;
    pin3: TerminalRole | null;
  };
  multimeterReading: string;
  multimeterUnit: string;
  multimeterTitle: string;
  isBeeping: boolean;
  groundTestedPin: TerminalId | 'casing' | null;
  highlightGround: boolean;
  onPinClick: (pin: TerminalId) => void;
  onSelectPhotoPreset: (photoNum: 1 | 2 | 3 | 4) => void;
  onProbesChange?: (black: TerminalId | 'casing' | null, red: TerminalId | 'casing' | null) => void;
  activePhotoPreset?: 1 | 2 | 3 | 4 | null;
  rMarcha?: string | number;
  rArranque?: string | number;
  rTotal?: string | number;
  onToggleOrientation?: () => void;
}

export const CompressorCockpitVisualizer: React.FC<CompressorCockpitVisualizerProps> = ({
  orientation,
  selectedPins,
  identifiedRoles,
  multimeterReading,
  multimeterUnit,
  multimeterTitle,
  isBeeping,
  groundTestedPin,
  highlightGround,
  onPinClick,
  onSelectPhotoPreset,
  onProbesChange,
  activePhotoPreset = 1,
  rMarcha = '9.7',
  rArranque = '13.1',
  rTotal = '22.8',
  onToggleOrientation,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showCompressorModal, setShowCompressorModal] = useState<boolean>(false);
  const [isChassisHovered, setIsChassisHovered] = useState<boolean>(false);

  // Drag and drop state for multimeter probes
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [draggingProbe, setDraggingProbe] = useState<'black' | 'red' | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredContact, setHoveredContact] = useState<'pin1' | 'pin2' | 'pin3' | 'ground' | null>(null);

  React.useEffect(() => {
    if (isBeeping && audioEnabled) {
      playMultimeterBuzzer(true);
    } else {
      stopMultimeterBuzzer();
    }
    return () => {
      stopMultimeterBuzzer();
    };
  }, [isBeeping, audioEnabled]);

  // Coordinates for the 3 terminals depending on apex orientation
  // In our interactive canvas (viewBox: 0 0 380 210)
  const pinCoords =
    orientation === 'apexDown'
      ? {
          pin1: { x: 66, y: 84, label: 'R', full: 'Marcha (Run)', btnX: 42, btnY: 57, textX: 52, textY: 60 },
          pin2: { x: 126, y: 84, label: 'S', full: 'Arranque (Star)', btnX: 148, btnY: 57, textX: 138, textY: 60 },
          pin3: { x: 96, y: 144, label: 'C', full: 'Común', btnX: 96, btnY: 175, textX: 96, textY: 191 },
        }
      : {
          pin1: { x: 66, y: 144, label: 'R', full: 'Marcha (Run)', btnX: 42, btnY: 172, textX: 52, textY: 175 },
          pin2: { x: 126, y: 144, label: 'S', full: 'Arranque (Star)', btnX: 148, btnY: 172, textX: 138, textY: 175 },
          pin3: { x: 96, y: 84, label: 'C', full: 'Común', btnX: 96, btnY: 54, textX: 96, textY: 44 },
        };

  // Ground contact position on casing
  const groundContact = { x: 154, y: 34 };

  const contactsList: { id: 'pin1' | 'pin2' | 'pin3' | 'ground'; label: string; name: string; color: string; x: number; y: number }[] = [
    { id: 'pin1', label: 'R', name: 'Marcha (Run)', color: '#10b981', x: pinCoords.pin1.x, y: pinCoords.pin1.y },
    { id: 'pin2', label: 'S', name: 'Arranque (Star)', color: '#f59e0b', x: pinCoords.pin2.x, y: pinCoords.pin2.y },
    { id: 'pin3', label: 'C', name: 'Común', color: '#38bdf8', x: pinCoords.pin3.x, y: pinCoords.pin3.y },
    { id: 'ground', label: 'D', name: 'Carcasa (Tierra)', color: '#10b981', x: groundContact.x, y: groundContact.y },
  ];

  const getContactCoords = (c: 'pin1' | 'pin2' | 'pin3' | 'ground') => {
    if (c === 'ground') return groundContact;
    return { x: pinCoords[c].x, y: pinCoords[c].y };
  };

  // Base contact assignments when not dragging
  const defaultBlackContact: 'pin1' | 'pin2' | 'pin3' | 'ground' =
    highlightGround || activePhotoPreset === 4
      ? 'ground'
      : activePhotoPreset === 1
      ? 'pin1'
      : activePhotoPreset === 2
      ? 'pin2'
      : activePhotoPreset === 3
      ? 'pin2'
      : (selectedPins[0] as any) || 'pin1';

  const defaultRedContact: 'pin1' | 'pin2' | 'pin3' | 'ground' =
    highlightGround || activePhotoPreset === 4
      ? (groundTestedPin && groundTestedPin !== 'casing' ? groundTestedPin : (selectedPins[1] as any) || 'pin1')
      : activePhotoPreset === 1
      ? 'pin3'
      : activePhotoPreset === 2
      ? 'pin3'
      : activePhotoPreset === 3
      ? 'pin1'
      : (selectedPins[1] as any) || 'pin3';

  // Check whether current test is ground / dielectric / continuity test or winding resistance test
  const isGroundTest =
    highlightGround ||
    activePhotoPreset === 4 ||
    groundTestedPin !== null ||
    defaultBlackContact === 'ground' ||
    defaultRedContact === 'ground' ||
    (draggingProbe === 'black' && hoveredContact === 'ground') ||
    (draggingProbe === 'red' && hoveredContact === 'ground');

  // Calculate current probe connection targets based on active test / selection or real-time drag
  let redTarget = getContactCoords(defaultRedContact);
  let blackTarget = getContactCoords(defaultBlackContact);

  if (draggingProbe === 'red' && dragPos) {
    if (hoveredContact) {
      redTarget = getContactCoords(hoveredContact);
    } else {
      redTarget = dragPos;
    }
  } else if (draggingProbe === 'black' && dragPos) {
    if (hoveredContact) {
      blackTarget = getContactCoords(hoveredContact);
    } else {
      blackTarget = dragPos;
    }
  }

  // Multimeter Jack coordinates on the authentic DT832 image (exact banana socket centers)
  const mmBlackJack = { x: 329.1, y: 183.8 };
  const mmRedJack = { x: 329.1, y: 164.1 };

  // Calculate realistic orientation angles and cable connection points so the probes are collinear with cables
  const probeTotalLen = 29;

  // Red probe: collinear alignment with incoming cable
  const redDx = (mmRedJack.x - 65) - redTarget.x;
  const redDy = (mmRedJack.y + 25) - redTarget.y;
  const redAngle = Math.max(0.18, Math.min(0.95, Math.atan2(redDy, redDx)));
  const redAngleDeg = (redAngle * 180) / Math.PI;
  const redCableEnd = {
    x: redTarget.x + probeTotalLen * Math.cos(redAngle),
    y: redTarget.y + probeTotalLen * Math.sin(redAngle),
  };
  const redCp2 = {
    x: redCableEnd.x + 45 * Math.cos(redAngle),
    y: redCableEnd.y + 45 * Math.sin(redAngle),
  };

  // Black probe: collinear alignment with incoming cable
  const blackDx = (mmBlackJack.x - 65) - blackTarget.x;
  const blackDy = (mmBlackJack.y + 35) - blackTarget.y;
  const blackAngle = Math.max(0.25, Math.min(1.10, Math.atan2(blackDy, blackDx)));
  const blackAngleDeg = (blackAngle * 180) / Math.PI;
  const blackCableEnd = {
    x: blackTarget.x + probeTotalLen * Math.cos(blackAngle),
    y: blackTarget.y + probeTotalLen * Math.sin(blackAngle),
  };
  const blackCp2 = {
    x: blackCableEnd.x + 45 * Math.cos(blackAngle),
    y: blackCableEnd.y + 45 * Math.sin(blackAngle),
  };

  // SVG coordinate transformation for mouse & touch drag
  const getSvgCoords = (e: React.PointerEvent | PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 380 / rect.width;
    const scaleY = 210 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return {
      x: Math.max(15, Math.min(365, x)),
      y: Math.max(12, Math.min(198, y)),
    };
  };

  const handleProbePointerDown = (probe: 'red' | 'black', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setDraggingProbe(probe);
    const coords = getSvgCoords(e);
    setDragPos(coords);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = getSvgCoords(e);
    setDragPos(coords);

    let nearest: 'pin1' | 'pin2' | 'pin3' | 'ground' | null = null;
    let minD = 34; // snap distance
    for (const c of contactsList) {
      const d = Math.hypot(c.x - coords.x, c.y - coords.y);
      if (d < minD) {
        minD = d;
        nearest = c.id;
      }
    }
    setHoveredContact(nearest);
  };

  const handleApplyDrop = (probe: 'red' | 'black', target: 'pin1' | 'pin2' | 'pin3' | 'ground') => {
    const newBlack = probe === 'black' ? target : defaultBlackContact;
    const newRed = probe === 'red' ? target : defaultRedContact;

    if (onProbesChange) {
      onProbesChange(
        newBlack === 'ground' ? 'casing' : newBlack,
        newRed === 'ground' ? 'casing' : newRed
      );
    } else {
      if (newBlack === 'ground' || newRed === 'ground') {
        onSelectPhotoPreset(4);
      } else {
        const p = [newBlack, newRed];
        if (p.includes('pin3') && p.includes('pin1')) onSelectPhotoPreset(1);
        else if (p.includes('pin3') && p.includes('pin2')) onSelectPhotoPreset(2);
        else if (p.includes('pin1') && p.includes('pin2')) onSelectPhotoPreset(3);
      }
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingProbe) return;
    const coords = dragPos || getSvgCoords(e);

    let targetContact = hoveredContact;
    if (!targetContact) {
      let minD = 48; // release snap tolerance
      for (const c of contactsList) {
        const d = Math.hypot(c.x - coords.x, c.y - coords.y);
        if (d < minD) {
          minD = d;
          targetContact = c.id;
        }
      }
    }

    if (targetContact) {
      handleApplyDrop(draggingProbe, targetContact);
    }

    setDraggingProbe(null);
    setDragPos(null);
    setHoveredContact(null);
  };

  const isPinBlack = (pin: TerminalId) => selectedPins[0] === pin;
  const isPinRed = (pin: TerminalId) => selectedPins[1] === pin;

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1420] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col justify-between select-none overflow-hidden">
      {/* 1. Header Bar: Mode Toggles & Sound */}
      <div className="h-8 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
            ESQUEMA TÉCNICO
          </span>
          <span className="text-tiny font-secondary text-slate-600 dark:text-slate-300 font-semibold truncate hidden sm:inline">
            Bornes C, R, S con Polímetro Digital
          </span>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-mono"
            title={audioEnabled ? 'Silenciar multímetro' : 'Activar sonido zumbador'}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline text-slate-600 dark:text-slate-300">Zumbador ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline text-slate-400">Silenciado</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Center Display: Interactive Live Simulator */}
      <div className="relative w-full flex-1 my-2 min-h-[350px] flex flex-col items-center justify-between bg-slate-50 dark:bg-[#090d16] rounded-lg border border-slate-200 dark:border-slate-800/80 p-2 overflow-hidden">
        {/* Draggable hint bar */}
        <div className="w-full flex items-center justify-between px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 rounded text-[11px] font-mono text-amber-800 dark:text-amber-300 shrink-0 mb-1">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            PUNTERAS INTERACTIVAS:
            <span className="font-normal text-slate-600 dark:text-slate-300 font-sans hidden sm:inline">
              Arrastra las puntas del polímetro a los bornes R, S, C o a la carcasa (D)
            </span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:inline">
            {draggingProbe ? `Soltando punta ${draggingProbe === 'red' ? 'roja' : 'negra'}...` : 'Arrastrar para medir'}
          </span>
        </div>

        {/* Main SVG with Compressor Contacts (left) and Digital Multimeter (right) with Probes */}
        <div className="w-full flex-1 flex items-center justify-center relative touch-none">
          <svg
            ref={svgRef}
            viewBox="0 0 380 210"
            className="w-full h-full max-h-[320px] font-mono select-none"
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={handleSvgPointerUp}
            style={{ touchAction: 'none' }}
          >
              <defs>
                {/* Yellow Multimeter Casing Gradient */}
                <linearGradient id="multimeterBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Rotary Dial Center Knob Gradient */}
                <linearGradient id="knobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Probe Needle Metallic Gradient */}
                <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>

                {/* Drop shadow for cables */}
                <filter id="leadShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
                </filter>

                {/* Contrasting bright ambient shadow / outline for black cable to pop on dark backgrounds */}
                <filter id="blackCableShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#94a3b8" floodOpacity="0.75" />
                  <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#f8fafc" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* ======================================================== */}
              {/* LEFT SIDE: COMPRESSOR CHASSIS & TERMINALS SOCKET         */}
              {/* ======================================================== */}
              {/* Clickable Carcasa Metálica (Chasis) Area */}
              <rect
                x="12"
                y="10"
                width="170"
                height="192"
                rx="16"
                fill={isChassisHovered ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.2)'}
                stroke={hoveredContact === 'ground' ? '#10b981' : isChassisHovered ? '#38bdf8' : '#64748b'}
                strokeWidth={hoveredContact === 'ground' ? 2.2 : isChassisHovered ? 2.0 : 1.8}
                strokeDasharray="4 2"
                className="transition-colors duration-150 cursor-pointer"
                onPointerEnter={() => setIsChassisHovered(true)}
                onPointerLeave={() => setIsChassisHovered(false)}
                onClick={() => {
                  if (!draggingProbe) setShowCompressorModal(true);
                }}
              />
              <text
                x="22"
                y="24"
                fill={hoveredContact === 'ground' ? '#10b981' : isChassisHovered ? '#38bdf8' : '#94a3b8'}
                fontSize="8"
                fontWeight="bold"
                className="select-none"
              >
                CARCASA METÁLICA (CHASIS)
              </text>

              {/* Ground Contact point on the chassis casing */}
              <g
                className="cursor-pointer group"
                onClick={() => {
                  onSelectPhotoPreset(4);
                  handleApplyDrop('black', 'ground');
                }}
              >
                <title>Carcasa Metálica / Chasis (Tierra D)</title>
                <circle
                  cx={groundContact.x}
                  cy={groundContact.y}
                  r="10"
                  fill={hoveredContact === 'ground' ? '#86efac' : '#e2e8f0'}
                  stroke={hoveredContact === 'ground' ? '#10b981' : '#475569'}
                  strokeWidth={hoveredContact === 'ground' ? 3 : 2}
                  className="transition-all duration-150"
                />
                <path
                  d={`M ${groundContact.x - 4.5} ${groundContact.y + 2} L ${groundContact.x + 4.5} ${groundContact.y + 2} M ${groundContact.x - 2.5} ${groundContact.y + 5} L ${groundContact.x + 2.5} ${groundContact.y + 5} M ${groundContact.x - 1} ${groundContact.y + 7.5} L ${groundContact.x + 1} ${groundContact.y + 7.5}`}
                  stroke="#047857"
                  strokeWidth="1.4"
                />
                <circle cx={groundContact.x + 13} cy={groundContact.y} r="6.5" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
                <text x={groundContact.x + 13} cy={groundContact.y + 2.5} fill="#000000" fontSize="7.5" fontWeight="900" textAnchor="middle">
                  D
                </text>
              </g>

              {/* Terminal Bakelite Socket Cluster Plate */}
              <circle cx="96" cy="114" r="56" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
              <circle cx="96" cy="114" r="51" fill="#090d16" />

              {/* Internal Motor Windings between terminals */}
              {/* Main Winding: Between C and R (Green) */}
              <path
                d={`M ${pinCoords.pin3.x} ${pinCoords.pin3.y} Q 74 114 ${pinCoords.pin1.x} ${pinCoords.pin1.y}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.2"
                strokeDasharray={selectedPins.includes('pin1') && selectedPins.includes('pin3') ? 'none' : '4 2'}
              />
              {/* Start Winding: Between C and S (Yellow/Orange) */}
              <path
                d={`M ${pinCoords.pin3.x} ${pinCoords.pin3.y} Q 118 114 ${pinCoords.pin2.x} ${pinCoords.pin2.y}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray={selectedPins.includes('pin2') && selectedPins.includes('pin3') ? 'none' : '4 2'}
              />
              {/* Total Series between R and S */}
              <line
                x1={pinCoords.pin1.x}
                y1={pinCoords.pin1.y}
                x2={pinCoords.pin2.x}
                y2={pinCoords.pin2.y}
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.5"
              />

              {/* Pin 1: Borne R (Run / Marcha) */}
              <g className="cursor-pointer group" onClick={() => onPinClick('pin1')}>
                <title>Borne R (Run / Marcha)</title>
                <circle
                  cx={pinCoords.pin1.x}
                  cy={pinCoords.pin1.y}
                  r="13"
                  fill={isPinBlack('pin1') ? '#000000' : isPinRed('pin1') ? '#dc2626' : '#334155'}
                  stroke="#10b981"
                  strokeWidth="2"
                  className="transition-all duration-150 group-hover:stroke-emerald-400"
                />
                <circle cx={pinCoords.pin1.x} cy={pinCoords.pin1.y} r="4.5" fill="#fbbf24" />

                {/* Badge R */}
                <circle cx={pinCoords.pin1.btnX} cy={pinCoords.pin1.btnY} r="7.5" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
                <text x={pinCoords.pin1.btnX} y={pinCoords.pin1.btnY + 2.8} fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">
                  R
                </text>
                <text x={pinCoords.pin1.textX} y={pinCoords.pin1.textY} fill="#10b981" fontSize="8.5" fontWeight="bold" textAnchor="start">
                  R (Run)
                </text>
              </g>

              {/* Pin 2: Borne S (Star / Arranque) */}
              <g className="cursor-pointer group" onClick={() => onPinClick('pin2')}>
                <title>Borne S (Star / Arranque)</title>
                <circle
                  cx={pinCoords.pin2.x}
                  cy={pinCoords.pin2.y}
                  r="13"
                  fill={isPinBlack('pin2') ? '#000000' : isPinRed('pin2') ? '#dc2626' : '#334155'}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="transition-all duration-150 group-hover:stroke-amber-300"
                />
                <circle cx={pinCoords.pin2.x} cy={pinCoords.pin2.y} r="4.5" fill="#fbbf24" />

                {/* Badge S */}
                <circle cx={pinCoords.pin2.btnX} cy={pinCoords.pin2.btnY} r="7.5" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
                <text x={pinCoords.pin2.btnX} y={pinCoords.pin2.btnY + 2.8} fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">
                  S
                </text>
                <text x={pinCoords.pin2.textX} y={pinCoords.pin2.textY} fill="#f59e0b" fontSize="8.5" fontWeight="bold" textAnchor="end">
                  S (Star)
                </text>
              </g>

              {/* Pin 3: Borne C (Común) */}
              <g className="cursor-pointer group" onClick={() => onPinClick('pin3')}>
                <title>Borne C (Común)</title>
                <circle
                  cx={pinCoords.pin3.x}
                  cy={pinCoords.pin3.y}
                  r="13"
                  fill={isPinBlack('pin3') ? '#000000' : isPinRed('pin3') ? '#dc2626' : '#334155'}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  className="transition-all duration-150 group-hover:stroke-sky-300"
                />
                <circle cx={pinCoords.pin3.x} cy={pinCoords.pin3.y} r="4.5" fill="#fbbf24" />

                {/* Badge C */}
                <circle cx={pinCoords.pin3.btnX} cy={pinCoords.pin3.btnY} r="7.5" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
                <text x={pinCoords.pin3.btnX} y={pinCoords.pin3.btnY + 2.8} fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">
                  C
                </text>
                <text x={pinCoords.pin3.textX} y={pinCoords.pin3.textY} fill="#38bdf8" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  C (Común)
                </text>
              </g>

              {/* Dynamic snap drop zones around all 4 casing contacts when dragging any probe */}
              {draggingProbe && (
                <g className="pointer-events-none">
                  {contactsList.map((c) => {
                    const isHovered = hoveredContact === c.id;
                    return (
                      <g key={c.id}>
                        {/* Target ring */}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isHovered ? 24 : 17}
                          fill={isHovered ? (draggingProbe === 'red' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)') : 'none'}
                          stroke={isHovered ? (draggingProbe === 'red' ? '#ef4444' : '#38bdf8') : '#94a3b8'}
                          strokeWidth={isHovered ? 2.5 : 1.5}
                          strokeDasharray={isHovered ? 'none' : '3 3'}
                          className={isHovered ? 'animate-pulse' : ''}
                        />
                        {/* Floating Snap Indicator Pill */}
                        {isHovered && (
                          <g transform={`translate(${c.x}, ${c.y - 24})`}>
                            <rect
                              x="-42"
                              y="-9"
                              width="84"
                              height="17"
                              rx="4.5"
                              fill="#0f172a"
                              stroke={draggingProbe === 'red' ? '#ef4444' : '#38bdf8'}
                              strokeWidth="1.2"
                              filter="url(#leadShadow)"
                            />
                            <text
                              x="0"
                              y="2.5"
                              fill="#ffffff"
                              fontSize="7.5"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              Soltar en {c.label} ({c.name.split(' ')[0]})
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ======================================================== */}
              {/* RIGHT SIDE: AUTHENTIC DT832 DIGITAL MULTIMETER IMAGE     */}
              {/* ======================================================== */}
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
              {/* Recessed bezel around display area */}
              <rect
                x="256.4"
                y="25.2"
                width="71.6"
                height="22.8"
                rx="2"
                fill="#1c1917"
                opacity="0.92"
              />
              {/* LCD Screen Glass (authentic greenish-olive multimeter tint) */}
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
              {/* LCD Glass sheen & reflection highlight */}
              <path
                d="M 258 26.6 L 326.5 26.6 L 316 32 L 258 32 Z"
                fill="#ffffff"
                opacity="0.16"
              />

              {/* LCD Top Mode Indicators */}
              <text x="261" y="32.8" fill="#202517" fontSize="4.8" fontWeight="bold" fontFamily="monospace">
                {isGroundTest ? 'HV' : 'Ω'}
              </text>
              <text x="324" y="32.8" fill="#202517" fontSize="4.2" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                {multimeterReading === '1.' ? 'OL' : '200'}
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
                letterSpacing={multimeterReading === '1.' ? '0.12em' : '0.02em'}
              >
                {multimeterReading}
              </text>
              {multimeterReading !== '1.' && (
                <text x="321" y="43.8" fill="#10180a" fontSize="6.5" fontWeight="bold" textAnchor="start" fontFamily="sans-serif">
                  {multimeterUnit}
                </text>
              )}

              {/* ======================================================== */}
              {/* ROTARY SELECTOR KNOB: 200 OHMS (200 Ω) / DIODE SYMBOL    */}
              {/* Center aligned at (293.0, 109.0)                         */}
              {/* - Resistance tests (R, S, C): aligned to 200 Ω (200.0°)   */}
              {/* - Ground / continuity tests: aligned to Diode (157.5°)    */}
              {/* ======================================================== */}
              <g id="multimeter-rotary-dial" className="select-none">
                {/* Yellow faceplate patch erasing the photo's original top pointer tab at OFF */}
                <path d="M 288.5,65 Q 293,63.5 297.5,65 L 296,75 Q 293,76 290,75 Z" fill="#ecb409" />

                {/* Outer bezel ring and skirt: exactly covers the full original dial base (r=34.0) */}
                <circle cx="293.0" cy="109.0" r="34.0" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
                <circle cx="293.0" cy="109.0" r="32.0" fill="#c2410c" />
                <circle cx="293.0" cy="109.0" r="30.0" fill="#f97316" stroke="#ea580c" strokeWidth="0.8" />
                <circle cx="293.0" cy="109.0" r="24.5" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
                <circle cx="293.0" cy="109.0" r="22.5" fill="#fb923c" opacity="0.25" />

                {/* Raised Ergonomic Bar Pointer (Turned to 200 Ω at 200.0° or Diode at 157.5°) */}
                <g
                  transform={`translate(293.0, 109.0) rotate(${isGroundTest ? 157.5 : 200.0})`}
                  className="transition-transform duration-300 ease-out"
                >
                  {/* Drop shadow of raised bar */}
                  <rect
                    x="-4.0"
                    y="-24"
                    width="8.0"
                    height="48"
                    rx="4.0"
                    fill="rgba(0,0,0,0.28)"
                    transform="translate(1.2, 1.4)"
                  />
                  {/* Pointer tab extending to the active scale mark */}
                  <polygon points="-4.0,-16 4.0,-16 2.2,-31 -2.2,-31" fill="#ea580c" stroke="#c2410c" strokeWidth="0.8" />
                  {/* Main bar body */}
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
                  {/* High visibility white pointer arrow notch pointing directly at target scale */}
                  <polygon points="-2.2,-23 2.2,-23 0,-29" fill="#ffffff" />
                  {/* Tactile ergonomic grip ribs */}
                  <line x1="0" y1="-19" x2="0" y2="19" stroke="#fed7aa" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="-2.0" y1="-15" x2="-2.0" y2="15" stroke="#ea580c" strokeWidth="0.7" strokeLinecap="round" />
                  <line x1="2.0" y1="-15" x2="2.0" y2="15" stroke="#ea580c" strokeWidth="0.7" strokeLinecap="round" />
                  {/* Central recessed hub */}
                  <circle cx="0" cy="0" r="4.8" fill="#c2410c" />
                  <circle cx="0" cy="0" r="2.8" fill="#ea580c" />
                  <circle cx="0" cy="0" r="1.4" fill="#f97316" />
                </g>

                {/* Active Range Indicator on the scale:
                    - In Ground / Diode mode: pulse indicator at Diode mark (308.9, 147.4)
                    - In Resistance mode: pulse indicator at 200 Ω mark (279.3, 146.6)
                */}
                {isGroundTest ? (
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

              {/* Multimeter Banana Jacks and Cable Plug Terminations */}
              {/* 10A Jack Socket (Top, unused for ohms) */}
              <g transform="translate(329.1, 146.5)">
                <circle cx="0" cy="0" r="4.8" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" opacity="0.9" />
                <circle cx="0" cy="0" r="2.2" fill="#262626" />
              </g>

              {/* VΩmA Jack Socket (Middle - Red probe plug) */}
              <g transform={`translate(${mmRedJack.x}, ${mmRedJack.y})`}>
                <circle cx="0" cy="0" r="5.5" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                <circle cx="0" cy="0" r="3" fill="#b91c1c" />
                {/* Banana plug sleeve collar of the lead */}
                <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#7f1d1d" opacity="0.95" />
                <circle cx="0" cy="0" r="1.5" fill="#fca5a5" opacity="0.8" />
              </g>

              {/* COM Jack Socket (Bottom - Black probe plug) */}
              <g transform={`translate(${mmBlackJack.x}, ${mmBlackJack.y})`}>
                <circle cx="0" cy="0" r="5.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                <circle cx="0" cy="0" r="3" fill="#09090b" />
                {/* Banana plug sleeve collar of the lead */}
                <rect x="-2" y="-3.5" width="4" height="7" rx="1.5" fill="#030712" opacity="0.95" />
                <circle cx="0" cy="0" r="1.5" fill="#94a3b8" opacity="0.8" />
              </g>

              {/* ======================================================== */}
              {/* TEST PROBE LEADS (CABLES ROJO Y NEGRO) & CONTACT PENS    */}
              {/* ======================================================== */}
              {/* BLACK TEST LEAD (COM Jack -> Probe Handle Rear) */}
              {/* 1. High-contrast ambient shadow & outer contour (pops clearly against dark background) */}
              <path
                d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${mmBlackJack.x - 65} ${mmBlackJack.y + 25}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5.6"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#blackCableShadow)"
              />
              {/* 2. Main rubber black cable body */}
              <path
                d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${mmBlackJack.x - 65} ${mmBlackJack.y + 25}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              {/* 3. Glossy specular light ridge along the cable */}
              <path
                d={`M ${mmBlackJack.x - 4} ${mmBlackJack.y} C ${mmBlackJack.x - 65} ${mmBlackJack.y + 25}, ${blackCp2.x} ${blackCp2.y}, ${blackCableEnd.x} ${blackCableEnd.y}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Black Probe Pen and Needle touching the target terminal - perfectly aligned with cable & Draggable */}
              <g
                transform={`translate(${blackTarget.x}, ${blackTarget.y}) rotate(${blackAngleDeg})`}
                onPointerDown={(e) => handleProbePointerDown('black', e)}
                className="cursor-grab active:cursor-grabbing group select-none"
                style={{ touchAction: 'none' }}
                filter="drop-shadow(0 0 3px rgba(148, 163, 184, 0.75))"
              >
                <title>Arrastrar punta negra a bornes R, S, C o carcasa D</title>
                {/* Expanded invisible hit area for easy touch / drag interaction */}
                <rect x="-4" y="-9" width="38" height="18" rx="4" fill="transparent" />

                {/* Subtle aura when dragging or hovering */}
                {(draggingProbe === 'black') && (
                  <rect
                    x="5"
                    y="-6"
                    width="26"
                    height="12"
                    rx="3"
                    fill="rgba(56, 189, 248, 0.25)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="animate-pulse"
                  />
                )}

                {/* Silver metallic needle extending from contact point into handle */}
                <line x1="0" y1="0" x2="8" y2="0" stroke="url(#needleGrad)" strokeWidth="2" strokeLinecap="round" />
                {/* Black insulated collar (finger stop) with light rim */}
                <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Black insulated main handle with subtle slate border */}
                <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                {/* Handle grip ribs */}
                <line x1="14" y1="-2" x2="14" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="18" y1="-2" x2="18" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
                <line x1="22" y1="-2" x2="22" y2="2" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Strain relief boot at rear where cable enters */}
                <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="0.5" />
                {/* Contact spark / touch circle on the terminal */}
                <circle cx="0" cy="0" r="3" fill="#38bdf8" opacity="0.85" className="animate-pulse" />

                {/* Interactive drag grip indicator (high contrast white/slate with dark halo) */}
                <text x="18" y="-6" fill="#f8fafc" stroke="#020617" strokeWidth="0.5" fontSize="4.8" fontWeight="bold" textAnchor="middle">
                  Arrastrar
                </text>
              </g>

              {/* RED TEST LEAD (V/Ω Jack -> Probe Handle Rear) */}
              <path
                d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${mmRedJack.x - 65} ${mmRedJack.y + 25}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#leadShadow)"
              />
              <path
                d={`M ${mmRedJack.x - 4} ${mmRedJack.y} C ${mmRedJack.x - 65} ${mmRedJack.y + 25}, ${redCp2.x} ${redCp2.y}, ${redCableEnd.x} ${redCableEnd.y}`}
                fill="none"
                stroke="#fca5a5"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.5"
              />

              {/* Red Probe Pen and Needle touching the target terminal - perfectly aligned with cable & Draggable */}
              <g
                transform={`translate(${redTarget.x}, ${redTarget.y}) rotate(${redAngleDeg})`}>
                <g
                  onPointerDown={(e) => handleProbePointerDown('red', e)}
                  className="cursor-grab active:cursor-grabbing group select-none"
                  style={{ touchAction: 'none' }}
                >
                  <title>Arrastrar punta roja a bornes R, S, C o carcasa D</title>
                  {/* Expanded invisible hit area for easy touch / drag interaction */}
                  <rect x="-4" y="-9" width="38" height="18" rx="4" fill="transparent" />

                  {/* Subtle aura when dragging or hovering */}
                  {(draggingProbe === 'red') && (
                    <rect
                      x="5"
                      y="-6"
                      width="26"
                      height="12"
                      rx="3"
                      fill="rgba(239, 68, 68, 0.25)"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Silver metallic needle extending from contact point into handle */}
                  <line x1="0" y1="0" x2="8" y2="0" stroke="url(#needleGrad)" strokeWidth="2" strokeLinecap="round" />
                  {/* Red insulated collar (finger stop) */}
                  <rect x="7.5" y="-3.5" width="2.5" height="7" rx="1" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.8" />
                  {/* Red insulated main handle */}
                  <rect x="10" y="-2.5" width="16" height="5" rx="1.5" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                  {/* Handle grip ribs */}
                  <line x1="14" y1="-2" x2="14" y2="2" stroke="#ef4444" strokeWidth="0.8" />
                  <line x1="18" y1="-2" x2="18" y2="2" stroke="#ef4444" strokeWidth="0.8" />
                  <line x1="22" y1="-2" x2="22" y2="2" stroke="#ef4444" strokeWidth="0.8" />
                  {/* Strain relief boot at rear where cable enters */}
                  <rect x="26" y="-1.8" width="3" height="3.6" rx="1" fill="#7f1d1d" />
                  {/* Contact spark / touch circle on the terminal */}
                  <circle cx="0" cy="0" r="3" fill="#f87171" opacity="0.85" className="animate-pulse" />

                  {/* Interactive drag grip indicator */}
                  <text x="18" y="-6" fill="#fca5a5" fontSize="4.8" fontWeight="bold" textAnchor="middle" opacity="0.9">
                    Arrastrar
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* Toolbar under Carcasa Metálica (Chasis): Botón Bornera y Botón Foto Compresor */}
          <div className="w-full flex items-center justify-between gap-2 px-1 py-1 shrink-0">
            <div className="flex items-center gap-2">
              {/* 1. Botón de Bornera (debajo del chasis) */}
              <button
                type="button"
                onClick={onToggleOrientation}
                className="px-2.5 py-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm active:scale-95"
                title="Alternar orientación de los bornes (C abajo o C arriba)"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                <span>{orientation === 'apexDown' ? 'Bornera: C abajo' : 'Bornera: C arriba'}</span>
              </button>

              {/* 2. Botón Ver Foto Compresor */}
              <button
                type="button"
                onClick={() => setShowCompressorModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-sky-500/50 bg-sky-500/15 hover:bg-sky-500/25 text-sky-900 dark:text-sky-300 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm active:scale-95"
                title="Ver foto del compresor real y detalles de la carcasa metálica"
              >
                <Camera className="w-3.5 h-3.5 text-sky-500" />
                <span>Foto Compresor</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans hidden sm:flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Clic en chasis para ampliar foto</span>
            </div>
          </div>

          {/* Integrated Status Title Bar */}
          <div className="w-full bg-slate-900 text-white rounded-md px-2.5 py-1.5 border border-slate-700 shadow-sm flex items-center justify-between font-mono shrink-0">
            <div className="flex items-center gap-2 truncate">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isBeeping ? 'bg-red-500 animate-ping' : 'bg-amber-400 animate-pulse'}`}></div>
              <span className="text-tiny font-bold text-amber-400 truncate">
                {multimeterTitle}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 shrink-0 font-sans">
              Puntas: <span className="text-red-400 font-bold">Roja</span> y <span className="text-slate-300 font-bold">Negra</span>
            </div>
          </div>
        </div>

      {/* Modal: Fotografía de la Carcasa del Compresor Real (compresor.png) */}
      {showCompressorModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setShowCompressorModal(false)}
        >
          <div 
            className="relative bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-5 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Compresor Hermético Real
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      Carcasa y Bornes
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspección visual de la carcasa metálica (chasis) y distribución de terminales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompressorModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Container with Zoom In/Out/All & Pan Tools */}
            <div className="relative rounded-xl overflow-hidden bg-black/80 border border-slate-800 flex items-center justify-center h-[58vh]">
              <ZoomPanViewer
                className="w-full h-full flex items-center justify-center"
                containerClassName="flex items-center justify-center"
                initialZoom={1}
                minZoom={0.8}
                maxZoom={4}
                toolbarPosition="top-right"
                title="Inspección detallada del compresor hermético"
              >
                <img
                  src={compresorImg}
                  alt="Fotografía del compresor hermético real"
                  className="w-full h-auto max-h-[54vh] object-contain rounded-lg select-none shadow-lg pointer-events-none"
                  draggable={false}
                />
              </ZoomPanViewer>
            </div>

            {/* Technical Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Bornes R (Run), S (Start), C (Común) + Carcasa Metálica (D / Chasis)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCompressorModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors self-end sm:self-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
