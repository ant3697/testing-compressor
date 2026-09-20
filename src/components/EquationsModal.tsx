import React from 'react';
import { X, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import { DiagnosticEvaluation } from '../types';

interface EquationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: DiagnosticEvaluation;
}

export const EquationsModal: React.FC<EquationsModalProps> = ({
  isOpen,
  onClose,
  evaluation,
}) => {
  if (!isOpen) return null;

  const rM = evaluation.rMarcha ?? 9.7;
  const rA = evaluation.rArranque ?? 13.1;
  const rTotalMed = evaluation.rTotalMedida ?? 22.8;
  const rTotalCalc = evaluation.rTotalCalculada ?? (rM + rA);
  const errorPct = evaluation.desviacionPorcentual ?? 0.0;
  const isWithinTolerance = errorPct <= 10.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-xl panel-surface p-6 my-8 rounded-2xl border"
        style={{
          boxShadow: 'var(--shadow-hard)',
          borderColor: 'var(--accent-base)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-small shrink-0"
              style={{
                backgroundColor: 'var(--accent-base)',
                color: 'var(--accent-text)',
              }}
            >
              Σ
            </div>
            <div>
              <h3 className="text-subtitle font-bold">
                Ecuaciones y Criterio de Comprobación de Bobinados
              </h3>
              <p className="text-tiny font-secondary" style={{ color: 'var(--text-muted)' }}>
                Guía Técnica Oficial (Pág. 39) • Regla matemática de estatores monofásicos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary p-1.5 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="mt-5 space-y-4 text-small font-secondary">
          {/* Main Formula Card */}
          <div
            className="p-4 rounded-xl border text-center font-mono"
            style={{
              backgroundColor: 'var(--bg-alt)',
              borderColor: 'var(--accent-base)',
            }}
          >
            <span className="text-tiny uppercase font-bold tracking-widest block mb-1" style={{ color: 'var(--accent-base)' }}>
              REGLA FUNDAMENTAL DE SUMA DE RESISTENCIAS
            </span>
            <div className="text-title font-bold my-1 text-[20px]" style={{ color: 'var(--text-primary)' }}>
              R(Marcha) + R(Arranque) = R(Total Serie)
            </div>
            <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>
              R(C ⟷ P) + R(C ⟷ A) = R(P ⟷ A)
            </div>
          </div>

          {/* Current Calculation Step by Step */}
          <div className="space-y-2">
            <h4 className="text-tiny font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--accent-base)' }}>
              Desglose Paso a Paso con los Valores Actuales:
            </h4>

            <div
              className="p-3 rounded-lg border space-y-2 font-mono"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex justify-between items-center text-body">
                <span>1. Devanado Principal (Marcha / P):</span>
                <strong style={{ color: 'var(--status-success-dark)' }}>{rM} Ω</strong>
              </div>
              <div className="flex justify-between items-center text-body">
                <span>2. Devanado Auxiliar (Arranque / A):</span>
                <strong style={{ color: 'var(--status-warning-dark)' }}>{rA} Ω</strong>
              </div>
              <div className="flex justify-between items-center text-body pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>3. Suma Teórica Calculada:</span>
                <strong>{rM} + {rA} = {rTotalCalc.toFixed(1)} Ω</strong>
              </div>
              <div className="flex justify-between items-center text-body">
                <span>4. Resistencia Total Medida en Bornes:</span>
                <strong style={{ color: 'var(--accent-base)' }}>{rTotalMed} Ω</strong>
              </div>
              <div className="flex justify-between items-center text-body pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>5. Error / Desviación Porcentual:</span>
                <strong
                  style={{
                    color: isWithinTolerance ? 'var(--status-success-dark)' : 'var(--status-danger-dark)',
                  }}
                >
                  {errorPct.toFixed(1)}% {isWithinTolerance ? '(Admisible ≤ 10%)' : '(¡Exceso > 10%!)'}
                </strong>
              </div>
            </div>
          </div>

          {/* Identification Rules Reference */}
          <div
            className="p-3.5 rounded-lg border space-y-2 text-tiny leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-alt)',
              borderColor: 'var(--border-default)',
            }}
          >
            <p className="font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Criterio de Identificación de los 3 Bornes:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-small" style={{ color: 'var(--text-secondary)' }}>
              <li>
                <strong>Borne Común (C):</strong> Es el borne opuesto a la lectura mayor (la lectura total entre marcha y arranque).
              </li>
              <li>
                <strong>Borne Marcha (P / R):</strong> El que medido con el Común ofrece la <strong>menor resistencia</strong> (hilo de mayor grosor y menor número de espiras).
              </li>
              <li>
                <strong>Borne Arranque (A / S):</strong> El que medido con el Común ofrece la <strong>resistencia intermedia</strong> (hilo fino para desfasar corriente).
              </li>
              <li>
                <strong>Aislamiento dieléctrico:</strong> Resistencia entre cualquier borne y la carcasa debe ser infinita ("1." o "OL" &gt; 2 MΩ).
              </li>
            </ul>
          </div>

          {/* Verdict Status */}
          <div
            className="p-3 rounded-xl border flex items-center justify-between"
            style={{
              backgroundColor: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              borderColor: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-base)' : 'var(--status-danger-base)',
            }}
          >
            <div className="flex items-center gap-2">
              {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--status-success-base)' }} />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--status-danger-base)' }} />
              )}
              <div>
                <span className="font-bold block text-small" style={{ color: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-dark)' : 'var(--status-danger-dark)' }}>
                  {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'Veredicto: APTO PARA SERVICIO' : 'Veredicto: NO APTO / ANOMALÍA'}
                </span>
                <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                  {evaluation.diagnosticoTexto}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-small px-4 py-1.5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
