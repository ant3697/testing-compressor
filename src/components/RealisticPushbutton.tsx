import React from 'react';
import { Zap, RotateCw } from 'lucide-react';

interface RealisticPushbuttonProps {
  isBridging: boolean;
  powerOn: boolean;
  isMotorRunning: boolean;
  klixonTripped: boolean;
  onStartBridge: () => void;
  onEndBridge: () => void;
  onClick?: () => void;
  compact?: boolean;
  showTerminals?: boolean;
  className?: string;
}

/**
 * RealisticPushbutton Component
 * Accurately models the workshop direct-start pushbutton bridging terminals R and S.
 * Displays:
 *  1. Pressed state ("Pulsado: Puente - inicio del arranque") with depressed blue plunger, closed contacts, sparks and active current.
 *  2. Unpressed state ("Sin pulsar: estado de motor ya arrancado" or "estado de parada") with extended plunger and open contacts.
 */
export const RealisticPushbutton: React.FC<RealisticPushbuttonProps> = ({
  isBridging,
  powerOn,
  isMotorRunning,
  klixonTripped,
  onStartBridge,
  onEndBridge,
  onClick,
  compact = false,
  showTerminals = true,
  className = ''
}) => {
  const isEnergized = powerOn && !klixonTripped;
  const isCurrentFlowing = isBridging && isEnergized;

  // Determine current operating state label
  const getStateInfo = () => {
    if (isBridging) {
      return {
        label: 'PULSADO: PUENTE R ⟷ S (INICIO DEL ARRANQUE)',
        sublabel: 'Contacto cerrado • Tensión aplicada al devanado auxiliar',
        badgeColor: 'bg-amber-400 text-black border-amber-500 shadow-[0_0_12px_#f59e0b]',
        wireStroke: 'stroke-amber-400',
        spark: true
      };
    }
    if (isMotorRunning) {
      return {
        label: 'SIN PULSAR: MOTOR YA ARRANCADO (~2.850 RPM)',
        sublabel: 'Contacto abierto • Devanado auxiliar desconectado (Marcha normal)',
        badgeColor: 'bg-emerald-500/90 text-black border-emerald-400',
        wireStroke: 'stroke-slate-600',
        spark: false
      };
    }
    return {
      label: 'SIN PULSAR: ESTADO DE PARADA',
      sublabel: 'Contacto abierto • Esperando impulso para vencer inercia',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      wireStroke: 'stroke-slate-600',
      spark: false
    };
  };

  const stateInfo = getStateInfo();

  return (
    <div
      className={`flex flex-col items-center select-none cursor-pointer group ${className}`}
      onClick={onClick}
      onMouseDown={onStartBridge}
      onMouseUp={onEndBridge}
      onMouseLeave={onEndBridge}
      onTouchStart={onStartBridge}
      onTouchEnd={onEndBridge}
      role="button"
      tabIndex={0}
      title="Pulsador Puente R-S: Haz clic o mantén pulsado (1-2s) para arrancar el compresor"
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (onClick) onClick();
        }
      }}
    >
      {/* HEADER TITLE AS SHOWN IN WORKSHOP DIAGRAM */}
      <div className="text-center mb-1">
        <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-slate-200 block uppercase drop-shadow-sm">
          PULSADOR
        </span>
        <span className="font-mono text-[10px] sm:text-xs font-bold text-amber-400 tracking-tight block">
          (PUENTE R - S)
        </span>
      </div>

      {/* SVG REALISTIC PUSHBUTTON ASSEMBLY */}
      <svg
        viewBox={showTerminals ? '0 0 160 210' : '0 0 140 120'}
        className={`${compact ? 'w-32 h-auto' : 'w-44 sm:w-48 h-auto'} cursor-pointer filter drop-shadow-xl transition-transform active:scale-95`}
        aria-label="Pulsador de arranque directo puente R-S"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onStartBridge();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onEndBridge();
          }
        }}
      >
        <defs>
          {/* Blue plunger button 3D gradient */}
          <linearGradient id="pbPlungerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="25%" stopColor="#2563eb" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="85%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Plunger top cap specular gradient */}
          <radialGradient id="pbCapGrad" cx="45%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="40%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>

          {/* Chrome / metallic bushing collar gradient */}
          <linearGradient id="pbChromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="20%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Metal housing casing gradient */}
          <linearGradient id="pbHousingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Terminal brass/silver pin gradient */}
          <linearGradient id="pbPinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Spark glow filter */}
          <filter id="pbSparkGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* 1. BLUE BUTTON PLUNGER (ANIMATED UP / DOWN WITH CLICK MOTION) */}
        {/* ------------------------------------------------------------- */}
        <g
          id="pb-blue-plunger"
          transform={isBridging ? 'translate(0, 8)' : 'translate(0, 0)'}
          style={{ transition: 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {/* Blue stem cylinder */}
          <rect
            x="68"
            y={isBridging ? 16 : 10}
            width="24"
            height={isBridging ? 12 : 18}
            rx="3"
            fill="url(#pbPlungerGrad)"
            stroke="#1d4ed8"
            strokeWidth="0.8"
          />

          {/* Blue top domed cap */}
          <ellipse
            cx="80"
            cy={isBridging ? 16 : 10}
            rx="14"
            ry="4.5"
            fill="url(#pbCapGrad)"
            stroke="#1e40af"
            strokeWidth="0.8"
          />

          {/* Highlight sheen line on top cap */}
          <ellipse cx="78" cy={isBridging ? 15 : 9} rx="8" ry="2" fill="#ffffff" opacity="0.45" />

          {/* Push indicator arrows on plunger when not bridging */}
          {!isBridging && (
            <g opacity="0.75">
              <path d="M 80 14 L 80 18 M 77 16 L 80 18 L 83 16" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 2. METALLIC THREADED BUSHING & HEXAGONAL MOUNTING COLLAR       */}
        {/* ------------------------------------------------------------- */}
        <g id="pb-metal-collar">
          {/* Threaded cylinder neck */}
          <rect x="66" y="24" width="28" height="10" rx="1.5" fill="url(#pbChromeGrad)" stroke="#334155" strokeWidth="0.8" />
          {/* Thread grooves */}
          <line x1="67" y1="27" x2="93" y2="27" stroke="#475569" strokeWidth="0.8" />
          <line x1="67" y1="30" x2="93" y2="30" stroke="#475569" strokeWidth="0.8" />

          {/* Hexagonal mounting nut / bezel collar */}
          <polygon
            points="58,34 102,34 98,40 62,40"
            fill="url(#pbChromeGrad)"
            stroke="#1e293b"
            strokeWidth="1"
          />
          {/* Collar center highlight */}
          <line x1="62" y1="37" x2="98" y2="37" stroke="#f8fafc" strokeWidth="0.6" opacity="0.8" />

          {/* Rubber washer */}
          <rect x="60" y="40" width="40" height="2.5" rx="0.8" fill="#0f172a" stroke="#000000" strokeWidth="0.5" />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 3. RECTANGULAR METALLIC/BAKELITE SWITCH HOUSING               */}
        {/* ------------------------------------------------------------- */}
        <g id="pb-housing">
          <rect
            x="58"
            y="42"
            width="44"
            height="32"
            rx="3"
            fill="url(#pbHousingGrad)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Casing bevel highlight */}
          <rect x="60" y="44" width="40" height="28" rx="2" fill="none" stroke="#64748b" strokeWidth="0.6" opacity="0.5" />

          {/* Side mounting screw heads */}
          <circle cx="62.5" cy="58" r="1.8" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
          <line x1="61.5" y1="58" x2="63.5" y2="58" stroke="#1e293b" strokeWidth="0.5" />
          <circle cx="97.5" cy="58" r="1.8" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
          <line x1="96.5" y1="58" x2="98.5" y2="58" stroke="#1e293b" strokeWidth="0.5" />

          {/* Internal Contact Bridge Indicator inside housing */}
          <g transform="translate(80, 58)">
            {/* Contact terminals */}
            <circle cx="-10" cy="0" r="1.8" fill={isCurrentFlowing ? '#4ade80' : '#94a3b8'} />
            <circle cx="10" cy="0" r="1.8" fill={isCurrentFlowing ? '#facc15' : '#94a3b8'} />

            {/* Moving bridge contact arm */}
            {isBridging ? (
              <g>
                <line x1="-10" y1="0" x2="10" y2="0" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" filter="url(#pbSparkGlow)" />
                <circle cx="0" cy="0" r="3.5" fill="#ffffff" className="animate-ping" opacity="0.9" />
                <circle cx="0" cy="0" r="2" fill="#fbbf24" />
              </g>
            ) : (
              <g>
                {/* Contact open position */}
                <line x1="-10" y1="0" x2="6" y2="-7" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
              </g>
            )}
          </g>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 4. THREE METAL TERMINAL LUGS AT BOTTOM                        */}
        {/* ------------------------------------------------------------- */}
        <g id="pb-pins">
          {/* Left Pin 1 (Connects to R - Green Wire) */}
          <rect x="64" y="74" width="5" height="11" rx="1" fill="url(#pbPinGrad)" stroke="#475569" strokeWidth="0.6" />
          <circle cx="66.5" cy="80" r="1" fill="#0f172a" />

          {/* Center Pin 2 (NC - No Connection) */}
          <rect x="77.5" y="74" width="5" height="9" rx="1" fill="url(#pbPinGrad)" stroke="#475569" strokeWidth="0.6" opacity="0.65" />

          {/* Right Pin 3 (Connects to S - Yellow/Orange Wire) */}
          <rect x="91" y="74" width="5" height="11" rx="1" fill="url(#pbPinGrad)" stroke="#475569" strokeWidth="0.6" />
          <circle cx="93.5" cy="80" r="1" fill="#0f172a" />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* 5. CONNECTION WIRES & COMPRESSOR TERMINALS BOX (image.png)    */}
        {/* ------------------------------------------------------------- */}
        {showTerminals && (
          <g id="pb-terminal-box">
            {/* GREEN WIRE: Switch Pin 1 -> Terminal R (Marcha / Run) */}
            <path
              d="M 66.5 85 L 66.5 125 L 50 125 L 50 165"
              fill="none"
              stroke={isCurrentFlowing ? '#22c55e' : '#15803d'}
              strokeWidth={isCurrentFlowing ? 3.5 : 2.5}
              strokeLinecap="round"
              strokeDasharray={isCurrentFlowing ? '5 3' : undefined}
              filter={isCurrentFlowing ? 'url(#pbSparkGlow)' : undefined}
              className={isCurrentFlowing ? 'animate-pulse' : ''}
            />

            {/* YELLOW/ORANGE WIRE: Switch Pin 3 -> Terminal S (Start) */}
            <path
              d="M 93.5 85 L 93.5 125 L 110 125 L 110 165"
              fill="none"
              stroke={isCurrentFlowing ? '#facc15' : '#b45309'}
              strokeWidth={isCurrentFlowing ? 3.5 : 2.5}
              strokeLinecap="round"
              strokeDasharray={isCurrentFlowing ? '5 3' : undefined}
              filter={isCurrentFlowing ? 'url(#pbSparkGlow)' : undefined}
              className={isCurrentFlowing ? 'animate-pulse' : ''}
            />

            {/* Spark Arcs at Terminals R and S when bridging */}
            {isCurrentFlowing && (
              <g>
                <circle cx="50" cy="165" r="5" fill="#4ade80" className="animate-ping" opacity="0.75" />
                <circle cx="110" cy="165" r="5" fill="#facc15" className="animate-ping" opacity="0.75" />
              </g>
            )}

            {/* DASHED BOX ENCLOSING TERMINALS C, R, S AS IN USER'S IMAGE */}
            <rect
              x="22"
              y="110"
              width="116"
              height="85"
              rx="10"
              fill="#060911"
              fillOpacity="0.85"
              stroke="#64748b"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />

            {/* TERMINAL C (TOP CENTER - FASE) */}
            <g id="term-c" transform="translate(80, 130)">
              {/* Outer halo */}
              <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#d97706" strokeWidth="2" />
              {/* Inner pin */}
              <circle cx="0" cy="0" r="5.5" fill="#f59e0b" />
              {/* Letter C */}
              <text x="0" y="3" fill="#000000" fontSize="8" fontWeight="900" textAnchor="middle">
                C
              </text>
              {/* Label (Fase) with orange badge as in user's image */}
              <g transform="translate(0, 16)">
                <rect x="-18" y="-7" width="36" height="12" rx="3" fill="#000000" stroke="#f59e0b" strokeWidth="1.2" />
                <text x="0" y="2" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  (Fase)
                </text>
              </g>
            </g>

            {/* TERMINAL R (BOTTOM LEFT - MARCHA / RUN) */}
            <g id="term-r" transform="translate(50, 168)">
              {/* Outer halo */}
              <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
              {/* Inner pin */}
              <circle cx="0" cy="0" r="6" fill="#22c55e" />
              {/* Letter R */}
              <text x="0" y="3.5" fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">
                R
              </text>
              {/* Label (Marcha / Run) */}
              <text x="-13" y="16" fill="#4ade80" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                Marcha (R)
              </text>
            </g>

            {/* TERMINAL S (BOTTOM RIGHT - ARRANQUE / START) */}
            <g id="term-s" transform="translate(110, 168)">
              {/* Outer halo */}
              <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
              {/* Inner pin */}
              <circle cx="0" cy="0" r="6" fill="#f59e0b" />
              {/* Letter S */}
              <text x="0" y="3.5" fill="#000000" fontSize="8.5" fontWeight="900" textAnchor="middle">
                S
              </text>
              {/* Label S (Start) */}
              <text x="13" y="16" fill="#fbbf24" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                S (Start)
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* DYNAMIC STATE CALLOUT BADGE (PULSADO vs SIN PULSAR) */}
      <div className="mt-1.5 w-full max-w-[280px] text-center">
        <div
          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-black border transition-all flex items-center justify-center gap-1.5 ${stateInfo.badgeColor}`}
        >
          {isBridging ? (
            <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
          ) : isMotorRunning ? (
            <RotateCw className="w-3 h-3 animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
          )}
          <span>{stateInfo.label}</span>
        </div>
        <span className="text-[9px] text-slate-400 block mt-0.5 font-sans leading-tight">
          {stateInfo.sublabel}
        </span>
      </div>
    </div>
  );
};
