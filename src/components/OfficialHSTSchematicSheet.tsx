import React, { useState } from 'react';
import { IntuitiveSchematicDiagram, SchematicVariant } from './IntuitiveSchematicDiagram';
import { Play, AlertTriangle, RefreshCw, Zap, Maximize2, Sparkles, Layers } from 'lucide-react';
import { StartingSystemModal } from './StartingSystemModal';

export const OfficialHSTSchematicSheet: React.FC = () => {
  const [selectedCircuit, setSelectedCircuit] = useState<SchematicVariant>('HST_CSIR_RELE');
  const [simState, setSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<SchematicVariant>('HST_CSIR_RELE');

  const handleOpenModal = (variant: SchematicVariant) => {
    setSelectedCircuit(variant);
    setModalVariant(variant);
    setModalOpen(true);
  };

  const handleStartSimulation = () => {
    setSimState('starting');
    setTimeout(() => {
      setSimState('running');
    }, 2200);
  };

  const handleOverload = () => {
    setSimState('overload');
  };

  const handleReset = () => {
    setSimState('idle');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
      {/* Maximized Modal for Deep Interactive Simulation & Real Bornes Wiring */}
      <StartingSystemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialVariant={modalVariant}
      />

      {/* Dynamic Simulation Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-tiny font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Simulación Dinámica:
          </span>
          <button
            type="button"
            onClick={handleStartSimulation}
            className="px-2.5 py-1 rounded text-tiny font-bold bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Arrancar</span>
          </button>
          <button
            type="button"
            onClick={handleOverload}
            className="px-2.5 py-1 rounded text-tiny font-bold bg-rose-600/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-600/25 transition-colors flex items-center gap-1 cursor-pointer"
            title="Disparo del protector bimetálico Klixon por sobreintensidad o alta temperatura"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Corte Klixon</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Restablecer a reposo"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenModal(selectedCircuit)}
            className="px-2.5 py-1 rounded text-tiny font-bold bg-slate-800 text-white dark:bg-slate-200 dark:text-black hover:bg-slate-700 dark:hover:bg-white transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            title="Abrir ventana modal para simular conexiones"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Ventana Modal de Conexión</span>
          </button>

          <div className="flex items-center gap-1 text-tiny font-mono">
            <span className="text-slate-500 hidden sm:inline">Estado:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                simState === 'idle'
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  : simState === 'starting'
                  ? 'bg-amber-400 text-black animate-pulse'
                  : simState === 'running'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {simState === 'idle' && '⚪ REPOSO'}
              {simState === 'starting' && '⚡ ARRANQUE (PICO)'}
              {simState === 'running' && '🟢 MARCHA NOMINAL'}
              {simState === 'overload' && '🔴 KLIXON ABIERTO'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN HST SCHEMATIC SHEET CONTAINER (Replicating User's Attached Technical Sheet) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#070b13] border-2 border-cyan-500/70 shadow-lg space-y-6">
        
        {/* TITLE HEADER */}
        <div className="text-center pb-2 border-b border-cyan-200 dark:border-cyan-900/50">
          <h2 className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-wide uppercase">
            HST (ALTO PAR DE ARRANQUE)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">
            Esquemas para compresores comerciales con válvula de expansión o capilar sin equilibrar. Incorporan condensador electrolítico de arranque desconectable.
          </p>
        </div>

        {/* 1. ROW 1: CSR (CAPACITOR STAR RUN) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          {/* Side Indicator CSR */}
          <div className="md:col-span-2 flex md:flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center md:flex-col gap-2">
              <div className="w-1.5 h-8 md:w-8 md:h-1.5 bg-emerald-500 rounded-full" />
              <div className="text-center">
                <span className="block text-xl font-black text-rose-600 dark:text-rose-500 leading-none">
                  CSR
                </span>
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight uppercase leading-tight">
                  CAPACITOR STAR RUN
                </span>
              </div>
            </div>
          </div>

          {/* CSR - Relé de arranque (Left) */}
          <div
            onClick={() => setSelectedCircuit('HST_CSR_RELE')}
            className={`md:col-span-5 relative p-3 rounded-xl border transition-all cursor-pointer group ${
              selectedCircuit === 'HST_CSR_RELE'
                ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-950/20 shadow-md ring-1 ring-sky-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                CSR con Relé de arranque
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal('HST_CSR_RELE');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Simular Conexión</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#0a0f1d] rounded-lg p-2 border border-slate-200 dark:border-slate-800">
              <IntuitiveSchematicDiagram
                variant="HST_CSR_RELE"
                simState={selectedCircuit === 'HST_CSR_RELE' ? simState : 'idle'}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Cond. Arranque + Relé</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Sin cond. marcha</span>
            </div>
          </div>

          {/* CSR - PTC (Right) */}
          <div
            onClick={() => setSelectedCircuit('HST_CSR_PTC')}
            className={`md:col-span-5 relative p-3 rounded-xl border transition-all cursor-pointer group ${
              selectedCircuit === 'HST_CSR_PTC'
                ? 'border-sky-500 bg-sky-500/5 dark:bg-sky-950/20 shadow-md ring-1 ring-sky-500'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                CSR con PTC
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenModal('HST_CSR_PTC');
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Simular Conexión</span>
              </button>
            </div>

            <div className="bg-white dark:bg-[#0a0f1d] rounded-lg p-2 border border-slate-200 dark:border-slate-800">
              <IntuitiveSchematicDiagram
                variant="HST_CSR_PTC"
                simState={selectedCircuit === 'HST_CSR_PTC' ? simState : 'idle'}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Cond. Arranque + PTC</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Estado Sólido</span>
            </div>
          </div>
        </div>

        {/* 2. ROW 2: CSIR (CAPACITOR STAR INDUCCIÓN RUN) - IN RED FRAME AS IN USER IMAGE */}
        <div className="relative p-3.5 sm:p-4 rounded-xl border-2 border-red-500 bg-red-50/20 dark:bg-red-950/15 shadow-sm">
          {/* Highlight Badge */}
          <div className="absolute -top-3 left-4 bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            CSIR (Doble Condensador: Arranque + Marcha)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch mt-1">
            {/* Side Indicator CSIR */}
            <div className="md:col-span-2 flex md:flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-[#0d1424] border border-red-200 dark:border-red-900/60 shadow-sm">
              <div className="flex items-center md:flex-col gap-2">
                <div className="w-1.5 h-8 md:w-8 md:h-1.5 bg-emerald-500 rounded-full" />
                <div className="text-center">
                  <span className="block text-xl font-black text-rose-600 dark:text-rose-500 leading-none">
                    CSIR
                  </span>
                  <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight uppercase leading-tight">
                    CAPACITOR STAR INDUCCIÓN RUN
                  </span>
                </div>
              </div>
            </div>

            {/* CSIR - Relé de arranque (Left) */}
            <div
              onClick={() => setSelectedCircuit('HST_CSIR_RELE')}
              className={`md:col-span-5 relative p-3 rounded-xl border transition-all cursor-pointer group ${
                selectedCircuit === 'HST_CSIR_RELE'
                  ? 'border-red-500 bg-white dark:bg-[#0d1322] shadow-md ring-1 ring-red-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white/90 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  CSIR con Relé de arranque
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('HST_CSIR_RELE');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Simular Conexión</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#0a0f1d] rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                <IntuitiveSchematicDiagram
                  variant="HST_CSIR_RELE"
                  simState={selectedCircuit === 'HST_CSIR_RELE' ? simState : 'idle'}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="text-blue-600 dark:text-blue-400 font-bold">+ Condensador Marcha</span>
                <span className="text-red-600 dark:text-red-400 font-bold">Relé Amperimétrico</span>
              </div>
            </div>

            {/* CSIR - PTC (Right) */}
            <div
              onClick={() => setSelectedCircuit('HST_CSIR_PTC')}
              className={`md:col-span-5 relative p-3 rounded-xl border transition-all cursor-pointer group ${
                selectedCircuit === 'HST_CSIR_PTC'
                  ? 'border-red-500 bg-white dark:bg-[#0d1322] shadow-md ring-1 ring-red-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 bg-white/90 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  CSIR con PTC
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal('HST_CSIR_PTC');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Simular Conexión</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#0a0f1d] rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                <IntuitiveSchematicDiagram
                  variant="HST_CSIR_PTC"
                  simState={selectedCircuit === 'HST_CSIR_PTC' ? simState : 'idle'}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span className="text-blue-600 dark:text-blue-400 font-bold">+ Condensador Marcha</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">PTC Cerámica</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM COLUMN HEADERS (Matching User's Attached Image) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 pt-2">
          <div className="hidden md:block md:col-span-2" />
          <div className="md:col-span-5 text-center">
            <h4 className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 inline-block pb-1 tracking-wider uppercase">
              RELÉ DE ARRANQUE
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Desconexión electromecánica por caída de intensidad en la bobina de marcha.
            </p>
          </div>
          <div className="md:col-span-5 text-center">
            <h4 className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 inline-block pb-1 tracking-wider uppercase">
              PTC
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Desconexión térmica de estado sólido por aumento exponencial de resistencia.
            </p>
          </div>
        </div>

        {/* 4. TECHNICAL LEGEND & SYMBOLOGY BAR */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span><strong>C1 / C2:</strong> Bornes de Alimentación 230V</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span><strong>Cond. Arranque:</strong> Electrolítico (60-160 µF)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span><strong>Cond. Marcha:</strong> Polipropileno continuo (10-30 µF)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span><strong>Protector:</strong> Klixon bimetálico térmico</span>
          </div>
        </div>
      </div>
    </div>
  );
};
