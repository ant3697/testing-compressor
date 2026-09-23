import React, { useState } from 'react';

export interface DifferentialSwitchSvgProps {
  className?: string;
  isTripped?: boolean;
  onToggle?: () => void;
  interactive?: boolean;
  asGroup?: boolean;
}

export const DifferentialSwitchSvg: React.FC<DifferentialSwitchSvgProps> = ({
  className = '',
  isTripped = true,
  onToggle,
  interactive = true,
  asGroup = false,
}) => {
  const [internalTripped, setInternalTripped] = useState<boolean>(isTripped);

  // Sync with prop when prop changes
  React.useEffect(() => {
    setInternalTripped(isTripped);
  }, [isTripped]);

  const handleAction = () => {
    if (!interactive) return;
    if (onToggle) {
      onToggle();
    } else {
      setInternalTripped(!internalTripped);
    }
  };

  const currentTripped = isTripped !== undefined ? isTripped : internalTripped;

  const innerSvgContent = (
    <>
      <defs>
          {/* Sombra suave para la carcasa frontal */}
          <filter id="diffShadow" x="-5%" y="-3%" width="110%" height="108%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.18" />
          </filter>

          {/* Sombra interior sutil para huecos de tornillos */}
          <radialGradient id="diffHoleDepth" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#2a2e33" />
            <stop offset="100%" stopColor="#14171a" />
          </radialGradient>

          {/* Cabeza de tornillo metalizada */}
          <linearGradient id="diffScrewMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a0a5aa" />
            <stop offset="50%" stopColor="#6e747c" />
            <stop offset="100%" stopColor="#464a50" />
          </linearGradient>

          {/* Definicion de Borne con Tornillo Cruz/Ranurado */}
          <g id="diff-borne-tornillo">
            <circle cx="0" cy="0" r="23" fill="url(#diffHoleDepth)" />
            <circle cx="0" cy="0" r="17" fill="url(#diffScrewMetal)" stroke="#3a3d42" strokeWidth="1" />
            <rect x="-13" y="-2" width="26" height="4" fill="#202226" rx="1" />
            <rect x="-2" y="-13" width="4" height="26" fill="#202226" rx="1" />
            <circle cx="0" cy="0" r="4.5" fill="#181a1c" />
          </g>

          {/* Orificio de calibracion/inspeccion */}
          <circle id="diff-calib-hole" cx="0" cy="0" r="14" fill="#cfd3d8" stroke="#b0b5bc" strokeWidth="1.5" />
        </defs>

        {/* ================= BASE TRASERA ================= */}
        <rect x="25" y="10" width="270" height="600" rx="20" ry="20" fill="#c7ccd1" />
        <line x1="160" y1="12" x2="160" y2="110" stroke="#b0b5bb" strokeWidth="2" />
        <line x1="160" y1="510" x2="160" y2="608" stroke="#b0b5bb" strokeWidth="2" />

        {/* ================= BORNES SUPERIORES ================= */}
        <use href="#diff-borne-tornillo" x="90" y="62" />
        <text x="44" y="69" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="bold" fill="#333">
          1
        </text>
        <use href="#diff-borne-tornillo" x="230" y="62" />
        <text x="258" y="69" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="bold" fill="#333">
          N
        </text>
        <use href="#diff-calib-hole" x="145" y="62" />

        {/* ================= BORNES INFERIORES ================= */}
        <use href="#diff-borne-tornillo" x="90" y="558" />
        <text x="44" y="565" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="bold" fill="#333">
          2
        </text>
        <use href="#diff-borne-tornillo" x="230" y="558" />
        <text x="258" y="565" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="bold" fill="#333">
          N
        </text>
        <use href="#diff-calib-hole" x="175" y="558" />

        {/* ================= CARCASA FRONTAL ================= */}
        <rect x="10" y="112" width="300" height="396" rx="16" ry="16" fill="#f0f2f4" filter="url(#diffShadow)" />

        {/* ================= BOTON DE TEST (T) ================= */}
        <g id="diff-test-button" className="transition-transform active:scale-95">
          <rect x="42" y="148" width="56" height="52" rx="7" ry="7" fill="#005db3" />
          <rect x="44" y="150" width="52" height="46" rx="6" ry="6" fill="#0077d6" />
          <text
            x="70"
            y="184"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="34"
            fontWeight="bold"
            fill="#dcedfb"
            textAnchor="middle"
          >
            T
          </text>
          <text
            x="70"
            y="218"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="11"
            fontWeight="600"
            fill="#555"
            textAnchor="middle"
          >
            Test Monthly
          </text>
        </g>

        {/* ================= PALANCA DE ACCIONAMIENTO ================= */}
        <g id="diff-palanca-actuador">
          {/* Cavidad del panel frontal */}
          <rect x="36" y="260" width="70" height="152" rx="10" ry="10" fill="#dce0e5" stroke="#c0c5cc" strokeWidth="1.5" />

          {currentTripped ? (
            /* POSICION ABIERTA / O - OFF (DISPARADA POR DEFECTO A TIERRA) */
            <g id="palanca-abierta">
              {/* Indicador de corte visible en cavidad (Verde = Abierto/Seguro segun IEC 60947-2) */}
              <rect x="44" y="270" width="54" height="20" rx="3" ry="3" fill="#2e7d32" />
              <text
                x="71"
                y="285"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                OFF
              </text>

              {/* Rampa mecanica superior descubierta por la bajada de la maneta */}
              <path d="M 44,295 L 98,295 L 94,332 L 48,332 Z" fill="#005ba4" />

              {/* Cuerpo principal de la palanca desplazada hacia abajo */}
              <rect x="42" y="330" width="58" height="68" rx="6" ry="6" fill="#0077d6" stroke="#004c8c" strokeWidth="1.5" />
              <text
                x="71"
                y="372"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
                letterSpacing="1"
              >
                O · OFF
              </text>
            </g>
          ) : (
            /* POSICION CERRADA / I - ON (REARMADO) */
            <g id="palanca-cerrada">
              {/* Indicador de corte visible en cavidad (Rojo = Conectado/Tensión) */}
              <rect x="44" y="380" width="54" height="20" rx="3" ry="3" fill="#c62828" />
              <text
                x="71"
                y="395"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
              >
                ON
              </text>

              {/* Cuerpo principal de la palanca posicionada arriba */}
              <rect x="42" y="268" width="58" height="68" rx="6" ry="6" fill="#0077d6" stroke="#004c8c" strokeWidth="1.5" />
              <text
                x="71"
                y="310"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="middle"
                letterSpacing="1"
              >
                I · ON
              </text>
            </g>
          )}
        </g>

        {/* ================= LOGOTIPO Y SERIGRAFIA TECNICA ================= */}
        <g id="diff-serigrafia" fill="#1b1e22" fontFamily="system-ui, -apple-system, sans-serif">
          <rect x="156" y="146" width="94" height="25" rx="12" fill="#c31d27" />
          <text x="203" y="163" fontSize="14" fontWeight="bold" fontStyle="italic" fill="#ffffff" textAnchor="middle">
            Tosun<tspan fontSize="9" fontStyle="normal">Lux</tspan>
          </text>

          <line x1="140" y1="180" x2="280" y2="180" stroke="#c31d27" strokeWidth="1.5" />

          <text x="140" y="202" fontSize="17" fontWeight="bold">
            TSL3-100
          </text>
          <text x="140" y="224" fontSize="13" fontWeight="500">
            In
          </text>

          <polygon points="268,206 279,217 268,228 257,217" fill="none" stroke="#222" strokeWidth="1.2" />
          <text x="268" y="221" fontSize="9" fontWeight="bold" textAnchor="middle">
            -25
          </text>

          {/* Indicador de maniobra con estado en posicion O inferior */}
          <path d="M 140,240 v 30 m-3,-26 l 3,-5 l 3,5 m-6,22 l 3,5 l 3,-5" stroke="#222" strokeWidth="1.3" fill="none" />
          <circle cx="140" cy="277" r="2.5" fill="none" stroke="#222" strokeWidth="1.2" />
          <rect x="152" y="260" width="18" height="12" fill={currentTripped ? '#2e7d32' : '#c62828'} rx="1.5" />
          <text x="248" y="267" fontSize="28" fontWeight="bold" letterSpacing="1">
            CE
          </text>

          <text x="140" y="302" fontSize="12" fontWeight="600">
            Un 240V~
          </text>
          <text x="140" y="318" fontSize="12" fontWeight="600">
            IΔn 30mA
          </text>

          <rect x="238" y="308" width="22" height="13" fill="none" stroke="#222" strokeWidth="1" />
          <path d="M 242,314.5 Q 245,310 249,314.5 T 256,314.5" fill="none" stroke="#222" strokeWidth="1.2" />

          <text x="140" y="334" fontSize="10.5" fontWeight="500">
            Inc=IΔc=6000A
          </text>
          <text x="140" y="349" fontSize="11" fontWeight="500">
            IEC61008-1
          </text>
        </g>

        {/* ================= ESQUEMA ELECTRICO VECTORIAL ================= */}
        <g id="diff-esquema-electrico" stroke="#1b1e22" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <text x="178" y="367" fontSize="9" fontFamily="system-ui" stroke="none" fill="#111">
            |1
          </text>
          <text x="194" y="367" fontSize="9" fontFamily="system-ui" stroke="none" fill="#111">
            |N
          </text>

          {/* Contacto Fase */}
          <path d="M 180,370 v 10" />
          <circle cx="180" cy="380" r="1.2" fill="#111" />
          <path d={currentTripped ? 'M 180,380 l 8,-9' : 'M 180,380 l 0,16'} />
          <circle cx="180" cy="396" r="1.2" fill="#111" />
          <path d="M 180,396 v 34" />

          {/* Contacto Neutro */}
          <path d="M 196,370 v 10" />
          <circle cx="196" cy="380" r="1.2" fill="#111" />
          <path d={currentTripped ? 'M 196,380 l 8,-9' : 'M 196,380 l 0,16'} />
          <circle cx="196" cy="396" r="1.2" fill="#111" />
          <path d="M 196,396 v 34" />

          {/* Toroide de deteccion diferencial */}
          <ellipse cx="188" cy="407" rx="16" ry="6" />

          {/* Rele de disparo / actuador mecanico */}
          <rect x="207" y="388" width="9" height="7" fill="#fff" />
          <path d="M 202,407 h 10 v -12" />
          <path d="M 207,388 v -5 h -16" />

          {/* Circuito de prueba Test */}
          <path d="M 152,382 h 14" />
          <path d="M 152,382 v 18 h 5" />
          <rect x="157" y="396" width="7" height="11" fill="#fff" />
          <path d="M 160.5,407 v 12 h 19.5" />

          <text x="178" y="442" fontSize="9" fontFamily="system-ui" stroke="none" fill="#111">
            |2
          </text>
          <text x="194" y="442" fontSize="9" fontFamily="system-ui" stroke="none" fill="#111">
            |N
          </text>
        </g>
    </>
  );

  if (asGroup) {
    return (
      <g className={className} onClick={handleAction}>
        {innerSvgContent}
      </g>
    );
  }

  return (
    <div
      className={`inline-block relative select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleAction}
      title={
        currentTripped
          ? 'Interruptor Diferencial Disparado (0 · OFF) - Click para rearmar'
          : 'Interruptor Diferencial Conectado (I · ON) - Click para probar'
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 620"
        className="w-full h-full drop-shadow-xl"
        style={{ overflow: 'visible' }}
      >
        {innerSvgContent}
      </svg>
    </div>
  );
};
