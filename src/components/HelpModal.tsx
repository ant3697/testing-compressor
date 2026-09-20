import React, { useState } from 'react';
import { X, HelpCircle, BookOpen, CheckCircle2, ShieldCheck, Zap, ShieldAlert } from 'lucide-react';
import { WorkshopSafetyGuide } from './WorkshopSafetyGuide';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guia' | 'seguridad'>('guia');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl panel-surface p-6 my-8 rounded-2xl border max-h-[90vh] flex flex-col"
        style={{
          boxShadow: 'var(--shadow-hard)',
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 border-b shrink-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-small shrink-0"
              style={{
                backgroundColor: 'var(--accent-ghost)',
                color: 'var(--accent-base)',
                border: '1px solid var(--accent-base)',
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-subtitle font-bold">
                Manual y Buenas Prácticas de Taller
              </h3>
              <p className="text-tiny font-secondary" style={{ color: 'var(--text-muted)' }}>
                Procedimientos técnicos de comprobación y seguridad según normas de taller frigorista
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary p-1.5 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 shrink-0 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('guia')}
            className={`px-3 py-1.5 rounded-lg text-tiny font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guia'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Guía Rápida de Comprobación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguridad')}
            className={`px-3 py-1.5 rounded-lg text-tiny font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'seguridad'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>2. Buenas Prácticas de Taller y Seguridad (Cifu)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-3 space-y-3.5 text-small font-secondary overflow-y-auto pr-1 custom-scrollbar flex-1">
          {activeTab === 'guia' ? (
            <>
              <div
                className="p-3 rounded-lg border space-y-1"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-bold text-tiny uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: 'var(--accent-base)' }}>
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] flex items-center justify-center font-bold">1</span>
                  Medición de Resistencias entre Bornes
                </span>
                <p className="text-tiny leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Con el compresor desconectado de la red, mide con multímetro en escala de 200 Ω los 3 pares posibles: (1-2), (2-3) y (1-3).
                  Introduce los valores en las filas <strong>R</strong> (Marcha), <strong>S</strong> (Arranque) y <strong>Σ</strong> (Total Serie).
                </p>
              </div>

              <div
                className="p-3 rounded-lg border space-y-1"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-bold text-tiny uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: 'var(--accent-base)' }}>
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] flex items-center justify-center font-bold">2</span>
                  Regla de Suma (Marcha + Arranque = Total)
                </span>
                <p className="text-tiny leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  La suma de la resistencia menor (Marcha / P) y la resistencia intermedia (Arranque / A) debe coincidir con la resistencia mayor (Total en serie). Tolerancia admisible: ±10%.
                </p>
              </div>

              <div
                className="p-3 rounded-lg border space-y-1"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-bold text-tiny uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: 'var(--accent-base)' }}>
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] flex items-center justify-center font-bold">3</span>
                  Comprobación de Aislamiento a Tierra (Fila D)
                </span>
                <p className="text-tiny leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Mide entre cada borne y la carcasa metálica raspada. El multímetro debe marcar siempre "1." o infinito (&gt; 2 MΩ). Si marca cualquier número, el compresor está comunicado a masa y debe sustituirse.
                </p>
              </div>

              <div
                className="p-3 rounded-lg border space-y-1"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-bold text-tiny uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: 'var(--accent-base)' }}>
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] flex items-center justify-center font-bold">4</span>
                  Prueba Mecánica de Rendimiento y Válvulas
                </span>
                <p className="text-tiny leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Un compresor con bobinas sanas puede no comprimir si las láminas de alta están rajadas o deformadas. Acopla manómetro en descarga: debe superar 350-450 PSI y retener la contrapresión al desconectar corriente (0V) sin retroceso rápido.
                </p>
              </div>
            </>
          ) : (
            <WorkshopSafetyGuide />
          )}
        </div>

        {/* Footer button */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary text-small cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
