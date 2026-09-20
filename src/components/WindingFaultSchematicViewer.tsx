import React, { useState } from 'react';
import { ZoomPanViewer } from './ZoomPanViewer';
import { AlertTriangle, CheckCircle2, Zap, HelpCircle, ShieldAlert } from 'lucide-react';
import { KlixonModal } from './KlixonModal';

export type WindingFaultType =
  | 'healthy'
  | 'ground_fault'
  | 'open_winding'
  | 'shorted_turns'
  | 'open_klixon'
  | 'bad_relay';

interface WindingFaultSchematicViewerProps {
  selectedFault?: WindingFaultType;
  onSelectFault?: (fault: WindingFaultType) => void;
  rMarcha?: string;
  rArranque?: string;
  rTotal?: string;
}

const FAULT_DETAILS: Record<
  WindingFaultType,
  {
    title: string;
    description: string;
    reading: string;
    verdict: string;
    color: string;
  }
> = {
  healthy: {
    title: 'Compresor Sano (Referencia de Fábrica)',
    description: 'Aislamiento perfecto a masa (&gt;500 MΩ) y suma exacta de resistencias: R_Marcha + R_Arranque = R_Total.',
    reading: 'R_M: 9.7 Ω • R_S: 13.1 Ω • Σ: 22.8 Ω • Masa: O.L',
    verdict: 'APTO PARA SERVICIO',
    color: '#22c55e',
  },
  ground_fault: {
    title: 'Derivación a Masa / Fuga a Tierra (Carcasa)',
    description: 'Pérdida de rigidez dieléctrica en el barniz de los bobinados o aceite degradado con partículas. Salta el diferencial.',
    reading: 'Entre Borne y Carcasa: 85.4 Ω (o pitido zumbador)',
    verdict: 'PELIGRO ELÉCTRICO • COMPRESOR DESECHABLE',
    color: '#ef4444',
  },
  open_winding: {
    title: 'Devanado Cortado / Abierto (Circuito Abierto)',
    description: 'Rotura física de una espira interna o hilo fundido por sobrecalentamiento. El polímetro marca circuito abierto.',
    reading: 'Entre C y S: 1 . (O.L / Resistencia Infinita)',
    verdict: 'BOBINADO ABIERTO • NO ARRANCA (ZUMBA O MUERTO)',
    color: '#f59e0b',
  },
  shorted_turns: {
    title: 'Espiras en Cortocircuito (Desbalance de Ohmios)',
    description: 'Espiras adyacentes soldadas por sobrecalentamiento. La resistencia del devanado cae anómalamente y R_M + R_S ≠ R_Total.',
    reading: 'R_M: 3.2 Ω (Muy baja) • R_S: 13.1 Ω • Dispara térmico',
    verdict: 'CORTOCIRCUITO INTERNO • ALTO CONSUMO Y DISPARO KLIXON',
    color: '#f97316',
  },
  open_klixon: {
    title: 'Klixon Abierto / Rotor Bloqueado Mecánicamente',
    description: 'El bimetal del protector térmico abrió sus contactos por exceso de temperatura de carcasa (&gt;105°C) o sobreintensidad.',
    reading: 'Entre borne C exterior y bobina interna: Circuito abierto',
    verdict: 'ESPERAR ENFRIAMIENTO (15-30 MIN) O SUSTITUIR KLIXON',
    color: '#ec4899',
  },
  bad_relay: {
    title: 'Relé de Arranque Averiado (Contactos Quemados)',
    description: 'El relé no cierra sus contactos para conectar la fase auxiliar de arranque, o se queda pegado quemando la bobina S.',
    reading: 'Bobina compresor sana pero no recibe tensión en S',
    verdict: 'SUSTITUIR RELÉ O PASTILLA PTC EXTERNA',
    color: '#8b5cf6',
  },
};

