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

  // --- PALETA DE COLORES Y ESTADOS DINÁMICOS DE COMPONENTES ---
  // Requerimientos del usuario:
  // - Evidente cuando relés de intensidad, PTC y condensadores están en carga o actuando vs inactivos.
  // - Sin hacer desaparecer líneas: las líneas permanecen continuas y visibles.
  // - Cambio de color de las líneas que definen el componente cuando está activo (con brillo/iluminación y etiquetas claras).
  // - En reposo: líneas en gris slate técnico (#64748b).
  // - En arranque: relé, contacto cerrado, PTC y condensador de arranque pasan a color activo vibrante / en carga.
  // - En marcha nominal: condensador de marcha permanente sigue en servicio activo (azul cian);
  //   el condensador de arranque y contacto/PTC pasan a estado inactivo/desconectado en gris slate.

  const grayIdle = '#64748b'; // Slate-500: visible y nítido pero claramente inactivo / desenergizado
  const greenActive = '#16a34a'; // Verde régimen nominal
  const greenInrush = '#22c55e'; // Verde intenso pico de corriente
  const orangeStart = '#f97316'; // Ámbar / naranja vibrante para circuito de arranque activo
  const goldStartCap = '#f59e0b'; // Amarillo eléctrico / oro para condensador de arranque en carga
  const cyanRunCap = '#0ea5e9'; // Azul cian eléctrico para condensador de marcha permanente en servicio

  // 1. CIRCUITO DE MARCHA (C1 -> Protector -> C -> Bobina de marcha -> R -> Relé/C2):
  const runCircuitColor = isOverload
    ? '#ef4444'
    : isActive
    ? greenActive
    : grayIdle;

  // 2. CIRCUITO DE ARRANQUE GENERAL:
  const startCircuitColor = isOverload
    ? '#ef4444'
    : isStarting
    ? orangeStart
    : grayIdle;

  // 3. RELÉ DE ARRANQUE (Bobina e Interruptor de contacto)
  const isRelayCoilActive = isStarting || isRunning;
  const relayCoilColor = isOverload
    ? '#ef4444'
    : isStarting
    ? greenInrush
    : isRunning
    ? greenActive
    : grayIdle;

  const relayCoilStatus = isOverload
    ? 'CORTE'
    : isStarting
    ? 'EN CARGA (12A)'
    : isRunning
    ? 'NOMINAL (2.5A)'
    : 'INACTIVO';

  const isRelayContactClosed = isStarting;
  const relayContactColor = isOverload
    ? '#ef4444'
    : isRelayContactClosed
    ? orangeStart
    : grayIdle;

  const relayContactStatus = isRelayContactClosed ? 'CERRADO' : 'ABIERTO';

  // 4. TERMISTOR PTC (Pastilla de arranque)
  // En arranque está fría: baja resistencia, conduce fuertemente (EN CARGA).
  // En marcha está caliente: se auto-calienta a >100°C, pasa a >10kΩ, bloqueando la corriente (BLOQUEADA).
  const isPTCConducting = isStarting;
  const ptcColor = isOverload
    ? '#ef4444'
    : isPTCConducting
    ? orangeStart
    : grayIdle;

  const ptcStatus = isOverload
    ? 'CORTE'
    : isStarting
    ? 'EN CARGA'
    : isRunning
    ? 'BLOQUEADA'
    : 'INACTIVA';

  // 5. CONDENSADOR DE ARRANQUE (Electrolítico de alta capacidad, intermitente)
  // En arranque: EN CARGA / ACTUANDO desfasando corriente.
  // En marcha: DESCONECTADO (relé abierto o PTC caliente bloqueada).
  const isStartCapCharged = isStarting;
  const startCapColor = isOverload
    ? '#ef4444'
    : isStartCapCharged
    ? goldStartCap
    : grayIdle;

  const startCapStatus = isOverload
    ? 'CORTE'
    : isStarting
    ? 'EN CARGA'
    : isRunning
    ? 'DESCONECTADO'
    : 'INACTIVO';

  // 6. CONDENSADOR DE MARCHA PERMANENTE (Polipropileno continuo)
  // En reposo: INACTIVO.
  // En arranque y en marcha: EN CARGA PERMANENTE (mejora par, consumo y cos φ).
  const isRunCapCharged = isStarting || isRunning;
  const runCapColor = isOverload
    ? '#ef4444'
    : isRunCapCharged
    ? cyanRunCap
    : grayIdle;

  const runCapStatus = isOverload
    ? 'CORTE'
    : isStarting
    ? 'EN CARGA'
    : isRunning
    ? 'EN CARGA'
    : 'INACTIVO';

  return (
    <div className={`w-full relative select-none ${className}`}>
      <svg
        viewBox="0 0 520 310"
        className="w-full h-auto max-h-[290px] drop-shadow-sm font-sans"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Background Grid Pattern */}
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
            stroke={runCircuitColor}
            strokeWidth="2"
            className="dark:fill-slate-900"
          />
          <text
            x="36"
            y="60"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            fill={runCircuitColor}
            className="font-mono"
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
            stroke={runCircuitColor}
            strokeWidth="2"
            className="dark:fill-slate-900"
          />
          <text
            x="36"
            y="190"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
            fill={runCircuitColor}
            className="font-mono"
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
          stroke={runCircuitColor}
          strokeWidth="2.4"
        />

        {/* Protector de motor (Klixon bimetallic symbol) */}
        <g id="protector-motor">
          <text
            x="185"
            y="28"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            fill={runCircuitColor}
          >
            Protector de motor
          </text>

          {/* Capsule/Oval shape */}
          <ellipse
            cx="185"
            cy="55"
            rx="28"
            ry="15"
            fill={isOverload ? 'rgba(239, 68, 68, 0.1)' : isActive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(148, 163, 184, 0.08)'}
            stroke={runCircuitColor}
            strokeWidth="2"
            className="dark:fill-slate-800"
          />

          {/* Internal heater & bimetal contact representation */}
          {/* Heater zig-zag (Im) */}
          <path
            d="M 163 57 L 168 51 L 173 58 L 178 52 L 180 55"
            fill="none"
            stroke={runCircuitColor}
            strokeWidth="1.6"
          />
          <text
            x="171"
            y="50"
            fontSize="8"
            fontStyle="italic"
            fontWeight="bold"
            fill={runCircuitColor}
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
              strokeWidth="2.2"
            />
          ) : (
            /* Normal closed contact */
            <path
              d="M 180 55 Q 192 48 204 55"
              fill="none"
              stroke={runCircuitColor}
              strokeWidth="2.2"
            />
          )}
        </g>

        {/* Wire from Protector to Terminal C */}
        <line
          x1="213"
          y1="55"
          x2="281"
          y2="55"
          stroke={runCircuitColor}
          strokeWidth="2.4"
        />

        {/* Terminal C (Común) */}
        <g id="node-C">
          <circle
            cx="285"
            cy="55"
            r="4.5"
            fill={runCircuitColor}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
            y="42"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill={runCircuitColor}
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
          stroke={runCircuitColor}
          strokeWidth="2.4"
        />
        {/* Node for start coil connection */}
        <circle cx="380" cy="55" r="3" fill={runCircuitColor} />

        {/* 3. BOBINA DE ARRANQUE (Between C and S) - IN BROWN */}
        <g id="bobina-arranque">
          <text
            x="332"
            y="80"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            fill="#d97706"
          >
            Bobina de
          </text>
          <text
            x="332"
            y="94"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            fill="#22c55e"
          >
            arranque
          </text>

          {/* Wire from top rail down to coil */}
          <line
            x1="380"
            y1="55"
            x2="380"
            y2="72"
            stroke={startCircuitColor}
            strokeWidth="2.4"
          />

          {/* Inductor coil (3 loops matching image) */}
          <path
            d="M 380 72
               C 395 72, 395 84, 380 84
               C 395 84, 395 96, 380 96
               C 395 96, 395 108, 380 108
               C 395 108, 395 118, 380 118"
            fill="none"
            stroke={startCircuitColor}
            strokeWidth="2.6"
          />

          {/* Wire from coil bottom to Terminal S */}
          <line
            x1="380"
            y1="118"
            x2="380"
            y2="135"
            stroke={startCircuitColor}
            strokeWidth="2.4"
          />
          <line
            x1="380"
            y1="135"
            x2="289"
            y2="135"
            stroke={startCircuitColor}
            strokeWidth="2.4"
          />
        </g>

        {/* Terminal S (Start / Arranque) */}
        <g id="node-S">
          <circle
            cx="285"
            cy="135"
            r="4.5"
            fill={startCircuitColor}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
            y="124"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill={startCircuitColor}
            className="font-mono"
          >
            S
          </text>
        </g>

        {/* 4. BOBINA DE MARCHA (Between C and R) - IN GREEN */}
        <g id="bobina-marcha">
          <text
            x="418"
            y="180"
            fontSize="11"
            fontWeight="600"
            textAnchor="end"
            fill="#cbd5e1"
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
            fill="#cbd5e1"
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
            stroke={runCircuitColor}
            strokeWidth="2.4"
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
            stroke={runCircuitColor}
            strokeWidth="2.6"
          />
          <line
            x1="475"
            y1="216"
            x2="475"
            y2="255"
            stroke={runCircuitColor}
            strokeWidth="2.4"
          />
          <line
            x1="475"
            y1="255"
            x2="289"
            y2="255"
            stroke={runCircuitColor}
            strokeWidth="2.4"
          />
        </g>

        {/* Terminal R (Run / Marcha) */}
        <g id="node-R">
          <circle
            cx="285"
            cy="255"
            r="4.5"
            fill={runCircuitColor}
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x="285"
            y="244"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            fill={runCircuitColor}
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
              fill={isRelayCoilActive ? relayCoilColor : '#94a3b8'}
            >
              Relé de
            </text>
            <text
              x="200"
              y="221"
              fontSize="11"
              fontWeight="bold"
              textAnchor="start"
              fill={isRelayCoilActive ? relayCoilColor : '#94a3b8'}
            >
              arranque
            </text>

            {/* Coil state badge */}
            <rect
              x="200"
              y="226"
              width="78"
              height="13"
              rx="3"
              fill={isRelayCoilActive ? (isStarting ? 'rgba(34, 197, 94, 0.22)' : 'rgba(22, 163, 74, 0.15)') : 'rgba(100, 116, 139, 0.15)'}
              stroke={relayCoilColor}
              strokeWidth="0.8"
            />
            <text
              x="239"
              y="235.5"
              fontSize="7.5"
              fontWeight="bold"
              textAnchor="middle"
              fill={relayCoilColor}
              fontFamily="monospace"
            >
              {relayCoilStatus}
            </text>

            {/* Wire from C2 straight to coil top node (x=115, y=190) - VERDE */}
            <line x1="52" y1="190" x2="115" y2="190" stroke={runCircuitColor} strokeWidth="2.4" />
            <circle cx="115" cy="190" r="3.5" fill={runCircuitColor} />

            {/* Wire from C2 node going UP to Contact line (x=115, y=190 -> y=135 -> x=150) */}
            <line x1="115" y1="190" x2="115" y2="135" stroke={startCircuitColor} strokeWidth="2.4" />
            <line x1="115" y1="135" x2="150" y2="135" stroke={startCircuitColor} strokeWidth="2.4" />

            {/* Contact state badge */}
            <rect
              x="137"
              y="98"
              width="58"
              height="13"
              rx="3"
              fill={isRelayContactClosed ? 'rgba(249, 115, 22, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
              stroke={relayContactColor}
              strokeWidth="0.8"
            />
            <text
              x="166"
              y="107.5"
              fontSize="7.5"
              fontWeight="bold"
              textAnchor="middle"
              fill={relayContactColor}
              fontFamily="monospace"
            >
              {relayContactStatus}
            </text>

            {/* Contact switch terminals */}
            <circle cx="150" cy="135" r={isRelayContactClosed ? '4' : '3.5'} fill={relayContactColor} />
            <circle cx="182" cy="135" r={isRelayContactClosed ? '4' : '3.5'} fill={relayContactColor} />

            {/* Plunger / Shorting Contact Bar */}
            {isRelayContactClosed ? (
              /* CLOSED during start */
              <line
                x1="148"
                y1="135"
                x2="184"
                y2="135"
                stroke={relayContactColor}
                strokeWidth="3.6"
              />
            ) : (
              /* OPEN at rest or when running (bridge raised) */
              <g>
                <line x1="146" y1="129" x2="186" y2="129" stroke={relayContactColor} strokeWidth="2.4" />
                <line x1="166" y1="129" x2="166" y2="141" stroke={relayContactColor} strokeWidth="1.8" />
              </g>
            )}

            {/* Dashed line showing plunger coupling to the relay coil underneath */}
            <line
              x1="166"
              y1="143"
              x2="166"
              y2="190"
              stroke={relayContactColor}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity={isRelayContactClosed ? '0.9' : '0.5'}
            />

            {/* Wire from right contact terminal (x=182) towards S or capacitor */}
            {hasStartCapacitor ? (
              <g id="start-cap-relay">
                {/* Status badge for start capacitor */}
                <rect
                  x="207"
                  y="98"
                  width="66"
                  height="13"
                  rx="3"
                  fill={isStartCapCharged ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
                  stroke={startCapColor}
                  strokeWidth="0.8"
                />
                <text
                  x="240"
                  y="107.5"
                  fontSize="7.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={startCapColor}
                  fontFamily="monospace"
                >
                  {startCapStatus}
                </text>

                <text
                  x="240"
                  y="119"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={isStartCapCharged ? startCapColor : '#94a3b8'}
                >
                  Cond. Arranque
                </text>

                <line x1="182" y1="135" x2="236" y2="135" stroke={startCapColor} strokeWidth={isStartCapCharged ? '2.6' : '2.2'} />
                {/* Capacitor symbol || shifted to the right, centered at x=240 between contact (182) and S (285) */}
                <line
                  x1="236"
                  y1="124"
                  x2="236"
                  y2="146"
                  stroke={startCapColor}
                  strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
                />
                <line
                  x1="244"
                  y1="124"
                  x2="244"
                  y2="146"
                  stroke={startCapColor}
                  strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
                />
                <line x1="244" y1="135" x2="281" y2="135" stroke={startCircuitColor} strokeWidth="2.2" />
              </g>
            ) : (
              /* Direct wire to S */
              <line x1="182" y1="135" x2="281" y2="135" stroke={startCircuitColor} strokeWidth="2.2" />
            )}

            {/* Relay Coil directly underneath, connected from C2 node (x=115) to coil top (x=166, y=190) */}
            <line x1="115" y1="190" x2="166" y2="190" stroke={relayCoilColor} strokeWidth="2.4" />

            <path
              d="M 166 190
                 L 182 196 L 150 203 L 182 210 L 150 217 L 182 224 L 150 231 L 166 236"
              fill="none"
              stroke={relayCoilColor}
              strokeWidth={isStarting ? '3.2' : '2.6'}
            />

            {/* Bottom of coil (x=166, y=236) drops down to y=255 and runs horizontally straight into R at x=281 */}
            <line x1="166" y1="236" x2="166" y2="255" stroke={relayCoilColor} strokeWidth="2.4" />
            <line x1="166" y1="255" x2="281" y2="255" stroke={relayCoilColor} strokeWidth="2.4" />
          </g>
        )}

        {/* ===== VARIANT: PTC (RSIR, RSCR, CSIR, CSR) ===== */}
        {isPTC && (() => {
          const ptcBoxX = hasStartCapacitor ? 142 : 158;
          const ptcBoxW = hasStartCapacitor ? 36 : 48;
          const ptcCenterX = ptcBoxX + ptcBoxW / 2;
          return (
            <g id="aux-ptc">
              {/* PTC status badge */}
              <rect
                x={ptcCenterX - 30}
                y="98"
                width="60"
                height="13"
                rx="3"
                fill={isPTCConducting ? 'rgba(249, 115, 22, 0.22)' : 'rgba(100, 116, 139, 0.15)'}
                stroke={ptcColor}
                strokeWidth="0.8"
              />
              <text
                x={ptcCenterX}
                y="107.5"
                fontSize="7.5"
                fontWeight="bold"
                textAnchor="middle"
                fill={ptcColor}
                fontFamily="monospace"
              >
                {ptcStatus}
              </text>

              <text
                x={ptcCenterX}
                y="119"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fill={isPTCConducting ? ptcColor : '#94a3b8'}
              >
                PTC
              </text>

              {/* Branching node from C2 line */}
              <line x1="52" y1="190" x2="115" y2="190" stroke={runCircuitColor} strokeWidth="2.4" />
              <circle cx="115" cy="190" r="3.5" fill={runCircuitColor} />

              {/* Up to PTC branch at y=135 */}
              <line x1="115" y1="190" x2="115" y2="135" stroke={ptcColor} strokeWidth="2.4" />
              <line x1="115" y1="135" x2={ptcBoxX} y2="135" stroke={ptcColor} strokeWidth="2.4" />

              {/* PTC Resistor Box with diagonal arrow & foot (IEC Standard Symbol) */}
              <rect
                x={ptcBoxX}
                y="123"
                width={ptcBoxW}
                height="24"
                fill={isPTCConducting ? 'rgba(249, 115, 22, 0.22)' : isRunning ? 'rgba(100, 116, 139, 0.08)' : 'transparent'}
                stroke={ptcColor}
                strokeWidth={isPTCConducting ? '2.6' : '2'}
                className="dark:fill-slate-800"
              />
              {/* Diagonal PTC line with horizontal tick */}
              <line
                x1={ptcBoxX + 3}
                y1="143"
                x2={ptcBoxX + ptcBoxW - 5}
                y2="127"
                stroke={ptcColor}
                strokeWidth={isPTCConducting ? '2.6' : '2'}
              />
              <line
                x1={ptcBoxX + ptcBoxW - 5}
                y1="127"
                x2={ptcBoxX + ptcBoxW - 1}
                y2="127"
                stroke={ptcColor}
                strokeWidth={isPTCConducting ? '2.6' : '2'}
              />

              {/* Start Capacitor in series with PTC if present */}
              {hasStartCapacitor ? (
                <g id="start-cap-ptc">
                  {/* Status badge for start capacitor */}
                  <rect
                    x="207"
                    y="98"
                    width="66"
                    height="13"
                    rx="3"
                    fill={isStartCapCharged ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
                    stroke={startCapColor}
                    strokeWidth="0.8"
                  />
                  <text
                    x="240"
                    y="107.5"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={startCapColor}
                    fontFamily="monospace"
                  >
                    {startCapStatus}
                  </text>

                  <text
                    x="240"
                    y="119"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={isStartCapCharged ? startCapColor : '#94a3b8'}
                  >
                    Cond. Arranque
                  </text>

                  <line x1={ptcBoxX + ptcBoxW} y1="135" x2="236" y2="135" stroke={startCapColor} strokeWidth={isStartCapCharged ? '2.6' : '2.2'} />
                  {/* Capacitor symbol || shifted to x=240 */}
                  <line
                    x1="236"
                    y1="124"
                    x2="236"
                    y2="146"
                    stroke={startCapColor}
                    strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
                  />
                  <line
                    x1="244"
                    y1="124"
                    x2="244"
                    y2="146"
                    stroke={startCapColor}
                    strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
                  />
                  <line x1="244" y1="135" x2="281" y2="135" stroke={startCircuitColor} strokeWidth="2.2" />
                </g>
              ) : (
                /* Direct wire from PTC to S */
                <line
                  x1={ptcBoxX + ptcBoxW}
                  y1="135"
                  x2="281"
                  y2="135"
                  stroke={startCircuitColor}
                  strokeWidth="2.2"
                />
              )}

              {/* Down directly from node at x=115 to R at y=255 - VERDE */}
              <line x1="115" y1="190" x2="115" y2="255" stroke={runCircuitColor} strokeWidth="2.4" />
              <line x1="115" y1="255" x2="281" y2="255" stroke={runCircuitColor} strokeWidth="2.4" />
            </g>
          );
        })()}

        {/* ===== VARIANT D: CSR (ALTO PAR HST con Relé Voltimétrico + Condensador de Marcha y Arranque) ===== */}
        {variant === 'CSR_POTENCIAL' && (
          <g id="aux-csr">
            <text
              x="110"
              y="152"
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              fill={isRelayCoilActive ? '#cbd5e1' : '#94a3b8'}
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
              fill={isRelayCoilActive ? '#cbd5e1' : '#94a3b8'}
              className="dark:fill-slate-300"
            >
              potencial
            </text>

            {/* Wire from C2 straight to node at x=115, y=190 */}
            <line x1="52" y1="190" x2="115" y2="190" stroke={runCircuitColor} strokeWidth="2.4" />
            <circle cx="115" cy="190" r="3.5" fill={runCircuitColor} />

            {/* Wire from C2 node going up to N.C. contact */}
            <line x1="115" y1="190" x2="115" y2="135" stroke={startCircuitColor} strokeWidth="2.4" />
            <line x1="115" y1="135" x2="130" y2="135" stroke={startCircuitColor} strokeWidth="2.4" />

            {/* Contact status badge */}
            <rect
              x="128"
              y="98"
              width="50"
              height="13"
              rx="3"
              fill={!isRunning && isActive ? 'rgba(249, 115, 22, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
              stroke={!isRunning && isActive ? orangeStart : grayIdle}
              strokeWidth="0.8"
            />
            <text
              x="153"
              y="107.5"
              fontSize="7.5"
              fontWeight="bold"
              textAnchor="middle"
              fill={!isRunning && isActive ? orangeStart : grayIdle}
              fontFamily="monospace"
            >
              {isRunning ? 'ABIERTO' : 'CERRADO'}
            </text>

            {/* Normally Closed Contact (N.C.) that opens when motor reaches speed */}
            <circle cx="130" cy="135" r={!isRunning && isActive ? '4' : '3.5'} fill={!isRunning && isActive ? orangeStart : grayIdle} />
            <circle cx="165" cy="135" r={!isRunning && isActive ? '4' : '3.5'} fill={!isRunning && isActive ? orangeStart : grayIdle} />

            {isRunning ? (
              /* Opened when up to speed by back EMF */
              <g>
                <line x1="128" y1="126" x2="168" y2="126" stroke={grayIdle} strokeWidth="2.4" />
                <line x1="148" y1="126" x2="148" y2="114" stroke={grayIdle} strokeWidth="1.8" />
              </g>
            ) : (
              /* Closed at rest and initial start */
              <line
                x1="128"
                y1="135"
                x2="167"
                y2="135"
                stroke={isStarting ? orangeStart : grayIdle}
                strokeWidth="3.4"
              />
            )}

            {/* Condensador de Arranque - centered at x=240 */}
            <g id="start-cap-csr">
              <rect
                x="207"
                y="98"
                width="66"
                height="13"
                rx="3"
                fill={isStartCapCharged ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
                stroke={startCapColor}
                strokeWidth="0.8"
              />
              <text
                x="240"
                y="107.5"
                fontSize="7.5"
                fontWeight="bold"
                textAnchor="middle"
                fill={startCapColor}
                fontFamily="monospace"
              >
                {startCapStatus}
              </text>

              <text
                x="240"
                y="119"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="middle"
                fill={isStartCapCharged ? startCapColor : '#94a3b8'}
              >
                Cond. Arranque
              </text>

              <line x1="165" y1="135" x2="236" y2="135" stroke={startCapColor} strokeWidth={isStartCapCharged ? '2.6' : '2.2'} />
              <line
                x1="236"
                y1="124"
                x2="236"
                y2="146"
                stroke={startCapColor}
                strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
              />
              <line
                x1="244"
                y1="124"
                x2="244"
                y2="146"
                stroke={startCapColor}
                strokeWidth={isStartCapCharged ? '4.2' : '3.2'}
              />
              <line x1="244" y1="135" x2="281" y2="135" stroke={startCircuitColor} strokeWidth="2.2" />
            </g>

            {/* Direct connection from C2 node down to R */}
            <line x1="115" y1="190" x2="115" y2="255" stroke={runCircuitColor} strokeWidth="2.4" />
            <line x1="115" y1="255" x2="281" y2="255" stroke={runCircuitColor} strokeWidth="2.4" />

            {/* Condensador de Marcha Permanente entre S y R - shifted to x=264 */}
            <g id="run-cap-csr">
              <line x1="264" y1="135" x2="264" y2="182" stroke={runCapColor} strokeWidth={isRunCapCharged ? '2.6' : '2.2'} />
              <line x1="264" y1="202" x2="264" y2="255" stroke={runCapColor} strokeWidth={isRunCapCharged ? '2.6' : '2.2'} />
              <circle cx="264" cy="135" r={isRunCapCharged ? '3.8' : '3'} fill={runCapColor} />
              <circle cx="264" cy="255" r={isRunCapCharged ? '3.8' : '3'} fill={runCapColor} />
              <line
                x1="252"
                y1="182"
                x2="276"
                y2="182"
                stroke={runCapColor}
                strokeWidth={isRunCapCharged ? '4.2' : '3.2'}
              />
              <line
                x1="252"
                y1="202"
                x2="276"
                y2="202"
                stroke={runCapColor}
                strokeWidth={isRunCapCharged ? '4.2' : '3.2'}
              />

              <text
                x="249"
                y="178"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
                fill={isRunCapCharged ? runCapColor : '#94a3b8'}
              >
                Condensador
              </text>
              <text
                x="249"
                y="191"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
                fill={isRunCapCharged ? runCapColor : '#94a3b8'}
              >
                de marcha
              </text>
              <rect
                x="195"
                y="196"
                width="52"
                height="13"
                rx="3"
                fill={isRunCapCharged ? 'rgba(14, 165, 233, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
                stroke={runCapColor}
                strokeWidth="0.8"
              />
              <text
                x="221"
                y="205.5"
                fontSize="7.5"
                fontWeight="bold"
                textAnchor="middle"
                fill={runCapColor}
                fontFamily="monospace"
              >
                {runCapStatus}
              </text>
            </g>
          </g>
        )}

        {/* ===== CONDENSADOR DE MARCHA (En esquemas con condensador permanente: RSCR y CSIR) - AZUL ===== */}
        {(hasRunCapacitor && variant !== 'CSR_POTENCIAL') && (() => {
          const runCapX = hasStartCapacitor ? 264 : 240;
          return (
            <g id="condensador-marcha">
              {/* Connected between S wire and R wire */}
              <line x1={runCapX} y1="135" x2={runCapX} y2="182" stroke={runCapColor} strokeWidth={isRunCapCharged ? '2.6' : '2.2'} />
              <line x1={runCapX} y1="202" x2={runCapX} y2="255" stroke={runCapColor} strokeWidth={isRunCapCharged ? '2.6' : '2.2'} />

              {/* Nodes on S and R lines */}
              <circle cx={runCapX} cy="135" r={isRunCapCharged ? '3.8' : '3'} fill={runCapColor} />
              <circle cx={runCapX} cy="255" r={isRunCapCharged ? '3.8' : '3'} fill={runCapColor} />

              {/* Capacitor parallel plates || */}
              <line
                x1={runCapX - 12}
                y1="182"
                x2={runCapX + 12}
                y2="182"
                stroke={runCapColor}
                strokeWidth={isRunCapCharged ? '4.2' : '3.2'}
              />
              <line
                x1={runCapX - 12}
                y1="202"
                x2={runCapX + 12}
                y2="202"
                stroke={runCapColor}
                strokeWidth={isRunCapCharged ? '4.2' : '3.2'}
              />

              {/* Label Condensador de marcha */}
              <text
                x={runCapX - 15}
                y="178"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
                fill={isRunCapCharged ? runCapColor : '#94a3b8'}
              >
                Condensador
              </text>
              <text
                x={runCapX - 15}
                y="191"
                fontSize="10"
                fontWeight="bold"
                textAnchor="end"
                fill={isRunCapCharged ? runCapColor : '#94a3b8'}
              >
                de marcha
              </text>

              {/* Status badge */}
              <rect
                x={runCapX - 74}
                y="196"
                width="58"
                height="13"
                rx="3"
                fill={isRunCapCharged ? 'rgba(14, 165, 233, 0.2)' : 'rgba(100, 116, 139, 0.15)'}
                stroke={runCapColor}
                strokeWidth="0.8"
              />
              <text
                x={runCapX - 45}
                y="205.5"
                fontSize="7.5"
                fontWeight="bold"
                textAnchor="middle"
                fill={runCapColor}
                fontFamily="monospace"
              >
                {runCapStatus}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};
