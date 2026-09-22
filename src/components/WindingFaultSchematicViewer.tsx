import React, { useState } from 'react';
import { ZoomPanViewer } from './ZoomPanViewer';
import { AlertTriangle, CheckCircle2, Zap, HelpCircle, ShieldAlert, Volume2, RotateCw } from 'lucide-react';
import { KlixonModal } from './KlixonModal';
import { playFaultAcousticSound } from '../utils/audio';
import { CompressorChassisTerminals } from './CompressorChassisTerminals';
import { KlixonTestSvg } from './KlixonTestSvg';
import { AmperometricRelayTestSvg } from './AmperometricRelayTestSvg';

export type WindingFaultType =
  | 'case1'
  | 'case2'
  | 'case3'
  | 'case4'
  | 'case5'
  | 'case6'
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
  orientation?: 'apexDown' | 'apexUp';
  onToggleOrientation?: () => void;
}

export const FAULT_DETAILS: Record<
  string,
  {
    caseNumber: number | null;
    title: string;
    tabLabel: string;
    description: string;
    reading: string;
    verdict: string;
    color: string;
  }
> = {
  case1: {
    caseNumber: 1,
    title: 'Caso 1: Intenta arrancar, zumba 3 segundos y se oye un "clic" (salta Klixon)',
    tabLabel: '1. Salto Klixon (3s)',
    description: 'Rotor bloqueado mecánicamente o condensador/relé defectuoso. La sobreintensidad LRA (28 A) calienta el bimetal (>105°C) hasta que abre con un "clic".',
    reading: 'Pinza Amperimétrica: 28.5 A (LRA) ➔ 0.0 A tras el disparo en 3s',
    verdict: 'ROTOR TRABADO / SOBREINTENSIDAD LRA',
    color: '#ef4444',
  },
  case2: {
    caseNumber: 2,
    title: 'Caso 2: Salta el interruptor diferencial de inmediato al conectar',
    tabLabel: '2. Salta Diferencial',
    description: 'Pérdida de rigidez dieléctrica en el barniz de los bobinados o aceite degradado con partículas. Fuga a masa metálica > 30mA.',
    reading: 'Entre Borne y Carcasa PE: 85.4 Ω (o pitido zumbador)',
    verdict: 'DERIVACIÓN A TIERRA • COMPRESOR DESECHABLE',
    color: '#ef4444',
  },
  case3: {
    caseNumber: 3,
    title: 'Caso 3: El multímetro marca "1." (OL / Circuito Abierto) entre bornes',
    tabLabel: '3. Multímetro O.L (Corte)',
    description: 'Rotura física de una espira interna o hilo de cobre fundido. El circuito está interrumpido y no puede circular corriente para arrancar.',
    reading: 'R(C-S): 1 . (O.L) • R(C-R): 9.7 Ω • R(R-S): 1 . (O.L)',
    verdict: 'BOBINADO CORTADO • SUSTITUIR COMPRESOR',
    color: '#f59e0b',
  },
  case4: {
    caseNumber: 4,
    title: 'Caso 4: La suma de resistencias no coincide: R_M + R_S ≠ R_Total',
    tabLabel: '4. Desbalance de Suma',
    description: 'Espiras adyacentes soldadas en cortocircuito por recalentamiento. La resistencia cae anómalamente y se rompe la ley del motor monofásico.',
    reading: 'R_M: 3.2 Ω + R_S: 13.1 Ω = 16.3 Ω ≠ 22.8 Ω (R_Total medido)',
    verdict: 'ESPIRAS EN CORTO • DISPARO TÉRMICO CONTINUO',
    color: '#f97316',
  },
  case5: {
    caseNumber: 5,
    title: 'Caso 5: ¿Cómo comprobar el Protector Térmico (Klixon) con el multímetro?',
    tabLabel: '5. Probar Klixon',
    description: 'Comprobación entre los bornes externos 1 y 3 (el punto 2 es unión interna dentro de la cápsula y no es accesible para medir). En frío mide la serie completa de bimetal y calefactor (~2.3 Ω).',
    reading: 'Prueba Bornes 1 - 3 (Serie Bimetal + Calefactor): 2.3 Ω en frío (Sano) • O.L (Disparado/Quemado)',
    verdict: 'EN FRÍO 1-3 DEBE MEDIR ~2.3 Ω. SI MARCA O.L EL BIMETAL O CALEFACTOR ESTÁN CORTADOS',
    color: '#3b82f6',
  },
  case6: {
    caseNumber: 6,
    title: 'Caso 6: ¿Cómo comprobar el Relé de Intensidad (R. Int) con el multímetro?',
    tabLabel: '6. Probar Relé Intensidad',
    description: 'Comprobación de contactos de arranque y bobina de intensidad con P1 y P3 unidos: en vertical P1-P2 está abierto (O.L); al invertir 180° debe cerrar (0.0 Ω).',
    reading: 'Contactos (P1-P2): Vertical O.L • Invertido: 0.0 Ω | Bobina (P1-P3): 0.3 Ω',
    verdict: 'SI EN VERTICAL DA 0 Ω, CONTACTOS ESTÁN PEGADOS',
    color: '#8b5cf6',
  },
  healthy: {
    caseNumber: null,
    title: 'Compresor Sano (Referencia de Fábrica)',
    tabLabel: '✓ Compresor Sano',
    description: 'Aislamiento perfecto a masa (>500 MΩ) y suma exacta de resistencias: R_Marcha (9.7 Ω) + R_Arranque (13.1 Ω) = R_Total (22.8 Ω).',
    reading: 'R_M: 9.7 Ω • R_S: 13.1 Ω • Σ: 22.8 Ω • Aislamiento: >500 MΩ',
    verdict: 'APTO PARA SERVICIO',
    color: '#22c55e',
  },
  // Aliases for backwards compatibility
  open_klixon: {
    caseNumber: 1,
    title: 'Caso 1: Intenta arrancar, zumba 3 segundos y se oye un "clic" (salta Klixon)',
    tabLabel: '1. Salto Klixon (3s)',
    description: 'Rotor bloqueado mecánicamente o condensador/relé defectuoso. La sobreintensidad LRA (28 A) calienta el bimetal (>105°C) hasta que abre con un "clic".',
    reading: 'Pinza Amperimétrica: 28.5 A (LRA) ➔ 0.0 A tras el disparo en 3s',
    verdict: 'ROTOR TRABADO / SOBREINTENSIDAD LRA',
    color: '#ef4444',
  },
  ground_fault: {
    caseNumber: 2,
    title: 'Caso 2: Salta el interruptor diferencial de inmediato al conectar',
    tabLabel: '2. Salta Diferencial',
    description: 'Pérdida de rigidez dieléctrica en el barniz de los bobinados o aceite degradado con partículas. Fuga a masa metálica > 30mA.',
    reading: 'Entre Borne y Carcasa PE: 85.4 Ω (o pitido zumbador)',
    verdict: 'DERIVACIÓN A TIERRA • COMPRESOR DESECHABLE',
    color: '#ef4444',
  },
  open_winding: {
    caseNumber: 3,
    title: 'Caso 3: El multímetro marca "1." (OL / Circuito Abierto) entre bornes',
    tabLabel: '3. Multímetro O.L (Corte)',
    description: 'Rotura física de una espira interna o hilo de cobre fundido. El circuito está interrumpido y no puede circular corriente para arrancar.',
    reading: 'R(C-S): 1 . (O.L) • R(C-R): 9.7 Ω • R(R-S): 1 . (O.L)',
    verdict: 'BOBINADO CORTADO • SUSTITUIR COMPRESOR',
    color: '#f59e0b',
  },
  shorted_turns: {
    caseNumber: 4,
    title: 'Caso 4: La suma de resistencias no coincide: R_M + R_S ≠ R_Total',
    tabLabel: '4. Desbalance de Suma',
    description: 'Espiras adyacentes soldadas en cortocircuito por recalentamiento. La resistencia cae anómalamente y se rompe la ley del motor monofásico.',
    reading: 'R_M: 3.2 Ω + R_S: 13.1 Ω = 16.3 Ω ≠ 22.8 Ω (R_Total medido)',
    verdict: 'ESPIRAS EN CORTO • DISPARO TÉRMICO CONTINUO',
    color: '#f97316',
  },
  bad_relay: {
    caseNumber: 6,
    title: 'Caso 6: ¿Cómo comprobar el Relé de Intensidad (R. Int) con el multímetro?',
    tabLabel: '6. Probar Relé Intensidad',
    description: 'Comprobación de contactos de arranque y bobina de intensidad con P1 y P3 unidos: en vertical P1-P2 está abierto (O.L); al invertir 180° debe cerrar (0.0 Ω).',
    reading: 'Contactos (P1-P2): Vertical O.L • Invertido: 0.0 Ω | Bobina (P1-P3): 0.3 Ω',
    verdict: 'SI EN VERTICAL DA 0 Ω, CONTACTOS ESTÁN PEGADOS',
    color: '#8b5cf6',
  },
};

