import React, { useState } from 'react';
import { DifferentialSwitchSvg } from './DifferentialSwitchSvg';

export interface Case2ConnectedCircuitSvgProps {
  orientation: 'apexDown' | 'apexUp';
  rMarcha?: string;
  rArranque?: string;
  rTotal?: string;
  isTripped?: boolean;
  onToggleTripped?: () => void;
  className?: string;
  onKlixonClick?: () => void;
  onTriggerAudio?: () => void;
}

export const Case2ConnectedCircuitSvg: React.FC<Case2ConnectedCircuitSvgProps> = ({
  orientation = 'apexDown',
  rMarcha = '9.7',
  rArranque = '13.1',
  rTotal = '22.8',
  isTripped = true,
  onToggleTripped,
  className = '',
  onKlixonClick,
  onTriggerAudio,
}) => {
  const [internalTripped, setInternalTripped] = useState<boolean>(isTripped);
  const [isSparking, setIsSparking] = useState<boolean>(false);

  React.useEffect(() => {
    setInternalTripped(isTripped);
  }, [isTripped]);

  const currentTripped = isTripped !== undefined ? isTripped : internalTripped;

  const handleAction = () => {
    if (onTriggerAudio) {
      onTriggerAudio();
    }
    if (onToggleTripped) {
      onToggleTripped();
    } else {
      if (internalTripped) {
        // Intento de rearme con fallo a tierra: sube a ON y salta de inmediato con chispa
        setInternalTripped(false);
        setIsSparking(true);
        setTimeout(() => {
          setInternalTripped(true);
          setIsSparking(false);
        }, 180);
      } else {
        setInternalTripped(true);
      }
    }
  };

  // Coordenadas relativas del compresor
  // Compresor colocado en X = 470, Y = 25 dentro del viewBox 0 0 880 480
  const compX = 470;
  const compY = 25;

  const isApexDown = orientation === 'apexDown';

  // Coordenadas globales de los Bornes según orientación
  const pinC = isApexDown
    ? { x: compX + 180, y: compY + 295 } // C abajo
    : { x: compX + 180, y: compY + 140 }; // C arriba

  const pinR = isApexDown
    ? { x: compX + 120, y: compY + 160 } // R arriba-izq
    : { x: compX + 120, y: compY + 275 }; // R abajo-izq

  const pinS = isApexDown
    ? { x: compX + 240, y: compY + 160 } // S arriba-der
    : { x: compX + 240, y: compY + 275 }; // S abajo-der

  const groundPin = isApexDown
    ? { x: compX + 285, y: compY + 345 } // Masa abajo-der
    : { x: compX + 285, y: compY + 55 }; // Masa arriba-der

  // Coordenadas de bornes del diferencial (escalado 0.68 dentro de translate(25, 25))
  const diffScale = 0.68;
  const diffX = 25;
  const diffY = 25;

  // Borne 2 inferior (salida fase al compresor) - A LA IZQUIERDA
  const diff2Out = { x: diffX + 90 * diffScale, y: diffY + 558 * diffScale }; // ~ (86.2, 404.4)
  // Borne N inferior (salida neutro al compresor) - A LA DERECHA
  const diffNOut = { x: diffX + 230 * diffScale, y: diffY + 558 * diffScale }; // ~ (181.4, 404.4)

  // Bornes superiores (alimentación general)
  // Borne 1 superior (entrada fase de red) - A LA IZQUIERDA
  const diff1In = { x: diffX + 90 * diffScale, y: diffY + 62 * diffScale }; // ~ (86.2, 67.2)
  // Borne N superior (entrada neutro de red) - A LA DERECHA
  const diffNIn = { x: diffX + 230 * diffScale, y: diffY + 62 * diffScale }; // ~ (181.4, 67.2)

  // Toma de tierra general de la instalación
  const earthSource = { x: 340, y: 465 };

  // Trayectorias Bézier de los cables
  // 1. Cable Fase (Marrón): de Borne 2 (Izquierda) del Diferencial a Borne R (Run / Marcha) del Compresor
  const pathFase = isApexDown
    ? `M ${diff2Out.x},${diff2Out.y} C ${diff2Out.x + 80},${diff2Out.y - 25} ${compX - 120},${pinR.y + 70} ${compX - 25},${pinR.y + 25} C ${compX + 30},${pinR.y - 10} ${pinR.x - 50},${pinR.y + 5} ${pinR.x},${pinR.y}`
    : `M ${diff2Out.x},${diff2Out.y} C ${diff2Out.x + 80},${diff2Out.y + 15} ${compX - 100},${pinR.y + 40} ${compX - 20},${pinR.y + 20} C ${compX + 35},${pinR.y + 5} ${pinR.x - 45},${pinR.y + 10} ${pinR.x},${pinR.y}`;

  // 2. Cable Neutro (Azul): de Borne N (Derecha) del Diferencial a Borne C (Común) del Compresor
  const pathNeutro = isApexDown
    ? `M ${diffNOut.x},${diffNOut.y} C ${diffNOut.x + 60},${diffNOut.y + 25} ${compX - 90},${pinC.y + 60} ${compX},${pinC.y + 35} C ${compX + 60},${pinC.y + 20} ${pinC.x - 55},${pinC.y + 15} ${pinC.x},${pinC.y}`
    : `M ${diffNOut.x},${diffNOut.y} C ${diffNOut.x + 70},${diffNOut.y - 30} ${compX - 100},${pinC.y + 70} ${compX - 15},${pinC.y + 20} C ${compX + 40},${pinC.y - 25} ${pinC.x - 55},${pinC.y - 10} ${pinC.x},${pinC.y}`;

  // 3. Cable Tierra PE (Verde-Amarillo): de Barra General PE al Borne de Masa del Chasis
  const pathTierra = isApexDown
    ? `M ${earthSource.x},${earthSource.y} C ${earthSource.x + 100},${earthSource.y + 5} ${compX + 80},${groundPin.y + 65} ${compX + 200},${groundPin.y + 50} C ${compX + 250},${groundPin.y + 40} ${groundPin.x},${groundPin.y + 30} ${groundPin.x},${groundPin.y}`
    : `M ${earthSource.x},${earthSource.y} C ${earthSource.x + 120},${earthSource.y - 20} ${compX + 370},${compY + 360} ${compX + 370},${compY + 160} C ${compX + 370},${groundPin.y + 40} ${groundPin.x + 40},${groundPin.y} ${groundPin.x},${groundPin.y}`;

  // Trayectoria de la fuga a tierra a través de la carcasa de acero:
  // Desde el punto de derivación de la bobina R hasta el tornillo PE
  const pathFugaMasa = `M ${pinR.x - 25},${pinR.y} Q ${compX + 60},${compY + 230} ${groundPin.x},${groundPin.y}`;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 880 480"
        className="w-full h-auto max-h-[460px] drop-shadow-2xl font-sans"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Patrón rayado normativo Verde-Amarillo para cable PE */}
          <pattern id="cablePEStripes" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#16a34a" strokeWidth="8" />
            <line x1="8" y1="0" x2="8" y2="16" stroke="#eab308" strokeWidth="8" />
          </pattern>

          {/* Brillos metálicos y esferas doradas de bornes */}
          <radialGradient id="connPinGold" cx="30%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          {/* Resplandor de chispa de arco de derivación a tierra */}
          <filter id="arcGlowConn" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sombra para cables */}
          <filter id="cableShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* Terminal / Puntera de compresión crimpada metálica */}
          <linearGradient id="ferruleMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
        </defs>

        {/* ======================================================== */}
        {/* SECCIÓN 1: ALIMENTACIÓN ELÉCTRICA SUPERIOR (RED 230V~)    */}
        {/* ======================================================== */}
        <g id="red-electrica-entrada" opacity="0.9">
          {/* Cable de entrada Neutro */}
          <path
            d={`M ${diffNIn.x},0 L ${diffNIn.x},${diffNIn.y}`}
            stroke="#0284c7"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M ${diffNIn.x},0 L ${diffNIn.x},${diffNIn.y}`}
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Cable de entrada Fase */}
          <path
            d={`M ${diff1In.x},0 L ${diff1In.x},${diff1In.y}`}
            stroke="#854d0e"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M ${diff1In.x},0 L ${diff1In.x},${diff1In.y}`}
            stroke="#b45309"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Rótulo de entrada de red */}
          <rect x={diffX + 10} y="4" width="200" height="20" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text
            x={diffX + 110}
            y="17"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            RED ELÉCTRICA (230V 50Hz)
          </text>
        </g>

        {/* ======================================================== */}
        {/* SECCIÓN 2: INTERRUPTOR DIFERENCIAL (LADO IZQUIERDO)      */}
        {/* ======================================================== */}
        <g
          id="diferencial-wrapper"
          transform={`translate(${diffX}, ${diffY}) scale(${diffScale})`}
          className="cursor-pointer"
          onClick={handleAction}
        >
          <title>Interruptor Diferencial TSL3-100 (30mA). Haz clic para intentar rearmar.</title>
          <DifferentialSwitchSvg asGroup={true} isTripped={currentTripped} onToggle={handleAction} interactive={false} />
        </g>

        {/* Estado flotante sobre el diferencial */}
        <g transform={`translate(${diffX + 110}, ${diffY + 435})`}>
          <rect
            x="-105"
            y="-10"
            width="210"
            height="24"
            rx="5"
            fill={currentTripped ? '#ef4444' : '#22c55e'}
            fillOpacity="0.15"
            stroke={currentTripped ? '#ef4444' : '#22c55e'}
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill={currentTripped ? '#f87171' : '#4ade80'}
            fontSize="10.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {currentTripped ? '⚡ DISPARADO (0 · OFF)' : '✓ CONECTADO (I · ON)'}
          </text>
        </g>

        {/* ======================================================== */}
        {/* SECCIÓN 3: COMPRESOR HERMÉTICO Y BOBINADOS (DERECHA)     */}
        {/* ======================================================== */}
        <g id="compresor-wrapper">
          {/* Carcasa Metálica de Acero del Compresor */}
          <rect
            x={compX + 12}
            y={compY + 12}
            width="356"
            height="426"
            rx="28"
            fill="#0b121e"
            stroke="#ef4444"
            strokeWidth={3}
            strokeDasharray="6 5"
            className="animate-pulse"
          />

          {/* Encabezado: Carcasa Metálica */}
          <text
            x={compX + 32}
            y={compY + 38}
            fill="#7e92ab"
            fontSize="11.5"
            fontWeight="700"
            letterSpacing="0.05em"
            fontFamily="monospace"
          >
            CARCASA METÁLICA (CHASIS)
          </text>

          {/* Resalte Multímetro: Medición de Aislamiento Defectuoso */}
          <g transform={`translate(${compX + 26}, ${compY + 52})`}>
            <rect
              x="0"
              y="0"
              width="216"
              height="40"
              rx="6"
              fill="#180b0b"
              stroke="#ef4444"
              strokeWidth="1.5"
              filter="url(#arcGlowConn)"
            />
            <text x="10" y="16" fill="#f87171" fontSize="9" fontWeight="bold" fontFamily="monospace">
              MULTÍMETRO (BORNE - CHASIS)
            </text>
            <text x="10" y="32" fill="#ef4444" fontSize="13.5" fontWeight="bold" fontFamily="monospace">
              85.4 Ω (CONTINUIDAD A MASA)
            </text>
          </g>

          {/* Domo circular negro central con bornes */}
          <circle
            cx={compX + 180}
            cy={compY + 225}
            r="105"
            fill="#080f1a"
            stroke="#1d2c44"
            strokeWidth="7"
          />
          <circle
            cx={compX + 180}
            cy={compY + 225}
            r="98"
            fill="#091322"
            stroke="#152033"
            strokeWidth="2"
          />

          {/* Bobinados Interiores C-R, C-S, R-S */}
          <g id="bobinados-internos">
            {/* Bobinado de Marcha (C - R): Trazo continuo verde/esmeralda */}
            <path
              d={`M ${pinC.x},${pinC.y} L ${pinR.x},${pinR.y}`}
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Bobinado de Arranque (C - S): Trazo discontinuo naranja */}
            <path
              d={`M ${pinC.x},${pinC.y} L ${pinS.x},${pinS.y}`}
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
            {/* Suma de resistencias (R - S): Trazo discontinuo azul */}
            <path
              d={`M ${pinR.x},${pinR.y} L ${pinS.x},${pinS.y}`}
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          </g>

          {/* ARCO DE DERIVACIÓN: Fuga directa de Winding R hacia la chapa metálica */}
          <g id="arco-derivacion">
            <path
              d={`M ${pinR.x},${pinR.y} L ${compX + 12},${pinR.y + 40}`}
              stroke="#ef4444"
              strokeWidth="4.5"
              strokeLinecap="round"
              filter="url(#arcGlowConn)"
              className="animate-pulse"
            />
            {/* Punto de impacto del arco en la chapa del chasis */}
            <circle
              cx={compX + 12}
              cy={pinR.y + 40}
              r="6"
              fill="#ef4444"
              filter="url(#arcGlowConn)"
            >
              <animate attributeName="r" values="5;7.5;5" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={compX + 12}
              cy={pinR.y + 40}
              r="3"
              fill="#fef08a"
            />
            {/* Chispitas eléctricas de fallo */}
            <path
              d={`M ${compX + 18},${pinR.y + 30} L ${compX + 28},${pinR.y + 24} M ${compX + 20},${pinR.y + 50} L ${compX + 32},${pinR.y + 58}`}
              stroke="#fef08a"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* RUTA DE CORRIENTE DE FUGA POR EL CHASIS (Flechas animadas hacia el borne PE) */}
          <path
            d={pathFugaMasa}
            stroke="#f97316"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
            strokeLinecap="round"
            className="animate-pulse"
          />

          {/* BORNES METÁLICOS CON ESFERA DORADA 3D */}
          {/* Borne C */}
          <g transform={`translate(${pinC.x}, ${pinC.y})`}>
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="0" cy="0" r="11" fill="url(#connPinGold)" filter="url(#arcGlowConn)" />
          </g>
          {/* Badge Borne C */}
          <g transform={`translate(${pinC.x}, ${isApexDown ? pinC.y + 28 : pinC.y - 28})`}>
            <rect x="-35" y="-10" width="70" height="20" rx="10" fill="#f59e0b" />
            <text x="0" y="4" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace">
              C (Común)
            </text>
          </g>

          {/* Borne R */}
          <g transform={`translate(${pinR.x}, ${pinR.y})`}>
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
            <circle cx="0" cy="0" r="11" fill="url(#connPinGold)" />
          </g>
          {/* Badge Borne R */}
          <g transform={`translate(${pinR.x - 38}, ${pinR.y - (isApexDown ? 18 : -18)})`}>
            <rect x="-24" y="-9" width="48" height="18" rx="9" fill="#10b981" />
            <text x="0" y="4" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace">
              R (Run)
            </text>
          </g>

          {/* Borne S */}
          <g transform={`translate(${pinS.x}, ${pinS.y})`}>
            <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="0" cy="0" r="11" fill="url(#connPinGold)" />
          </g>
          {/* Badge Borne S */}
          <g transform={`translate(${pinS.x + 38}, ${pinS.y - (isApexDown ? 18 : -18)})`}>
            <rect x="-25" y="-9" width="50" height="18" rx="9" fill="#f59e0b" />
            <text x="0" y="4" textAnchor="middle" fill="#000" fontSize="11" fontWeight="bold" fontFamily="monospace">
              S (Start)
            </text>
          </g>

          {/* BORNE DE TOMA DE TIERRA DEL CHASIS (Tornillo con arandela de cobre + Símbolo PE) */}
          <g transform={`translate(${groundPin.x}, ${groundPin.y})`}>
            <circle cx="0" cy="0" r="17" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            <circle cx="0" cy="0" r="12" fill="#eab308" />
            {/* Símbolo de tierra PE grabado */}
            <circle cx="-16" cy="0" r="12" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
            <g transform="translate(-16, 0) scale(0.65)">
              <line x1="-8" y1="-5" x2="8" y2="-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-5" y1="-1" x2="5" y2="-1" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-2" y1="3" x2="2" y2="3" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="-10" x2="0" y2="-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </g>

          {/* Etiqueta inferior del compresor: Razón del disparo */}
          <g transform={`translate(${compX + 190}, ${compY + 412})`}>
            <rect
              x="-140"
              y="-12"
              width="280"
              height="24"
              rx="6"
              fill="#7f1d1d"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#fef2f2"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              ⚡ SALTA DIFERENCIAL (Fuga &gt; 30mA)
            </text>
          </g>
        </g>

        {/* ======================================================== */}
        {/* SECCIÓN 4: CABLEADO ELÉCTRICO REALISTA ENTRE AMBOS       */}
        {/* ======================================================== */}
        <g id="cables-de-conexion" filter="url(#cableShadow)">
          {/* 1. CABLE AZUL (NEUTRO N): Salida N Diferencial -> Borne C (Común) Compresor */}
          <path
            d={pathNeutro}
            stroke="#0284c7"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathNeutro}
            stroke="#38bdf8"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. CABLE MARRÓN (FASE L1): Salida 2 Diferencial -> Borne R (Run / Marcha) Compresor */}
          <path
            d={pathFase}
            stroke="#78350f"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathFase}
            stroke="#b45309"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulso de corriente activa por Fase (solo cuando está armado o salta) */}
          {(!currentTripped || isSparking) && (
            <path
              d={pathFase}
              stroke="#fef08a"
              strokeWidth="4"
              strokeDasharray="12 12"
              fill="none"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}

          {/* 3. CABLE VERDE-AMARILLO (TIERRA PE): Barra PE -> Tornillo de Chasis */}
          {/* Base verde gruesa */}
          <path
            d={pathTierra}
            stroke="#15803d"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Rayado normativo amarillo diagonal */}
          <path
            d={pathTierra}
            stroke="url(#cablePEStripes)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathTierra}
            stroke="#fef08a"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Punteras/Terminales de crimpado metálicas en las puntas de los cables */}
          {/* En salida diferencial N */}
          <circle cx={diffNOut.x} cy={diffNOut.y} r="6" fill="url(#ferruleMetal)" stroke="#1f2937" strokeWidth="1" />
          {/* En salida diferencial 2 */}
          <circle cx={diff2Out.x} cy={diff2Out.y} r="6" fill="url(#ferruleMetal)" stroke="#1f2937" strokeWidth="1" />

          {/* En Borne R */}
          <circle cx={pinR.x} cy={pinR.y} r="5" fill="url(#ferruleMetal)" stroke="#1f2937" strokeWidth="1" />
          {/* En Borne C */}
          <circle cx={pinC.x} cy={pinC.y} r="5" fill="url(#ferruleMetal)" stroke="#1f2937" strokeWidth="1" />
          {/* En Terminal de Tierra PE */}
          <circle cx={groundPin.x} cy={groundPin.y} r="6" fill="url(#ferruleMetal)" stroke="#1f2937" strokeWidth="1" />
        </g>

        {/* ======================================================== */}
        {/* SECCIÓN 5: ETIQUETAS TÉCNICAS Y EXPLICACIÓN DEL CIRCUITO */}
        {/* ======================================================== */}
        {/* BOCADILLO DIDÁCTICO CENTRAL: LÓGICA DE DISPARO DEL TOROIDE */}
        <g transform="translate(355, 120)" opacity="0.95">
          <rect
            x="-78"
            y="-38"
            width="156"
            height="76"
            rx="8"
            fill="#0b1329"
            stroke="#f59e0b"
            strokeWidth="1.5"
            filter="url(#cableShadow)"
          />
          <text x="0" y="-22" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">
            LÓGICA DEL TOROIDE
          </text>
          <text x="0" y="-8" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">
            I_Fase: 2.7 A (Entra)
          </text>
          <text x="0" y="6" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            I_Neutro: 0.0 A (Retorno)
          </text>
          <line x1="-68" y1="12" x2="68" y2="12" stroke="#334155" strokeWidth="1" />
          <text x="0" y="26" textAnchor="middle" fill="#ef4444" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            ΔI: 2.7 A &gt;&gt; 30 mA ⚡
          </text>
        </g>

        {/* Etiqueta Cable Fase (L1) -> Borne R */}
        <g transform={`translate(${compX - 90}, ${isApexDown ? pinR.y + 20 : pinR.y + 25})`}>
          <rect x="-42" y="-9" width="84" height="18" rx="4" fill="#78350f" stroke="#b45309" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            FASE (L1) 230V
          </text>
        </g>

        {/* Etiqueta Cable Neutro (N) -> Borne C */}
        <g transform={`translate(${compX - 90}, ${isApexDown ? pinC.y + 30 : pinC.y + 15})`}>
          <rect x="-40" y="-9" width="80" height="18" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
            NEUTRO (N)
          </text>
        </g>

        {/* Barra / Símbolo de Tierra General de la Instalación */}
        <g transform={`translate(${earthSource.x}, ${earthSource.y})`}>
          <rect x="-55" y="-12" width="110" height="24" rx="5" fill="#14532d" stroke="#22c55e" strokeWidth="1.2" />
          <text x="0" y="4" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="bold" fontFamily="monospace">
            ⏚ TIERRA (PE)
          </text>
        </g>
      </svg>
    </div>
  );
};
