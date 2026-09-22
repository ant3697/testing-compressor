import React from 'react';
import { IntuitiveSchematicDiagram, SchematicVariant } from './IntuitiveSchematicDiagram';
import { ZoomPanViewer } from './ZoomPanViewer';
import { Play, AlertTriangle, RefreshCw, Zap, Maximize2, Sparkles } from 'lucide-react';

interface StartingSystemSchematicViewerProps {
  selectedCircuit: SchematicVariant;
  simState: 'idle' | 'starting' | 'running' | 'overload';
  onStartSimulation: () => void;
  onOverload: () => void;
  onReset: () => void;
  onOpenModal: () => void;
}

const CIRCUIT_TITLES: Record<SchematicVariant, { title: string; category: string }> = {
  HST_CSR_RELE: { title: 'CSR con Relé de Arranque', category: 'HST (Alto Par)' },
  HST_CSR_PTC: { title: 'CSR con Termistor PTC', category: 'HST (Alto Par)' },
  HST_CSIR_RELE: { title: 'CSIR con Relé (Doble Condensador)', category: 'HST (Alto Par)' },
  HST_CSIR_PTC: { title: 'CSIR con PTC (Doble Condensador)', category: 'HST (Alto Par)' },
  RSIR_RELE: { title: 'RSIR con Relé de Intensidad', category: 'LST (Bajo Par)' },
  RSIR_PTC: { title: 'RSIR con Termistor PTC', category: 'LST (Bajo Par)' },
  RSCR_RELE: { title: 'PSC / RSCR con Relé', category: 'LST (Bajo Par)' },
  RSCR_PTC: { title: 'RSCR con PTC y Condensador Permanente', category: 'LST (Bajo Par)' },
  CSIR_RELE: { title: 'CSIR Estándar con Relé', category: 'HST (Alto Par)' },
  CSR_POTENCIAL: { title: 'CSR con Relé de Potencial', category: 'HST (Alto Par)' },
};

export const StartingSystemSchematicViewer: React.FC<StartingSystemSchematicViewerProps> = ({
  selectedCircuit,
  simState,
  onStartSimulation,
  onOverload,
  onReset,
  onOpenModal,
}) => {
  const circuitMeta = CIRCUIT_TITLES[selectedCircuit] || {
    title: 'Esquema de Arranque',
    category: 'Sistemas Oficiales',
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f1420] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm flex flex-col justify-between select-none overflow-hidden">
      {/* 1. Header Bar: ESQUEMA TÉCNICO + Subtitle + Controls */}
      <div className="h-8 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0">
            ESQUEMA TÉCNICO
          </span>
          <span className="text-tiny font-secondary text-slate-600 dark:text-slate-300 font-semibold truncate hidden sm:inline">
            {circuitMeta.title} • {circuitMeta.category}
          </span>
        </div>

        {/* Modal open button */}
        <button
          type="button"
          onClick={onOpenModal}
          className="px-2 py-0.5 rounded text-tiny font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          title="Abrir ventana modal para simular conexiones físicas de cables"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">Simular Conexión</span>
        </button>
      </div>

      {/* 2. Simulation State Bar */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-slate-100 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 rounded text-tiny font-mono my-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold hidden sm:inline">Simulación:</span>
          <button
            type="button"
            onClick={onStartSimulation}
            className="px-2 py-0.5 rounded bg-amber-400 text-black hover:bg-amber-300 font-bold flex items-center gap-1 cursor-pointer shadow-sm text-[11px]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Arrancar</span>
          </button>
          <button
            type="button"
            onClick={onOverload}
            className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Klixon</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Restablecer simulación a reposo"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold">
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase ${
              simState === 'idle'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : simState === 'starting'
                ? 'bg-amber-400 text-black animate-pulse shadow-sm'
                : simState === 'running'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {simState === 'idle' && '⚪ REPOSO'}
            {simState === 'starting' && '⚡ ARRANQUE'}
            {simState === 'running' && '🟢 EN MARCHA'}
            {simState === 'overload' && '🔴 KLIXON ABIERTO'}
          </span>
        </div>
      </div>

      {/* 3. Main Center Display: ZoomPanViewer hosting the Schematic */}
      <div className="relative w-full flex-1 min-h-[350px] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b14] rounded-lg border border-slate-200 dark:border-slate-800/80 p-2 overflow-hidden">
        <ZoomPanViewer
          key={`starting-schematic-${selectedCircuit}`}
          className="w-full h-full min-h-[350px] rounded-lg relative"
          containerClassName="w-full h-full relative flex items-center justify-center"
          initialZoom={1}
          minZoom={0.8}
          maxZoom={3.5}
          toolbarPosition="top-right"
          title={`Esquema técnico: ${circuitMeta.title}`}
        >
          <div className="w-full max-w-[540px] p-2 flex items-center justify-center">
            <IntuitiveSchematicDiagram
              variant={selectedCircuit}
              simState={simState}
              className="w-full h-auto"
            />
          </div>
        </ZoomPanViewer>
      </div>

      {/* 4. Bottom Component Legend Strip */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-tiny font-mono text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-3 overflow-x-auto text-[11px]">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
            <span>Verde: Marcha / Bobina relé activa</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20"></span>
            <span>Naranja/Oro: Relé cerrado, PTC o Cond. Arranque en carga</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-500/20"></span>
            <span>Azul: Cond. Marcha permanente en carga</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Gris: Inactivo / Desconectado</span>
          </span>
        </div>

        <span className="text-[11px] hidden lg:inline text-slate-400">
          Líneas iluminadas con badge = componente en carga o actuando
        </span>
      </div>
    </div>
  );
};
