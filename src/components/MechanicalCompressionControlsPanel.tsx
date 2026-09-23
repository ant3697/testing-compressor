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
          onClick={() => onSelectSubTab('mecanico')}
          className={`flex-1 py-1.5 px-2 rounded-md font-mono text-tiny font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            averiasSubTab === 'mecanico'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>1. Válvulas Flapper y Compresión</span>
        </button>

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
          <span>2. Averías Eléctricas (Bobinados)</span>
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

        {/* Parámetro A: Presión máxima alcanzada */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-tiny">
            <label className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">A</span>
              Presión máxima alcanzada:
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

        {/* Parámetro B: Comportamiento de estanqueidad al corte (0V) */}
        <div className="space-y-1 pt-1">
          <label className="text-tiny text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">B</span>
            Comportamiento y Retención de Válvulas al Corte (0V):
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

      {/* 4. Interactive Simulation Control Console (Consola de Botones de Prueba) */}
      <div className="p-3 rounded-xl bg-gradient-to-b from-slate-900 to-[#070b14] border-2 border-amber-500/50 shadow-md space-y-2.5 shrink-0 text-white">
        {/* Cabecera de la Consola de Acciones */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCompressing ? 'bg-emerald-400' : isMeasuringRetention ? 'bg-amber-400' : 'bg-slate-500'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isCompressing ? 'bg-emerald-500' : isMeasuringRetention ? 'bg-amber-500' : 'bg-slate-500'
              }`} />
            </span>
            <span className="text-[11px] font-bold text-amber-400 font-mono tracking-wide">
              PASOS DE LA PRUEBA (TALLER):
            </span>
          </div>

          <span
            className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              isCompressing
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse'
                : isMeasuringRetention
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : currentPsi > 0
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isCompressing
              ? `⚡ ${currentPsi} PSI`
              : isMeasuringRetention
              ? `⏱ RETENCIÓN (${retentionElapsedSec.toFixed(1)}s)`
              : currentPsi > 0
              ? `${currentPsi} PSI`
              : 'EN ESPERA (0 PSI)'}
          </span>
        </div>

        {/* Guía interactiva contextual para el técnico */}
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-start gap-2">
          <span className="text-amber-400 font-bold shrink-0 mt-0.5">👉</span>
          <div className="leading-tight text-slate-300">
            {!isCompressing && !isMeasuringRetention && currentPsi === 0 && (
              <span>
                <strong>Paso 1:</strong> Pulsa el botón verde <strong className="text-emerald-400">PASO 1: ARRANCAR</strong> para energizar el compresor y subir la presión.
              </span>
            )}
            {isCompressing && (
              <span className="text-emerald-300">
                Compresor subiendo a <strong>{parsedMaxPsi} PSI</strong>... Pulsa el botón parpadeante <strong className="text-amber-400">PASO 2: CORTE (0V)</strong> para comprobar si las válvulas retienen.
              </span>
            )}
            {isMeasuringRetention && (
              <span className="text-amber-300">
                Motor cortado a 0V. Evaluando estanqueidad de válvulas... Pulsa <strong className="text-sky-300">PASO 3: PURGAR</strong> para reiniciar la aguja a 0 PSI.
              </span>
            )}
            {!isCompressing && !isMeasuringRetention && currentPsi > 0 && (
              <span className="text-sky-300">
                Prueba finalizada ({currentPsi} PSI retenidos). Pulsa <strong className="text-sky-200">PASO 3: PURGAR MANÓMETRO</strong> para comenzar de nuevo.
              </span>
            )}
          </div>
        </div>

        {/* Botonera de Pasos 1 y 2 */}
        <div className="grid grid-cols-2 gap-2">
          {/* BOTÓN PASO 1 */}
          <button
            type="button"
            onClick={startCompression}
            disabled={isCompressing}
            className={`p-2 rounded-lg font-mono text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-md ${
              isCompressing
                ? 'bg-emerald-600/90 text-white ring-2 ring-emerald-400 cursor-default animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 ring-1 ring-emerald-400/50 hover:shadow-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompressing ? 'COMPRIMIENDO...' : '1. ARRANCAR'}</span>
            </div>
            <span className="text-[8.5px] font-medium opacity-85">
              {isCompressing ? `${currentPsi} PSI acumulando` : 'Tapar descarga (230V)'}
            </span>
          </button>

          {/* BOTÓN PASO 2 */}
          <button
            type="button"
            onClick={stopAndMeasureRetention}
            disabled={!isCompressing && currentPsi === 0}
            className={`p-2 rounded-lg font-mono text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-md ${
              isCompressing
                ? 'bg-amber-400 hover:bg-amber-300 text-black ring-4 ring-amber-400/70 active:scale-95 shadow-lg shadow-amber-400/30'
                : isMeasuringRetention
                ? 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/50 cursor-default'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>2. CORTE (0V)</span>
            </div>
            <span className="text-[8.5px] font-medium opacity-85">
              {isCompressing ? '👉 ¡PULSAR AQUÍ!' : isMeasuringRetention ? 'Midiendo retención' : 'Comprobar válvulas'}
            </span>
          </button>
        </div>

        {/* BOTÓN PASO 3: PURGA CLARAMENTE VISIBLE Y DESTACADA */}
        <button
          type="button"
          onClick={resetSimulation}
          disabled={currentPsi === 0 && !isCompressing && !isMeasuringRetention}
          className={`w-full py-2 px-2.5 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border ${
            currentPsi > 0 || isCompressing || isMeasuringRetention
              ? 'bg-sky-950 hover:bg-sky-900 text-sky-200 border-sky-500/50 hover:border-sky-400 shadow-sm active:scale-95'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {currentPsi > 0
              ? `3. PURGAR MANÓMETRO (Liberar ${currentPsi} PSI ➔ 0 PSI)`
              : '3. MANÓMETRO PURGADO A 0 PSI'}
          </span>
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
