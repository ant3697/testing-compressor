import React from 'react';
import {
  UseMechanicalCompressionSimulatorReturn,
  COMPRESSION_PRESETS_DATA,
  CompressionPreset,
  RetentionBehavior
} from '../hooks/useMechanicalCompressionSimulator';
import {
  Wrench,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Gauge,
  Clock,
  ShieldAlert,
  Droplets,
  Eye,
  FileText
} from 'lucide-react';

interface MechanicalCompressionControlsPanelProps {
  simulator: UseMechanicalCompressionSimulatorReturn;
  averiasSubTab: 'electricas' | 'mecanico';
  onSelectSubTab: (tab: 'electricas' | 'mecanico') => void;
  onOpenReport?: () => void;
}

export const MechanicalCompressionControlsPanel: React.FC<MechanicalCompressionControlsPanelProps> = ({
  simulator,
  averiasSubTab,
  onSelectSubTab,
  onOpenReport,
}) => {
  const {
    selectedPreset,
    handleSelectPreset,
    maxPressureInput,
    setMaxPressureInput,
    retentionBehavior,
    setRetentionBehavior,
    retentionTimeSecInput,
    setRetentionTimeSecInput,
    currentPsi,
    maxBar,
    isCompressing,
    isMeasuringRetention,
    initialRetentionPsi,
    retentionElapsedSec,
    verdict,
    activeCaseInfo,
    startCompression,
    stopAndMeasureRetention,
    resetSimulation,
  } = simulator;

  const parsedMaxPsi = parseFloat(maxPressureInput) || 0;

  return (
    <div className="h-full flex flex-col justify-between font-secondary space-y-2.5 overflow-y-auto pr-0.5 custom-scrollbar select-none">
      {/* 1. Sub-Tab Switcher inside Averías section */}
      <div className="flex items-center justify-between gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => onSelectSubTab('electricas')}
          className={`flex-1 py-1.5 px-2 rounded-md font-mono text-tiny font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            averiasSubTab === 'electricas'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>1. Averías Eléctricas (Bobinados)</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSubTab('mecanico')}
          className={`flex-1 py-1.5 px-2 rounded-md font-mono text-tiny font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            averiasSubTab === 'mecanico'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>2. Válvulas Flapper y Compresión</span>
        </button>
      </div>

      {/* 2. Quick Preset Selection Cards */}
      <div className="space-y-1 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Casos Típicos de Rendimiento Mecánico:
          </span>
          <span className="text-[9.5px] font-mono text-slate-400">
            Presets Maestro Cifu
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(COMPRESSION_PRESETS_DATA) as (keyof typeof COMPRESSION_PRESETS_DATA)[]).map((key) => {
            const presetData = COMPRESSION_PRESETS_DATA[key];
            const isSelected = selectedPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0c101b] border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div>
                  <span
                    className="text-[10.5px] font-bold block leading-tight truncate"
                    style={{ color: presetData.color }}
                  >
                    {presetData.name}
                  </span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {presetData.shortDesc}
                  </span>
                </div>
                <span className="text-[8.5px] font-mono font-bold mt-1 text-slate-400">
                  Ref: {(presetData.targetPsi * 0.0689476).toFixed(1)} bar ({presetData.targetPsi} PSI)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Technician Testing Inputs: Maximum Pressure & Valve Retention */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-500" />
            Parámetros de la Prueba en Descarga:
          </span>
          <span className="text-[9.5px] font-mono text-sky-400 font-bold">
            {maxBar} Bar <span className="text-slate-400">({parsedMaxPsi} PSI)</span>
          </span>
        </div>

        {/* Input: Presión máxima alcanzada */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-tiny">
            <label className="text-slate-600 dark:text-slate-400 font-semibold">
              1. Presión máxima alcanzada:
            </label>
            <div className="flex items-center gap-1">
              <span className="font-mono text-tiny font-bold text-sky-400">{maxBar} bar</span>
              <span className="text-[10px] text-slate-500">/</span>
              <input
                type="number"
                min="0"
                max="500"
                step="5"
                value={maxPressureInput}
                onChange={(e) => setMaxPressureInput(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-tiny font-bold text-amber-500 text-right focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <span className="font-mono text-tiny text-slate-400">PSI</span>
            </div>
          </div>
          {/* Slider for smooth test changes */}
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={parsedMaxPsi}
            onChange={(e) => setMaxPressureInput(e.target.value)}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Input: Comportamiento de estanqueidad al corte (0V) */}
        <div className="space-y-1 pt-1">
          <label className="text-tiny text-slate-600 dark:text-slate-400 font-semibold block">
            2. Comportamiento y Retención de Válvulas al Corte (0V):
          </label>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setRetentionBehavior('holds')}
              className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                retentionBehavior === 'holds'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Estanco (&gt;30s)
            </button>
            <button
              type="button"
              onClick={() => setRetentionBehavior('slow_drop')}
              className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                retentionBehavior === 'slow_drop'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Fuga Lenta (Blow-by)
            </button>
            <button
              type="button"
              onClick={() => setRetentionBehavior('fast_drop')}
              className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                retentionBehavior === 'fast_drop'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Caída Rápida (&lt;2s)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Interactive Simulation Control Buttons */}
      <div className="space-y-1.5 shrink-0">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={startCompression}
            disabled={isCompressing}
            className={`py-2 px-2.5 rounded-lg font-mono text-tiny font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              isCompressing
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isCompressing ? 'COMPRIMIENDO...' : '1. ARRANCAR (TAPAR)'}</span>
          </button>

          <button
            type="button"
            onClick={stopAndMeasureRetention}
            disabled={!isCompressing && currentPsi === 0}
            className={`py-2 px-2.5 rounded-lg font-mono text-tiny font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm ${
              isMeasuringRetention
                ? 'bg-amber-500 text-black ring-2 ring-amber-400 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>2. CORTE (0V) Y RETENCIÓN</span>
          </button>
        </div>

        <button
          type="button"
          onClick={resetSimulation}
          className="w-full py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Purgar manómetro y restablecer aguja a 0 PSI</span>
        </button>
      </div>

      {/* 5. Official Mechanical Verdict Card (Dictamen Técnico) */}
      <div
        className={`p-2.5 rounded-xl border transition-all text-tiny shrink-0 ${
          verdict === 'OPTIMO'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
            : verdict === 'VALVULA_ROTA'
            ? 'bg-rose-500/15 border-rose-500 text-rose-950 dark:text-rose-200 shadow-sm'
            : verdict === 'DESGASTE'
            ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200'
            : 'bg-purple-500/15 border-purple-500 text-purple-950 dark:text-purple-200'
        }`}
      >
        <div className="flex items-start gap-2">
          {verdict === 'OPTIMO' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-black uppercase tracking-wide text-[11px]">
                {activeCaseInfo.title}
              </span>
              <span className="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded bg-black/30">
                {activeCaseInfo.badge}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Síntoma:</strong> {activeCaseInfo.symptomInSystem}
            </p>
            <p className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300">
              <strong>Diagnóstico:</strong> {activeCaseInfo.rootCause} — <em>{activeCaseInfo.recommendedAction}</em>
            </p>
          </div>
        </div>
      </div>

      {/* 6. Workshop Safety and Oil Notice (Maestro Cifu) */}
      <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-400/30 text-[10px] flex items-start gap-2 shrink-0">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-tight">
          <strong className="text-amber-800 dark:text-amber-300 block font-bold text-[10.5px]">
            Buenas Prácticas de Taller y Advertencia de Aceite (Maestro Cifu):
          </strong>
          <p className="text-slate-600 dark:text-slate-300 text-[9.5px]">
            • <strong>Proyecciones de aceite:</strong> Protegerse al arrancar con tomas abiertas usando deflector o trapo; el borboteo expulsa aceite a alta velocidad.
            <br />
            • <strong>Humedad y aceite sintético:</strong> No mantener la aspiración abierta al ambiente más de 20-30s; el aire húmedo acidifica los aceites POE/PAG.
          </p>
        </div>
      </div>
    </div>
  );
};
