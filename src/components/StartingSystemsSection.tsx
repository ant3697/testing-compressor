import React, { useState } from 'react';
import { OfficialLSTSchematicSheet } from './OfficialLSTSchematicSheet';
import { OfficialHSTSchematicSheet } from './OfficialHSTSchematicSheet';
import { DirectStartSimulator } from './DirectStartSimulator';
import { Zap, Cpu, Layers, PlayCircle } from 'lucide-react';

export const StartingSystemsSection: React.FC = () => {
  const [activeView, setActiveView] = useState<'hst_sheet' | 'lst_sheet' | 'direct_start' | 'components'>('hst_sheet');

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
            Esquemas oficiales de desconexión auxiliar (LST/HST) y simulación de arranque directo de taller.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 text-tiny font-mono flex-wrap">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-small">
          {/* Klixon */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
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
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
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
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white text-small">
                Termistor PTC (Positive Temperature Coefficient)
              </h5>
              <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Pastilla cerámica semiconductora. En frío presenta baja resistencia (15-25 Ω), alimentando el devanado de arranque <strong>S</strong>. La corriente la calienta rápidamente (&gt;120 °C), aumentando su resistencia a &gt;10.000 Ω y cortando el paso.
              </p>
            </div>
          </div>

          {/* Condensador de Marcha */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0">
              <span className="font-bold font-mono text-tiny">µF</span>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white text-small">
                Condensador de Marcha Permanente (RSCR)
              </h5>
              <p className="text-tiny text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Conectado permanentemente en puente entre <strong>S</strong> y <strong>R</strong>. En sistemas RSCR, tras la desconexión del relé o PTC, este condensador mantiene una corriente desfasada continua en el devanado auxiliar, optimizando el consumo (cos φ).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
