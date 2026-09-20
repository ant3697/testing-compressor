import React, { useState } from 'react';
import { DiagnosticEvaluation } from '../types';
import { Printer, X, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TechnicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: DiagnosticEvaluation;
}

export const TechnicalReportModal: React.FC<TechnicalReportModalProps> = ({
  isOpen,
  onClose,
  evaluation,
}) => {
  const [equipmentName, setEquipmentName] = useState('Vitrina Frigorífica / Nevera');
  const [compressorModel, setCompressorModel] = useState('Hermético Monofásico 1/4 HP');
  const [refrigerant, setRefrigerant] = useState('R134a');
  const [technicianName, setTechnicianName] = useState('Técnico Frigorista');
  const [workOrder, setWorkOrder] = useState(`OT-${Math.floor(10000 + Math.random() * 90000)}`);
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl panel-surface p-6 my-8"
        style={{
          boxShadow: 'var(--shadow-hard)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5" style={{ color: 'var(--accent-base)' }} />
            <h3 className="text-subtitle font-bold">
              Informe Técnico de Comprobación de Compresor
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Technical Document Body */}
        <div className="mt-5 space-y-4 print:text-black print:bg-white" id="printable-report">
          {/* Company & Order Info */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border text-small font-secondary"
            style={{
              backgroundColor: 'var(--bg-alt)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <span className="block text-tiny uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
                Nº Orden / Parte:
              </span>
              <input
                type="text"
                value={workOrder}
                onChange={(e) => setWorkOrder(e.target.value)}
                className="bg-transparent font-bold focus:outline-none w-full border-b border-transparent focus:border-[var(--accent-base)] text-small"
              />
            </div>
            <div>
              <span className="block text-tiny uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
                Fecha:
              </span>
              <span className="font-bold text-small">{currentDate}</span>
            </div>
            <div>
              <span className="block text-tiny uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
                Refrigerante:
              </span>
              <input
                type="text"
                value={refrigerant}
                onChange={(e) => setRefrigerant(e.target.value)}
                className="bg-transparent font-bold focus:outline-none w-full border-b border-transparent focus:border-[var(--accent-base)] text-small"
              />
            </div>
            <div>
              <span className="block text-tiny uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
                Técnico:
              </span>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="bg-transparent font-bold focus:outline-none w-full border-b border-transparent focus:border-[var(--accent-base)] text-small"
              />
            </div>
          </div>

          {/* Equipment fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-small font-secondary">
            <div
              className="p-3 rounded-md border"
              style={{
                backgroundColor: 'var(--bg-alt)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <label className="text-tiny uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>
                Equipo / Máquina:
              </label>
              <input
                type="text"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none w-full mt-1 border-b border-[var(--border-subtle)] focus:border-[var(--accent-base)] text-small"
              />
            </div>
            <div
              className="p-3 rounded-md border"
              style={{
                backgroundColor: 'var(--bg-alt)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <label className="text-tiny uppercase font-mono block" style={{ color: 'var(--text-muted)' }}>
                Modelo / Potencia Compresor:
              </label>
              <input
                type="text"
                value={compressorModel}
                onChange={(e) => setCompressorModel(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none w-full mt-1 border-b border-[var(--border-subtle)] focus:border-[var(--accent-base)] text-small"
              />
            </div>
          </div>

          {/* Table of Measurements */}
          <div
            className="overflow-hidden border rounded-xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div
              className="p-3 border-b text-small font-bold flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-alt)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span>Mediciones Eléctricas de Devanados (Multímetro)</span>
              <span className="text-tiny font-mono" style={{ color: 'var(--accent-base)' }}>
                Escala 200 Ω
              </span>
            </div>
            <table className="w-full text-small text-left">
              <thead
                className="text-tiny border-b font-secondary"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <tr>
                  <th className="p-2.5 font-medium">Par de Bornes</th>
                  <th className="p-2.5 font-medium">Devanado Identificado</th>
                  <th className="p-2.5 font-medium">Valor Medido</th>
                  <th className="p-2.5 font-medium">Criterio Técnico</th>
                </tr>
              </thead>
              <tbody
                className="divide-y font-mono text-small"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <tr>
                  <td className="p-2.5 font-bold">Común (C) — Marcha (R)</td>
                  <td className="p-2.5 font-sans" style={{ color: 'var(--status-success-dark)' }}>Devanado Principal</td>
                  <td className="p-2.5 font-bold" style={{ color: 'var(--status-success-dark)' }}>
                    {evaluation.rMarcha !== null ? `${evaluation.rMarcha} Ω` : '—'}
                  </td>
                  <td className="p-2.5 text-tiny font-sans" style={{ color: 'var(--text-muted)' }}>
                    Resistencia menor (Hilo grueso)
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Común (C) — Arranque (S)</td>
                  <td className="p-2.5 font-sans" style={{ color: 'var(--status-warning-dark)' }}>Devanado Auxiliar</td>
                  <td className="p-2.5 font-bold" style={{ color: 'var(--status-warning-dark)' }}>
                    {evaluation.rArranque !== null ? `${evaluation.rArranque} Ω` : '—'}
                  </td>
                  <td className="p-2.5 text-tiny font-sans" style={{ color: 'var(--text-muted)' }}>
                    Resistencia intermedia (Hilo fino)
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Marcha (R) — Arranque (S)</td>
                  <td className="p-2.5 font-sans" style={{ color: 'var(--accent-base)' }}>Suma en Serie</td>
                  <td className="p-2.5 font-bold" style={{ color: 'var(--accent-base)' }}>
                    {evaluation.rTotalMedida !== null ? `${evaluation.rTotalMedida} Ω` : '—'}
                  </td>
                  <td className="p-2.5 text-tiny font-sans" style={{ color: 'var(--text-muted)' }}>
                    Resistencia mayor: R(M) + R(A)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mathematical check */}
          <div
            className="p-3 rounded-md border text-small flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
            style={{
              backgroundColor: 'var(--bg-alt)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <span className="text-tiny block uppercase" style={{ color: 'var(--text-muted)' }}>
                Comprobación Matemática:
              </span>
              <span className="font-bold">
                {evaluation.rMarcha} Ω + {evaluation.rArranque} Ω = {evaluation.rTotalCalculada} Ω
                {' '}(Medido: {evaluation.rTotalMedida} Ω)
              </span>
            </div>
            <div className="text-right">
              <span className="text-tiny block uppercase" style={{ color: 'var(--text-muted)' }}>
                Desviación:
              </span>
              <span
                className="font-bold"
                style={{
                  color:
                    (evaluation.desviacionPorcentual ?? 0) <= 5
                      ? 'var(--status-success-dark)'
                      : 'var(--status-danger-dark)',
                }}
              >
                {evaluation.desviacionPorcentual ?? 0}% (Tolerancia admisible: ±10%)
              </span>
            </div>
          </div>

          {/* Ground insulation result */}
          <div
            className="p-3 rounded-md border text-small flex items-center justify-between font-secondary"
            style={{
              backgroundColor: 'var(--bg-alt)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--status-info-base)' }} />
              <div>
                <span className="font-bold block">Prueba de Aislamiento a Carcasa (Tierra)</span>
                <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>Continuidad entre bornes y chasis exterior</span>
              </div>
            </div>
            <span
              className="font-mono font-bold px-2.5 py-1 rounded-sm text-tiny border"
              style={{
                backgroundColor: evaluation.estadoTierra === 'aislado' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                color: evaluation.estadoTierra === 'aislado' ? 'var(--status-success-dark)' : 'var(--status-danger-dark)',
                borderColor: evaluation.estadoTierra === 'aislado' ? 'var(--status-success-base)' : 'var(--status-danger-base)',
              }}
            >
              {evaluation.estadoTierra === 'aislado' ? 'CORRECTO ("1." / ∞ Ω)' : 'FALLO: DERIVADO A TIERRA'}
            </span>
          </div>

          {/* Official Technical Verdict */}
          <div
            className="p-4 rounded-xl border font-secondary"
            style={{
              backgroundColor: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              borderColor: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-base)' : 'var(--status-danger-base)',
              color: evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'var(--status-success-dark)' : 'var(--status-danger-dark)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--status-success-base)' }} />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--status-danger-base)' }} />
              )}
              <h4 className="text-body font-bold uppercase tracking-wider">
                Veredicto Técnico Final: {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' ? 'APTO PARA EL SERVICIO' : 'NO APTO / REQUIERE SUSTITUCIÓN'}
              </h4>
            </div>
            <p className="text-small leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {evaluation.diagnosticoTexto}
            </p>
          </div>
        </div>

        {/* Close footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-small"
          >
            Cerrar Informe
          </button>
        </div>
      </div>
    </div>
  );
};
