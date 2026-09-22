import React, { useState } from 'react';
import { Wrench, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  symptom: string;
  cause: string;
  action: string;
  multimeterTest: string;
}

const TROUBLESHOOTING_DATA: FaqItem[] = [
  {
    question: 'El compresor intenta arrancar, zumba 3 segundos y se oye un "clic" (salta el Klixon).',
    symptom: 'Rotor bloqueado o fallo en el sistema de arranque auxiliar.',
    cause: 'Condensador de arranque descapacitado, relé de intensidad con contacto fogueado/abierto, o compresor agarrotado mecánicamente.',
    multimeterTest: 'Medir condensador con capacímetro. Probar relé R.Int: en posición normal debe marcar circuito abierto; invertido boca abajo debe dar continuidad (0 Ω).',
    action: 'Verificar relé y condensador antes de condenar el compresor. Si ambos están bien y las bobinas miden correcto, el compresor está mecánicamente trabado.',
  },
  {
    question: 'Salta el interruptor diferencial de la instalación inmediatamente al conectar la máquina.',
    symptom: 'Derivación directa a masa / fuga de corriente a tierra.',
    cause: 'Degradación del barniz aislante del devanado por sobrecalentamiento extremo o acidez en el aceite frigorífico.',
    multimeterTest: 'Poner multímetro en escala de 20MΩ o prueba de diodo/continuidad. Medir entre cada uno de los 3 bornes (C, R, S) y la carcasa de hierro raspada. NO debe marcar ningún valor finito (debe marcar "1." o infinito).',
    action: 'Compresor quemado y comunicado a masa. Reemplazo obligatorio del compresor, filtro deshidratador y limpieza del circuito.',
  },
  {
    question: 'El multímetro marca "1." (OL / Circuito Abierto) entre bornes.',
    symptom: 'El compresor no hace absolutamente nada, ni vibra ni consume corriente.',
    cause: 'Devanado cortado interiormente (bobina rota o protector térmico interno abierto).',
    multimeterTest: 'Medir R(1-2), R(2-3), R(1-3). Si dos de las medidas marcan "1." y solo una marca valor óhmico, el devanado común a las dos abiertas está cortado.',
    action: 'Dejar enfriar el compresor si tiene protector térmico interno de pastilla. Si una vez frío sigue marcando infinito, el devanado está seccionado. Cambiar compresor.',
  },
  {
    question: 'La suma de resistencias no coincide: R(Marcha) + R(Arranque) ≠ R(Marcha-Arranque).',
    symptom: 'El compresor arranca pero consume corriente excesiva (amperios por encima de la placa RLA/FLA) y calienta en exceso.',
    cause: 'Espiras en cortocircuito en el interior del estator (contacto entre hilos adyacentes por recalentamiento).',
    multimeterTest: 'Calcular el porcentaje de error: si supera el 10-15%, las bobinas han perdido espiras efectivas.',
    action: 'El motor sufrirá disparo térmico constante en días calurosos. Sustituir compresor.',
  },
  {
    question: '¿Cómo comprobar el Protector Térmico (Klixon) con el multímetro?',
    symptom: 'Verificación en banco del protector térmico con bimetal y calefactor.',
    cause: 'Disco bimetálico térmico y filamento calefactor de sobreintensidad en serie.',
    multimeterTest: 'Medición entre bornes externos accesibles 1 y 3 (el punto 2 es una unión interna sellada en la cápsula y no accesible para punteras): en frío mide la serie completa de disco bimetálico y calefactor (~2.3 Ω). Si se calienta por sobrecarga (>105°C), abre el circuito marcando "1 ." (O.L).',
    action: 'Si entre bornes 1-3 marca "1." (O.L) en frío, el bimetal o el calefactor están cortados/abiertos. En cualquiera de los casos sustituir el Klixon.',
  },
  {
    question: '¿Cómo comprobar el Relé de Intensidad (R. Int) con el multímetro?',
    symptom: 'Verificación del relé de intensidad con unión P1-P3 en sistemas RSIR y CSIR.',
    cause: 'Bobina de intensidad de hilo grueso y contacto móvil normalmente abierto por gravedad.',
    multimeterTest: '1) Contactos (P1-P2): en posición vertical de trabajo debe marcar ABIERTO ("1 ."); al invertir 180° por gravedad debe cerrar a 0.0 Ω con pitido. 2) Bobina (P1-P3): mide la resistencia de la bobina (~0.3 Ω). 3) Salida (P2-P3): en vertical O.L y en invertido 0.3 Ω.',
    action: 'Si da 0.0 Ω en vertical, los contactos están soldados. Si no cierra al invertir o la bobina marca O.L, sustituir el relé de intensidad.',
  },
];

