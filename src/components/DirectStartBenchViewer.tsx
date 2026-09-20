import React from 'react';
import directStartImg from '../assets/arranque directo.png';
import { ZoomPanViewer } from './ZoomPanViewer';
import {
  Zap,
  Power,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { UseDirectStartSimulatorReturn } from '../hooks/useDirectStartSimulator';

interface DirectStartBenchViewerProps {
  simulator: UseDirectStartSimulatorReturn;
  rMarcha?: string;
  rArranque?: string;
}

export const DirectStartBenchViewer: React.FC<DirectStartBenchViewerProps> = ({
  simulator,
}) => {
  const {
    powerOn,
    isBridging,
    isMotorRunning,
    klixonTripped,
    bridgeDurationMs,
    isAlarmActive,
    motorRpm,
    currentAmps,
    handleTogglePower,
    handleStartBridge,
    handleEndBridge,
    handleClickBridge,
    handleResetKlixon,
  } = simulator;

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1420] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col justify-between select-none overflow-hidden">
      {/* 1. Header Bar: BANCO DE TALLER + Subtitle */}
      <div className="h-8 flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
            BANCO DE TALLER
          </span>
          <span className="text-tiny font-secondary text-slate-600 dark:text-slate-300 font-semibold truncate">
            Simulador de Arranque Directo de Compresor
          </span>
        </div>
      </div>

      {/* 2. Main Center Display: ZoomPanViewer hosting the Workbench */}
      <div className="relative w-full flex-1 min-h-[350px] flex flex-col items-center justify-center bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
        <ZoomPanViewer
          className="w-full h-full min-h-[350px] rounded-lg bg-[#070a12] relative"
          containerClassName="w-full h-full relative flex items-center justify-center"
          initialZoom={1}
          minZoom={0.8}
          maxZoom={3.5}
          toolbarPosition="top-right"
          title="Banco de trabajo de arranque directo"
        >
            {/* Background Workbench Image from src/assets/arranque directo.png */}
            <img
              src={directStartImg}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/arranque-directo.png';
              }}
              alt="Arranque Directo Compresor (src/assets/arranque directo.png)"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />

            {/* Live Energized Wire Currents Glow SVG Layer */}
            <svg
              viewBox="0 0 1024 678"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="benchWireGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="benchSparkGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* 3D Blue Pushbutton gradients for active depressed state */}
                <linearGradient id="benchBluePlungerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="25%" stopColor="#2563eb" />
                  <stop offset="60%" stopColor="#3b82f6" />
                  <stop offset="85%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <radialGradient id="benchBlueCapGrad" cx="45%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="35%" stopColor="#3b82f6" />
                  <stop offset="85%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </radialGradient>
              </defs>

              {/* BOTÓN AZUL ACTIVO DEL PULSADOR (SE DEPRIME / BAJA FÍSICAMENTE AL PULSAR) */}
              {isBridging && (
                <g id="active-blue-button-depressed" className="pointer-events-none">
                  {/* Máscara oscura que cubre la parte superior del botón que ha bajado (fondo del tablero) */}
                  <rect x="836" y="66" width="44" height="15" fill="#1d242d" rx="1.5" />

                  {/* Vástago del botón comprimido que se hunde hacia el collar metálico */}
                  <rect
                    x="842"
                    y="81"
                    width="31"
                    height="18"
                    rx="2"
                    fill="url(#benchBluePlungerGrad)"
                    stroke="#1e40af"
                    strokeWidth="0.8"
                  />

                  {/* Sombrerete / pulsador azul hundido en contacto directo con la tuerca hexagonal */}
                  <ellipse
                    cx="857.5"
                    cy="81"
                    rx="19"
                    ry="5.5"
                    fill="url(#benchBlueCapGrad)"
                    stroke="#1d4ed8"
                    strokeWidth="0.8"
                  />

                  {/* Brillo especular superior del pulsador azul activo */}
                  <ellipse cx="854" cy="80" rx="11" ry="1.8" fill="#ffffff" opacity="0.45" />
                </g>
              )}

              {/* UNIÓN DE TERMINALES R Y S A TRAVÉS DEL INTERRUPTOR (Trazo del puente limpio y sin círculos semánticos) */}
              {isBridging && powerOn && !klixonTripped && (
                <g id="rs-bridge-energized-path">
                  {/* TRAZADO DE LÍNEA DISCONTINUA A TRAVÉS DEL INTERRUPTOR: R (785,310) -> Interruptor (840-876,180) -> S (915,310) */}
                  <path
                    d="M 785 310 L 785 218 L 840 218 L 840 180 L 876 180 L 876 218 L 915 218 L 915 310"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="4"
                    strokeDasharray="7 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#benchSparkGlow)"
                    className="animate-pulse"
                  />
                  <path
                    d="M 785 310 L 785 218 L 840 218 L 840 180 L 876 180 L 876 218 L 915 218 L 915 310"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* TRAZADO DE LÍNEA DISCONTINUA DIRECTA ENTRE TERMINALES R Y S (Puente directo complementario) */}
                  <path
                    d="M 785 310 Q 850 338 915 310"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="3.5"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                    filter="url(#benchSparkGlow)"
                    className="animate-pulse"
                  />
                  <path
                    d="M 785 310 Q 850 338 915 310"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* INDICADOR DE ACELERACIÓN DURANTE EL IMPULSO (isBridging activo) */}
              {isBridging && powerOn && !klixonTripped && !isMotorRunning && (
                <g id="rotorStartingAcceleration" transform="translate(495, 115)">
                  <circle
                    cx="0"
                    cy="0"
                    r="44"
                    fill="#181204"
                    fillOpacity="0.9"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    filter="drop-shadow(0 0 10px rgba(245,158,11,0.5))"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    className="animate-spin"
                    style={{ animationDuration: '1s' }}
                  />
                  <text
                    x="0"
                    y="0"
                    fill="#fbbf24"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {motorRpm}
                  </text>
                  <text
                    x="0"
                    y="11"
                    fill="#fef08a"
                    fontSize="7"
                    fontWeight="800"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    RPM...
                  </text>
                  <text
                    x="0"
                    y="22"
                    fill="#ffffff"
                    fontSize="6.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    MANTÉN PULSADO
                  </text>
                </g>
              )}

              {/* COMPRESOR EN RÉGIMEN NORMAL DE FUNCIONAMIENTO (VISUALIZACIÓN DE ALTO CONTRASTE Y ROTACIÓN NOMINAL) */}
              {isMotorRunning && powerOn && !klixonTripped && (
                <g id="compressorRunningRegimeVisuals" transform="translate(495, 115)">
                  {/* 1. Ondas acústicas y mecánicas de bombeo y compresión continua */}
                  <circle
                    cx="0"
                    cy="0"
                    r="92"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeDasharray="8 6"
                    opacity="0.35"
                    className="animate-ping"
                    style={{ animationDuration: '2.2s' }}
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="68"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2"
                    opacity="0.4"
                    className="animate-pulse"
                  />

                  {/* 2. Fondo circular del tacómetro con alto contraste y bisel protector */}
                  <circle
                    cx="0"
                    cy="0"
                    r="46"
                    fill="#03150e"
                    fillOpacity="0.94"
                    stroke="#059669"
                    strokeWidth="2.2"
                    filter="drop-shadow(0 0 14px rgba(16,185,129,0.55))"
                  />

                  {/* 3. Corona exterior dentada giratoria de flujo magnético (~2.850 RPM) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="43"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.2"
                    strokeDasharray="6 3.5"
                    className="animate-spin"
                    style={{ animationDuration: '0.8s' }}
                  />

                  {/* 4. Anillo interior secundario contra-rotante de sincronismo */}
                  <circle
                    cx="0"
                    cy="0"
                    r="36"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1.2"
                    strokeDasharray="14 7"
                    className="animate-spin"
                    style={{ animationDirection: 'reverse', animationDuration: '2.8s' }}
                  />

                  {/* 5. Rotor interior con 3 aspas de turbina en rotación continua */}
                  <g className="animate-spin" style={{ animationDuration: '0.55s' }}>
                    <path
                      d="M 0 0 L -6 -24 A 26 26 0 0 1 6 -24 Z"
                      fill="#10b981"
                      fillOpacity="0.35"
                    />
                    <path
                      d="M 0 0 L 25 -3 A 26 26 0 0 1 19 15 Z"
                      fill="#10b981"
                      fillOpacity="0.35"
                    />
                    <path
                      d="M 0 0 L -18 16 A 26 26 0 0 1 -24 -2 Z"
                      fill="#10b981"
                      fillOpacity="0.35"
                    />
                  </g>

                  {/* 6. Núcleo central digital protegido */}
                  <circle
                    cx="0"
                    cy="0"
                    r="25"
                    fill="#022c22"
                    fillOpacity="0.94"
                    stroke="#34d399"
                    strokeWidth="1.6"
                  />

                  {/* 7. Texto numérico de alta visibilidad: 2.850 RPM */}
                  <text
                    x="0"
                    y="2"
                    fill="#ffffff"
                    fontSize="12.5"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="monospace"
                    letterSpacing="0.2"
                    filter="drop-shadow(0 0 4px #10b981)"
                  >
                    2.850
                  </text>
                  <text
                    x="0"
                    y="14"
                    fill="#6ee7b7"
                    fontSize="7.5"
                    fontWeight="900"
                    textAnchor="middle"
                    fontFamily="monospace"
                    letterSpacing="0.8"
                  >
                    RPM
                  </text>

                  {/* 8. Placa / Cartela indicadora de régimen normal reubicada bajo el símbolo del compresor */}
                  <g id="regimenNormalPlaqueUnderCompressor" transform="translate(0, 56)">
                    <rect
                      x="-125"
                      y="-11"
                      width="250"
                      height="22"
                      rx="6"
                      fill="#022c22"
                      fillOpacity="0.96"
                      stroke="#10b981"
                      strokeWidth="1.8"
                      filter="drop-shadow(0 0 10px rgba(16,185,129,0.7))"
                    />
                    <circle cx="-108" cy="0" r="4.5" fill="#34d399" className="animate-ping" />
                    <circle cx="-108" cy="0" r="3" fill="#10b981" />
                    <text
                      x="7"
                      y="4"
                      fill="#ecfdf5"
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                      fontFamily="monospace"
                      letterSpacing="0.4"
                    >
                      COMPRESOR EN RÉGIMEN NORMAL • 2.850 RPM
                    </text>
                  </g>
                </g>
              )}

              {/* PANTALLA LCD DIGITAL DE LA PINZA AMPERIMÉTRICA */}
              {/* Ajustada a la posición y dimensiones exactas del display físico de la pinza (x: 224, y: 494, w: 92, h: 57) */}
              <g
                id="clampMeterLcdDisplay"
                transform="translate(224, 494)"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                {/* Marco y bisel exterior de la pantalla LCD */}
                <rect
                  x="0"
                  y="0"
                  width="92"
                  height="57"
                  rx="3"
                  fill="#0c120a"
                  stroke="#1c2419"
                  strokeWidth="1.2"
                />
                {/* Cristal LCD verde-grisáceo de fondo */}
                <rect
                  x="7"
                  y="8"
                  width="77"
                  height="40"
                  rx="2"
                  fill="#bccab6"
                  stroke="#788a74"
                  strokeWidth="0.8"
                />
                {/* Textura sutil LCD */}
                <rect
                  x="7.5"
                  y="8.5"
                  width="76"
                  height="39"
                  fill="#cad9c4"
                  fillOpacity="0.35"
                />

                {/* Modo AC ~ */}
                <text
                  x="12"
                  y="18"
                  fill="#1c2a19"
                  fontSize="6.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  AC ~
                </text>
                {/* AUTO */}
                <text
                  x="36"
                  y="18"
                  fill="#2c3c28"
                  fontSize="5.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  AUTO
                </text>

                {/* Lectura digital principal (Dígitos LCD de 7 segmentos) */}
                <text
                  x="64"
                  y="40"
                  fill="#0f1c0e"
                  fontSize="22"
                  fontWeight="900"
                  textAnchor="end"
                  fontFamily="monospace"
                  letterSpacing="-1"
                >
                  {powerOn && !klixonTripped ? currentAmps.toFixed(2) : '0.00'}
                </text>

                {/* Unidad A */}
                <text
                  x="68"
                  y="39"
                  fill="#0f1c0e"
                  fontSize="12.5"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  A
                </text>
              </g>
            </svg>

            {isBridging && (
              <div
                className="absolute pointer-events-none select-none z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/95 border-2 border-amber-400 text-amber-100 font-mono text-xs font-black shadow-[0_0_25px_rgba(245,158,11,0.7)] backdrop-blur-md animate-fadeIn"
                style={{ left: '50%', top: '3.5%', transform: 'translateX(-50%)' }}
              >
                <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>MANTÉN PULSADO: {(bridgeDurationMs / 1000).toFixed(1)}s / 2.0s • ACELERANDO ROTOR...</span>
              </div>
            )}

            {/* 2. PHYSICAL SWITCH HIT-TARGET OVER THE IMAGE (LIMPIO, SIN BORDE AZUL) */}
            <div
              id="switch-pulsador-hitbox"
              className={`absolute pointer-events-auto cursor-pointer select-none transition-all ${
                isAlarmActive
                  ? 'bg-rose-500/20 ring-2 ring-rose-500 rounded-lg animate-bounce'
                  : isBridging
                  ? 'bg-amber-400/20 rounded-lg scale-95'
                  : 'bg-transparent'
              }`}
              style={{
                left: '85.8%',
                top: '16.0%',
                transform: 'translate(-50%, -50%)',
                width: '5.5%',
                height: '10.0%',
              }}
              onClick={handleClickBridge}
              onMouseDown={handleStartBridge}
              onMouseUp={handleEndBridge}
              onMouseLeave={handleEndBridge}
              onTouchStart={handleStartBridge}
              onTouchEnd={handleEndBridge}
              title="Pulsador de arranque: Haz clic y mantén pulsado 1.5 a 2.5s para arrancar el motor"
              aria-label="Pulsador puente R-S"
            />

            {/* 3. INTERACTIVE 230V MAINS SWITCH: REUBICADO JUNTO A LA ENTRADA L/N (Siguiendo la flecha izquierda) */}
            <div
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: '18.2%',
                top: '31.0%',
                transform: 'translate(-50%, -50%)',
              }}
              onClick={handleTogglePower}
              title={powerOn ? 'Red 230V Conectada • Clic para desconectar' : 'Red 230V Desconectada • Clic para conectar'}
            >
              <button
                type="button"
                className={`px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-black border transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
                  powerOn
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-300 ring-2 ring-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/90 text-slate-300 border-slate-600 hover:bg-slate-800 ring-1 ring-slate-500/30'
                }`}
              >
                <Power className={`w-3.5 h-3.5 ${powerOn ? 'text-white animate-pulse' : 'text-slate-400'}`} />
                <span>{powerOn ? '230V ON' : '230V OFF'}</span>
              </button>
            </div>

            {/* VENTANA DE ALARMA KLIXON: REUBICADA EN LA ZONA SUPERIOR MARCADA POR EL USUARIO */}
            {klixonTripped && (
              <div
                className="absolute pointer-events-auto cursor-pointer z-30 flex flex-col items-center"
                style={{
                  left: '40.0%',
                  top: '31.0%',
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={handleResetKlixon}
                title="Klixon abierto por sobreintensidad o sobrecalentamiento • Clic para rearmar"
              >
                <div className="flex flex-col items-center bg-rose-950/95 text-white px-2.5 py-1.5 rounded-xl shadow-[0_0_25px_rgba(244,63,94,0.9)] border-2 border-rose-400 backdrop-blur-md animate-bounce">
                  <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[10px] font-black text-rose-200 whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5 text-yellow-300 fill-current animate-pulse" />
                    <span>ALARMA KLIXON</span>
                  </div>
                  <button
                    type="button"
                    className="mt-1 px-2.5 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-mono text-[9px] font-extrabold shadow-md border border-rose-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Power className="w-3 h-3 text-white" />
                    <span>REARMAR KLIXON</span>
                  </button>
                </div>
              </div>
            )}
          </ZoomPanViewer>

        {/* FLOATING CRITICAL ALARM OVERLAY BANNER IF SWITCH IS HELD OVER 2.5-3 SECONDS */}
        {isAlarmActive && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 bg-rose-600/95 border-2 border-white text-white px-3.5 py-1.5 rounded-xl shadow-[0_0_30px_#ef4444] animate-bounce flex items-center gap-2.5 pointer-events-none max-w-[90%]">
            <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
            <div className="font-mono text-left">
              <div className="text-[11px] sm:text-[12px] font-black tracking-wide leading-tight">
                🚨 ¡ALARMA! PULSADOR BLOQUEADO (&gt; 3s)
              </div>
              <div className="text-[9px] sm:text-[10px] text-rose-100 font-semibold leading-tight">
                ¡Peligro inminente de quemar la bobina auxiliar (S)! Suelta el pulsador inmediatamente.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Quick Status Strip */}
      <div className="pt-2 flex items-center justify-between text-tiny font-mono text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isAlarmActive ? 'bg-rose-500 animate-ping' : isBridging ? 'bg-amber-400 animate-ping' : isMotorRunning ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
          <span>
            {isAlarmActive
              ? '⚠️ Alarma activa: el pulsador no debe mantenerse más de 2-3 segundos'
              : isBridging
              ? 'Uniendo bornes R y S a través del interruptor para impulsar el rotor...'
              : isMotorRunning
              ? 'Rotor en giro permanente a ~2.850 RPM. Prueba de arranque superada con éxito.'
              : 'Pulsa «ENERGIZAR (230V)» y mantén presionado 1.5 - 2.5s el botón del panel para arrancar'}
          </span>
        </div>
        <span className="text-[11px] hidden sm:inline text-slate-400">
          Zoom &amp; Paneo activados
        </span>
      </div>
    </div>
  );
};
