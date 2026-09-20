import React, { useState } from 'react';
import { IntuitiveSchematicDiagram, SchematicVariant } from './IntuitiveSchematicDiagram';
import { Play, AlertTriangle, RefreshCw, Info, CheckCircle2, Zap, Maximize2 } from 'lucide-react';
import { StartingSystemModal } from './StartingSystemModal';

export const OfficialLSTSchematicSheet: React.FC = () => {
  const [selectedCircuit, setSelectedCircuit] = useState<SchematicVariant>('RSIR_RELE');
  const [simState, setSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<SchematicVariant>('RSIR_RELE');

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
      {/* Maximized Modal */}
      <StartingSystemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialVariant={modalVariant}
      />

      {/* Simulation Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800">
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
            title="Disparo del protector bimetálico Klixon por exceso de corriente o calor"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Corte Klixon</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
            title="Restablecer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenModal(selectedCircuit)}
            className="px-2.5 py-1 rounded text-tiny font-bold bg-slate-800 text-white dark:bg-slate-200 dark:text-black hover:bg-slate-700 dark:hover:bg-white transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            title="Abrir el esquema seleccionado en pantalla maximizada"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Maximizar Esquema</span>
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
              {simState === 'starting' && '🟡 ARRANQUE'}
              {simState === 'running' && '🟢 RÉGIMEN'}
              {simState === 'overload' && '🔴 KLIXON'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Official Sheet Layout (Faithfully reproducing user image) */}
      <div className="bg-white dark:bg-[#0b0f19] p-3 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
        {/* Main Document Headers */}
        <div className="text-center mb-3 relative">
          <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#9333ea] uppercase">
            DESCONEXIÓN BOBINA ARRANQUE
          </h2>
          <h3 className="text-sm sm:text-base font-extrabold tracking-wide text-[#0284c7] uppercase mt-0.5">
            LST (BAJO PAR DE ARRANQUE)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            💡 Haz clic en cualquier esquema para <strong className="text-amber-500">maximizarlo a pantalla completa</strong> y ver su análisis detallado.
          </p>
        </div>

        {/* CYAN OUTER CONTAINER FOR LST */}
        <div className="rounded-2xl border-2 border-[#0284c7] p-2.5 sm:p-4 space-y-4 bg-slate-50/50 dark:bg-[#070a12]/50">
          {/* ================= ROW 1: RSIR ================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left Title Label (RSIR) */}
            <div className="md:col-span-3 flex md:flex-col justify-start items-start border-l-4 border-emerald-500 pl-3 py-1">
              <div className="text-lg sm:text-xl font-black text-[#dc2626] leading-tight">
                RSIR
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-[#dc2626] uppercase tracking-tight mt-0.5">
                RESISTANT STAR INDUCCIÓN RUN
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 hidden md:block">
                Arranque resistivo por desfasaje angular. Sin condensador.
              </div>
            </div>

            {/* Schematics (9 cols: 2 schematics side by side) */}
            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Circuit 1: RSIR con Relé de arranque */}
              <div
                onClick={() => handleOpenModal('RSIR_RELE')}
                className={`group relative p-2.5 rounded-xl bg-white dark:bg-[#0f1422] border transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-amber-400 ${
                  selectedCircuit === 'RSIR_RELE'
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Con Relé de arranque
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-colors flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Maximizar</span>
                  </span>
                </div>
                <IntuitiveSchematicDiagram
                  variant="RSIR_RELE"
                  simState={selectedCircuit === 'RSIR_RELE' ? simState : 'idle'}
                />
              </div>

              {/* Circuit 2: RSIR con PTC */}
              <div
                onClick={() => handleOpenModal('RSIR_PTC')}
                className={`group relative p-2.5 rounded-xl bg-white dark:bg-[#0f1422] border transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-amber-400 ${
                  selectedCircuit === 'RSIR_PTC'
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Con PTC (Termistor)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-colors flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Maximizar</span>
                  </span>
                </div>
                <IntuitiveSchematicDiagram
                  variant="RSIR_PTC"
                  simState={selectedCircuit === 'RSIR_PTC' ? simState : 'idle'}
                />
              </div>
            </div>
          </div>

          {/* ================= ROW 2: RSCR (Enclosed in Red Border) ================= */}
          <div className="rounded-xl border-2 border-[#dc2626] p-2.5 sm:p-3.5 bg-white/60 dark:bg-[#0b101c]/60">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Left Title Label (RSCR) */}
              <div className="md:col-span-3 flex md:flex-col justify-start items-start border-l-4 border-emerald-500 pl-3 py-1">
                <div className="text-lg sm:text-xl font-black text-[#dc2626] leading-tight">
                  RSCR
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#dc2626] uppercase tracking-tight mt-0.5">
                  RESISTANT STAR CAPACITOR RUN
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 hidden md:block">
                  Con condensador de marcha permanente conectado entre bornes S y R.
                </div>
              </div>

              {/* Schematics (9 cols: 2 schematics side by side) */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Circuit 3: RSCR con Relé de arranque */}
                <div
                  onClick={() => handleOpenModal('RSCR_RELE')}
                  className={`group relative p-2.5 rounded-xl bg-white dark:bg-[#0f1422] border transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-amber-400 ${
                    selectedCircuit === 'RSCR_RELE'
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Con Relé + Cond. Marcha
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-colors flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Maximizar</span>
                    </span>
                  </div>
                  <IntuitiveSchematicDiagram
                    variant="RSCR_RELE"
                    simState={selectedCircuit === 'RSCR_RELE' ? simState : 'idle'}
                  />
                </div>

                {/* Circuit 4: RSCR con PTC */}
                <div
                  onClick={() => handleOpenModal('RSCR_PTC')}
                  className={`group relative p-2.5 rounded-xl bg-white dark:bg-[#0f1422] border transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-amber-400 ${
                    selectedCircuit === 'RSCR_PTC'
                      ? 'border-amber-400 ring-2 ring-amber-400/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                    <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Con PTC + Cond. Marcha
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 group-hover:bg-amber-400 group-hover:text-black transition-colors flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Maximizar</span>
                    </span>
                  </div>
                  <IntuitiveSchematicDiagram
                    variant="RSCR_PTC"
                    simState={selectedCircuit === 'RSCR_PTC' ? simState : 'idle'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Explanation Guide Footer */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-tiny">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              1. Protector de Motor (C)
            </span>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
              En serie con el borne <strong>C (Común)</strong>. Contiene un disco bimetálico y una resistencia calefactora (Im). Si la temperatura o el consumo superan el límite, el bimetal se curva y corta toda la alimentación.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              2. Relé vs. PTC (Borne S)
            </span>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
              <strong>Relé</strong>: la bobina en serie con R atrae el contacto al arrancar; al caer la corriente, el contacto cae y desconecta S.<br />
              <strong>PTC</strong>: conduce en frío; tras 1-2 s se calienta a &gt;120°C y su resistencia se dispara a &gt;10 kΩ.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              3. Condensador de Marcha (RSCR)
            </span>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
              Conectado en puente permanente entre <strong>S (Arranque)</strong> y <strong>R (Marcha)</strong>. Cuando la bobina de arranque se desconecta de C2, este condensador mantiene una corriente desfasada continua que aumenta el rendimiento y factor de potencia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