export interface QuickTroubleshootingGuideProps {
  selectedCaseIndex?: number;
  onSelectCase?: (index: number) => void;
}

export const QuickTroubleshootingGuide: React.FC<QuickTroubleshootingGuideProps> = ({
  selectedCaseIndex = 0,
  onSelectCase,
}) => {
  const [internalOpenIndex, setInternalOpenIndex] = useState<number | null>(selectedCaseIndex);

  React.useEffect(() => {
    if (selectedCaseIndex !== undefined) {
      setInternalOpenIndex(selectedCaseIndex);
    }
  }, [selectedCaseIndex]);

  const activeIndex = selectedCaseIndex !== undefined ? selectedCaseIndex : internalOpenIndex;

  const handleToggle = (idx: number) => {
    const next = activeIndex === idx ? null : idx;
    setInternalOpenIndex(next);
    if (next !== null && onSelectCase) {
      onSelectCase(next);
    }
  };

  return (
    <div className="space-y-3 font-secondary">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-amber-500" />
          <h3 className="text-small font-bold text-slate-900 dark:text-white">
            Protocolo de Diagnóstico de Averías Frecuentes
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">6 Casos Típicos</span>
      </div>

      <div className="space-y-3">
        {TROUBLESHOOTING_DATA.map((item, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <div
              key={idx}
              className="border rounded-md overflow-hidden transition-all panel-surface"
              style={{
                borderColor: isOpen ? 'var(--accent-base)' : 'var(--border-default)',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                style={{
                  backgroundColor: isOpen ? 'var(--bg-alt)' : 'transparent',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-5 h-5 rounded-sm font-mono text-tiny font-bold flex items-center justify-center shrink-0 mt-0.5 border"
                    style={{
                      backgroundColor: isOpen ? 'var(--accent-base)' : 'var(--accent-ghost)',
                      borderColor: 'var(--accent-base)',
                      color: isOpen ? '#000000' : 'var(--accent-base)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-body font-bold">{item.question}</span>
                    {isOpen && (
                      <span className="inline-block ml-2 text-[10px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">
                        ACTIVO EN ESQUEMA SVG
                      </span>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              {isOpen && (
                <div
                  className="p-4 pt-2 border-t text-small font-secondary space-y-2.5"
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      className="p-2.5 rounded-md border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-default)',
                      }}
                    >
                      <span
                        className="text-tiny font-bold uppercase tracking-wide block"
                        style={{ color: 'var(--accent-base)' }}
                      >
                        Síntoma / Causa:
                      </span>
                      <p className="font-semibold mt-0.5">{item.symptom}</p>
                      <p className="text-tiny mt-1" style={{ color: 'var(--text-muted)' }}>
                        {item.cause}
                      </p>
                    </div>

                    <div
                      className="p-2.5 rounded-md border"
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'var(--status-info-base)',
                      }}
                    >
                      <span
                        className="text-tiny font-bold uppercase tracking-wide block"
                        style={{ color: 'var(--status-info-dark)' }}
                      >
                        Prueba con Multímetro:
                      </span>
                      <p className="mt-0.5 leading-relaxed">{item.multimeterTest}</p>
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-md border flex items-start gap-2"
                    style={{
                      backgroundColor: 'var(--status-success-bg)',
                      borderColor: 'var(--status-success-base)',
                      color: 'var(--status-success-dark)',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--status-success-base)' }} />
                    <div>
                      <span className="text-tiny font-bold uppercase tracking-wide block">
                        Acción Recomendada:
                      </span>
                      <p className="mt-0.5 font-semibold text-small">{item.action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
