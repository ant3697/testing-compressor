import React, { useState } from 'react';
import { TerminalId } from '../types';
import { ShieldCheck, AlertOctagon, CheckCircle2, Info, RotateCcw } from 'lucide-react';

interface GroundFaultTesterProps {
  onSelectGroundTest: (terminal: TerminalId, reading: string, isOk: boolean) => void;
}

export const GroundFaultTester: React.FC<GroundFaultTesterProps> = ({ onSelectGroundTest }) => {
  const [pin1Ground, setPin1Ground] = useState<number | null>(null);
  const [pin2Ground, setPin2Ground] = useState<number | null>(null);
  const [pin3Ground, setPin3Ground] = useState<number | null>(null);
  const [activeTestingPin, setActiveTestingPin] = useState<TerminalId>('pin1');

  const handleTest = (pin: TerminalId, isFault: boolean) => {
    setActiveTestingPin(pin);
    if (isFault) {
      const leakVal = 85.4;
      if (pin === 'pin1') setPin1Ground(leakVal);
      if (pin === 'pin2') setPin2Ground(leakVal);
      if (pin === 'pin3') setPin3Ground(leakVal);
      onSelectGroundTest(pin, leakVal.toString(), false);
    } else {
      if (pin === 'pin1') setPin1Ground(null);
      if (pin === 'pin2') setPin2Ground(null);
      if (pin === 'pin3') setPin3Ground(null);
      onSelectGroundTest(pin, '1.', true);
    }
  };

  const isGroundClean = pin1Ground === null && pin2Ground === null && pin3Ground === null;

  return (
    <div className="space-y-3 font-secondary">
      {/* Top Status & Reset Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span className="text-small font-bold text-slate-900 dark:text-white">
            Comprobación Dieléctrica de Fugas a Masa (Tierra)
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setPin1Ground(null);
            setPin2Ground(null);
            setPin3Ground(null);
            onSelectGroundTest('pin1', '1.', true);
          }}
          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-tiny font-mono flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer ("1.")</span>
        </button>
      </div>

      {/* Security Rule Callout Banner */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-slate-800 dark:text-amber-200 flex items-start gap-2.5 text-tiny">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-tight">
          <strong className="block text-amber-600 dark:text-amber-400 uppercase font-mono mb-0.5">
            REGLA DE SEGURIDAD (MULTÍMETRO FOTO 4):
          </strong>
          <span>
            NO debe existir continuidad entre los bornes y la carcasa metálica. El multímetro DEBE marcar siempre <strong>"1." (circuito abierto / &gt;2 MΩ)</strong>.
          </span>
        </div>
      </div>

      {/* 3 Terminals vs Ground Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-tiny">
        {/* Terminal 1 (Marcha - Run) vs Ground */}
        <div className={`p-3 rounded-lg border transition-all ${
          pin1Ground === null
            ? 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-500'
        }`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-900 dark:text-white">Borne 1 (R - Run) ⟷ Masa</span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
              pin1Ground === null ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'
            }`}>
              {pin1Ground === null ? '1. (OK)' : '85.4Ω Fuga'}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleTest('pin1', false)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              OK ("1.")
            </button>
            <button
              type="button"
              onClick={() => handleTest('pin1', true)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              Fuga
            </button>
          </div>
        </div>

        {/* Terminal 2 (Arranque - Star) vs Ground */}
        <div className={`p-3 rounded-lg border transition-all ${
          pin2Ground === null
            ? 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-500'
        }`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-900 dark:text-white">Borne 2 (S - Star) ⟷ Masa</span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
              pin2Ground === null ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'
            }`}>
              {pin2Ground === null ? '1. (OK)' : '85.4Ω Fuga'}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleTest('pin2', false)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              OK ("1.")
            </button>
            <button
              type="button"
              onClick={() => handleTest('pin2', true)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              Fuga
            </button>
          </div>
        </div>

        {/* Terminal 3 (Común) vs Ground */}
        <div className={`p-3 rounded-lg border transition-all ${
          pin3Ground === null
            ? 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-500'
        }`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-900 dark:text-white">Borne 3 (C - Común) ⟷ Masa</span>
            <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
              pin3Ground === null ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'
            }`}>
              {pin3Ground === null ? '1. (OK)' : '85.4Ω Fuga'}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleTest('pin3', false)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              OK ("1.")
            </button>
            <button
              type="button"
              onClick={() => handleTest('pin3', true)}
              className="flex-1 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-[10px]"
            >
              Fuga
            </button>
          </div>
        </div>
      </div>

      {/* Verdict Callout Box */}
      <div className={`p-3 rounded-lg border flex items-center justify-between ${
        isGroundClean
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
          : 'bg-red-50 dark:bg-red-950/20 border-red-500/40 text-red-800 dark:text-red-300'
      }`}>
        <div className="flex items-center gap-2 text-tiny">
          {isGroundClean ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <div>
            <strong className="block font-mono">
              {isGroundClean ? 'AISLAMIENTO CORRECTO (Circuito abierto con chasis)' : '¡PELIGRO: COMPRESOR DERIVADO A MASA!'}
            </strong>
            <span className="text-[11px] opacity-90 font-sans">
              {isGroundClean
                ? 'Ningún bobinado tiene contacto con la carcasa metálica exterior.'
                : 'Existe fuga de corriente a la carcasa metálica. Disparará el diferencial.'}
            </span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase shrink-0 ${
          isGroundClean ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isGroundClean ? 'APTO' : 'NO APTO'}
        </span>
      </div>
    </div>
  );
};
