import React, { useState } from 'react';
import { SchematicVariant } from './IntuitiveSchematicDiagram';
import { Zap, Sparkles, Layers, Cpu, Maximize2, Play, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StartingSystemModal } from './StartingSystemModal';

interface StartingSystemsControlsPanelProps {
  selectedCircuit: SchematicVariant;
  onSelectCircuit: (variant: SchematicVariant) => void;
  simState: 'idle' | 'starting' | 'running' | 'overload';
  onStartSimulation: () => void;
  onOverload: () => void;
  onReset: () => void;
  onOpenModal: (variant: SchematicVariant) => void;
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
    desconexion: 'Relé Amperimétrico (caída por gravedad)',
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
    desconexion: 'Relé Amperimétrico electromecánico',
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
            onClick={() => setActiveCategory('COMPONENTS')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-tiny flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
          {/* Klixon */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>Protector Térmico (Klixon)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              En serie con el borne <strong>C (Común)</strong>. Contiene un calefactor resistivo y un disco bimetálico. Corta por exceso de amperios o alta temperatura de carcasa.
            </p>
          </div>

          {/* Relé de Arranque */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span>Relé Amperimétrico</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Bobina en serie con el borne <strong>R (Marcha)</strong>. El pico de corriente de arranque levanta el émbolo cerrando el contacto hacia <strong>S</strong>; al caer la corriente cae por gravedad.
            </p>
          </div>

          {/* PTC */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Termistor PTC</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Semiconductor cerámico. En frío (15-25 Ω) conduce al borne <strong>S</strong>. Al calentarse por corriente sube a &gt;10 kΩ bloqueando el paso de forma estática sin piezas móviles.
            </p>
          </div>

          {/* Condensadores */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Condensadores (Arranque vs Marcha)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Arranque (Electrolítico):</strong> Gran capacidad (40-120 µF) para servicio breve (1-3 seg).<br />
              <strong>Marcha (Polipropileno):</strong> Menor capacidad (2-35 µF) pero trabajo 100% continuo (450V).
            </p>
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
