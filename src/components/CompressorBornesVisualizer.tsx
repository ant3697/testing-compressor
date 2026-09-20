import React from 'react';
import { TerminalId, TerminalRole } from '../types';

interface CompressorBornesVisualizerProps {
  orientation?: 'apexDown' | 'apexUp'; // apexDown matches the photo in the capture: C at bottom, P & A at top
  selectedPins?: [TerminalId | null, TerminalId | null]; // [blackProbePin, redProbePin]
  identifiedRoles?: {
    pin1: TerminalRole | null;
    pin2: TerminalRole | null;
    pin3: TerminalRole | null;
  };
  onPinClick?: (pin: TerminalId) => void;
  groundTestedPin?: TerminalId | 'casing' | null;
  highlightGround?: boolean;
}

export const CompressorBornesVisualizer: React.FC<CompressorBornesVisualizerProps> = ({
  orientation = 'apexDown',
  selectedPins = [null, null],
  identifiedRoles = { pin1: null, pin2: null, pin3: null },
  onPinClick,
  groundTestedPin = null,
  highlightGround = false,
}) => {
  const coords =
    orientation === 'apexDown'
      ? {
          pin1: { x: 75, y: 80, label: 'Pin 1' },
          pin2: { x: 165, y: 80, label: 'Pin 2' },
          pin3: { x: 120, y: 165, label: 'Pin 3' },
        }
      : {
          pin1: { x: 75, y: 160, label: 'Pin 1' },
          pin2: { x: 165, y: 160, label: 'Pin 2' },
          pin3: { x: 120, y: 75, label: 'Pin 3' },
        };

  const getRoleBadge = (role: TerminalRole | null) => {
    switch (role) {
      case 'C':
        return { label: 'C', fullName: 'Común', bg: 'var(--status-info-base)', text: '#ffffff' };
      case 'R':
        return { label: 'R', fullName: 'Run (Marcha)', bg: 'var(--status-success-base)', text: '#ffffff' };
      case 'S':
        return { label: 'S', fullName: 'Star (Arranque)', bg: 'var(--status-warning-base)', text: '#ffffff' };
      default:
        return null;
    }
  };

  const isPinSelectedBlack = (pin: TerminalId) => selectedPins[0] === pin;
  const isPinSelectedRed = (pin: TerminalId) => selectedPins[1] === pin;

  return (
    <div className="relative flex flex-col items-center panel-surface p-4 w-full select-none">
      <div className="flex items-center justify-between w-full mb-2">
        <span
          className="text-small font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span
            className="w-2 h-2 rounded-circle animate-pulse"
            style={{ backgroundColor: 'var(--status-info-base)' }}
          ></span>
          Bornera del Compresor
        </span>
        <span
          className="text-tiny px-2 py-0.5 rounded-sm border font-mono"
          style={{
            backgroundColor: 'var(--bg-alt)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          {orientation === 'apexDown' ? 'Vértice Inferior (Foto C abajo)' : 'Vértice Superior (C arriba)'}
        </span>
      </div>

      <div className="relative w-[240px] h-[240px] flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-md">
          {/* Compressor Outer Metallic Shell */}
          <circle
            cx="120"
            cy="120"
            r="115"
            fill="#0f172a"
            stroke={highlightGround ? 'var(--status-success-base)' : '#334155'}
            strokeWidth="6"
            className="transition-colors duration-300"
          />
          {/* Inner Terminal Housing (The circular cup seen in photo) */}
          <circle cx="120" cy="120" r="92" fill="#020617" stroke="#1e293b" strokeWidth="4" />
          <circle cx="120" cy="120" r="88" fill="#0b0f19" />

          {/* Internal triangle guide lines */}
          <line
            x1={coords.pin1.x}
            y1={coords.pin1.y}
            x2={coords.pin2.x}
            y2={coords.pin2.y}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <line
            x1={coords.pin2.x}
            y1={coords.pin2.y}
            x2={coords.pin3.x}
            y2={coords.pin3.y}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <line
            x1={coords.pin3.x}
            y1={coords.pin3.y}
            x2={coords.pin1.x}
            y2={coords.pin1.y}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Ground terminal lug on the shell casing */}
          <g
            className="cursor-pointer group"
            onClick={() => onPinClick && onPinClick('pin1')}
          >
            <rect
              x="200"
              y="110"
              width="24"
              height="20"
              rx="4"
              fill={highlightGround ? '#15803d' : '#1e293b'}
              stroke={highlightGround ? '#4ade80' : '#475569'}
              strokeWidth="2"
            />
            {/* Ground symbol */}
            <line x1="206" y1="116" x2="218" y2="116" stroke="#94a3b8" strokeWidth="2" />
            <line x1="209" y1="120" x2="215" y2="120" stroke="#94a3b8" strokeWidth="2" />
            <line x1="211" y1="124" x2="213" y2="124" stroke="#94a3b8" strokeWidth="2" />
          </g>

          {/* Render 3 Pins */}
          {(['pin1', 'pin2', 'pin3'] as TerminalId[]).map((pinKey) => {
            const pos = coords[pinKey];
            const role = identifiedRoles[pinKey];
            const badge = getRoleBadge(role);
            const isBlack = isPinSelectedBlack(pinKey);
            const isRed = isPinSelectedRed(pinKey);
            const isGroundTested = groundTestedPin === pinKey;

            return (
              <g
                key={pinKey}
                className="cursor-pointer group transition-transform duration-200"
                onClick={() => onPinClick && onPinClick(pinKey)}
              >
                {/* Outer Selection Ring */}
                {(isBlack || isRed || isGroundTested) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="24"
                    fill="none"
                    stroke={isBlack ? '#f1f5f9' : isRed ? '#ef4444' : '#38bdf8'}
                    strokeWidth="3"
                    className="animate-pulse"
                  />
                )}

                {/* Pin Ceramic base & Brass Terminal Pin */}
                <circle cx={pos.x} cy={pos.y} r="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <circle cx={pos.x} cy={pos.y} r="10" fill="#d97706" stroke="#fbbf24" strokeWidth="2" />
                <circle cx={pos.x} cy={pos.y} r="4" fill="#fef08a" />

                {/* Probe Indicators attached to pin */}
                {isBlack && (
                  <circle cx={pos.x - 14} cy={pos.y - 14} r="7" fill="#020617" stroke="#94a3b8" strokeWidth="2" />
                )}
                {isRed && (
                  <circle cx={pos.x + 14} cy={pos.y - 14} r="7" fill="#dc2626" stroke="#fca5a5" strokeWidth="2" />
                )}

                {/* Pin Default Number Tag */}
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="'Fira Code', monospace"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {pinKey === 'pin1' ? '1' : pinKey === 'pin2' ? '2' : '3'}
                </text>

                {/* Identified Role Badge (C, P, A) */}
                {badge && (
                  <g>
                    <circle
                      cx={pos.x}
                      cy={pos.y - 24}
                      r="12"
                      fill={badge.bg}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 20}
                      textAnchor="middle"
                      fill={badge.text}
                      fontSize="9"
                      fontFamily="'Roboto Condensed', sans-serif"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {badge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        className="w-full mt-3 pt-2.5 border-t grid grid-cols-3 gap-1.5 text-center text-tiny font-secondary"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="p-1.5 rounded-sm border"
          style={{
            backgroundColor: 'var(--status-success-bg)',
            borderColor: 'var(--status-success-base)',
          }}
        >
          <span className="block font-bold" style={{ color: 'var(--status-success-dark)' }}>
            Borne 1 (P)
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Marcha (Run)</span>
        </div>

        <div
          className="p-1.5 rounded-sm border"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            borderColor: 'var(--status-warning-base)',
          }}
        >
          <span className="block font-bold" style={{ color: 'var(--status-warning-dark)' }}>
            Borne 2 (A)
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Arranque (Start)</span>
        </div>

        <div
          className="p-1.5 rounded-sm border"
          style={{
            backgroundColor: 'var(--status-info-bg)',
            borderColor: 'var(--status-info-base)',
          }}
        >
          <span className="block font-bold" style={{ color: 'var(--status-info-dark)' }}>
            Borne 3 (C)
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Común (Common)</span>
        </div>
      </div>
    </div>
  );
};
