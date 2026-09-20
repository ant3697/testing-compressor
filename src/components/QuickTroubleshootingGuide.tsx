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
    symptom: 'Verificación previa de componentes auxiliares.',
    cause: 'Bimetal que abre por calor o sobreintensidad.',
    multimeterTest: 'Desconectar el Klixon del compresor. Medir resistencia entre sus 2 terminales en frío con el multímetro: DEBE marcar continuidad casi 0 Ω (0.0 a 0.2 Ω).',
    action: 'Si en frío marca "1." (infinito), el Klixon está quemado con los contactos abiertos. Sustituir Klixon.',
  },
  {
    question: '¿Cómo comprobar el Relé Amperimétrico (R. Int) con el multímetro?',
    symptom: 'Verificación del relé de corriente en sistemas RSIR y CSIR.',
    cause: 'Bobina de corriente y contacto normalmente abierto por gravedad.',
    multimeterTest: '1) Con el relé en su posición vertical de trabajo: medir entre terminales de contacto -> Debe marcar ABIERTO ("1."). 2) Dar la vuelta al relé (boca abajo) para que caiga la armadura por gravedad -> Debe marcar CONTINUIDAD (0 Ω).',
    action: 'Si no cierra al invertirlo o no abre al ponerlo derecho, el relé está trabado o sus contactos quemados. Sustituir relé.',
  },
];

export const QuickTroubleshootingGuide: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
          const isOpen = openIndex === idx;
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
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                style={{
                  backgroundColor: isOpen ? 'var(--bg-alt)' : 'transparent',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-5 h-5 rounded-sm font-mono text-tiny font-bold flex items-center justify-center shrink-0 mt-0.5 border"
                    style={{
                      backgroundColor: 'var(--accent-ghost)',
                      borderColor: 'var(--accent-base)',
                      color: 'var(--accent-base)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-body font-bold">{item.question}</span>
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