export const WindingFaultSchematicViewer: React.FC<WindingFaultSchematicViewerProps> = ({
  selectedFault = 'ground_fault',
  onSelectFault,
  rMarcha = '9.7',
  rArranque = '13.1',
  rTotal = '22.8',
}) => {
  const [internalFault, setInternalFault] = useState<WindingFaultType>(selectedFault);
  const [isKlixonModalOpen, setIsKlixonModalOpen] = useState<boolean>(false);
  const activeFault = onSelectFault ? selectedFault : internalFault;
  const setFault = onSelectFault || setInternalFault;

  const faultInfo = FAULT_DETAILS[activeFault];

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1420] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col justify-between select-none overflow-hidden">
      {/* 1. Header Bar */}
      <div className="h-8 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
            ESQUEMA TÉCNICO
          </span>
          <span className="text-tiny font-secondary text-slate-600 dark:text-slate-300 font-semibold truncate hidden sm:inline">
            Diagnóstico de Averías Internas en Estator
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-tiny font-mono font-bold text-slate-500 hidden md:inline">
            Modo:
          </span>
          <span
            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase"
            style={{
              backgroundColor: `${faultInfo.color}20`,
              color: faultInfo.color,
              border: `1px solid ${faultInfo.color}40`,
            }}
          >
            {faultInfo.title.split(' ')[0]} {faultInfo.title.split(' ')[1]}
          </span>
        </div>
      </div>

      {/* 2. Fault Quick Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1 my-1 shrink-0 text-tiny font-mono">
        {(Object.keys(FAULT_DETAILS) as WindingFaultType[]).map((fKey) => {
          const isSelected = activeFault === fKey;
          const info = FAULT_DETAILS[fKey];
          return (
            <button
              key={fKey}
              type="button"
              onClick={() => setFault(fKey)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {info.title.split('(')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* 3. Main Center Display: ZoomPanViewer hosting the Dynamic SVG Fault Schematic */}
      <div className="relative w-full flex-1 min-h-[350px] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b14] rounded-lg border border-slate-200 dark:border-slate-800/80 p-2 overflow-hidden">
        <ZoomPanViewer
          className="w-full h-full min-h-[350px] rounded-lg relative"
          containerClassName="w-full h-full relative flex items-center justify-center"
          initialZoom={1}
          minZoom={0.8}
          maxZoom={3.5}
          toolbarPosition="top-right"
          title={`Esquema de avería: ${faultInfo.title}`}
        >
          <svg
            viewBox="0 0 540 330"
            className="w-full h-full max-h-[340px] select-none font-sans"
          >
            <defs>
              {/* Spark Arc Glow */}
              <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Compressor Stator Frame */}
            <rect
              x="50"
              y="25"
              width="440"
              height="280"
              rx="24"
              fill="#090d16"
              stroke={activeFault === 'ground_fault' ? '#ef4444' : '#334155'}
              strokeWidth={activeFault === 'ground_fault' ? 3 : 2}
              strokeDasharray={activeFault === 'ground_fault' ? '6 3' : undefined}
            />

            <text
              x="270"
              y="52"
              fill="#94a3b8"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              CHASIS METÁLICO DEL COMPRESOR (CARCASA SELLADA)
            </text>

            {/* Grounding Lug on Casing */}
            <g transform="translate(440, 240)">
              <rect x="0" y="0" width="36" height="24" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <path d="M 10 18 L 26 18 M 14 21 L 22 21 M 17 24 L 19 24" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
              <text x="18" y="12" fill="#22c55e" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                MASA
              </text>
            </g>

            {/* Terminal C (Común) with Klixon */}
            <g transform="translate(235, 75)">
              <circle cx="35" cy="20" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
              <text x="35" y="25" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle">
                C
              </text>
              <text x="35" y="46" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                COMÚN
              </text>
            </g>

            {/* Klixon Box */}
            <g
              transform="translate(240, 125)"
              onClick={() => setIsKlixonModalOpen(true)}
              className="cursor-pointer group"
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <title>Protector Térmico Klixon: Clic para ver fotografía y despiece en ventana modal</title>
              <rect
                x="0"
                y="0"
                width="60"
                height="30"
                rx="6"
                fill={activeFault === 'open_klixon' ? '#450a0a' : '#1e293b'}
                stroke={activeFault === 'open_klixon' ? '#ef4444' : '#fbbf24'}
                strokeWidth="1.8"
                className="transition-all hover:stroke-amber-300 hover:fill-amber-950/40"
              />
              <text x="30" y="16" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                KLIXON
              </text>
              <text
                x="30"
                y="26"
                fill={activeFault === 'open_klixon' ? '#f87171' : '#22c55e'}
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {activeFault === 'open_klixon' ? 'ABIERTO' : 'CERRADO'}
              </text>
            </g>

            {/* Terminal R (Marcha / Run) */}
            <g transform="translate(110, 230)">
              <circle cx="35" cy="20" r="14" fill="#22c55e" stroke="#ffffff" strokeWidth="2.5" />
              <text x="35" y="25" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle">
                R
              </text>
              <text x="35" y="46" fill="#22c55e" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                MARCHA ({rMarcha}Ω)
              </text>
            </g>

            {/* Terminal S (Arranque / Start) */}
            <g transform="translate(360, 230)">
              <circle cx="35" cy="20" r="14" fill="#eab308" stroke="#ffffff" strokeWidth="2.5" />
              <text x="35" y="25" fill="#000000" fontSize="13" fontWeight="900" textAnchor="middle">
                S
              </text>
              <text x="35" y="46" fill="#eab308" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                ARRANQUE ({rArranque}Ω)
              </text>
            </g>

            {/* BOBINADO DE MARCHA (C -> R) */}
            <path
              d="M 255 155 C 220 180, 180 200, 145 230"
              fill="none"
              stroke={
                activeFault === 'shorted_turns'
                  ? '#f97316'
                  : activeFault === 'open_winding'
                  ? '#64748b'
                  : '#22c55e'
              }
              strokeWidth={activeFault === 'shorted_turns' ? 4.5 : 3.5}
              strokeDasharray={activeFault === 'open_winding' ? '5 5' : undefined}
            />

            {/* BOBINADO DE ARRANQUE (C -> S) */}
            <path
              d="M 285 155 C 320 180, 360 200, 395 230"
              fill="none"
              stroke={
                activeFault === 'open_winding'
                  ? '#ef4444'
                  : activeFault === 'shorted_turns'
                  ? '#eab308'
                  : '#eab308'
              }
              strokeWidth={3}
              strokeDasharray={activeFault === 'open_winding' ? '4 4' : undefined}
            />

            {/* FAULT SPECIFIC GRAPHICAL EFFECTS */}
            {/* 1. Ground Fault Arc */}
            {activeFault === 'ground_fault' && (
              <g filter="url(#arcGlow)">
                {/* Arc lightning line */}
                <path
                  d="M 180 205 L 200 230 L 190 250 L 230 270 L 220 285 L 250 300"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  className="animate-pulse"
                />
                <circle cx="180" cy="205" r="7" fill="#fbbf24" />
                <circle cx="250" cy="300" r="7" fill="#ef4444" />
                <text x="210" y="245" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ¡CHISPAZO A CARCASA! (85.4 Ω)
                </text>
              </g>
            )}

            {/* 2. Open Winding Break */}
            {activeFault === 'open_winding' && (
              <g>
                <circle cx="340" cy="195" r="10" fill="#ef4444" opacity="0.2" className="animate-ping" />
                <circle cx="340" cy="195" r="5" fill="#ef4444" />
                <line x1="333" y1="188" x2="347" y2="202" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="347" y1="188" x2="333" y2="202" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <text x="355" y="198" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  CORTE (O.L)
                </text>
              </g>
            )}

            {/* 3. Shorted Turns Glow */}
            {activeFault === 'shorted_turns' && (
              <g filter="url(#arcGlow)">
                <ellipse cx="195" cy="195" rx="18" ry="12" fill="#ea580c" opacity="0.5" className="animate-pulse" />
                <text x="195" y="218" fill="#fdba74" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  ESPIRAS FUNDIDAS (3.2 Ω)
                </text>
              </g>
            )}

            {/* 4. Healthy indication */}
            {activeFault === 'healthy' && (
              <g transform="translate(225, 200)">
                <rect x="-10" y="0" width="110" height="30" rx="6" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
                <text x="45" y="18" fill="#86efac" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  ✓ EQUILIBRIO PERFECTO
                </text>
              </g>
            )}
          </svg>
        </ZoomPanViewer>
      </div>

      {/* 4. Fault Technical Readout Box */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-tiny font-mono shrink-0">
        <div>
          <span className="text-slate-500 font-bold">Lectura en Polímetro: </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {faultInfo.reading}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
            style={{
              backgroundColor: `${faultInfo.color}15`,
              color: faultInfo.color,
              border: `1px solid ${faultInfo.color}35`,
            }}
          >
            {faultInfo.verdict}
          </span>
        </div>
      </div>

      {/* Ventana modal con fotografía real del Klixon */}
      <KlixonModal
        isOpen={isKlixonModalOpen}
        onClose={() => setIsKlixonModalOpen(false)}
      />
    </div>
  );
};