export const WindingFaultSchematicViewer: React.FC<WindingFaultSchematicViewerProps> = ({
  selectedFault = 'case2',
  onSelectFault,
  rMarcha = '9.7',
  rArranque = '13.1',
  rTotal = '22.8',
  orientation = 'apexDown',
  onToggleOrientation,
}) => {
  const [internalFault] = useState<WindingFaultType>(selectedFault);
  const [internalOrientation, setInternalOrientation] = useState<'apexDown' | 'apexUp'>('apexDown');
  const [isKlixonModalOpen, setIsKlixonModalOpen] = useState<boolean>(false);

  const activeFault = onSelectFault ? selectedFault : internalFault;
  const currentOrientation = orientation || internalOrientation;
  const handleToggleOrientation = onToggleOrientation || (() => setInternalOrientation(prev => prev === 'apexDown' ? 'apexUp' : 'apexDown'));

  const faultInfo = FAULT_DETAILS[activeFault] || FAULT_DETAILS.case2;

  const isKlixonCase = activeFault === 'case5';
  const isRelayCase = activeFault === 'case6' || activeFault === 'bad_relay';

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1420] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col justify-between select-none overflow-hidden">
      {/* 1. Header Bar */}
      <div className="h-8 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
            {faultInfo.caseNumber ? `CASO ${faultInfo.caseNumber}` : 'REFERENCIA'}
          </span>
          <h4 className="text-small font-bold truncate text-slate-900 dark:text-white">
            {faultInfo.title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Orientation switch button (applicable for compressor chassis view) */}
          {!isKlixonCase && !isRelayCase && (
            <button
              type="button"
              onClick={handleToggleOrientation}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="Cambiar orientación: Borne C arriba o Borne C abajo"
            >
              <RotateCw className="w-3 h-3 text-amber-500" />
              <span>{currentOrientation === 'apexDown' ? 'C Abajo 🔻' : 'C Arriba 🔺'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => playFaultAcousticSound(activeFault)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
            title="Escuchar audio acústico de la avería"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>

      {/* 2. Main Center Display: Interactive Test or ZoomPanViewer hosting the schematic */}
      <div className="relative w-full flex-1 min-h-[350px] flex flex-col items-center justify-center bg-slate-900/90 dark:bg-[#070b14] rounded-lg border border-slate-200 dark:border-slate-800/80 p-2 overflow-hidden">
        {isKlixonCase ? (
          <ZoomPanViewer
            key="klixon-test-viewer"
            className="w-full h-full min-h-[350px] rounded-lg relative"
            containerClassName="w-full h-full relative flex items-center justify-center"
            initialZoom={1}
            minZoom={0.8}
            maxZoom={3.5}
            toolbarPosition="top-right"
            title="Comprobación de Protector Térmico (Klixon)"
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-1">
              <KlixonTestSvg
                className="w-full max-w-[540px]"
                onOpenKlixonModal={() => setIsKlixonModalOpen(true)}
              />
            </div>
          </ZoomPanViewer>
        ) : isRelayCase ? (
          <ZoomPanViewer
            key="relay-test-viewer"
            className="w-full h-full min-h-[350px] rounded-lg relative"
            containerClassName="w-full h-full relative flex items-center justify-center"
            initialZoom={1}
            minZoom={0.8}
            maxZoom={3.5}
            toolbarPosition="top-right"
            title="Comprobación de Relé Amperométrico de Intensidad"
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-1">
              <AmperometricRelayTestSvg className="w-full max-w-[540px]" />
            </div>
          </ZoomPanViewer>
        ) : (
          <ZoomPanViewer
            key={`terminals-viewer-${activeFault}-${currentOrientation}`}
            className="w-full h-full min-h-[350px] rounded-lg relative"
            containerClassName="w-full h-full relative flex items-center justify-center"
            initialZoom={1}
            minZoom={0.8}
            maxZoom={3.5}
            toolbarPosition="top-right"
            title={`Esquema: ${faultInfo.title}`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-2">
              <CompressorChassisTerminals
                orientation={currentOrientation}
                activeFault={activeFault}
                rMarcha={rMarcha}
                rArranque={rArranque}
                rTotal={rTotal}
                onKlixonClick={() => setIsKlixonModalOpen(true)}
                className="w-full max-w-[360px]"
              />
            </div>
          </ZoomPanViewer>
        )}
      </div>

      {/* 4. Color Code Legend & Direct Actions */}
      <div className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shrink-0">
        {isKlixonCase ? (
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm inline-block border border-slate-700"></span>
              <span>Borne 1: Conexión Externa (Bimetal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-slate-700 rounded-sm inline-block border border-slate-600"></span>
              <span className="text-slate-500">Nodo 2: Unión Interna (No accesible)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block border border-slate-700"></span>
              <span>Borne 3: Conexión Externa (Calefactor)</span>
            </div>
          </div>
        ) : isRelayCase ? (
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm inline-block border border-slate-700"></span>
              <span>P1-P2 (Contactos L-S): Vertical O.L / Invertido 0.0 Ω</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm inline-block border border-slate-700"></span>
              <span>P1-P3 (Bobina L-R): 0.3 Ω</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm inline-block border border-slate-700"></span>
              <span>P2-P3 (Arranque-Marcha): Vertical O.L / Invertido 0.3 Ω</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full inline-block"></span>
              <span>Marcha C-R ({rMarcha} Ω)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-amber-500 inline-block"></span>
              <span>Arranque C-S ({rArranque} Ω)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-blue-500 inline-block"></span>
              <span>Suma R-S ({rTotal} Ω)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Tierra PE</span>
            </div>
          </div>
        )}

        {isKlixonCase && (
          <button
            type="button"
            onClick={() => setIsKlixonModalOpen(true)}
            className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
          >
            🔍 Ver Klixon Real
          </button>
        )}
      </div>

      {/* 5. Fault Technical Readout Box */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-tiny font-mono shrink-0">
        <div>
          <span className="text-slate-500 font-bold">Diagnóstico Multímetro: </span>
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
