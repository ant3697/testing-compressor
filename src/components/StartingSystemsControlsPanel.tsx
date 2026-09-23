import React, { useState } from 'react';
import { SchematicVariant } from './IntuitiveSchematicDiagram';
import { Zap, Sparkles, Layers, Cpu, Maximize2, Play, AlertTriangle, RefreshCw, Square, CheckCircle2, BookOpen } from 'lucide-react';
import { StartingSystemModal } from './StartingSystemModal';

interface StartingSystemsControlsPanelProps {
  selectedCircuit: SchematicVariant;
  onSelectCircuit: (variant: SchematicVariant) => void;
  simState: 'idle' | 'starting' | 'running' | 'overload';
  onStartSimulation: () => void;
  onOverload: () => void;
  onReset: () => void;
  onOpenModal: (variant: SchematicVariant) => void;
  onOpenComponentsModal?: (tab?: 'all' | 'ptc' | 'klixon' | 'rele' | 'capacitors' | 'potencial') => void;
}

interface CircuitCardData {
  id: SchematicVariant;
  name: string;
  category: 'HST' | 'LST';
  condensador: string;
  desconexion: string;
  par: string;
  detalles: string;
  aplicaciones: string;
  capacidadRecomendada: string;
}

const ALL_CIRCUITS: CircuitCardData[] = [
  // HST
  {
    id: 'HST_CSR_RELE',
    name: 'CSR con Relé de Arranque',
    category: 'HST',
    condensador: 'Cond. Electrolítico de Arranque',
    desconexion: 'Relé de Intensidad (caída por gravedad)',
    par: 'Alto Par (HST)',
    detalles: 'El condensador de arranque genera un desfase de 90° para alto par. Al acelerar, la corriente de la bobina de marcha desciende y el contacto del relé abre desconectando el condensador.',
    aplicaciones: 'Compresores comerciales con capilar sin despresurizar o válvulas de expansión.',
    capacidadRecomendada: '40 - 100 µF (330V AC intermitente)',
  },
  {
    id: 'HST_CSR_PTC',
    name: 'CSR con Termistor PTC',
    category: 'HST',
    condensador: 'Cond. Electrolítico de Arranque',
    desconexion: 'Pastilla Cerámica PTC (Estado Sólido)',
    par: 'Alto Par (HST)',
    detalles: 'La pastilla PTC fría alimenta el condensador de arranque. El paso de corriente la calienta rápidamente (&gt;120 °C) aumentando su resistencia a &gt;10 kΩ y bloqueando el paso de corriente.',
    aplicaciones: 'Enfriadores de botellas y vitrinas comerciales con ecualización de presiones.',
    capacidadRecomendada: '50 - 80 µF (250V AC)',
  },
  {
    id: 'HST_CSIR_RELE',
    name: 'CSIR con Relé (Doble Condensador)',
    category: 'HST',
    condensador: 'Cond. Arranque + Cond. Marcha Permanente',
    desconexion: 'Relé de Arranque',
    par: 'Muy Alto Par (HST) + Alto Rendimiento',
    detalles: 'Combina el gran par de arranque del condensador electrolítico con la eficiencia energética del condensador permanente de marcha de polipropileno.',
    aplicaciones: 'Cámaras frigoríficas de congelación, bombas de calor y equipos comerciales exigentes.',
    capacidadRecomendada: 'Arranque: 60-120 µF • Marcha: 10-25 µF',
  },
  {
    id: 'HST_CSIR_PTC',
    name: 'CSIR con PTC (Doble Condensador)',
    category: 'HST',
    condensador: 'Cond. Arranque + Cond. Marcha',
    desconexion: 'PTC de Estado Sólido',
    par: 'Alto Par + Rendimiento Permanente',
    detalles: 'Al calentar el PTC, el condensador de arranque queda aislado pero el condensador permanente sigue conectado alimentando la fase auxiliar con desfase continuo.',
    aplicaciones: 'Equipos comerciales silenciosos sin piezas mecánicas móviles.',
    capacidadRecomendada: 'Arranque: 40-80 µF • Marcha: 8-16 µF',
  },
  // LST
  {
    id: 'RSIR_RELE',
    name: 'RSIR con Relé de Intensidad',
    category: 'LST',
    condensador: 'Sin Condensador',
    desconexion: 'Relé de Intensidad electromecánico',
    par: 'Bajo Par (LST)',
    detalles: 'El desfase se logra por la diferencia de inductancia y resistencia entre hilos (marcha hilo grueso, arranque hilo fino). Tras el arranque el relé abre.',
    aplicaciones: 'Neveras domésticas y arcones pequeños con tubo capilar que ecualiza presiones.',
    capacidadRecomendada: 'No utiliza condensador',
  },
  {
    id: 'RSIR_PTC',
    name: 'RSIR con Termistor PTC',
    category: 'LST',
    condensador: 'Sin Condensador',
    desconexion: 'PTC Cerámica',
    par: 'Bajo Par (LST)',
    detalles: 'Sistema universal en refrigeración doméstica moderna. Económico, sin contactos que puedan foguearse.',
    aplicaciones: 'Frigoríficos y congeladores domésticos estándar.',
    capacidadRecomendada: 'No utiliza condensador',
  },
  {
    id: 'RSCR_RELE',
    name: 'PSC (Condensador Permanente)',
    category: 'LST',
    condensador: 'Cond. Permanente de Marcha (Polipropileno)',
    desconexion: 'Sin desconexión (permanente)',
    par: 'Bajo Par (LST) + Máxima Eficiencia (cos φ ≈ 1)',
    detalles: 'El condensador permanece siempre en circuito entre R y S, reduciendo el consumo eléctrico y las pérdidas térmicas.',
    aplicaciones: 'Aires acondicionados, climatizadores y compresores rotativos.',
    capacidadRecomendada: '15 - 45 µF (400/450V AC continuo)',
  },
  {
    id: 'RSCR_PTC',
    name: 'RSCR con PTC y Condensador',
    category: 'LST',
    condensador: 'Cond. Marcha Permanente',
    desconexion: 'PTC en paralelo',
    par: 'Bajo Par Asistido',
    detalles: 'PTC para el impulso inicial y condensador permanente continuo.',
    aplicaciones: 'Frigoríficos domésticos de alta eficiencia energética (Clase A++/A+++).',
    capacidadRecomendada: '3 - 6 µF (450V)',
  },
];

