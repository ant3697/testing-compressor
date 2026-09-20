import React, { useState, useMemo, useEffect } from 'react';
import { TerminalId, TerminalRole, DiagnosticEvaluation } from '../types';
import { evaluateCompressor } from '../utils/compressorDiagnosis';
import { COMPRESSOR_PRESETS } from '../data/compressorData';
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw, Sparkles, BookOpen, HelpCircle } from 'lucide-react';

interface TerminalTesterProps {
  onEvaluationChange: (evalResult: DiagnosticEvaluation) => void;
  onSelectPairForMultimeter: (pinA: TerminalId, pinB: TerminalId, val: number | null, isInf: boolean) => void;
  currentBlackPin: TerminalId | null;
  currentRedPin: TerminalId | null;
}

export const TerminalTester: React.FC<TerminalTesterProps> = ({
  onEvaluationChange,
  onSelectPairForMultimeter,
  currentBlackPin,
  currentRedPin,
}) => {
  // Input values for 3 pairs
  const [r12, setR12] = useState<string>('9.7');
  const [r23, setR23] = useState<string>('13.1');
  const [r13, setR13] = useState<string>('22.8');

  const [r12Inf, setR12Inf] = useState<boolean>(false);
  const [r23Inf, setR23Inf] = useState<boolean>(false);
  const [r13Inf, setR13Inf] = useState<boolean>(false);

  // Ground tests
  const [g1, setG1] = useState<number | null>(null);
  const [g2, setG2] = useState<number | null>(null);
  const [g3, setG3] = useState<number | null>(null);

  // Preset selected
  const [selectedPresetId, setSelectedPresetId] = useState<string>('capture_example');

  // Trigger evaluation
  const currentEvaluation = useMemo(() => {
    const val12 = r12Inf ? Infinity : parseFloat(r12);
    const val23 = r23Inf ? Infinity : parseFloat(r23);
    const val13 = r13Inf ? Infinity : parseFloat(r13);

    return evaluateCompressor(
      {
        r12: isNaN(val12) ? null : val12,
        r23: isNaN(val23) ? null : val23,
        r13: isNaN(val13) ? null : val13,
        r12Infinity: r12Inf,
        r23Infinity: r23Inf,
        r13Infinity: r13Inf,
      },
      {
        pin1ToGround: g1,
        pin2ToGround: g2,
        pin3ToGround: g3,
      }
    );
  }, [r12, r23, r13, r12Inf, r23Inf, r13Inf, g1, g2, g3]);

  useEffect(() => {
    onEvaluationChange(currentEvaluation);
  }, [currentEvaluation, onEvaluationChange]);

  // Load a preset
  const loadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = COMPRESSOR_PRESETS.find((item) => item.id === presetId);
    if (!p) return;

    if (p.id === 'fault_open_start') {
      setR12('9.7');
      setR12Inf(false);
      setR23('');
      setR23Inf(true);
      setR13('');
      setR13Inf(true);
      setG1(null);
      setG2(null);
      setG3(null);
      onSelectPairForMultimeter('pin2', 'pin3', null, true);
      return;
    }

    if (p.id === 'fault_ground_leak') {
      setR12(p.rMarcha.toString());
      setR12Inf(false);
      setR23(p.rArranque.toString());
      setR23Inf(false);
      setR13(p.rTotal.toString());
      setR13Inf(false);
      setG1(p.groundResistance);
      setG2(p.groundResistance);
      setG3(p.groundResistance);
      onSelectPairForMultimeter('pin1', 'pin2', p.rMarcha, false);
      return;
    }

    setR13(p.rMarcha.toString());
    setR13Inf(false);
    setR23(p.rArranque.toString());
    setR23Inf(false);
    setR12(p.rTotal.toString());
    setR12Inf(false);
    setG1(null);
    setG2(null);
    setG3(null);

    onSelectPairForMultimeter('pin3', 'pin1', p.rMarcha, false);
  };

  const clearValues = () => {
    setR12('');
    setR23('');
    setR13('');
    setR12Inf(false);
    setR23Inf(false);
    setR13Inf(false);
    setG1(null);
    setG2(null);
    setG3(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Preset Quick Selection */}
      <div className="panel-surface p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--accent-ghost)',
              borderColor: 'var(--accent-base)',
              color: 'var(--accent-base)',
            }}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-subtitle font-bold flex items-center gap-2">
              Datos de Medición del Multímetro
            </h3>
            <p className="text-small font-secondary" style={{ color: 'var(--text-muted)' }}>
              Introduce las 3 lecturas en ohmios (Ω) entre bornes para identificar Común, Marcha y Arranque.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => loadPreset('capture_example')}
            className="btn-primary"
            type="button"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cargar Foto (9.7 / 13.1 / 22.8 Ω)</span>
          </button>

          <select
            value={selectedPresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="input-pro font-mono text-small cursor-pointer py-1.5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="" disabled>
              Casos típicos y averías...
            </option>
            {COMPRESSOR_PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.rMarcha} / {item.rArranque} Ω)
              </option>
            ))}
          </select>

          <button
            onClick={clearValues}
            title="Limpiar medidas"
            className="btn-secondary py-1.5 px-2"
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Measurement Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pair 1-3 (In capture: C - P = 9.7 Ω) */}
        <div
          onClick={() => {
            const val = r13Inf ? null : parseFloat(r13);
            onSelectPairForMultimeter('pin3', 'pin1', isNaN(val as number) ? null : val, r13Inf);
          }}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative panel-surface ${
            (currentBlackPin === 'pin3' && currentRedPin === 'pin1') ||
            (currentBlackPin === 'pin1' && currentRedPin === 'pin3')
              ? 'ring-2'
              : 'hover:border-[var(--accent-base)]'
          }`}
          style={{
            borderColor:
              (currentBlackPin === 'pin3' && currentRedPin === 'pin1') ||
              (currentBlackPin === 'pin1' && currentRedPin === 'pin3')
                ? 'var(--accent-base)'
                : 'var(--border-default)',
            boxShadow:
              (currentBlackPin === 'pin3' && currentRedPin === 'pin1') ||
              (currentBlackPin === 'pin1' && currentRedPin === 'pin3')
                ? 'var(--shadow-glow)'
                : 'var(--shadow-soft)',
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-sm flex items-center justify-center text-tiny font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                1-3
              </span>
              <span className="text-body font-bold">Bornes 1 y 3</span>
            </div>
            {currentEvaluation.identifiedRoles.pin1 && currentEvaluation.identifiedRoles.pin3 && (
              <span
                className="text-tiny px-2 py-0.5 rounded-sm font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--status-success-bg)',
                  color: 'var(--status-success-dark)',
                  borderColor: 'var(--status-success-base)',
                }}
              >
                C — P (Marcha)
              </span>
            )}
          </div>

          <div className="mt-3">
            <label className="text-small block mb-1 font-secondary" style={{ color: 'var(--text-muted)' }}>
              Resistencia Medida:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  disabled={r13Inf}
                  value={r13Inf ? '' : r13}
                  onChange={(e) => {
                    setR13(e.target.value);
                    const val = parseFloat(e.target.value);
                    onSelectPairForMultimeter('pin3', 'pin1', isNaN(val) ? null : val, false);
                  }}
                  placeholder={r13Inf ? 'OL (Abierto)' : 'ej. 9.7'}
                  className="input-pro w-full text-title font-bold pr-8"
                />
                <span
                  className="absolute right-3 top-2.5 text-body font-mono font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ω
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setR13Inf(!r13Inf);
                  onSelectPairForMultimeter('pin3', 'pin1', null, !r13Inf);
                }}
                className={`px-2.5 py-2 text-small font-mono font-bold rounded-md border transition-all cursor-pointer ${
                  r13Inf
                    ? 'border-[var(--status-danger-base)] text-[var(--status-danger-dark)]'
                    : 'btn-secondary'
                }`}
                style={{
                  backgroundColor: r13Inf ? 'var(--status-danger-bg)' : undefined,
                }}
                title="Simular circuito abierto / corte"
              >
                OL
              </button>
            </div>
          </div>
          <span className="text-tiny block mt-2 font-secondary" style={{ color: 'var(--text-muted)' }}>
            Haz clic para conectar multímetro
          </span>
        </div>

        {/* Pair 2-3 (In capture: C - A = 13.1 Ω) */}
        <div
          onClick={() => {
            const val = r23Inf ? null : parseFloat(r23);
            onSelectPairForMultimeter('pin3', 'pin2', isNaN(val as number) ? null : val, r23Inf);
          }}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative panel-surface ${
            (currentBlackPin === 'pin3' && currentRedPin === 'pin2') ||
            (currentBlackPin === 'pin2' && currentRedPin === 'pin3')
              ? 'ring-2'
              : 'hover:border-[var(--accent-base)]'
          }`}
          style={{
            borderColor:
              (currentBlackPin === 'pin3' && currentRedPin === 'pin2') ||
              (currentBlackPin === 'pin2' && currentRedPin === 'pin3')
                ? 'var(--accent-base)'
                : 'var(--border-default)',
            boxShadow:
              (currentBlackPin === 'pin3' && currentRedPin === 'pin2') ||
              (currentBlackPin === 'pin2' && currentRedPin === 'pin3')
                ? 'var(--shadow-glow)'
                : 'var(--shadow-soft)',
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-sm flex items-center justify-center text-tiny font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                2-3
              </span>
              <span className="text-body font-bold">Bornes 2 y 3</span>
            </div>
            {currentEvaluation.identifiedRoles.pin2 && currentEvaluation.identifiedRoles.pin3 && (
              <span
                className="text-tiny px-2 py-0.5 rounded-sm font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--status-warning-bg)',
                  color: 'var(--status-warning-dark)',
                  borderColor: 'var(--status-warning-base)',
                }}
              >
                C — A (Arranque)
              </span>
            )}
          </div>

          <div className="mt-3">
            <label className="text-small block mb-1 font-secondary" style={{ color: 'var(--text-muted)' }}>
              Resistencia Medida:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  disabled={r23Inf}
                  value={r23Inf ? '' : r23}
                  onChange={(e) => {
                    setR23(e.target.value);
                    const val = parseFloat(e.target.value);
                    onSelectPairForMultimeter('pin3', 'pin2', isNaN(val) ? null : val, false);
                  }}
                  placeholder={r23Inf ? 'OL (Abierto)' : 'ej. 13.1'}
                  className="input-pro w-full text-title font-bold pr-8"
                />
                <span
                  className="absolute right-3 top-2.5 text-body font-mono font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ω
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setR23Inf(!r23Inf);
                  onSelectPairForMultimeter('pin3', 'pin2', null, !r23Inf);
                }}
                className={`px-2.5 py-2 text-small font-mono font-bold rounded-md border transition-all cursor-pointer ${
                  r23Inf
                    ? 'border-[var(--status-danger-base)] text-[var(--status-danger-dark)]'
                    : 'btn-secondary'
                }`}
                style={{
                  backgroundColor: r23Inf ? 'var(--status-danger-bg)' : undefined,
                }}
                title="Simular circuito abierto / corte"
              >
                OL
              </button>
            </div>
          </div>
          <span className="text-tiny block mt-2 font-secondary" style={{ color: 'var(--text-muted)' }}>
            Haz clic para conectar multímetro
          </span>
        </div>

        {/* Pair 1-2 (In capture: P - A = 22.8 Ω) */}
        <div
          onClick={() => {
            const val = r12Inf ? null : parseFloat(r12);
            onSelectPairForMultimeter('pin1', 'pin2', isNaN(val as number) ? null : val, r12Inf);
          }}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 relative panel-surface ${
            (currentBlackPin === 'pin1' && currentRedPin === 'pin2') ||
            (currentBlackPin === 'pin2' && currentRedPin === 'pin1')
              ? 'ring-2'
              : 'hover:border-[var(--accent-base)]'
          }`}
          style={{
            borderColor:
              (currentBlackPin === 'pin1' && currentRedPin === 'pin2') ||
              (currentBlackPin === 'pin2' && currentRedPin === 'pin1')
                ? 'var(--accent-base)'
                : 'var(--border-default)',
            boxShadow:
              (currentBlackPin === 'pin1' && currentRedPin === 'pin2') ||
              (currentBlackPin === 'pin2' && currentRedPin === 'pin1')
                ? 'var(--shadow-glow)'
                : 'var(--shadow-soft)',
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-sm flex items-center justify-center text-tiny font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                1-2
              </span>
              <span className="text-body font-bold">Bornes 1 y 2</span>
            </div>
            {currentEvaluation.identifiedRoles.pin1 && currentEvaluation.identifiedRoles.pin2 && (
              <span
                className="text-tiny px-2 py-0.5 rounded-sm font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--accent-ghost)',
                  color: 'var(--accent-base)',
                  borderColor: 'var(--accent-base)',
                }}
              >
                P — A (Suma Total)
              </span>
            )}
          </div>

          <div className="mt-3">
            <label className="text-small block mb-1 font-secondary" style={{ color: 'var(--text-muted)' }}>
              Resistencia Medida:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  disabled={r12Inf}
                  value={r12Inf ? '' : r12}
                  onChange={(e) => {
                    setR12(e.target.value);
                    const val = parseFloat(e.target.value);
                    onSelectPairForMultimeter('pin1', 'pin2', isNaN(val) ? null : val, false);
                  }}
                  placeholder={r12Inf ? 'OL (Abierto)' : 'ej. 22.8'}
                  className="input-pro w-full text-title font-bold pr-8"
                />
                <span
                  className="absolute right-3 top-2.5 text-body font-mono font-bold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Ω
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setR12Inf(!r12Inf);
                  onSelectPairForMultimeter('pin1', 'pin2', null, !r12Inf);
                }}
                className={`px-2.5 py-2 text-small font-mono font-bold rounded-md border transition-all cursor-pointer ${
                  r12Inf
                    ? 'border-[var(--status-danger-base)] text-[var(--status-danger-dark)]'
                    : 'btn-secondary'
                }`}
                style={{
                  backgroundColor: r12Inf ? 'var(--status-danger-bg)' : undefined,
                }}
                title="Simular circuito abierto / corte"
              >
                OL
              </button>
            </div>
          </div>
          <span className="text-tiny block mt-2 font-secondary" style={{ color: 'var(--text-muted)' }}>
            Haz clic para conectar multímetro
          </span>
        </div>
      </div>

      {/* Rules of thumb from the capture */}
      <div className="panel-surface p-5">
        <h4
          className="text-small font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
          style={{ color: 'var(--accent-base)' }}
        >
          <HelpCircle className="w-4 h-4" />
          Reglas del Manual (Identificación por jerarquía de resistencias)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className="rounded-md p-3 border"
            style={{
              backgroundColor: 'var(--status-success-bg)',
              borderColor: 'var(--status-success-base)',
            }}
          >
            <div
              className="flex items-center gap-2 text-small font-bold mb-1"
              style={{ color: 'var(--status-success-dark)' }}
            >
              <span
                className="w-2 h-2 rounded-circle"
                style={{ backgroundColor: 'var(--status-success-base)' }}
              ></span>
              Resistencia Menor
            </div>
            <p className="text-body font-semibold">Devanado de marcha (R / P)</p>
            <p className="text-small font-secondary mt-1" style={{ color: 'var(--text-muted)' }}>
              Bobina de hilo más grueso con menor resistencia óhmica. En la foto:{' '}
              <strong style={{ color: 'var(--status-success-dark)' }}>9.7 Ω</strong>.
            </p>
          </div>

          <div
            className="rounded-md p-3 border"
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              borderColor: 'var(--status-warning-base)',
            }}
          >
            <div
              className="flex items-center gap-2 text-small font-bold mb-1"
              style={{ color: 'var(--status-warning-dark)' }}
            >
              <span
                className="w-2 h-2 rounded-circle"
                style={{ backgroundColor: 'var(--status-warning-base)' }}
              ></span>
              Resistencia Intermedia
            </div>
            <p className="text-body font-semibold">Devanado de arranque (S / A)</p>
            <p className="text-small font-secondary mt-1" style={{ color: 'var(--text-muted)' }}>
              Bobina de hilo más fino con mayor resistencia. En la foto:{' '}
              <strong style={{ color: 'var(--status-warning-dark)' }}>13.1 Ω</strong>.
            </p>
          </div>

          <div
            className="rounded-md p-3 border"
            style={{
              backgroundColor: 'var(--accent-ghost)',
              borderColor: 'var(--accent-base)',
            }}
          >
            <div
              className="flex items-center gap-2 text-small font-bold mb-1"
              style={{ color: 'var(--accent-base)' }}
            >
              <span
                className="w-2 h-2 rounded-circle"
                style={{ backgroundColor: 'var(--accent-base)' }}
              ></span>
              Resistencia Mayor
            </div>
            <p className="text-body font-semibold">Entre terminales de Marcha y Arranque</p>
            <p className="text-small font-secondary mt-1" style={{ color: 'var(--text-muted)' }}>
              Es la suma en serie de ambos devanados:{' '}
              <strong style={{ color: 'var(--accent-base)' }}>9.7 + 13.1 = 22.8 Ω</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Formula & Diagnostic Card */}
      {currentEvaluation.veredictoGlobal !== 'INCOMPLETO' && (
        <div className="panel-glass p-5">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div>
              <span
                className="text-tiny font-mono uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                Dictamen Técnico
              </span>
              <h3 className="text-subtitle font-bold flex items-center gap-2 mt-0.5">
                {currentEvaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' && (
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--status-success-dark)' }} />
                )}
                {currentEvaluation.veredictoGlobal === 'BOBINADO_DANADO' && (
                  <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-warning-dark)' }} />
                )}
                {currentEvaluation.veredictoGlobal === 'DERIVADO_A_MASA' && (
                  <XCircle className="w-5 h-5" style={{ color: 'var(--status-danger-dark)' }} />
                )}
                <span>
                  {currentEvaluation.veredictoGlobal === 'APTO_PARA_SERVICIO' &&
                    'Compresor Apto para Servicio'}
                  {currentEvaluation.veredictoGlobal === 'BOBINADO_DANADO' &&
                    'Avería en Bobinados (No Apto)'}
                  {currentEvaluation.veredictoGlobal === 'DERIVADO_A_MASA' &&
                    'Compresor Derivado a Masa (Peligro)'}
                </span>
              </h3>
            </div>

            {/* Sum check badge */}
            {currentEvaluation.rTotalCalculada !== null &&
              currentEvaluation.rTotalMedida !== null && (
                <div
                  className="flex items-center gap-3 px-3 py-1.5 rounded-md border font-mono text-small"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>R(M) + R(A):</span>{' '}
                    <strong style={{ color: 'var(--accent-base)' }}>
                      {currentEvaluation.rMarcha} + {currentEvaluation.rArranque} ={' '}
                      {currentEvaluation.rTotalCalculada} Ω
                    </strong>
                  </div>
                  <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-strong)' }}></div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Medido:</span>{' '}
                    <strong style={{ color: 'var(--status-info-dark)' }}>
                      {currentEvaluation.rTotalMedida} Ω
                    </strong>
                  </div>
                  <div className="h-4 w-px" style={{ backgroundColor: 'var(--border-strong)' }}></div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Error:</span>{' '}
                    <span
                      className="font-bold"
                      style={{
                        color:
                          (currentEvaluation.desviacionPorcentual ?? 0) <= 5
                            ? 'var(--status-success-dark)'
                            : (currentEvaluation.desviacionPorcentual ?? 0) <= 10
                            ? 'var(--status-warning-dark)'
                            : 'var(--status-danger-dark)',
                      }}
                    >
                      {currentEvaluation.desviacionPorcentual}%
                    </span>
                  </div>
                </div>
              )}
          </div>

          <p className="text-body font-secondary mt-4 leading-relaxed">
            {currentEvaluation.diagnosticoTexto}
          </p>

          {/* Details list */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentEvaluation.detallesTecnicos.map((detail, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-small font-secondary p-2 rounded-md border"
                style={{
                  backgroundColor: 'var(--bg-alt)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span className="font-bold mt-0.5" style={{ color: 'var(--accent-base)' }}>
                  •
                </span>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {currentEvaluation.alertas.length > 0 && (
            <div
              className="mt-4 p-3 rounded-md border text-small font-secondary flex items-start gap-2.5"
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                borderColor: 'var(--status-danger-base)',
                color: 'var(--status-danger-dark)',
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--status-danger-base)' }} />
              <div className="space-y-1">
                {currentEvaluation.alertas.map((al, idx) => (
                  <p key={idx} className="font-semibold">
                    {al}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
