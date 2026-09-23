import React, { useState } from 'react';
import { OfficialLSTSchematicSheet } from './OfficialLSTSchematicSheet';
import { OfficialHSTSchematicSheet } from './OfficialHSTSchematicSheet';
import { PotentialRelaySchematicSheet } from './PotentialRelaySchematicSheet';
import { DirectStartSimulator } from './DirectStartSimulator';
import { Zap, Cpu, Layers, PlayCircle, BookOpen, Radio } from 'lucide-react';
import { ComponentsInfoModal, ComponentCategoryTab } from './ComponentsInfoModal';

export const StartingSystemsSection: React.FC = () => {
  const [activeView, setActiveView] = useState<'hst_sheet' | 'lst_sheet' | 'potential_relay' | 'direct_start' | 'components'>('potential_relay');
  const [isComponentsModalOpen, setIsComponentsModalOpen] = useState<boolean>(false);
  const [componentsModalTab, setComponentsModalTab] = useState<ComponentCategoryTab>('all');

  return (
    <div className="space-y-3 font-sans">
      {/* Top Header & View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-small font-bold text-slate-900 dark:text-white">
              Sistemas de Arranque y Comprobación en Banco
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Esquemas oficiales de desconexión auxiliar (LST/HST), Relés de Potencial (5-2-1-4-6) y arranque directo.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 text-tiny font-mono flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('potential_relay')}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              activeView === 'potential_relay'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Relés de Potencial (5-2-1-4-6)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('hst_sheet')}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
              activeView === 'hst_sheet'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            HST (Alto Par)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('lst_sheet')}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
              activeView === 'lst_sheet'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            LST (Bajo Par)
          </button>
          <button
            type="button"
            onClick={() => setActiveView('direct_start')}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-bold flex items-center gap-1 ${
              activeView === 'direct_start'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Arranque Directo (Taller)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('components')}
            className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
              activeView === 'components'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Componentes
          </button>
        </div>
      </div>

      {/* VIEW: POTENTIAL RELAY SCHEMATICS (EXACT FROM USER'S IMAGE) */}
      {activeView === 'potential_relay' && (
        <div>
          <PotentialRelaySchematicSheet />
        </div>
      )}

      {/* VIEW 1: EXACT HST SCHEMATIC SHEET FROM USER'S IMAGE */}
      {activeView === 'hst_sheet' && (
        <div>
          <OfficialHSTSchematicSheet />
        </div>
      )}

      {/* VIEW 2: EXACT LST SCHEMATIC SHEET */}
      {activeView === 'lst_sheet' && (
        <div>
          <OfficialLSTSchematicSheet />
        </div>
      )}

      {/* VIEW 3: DIRECT START WORKSHOP BENCH SIMULATOR */}
      {activeView === 'direct_start' && (
        <div>
          <DirectStartSimulator onNavigateToWiring={() => setActiveView('hst_sheet')} />
        </div>
      )}

      {/* VIEW 3: COMPONENT REFERENCE & TECHNICAL BREAKDOWN */}
      {activeView === 'components' && (
        <div className="space-y-3">
          {/* Action button to open full technical window */}
          <button
            type="button"
            onClick={() => {
              setComponentsModalTab('all');
              setIsComponentsModalOpen(true);
            }}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-sky-500/20 via-amber-500/15 to-sky-500/20 border border-sky-400/50 hover:border-amber-400 text-left transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-sky-500/25 text-sky-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Abrir Ventana de Información Técnica Completa
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Incluye tiempos de rearme PTC (3-5 min), Klixon, Relé de intensidad, Relé de potencial y Condensadores
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-400 text-black shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              Ver Guía Técnica →
            </span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-small">
            {/* Klixon */}
            <div
              onClick={() => {
                setComponentsModalTab('klixon');
                setIsComponentsModalOpen(true);
              }}
              className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3 cursor-pointer hover:border-rose-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-500 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-small">
                  Protector de Motor (Klixon)
                </h5>
                <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Va montado en serie con el <strong>borne C (Común)</strong>. Contiene una resistencia calefactora (<code className="font-mono text-amber-500">Im</code>) y un disco bimetálico calibrado. Se abre ante sobrecalentamiento de la carcasa o consumo excesivo de amperios.
                </p>
              </div>
            </div>

            {/* Relé de Arranque */}
            <div
              onClick={() => {
                setComponentsModalTab('rele');
                setIsComponentsModalOpen(true);
              }}
              className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3 cursor-pointer hover:border-amber-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-small">
                  Relé de Intensidad (Arranque)
                </h5>
                <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Su bobina está en serie con la bobina de marcha (<strong>R</strong>). El pico de corriente inicial de arranque atrae el émbolo cerrando el contacto N.A. hacia el borne <strong>S</strong>. Al acelerar el motor, la corriente desciende y el émbolo cae por gravedad.
                </p>
              </div>
            </div>

            {/* PTC */}
            <div
              onClick={() => {
                setComponentsModalTab('ptc');
                setIsComponentsModalOpen(true);
              }}
              className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-[#0c1629] border border-sky-300 dark:border-sky-800/80 flex items-start gap-3 cursor-pointer hover:border-sky-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-slate-900 dark:text-white text-small">
                    Termistor PTC (Rearme 3-5 min)
                  </h5>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                    3 a 5 min
                  </span>
                </div>
                <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Pastilla cerámica semiconductora. En frío presenta baja resistencia (15-25 Ω), alimentando el devanado de arranque <strong>S</strong>. En marcha sube a &gt;10.000 Ω. <strong>Requiere de 3 a 5 min para rearmarse.</strong>
                </p>
              </div>
            </div>

            {/* Condensador de Marcha */}
            <div
              onClick={() => {
                setComponentsModalTab('capacitors');
                setIsComponentsModalOpen(true);
              }}
              className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3 cursor-pointer hover:border-indigo-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0">
                <span className="font-bold font-mono text-tiny">µF</span>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-small">
                  Condensador de Marcha Permanente (RSCR)
                </h5>
                <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Conectado permanentemente en puente entre <strong>S</strong> y <strong>R</strong>. Mantiene una corriente desfasada continua en el devanado auxiliar, optimizando el factor de potencia (cos φ) y reduciendo el consumo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guía Técnica de Componentes y PTC */}
      <ComponentsInfoModal
        isOpen={isComponentsModalOpen}
        onClose={() => setIsComponentsModalOpen(false)}
        initialTab={componentsModalTab}
      />
    </div>
  );
};
