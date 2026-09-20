import React, { useState } from 'react';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  RotateCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { UseDirectStartSimulatorReturn } from '../hooks/useDirectStartSimulator';

interface DirectStartControlsPanelProps {
  simulator: UseDirectStartSimulatorReturn;
  onNavigateToWiring?: () => void;
}

export const DirectStartControlsPanel: React.FC<DirectStartControlsPanelProps> = ({
  simulator,
  onNavigateToWiring,
}) => {
  const {
    powerOn,
    isBridging,
    isMotorRunning,
    isSeizedMotor,
    setIsSeizedMotor,
    klixonTripped,
    bridgeDurationMs,
    isAlarmActive,
    alarmMessage,
    feedbackMessage,
    motorRpm,
    soundEnabled,
    setSoundEnabled,
    currentAmps,
    handleTogglePower,
    handleStartBridge,
    handleEndBridge,
    handleClickBridge,
    handleReset,
  } = simulator;

  const [showGuide, setShowGuide] = useState<boolean>(false);

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between font-sans">
      {/* 1. Protocol / Guide Collapsible Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <h4 className="text-small font-bold text-slate-900 dark:text-white">
            Banco de Pruebas: Arranque Directo
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="text-tiny font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3 h-3" />
          <span>{showGuide ? 'Ocultar Protocolo' : 'Ver Protocolo Cifu'}</span>
        </button>
      </div>

      {showGuide && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-tiny text-slate-700 dark:text-slate-300 space-y-1.5 animate-fadeIn">
          <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>Protocolo de Taller (Maestro Cifu):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
            <li>
              <strong>Alimentación directa:</strong> <strong>Fase ($L$)</strong> al borne <strong>Común ($C$)</strong> y <strong>Neutro ($N$)</strong> al borne <strong>Marcha ($R$)</strong>.
            </li>
            <li>
              <strong>Pinza amperimétrica:</strong> Abraza el cable de Fase ($L$) para medir corriente en tiempo real.
            </li>
            <li>
              <strong>Impulso de arranque:</strong> Con tensión aplicada, haz un puente momentáneo (con <strong>0.3 segundos</strong> es suficiente) entre <strong>Marcha ($R$)</strong> y <strong>Arranque ($S$)</strong> con el pulsador.
            </li>
            <li>
              <strong>Diagnóstico:</strong> Si arranca y los amperios caen a nominal (~0.8-1.2 A), el compresor está perfecto; la avería estaba en el relé o PTC. Si no arranca y el Klixon corta a &gt;14 A, está clavado.
            </li>
          </ol>
        </div>
      )}

      {/* 2. Controls Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-tiny font-mono font-bold text-slate-500 uppercase tracking-wider">
            1. Controles del Banco
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2 py-0.5 rounded border text-tiny font-mono font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
                soundEnabled
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                  : 'bg-rose-100 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
              }`}
              title={soundEnabled ? 'Inhabilitar audio del simulador' : 'Habilitar audio del simulador'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Audio ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>Audio OFF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-tiny font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Reiniciar Todo
            </button>
          </div>
        </div>

        {/* 230V Mains Power Switch */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${powerOn ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-400'}`} />
            <div>
              <span className="text-small font-bold text-slate-900 dark:text-white block">
                Alimentación 230V (L y N)
              </span>
              <span className="text-tiny text-slate-500 dark:text-slate-400">
                Fase a Común (C) • Neutro a Marcha (R)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePower}
            className={`px-3 py-1.5 rounded-lg font-mono text-tiny font-bold cursor-pointer transition-all ${
              powerOn
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {powerOn ? 'DESCONECTAR (0V)' : 'ENERGIZAR (230V)'}
          </button>
        </div>

        {/* Tactile Impulsive Bridge Bar (Impulso R - S) */}
        <div className={`space-y-2.5 p-3 rounded-xl border transition-all ${
          isAlarmActive
            ? 'bg-rose-500/15 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
            : isMotorRunning
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : powerOn && !klixonTripped
            ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
            : 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between gap-2 flex-wrap text-tiny font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>Pulsador de Arranque (Puente R ⟷ S)</span>
              {powerOn && !isMotorRunning && !klixonTripped && (
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              )}
            </span>

            {/* BOTÓN MECÁNICA SANA / CLAVADA REUBICADO EN ESTA POSICIÓN SEGÚN LA IMAGEN */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSeizedMotor(!isSeizedMotor);
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer select-none shadow-sm ${
                  isSeizedMotor
                    ? 'bg-rose-600/25 text-rose-300 border border-rose-500 hover:bg-rose-600/35 ring-1 ring-rose-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={isSeizedMotor ? 'Simulando compresor mecánicamente clavado (bloqueado)' : 'Simulando compresor mecánicamente sano'}
              >
                {isSeizedMotor ? 'MECÁNICA CLAVADA' : 'MECÁNICA SANA'}
              </button>

              <span className={`text-[10px] font-mono font-bold ${
                isAlarmActive
                  ? 'text-rose-500 animate-pulse'
                  : isMotorRunning
                  ? 'text-emerald-500'
                  : 'text-blue-500'
              }`}>
                {isBridging
                  ? `${(bridgeDurationMs / 1000).toFixed(1)}s ${isMotorRunning ? '• ¡Ya arrancó!' : '(mín. 0.3s)'}`
                  : isMotorRunning
                  ? 'Compresor en marcha • Pulsador inactivo'
                  : 'Mantén pulsado 0.3s'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!powerOn || klixonTripped || (isMotorRunning && !isBridging)}
            onClick={handleClickBridge}
            onMouseDown={handleStartBridge}
            onMouseUp={handleEndBridge}
            onMouseLeave={handleEndBridge}
            onTouchStart={handleStartBridge}
            onTouchEnd={handleEndBridge}
            title={
              isMotorRunning
                ? 'El compresor ya está en marcha continua. El pulsador queda inactivo. Para detenerlo, desconecta la red eléctrica (230V OFF).'
                : undefined
            }
            className={`w-full py-3 px-3 rounded-xl font-mono text-tiny font-extrabold transition-all select-none shadow-md flex items-center justify-center gap-2 ${
              !powerOn || klixonTripped
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                : isAlarmActive
                ? 'bg-rose-600 text-white animate-bounce shadow-inner ring-4 ring-rose-500 cursor-pointer'
                : isBridging
                ? 'bg-blue-600 text-white scale-[0.98] shadow-inner ring-4 ring-blue-400 cursor-pointer'
                : isMotorRunning
                ? 'bg-emerald-600/85 text-white border border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-not-allowed opacity-90'
                : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 ring-4 ring-blue-400/80 shadow-[0_0_20px_#3b82f6] animate-pulse hover:scale-[1.02] cursor-pointer'
            }`}
          >
            <Zap className={`w-4 h-4 ${isBridging || isAlarmActive ? 'fill-current animate-bounce' : ''}`} />
            <span>
              {isAlarmActive
                ? '🚨 ¡ALARMA! SUELTA EL PULSADOR INMEDIATAMENTE'
                : isBridging
                ? isMotorRunning
                  ? `⚡ ¡MOTOR ARRANCADO! SUELTA EL PULSADOR (${(bridgeDurationMs / 1000).toFixed(1)}s)`
                  : `¡PUENTE R ⟷ S ACTIVO (${(bridgeDurationMs / 1000).toFixed(1)}s)! INICIANDO ROTOR...`
                : isMotorRunning
                ? 'COMPRESOR EN MARCHA • RÉGIMEN NORMAL (2.850 RPM)'
                : '⚡ MANTÉN PULSADO 0.3s PARA ARRANCAR'}
            </span>
          </button>

          {/* Feedback Message Notification */}
          {feedbackMessage && (
            <div className={`p-2 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 transition-all ${
              feedbackMessage.includes('✅')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : feedbackMessage.includes('⚠️')
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}>
              <span>{feedbackMessage}</span>
            </div>
          )}

          {isMotorRunning && powerOn && !klixonTripped && (
            <>
              <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300">RÉGIMEN NORMAL: ROTOR A 2.850 RPM</span>
                </div>
                <span className="font-mono text-emerald-300 font-black">{currentAmps.toFixed(2)} A (FLA)</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[11px] flex items-center justify-between">
                <span className="font-semibold text-amber-600 dark:text-amber-400">Pulsador inactivo tras arranque</span>
                <span className="text-slate-500 dark:text-slate-400 text-[10.5px]">Para parar: pulsa <strong>DESCONECTAR 230V</strong></span>
              </div>
            </>
          )}

          {isAlarmActive && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-start gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black text-rose-700 dark:text-rose-300">
                  ¡ALARMA DE SEGURIDAD! Tiempo máximo excedido (&gt; 3 segundos)
                </span>
                <span className="text-[10px] font-normal leading-tight block text-rose-800 dark:text-rose-200">
                  El bobinado de arranque (S) solo tolera paso de corriente durante 2 a 3 segundos. Suelta el pulsador para evitar quemarlo.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Diagnostic Verdict Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <span className="text-tiny font-mono font-bold text-slate-500 uppercase tracking-wider">
          2. Veredicto Técnico de la Prueba
        </span>

        <div>
          {klixonTripped ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 space-y-1">
              <div className="font-bold text-small flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Klixon Abierto por Sobrecarga Térmica</span>
              </div>
              <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                El protector térmico cortó al absorber <strong className="font-mono">{currentAmps.toFixed(1)} A</strong> durante más de 4 segundos. El compresor está <strong>clavado mecánicamente</strong> o no recibió el impulso de arranque a tiempo.
              </p>
            </div>
          ) : isMotorRunning ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-1">
              <div className="font-bold text-small flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Compresor Sano: Arranca Directo</span>
              </div>
              <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                El motor venció la inercia, alcanzó velocidad nominal (~2.850 RPM) y el consumo cayó a <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentAmps.toFixed(2)} A (FLA)</strong>.
              </p>
              <div className="pt-1 border-t border-emerald-500/20 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                💡 Diagnóstico: Compresor perfecto. Si no arrancaba en la instalación, la avería está en el relé o PTC.
              </div>
            </div>
          ) : powerOn ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-1">
              <div className="font-bold text-small flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>En Espera de Impulso de Arranque</span>
              </div>
              <p className="text-tiny leading-relaxed text-slate-700 dark:text-slate-300">
                Tensión aplicada. El motor monofásico no tiene par propio y zumba a 50Hz absorbiendo <strong className="font-mono text-amber-600 dark:text-amber-400">{currentAmps.toFixed(1)} A</strong>. Presiona el botón de puente para arrancarlo.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-tiny leading-relaxed">
              Pulsa <strong>«ENERGIZAR (230V)»</strong> para suministrar corriente y luego mantén presionado el botón <strong className="text-blue-500">R ⟷ S</strong> al menos 0.3 segundos.
            </div>
          )}
        </div>

        {/* Shortcut to Starting Systems */}
        {onNavigateToWiring && (
          <button
            type="button"
            onClick={onNavigateToWiring}
            className="w-full mt-1.5 py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-900 text-tiny font-bold flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ver Esquemas Oficiales (Relé y Condensador)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
