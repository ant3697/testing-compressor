import React, { useState, useEffect } from 'react';
import { SchematicVariant } from './IntuitiveSchematicDiagram';
import { Activity, Zap, Play, Square, AlertTriangle, Info, Check, Eye } from 'lucide-react';

export type MeasurementPoint = 'line' | 'start' | 'run';

export function getCompressorAmps(
  simState: 'idle' | 'starting' | 'running' | 'overload',
  variant: SchematicVariant = 'RSIR_PTC',
  point: MeasurementPoint = 'line',
  dither: number = 0,
  overloadPhase: 'locked_rotor' | 'tripped' = 'tripped'
): number {
  const isPTC = variant.includes('PTC');
  const hasRunCap = variant.includes('RSCR') || variant.includes('CSR');
  const hasStartCap = variant.includes('CSIR') || variant.includes('CSR');

  if (simState === 'idle') return 0.0;

  if (simState === 'overload') {
    // Si el Klixon ya ha saltado (contacto bimetálico ABIERTO), el circuito queda físicamente cortado: 0.00 A
    if (overloadPhase === 'tripped') return 0.0;
    // Durante la fase previa de rotor bloqueado (LRA), antes del disparo térmico: ~16.5 A
    if (point === 'line') return 16.5 + dither * 2;
    if (point === 'start') return isPTC ? 0.05 : 12.8 + dither;
    if (point === 'run') return 15.8 + dither * 2;
    return 16.5;
  }

  if (simState === 'starting') {
    // Fase de arranque inicial (~1 segundo: ambos bobinados conectados)
    if (point === 'line') {
      const base = hasStartCap ? 14.8 : isPTC ? 13.4 : 13.8;
      return base + dither * 3;
    }
    if (point === 'start') {
      const base = hasStartCap ? 12.5 : 11.2;
      return base + dither * 2;
    }
    if (point === 'run') {
      return 4.6 + dither;
    }
  }

  // simState === 'running' (Régimen de marcha continuo a 2.850 RPM)
  if (point === 'line') {
    // Si tiene condensador de marcha permanente (RSCR o CSR), el factor de potencia mejora y la corriente es menor
    const base = hasRunCap ? 1.28 : 1.58;
    return base + dither;
  }
  if (point === 'start') {
    // En RSIR o CSIR: el devanado auxiliar queda abierto o con fuga residual mínima en la PTC (~25mA)
    if (!hasRunCap) {
      return isPTC ? 0.02 + Math.abs(dither * 0.01) : 0.0;
    }
    // En RSCR o CSR: el condensador de marcha sigue alimentando permanentemente la bobina auxiliar
    return 0.88 + dither * 0.5;
  }
  if (point === 'run') {
    const base = hasRunCap ? 1.18 : 1.55;
    return base + dither;
  }

  return 0.0;
}

interface ClampMeterProps {
  simState: 'idle' | 'starting' | 'running' | 'overload';
  variant?: SchematicVariant;
  measuredPoint?: MeasurementPoint;
  onPointChange?: (point: MeasurementPoint) => void;
  className?: string;
  wireColor?: string;
  interactive?: boolean;
}

