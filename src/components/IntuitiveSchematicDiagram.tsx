import React, { useState, useEffect, useRef } from 'react';
import { Info, Clock, AlertTriangle, X, CheckCircle2, Flame, ShieldAlert } from 'lucide-react';
import { getCompressorAmps } from './ClampMeter';
import { playFaultAcousticSound } from '../utils/audio';

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
  showClampMeter?: boolean;
}

export const IntuitiveSchematicDiagram: React.FC<IntuitiveSchematicProps> = ({
  variant,
  simState = 'idle',
  className = '',
  compact = false,
  showClampMeter = true,
}) => {
  // Determine states
  const isStarting = simState === 'starting';
  const isRunning = simState === 'running';
  const isActive = isStarting || isRunning;

  // Simulación física precisa de sobrecarga / disparo de Klixon:
  // 1) Fase inicial (rotor bloqueado): corriente LRA (~16.5 A) mientras calienta la resistencia del Klixon (~1.6s)
  // 2) Disparo térmico: salta el bimetal a ABIERTO y la corriente de línea cae inmediatamente a 0.00 A
  const [overloadPhase, setOverloadPhase] = useState<'locked_rotor' | 'tripped'>('tripped');

  useEffect(() => {
    let overloadTimer: NodeJS.Timeout | null = null;
    if (simState === 'overload') {
      setOverloadPhase('locked_rotor');
      overloadTimer = setTimeout(() => {
        setOverloadPhase('tripped');
        playFaultAcousticSound('open_klixon');
      }, 1600);
    } else {
      setOverloadPhase('tripped');
    }
    return () => {
      if (overloadTimer) clearTimeout(overloadTimer);
    };
  }, [simState]);

  const isProtectorOpen = simState === 'overload' && overloadPhase === 'tripped';
  const isProtectorHeating = simState === 'overload' && overloadPhase === 'locked_rotor';
  const isOverload = simState === 'overload';

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

  // 4. TERMISTOR PTC (Pastilla de arranque con incremento progresivo de Tª y enfriamiento dinámico a Tª ambiental)
  // - En reposo inicial: Tª ambiental (25°C), sombreado azul/celeste frío, interruptor interior CERRADO.
  // - En arranque: I_arranque (12-15A) incrementa progresivamente la Tª por efecto Joule (25°C -> 128°C),
  //   reflejando la evolución térmica en tiempo real: Azul frío -> Ámbar -> Naranja -> Rojo Intenso.
  // - Cuando se abre el interruptor (al alcanzar ~115°C o en régimen de marcha):
  //   La corriente se interrumpe y la temperatura comienza a descender progresivamente hasta la ambiental (25°C).
  //   Los colores del PTC reflejan este enfriamiento regresando al azul/celeste frío.
  const [ptcTemp, setPtcTemp] = useState<number>(25);
  const [isDemoCycling, setIsDemoCycling] = useState<boolean>(false);
  const [clampEnabled, setClampEnabled] = useState<boolean>(showClampMeter);
  const isHeatingRef = useRef<boolean>(false);

  // Intensidad calculada en la línea de fase C1 para la pinza amperimétrica
  const rawLiveAmps = simState === 'overload'
    ? (overloadPhase === 'locked_rotor' ? 16.5 : 0.0)
    : getCompressorAmps(simState, variant, 'line');
  const liveAmpsFormatted = rawLiveAmps === 0 ? '0.00' : rawLiveAmps.toFixed(2);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (simState === 'starting') {
      isHeatingRef.current = true;
      // Incremento progresivo de temperatura durante el arranque (25°C -> 128°C)
      timer = setInterval(() => {
        setPtcTemp((prev) => {
          if (prev >= 128) {
            isHeatingRef.current = false;
            return 128;
          }
          return Math.min(128, +(prev + 2.8).toFixed(1));
        });
      }, 40);
    } else if (simState === 'running' || simState === 'idle' || simState === 'overload') {
      // Cuando se abre el circuito o se apaga:
      // Descenso progresivo de la temperatura hasta la ambiental (25°C)
      isHeatingRef.current = false;
      timer = setInterval(() => {
        setPtcTemp((prev) => {
          if (prev <= 25) {
            if (timer) clearInterval(timer);
            return 25;
          }
          return Math.max(25, +(prev - 1.2).toFixed(1));
        });
      }, 40);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [simState]);

  // Soporte interactivo: al hacer clic en la pastilla PTC se puede probar el ciclo térmico progresivo completo
  const triggerPtcThermalCycle = () => {
    if (isDemoCycling) return;
    setIsDemoCycling(true);
    let current = 25;
    setPtcTemp(25);
    isHeatingRef.current = true;

    // Fase 1: Calentamiento progresivo (25°C -> 128°C)
    const heatInterval = setInterval(() => {
      current += 3.2;
      if (current >= 128) {
        current = 128;
        setPtcTemp(128);
        clearInterval(heatInterval);
        isHeatingRef.current = false;

        // Fase 2: Al abrirse el interruptor, la temperatura va bajando progresivamente hasta la ambiental (25°C)
        setTimeout(() => {
          const coolInterval = setInterval(() => {
            current -= 1.4;
            if (current <= 25) {
              current = 25;
              setPtcTemp(25);
              clearInterval(coolInterval);
              setIsDemoCycling(false);
            } else {
              setPtcTemp(+current.toFixed(1));
            }
          }, 40);
        }, 350);
      } else {
        setPtcTemp(+current.toFixed(1));
      }
    }, 40);
  };

  // Interpolación continua y suave de colores según la temperatura térmica real de la PTC (25°C a 128°C)
  const getPtcThermalVisuals = (temp: number) => {
    const u = Math.max(0, Math.min(1, (temp - 25) / 103)); // 0 (25°C) a 1 (128°C)
    let r: number, g: number, b: number;
    if (u <= 0.35) {
      // 25°C a 61°C: Azul Celeste (56, 189, 248) -> Ámbar (245, 158, 11)
      const f = u / 0.35;
      r = Math.round(56 + (245 - 56) * f);
      g = Math.round(189 + (158 - 189) * f);
      b = Math.round(248 + (11 - 248) * f);
    } else if (u <= 0.7) {
      // 61°C a 97°C: Ámbar (245, 158, 11) -> Naranja (234, 88, 12)
      const f = (u - 0.35) / 0.35;
      r = Math.round(245 + (234 - 245) * f);
      g = Math.round(158 + (88 - 158) * f);
      b = Math.round(11 + (12 - 11) * f);
    } else {
      // 97°C a 128°C: Naranja (234, 88, 12) -> Rojo Intenso (239, 68, 68)
      const f = (u - 0.7) / 0.3;
      r = Math.round(234 + (239 - 234) * f);
      g = Math.round(88 + (68 - 88) * f);
      b = Math.round(12 + (68 - 12) * f);
    }

    const strokeColor = `rgb(${r}, ${g}, ${b})`;
    const fillColor = `rgba(${r}, ${g}, ${b}, ${(0.22 + u * 0.68).toFixed(2)})`;
    const isHotRed = u >= 0.85; // >= 112°C

    return {
      u,
      r,
      g,
      b,
      strokeColor,
      fillColor,
      isHotRed,
    };
  };

  const ptcThermal = getPtcThermalVisuals(ptcTemp);

  // Conducción activa mientras se calienta en fase de arranque
  const isPTCConducting = isStarting && ptcTemp < 115;

  // El interruptor interior se abre cuando la pastilla alcanza la temperatura Curie (~115°C),
  // o cuando el motor está en marcha continua / sobrecarga
  const isPTCSwitchOpen =
    ptcTemp >= 115 || simState === 'running' || simState === 'overload' || (isDemoCycling && ptcTemp >= 115);

  const ptcColor = isOverload ? '#ef4444' : ptcThermal.strokeColor;

  const ptcStatus = isOverload
    ? 'CORTE KLIXON'
    : isHeatingRef.current || (simState === 'starting' && ptcTemp < 115)
    ? `CALIENTA ${Math.round(ptcTemp)}°C`
    : ptcTemp >= 115
    ? `CALIENTE ${Math.round(ptcTemp)}°C`
    : ptcTemp > 26
    ? `ENFRIANDO ${Math.round(ptcTemp)}°C`
    : 'FRÍA ~25°C';

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

  // 7. LÓGICA DE MAGNETIZACIÓN DE LAS BOBINAS DEL MOTOR
  // Bobina de arranque (Auxiliary / Start Winding):
  // - En arranque: campo magnético intenso (desfase para par de arranque).
  // - En marcha: si tiene condensador de marcha permanente (RSCR, CSR, PSC) mantiene campo tenue/débil;
  //   si no tiene condensador de marcha (RSIR, CSIR), queda desconectada (campo nulo).
  const isStartWindingActive = !isOverload && (isStarting || (isRunning && hasRunCapacitor));
  const isStartWindingIntense = isStarting;

  // Bobina de marcha (Main / Run Winding):
  // - En arranque: campo magnético intenso (pico LRA de rotor bloqueado).
  // - En marcha: campo magnético activo de régimen nominal (sostiene el par continuo a 2850 RPM).
  const isRunWindingActive = !isOverload && (isStarting || isRunning);
  const isRunWindingIntense = isStarting;

  return (
    <div className={`w-full relative select-none ${className}`}>
      <svg
        viewBox="0 0 528 310"
        className="w-full h-auto max-h-[290px] drop-shadow-sm font-sans"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Background Grid Pattern & Magnetization Glow Filters */}
        <defs>
          <pattern id={`grid-${variant}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/40 dark:text-slate-800/40" />
          </pattern>
          <filter id={`glow-mag-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-mag-amber-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-mag-green-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sombreado semántico térmico PTC: Fría (azul tenue) -> Calentando (ámbar/naranja) -> Caliente (rojo intenso) */}
          <linearGradient id={`ptc-cold-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.22" />
          </linearGradient>

          <linearGradient id={`ptc-warm-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.7" />
          </linearGradient>

          <radialGradient id={`ptc-hot-grad-${variant}`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ff2020" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#ef4444" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#dc2626" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.75" />
          </radialGradient>

          <filter id={`glow-ptc-hot-${variant}`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente para el cuerpo de la pinza amperimétrica en el esquema */}
          <linearGradient id="clampOrangeGradSchematic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="25%" stopColor="#ea580c" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
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
        {/* PARTE TRASERA DE LAS MORDAZAS DE LA PINZA AMPERIMÉTRICA */}
        {clampEnabled && (
          <g id="clamp-meter-jaws-back" transform="translate(68, 36)">
            {/* Mordaza trasera: abraza por detrás el cable C1 (que pasa a local y=19, centrado en la ventana) */}
            <path
              d="M 4 32
                 C 3 22, 4 9, 17 2
                 C 30 9, 31 22, 30 32
                 L 25 32
                 C 25 22, 24 11, 17 6
                 C 10 11, 9 22, 9 32
                 Z"
              fill="#18181b"
              stroke="#27272a"
              strokeWidth="0.8"
            />
          </g>
        )}

        {/* Wire C1 to Protector (at y=55) */}
        <line
          x1="52"
          y1="55"
          x2="155"
          y2="55"
          stroke={runCircuitColor}
          strokeWidth="2.4"
        />

        {/* PINZA AMPERIMÉTRICA DIGITAL INTEGRADA CON DISPLAY DE ALTA VISIBILIDAD */}
        {clampEnabled && (
          <g id="clamp-meter-on-wire" transform="translate(68, 36)">
            {/* Mordaza delantera izquierda: pasa por encima del cable en el extremo izquierdo */}
            <path
              d="M 4 32
                 C 3 22, 4 9, 17 2
                 L 17 6
                 C 10 11, 9 22, 9 32
                 Z"
              fill="#27272a"
              stroke="#09090b"
              strokeWidth="0.8"
            />
            {/* Mordaza delantera derecha: pasa por encima del cable en el extremo derecho */}
            <path
              d="M 30 32
                 C 31 22, 30 9, 17 2
                 L 17 6
                 C 24 11, 25 22, 25 32
                 Z"
              fill="#27272a"
              stroke="#09090b"
              strokeWidth="0.8"
            />
            {/* Línea de junta/cierre entre las puntas superiores de las pinzas (dedos) */}
            <line x1="17" y1="2" x2="17" y2="6" stroke="#09090b" strokeWidth="0.9" />

            {/* Marcadores de alineación geométrica de medición central en mordazas */}
            <text x="13.5" y="14" fill="#a1a1aa" fontSize="2.8" fontWeight="bold">▲</text>
            <text x="18.5" y="14" fill="#a1a1aa" fontSize="2.8" fontWeight="bold">▼</text>

            {/* Gatillo ergonómico lateral izquierdo de apertura */}
            <path d="M 4 26 C 1 24, 0 28, 2 32 L 4 32 Z" fill="#18181b" stroke="#09090b" strokeWidth="0.5" />

            {/* Sombra sutil del cuerpo de la pinza */}
            <rect x="2" y="32" width="30" height="60" rx="5" fill="#000000" opacity="0.22" />

            {/* Chasis ergonómico de la pinza amperimétrica (Naranja industrial de seguridad) */}
            <path
              d="M 4 32
                 C 4 31, 30 31, 30 32
                 L 31 39
                 C 32 45, 32 55, 31 64
                 C 30 70, 31 82, 29 88
                 C 27 92, 23 94, 17 94
                 C 11 94, 7 92, 5 88
                 C 3 82, 4 70, 3 64
                 C 2 55, 2 45, 3 39
                 Z"
              fill="url(#clampOrangeGradSchematic)"
              stroke="#7c2d12"
              strokeWidth="0.8"
            />

            {/* Bandas laterales antideslizantes negras */}
            <path d="M 2.6 52 C 1.8 56, 1.8 64, 2.6 68 Z" fill="#18181b" />
            <path d="M 31.4 52 C 32.2 56, 32.2 64, 31.4 68 Z" fill="#18181b" />

            {/* Símbolo de advertencia eléctrica */}
            <polygon points="17,33.5 15.8,35.5 18.2,35.5" fill="none" stroke="#7c2d12" strokeWidth="0.4" />

            {/* Marca del instrumento y Ruleta selectora */}
            <text x="6" y="39.5" fill="#ffffff" fontSize="3.2" fontWeight="900" fontFamily="sans-serif">
              AMP
            </text>
            <circle cx="23" cy="39.5" r="3.6" fill="#18181b" stroke="#3f3f46" strokeWidth="0.5" />
            <circle cx="23" cy="39.5" r="2.7" fill="#27272a" />
            <line x1="23" y1="39.5" x2="20.5" y2="38.2" stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" />
            <text x="16.5" y="39.5" fill="#ffffff" fontSize="2.4" fontWeight="900" fontFamily="monospace">
              A~
            </text>

            {/* Botones superiores de función rápida */}
            <circle cx="6" cy="42.8" r="1.1" fill="#f97316" stroke="#9a3412" strokeWidth="0.3" />
            <rect x="9" y="42" width="3.6" height="1.6" rx="0.4" fill="#6366f1" />
            <rect x="13.8" y="42" width="4" height="1.6" rx="0.4" fill="#27272a" />

            {/* ======================================================== */}
            {/* DISPLAY LCD DIGITAL EXTRA GRANDE Y DE ALTA VISIBILIDAD */}
            {/* ======================================================== */}
            {/* Bisel protector exterior negro */}
            <rect x="4.2" y="44.5" width="25.6" height="26.5" rx="2.5" fill="#09090b" stroke="#18181b" strokeWidth="0.5" />

            {/* Cristal LCD retroiluminado según el estado del motor */}
            <rect
              x="5.2"
              y="45.5"
              width="23.6"
              height="24.5"
              rx="1.8"
              fill={
                simState === 'overload' && overloadPhase === 'locked_rotor'
                  ? '#fecaca'
                  : simState === 'overload' && overloadPhase === 'tripped'
                  ? '#f1f5f9'
                  : simState === 'starting'
                  ? '#fde047'
                  : simState === 'running'
                  ? '#86efac'
                  : '#cbd5e1'
              }
              stroke={
                simState === 'overload' && overloadPhase === 'locked_rotor'
                  ? '#dc2626'
                  : simState === 'overload' && overloadPhase === 'tripped'
                  ? '#ef4444'
                  : simState === 'starting'
                  ? '#ca8a04'
                  : '#15803d'
              }
              strokeWidth="0.4"
            />

            {/* Reflejo superior del cristal */}
            <rect x="5.8" y="46" width="22.4" height="5.5" rx="1.2" fill="#ffffff" opacity="0.2" />

            {/* Encabezado LCD: Tipo de corriente y Modo */}
            <text x="6.5" y="49" fill="#022c22" fontSize="2.2" fontWeight="900" fontFamily="monospace">
              AC~
            </text>
            <text x="17" y="49" fill="#022c22" fontSize="2.0" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {simState === 'overload'
                ? (overloadPhase === 'locked_rotor' ? 'LRA' : 'TRIP')
                : simState === 'starting'
                ? 'INRUSH'
                : simState === 'running'
                ? 'AUTO'
                : 'OFF'}
            </text>
            <text x="27.5" y="49" fill="#022c22" fontSize="1.8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
              RMS
            </text>

            {/* Segmentos fantasma de fondo (88.88 A) */}
            <text
              x="22.2"
              y="59"
              fill="#022c22"
              opacity="0.08"
              fontSize="7.2"
              fontWeight="900"
              textAnchor="end"
              fontFamily="'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', monospace"
              letterSpacing="-0.2"
            >
              88.88
            </text>
            <text
              x="23.6"
              y="58.5"
              fill="#022c22"
              opacity="0.08"
              fontSize="4.5"
              fontWeight="900"
              fontFamily="monospace"
            >
              A
            </text>

            {/* NÚMEROS DIGITALES EN TIEMPO REAL */}
            <text
              x="22.2"
              y="59"
              fill={simState === 'overload' && overloadPhase === 'locked_rotor' ? '#991b1b' : '#022c22'}
              fontSize="7.2"
              fontWeight="900"
              textAnchor="end"
              fontFamily="'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', monospace"
              letterSpacing="-0.2"
              textLength={liveAmpsFormatted.length > 4 ? "14.2" : "11.2"}
              lengthAdjust="spacingAndGlyphs"
            >
              {liveAmpsFormatted}
            </text>
            <text
              x="23.6"
              y="58.5"
              fill={simState === 'overload' && overloadPhase === 'locked_rotor' ? '#991b1b' : '#022c22'}
              fontSize="4.5"
              fontWeight="900"
              fontFamily="monospace"
            >
              A
            </text>

            {/* Barra analógica dinámica */}
            <rect x="6.5" y="62.5" width="21" height="1.9" rx="0.8" fill="#022c22" opacity="0.18" />
            <rect
              x="6.5"
              y="62.5"
              width={Math.min(21, Math.max(1.0, (rawLiveAmps / 18) * 21))}
              height="1.9"
              rx="0.8"
              fill={
                simState === 'overload' && overloadPhase === 'locked_rotor'
                  ? '#b91c1c'
                  : simState === 'starting'
                  ? '#b45309'
                  : '#047857'
              }
            />
            {/* Escala de la barra analógica */}
            <text x="6.5" y="67" fill="#064e3b" fontSize="1.6" fontWeight="bold" fontFamily="monospace">
              0
            </text>
            <text x="17" y="67" fill="#064e3b" fontSize="1.6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              10
            </text>
            <text x="27.5" y="67" fill="#064e3b" fontSize="1.6" fontWeight="bold" fontFamily="monospace" textAnchor="end">
              20A
            </text>

            {/* Botones inferiores: HOLD, MAX, SEL */}
            <rect x="6.5" y="72.5" width="5.5" height="2.2" rx="0.6" fill="#eab308" stroke="#ca8a04" strokeWidth="0.25" />
            <text x="9.2" y="74.2" fill="#000000" fontSize="1.4" fontWeight="bold" textAnchor="middle">
              HOLD
            </text>
            <rect x="14.2" y="72.5" width="5.5" height="2.2" rx="0.6" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.25" />
            <text x="17" y="74.2" fill="#ffffff" fontSize="1.4" fontWeight="bold" textAnchor="middle">
              MAX
            </text>
            <rect x="22" y="72.5" width="5.5" height="2.2" rx="0.6" fill="#27272a" stroke="#3f3f46" strokeWidth="0.25" />
            <text x="24.7" y="74.2" fill="#ffffff" fontSize="1.4" fontWeight="bold" textAnchor="middle">
              SEL
            </text>

            {/* Categoría de seguridad */}
            <text x="17" y="78.5" fill="#ffedd5" fontSize="1.8" fontWeight="bold" textAnchor="middle">
              CAT III 600V
            </text>

            {/* Bornes de prueba (COM y V/Ω) */}
            <circle cx="11.5" cy="85" r="2.0" fill="#18181b" stroke="#27272a" strokeWidth="0.4" />
            <circle cx="11.5" cy="85" r="1.0" fill="#09090b" />
            <text x="11.5" y="89.5" fill="#a1a1aa" fontSize="1.5" fontWeight="bold" textAnchor="middle">
              COM
            </text>

            <circle cx="22.5" cy="85" r="2.0" fill="#991b1b" stroke="#b91c1c" strokeWidth="0.4" />
            <circle cx="22.5" cy="85" r="1.0" fill="#450a0a" />
            <text x="22.5" y="89.5" fill="#fca5a5" fontSize="1.5" fontWeight="bold" textAnchor="middle">
              V Ω
            </text>

            <title>Pinza Amperimétrica digital True RMS: midiendo {liveAmpsFormatted} A en Línea C1</title>
          </g>
        )}

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

          {/* Badge informativo de estado del Klixon */}
          <rect
            x="137"
            y="74"
            width="96"
            height="14"
            rx="3"
            fill={
              isProtectorOpen
                ? 'rgba(239, 68, 68, 0.2)'
                : isProtectorHeating
                ? 'rgba(245, 158, 11, 0.25)'
                : 'rgba(34, 197, 94, 0.15)'
            }
            stroke={
              isProtectorOpen
                ? '#ef4444'
                : isProtectorHeating
                ? '#f59e0b'
                : '#22c55e'
            }
            strokeWidth="0.8"
          />
          <text
            x="185"
            y="84"
            fontSize="7.5"
            fontWeight="bold"
            textAnchor="middle"
            fill={
              isProtectorOpen
                ? '#ef4444'
                : isProtectorHeating
                ? '#f59e0b'
                : '#22c55e'
            }
            fontFamily="monospace"
          >
            {isProtectorOpen
              ? 'ABIERTO (0.00 A)'
              : isProtectorHeating
              ? 'LRA 16.5A (CALENTANDO)'
              : 'CERRADO (OK)'}
          </text>

          {/* Capsule/Oval shape */}
          <ellipse
            cx="185"
            cy="55"
            rx="28"
            ry="15"
            fill={
              isProtectorOpen
                ? 'rgba(239, 68, 68, 0.12)'
                : isProtectorHeating
                ? 'rgba(245, 158, 11, 0.2)'
                : isActive
                ? 'rgba(34, 197, 94, 0.08)'
                : 'rgba(148, 163, 184, 0.08)'
            }
            stroke={
              isProtectorOpen
                ? '#ef4444'
                : isProtectorHeating
                ? '#f59e0b'
                : runCircuitColor
            }
            strokeWidth="2"
            className="dark:fill-slate-800"
          />

          {/* Internal heater & bimetal contact representation */}
          {/* Heater zig-zag (Im) */}
          <path
            d="M 163 57 L 168 51 L 173 58 L 178 52 L 180 55"
            fill="none"
            stroke={isProtectorHeating ? '#ef4444' : runCircuitColor}
            strokeWidth={isProtectorHeating ? '2.4' : '1.6'}
          />
          <text
            x="171"
            y="50"
            fontSize="8"
            fontStyle="italic"
            fontWeight="bold"
            fill={isProtectorHeating ? '#ef4444' : runCircuitColor}
          >
            Im
          </text>

          {/* Bimetal disc switch curve */}
          {isProtectorOpen ? (
            /* Open contact (tripped): contacto físicamente abierto y separado */
            <path
              d="M 180 55 Q 192 38 200 42"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.4"
            />
          ) : isProtectorHeating ? (
            /* Closed and hot (16.5A surge) */
            <path
              d="M 180 55 Q 192 48 204 55"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.8"
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
          stroke={isProtectorOpen ? 'rgba(100, 116, 139, 0.35)' : runCircuitColor}
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

          {/* LÍNEAS DE MAGNETIZACIÓN EN BOBINA DE ARRANQUE */}
          {/* Intensas en el arranque (generación de par inicial con desfase angular) */}
          {/* Débiles en régimen si existe condensador permanente (RSCR/CSR); desconectadas si RSIR/CSIR */}
          {/* Rigurosamente simétricas respecto al eje central de la bobina (x = 387.5) */}
          {isStartWindingActive && (
            <g
              id="start-winding-magnetization-lines"
              className={isStartWindingIntense ? 'animate-pulse' : ''}
              style={{
                filter: isStartWindingIntense ? `url(#glow-mag-amber-${variant})` : 'none',
              }}
            >
              {/* LADO IZQUIERDO */}
              {/* Loop 1: Interior */}
              <path
                d="M 384 74 C 372.5 76, 372.5 114, 384 116"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.8'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.28}
                strokeDasharray={isStartWindingIntense ? 'none' : '3 2'}
              />
              {/* Loop 2: Medio */}
              <path
                d="M 384 72 C 364.5 75, 364.5 115, 384 118"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '2.1' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.3}
                strokeDasharray={isStartWindingIntense ? 'none' : '3 2'}
              />
              {/* Flecha direccional Loop 2 Izquierdo */}
              <path
                d="M 361.5 97 L 364.5 92 L 367.5 97"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Loop 3: Exterior */}
              <path
                d="M 384 70 C 357.5 74, 357.5 116, 384 120"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '2.4' : '1.0'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.32}
                strokeDasharray={isStartWindingIntense ? 'none' : '4 2'}
              />
              {/* Flecha direccional Loop 3 Izquierdo */}
              <path
                d="M 354.5 97 L 357.5 92 L 360.5 97"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.32}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* LADO DERECHO (Exactamente simétrico respecto a x = 387.5: x -> 387.5 + (387.5 - x)) */}
              {/* Loop 1: Interior (387.5 + 3.5 = 391, 387.5 + 15 = 402.5) */}
              <path
                d="M 391 74 C 402.5 76, 402.5 114, 391 116"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.8'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.28}
                strokeDasharray={isStartWindingIntense ? 'none' : '3 2'}
              />
              {/* Loop 2: Medio (387.5 + 3.5 = 391, 387.5 + 23 = 410.5) */}
              <path
                d="M 391 72 C 410.5 75, 410.5 115, 391 118"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '2.1' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.3}
                strokeDasharray={isStartWindingIntense ? 'none' : '3 2'}
              />
              {/* Flecha direccional Loop 2 Derecho */}
              <path
                d="M 407.5 97 L 410.5 92 L 413.5 97"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Loop 3: Exterior (387.5 + 3.5 = 391, 387.5 + 30 = 417.5) */}
              <path
                d="M 391 70 C 417.5 74, 417.5 116, 391 120"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '2.4' : '1.0'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.32}
                strokeDasharray={isStartWindingIntense ? 'none' : '4 2'}
              />
              {/* Flecha direccional Loop 3 Derecho */}
              <path
                d="M 414.5 97 L 417.5 92 L 420.5 97"
                fill="none"
                stroke={isStartWindingIntense ? '#f59e0b' : '#fbbf24'}
                strokeWidth={isStartWindingIntense ? '1.8' : '0.9'}
                strokeOpacity={isStartWindingIntense ? 0.95 : 0.32}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

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

          {/* LÍNEAS DE MAGNETIZACIÓN EN BOBINA DE MARCHA */}
          {/* Intensas en el arranque (pico de rotor bloqueado LRA 12-15A) */}
          {/* Activas nominales en marcha (sostienen el par continuo del motor a 2850 RPM) */}
          {/* Rigurosamente simétricas respecto al eje central de la bobina (x = 483.5) */}
          {isRunWindingActive && (
            <g
              id="run-winding-magnetization-lines"
              className={isRunWindingIntense ? 'animate-pulse' : ''}
              style={{
                filter: isRunWindingIntense ? `url(#glow-mag-green-${variant})` : 'none',
              }}
            >
              {/* LADO IZQUIERDO */}
              {/* Loop 1: Interior */}
              <path
                d="M 480 80 C 471.5 86, 471.5 206, 480 212"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.0'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.55}
              />
              {/* Loop 2: Medio */}
              <path
                d="M 480 77 C 464.5 84, 464.5 208, 480 215"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '2.1' : '1.2'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.6}
              />
              {/* Flecha direccional Loop 2 Izquierdo */}
              <path
                d="M 461.5 149 L 464.5 143 L 467.5 149"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.1'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Loop 3: Exterior */}
              <path
                d="M 480 74 C 458.5 82, 458.5 210, 480 218"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '2.4' : '1.3'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.65}
              />
              {/* Flecha direccional Loop 3 Izquierdo */}
              <path
                d="M 455.5 149 L 458.5 143 L 461.5 149"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.1'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.65}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* LADO DERECHO (Exactamente simétrico respecto a x = 483.5: x -> 483.5 + (483.5 - x)) */}
              {/* Loop 1: Interior (483.5 + 3.5 = 487, 483.5 + 12 = 495.5) */}
              <path
                d="M 487 80 C 495.5 86, 495.5 206, 487 212"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.0'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.55}
              />
              {/* Loop 2: Medio (483.5 + 3.5 = 487, 483.5 + 19 = 502.5) */}
              <path
                d="M 487 77 C 502.5 84, 502.5 208, 487 215"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '2.1' : '1.2'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.6}
              />
              {/* Flecha direccional Loop 2 Derecho */}
              <path
                d="M 499.5 149 L 502.5 143 L 505.5 149"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.1'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Loop 3: Exterior (483.5 + 3.5 = 487, 483.5 + 25 = 508.5) */}
              <path
                d="M 487 74 C 508.5 82, 508.5 210, 487 218"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '2.4' : '1.3'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.65}
              />
              {/* Flecha direccional Loop 3 Derecho */}
              <path
                d="M 505.5 149 L 508.5 143 L 511.5 149"
                fill="none"
                stroke={isRunWindingIntense ? '#22c55e' : '#16a34a'}
                strokeWidth={isRunWindingIntense ? '1.8' : '1.1'}
                strokeOpacity={isRunWindingIntense ? 0.95 : 0.65}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

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
            {/* Label moved to the right side of the relay coil, clear of magnetization lines */}
            <text
              x="216"
              y="206"
              fontSize="11"
              fontWeight="600"
              textAnchor="start"
              fill={isRelayCoilActive ? relayCoilColor : '#94a3b8'}
            >
              Relé de
            </text>
            <text
              x="216"
              y="220"
              fontSize="11"
              fontWeight="bold"
              textAnchor="start"
              fill={isRelayCoilActive ? relayCoilColor : '#94a3b8'}
            >
              arranque
            </text>

            {/* Coil state badge */}
            <rect
              x="216"
              y="225"
              width="68"
              height="13"
              rx="3"
              fill={isRelayCoilActive ? (isStarting ? 'rgba(34, 197, 94, 0.22)' : 'rgba(22, 163, 74, 0.15)') : 'rgba(100, 116, 139, 0.15)'}
              stroke={relayCoilColor}
              strokeWidth="0.8"
            />
            <text
              x="250"
              y="234.5"
              fontSize="7"
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

            {/* LÍNEAS DE MAGNETIZACIÓN EN EL RELÉ DE ARRANQUE */}
            {/* Intensas en el arranque (pico inrush 12-15A, levanta la armadura móvil) y débiles en la marcha normal (nominal 2.5A) */}
            {/* Rigurosamente simétricas a ambos lados de la bobina (eje central en x = 166) */}
            {isRelayCoilActive && !isOverload && (
              <g
                id="relay-magnetization-lines"
                className={isStarting ? 'animate-pulse' : ''}
                style={{
                  filter: isStarting ? `url(#glow-mag-${variant})` : 'none',
                }}
              >
                {/* LADO IZQUIERDO (Curvas arqueadas hacia la izquierda) */}
                {/* Loop 1: Interior */}
                <path
                  d="M 163 192 C 145 195, 145 231, 163 234"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.8'}
                  strokeOpacity={isStarting ? 0.95 : 0.28}
                  strokeDasharray={isStarting ? 'none' : '3 2'}
                />
                {/* Loop 2: Medio */}
                <path
                  d="M 163 189 C 135 192, 135 234, 163 237"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '2.1' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.3}
                  strokeDasharray={isStarting ? 'none' : '3 2'}
                />
                {/* Flecha direccional Loop 2 Izquierdo */}
                <path
                  d="M 132 215 L 135 210 L 138 215"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Loop 3: Exterior */}
                <path
                  d="M 163 186 C 124 188, 124 238, 163 240"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '2.4' : '1.0'}
                  strokeOpacity={isStarting ? 0.95 : 0.32}
                  strokeDasharray={isStarting ? 'none' : '4 2'}
                />
                {/* Flecha direccional Loop 3 Izquierdo */}
                <path
                  d="M 121 215 L 124 210 L 127 215"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.32}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* LADO DERECHO (Exactamente simétrico a x = 166: x -> 166 + (166 - x)) */}
                {/* Loop 1: Interior (166 + 3 = 169, 166 + 21 = 187) */}
                <path
                  d="M 169 192 C 187 195, 187 231, 169 234"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.8'}
                  strokeOpacity={isStarting ? 0.95 : 0.28}
                  strokeDasharray={isStarting ? 'none' : '3 2'}
                />
                {/* Loop 2: Medio (166 + 3 = 169, 166 + 31 = 197) */}
                <path
                  d="M 169 189 C 197 192, 197 234, 169 237"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '2.1' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.3}
                  strokeDasharray={isStarting ? 'none' : '3 2'}
                />
                {/* Flecha direccional Loop 2 Derecho */}
                <path
                  d="M 194 215 L 197 210 L 200 215"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Loop 3: Exterior (166 + 3 = 169, 166 + 42 = 208) */}
                <path
                  d="M 169 186 C 208 188, 208 238, 169 240"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '2.4' : '1.0'}
                  strokeOpacity={isStarting ? 0.95 : 0.32}
                  strokeDasharray={isStarting ? 'none' : '4 2'}
                />
                {/* Flecha direccional Loop 3 Derecho */}
                <path
                  d="M 205 215 L 208 210 L 211 215"
                  fill="none"
                  stroke={isStarting ? '#e879f9' : '#c084fc'}
                  strokeWidth={isStarting ? '1.8' : '0.9'}
                  strokeOpacity={isStarting ? 0.95 : 0.32}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

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
          const ptcBoxX = hasStartCapacitor ? 138 : 152;
          const ptcBoxW = hasStartCapacitor ? 48 : 58;
          const ptcBoxH = 28;
          const ptcBoxY = 121; // center line is y=135
          const ptcCenterX = ptcBoxX + ptcBoxW / 2;

          return (
            <g
              id="aux-ptc"
              onClick={triggerPtcThermalCycle}
              className="cursor-pointer group"
            >
              <title>Haz clic para probar el ciclo térmico progresivo de la PTC (calentamiento y enfriamiento hasta temperatura ambiental)</title>
              {/* Ondas térmicas semánticas emitidas cuando la pastilla PTC está muy caliente (>95°C) */}
              {ptcTemp >= 95 && (
                <g id="ptc-thermal-waves" className="animate-pulse" opacity="0.85">
                  <path
                    d={`M ${ptcCenterX - 12} 119 Q ${ptcCenterX - 9} 115, ${ptcCenterX - 12} 112 Q ${ptcCenterX - 15} 109, ${ptcCenterX - 12} 106`}
                    fill="none"
                    stroke={ptcThermal.strokeColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${ptcCenterX} 119 Q ${ptcCenterX + 3} 115, ${ptcCenterX} 112 Q ${ptcCenterX - 3} 109, ${ptcCenterX} 106`}
                    fill="none"
                    stroke={ptcThermal.strokeColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${ptcCenterX + 12} 119 Q ${ptcCenterX + 15} 115, ${ptcCenterX + 12} 112 Q ${ptcCenterX + 9} 109, ${ptcCenterX + 12} 106`}
                    fill="none"
                    stroke={ptcThermal.strokeColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* PTC status badge dinámico con temperatura y estado */}
              <rect
                x={ptcCenterX - 42}
                y="95"
                width="84"
                height="13"
                rx="3"
                fill={isOverload ? 'rgba(239, 68, 68, 0.18)' : ptcThermal.fillColor}
                stroke={ptcColor}
                strokeWidth="0.8"
              />
              <text
                x={ptcCenterX}
                y="104.5"
                fontSize="6.8"
                fontWeight="bold"
                textAnchor="middle"
                fill={ptcColor}
                fontFamily="monospace"
              >
                {ptcStatus}
              </text>

              {/* PTC Title */}
              <text
                x={ptcCenterX}
                y="117"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fill={ptcColor}
              >
                PTC
              </text>

              {/* Branching node from C2 line */}
              <line x1="52" y1="190" x2="115" y2="190" stroke={runCircuitColor} strokeWidth="2.4" />
              <circle cx="115" cy="190" r="3.5" fill={runCircuitColor} />

              {/* Up to PTC branch at y=135 */}
              <line
                x1="115"
                y1="190"
                x2="115"
                y2="135"
                stroke={isPTCConducting ? orangeStart : isPTCSwitchOpen ? 'rgba(100, 116, 139, 0.4)' : ptcColor}
                strokeWidth="2.4"
              />
              <line
                x1="115"
                y1="135"
                x2={ptcBoxX}
                y2="135"
                stroke={isPTCConducting ? orangeStart : isPTCSwitchOpen ? 'rgba(100, 116, 139, 0.4)' : ptcColor}
                strokeWidth="2.4"
              />

              {/* PASTILLA PTC: CUERPO CON SOMBREADO SEMÁNTICO TÉRMICO CONTINUO */}
              {/* Cambia dinámicamente con el incremento progresivo de temperatura (azul -> ámbar -> rojo) */}
              {/* y con el enfriamiento gradual hasta la temperatura ambiental (rojo -> ámbar -> azul) */}
              <rect
                x={ptcBoxX}
                y={ptcBoxY}
                width={ptcBoxW}
                height={ptcBoxH}
                rx="3"
                fill={ptcThermal.fillColor}
                stroke={ptcColor}
                strokeWidth={ptcThermal.isHotRed ? '2.4' : ptcThermal.u > 0.4 ? '2.2' : '1.8'}
                filter={ptcThermal.isHotRed ? `url(#glow-ptc-hot-${variant})` : 'none'}
                className={ptcThermal.isHotRed ? 'animate-pulse' : ''}
              />

              {/* SÍMBOLO DINÁMICO EXACTO DEL PTC SEGÚN EL BOCETO TÉCNICO (ABIERTO / CERRADO) */}
              {(() => {
                const yBase = 135;
                const xPivot = ptcBoxX + ptcBoxW * 0.36;
                const xVertical = ptcBoxX + ptcBoxW * 0.68;
                const switchStroke = isPTCConducting
                  ? '#fef08a'
                  : isPTCSwitchOpen
                  ? '#ffffff'
                  : ptcTemp > 65
                  ? '#ffedd5'
                  : '#ffffff';

                if (!isPTCSwitchOpen) {
                  // ===== ESTADO CERRADO (Símbolo Derecho del Boceto) =====
                  // 1. Tramo horizontal izquierdo hasta el punto de partida de la cuchilla
                  // 2. Cuchilla inclinada que cruza/sobrepasa la barra vertical de contacto
                  // 3. Barra vertical con salida horizontal inferior hacia la derecha (L invertida / escalón)
                  return (
                    <g id="ptc-symbol-closed">
                      {/* Tramo horizontal de entrada izquierda */}
                      <line
                        x1={ptcBoxX}
                        y1={yBase}
                        x2={xPivot}
                        y2={yBase}
                        stroke={switchStroke}
                        strokeWidth={isPTCConducting ? '2.8' : '2.2'}
                        strokeLinecap="square"
                      />

                      {/* Barra vertical de contacto (poste fijo) */}
                      <line
                        x1={xVertical}
                        y1={ptcBoxY + 4}
                        x2={xVertical}
                        y2={yBase}
                        stroke={switchStroke}
                        strokeWidth={isPTCConducting ? '2.8' : '2.2'}
                        strokeLinecap="square"
                      />

                      {/* Tramo horizontal de salida derecha */}
                      <line
                        x1={xVertical}
                        y1={yBase}
                        x2={ptcBoxX + ptcBoxW}
                        y2={yBase}
                        stroke={switchStroke}
                        strokeWidth={isPTCConducting ? '2.8' : '2.2'}
                        strokeLinecap="square"
                      />

                      {/* Cuchilla móvil inclinada que CRUZA el poste vertical (contacto cerrado) */}
                      <line
                        x1={xPivot}
                        y1={yBase}
                        x2={xVertical + ptcBoxW * 0.08}
                        y2={yBase - 11}
                        stroke={switchStroke}
                        strokeWidth={isPTCConducting ? '3' : '2.4'}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                } else {
                  // ===== ESTADO ABIERTO (Símbolo Izquierdo del Boceto) =====
                  // 1. Tramo horizontal izquierdo
                  // 2. Cuchilla inclinada abierta hacia arriba en el aire (sin tocar nada)
                  // 3. Separación (air gap)
                  // 4. Tramo horizontal derecho al mismo nivel horizontal (sin poste vertical)
                  return (
                    <g id="ptc-symbol-open">
                      {/* Tramo horizontal de entrada izquierda */}
                      <line
                        x1={ptcBoxX}
                        y1={yBase}
                        x2={xPivot}
                        y2={yBase}
                        stroke={switchStroke}
                        strokeWidth="2.2"
                        strokeLinecap="square"
                      />

                      {/* Cuchilla móvil abierta hacia arriba con separación visible */}
                      <line
                        x1={xPivot}
                        y1={yBase}
                        x2={ptcBoxX + ptcBoxW * 0.58}
                        y2={ptcBoxY + 6}
                        stroke={switchStroke}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />

                      {/* Tramo horizontal de salida derecha (a la misma altura horizontal de entrada) */}
                      <line
                        x1={ptcBoxX + ptcBoxW * 0.68}
                        y1={yBase}
                        x2={ptcBoxX + ptcBoxW}
                        y2={yBase}
                        stroke={switchStroke}
                        strokeWidth="2.2"
                        strokeLinecap="square"
                      />
                    </g>
                  );
                }
              })()}

              {/* Rótulo interior de estado del interruptor */}
              <text
                x={ptcCenterX}
                y={ptcBoxY + ptcBoxH - 3}
                fontSize="5.5"
                fontWeight="bold"
                textAnchor="middle"
                fill="#ffffff"
                fontFamily="sans-serif"
                letterSpacing="0.5px"
              >
                {isPTCSwitchOpen ? 'ABIERTO' : 'CERRADO'}
              </text>

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
