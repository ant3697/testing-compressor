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
  // Wire from C2 supplying run/marcha circuit (to coil/node, through coil to terminal R)
  const runSupplyWireColor = isOverload ? '#ef4444' : isActive ? '#22c55e' : '#64748b';
  // Terminal R circle fill
  const terminalRFill = isActive ? '#22c55e' : '#059669';

  // Light brown / marrón claro for start circuit supply: (#c28e5c / #b87333 / #d49a6a)
  const startCircuitBrown = '#c28e5c';
  const startCircuitActiveBrown = '#d97736'; // Brighter warm brown during active start

  const startWireColor = isOverload
    ? '#ef4444'
    : isStarting
    ? startCircuitActiveBrown
    : isRunning && hasRunCapacitor
    ? '#0ea5e9' // In circuits with run cap, permanent capacitor keeps flowing 90° shifted current to S
    : startCircuitBrown;

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
          x2="155"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* Protector de motor (Klixon bimetallic symbol) */}
        <g id="protector-motor">
          <text
            x="185"
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
            cx="185"
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
            d="M 163 57 L 168 51 L 173 58 L 178 52 L 180 55"
            fill="none"
            stroke={isOverload ? '#ef4444' : '#64748b'}
            strokeWidth="1.4"
          />
          <text
            x="171"
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
              d="M 180 55 Q 192 40 200 44"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            />
          ) : (
            /* Normal closed contact */
            <path
              d="M 180 55 Q 192 48 204 55"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            />
          )}
        </g>

        {/* Wire from Protector to Terminal C */}
        <line
          x1="213"
          y1="55"
          x2="281"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* Terminal C (Común) */}
        <g id="node-C">
          <circle
            cx="285"
            cy="55"
            r="4.5"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
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
          x1="289"
          y1="55"
          x2="475"
          y2="55"
          stroke={mainWireColor}
          strokeWidth="2.2"
        />

        {/* 3. BOBINA DE ARRANQUE (Between C and S) */}
        <g id="bobina-arranque">
          <text
            x="332"
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
            x="332"
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
            x1="380"
            y1="55"
            x2="380"
            y2="72"
            stroke={startWireColor}
            strokeWidth="2"
          />

          {/* Inductor coil (3 loops matching image) */}
          <path
            d="M 380 72
               C 395 72, 395 84, 380 84
               C 395 84, 395 96, 380 96
               C 395 96, 395 108, 380 108
               C 395 108, 395 118, 380 118"
            fill="none"
            stroke={isStarting ? '#f59e0b' : '#334155'}
            strokeWidth="2.2"
            className="dark:stroke-slate-300"
          />

          {/* Wire from coil bottom to Terminal S */}
          <line
            x1="380"
            y1="118"
            x2="380"
            y2="135"
            stroke={startWireColor}
            strokeWidth="2"
          />
          <line
            x1="380"
            y1="135"
            x2="289"
            y2="135"
            stroke={startWireColor}
            strokeWidth="2"
          />
        </g>

        {/* Terminal S (Start / Arranque) */}
        <g id="node-S">
          <circle
            cx="285"
            cy="135"
            r="4.5"
            fill="#d97706"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
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
            stroke={isActive ? '#22c55e' : '#334155'}
            strokeWidth="2.4"
            className={isActive ? '' : 'dark:stroke-slate-300'}
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
            x2="289"
            y2="255"
            stroke={mainWireColor}
            strokeWidth="2.2"
          />
        </g>

        {/* Terminal R (Run / Marcha) */}
        <g id="node-R">
          <circle
            cx="285"
            cy="255"
            r="4.5"
            fill={terminalRFill}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
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
            {/* Label moved to the right side of the relay coil as indicated by the user */}
            <text
              x="200"
              y="207"
              fontSize="11"
              fontWeight="600"
              textAnchor="start"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              Relé de
            </text>
            <text
              x="200"
              y="221"
              fontSize="11"
              fontWeight="600"
              textAnchor="start"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              arranque
            </text>

            {/* Wire from C2 straight to coil top node (x=115, y=190) */}
            <line x1="52" y1="190" x2="115" y2="190" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <circle cx="115" cy="190" r="3" fill={runSupplyWireColor} />

            {/* Wire from C2 node going UP to Contact line (x=115, y=190 -> y=135 -> x=148) */}
            <line x1="115" y1="190" x2="115" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
            <line x1="115" y1="135" x2="150" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />

            {/* Contact switch normally open */}
            <circle cx="150" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />
            <circle cx="182" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />

            {/* Plunger / Shorting Contact Bar */}
            {isStarting ? (
              /* CLOSED during start */
              <line x1="148" y1="135" x2="184" y2="135" stroke="#22c55e" strokeWidth="3" />
            ) : (
              /* OPEN at rest or when running (bridge raised) */
              <g>
                <line x1="146" y1="130" x2="186" y2="130" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="166" y1="130" x2="166" y2="142" stroke="#94a3b8" strokeWidth="1.8" />
              </g>
            )}

            {/* Dashed line showing plunger coupling to the relay coil underneath */}
            <line
              x1="166"
              y1="144"
              x2="166"
              y2="190"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Wire from right contact terminal (x=182) towards S or capacitor */}
            {hasStartCapacitor ? (
              <g id="start-cap-relay">
                <line x1="182" y1="135" x2="204" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
                {/* Capacitor symbol || */}
                <line x1="204" y1="124" x2="204" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="212" y1="124" x2="212" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="212" y1="135" x2="281" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
                <text
                  x="208"
                  y="114"
                  fontSize="9.5"
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
              <line x1="182" y1="135" x2="281" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
            )}

            {/* Relay Coil directly underneath, connected from C2 node (x=115) to coil top (x=166, y=190) */}
            <line x1="115" y1="190" x2="166" y2="190" stroke={runSupplyWireColor} strokeWidth="2.2" />

            <path
              d="M 166 190
                 L 182 196 L 150 203 L 182 210 L 150 217 L 182 224 L 150 231 L 166 236"
              fill="none"
              stroke={isActive ? '#22c55e' : '#1e293b'}
              strokeWidth="2.4"
              className={isActive ? '' : 'dark:stroke-slate-300'}
            />

            {/* Bottom of coil (x=166, y=236) drops down to y=255 and runs horizontally straight into R at x=281 */}
            <line x1="166" y1="236" x2="166" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <line x1="166" y1="255" x2="281" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />
          </g>
        )}

        {/* ===== VARIANT: PTC (RSIR, RSCR, CSIR, CSR) ===== */}
        {isPTC && (
          <g id="aux-ptc">
            <text
              x={hasStartCapacitor ? '160' : '180'}
              y="116"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-200"
            >
              PTC
            </text>

            {/* Branching node from C2 line */}
            <line x1="52" y1="190" x2="115" y2="190" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <circle cx="115" cy="190" r="3" fill={runSupplyWireColor} />

            {/* Up to PTC branch at y=135 */}
            <line x1="115" y1="190" x2="115" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
            <line x1="115" y1="135" x2={hasStartCapacitor ? '142' : '158'} y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />

            {/* PTC Resistor Box with diagonal arrow & foot (IEC Standard Symbol) */}
            <rect
              x={hasStartCapacitor ? '142' : '158'}
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
              x1={hasStartCapacitor ? '145' : '162'}
              y1="143"
              x2={hasStartCapacitor ? '175' : '202'}
              y2="127"
              stroke={isStarting ? '#f59e0b' : '#dc2626'}
              strokeWidth="2"
            />
            <line
              x1={hasStartCapacitor ? '175' : '202'}
              y1="127"
              x2={hasStartCapacitor ? '179' : '207'}
              y2="127"
              stroke={isStarting ? '#f59e0b' : '#dc2626'}
              strokeWidth="2"
            />

            {/* Start Capacitor in series with PTC if present */}
            {hasStartCapacitor ? (
              <g id="start-cap-ptc">
                <line x1="178" y1="135" x2="204" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
                {/* Capacitor symbol || */}
                <line x1="204" y1="124" x2="204" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="212" y1="124" x2="212" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
                <line x1="212" y1="135" x2="281" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />
                <text
                  x="208"
                  y="114"
                  fontSize="9.5"
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
                x1="206"
                y1="135"
                x2="281"
                y2="135"
                stroke={isStarting ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
              />
            )}

            {/* Down directly from node at x=115 to R at y=255 */}
            <line x1="115" y1="190" x2="115" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <line x1="115" y1="255" x2="281" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />
          </g>
        )}

        {/* ===== VARIANT D: CSR (ALTO PAR HST con Relé Voltimétrico + Condensador de Marcha y Arranque) ===== */}
        {variant === 'CSR_POTENCIAL' && (
          <g id="aux-csr">
            <text
              x="110"
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
              x="110"
              y="166"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill="#334155"
              className="dark:fill-slate-300"
            >
              potencial
            </text>

            {/* Wire from C2 straight to node at x=115, y=190 */}
            <line x1="52" y1="190" x2="115" y2="190" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <circle cx="115" cy="190" r="3" fill={runSupplyWireColor} />

            {/* Wire from C2 node going up to N.C. contact */}
            <line x1="115" y1="190" x2="115" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
            <line x1="115" y1="135" x2="130" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />

            {/* Normally Closed Contact (N.C.) that opens when motor reaches speed */}
            <circle cx="130" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />
            <circle cx="165" cy="135" r="3.5" fill="#1e293b" className="dark:fill-slate-200" />

            {isRunning ? (
              /* Opened when up to speed by back EMF */
              <g>
                <line x1="128" y1="126" x2="168" y2="126" stroke="#ef4444" strokeWidth="2.5" />
                <line x1="148" y1="126" x2="148" y2="114" stroke="#ef4444" strokeWidth="1.8" />
              </g>
            ) : (
              /* Closed at rest and initial start */
              <line x1="128" y1="135" x2="167" y2="135" stroke="#22c55e" strokeWidth="3" />
            )}

            {/* Condensador de Arranque */}
            <line x1="165" y1="135" x2="190" y2="135" stroke={isStarting ? '#22c55e' : '#64748b'} strokeWidth="2" />
            <line x1="190" y1="124" x2="190" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="198" y1="124" x2="198" y2="146" stroke="#f59e0b" strokeWidth="3.2" />
            <line x1="198" y1="135" x2="281" y2="135" stroke={isStarting ? '#f59e0b' : '#64748b'} strokeWidth="2" />

            <text
              x="194"
              y="114"
              fontSize="9.5"
              fontWeight="bold"
              textAnchor="middle"
              fill="#d97706"
              className="dark:fill-amber-400"
            >
              Cond. Arranque
            </text>

            {/* Direct connection from C2 node down to R */}
            <line x1="115" y1="190" x2="115" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />
            <line x1="115" y1="255" x2="281" y2="255" stroke={runSupplyWireColor} strokeWidth="2.2" />

            {/* Condensador de Marcha Permanente entre S y R */}
            <line x1="240" y1="135" x2="240" y2="182" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="240" y1="202" x2="240" y2="255" stroke="#0ea5e9" strokeWidth="2" />
            <circle cx="240" cy="135" r="3" fill="#0ea5e9" />
            <circle cx="240" cy="255" r="3" fill="#0ea5e9" />
            <line x1="228" y1="182" x2="252" y2="182" stroke="#0284c7" strokeWidth="3.2" />
            <line x1="228" y1="202" x2="252" y2="202" stroke="#0284c7" strokeWidth="3.2" />

            <text
              x="225"
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
            <line x1="240" y1="135" x2="240" y2="182" stroke="#0ea5e9" strokeWidth="2" />
            <line x1="240" y1="202" x2="240" y2="255" stroke="#0ea5e9" strokeWidth="2" />

            {/* Nodes on S and R lines */}
            <circle cx="240" cy="135" r="3" fill="#0ea5e9" />
            <circle cx="240" cy="255" r="3" fill="#0ea5e9" />

            {/* Capacitor parallel plates || */}
            <line x1="228" y1="182" x2="252" y2="182" stroke="#0284c7" strokeWidth="3.2" />
            <line x1="228" y1="202" x2="252" y2="202" stroke="#0284c7" strokeWidth="3.2" />

            {/* Label Condensador de marcha */}
            <text
              x="225"
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
              x="225"
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