export const ClampMeter: React.FC<ClampMeterProps> = ({
  simState,
  variant = 'RSIR_PTC',
  measuredPoint = 'line',
  onPointChange,
  className = '',
  wireColor = '#854d0e', // Color marrón típico de cable de Fase (L)
  interactive = true,
}) => {
  // Estados internos del multímetro
  const [isHold, setIsHold] = useState<boolean>(false);
  const [isBacklight, setIsBacklight] = useState<boolean>(true);
  const [isMaxInrush, setIsMaxInrush] = useState<boolean>(false);
  const [maxCapturedAmps, setMaxCapturedAmps] = useState<number>(0);
  const [heldAmps, setHeldAmps] = useState<number | null>(null);
  const [dither, setDither] = useState<number>(0);
  const [activePoint, setActivePoint] = useState<MeasurementPoint>(measuredPoint);

  // Sincronizar activePoint si cambia la prop
  useEffect(() => {
    setActivePoint(measuredPoint);
  }, [measuredPoint]);

  // Pequeño dither realista de muestreo digital (fluctuación de ±0.03A para realismo analógico/digital)
  useEffect(() => {
    if (simState === 'idle') {
      setDither(0);
      return;
    }
    const interval = setInterval(() => {
      setDither((Math.random() - 0.5) * 0.06);
    }, 280);
    return () => clearInterval(interval);
  }, [simState]);

  const currentAmpsRaw = getCompressorAmps(simState, variant, activePoint, dither);

  // Actualizar captura de pico MAX INRUSH
  useEffect(() => {
    if (simState === 'starting') {
      const startPeak = activePoint === 'line' ? 14.2 : activePoint === 'start' ? 11.8 : 4.8;
      setMaxCapturedAmps(startPeak);
    } else if (simState === 'idle') {
      setMaxCapturedAmps(0);
    }
  }, [simState, activePoint]);

  // Si está en HOLD, mantenemos la lectura congelada
  const displayAmps = isHold && heldAmps !== null 
    ? heldAmps 
    : isMaxInrush && maxCapturedAmps > 0 
    ? maxCapturedAmps 
    : Math.max(0, currentAmpsRaw);

  const formattedAmps = displayAmps === 0 ? '0.00' : displayAmps.toFixed(2);

  const handleToggleHold = () => {
    if (!isHold) {
      setHeldAmps(Math.max(0, currentAmpsRaw));
      setIsHold(true);
    } else {
      setIsHold(false);
      setHeldAmps(null);
    }
  };

  const handleSelectPoint = (pt: MeasurementPoint) => {
    setActivePoint(pt);
    if (onPointChange) onPointChange(pt);
    if (isHold) {
      setIsHold(false);
      setHeldAmps(null);
    }
  };

  // Color del cable que atraviesa la pinza según el punto medido
  const liveWireColor = 
    activePoint === 'line' 
      ? '#854d0e' // Marrón (Fase Línea L)
      : activePoint === 'start' 
      ? '#ea580c' // Naranja/Amarillo (Auxiliar S / Arranque)
      : '#2563eb'; // Azul/Rojo (Principal R / Marcha)

  const wireLabel = 
    activePoint === 'line' 
      ? 'Fase L (Línea General)' 
      : activePoint === 'start' 
      ? 'Bobina Auxiliar (S - Arranque)' 
      : 'Bobina Principal (R - Marcha)';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Selector de puntos de medición (Tabs interactivos) */}
      {interactive && (
        <div className="w-full max-w-xs mb-3 flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl gap-1 text-[11px] font-mono shadow-xs">
          <button
            type="button"
            onClick={() => handleSelectPoint('line')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
              activePoint === 'line'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Medir en el conductor de Línea general (Fase L)"
          >
            Fase L (Total)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPoint('start')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
              activePoint === 'start'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Medir en el conductor hacia la Bobina de Arranque S / PTC"
          >
            Bobina S (Arranque)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPoint('run')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
              activePoint === 'run'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Medir en el conductor hacia la Bobina de Marcha R"
          >
            Bobina R (Marcha)
          </button>
        </div>
      )}

      {/* SVG ILUSTRACIÓN TÉCNICA VECTORIAL EXACTA DE LA PINZA AMPERIMÉTRICA */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 240 500"
          className="w-56 sm:w-64 h-auto drop-shadow-2xl"
          style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.45))' }}
        >
          <defs>
            {/* Gradientes del cuerpo naranja de la pinza */}
            <linearGradient id="clampOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="15%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="85%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>

            <linearGradient id="clampDarkJawGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="25%" stopColor="#27272a" />
              <stop offset="70%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>

            <linearGradient id="clampWireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a16207" />
              <stop offset="35%" stopColor="#ca8a04" />
              <stop offset="70%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#713f12" />
            </linearGradient>

            {/* Filtro de resplandor para el cable energizado */}
            <filter id="clampWireGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Filtro de retroiluminación LCD */}
            <filter id="lcdBacklightGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#86efac" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* ========================================================================= */}
          {/* 1. MORDAZAS SUPERIORES NEGRAS (PARTE POSTERIOR) */}
          {/* ========================================================================= */}
          <g id="clamp-jaws-back">
            {/* Arco curvado izquierdo */}
            <path
              d="M 50 145 C 45 100, 52 40, 118 20 C 120 20, 120 38, 114 42 C 78 52, 70 95, 75 145 Z"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1.2"
            />
            {/* Arco curvado derecho */}
            <path
              d="M 190 145 C 195 100, 188 40, 122 20 C 120 20, 120 38, 126 42 C 162 52, 170 95, 165 145 Z"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="1.2"
            />
          </g>

          {/* ========================================================================= */}
          {/* 2. CABLE QUE ATRAVIESA HORIZONTALMENTE EL INTERIOR DE LAS MORDAZAS */}
          {/* ========================================================================= */}
          <g id="live-measured-wire">
            {/* Sombra proyectada del cable */}
            <path
              d="M 0 74 L 240 74"
              stroke="#09090b"
              strokeWidth="11"
              strokeOpacity="0.6"
            />

            {/* Cuerpo del cable aislado (Marrón Fase por defecto) */}
            <path
              d="M 0 72 L 240 72"
              stroke={liveWireColor}
              strokeWidth="9"
              strokeLinecap="square"
            />

            {/* Brillo especular superior del cable para efecto 3D cilíndrico */}
            <path
              d="M 0 69.5 L 240 69.5"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeOpacity="0.3"
            />

            {/* Campo electromagnético pulsante en arranque o marcha */}
            {simState !== 'idle' && (
              <path
                d="M 75 72 L 165 72"
                stroke="#fef08a"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
                filter="url(#clampWireGlow)"
              />
            )}
          </g>

          {/* ========================================================================= */}
          {/* 3. MORDAZAS SUPERIORES NEGRAS (PARTE FRONTAL - CUBREN EL CABLE) */}
          {/* ========================================================================= */}
          <g id="clamp-jaws-front">
            {/* Mordaza Izquierda Frontal con bisel y relieve */}
            <path
              d="M 46 150 C 42 105, 48 42, 117 18 L 120 28 C 76 46, 68 95, 72 150 Z"
              fill="url(#clampDarkJawGrad)"
              stroke="#09090b"
              strokeWidth="1.5"
            />
            {/* Mordaza Derecha Frontal con bisel y relieve */}
            <path
              d="M 194 150 C 198 105, 192 42, 123 18 L 120 28 C 164 46, 172 95, 168 150 Z"
              fill="url(#clampDarkJawGrad)"
              stroke="#09090b"
              strokeWidth="1.5"
            />

            {/* Unión central superior entre las dos mordazas (ranura de cierre) */}
            <line x1="120" y1="18" x2="120" y2="30" stroke="#09090b" strokeWidth="2.2" />

            {/* Marcados técnicos grabados en las mordazas */}
            {/* Izquierda: símbolo cuadrado [ ] y flecha de dirección hacia abajo */}
            <rect x="74" y="38" width="10" height="10" rx="1.5" fill="none" stroke="#71717a" strokeWidth="1" />
            <text x="79" y="46" fill="#a1a1aa" fontSize="6" fontWeight="bold" textAnchor="middle">7</text>
            <path d="M 60 115 L 60 125 M 57 122 L 60 125 L 63 122" stroke="#a1a1aa" strokeWidth="1.2" fill="none" />

            {/* Derecha: símbolo cuadrado y flecha de dirección hacia arriba */}
            <rect x="156" y="38" width="10" height="10" rx="1.5" fill="none" stroke="#71717a" strokeWidth="1" />
            <text x="161" y="46" fill="#a1a1aa" fontSize="6" fontWeight="bold" textAnchor="middle">4</text>
            <path d="M 180 125 L 180 115 M 177 118 L 180 115 L 183 118" stroke="#a1a1aa" strokeWidth="1.2" fill="none" />

            {/* Gatillo de apertura en el lateral izquierdo */}
            <path
              d="M 42 135 C 32 130, 24 140, 32 155 L 44 155 Z"
              fill="#18181b"
              stroke="#3f3f46"
              strokeWidth="1.2"
            />
          </g>

          {/* ========================================================================= */}
          {/* 4. CUERPO PRINCIPAL ERGONÓMICO (NARANJA Y NEGRO) */}
          {/* ========================================================================= */}
          <g id="clamp-main-chassis">
            {/* Silueta exterior naranja con empuñaduras laterales ergonómicas */}
            <path
              d="M 48 148 
                 C 48 135, 192 135, 192 148
                 L 194 170
                 C 202 185, 204 220, 196 240
                 C 190 255, 192 310, 196 335
                 C 204 365, 202 430, 186 460
                 C 174 480, 150 488, 120 488
                 C 90 488, 66 480, 54 460
                 C 38 430, 36 365, 44 335
                 C 48 310, 50 255, 44 240
                 C 36 220, 38 185, 46 170
                 Z"
              fill="url(#clampOrangeGrad)"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />

            {/* Grips laterales de goma antideslizante negra (flancos ergonómicos) */}
            {/* Grip Izquierdo */}
            <path
              d="M 45 250 C 40 270, 40 310, 46 330 L 40 330 C 34 310, 34 270, 39 250 Z"
              fill="#18181b"
            />
            <line x1="38" y1="265" x2="44" y2="265" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="37" y1="280" x2="43" y2="280" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="38" y1="295" x2="44" y2="295" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="39" y1="310" x2="45" y2="310" stroke="#3f3f46" strokeWidth="1.5" />

            {/* Grip Derecho */}
            <path
              d="M 195 250 C 200 270, 200 310, 194 330 L 200 330 C 206 310, 206 270, 201 250 Z"
              fill="#18181b"
            />
            <line x1="196" y1="265" x2="202" y2="265" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="197" y1="280" x2="203" y2="280" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="196" y1="295" x2="202" y2="295" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="195" y1="310" x2="201" y2="310" stroke="#3f3f46" strokeWidth="1.5" />

            {/* Cuello superior con bisel */}
            <path
              d="M 68 144 L 172 144 L 165 156 L 75 156 Z"
              fill="#7c2d12"
              opacity="0.4"
            />
          </g>

          {/* ========================================================================= */}
          {/* 5. SEÑALÉTICA Y TEXTOS SUPERIORES */}
          {/* ========================================================================= */}
          <g id="clamp-branding">
            {/* Triángulo de advertencia */}
            <polygon points="120,158 113,169 127,169" fill="none" stroke="#7c2d12" strokeWidth="1.2" />
            <circle cx="120" cy="166" r="0.8" fill="#7c2d12" />
            <line x1="120" y1="161" x2="120" y2="164" stroke="#7c2d12" strokeWidth="1.2" />

            {/* Título de Marca: AMP BYGORD */}
            <text
              x="62"
              y="186"
              fill="#ffffff"
              fontSize="12"
              fontWeight="900"
              fontFamily="sans-serif"
              letterSpacing="0.6"
            >
              AMP
            </text>
            <text
              x="62"
              y="196"
              fill="#ffedd5"
              fontSize="7"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.4"
            >
              BYGORD
            </text>
          </g>

          {/* ========================================================================= */}
          {/* 6. SELECTOR ROTATIVO (RULETA CENTRAL) */}
          {/* ========================================================================= */}
          <g id="rotary-dial" transform="translate(150, 205)">
            {/* Escala graduada alrededor del selector */}
            {/* Posiciones de medición */}
            <text x="-32" y="-14" fill="#ffffff" fontSize="6.5" fontWeight="bold">V~</text>
            <text x="-18" y="-28" fill="#ffedd5" fontSize="6" fontWeight="bold">V-</text>
            <text x="-40" y="4" fill="#ffffff" fontSize="6.5" fontWeight="900">400</text>
            <text x="-40" y="16" fill="#facc15" fontSize="7.5" fontWeight="900">A~</text>
            <text x="-32" y="32" fill="#ffffff" fontSize="6.5" fontWeight="bold">Ω</text>
            <text x="-16" y="44" fill="#ffedd5" fontSize="6" fontWeight="bold">F</text>
            <text x="6" y="46" fill="#ef4444" fontSize="6.5" fontWeight="bold">OFF</text>

            {/* Sombra de la ruleta */}
            <circle cx="0" cy="0" r="28" fill="#09090b" opacity="0.6" />

            {/* Corona exterior con estrías ranuradas */}
            <circle cx="0" cy="0" r="26" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            {Array.from({ length: 18 }).map((_, i) => {
              const angle = (i * 360) / 18;
              const rad = (angle * Math.PI) / 180;
              const x1 = Math.cos(rad) * 22;
              const y1 = Math.sin(rad) * 22;
              const x2 = Math.cos(rad) * 25.5;
              const y2 = Math.sin(rad) * 25.5;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3f3f46" strokeWidth="1.2" />;
            })}

            {/* Núcleo cóncavo del selector */}
            <circle cx="0" cy="0" r="20" fill="#27272a" stroke="#09090b" strokeWidth="1" />

            {/* Puntero indicador apuntando a la posición de medición A~ (hacia la izquierda y ligeramente abajo) */}
            <path
              d="M 0 0 L -18 8 L -14 0 Z"
              fill="#ffffff"
            />
            <circle cx="0" cy="0" r="6" fill="#18181b" />
          </g>

          {/* Botón de retroiluminación / linterna superior derecho */}
          <g
            id="btn-backlight"
            onClick={() => setIsBacklight(!isBacklight)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
          >
            <rect x="156" y="154" width="18" height="9" rx="2.5" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
            <circle cx="165" cy="158.5" r="2" fill="#ffffff" />
            <title>Luz de pantalla LCD ON/OFF</title>
          </g>

          {/* ========================================================================= */}
          {/* 7. BOTONERA SUPERIOR (POWER, SELECT, A/V, HOLD) */}
          {/* ========================================================================= */}
          <g id="clamp-buttons-upper">
            {/* Botón de Encendido Naranja Circular */}
            <circle cx="75" cy="225" r="9" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
            <circle cx="75" cy="225" r="7.5" fill="#f97316" />
            <path d="M 75 220 L 75 224 M 72 223 A 3.5 3.5 0 1 0 78 223" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" />

            {/* Fila de 3 botones inferiores a la ruleta */}
            {/* Botón 1: SELECT (Morado/Azul oscuro) */}
            <rect x="52" y="246" width="22" height="12" rx="3.5" fill="#6366f1" stroke="#4338ca" strokeWidth="0.8" />
            <text x="63" y="254.5" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">SEL</text>

            {/* Botón 2: A/V (Gris oscuro) */}
            <rect x="80" y="246" width="24" height="12" rx="3" fill="#27272a" stroke="#18181b" strokeWidth="0.8" />
            <text x="92" y="254.5" fill="#e4e4e7" fontSize="5.5" fontWeight="bold" textAnchor="middle">A·V</text>

            {/* Botón 3: HOLD (Interactivo) */}
            <g
              id="btn-hold"
              onClick={handleToggleHold}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <rect
                x="110"
                y="246"
                width="28"
                height="12"
                rx="3"
                fill={isHold ? '#ca8a04' : '#27272a'}
                stroke={isHold ? '#eab308' : '#18181b'}
                strokeWidth="1"
              />
              <text
                x="124"
                y="254.5"
                fill={isHold ? '#000000' : '#e4e4e7'}
                fontSize="5.5"
                fontWeight="900"
                textAnchor="middle"
              >
                HOLD
              </text>
              <title>Congelar lectura actual (HOLD)</title>
            </g>
          </g>

          {/* ========================================================================= */}
          {/* 8. PANTALLA LCD DIGITAL (PANTALLA EXACTA COMO LA IMAGEN) */}
          {/* ========================================================================= */}
          <g id="clamp-lcd-display" transform="translate(52, 272)">
            {/* Bisel protector exterior negro */}
            <rect
              x="0"
              y="0"
              width="136"
              height="80"
              rx="6"
              fill="#09090b"
              stroke="#18181b"
              strokeWidth="2"
            />

            {/* Fondo de cristal LCD (Verde grisáceo o retroiluminado mint) */}
            <rect
              x="7"
              y="7"
              width="122"
              height="66"
              rx="4"
              fill={isBacklight ? '#bbf7d0' : '#d1d5db'}
              stroke="#15803d"
              strokeWidth="1"
              filter={isBacklight ? 'url(#lcdBacklightGlow)' : 'none'}
            />

            {/* Trama sutil de textura LCD para hiperrealismo */}
            <rect
              x="7"
              y="7"
              width="122"
              height="66"
              rx="4"
              fill={isBacklight ? '#86efac' : '#9ca3af'}
              fillOpacity="0.2"
            />

            {/* Indicadores superiores del display */}
            <text
              x="14"
              y="22"
              fill="#064e3b"
              fontSize="9"
              fontWeight="900"
              fontFamily="monospace"
              letterSpacing="0.5"
            >
              AC ~
            </text>

            <text
              x="48"
              y="22"
              fill="#064e3b"
              fontSize="7.5"
              fontWeight="900"
              fontFamily="monospace"
              letterSpacing="0.4"
            >
              AUTO
            </text>

            {isHold && (
              <text
                x="88"
                y="22"
                fill="#b45309"
                fontSize="8"
                fontWeight="900"
                fontFamily="monospace"
              >
                HOLD
              </text>
            )}

            {isMaxInrush && (
              <text
                x="88"
                y="22"
                fill="#b91c1c"
                fontSize="8"
                fontWeight="900"
                fontFamily="monospace"
              >
                MAX
              </text>
            )}

            {/* Dígitos fantasma tenues de fondo 88.88 (como en un LCD real) */}
            <text
              x="98"
              y="58"
              fill={isBacklight ? '#86efac' : '#cbd5e1'}
              fontSize="32"
              fontWeight="900"
              textAnchor="end"
              fontFamily="monospace"
              letterSpacing="-1"
              opacity="0.25"
            >
              88.88
            </text>

            {/* LECTURA DIGITAL PRINCIPAL DE INTENSIDAD (Amperios reales) */}
            <text
              x="98"
              y="58"
              fill="#022c22"
              fontSize="32"
              fontWeight="900"
              textAnchor="end"
              fontFamily="monospace"
              letterSpacing="-1"
              textLength={formattedAmps.length > 4 ? "78" : "64"}
              lengthAdjust="spacingAndGlyphs"
            >
              {formattedAmps}
            </text>

            {/* Unidad A grande al final */}
            <text
              x="104"
              y="56"
              fill="#022c22"
              fontSize="19"
              fontWeight="900"
              fontFamily="monospace"
            >
              A
            </text>
          </g>

          {/* ========================================================================= */}
          {/* 9. BOTONERA INFERIOR (MAX/MIN, REL) */}
          {/* ========================================================================= */}
          <g id="clamp-buttons-lower">
            {/* Botón MAX/MIN */}
            <g
              id="btn-max-inrush"
              onClick={() => setIsMaxInrush(!isMaxInrush)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <rect
                x="60"
                y="364"
                width="34"
                height="14"
                rx="3.5"
                fill={isMaxInrush ? '#ef4444' : '#27272a'}
                stroke={isMaxInrush ? '#f87171' : '#18181b'}
                strokeWidth="0.9"
              />
              <text
                x="77"
                y="374"
                fill={isMaxInrush ? '#ffffff' : '#e4e4e7'}
                fontSize="6"
                fontWeight="bold"
                textAnchor="middle"
              >
                MAX/INR
              </text>
              <title>Captura de pico máximo de arranque (INRUSH)</title>
            </g>

            {/* Botón A·V / REL */}
            <rect x="106" y="364" width="34" height="14" rx="3.5" fill="#27272a" stroke="#18181b" strokeWidth="0.9" />
            <text x="123" y="374" fill="#e4e4e7" fontSize="6" fontWeight="bold" textAnchor="middle">REL</text>

            {/* Marcado inferior de homologación */}
            <text x="100" y="394" fill="#ffedd5" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
              CORE
            </text>
            <polygon points="120,402 115,411 125,411" fill="none" stroke="#7c2d12" strokeWidth="1" />
            <text x="120" y="420" fill="#ffedd5" fontSize="6" fontWeight="bold" textAnchor="middle">
              CAT III 600V
            </text>
          </g>

          {/* ========================================================================= */}
          {/* 10. BORNES INFERIORES DE ENTRADA (COM / INPUT) */}
          {/* ========================================================================= */}
          <g id="clamp-input-terminals">
            {/* Borne COM (Negro) */}
            <circle cx="85" cy="442" r="13" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
            <circle cx="85" cy="442" r="8" fill="#09090b" />
            <text x="85" y="433" fill="#a1a1aa" fontSize="5" fontWeight="bold" textAnchor="middle">COM</text>

            {/* Borne INPUT V/Ω (Rojo) */}
            <circle cx="155" cy="442" r="13" fill="#991b1b" stroke="#b91c1c" strokeWidth="1.5" />
            <circle cx="155" cy="442" r="8" fill="#450a0a" />
            <text x="155" y="433" fill="#fca5a5" fontSize="5" fontWeight="bold" textAnchor="middle">V·Ω</text>

            {/* Símbolo de aislamiento entre bornes */}
            <path d="M 85 460 C 100 468, 140 468, 155 460" stroke="#7c2d12" strokeWidth="1.2" fill="none" />
          </g>
        </svg>
      </div>

      {/* Cartela explicativa de estado dinámico de intensidad */}
      <div className="w-full max-w-xs mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 shadow-md">
        <div className="flex items-center justify-between text-xs mb-1.5 pb-1.5 border-b border-slate-800">
          <span className="font-bold text-slate-400 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: liveWireColor }}
            ></span>
            {wireLabel}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
              simState === 'idle'
                ? 'bg-slate-800 text-slate-400'
                : simState === 'starting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : simState === 'running'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {simState === 'idle' && '⚪ REPOSO'}
            {simState === 'starting' && '⚡ ARRANQUE (0.8-1.2s)'}
            {simState === 'running' && '🟢 RÉGIMEN NOMINAL'}
            {simState === 'overload' && '🔴 KLIXON / LRA'}
          </span>
        </div>

        {/* Datos técnicos según la fase */}
        <div className="space-y-1 text-tiny text-slate-300 leading-snug">
          {simState === 'idle' && (
            <p>
              Circuito sin tensión (0 V, 0.00 A). Pinza lista para registrar la intensidad al energizar el compresor.
            </p>
          )}

          {simState === 'starting' && (
            <p className="text-amber-200">
              <strong>Pico de arranque (Inrush):</strong> En este primer segundo ambos bobinados (R y S) conducen simultáneamente. La corriente total de línea alcanza entre <strong>12 A y 15 A</strong> para generar el par de arranque electromagnético necesario.
            </p>
          )}

          {simState === 'running' && (
            <p className="text-emerald-200">
              <strong>Intensidad nominal (In):</strong> El compresor funciona a 2.850 RPM. En sistemas RSIR/CSIR el bobinado de arranque ya está desconectado; en RSCR/CSR sigue alimentado con baja intensidad por el condensador de marcha permanente. Consumo actual: <strong>~{formattedAmps} A</strong>.
            </p>
          )}

          {simState === 'overload' && (
            <p className="text-rose-200">
              <strong>Disparo por Klixon (Corte Térmico):</strong> El motor alcanzó corriente de rotor bloqueado (LRA: <strong>16.5 A</strong>), calentando la resistencia del Klixon hasta abrir el bimetal. Al estar el contacto <strong>ABIERTO</strong>, la intensidad se interrumpe y cae a <strong>0.00 A</strong> para proteger el bobinado.
            </p>
          )}
        </div>

        {/* Micro-controles directos de la pinza */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={handleToggleHold}
            className={`px-2 py-1 rounded font-bold transition-colors ${
              isHold
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isHold ? 'HOLD Activo (Soltar)' : 'HOLD (Congelar)'}
          </button>

          <button
            type="button"
            onClick={() => setIsBacklight(!isBacklight)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Luz LCD {isBacklight ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
