import React from 'react';
import { Volume2, VolumeX, ShieldCheck, AlertTriangle } from 'lucide-react';
import { playMultimeterBuzzer, stopMultimeterBuzzer } from '../utils/audio';

interface MultimeterGraphicProps {
  reading: string; // e.g., "9.7", "13.1", "22.8", "1.", "0.0"
  unit?: string; // "Ω", "kΩ", "MΩ", "V"
  mode: 'ohms' | 'continuity' | 'ground';
  dialPosition?: '200' | 'continuity' | '2k' | '20M';
  title?: string;
  isBeeping?: boolean;
  probeRedLabel?: string;
  probeBlackLabel?: string;
  statusType?: 'ok' | 'warning' | 'danger' | 'neutral';
}

export const MultimeterGraphic: React.FC<MultimeterGraphicProps> = ({
  reading,
  unit = 'Ω',
  mode,
  dialPosition = '200',
  title = 'Multímetro Digital KT-3900',
  isBeeping = false,
  probeRedLabel = 'V / Ω',
  probeBlackLabel = 'COM',
  statusType = 'neutral',
}) => {
  const [audioEnabled, setAudioEnabled] = React.useState(true);

  React.useEffect(() => {
    if (isBeeping && audioEnabled) {
      playMultimeterBuzzer(true);
    } else {
      stopMultimeterBuzzer();
    }
    return () => {
      stopMultimeterBuzzer();
    };
  }, [isBeeping, audioEnabled]);

  // Status glow colors from Custom Design System status tokens
  const statusColorMap = {
    ok: 'border-[var(--status-success-base)] shadow-[0_0_15px_var(--status-success-bg)]',
    warning: 'border-[var(--status-warning-base)] shadow-[0_0_15px_var(--status-warning-bg)]',
    danger: 'border-[var(--status-danger-base)] shadow-[0_0_15px_var(--status-danger-bg)]',
    neutral: 'border-[var(--accent-base)] shadow-[var(--shadow-glow)]',
  };

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl p-5 border-4 shadow-2xl w-full max-w-[320px] mx-auto select-none transition-all duration-200 ${statusColorMap[statusType]}`}
      style={{
        background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        color: '#0a0a0c',
      }}
    >
      {/* Brand Header */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-circle bg-black"></div>
          <span className="font-mono text-small font-bold tracking-widest text-black uppercase">
            KT-3900
          </span>
        </div>
        <span className="text-tiny font-primary font-bold uppercase tracking-wider text-black/80">
          Digital Multimeter
        </span>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? 'Desactivar sonido' : 'Activar sonido zumbador'}
          className="p-1 rounded-sm bg-black/10 hover:bg-black/20 text-black transition-colors cursor-pointer"
          type="button"
        >
          {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-700" />}
        </button>
      </div>

      {/* LCD Screen Display Frame */}
      <div className="w-full bg-[#0a0a0c] p-2.5 rounded-lg shadow-inner border border-black/40 mb-4">
        <div className="relative bg-[#a4bd99] rounded-md p-3 px-4 shadow-[inset_0_2px_6px_rgba(0,0,0,0.55)] border border-[#7d9b73] min-h-[96px] flex flex-col justify-between">
          {/* Top LCD indicators */}
          <div className="flex justify-between items-center text-tiny font-bold text-slate-800 font-mono tracking-wider">
            <span className="flex items-center gap-1">
              {mode === 'continuity' && '🔊 CONT'}
              {mode === 'ground' && '⚡ AISLAMIENTO'}
              {mode === 'ohms' && 'Ω RESISTENCIA'}
            </span>
            <div className="flex items-center gap-1.5">
              {reading === '1.' && (
                <span className="text-tiny bg-slate-800/20 px-1 rounded-sm uppercase font-primary font-bold">
                  Abierto (OL)
                </span>
              )}
              <span>AUTO</span>
            </div>
          </div>

          {/* Main 7-Segment Value Display */}
          <div className="flex items-baseline justify-end gap-1.5 my-1">
            <span
              className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-950"
              style={{
                fontFamily: "'Fira Code', monospace",
                letterSpacing: reading === '1.' ? '0.15em' : '0.05em',
              }}
            >
              {reading}
            </span>
            {reading !== '1.' && (
              <span className="text-title font-bold font-mono text-slate-900 pb-1">
                {unit}
              </span>
            )}
          </div>

          {/* Bottom LCD indicators */}
          <div className="flex justify-between items-center text-tiny text-slate-800 font-mono">
            <span>HOLD</span>
            <span>{reading === '1.' ? '∞ Ω (Circuito Abierto)' : `${reading} ${unit}`}</span>
          </div>
        </div>
      </div>

      {/* Rotary Selector Dial */}
      <div className="relative w-28 h-28 my-1 flex items-center justify-center">
        {/* Dial Background circle with markings */}
        <div className="absolute inset-0 rounded-full border border-amber-300/40 bg-amber-500/30 flex items-center justify-center">
          {/* Measurement position labels */}
          <span className={`absolute top-1 text-tiny font-bold font-mono ${dialPosition === '200' ? 'text-black font-extrabold scale-110' : 'text-black/70'}`}>
            200 Ω
          </span>
          <span className={`absolute right-1 text-tiny font-bold font-mono ${dialPosition === '2k' ? 'text-black font-extrabold scale-110' : 'text-black/70'}`}>
            2k
          </span>
          <span className={`absolute bottom-1 text-tiny font-bold font-mono ${dialPosition === 'continuity' ? 'text-black font-extrabold scale-110' : 'text-black/70'}`}>
            🔊 •)))
          </span>
          <span className={`absolute left-1 text-tiny font-bold font-mono ${dialPosition === '20M' ? 'text-black font-extrabold scale-110' : 'text-black/70'}`}>
            20M
          </span>
        </div>

        {/* Knob */}
        <div className="w-16 h-16 rounded-circle bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border-2 border-slate-700 shadow-xl flex items-center justify-center cursor-pointer transition-transform duration-300">
          {/* Dial Pointer notch */}
          <div
            className="w-1.5 h-6 bg-[var(--accent-base)] rounded-full absolute -top-1 shadow-[var(--shadow-glow)]"
            style={{
              transformOrigin: '50% 32px',
              transform:
                dialPosition === '200'
                  ? 'rotate(0deg)'
                  : dialPosition === '2k'
                  ? 'rotate(90deg)'
                  : dialPosition === 'continuity'
                  ? 'rotate(180deg)'
                  : 'rotate(270deg)',
            }}
          />
          <div className="w-7 h-7 rounded-circle bg-slate-800 border border-slate-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-circle bg-[var(--accent-base)]" />
          </div>
        </div>
      </div>

      {/* Terminal Jack Ports with Cable Probes */}
      <div className="w-full mt-4 pt-3 border-t border-black/20 flex items-center justify-around">
        {/* Black Probe (COM) */}
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-circle bg-slate-950 border-2 border-slate-800 flex items-center justify-center shadow-inner relative">
            <div className="w-2.5 h-2.5 rounded-circle bg-slate-800" />
            <div className="absolute -bottom-5 w-2 h-7 bg-slate-900 rounded-b shadow-md" />
          </div>
          <span className="text-tiny font-bold text-black mt-6 tracking-wide">
            COM
          </span>
          <span className="text-tiny font-semibold text-black bg-black/15 px-1.5 py-0.5 rounded-sm mt-0.5 max-w-[90px] truncate text-center font-mono">
            {probeBlackLabel}
          </span>
        </div>

        {/* Red Probe (V/Ω) */}
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 rounded-circle bg-red-700 border-2 border-red-900 flex items-center justify-center shadow-inner relative">
            <div className="w-2.5 h-2.5 rounded-circle bg-red-950" />
            <div className="absolute -bottom-5 w-2 h-7 bg-red-600 rounded-b shadow-md" />
          </div>
          <span className="text-tiny font-bold text-black mt-6 tracking-wide">
            V • Ω • mA
          </span>
          <span className="text-tiny font-semibold text-black bg-black/15 px-1.5 py-0.5 rounded-sm mt-0.5 max-w-[90px] truncate text-center font-mono">
            {probeRedLabel}
          </span>
        </div>
      </div>

      {/* Reading Context Footer */}
      <div className="w-full mt-3 pt-2 text-center text-small font-bold text-black/90 bg-black/10 rounded-md py-1 px-2 font-secondary">
        {title}
      </div>
    </div>
  );
};
