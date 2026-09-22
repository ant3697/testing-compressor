import React from 'react';
import { WindingFaultType } from './WindingFaultSchematicViewer';

export interface CompressorChassisTerminalsProps {
  /**
   * Orientation of the bornes triangle:
   * - 'apexDown' (default): Common (C) at the bottom, Run (R) top-left, Start (S) top-right (Danfoss/Secop/Embraco standard)
   * - 'apexUp': Common (C) at the top, Run (R) bottom-left, Start (S) bottom-right (Tecumseh/Copeland standard)
   */
  orientation?: 'apexDown' | 'apexUp';
  activeFault?: WindingFaultType;
  rMarcha?: string;
  rArranque?: string;
  rTotal?: string;
  onKlixonClick?: () => void;
  onTerminalClick?: (pin: 'C' | 'R' | 'S') => void;
  onChassisClick?: () => void;
  showFaultEffects?: boolean;
  className?: string;
}

export const CompressorChassisTerminals: React.FC<CompressorChassisTerminalsProps> = ({
  orientation = 'apexDown',
  activeFault = 'healthy',
  rMarcha = '9.7',
  rArranque = '13.1',
  rTotal = '22.8',
  onKlixonClick,
  onTerminalClick,
  onChassisClick,
  showFaultEffects = true,
  className = '',
}) => {
  const isApexDown = orientation === 'apexDown';

  // Coordinates based on orientation matching user SVG attachments:
  // apexDown: R top-left (115, 140), S top-right (225, 140), C bottom (170, 255)
  // apexUp: C top (170, 135), R bottom-left (115, 250), S bottom-right (225, 250)
  const coords = isApexDown
    ? {
        pinC: { x: 170, y: 255 },
        pinR: { x: 115, y: 140 },
        pinS: { x: 225, y: 140 },
        badgeC: { x: 170, y: 310, textX: 170, textY: 334 },
        badgeR: { x: 68, y: 95, textX: 96, textY: 99 },
        badgeS: { x: 272, y: 95, textX: 216, textY: 99 },
      }
    : {
        pinC: { x: 170, y: 135 },
        pinR: { x: 115, y: 250 },
        pinS: { x: 225, y: 250 },
        badgeC: { x: 170, y: 75, textX: 170, textY: 99 },
        badgeR: { x: 68, y: 295, textX: 96, textY: 299 },
        badgeS: { x: 272, y: 295, textX: 216, textY: 299 },
      };

  const isGroundFault = showFaultEffects && (activeFault === 'ground_fault' || activeFault === 'case2');
  const isOpenWinding = showFaultEffects && (activeFault === 'open_winding' || activeFault === 'case3');
  const isShortedTurns = showFaultEffects && (activeFault === 'shorted_turns' || activeFault === 'case4');
  const isOpenKlixon = showFaultEffects && (activeFault === 'open_klixon' || activeFault === 'case1');
  const isHealthy = activeFault === 'healthy';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 380"
        className="w-full h-auto max-h-[360px] drop-shadow-2xl font-sans"
        style={{ filter: isGroundFault ? 'drop-shadow(0 0 15px rgba(239,68,68,0.4))' : undefined }}
      >
        <defs>
          {/* Specular 3D Gold Sphere Radial Gradient for metallic pins */}
          <radialGradient id="chassisPinGoldSphere" cx="30%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          {/* Electric Arc Glow for ground fault */}
          <filter id="chassisArcGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hotspot thermal glow for shorted turns */}
          <radialGradient id="shortedHotspot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff4500" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. CARCASA METÁLICA DEL COMPRESOR (CHASIS) */}
        <rect
          x="12"
          y="12"
          width="316"
          height="356"
          rx="28"
          fill="#0b121e"
          stroke={isGroundFault ? '#ef4444' : '#23354d'}
          strokeWidth={isGroundFault ? 3 : 2}
          strokeDasharray="6 5"
          className={isGroundFault ? 'animate-pulse' : 'transition-colors duration-300'}
          onClick={onChassisClick}
          style={{ cursor: onChassisClick ? 'pointer' : 'default' }}
        />

        {/* 2. HEADER: TÍTULO CARCASA METÁLICA + EMBLEMA DE TIERRA */}
        <g id="chassis-header">
          <text
            x="32"
            y="42"
            fill="#7e92ab"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.05em"
            fontFamily="monospace"
          >
            CARCASA METÁLICA (CHASIS)
          </text>

          {/* Ground Earth Terminal Badge on top right */}
          <g
            transform="translate(255, 38)"
            className="cursor-pointer"
            onClick={onChassisClick}
          >
            <title>Borne de Carcasa Metálica / Conexión a Tierra (PE)</title>
            {/* White/light background badge */}
            <circle cx="0" cy="0" r="14" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
            
            {/* Green Ground/Earth Symbol */}
            <path
              d="M 0 -8 L 0 2 M -7 2 L 7 2 M -4.5 5 L 4.5 5 M -2 8 L 2 8"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Orange Grounding Screw/Pin attached to chassis */}
            <g transform="translate(26, 0)">
              <circle
                cx="0"
                cy="0"
                r="9.5"
                fill="url(#chassisPinGoldSphere)"
                stroke="#b45309"
                strokeWidth="1"
              />
            </g>
          </g>
        </g>

        {/* 3. CENTRAL FUSITE HERMETIC CUP (Vaso cilíndrico de sellado estanco) */}
        <g id="central-fusite-cup">
          {/* Outer thick steel weld rim with deep blue glow */}
          <circle
            cx="170"
            cy="195"
            r="102"
            fill="#090d16"
            stroke="#1e3b5e"
            strokeWidth="7"
          />
          {/* Inner subtle concentric shadow ring */}
          <circle
            cx="170"
            cy="195"
            r="96"
            fill="none"
            stroke="#132338"
            strokeWidth="1.5"
          />
        </g>

        {/* 4. WINDING CONNECTIONS BETWEEN TERMINAL PINS */}
        <g id="windings-group">
          {/* Bobinado de Marcha (C ⟷ R): Línea Verde Continua */}
          <line
            x1={coords.pinC.x}
            y1={coords.pinC.y}
            x2={coords.pinR.x}
            y2={coords.pinR.y}
            stroke={isShortedTurns ? '#f97316' : '#10b981'}
            strokeWidth={isShortedTurns ? 5 : 3.5}
            strokeLinecap="round"
          />

          {/* Bobinado de Arranque (C ⟷ S): Línea Naranja Discontinua */}
          <line
            x1={coords.pinC.x}
            y1={coords.pinC.y}
            x2={coords.pinS.x}
            y2={coords.pinS.y}
            stroke={isOpenWinding ? '#ef4444' : '#f59e0b'}
            strokeWidth="3.5"
            strokeDasharray={isOpenWinding ? '3 6' : '6 4'}
            strokeLinecap="round"
          />

          {/* Suma de Bobinados (R ⟷ S): Línea Azul Discontinua */}
          <line
            x1={coords.pinR.x}
            y1={coords.pinR.y}
            x2={coords.pinS.x}
            y2={coords.pinS.y}
            stroke="#3b82f6"
            strokeWidth="3.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
        </g>

        {/* 5. FAULT ANOMALY GRAPHICAL OVERLAYS */}
        {/* A. Caso 2: Derivación a Carcasa / Fuga a Tierra (Salta Diferencial) */}
        {isGroundFault && (
          <g filter="url(#chassisArcGlow)">
            {/* Arc from faulted winding to metal chassis */}
            <path
              d={
                isApexDown
                  ? `M ${coords.pinR.x} ${coords.pinR.y} L 60 170 L 40 185 L 20 200`
                  : `M ${coords.pinR.x} ${coords.pinR.y} L 70 280 L 40 310 L 25 330`
              }
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              className="animate-pulse"
            />
            {/* Spark to Earth terminal lug */}
            <path
              d={`M ${coords.pinC.x} ${coords.pinC.y} L 210 100 L 250 65 L 280 40`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              className="animate-pulse"
            />
            <circle cx="280" cy="40" r="7" fill="#ef4444" />
            
            {/* Multimeter Probes Simulation (Red on R, Black on Ground) */}
            <g transform="translate(18, 55)">
              <rect x="0" y="0" width="155" height="34" rx="5" fill="#020617" stroke="#ef4444" strokeWidth="1.5" />
              <text x="8" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">MULTÍMETRO (BORNE - CHASIS)</text>
              <text x="8" y="27" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">85.4 Ω (CONTINUIDAD)</text>
            </g>

            {/* Differential breaker tripped alert badge */}
            <g transform="translate(95, 340)">
              <rect x="0" y="0" width="150" height="20" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="1.2" />
              <text x="75" y="14" fill="#fca5a5" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚡ SALTA DIFERENCIAL (30mA)
              </text>
            </g>
          </g>
        )}

        {/* B. Caso 3: Bobinado Abierto / Corte en Arranque (O.L) */}
        {isOpenWinding && (
          <g>
            {/* Break cross in the middle of C-S line */}
            <circle
              cx={(coords.pinC.x + coords.pinS.x) / 2}
              cy={(coords.pinC.y + coords.pinS.y) / 2}
              r="12"
              fill="#ef4444"
              opacity="0.3"
            >
              <animate attributeName="r" values="8; 15; 8" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4; 0.1; 0.4" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={(coords.pinC.x + coords.pinS.x) / 2}
              cy={(coords.pinC.y + coords.pinS.y) / 2}
              r="8"
              fill="#ef4444"
            />
            <line
              x1={(coords.pinC.x + coords.pinS.x) / 2 - 5}
              y1={(coords.pinC.y + coords.pinS.y) / 2 - 5}
              x2={(coords.pinC.x + coords.pinS.x) / 2 + 5}
              y2={(coords.pinC.y + coords.pinS.y) / 2 + 5}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1={(coords.pinC.x + coords.pinS.x) / 2 + 5}
              y1={(coords.pinC.y + coords.pinS.y) / 2 - 5}
              x2={(coords.pinC.x + coords.pinS.x) / 2 - 5}
              y2={(coords.pinC.y + coords.pinS.y) / 2 + 5}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Multimeter Probes Simulation (Black on C, Red on S) */}
            <g transform="translate(18, 55)">
              <rect x="0" y="0" width="145" height="34" rx="5" fill="#020617" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="8" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">MULTÍMETRO (BORNE C - S)</text>
              <text x="8" y="27" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="monospace">1 .   (O.L / ABIERTO)</text>
            </g>

            {/* Alert badge */}
            <g transform="translate(95, 340)">
              <rect x="0" y="0" width="150" height="20" rx="4" fill="#451a03" stroke="#f59e0b" strokeWidth="1.2" />
              <text x="75" y="14" fill="#fed7aa" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚠️ BOBINADO S CORTADO (O.L)
              </text>
            </g>
          </g>
        )}

        {/* C. Caso 4: Espiras en Cortocircuito (Marcha C-R) */}
        {isShortedTurns && (
          <g>
            <ellipse
              cx={(coords.pinC.x + coords.pinR.x) / 2}
              cy={(coords.pinC.y + coords.pinR.y) / 2}
              rx="24"
              ry="18"
              fill="url(#shortedHotspot)"
              className="animate-pulse"
            />
            
            {/* Math Formula comparison on chassis */}
            <g transform="translate(18, 52)">
              <rect x="0" y="0" width="170" height="38" rx="5" fill="#020617" stroke="#f97316" strokeWidth="1.5" />
              <text x="8" y="13" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">FALSO BALANCE DE SUMA</text>
              <text x="8" y="24" fill="#fb923c" fontSize="9" fontWeight="bold" fontFamily="monospace">
                3.2 Ω + 13.1 Ω = 16.3 Ω
              </text>
              <text x="8" y="34" fill="#ef4444" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                16.3 Ω ≠ 22.8 Ω (R-S) ❌
              </text>
            </g>

            {/* Alert badge */}
            <g transform="translate(95, 340)">
              <rect x="0" y="0" width="150" height="20" rx="4" fill="#431407" stroke="#ea580c" strokeWidth="1.2" />
              <text x="75" y="14" fill="#fdba74" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                🔥 ESPIRAS EN CORTO (3.2 Ω)
              </text>
            </g>
          </g>
        )}

        {/* D. Caso 1: Klixon Abierto / Rotor Bloqueado (LRA en Borne C) */}
        {isOpenKlixon && (
          <g>
            {/* Thermal radiation ripples around Pin C and Klixon */}
            <circle
              cx={coords.pinC.x}
              cy={coords.pinC.y}
              r="32"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate attributeName="r" values="26; 36; 26" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5; 0.15; 0.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={coords.pinC.x}
              cy={coords.pinC.y}
              r="28"
              fill="none"
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Inrush Current Flow Indicator on Run Line */}
            <g transform={`translate(${(coords.pinC.x + coords.pinR.x) / 2}, ${(coords.pinC.y + coords.pinR.y) / 2})`}>
              <rect x="-35" y="-9" width="70" height="18" rx="4" fill="#020617" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="3" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                LRA: 28.5 A
              </text>
            </g>

            {/* Klixon Capsule mounted at Borne C */}
            <g
              transform={`translate(${coords.pinC.x + (isApexDown ? 0 : 0)}, ${
                coords.pinC.y + (isApexDown ? -38 : 38)
              })`}
              onClick={onKlixonClick}
              className="cursor-pointer"
            >
              <rect
                x="-52"
                y="-13"
                width="104"
                height="26"
                rx="6"
                fill="#450a0a"
                stroke="#ef4444"
                strokeWidth="1.8"
                className="animate-pulse"
              />
              <text
                x="0"
                y="0"
                fill="#fca5a5"
                fontSize="8.5"
                fontWeight="900"
                textAnchor="middle"
                fontFamily="monospace"
              >
                "CLIC" KLIXON T &gt; 105°C
              </text>
              <text
                x="0"
                y="9"
                fill="#f87171"
                fontSize="7"
                textAnchor="middle"
                fontFamily="monospace"
              >
                (DISPARO EN 3s / LRA)
              </text>
            </g>

            {/* Amperometric clamp reading box */}
            <g transform="translate(18, 55)">
              <rect x="0" y="0" width="150" height="34" rx="5" fill="#020617" stroke="#ef4444" strokeWidth="1.5" />
              <text x="8" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">PINZA AMPERIMÉTRICA</text>
              <text x="8" y="27" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="monospace">28.5 A ➔ 0.0 A ("CLIC")</text>
            </g>

            {/* Alert banner */}
            <g transform="translate(85, 340)">
              <rect x="0" y="0" width="170" height="20" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="1.2" />
              <text x="85" y="14" fill="#fca5a5" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚠️ ROTOR TRABADO / FALLO ARRANQUE
              </text>
            </g>
          </g>
        )}

        {/* 6. TERMINAL PINS (BORNES C, R, S CON AROS Y ESFERA DORADA 3D) */}

        {/* PIN C (Común) - Aro Azul Celeste */}
        <g
          id="pin-C"
          transform={`translate(${coords.pinC.x}, ${coords.pinC.y})`}
          onClick={() => onTerminalClick?.('C')}
          className={onTerminalClick ? 'cursor-pointer' : ''}
        >
          <title>Borne C (Común)</title>
          {/* Outer Cyan Ring */}
          <circle
            cx="0"
            cy="0"
            r="23"
            fill="#090f1d"
            stroke="#0ea5e9"
            strokeWidth="4"
          />
          {/* Socket Dark Base */}
          <circle cx="0" cy="0" r="15" fill="#0d1424" stroke="#1e293b" strokeWidth="2" />
          {/* 3D Metallic Golden Pin */}
          <circle
            cx="0"
            cy="0"
            r="8.5"
            fill="url(#chassisPinGoldSphere)"
            stroke="#b45309"
            strokeWidth="0.8"
          />
        </g>

        {/* PIN R (Run / Marcha) - Aro Rojo */}
        <g
          id="pin-R"
          transform={`translate(${coords.pinR.x}, ${coords.pinR.y})`}
          onClick={() => onTerminalClick?.('R')}
          className={onTerminalClick ? 'cursor-pointer' : ''}
        >
          <title>Borne R (Run / Marcha - {rMarcha} Ω)</title>
          {/* Outer Red Ring */}
          <circle
            cx="0"
            cy="0"
            r="23"
            fill="#090f1d"
            stroke="#ef4444"
            strokeWidth="4"
          />
          {/* Socket Dark Base */}
          <circle cx="0" cy="0" r="15" fill="#0d1424" stroke="#1e293b" strokeWidth="2" />
          {/* 3D Metallic Golden Pin */}
          <circle
            cx="0"
            cy="0"
            r="8.5"
            fill="url(#chassisPinGoldSphere)"
            stroke="#b45309"
            strokeWidth="0.8"
          />
        </g>

        {/* PIN S (Start / Arranque) - Aro Ámbar / Naranja */}
        <g
          id="pin-S"
          transform={`translate(${coords.pinS.x}, ${coords.pinS.y})`}
          onClick={() => onTerminalClick?.('S')}
          className={onTerminalClick ? 'cursor-pointer' : ''}
        >
          <title>Borne S (Start / Arranque - {rArranque} Ω)</title>
          {/* Outer Orange/Amber Ring */}
          <circle
            cx="0"
            cy="0"
            r="23"
            fill="#090f1d"
            stroke="#f59e0b"
            strokeWidth="4"
          />
          {/* Socket Dark Base */}
          <circle cx="0" cy="0" r="15" fill="#0d1424" stroke="#1e293b" strokeWidth="2" />
          {/* 3D Metallic Golden Pin */}
          <circle
            cx="0"
            cy="0"
            r="8.5"
            fill="url(#chassisPinGoldSphere)"
            stroke="#b45309"
            strokeWidth="0.8"
          />
        </g>

        {/* 7. EXTERIOR LABELS & ORANGE CIRCULAR BADGES */}

        {/* BADGE & TEXT C (Común) */}
        <g id="label-C">
          {/* Orange Circle Badge C */}
          <circle
            cx={coords.badgeC.x}
            cy={coords.badgeC.y}
            r="12"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x={coords.badgeC.x}
            y={coords.badgeC.y + 4}
            fill="#000000"
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
          >
            C
          </text>
          {/* Cyan descriptive label */}
          <text
            x={coords.badgeC.textX}
            y={coords.badgeC.textY}
            fill="#38bdf8"
            fontSize="12.5"
            fontWeight="700"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            C (Común)
          </text>
        </g>

        {/* BADGE & TEXT R (Run) */}
        <g id="label-R">
          {/* Orange Circle Badge R */}
          <circle
            cx={coords.badgeR.x}
            cy={coords.badgeR.y}
            r="12"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x={coords.badgeR.x}
            y={coords.badgeR.y + 4}
            fill="#000000"
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
          >
            R
          </text>
          {/* Teal descriptive label */}
          <text
            x={coords.badgeR.textX}
            y={coords.badgeR.textY}
            fill="#2dd4bf"
            fontSize="12.5"
            fontWeight="700"
            textAnchor="start"
            fontFamily="sans-serif"
          >
            R (Run)
          </text>
        </g>

        {/* BADGE & TEXT S (Star) */}
        <g id="label-S">
          {/* Orange Circle Badge S */}
          <circle
            cx={coords.badgeS.x}
            cy={coords.badgeS.y}
            r="12"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x={coords.badgeS.x}
            y={coords.badgeS.y + 4}
            fill="#000000"
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
          >
            S
          </text>
          {/* Orange descriptive label */}
          <text
            x={coords.badgeS.textX}
            y={coords.badgeS.textY}
            fill="#fb923c"
            fontSize="12.5"
            fontWeight="700"
            textAnchor="start"
            fontFamily="sans-serif"
          >
            S (Star)
          </text>
        </g>

        {/* Indicador de Resistencia o Equilibrado cuando está sano */}
        {showFaultEffects && activeFault === 'healthy' && (
          <g transform="translate(170, 195)">
            <rect
              x="-68"
              y="-11"
              width="136"
              height="22"
              rx="5"
              fill="#064e3b"
              stroke="#10b981"
              strokeWidth="1.2"
              opacity="0.9"
            />
            <text
              x="0"
              y="4"
              fill="#6ee7b7"
              fontSize="8.5"
              fontWeight="800"
              textAnchor="middle"
              fontFamily="monospace"
            >
              ✓ BOBINADOS EN EQUILIBRIO
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