export const StartingSystemsControlsPanel: React.FC<StartingSystemsControlsPanelProps> = ({
  selectedCircuit,
  onSelectCircuit,
  simState,
  onStartSimulation,
  onOverload,
  onReset,
  onOpenModal,
  onOpenComponentsModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<'HST' | 'LST' | 'COMPONENTS'>('HST');

  const filteredCircuits = ALL_CIRCUITS.filter(
    (c) => activeCategory === 'COMPONENTS' || c.category === activeCategory
  );

  const currentCircuitData = ALL_CIRCUITS.find((c) => c.id === selectedCircuit) || ALL_CIRCUITS[0];

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between font-sans">
      {/* 1. Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Selección de Esquema de Arranque</span>
          </h4>
          <p className="text-tiny text-slate-500 dark:text-slate-400">
            Haz clic en cualquier sistema para mostrar su esquema técnico en la ventana izquierda.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 text-tiny font-mono shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('LST')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
              activeCategory === 'LST'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            LST (Bajo Par)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('HST')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
              activeCategory === 'HST'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            HST (Alto Par)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('COMPONENTS');
              onOpenComponentsModal?.('all');
            }}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
              activeCategory === 'COMPONENTS'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Componentes
          </button>
        </div>
      </div>

      {/* Quick Simulation Controller Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 rounded-xl text-tiny font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold hidden sm:inline text-[11px]">Prueba:</span>
          <button
            type="button"
            onClick={onStartSimulation}
            className="px-2.5 py-1 rounded bg-amber-400 text-black hover:bg-amber-300 font-bold flex items-center gap-1 cursor-pointer shadow-sm text-[11px]"
            title="Arrancar simulación del esquema"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Arrancar</span>
          </button>
          <button
            type="button"
            onClick={onOverload}
            className="px-2 py-1 rounded bg-rose-500/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
            title="Simular sobrecarga térmica (Klixon)"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Klixon</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2 py-1 rounded text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
            title="Parar y restablecer simulación a reposo"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Parar</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1.5 ${
              simState === 'idle'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                : simState === 'starting'
                ? 'bg-amber-400 text-black animate-pulse shadow-sm'
                : simState === 'running'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-rose-500 text-white'
            }`}
          >
            {simState === 'idle' && '⚪ REPOSO'}
            {simState === 'starting' && '⚡ ARRANQUE'}
            {simState === 'running' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>🟢 EN MARCHA • 🔊 50 Hz</span>
              </>
            )}
            {simState === 'overload' && '🔴 KLIXON ABIERTO'}
          </span>
        </div>
      </div>

      {/* 2. Circuit Selector Grid / List */}
      {activeCategory !== 'COMPONENTS' ? (
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-tiny">
            {filteredCircuits.map((circuit) => {
              const isSelected = selectedCircuit === circuit.id;
              return (
                <div
                  key={circuit.id}
                  onClick={() => onSelectCircuit(circuit.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/25 ring-1 ring-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0d16] hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span className="truncate">{circuit.name}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                        circuit.category === 'HST'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {circuit.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 mt-1">
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Desconexión:</strong> {circuit.desconexion}
                    </div>
                    <div>
                      <strong className="text-slate-700 dark:text-slate-300">Condensador:</strong> {circuit.condensador}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {isSelected ? '✓ Activo en ventana técnica' : 'Clic para ver esquema'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCircuit(circuit.id);
                        onOpenModal(circuit.id);
                      }}
                      className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>Conectar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* COMPONENTS TECHNICAL SHEET */
        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
          {/* Banner to open full information window */}
          <button
            type="button"
            onClick={() => onOpenComponentsModal?.('all')}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500/20 via-amber-500/15 to-sky-500/20 border border-sky-400/50 hover:border-amber-400 text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Abrir Ventana de Información Completa
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Incluye tiempos de rearme PTC (3-5 min), Klixon, Relé y Condensadores
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-400 text-black shrink-0 group-hover:scale-105 transition-transform">
              Ver Guía →
            </span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-tiny">
            {/* PTC con tiempo de rearme (3-5 min) */}
            <div
              onClick={() => onOpenComponentsModal?.('ptc')}
              className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-300 dark:border-sky-800/80 space-y-1 cursor-pointer hover:border-sky-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>Termistor PTC</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                  3 a 5 min
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Cerámica BaTiO3. Conduce en frío (15-25 Ω) hacia S y sube a &gt;10 kΩ en marcha. <strong>Requiere 3-5 min para enfriarse (&lt;70°C)</strong> antes de un nuevo arranque.
              </p>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 pt-1">
                <span>Ver análisis técnico de rearme →</span>
              </div>
            </div>

            {/* Klixon */}
            <div
              onClick={() => onOpenComponentsModal?.('klixon')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1 cursor-pointer hover:border-rose-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Cpu className="w-3.5 h-3.5 text-rose-500" />
                <span>Protector Térmico (Klixon)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                En serie con el borne <strong>C (Común)</strong>. Resistencia calefactora y disco bimetálico. Corta por exceso de amperios (LRA) o alta temperatura de carcasa.
              </p>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 pt-1">
                <span>Ver detalles de funcionamiento →</span>
              </div>
            </div>

            {/* Relé de Arranque */}
            <div
              onClick={() => onOpenComponentsModal?.('rele')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Relé de Intensidad</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Bobina en serie con el borne <strong>R (Marcha)</strong>. El pico inrush levanta el émbolo cerrando el contacto hacia <strong>S</strong>; cae por gravedad al régimen nominal.
              </p>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pt-1">
                <span>Ver detalles y posición vertical →</span>
              </div>
            </div>

            {/* Condensadores */}
            <div
              onClick={() => onOpenComponentsModal?.('capacitors')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1 cursor-pointer hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Condensadores</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Arranque (Electrolítico):</strong> 40-160 µF, servicio breve (&lt;3 s).<br />
                <strong>Marcha (Polipropileno):</strong> 2-35 µF / 450V, servicio continuo 100%.
              </p>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 pt-1">
                <span>Comparativa y diagnóstico →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Selected Circuit Technical Breakdown Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 mt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-tiny font-mono font-bold text-slate-500 uppercase tracking-wider">
              Detalles Técnicos: {currentCircuitData.name}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
            {currentCircuitData.par}
          </span>
        </div>

        <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
          {currentCircuitData.detalles}
        </p>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block">Capacidad Típica:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentCircuitData.capacidadRecomendada}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Aplicación Habitual:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentCircuitData.aplicaciones}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
