import React from 'react';

export type SchematicVariant =
  | 'RSIR_RELE'
  | 'RSIR_PTC'
  | 'RSCR_RELE'
  | 'RSCR_PTC'
  | 'HST_CSR_RELE'
  | 'HST_CSR_PTC'
  | 'HST_CSIR_RELE'
  | 'HST_CSIR_PTC'
  | 'CSIR_RELE'
  | 'CSR_POTENCIAL';

interface IntuitiveSchematicProps {
  variant: SchematicVariant;
  simState?: 'idle' | 'starting' | 'running' | 'overload';
  interactive?: boolean;
  className?: string;
  width?: number | string;
  height?: number | string;
  compact?: boolean;
}

export const IntuitiveSchematicDiagram: React.FC<IntuitiveSchematicProps> = ({
  variant,
  simState = 'idle',
  className = '',
  compact = false,
}) => {
  // Determine states
  const isOverload = simState === 'overload';
  const isStarting = simState === 'starting';
  const isRunning = simState === 'running';
  const isActive = isStarting || isRunning;

  // Architectural helpers
  const isRelay =
    variant === 'RSIR_RELE' ||
    variant === 'RSCR_RELE' ||
    variant === 'CSIR_RELE' ||
    variant === 'HST_CSR_RELE' ||
    variant === 'HST_CSIR_RELE';

  const isPTC =
    variant === 'RSIR_PTC' ||
    variant === 'RSCR_PTC' ||
    variant === 'HST_CSR_PTC' ||
    variant === 'HST_CSIR_PTC';

  const hasStartCapacitor =
    variant === 'HST_CSR_RELE' ||
    variant === 'HST_CSR_PTC' ||
    variant === 'HST_CSIR_RELE' ||
    variant === 'HST_CSIR_PTC' ||
    variant === 'CSIR_RELE' ||
    variant === 'CSR_POTENCIAL';

  const hasRunCapacitor =
    variant === 'RSCR_RELE' ||
    variant === 'RSCR_PTC' ||
    variant === 'HST_CSIR_RELE' ||
    variant === 'HST_CSIR_PTC' ||
    variant === 'CSR_POTENCIAL';

  // Active current flow colors
  const mainWireColor = isOverload ? '#ef4444' : isActive ? '#22c55e' : '#64748b';
  const startWireColor = isOverload
    ? '#ef4444'
    : isStarting
    ? '#f59e0b'
    : isRunning && hasRunCapacitor
    ? '#0ea5e9' // In circuits with run cap, permanent capacitor keeps flowing 90° shifted current to S
    : '#64748b';

  return (
    <div className={`w-full relative select-none ${className}`}>
      <svg
        viewBox="0 0 520 310"
        className="w-full h-auto max-h-[290px] drop-shadow-sm font-sans"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Background Grid Pattern (subtle for professional engineering feel) */}
        <defs>
          <pattern id={`grid-${variant}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/40 dark:text-slate-800/40" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${variant})`} rx="8" />

        {/* 1. SUPPLY TERMINALS C1 AND C2 (Left side) */}
        {/* Terminal C1 */}
        <g id="term-c1">
          <rect
            x="20"
            y="42"
            width="32"
            height="26"
            rx="3"
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="1.8"
            className="dark:fill-slate-900 dark:stroke-slate-200"
          />
          <text
            x="36"
            y="60"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            fill="#0f172a"
            className="dark:fill-white font-mono"
          >
            C1
          </text>
        </g>

        {/* Terminal C2 */}
        <g id="term-c2">
          <rect
            x="20"
            y="172"
            width="32"
            height="26"
            rx="3"
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="1.8"
            className="dark:fill-slate-900 dark:stroke-slate-200"
          />
          <text
            x="36"
            y="190"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            fill="#0f172a"
            className="dark:fill-white font-mono"
          >
            C2
          </text>
        </g>

        {/* 2. TOP RAIL: C1 -> PROTECTOR DE MOTOR -> COMMON TERMINAL (C) */}
        {/* Wire C1 to Protector */}
        <line
          x1="52"
          y1="55"
          x2="135"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* Protector de motor (Klixon bimetallic symbol) */}
        <g id="protector-motor">
          <text
            x="165"
            y="28"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            fill="#334155"
            className="dark:fill-slate-200"
          >
            Protector de motor
          </text>

          {/* Capsule/Oval shape */}
          <ellipse
            cx="165"
            cy="55"
            rx="28"
            ry="15"
            fill="#ffffff"
            stroke={isOverload ? '#ef4444' : '#1e293b'}
            strokeWidth="1.8"
            className="dark:fill-slate-800 dark:stroke-slate-300"
          />

          {/* Internal heater & bimetal contact representation matching drawing */}
          {/* Heater zig-zag (Im) */}
          <path
            d="M 143 57 L 148 51 L 153 58 L 158 52 L 160 55"
            fill="none"
            stroke={isOverload ? '#ef4444' : '#64748b'}
            strokeWidth="1.4"
          />
          <text
            x="151"
            y="50"
            fontSize="8"
            fontStyle="italic"
            fontWeight="bold"
            fill="#64748b"
            className="dark:fill-slate-400"
          >
            Im
          </text>

          {/* Bimetal disc switch curve */}
          {isOverload ? (
            /* Open contact (tripped) */
            <path
              d="M 160 55 Q 172 40 180 44"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            />
          ) : (
            /* Normal closed contact */
            <path
              d="M 160 55 Q 172 48 184 55"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            />
          )}
        </g>

        {/* Wire from Protector to Terminal C */}
        <line
          x1="193"
          y1="55"
          x2="238"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* Terminal C (Común) */}
        <g id="node-C">
          <circle
            cx="242"
            cy="55"
            r="4.5"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="242"
            y="42"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill="#0284c7"
            className="font-mono"
          >
            C
          </text>
        </g>

        {/* Wire continuing from C to motor coils */}
        <line
          x1="246"
          y1="55"
          x2="475"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* 3. BOBINA DE ARRANQUE (Between C and S) */}
        <g id="bobina-arranque">
          <text
            x="320"
            y="80"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fill="#334155"
            className="dark:fill-slate-300"
          >
            Bobina de
          </text>
          <text
            x="320"
            y="94"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fill="#334155"
            className="dark:fill-slate-300"
          >
            arranque
          </text>

          {/* Wire from top rail down to coil */}
          <line
            x1="375"
            y1="55"
            x2="375"
            y2="72"
            stroke={startWireColor}
            strokeWidth="2"
          />

          {/* Inductor coil (3 loops matching image) */}
          <path
            d="M 375 72
               C 390 72, 390 84, 375 84
               C 390 84, 390 96, 375 96
               C 390 96, 390 108, 375 108
               C 390 108, 390 118, 375 118"
            fill="none"
            stroke={isStarting ? '#f59e0b' : '#334155'}
            strokeWidth="2.2"
            className="dark:stroke-slate-300"
          />

          {/* Wire from coil bottom to Terminal S */}
          <line
            x1="375"
            y1="118"
            x2="375"
            y2="135"
            stroke={startWireColor}
            strokeWidth="2"
          />
          <line
            x1="375"
            y1="135"
            x2="246"
            y2="135"
            stroke={startWireColor}
            strokeWidth="2"
          />
        </g>

        {/* Terminal S (Start / Arranque) */}
        <g id="node-S">
          <circle
            cx="242"
            cy="135"
            r="4.5"
            fill="#d97706"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="242"
            y="124"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill="#d97706"
            className="font-mono"
          >
            S
          </text>
        </g>

        {/* 4. BOBINA DE MARCHA (Between C and R) */}
        <g id="bobina-marcha">
          <text
            x="418"
            y="180"
            fontSize="11"
            fontWeight="600"
            textAnchor="end"
            fill="#334155"
            className="dark:fill-slate-300"
          >
            Bobina de
          </text>
          <text
            x="418"
            y="194"
            fontSize="11"
            fontWeight="600"
            textAnchor="end"
            fill="#334155"
            className="dark:fill-slate-300"
          >
            marcha
          </text>

          {/* Vertical inductor coil (7 loops on the right side) */}
          <line
            x1="475"
            y1="55"
            x2="475"
            y2="76"
            stroke={mainWireColor}
            strokeWidth="2.2"
          />
          <path
            d="M 475 76
               C 492 76, 492 94, 475 94
               C 492 94, 492 112, 475 112
               C 492 112, 492 130, 475 130
               C 492 130, 492 148, 475 148
               C 492 148, 492 166, 475 166
               C 492 166, 492 184, 475 184
               C 492 184, 492 202, 475 202
               C 492 202, 492 216, 475 216"
            fill="none"
            stroke={isActive ? '#10b981' : '#334155'}
            strokeWidth="2.4"
            className="dark:stroke-slate-300"
          />
          <line
            x1="475"
            y1="216"
            x2="475"
            y2="255"
            stroke={mainWireColor}
            strokeWidth="2.2"
          />
          <line
            x1="475"
            y1="255"
            x2="246"
            y2="255"
            stroke={mainWireColor}
            strokeWidth="2.2"
          />
        </g>

        {/* Terminal R (Run / Marcha) */}
        <g id="node-R">
          <circle
            cx="242"
            cy="255"
            r="4.5"
            fill="#059669"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="242"
            y="244"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill="#059669"
            className="font-mono"
          >
            R
          </text>
        </g>

        {/* 5. AUXILIARY CIRCUITS FROM C2 (Relay, PTC, Start Cap, Run Capacitor) */}

        {/* ===== VARIANT: RELÉ DE ARRANQUE (RSIR, RSCR, CSIR, CSR) ===== */}
        {isRelay && (
          <g id="aux-rele">
            <text
              x="105"
              y="152"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              Relé de
            </text>
            <text
              x="105"
              y="166"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              arranque
            </text>

            {/* Wire from C2 to Relay branch */}
            <line x1="52" y1="185" x2="115" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="115" y1="185" x2="115" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Contact switch normally open */}
            <circle cx="120" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />
            <circle cx="150" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />

            {/* Plunger / Shorting Contact Bar */}
            {isStarting ? (
              /* CLOSED during start */
              <line x1="118" y1="135" x2="152" y2="135" stroke="#22c55e" strokeWidth="3" />
            ) : (
              /* OPEN at rest or when running */
              <g>
                <line x1="116" y1="130" x2="154" y2="130" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="135" y1="130" x2="135" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
              </g>
            )}

            <line x1="115" y1="135" x2="120" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Start capacitor if present in this variant */}
            {hasStartCapacitor ? (
              <g id="start-cap-relay">
                <line x1="150" y1="135" x2="178" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
                {/* Capacitor symbol || */}
                <line x1="178" y1="124" x2="178" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="186" y1="124" x2="186" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="186" y1="135" x2="238" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
                <text
                  x="182"
                  y="116"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#d97706"
                  className="dark:fill-amber-400"
                >
                  Cond. Arranque
                </text>
              </g>
            ) : (
              /* Direct wire to S */
              <line x1="150" y1="135" x2="238" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
            )}

            {/* Lower coil path to R */}
            <path
              d="M 135 185
                 L 150 192 L 120 200 L 150 208 L 120 216 L 150 224 L 120 232 L 135 238"
              fill="none"
              stroke={isActive ? '#10b981' : '#1e293b'}
              strokeWidth="2"
              className="dark:stroke-slate-300"
            />
            {/* Wire from C2 to coil top */}
            <line x1="115" y1="185" x2="135" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            {/* Wire from coil bottom to R */}
            <line x1="135" y1="238" x2="135" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="135" y1="255" x2="238" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
          </g>
        )}

        {/* ===== VARIANT: PTC (RSIR, RSCR, CSIR, CSR) ===== */}
        {isPTC && (
          <g id="aux-ptc">
            <text
              x={hasStartCapacitor ? '142' : '165'}
              y="116"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-200"
            >
              PTC
            </text>

            {/* Branching from C2 */}
            <line x1="52" y1="185" x2="105" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Up to PTC */}
            <line x1="105" y1="185" x2="105" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="105" y1="135" x2={hasStartCapacitor ? '124' : '140'} y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* PTC Resistor Box with diagonal arrow & foot (IEC Standard Symbol) */}
            <rect
              x={hasStartCapacitor ? '124' : '140'}
              y="123"
              width={hasStartCapacitor ? '36' : '48'}
              height="24"
              fill="#ffffff"
              stroke="#1e293b"
              strokeWidth="1.8"
              className="dark:fill-slate-800 dark:stroke-slate-300"
            />
            {/* Diagonal PTC line with horizontal tick */}
            <line
              x1={hasStartCapacitor ? '127' : '144'}
              y1="143"
              x2={hasStartCapacitor ? '157' : '184'}
              y2="127"
              stroke={isStarting ? '#f59e0b' : '#dc2626'}
              strokeWidth="2"
            />
            <line
              x1={hasStartCapacitor ? '157' : '184'}
              y1="127"
              x2={hasStartCapacitor ? '161' : '189'}
              y2="127"
              stroke={isStarting ? '#f59e0b' : '#dc2626'}
              strokeWidth="2"
            />

            {/* Start Capacitor in series with PTC if present */}
            {hasStartCapacitor ? (
              <g id="start-cap-ptc">
                <line x1="160" y1="135" x2="182" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
                {/* Capacitor symbol || */}
                <line x1="182" y1="124" x2="182" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="190" y1="124" x2="190" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="190" y1="135" x2="238" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
                <text
                  x="186"
                  y="116"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#d97706"
                  className="dark:fill-amber-400"
                >
                  Cond. Arranque
                </text>
              </g>
            ) : (
              /* Direct wire from PTC to S */
              <line
                x1="188"
                y1="135"
                x2="238"
                y2="135"
                stroke={isStarting ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}

            {/* Down directly to R (no relay coil, simple direct connection!) */}
            <line x1="105" y1="185" x2="105" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="105" y1="255" x2="238" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
          </g>
        )}

        {/* ===== VARIANT C: CSIR (ALTO PAR HST con Relé Amperimétrico + Condensador de Arranque) ===== */}
        {variant === 'CSIR_RELE' && (
          <g id="aux-csir">
            <text
              x="100"
              y="152"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              Relé de
            </text>
            <text
              x="100"
              y="166"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              arranque
            </text>

            {/* Wire from C2 to Relay branch */}
            <line x1="52" y1="185" x2="115" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="115" y1="185" x2="115" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Contact switch normally open */}
            <circle cx="120" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />
            <circle cx="155" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />

            {isStarting ? (
              <line x1="118" y1="135" x2="157" y2="135" stroke="#22c55e" strokeWidth="3" />
            ) : (
              <g>
                <line x1="116" y1="130" x2="158" y2="130" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="137" y1="130" x2="137" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
              </g>
            )}

            {/* Condensador de Arranque en serie con el contacto */}
            <line x1="155" y1="135" x2="185" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            {/* Capacitor symbol || */}
            <line x1="185" y1="124" x2="185" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="193" y1="124" x2="193" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="193" y1="135" x2="238" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />

            <text
              x="189"
              y="118"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fill="#d97706"
              className="dark:fill-amber-400"
            >
              Cond. Arranque
            </text>

            {/* Lower coil path to R */}
            <path
              d="M 135 185
                 L 150 192 L 120 200 L 150 208 L 120 216 L 150 224 L 120 232 L 135 238"
              fill="none"
              stroke={isActive ? '#10b981' : '#1e293b'}
              strokeWidth="2"
              className="dark:stroke-slate-300"
            />
            <line x1="115" y1="185" x2="135" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="135" y1="238" x2="135" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="135" y1="255" x2="238" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
          </g>
        )}

        {/* ===== VARIANT D: CSR (ALTO PAR HST con Relé Voltimétrico + Condensador de Marcha y Arranque) ===== */}
        {variant === 'CSR_POTENCIAL' && (
          <g id="aux-csr">
            <text
              x="90"
              y="152"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              Relé
            </text>
            <text
              x="90"
              y="166"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              potencial
            </text>

            {/* Wire from C2 to contact and to R */}
            <line x1="52" y1="185" x2="105" y2="185" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="105" y1="185" x2="105" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Normally Closed Contact (N.C.) that opens when motor reaches speed */}
            <circle cx="110" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />
            <circle cx="145" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />

            {isRunning ? (
              /* Opened when up to speed by back EMF */
              <g>
                <line x1="108" y1="126" x2="148" y2="126" stroke="#ef4444" strokeWidth="2.5" />
                <line x1="128" y1="126" x2="128" y2="114" stroke="#ef4444" strokeWidth="1.8" />
              </g>
            ) : (
              /* Closed at rest and initial start */
              <line x1="108" y1="135" x2="147" y2="135" stroke="#22c55e" strokeWidth="3" />
            )}

            {/* Condensador de Arranque */}
            <line x1="145" y1="135" x2="170" y2="135" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="170" y1="124" x2="170" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="178" y1="124" x2="178" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="178" y1="135" x2="238" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />

            <text
              x="174"
              y="118"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              fill="#d97706"
              className="dark:fill-amber-400"
            >
              Cond. Arranque
            </text>

            {/* Direct connection from C2 to R */}
            <line x1="105" y1="185" x2="105" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />
            <line x1="105" y1="255" x2="238" y2="255" stroke="#1e293b" strokeWidth="2" className="dark:stroke-slate-300" />

            {/* Condensador de Marcha Permanente entre S y R */}
            <line x1="210" y1="135" x2="210" y2="182" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="210" y1="202" x2="210" y2="255" stroke="#0ea5e9" strokeWidth="2" />
            <circle cx="210" cy="135" r="3" fill="#0ea5e9" />
            <circle cx="210" cy="255" r="3" fill="#0ea5e9" />
            <line x1="198" y1="182" x2="222" y2="182" stroke="#0284c7" strokeWidth="3.2" />
            <line x1="198" y1="202" x2="222" y2="202" stroke="#0284c7" strokeWidth="3.2" />

            <text
              x="195"
              y="193"
              fontSize="9"
              fontWeight="600"
              textAnchor="end"
              fill="#0369a1"
              className="dark:fill-sky-300"
            >
              Cond. Marcha
            </text>
          </g>
        )}

        {/* ===== CONDENSADOR DE MARCHA (En esquemas con condensador permanente: RSCR y CSIR) ===== */}
        {(hasRunCapacitor && variant !== 'CSR_POTENCIAL') && (
          <g id="condensador-marcha">
            {/* Connected between S wire and R wire */}
            {/* Vertical bridging lines from S wire and R wire */}
            <line x1="210" y1="135" x2="210" y2="182" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="210" y1="202" x2="210" y2="255" stroke="#0ea5e9" strokeWidth="2" />

            {/* Nodes on S and R lines */}
            <circle cx="210" cy="135" r="3" fill="#0ea5e9" />
            <circle cx="210" cy="255" r="3" fill="#0ea5e9" />

            {/* Capacitor parallel plates || */}
            <line x1="198" y1="182" x2="222" y2="182" stroke="#0284c7" strokeWidth="3.2" />
            <line x1="198" y1="202" x2="222" y2="202" stroke="#0284c7" strokeWidth="3.2" />

            {/* Label Condensador de marcha */}
            <text
              x="195"
              y="180"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
              fill="#0369a1"
              className="dark:fill-sky-300"
            >
              Condensador
            </text>
            <text
              x="195"
              y="193"
              fontSize="10"
              fontWeight="600"
              textAnchor="end"
              fill="#0369a1"
              className="dark:fill-sky-300"
            >
              de marcha
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
