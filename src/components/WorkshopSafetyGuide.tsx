import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Droplets,
  Zap,
  Eye,
  Clock,
  CheckCircle2,
  Flame,
  FileCheck
} from 'lucide-react';

export const WorkshopSafetyGuide: React.FC = () => {
  return (
    <div className="space-y-4 font-secondary">
      {/* Header Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-400/30 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500 text-black shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Buenas Prácticas de Taller y Seguridad Eléctrica
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 font-bold uppercase">
              Normas Maestro Cifu
            </span>
          </h3>
          <p className="text-tiny text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Precauciones indispensables al probar compresores frigoríficos herméticos en banco de trabajo para evitar accidentes, proyecciones de aceite y la degradación química irreversible del lubricante.
          </p>
        </div>
      </div>

      {/* Grid of Safety Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-small">
        {/* Rule 1: Oil Projections */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
            <Eye className="w-4 h-4 shrink-0" />
            <h4 className="text-tiny font-bold uppercase tracking-wide">
              1. Protección contra Proyecciones de Aceite
            </h4>
          </div>
          <p className="text-tiny text-slate-600 dark:text-slate-300 leading-relaxed">
            Al arrancar un compresor con las tomas abiertas en el banco, el borboteo interior y la compresión expulsan una niebla violenta de aceite por la descarga.
          </p>
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>
              <strong>Medida de taller:</strong> Colocar siempre un trapo grueso o deflector en la boca de descarga y usar gafas de seguridad. Nunca asomarse directamente a las tuberías.
            </span>
          </div>
        </div>

        {/* Rule 2: Atmospheric Air and Moisture Limit */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
            <Clock className="w-4 h-4 shrink-0" />
            <h4 className="text-tiny font-bold uppercase tracking-wide">
              2. Límite de Funcionamiento con Aire (Humedad)
            </h4>
          </div>
          <p className="text-tiny text-slate-600 dark:text-slate-300 leading-relaxed">
            Los aceites sintéticos modernos (<strong>POE / PAG</strong>) son sumamente higroscópicos. Aspirar aire húmedo del taller durante minutos provoca hidrólisis, generando ácidos orgánicos que disuelven el barniz de los bobinados.
          </p>
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              <strong>Tiempo límite:</strong> No mantener el compresor comprimiendo aire ambiente más de <strong>15 a 30 segundos seguidos</strong>. Sellar las tomas inmediatamente tras la prueba.
            </span>
          </div>
        </div>

        {/* Rule 3: Capacitor Discharge */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
            <Zap className="w-4 h-4 shrink-0" />
            <h4 className="text-tiny font-bold uppercase tracking-wide">
              3. Descarga Segura de Condensadores
            </h4>
          </div>
          <p className="text-tiny text-slate-600 dark:text-slate-300 leading-relaxed">
            Los condensadores de arranque (electrolíticos) y de marcha (permanentes) acumulan cargas de <strong>hasta 350-400V</strong> que permanecen incluso con el equipo apagado.
          </p>
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              <strong>Procedimiento:</strong> Descargar con una resistencia de <strong>20 kΩ / 5W</strong> puenteando bornes. <em>Jamás puentear con destornillador</em> (daña el dieléctrico interno y genera fogonazo).
            </span>
          </div>
        </div>

        {/* Rule 4: Deep Vacuum Start Prohibition */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
            <Flame className="w-4 h-4 shrink-0" />
            <h4 className="text-tiny font-bold uppercase tracking-wide">
              4. Prohibición de Arrancar en Vacío Profundo
            </h4>
          </div>
          <p className="text-tiny text-slate-600 dark:text-slate-300 leading-relaxed">
            En el vacío profundo, la rigidez dieléctrica de los gases residuales disminuye drásticamente según la ley de Paschen.
          </p>
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
            <span>
              <strong>Peligro mortal de arco:</strong> Alimentar 230V a un compresor mientras la bomba de vacío está conectada provocará un arco voltaico entre los terminales pasamuros, perforando el cristal y expulsando gas y fuego.
            </span>
          </div>
        </div>
      </div>

      {/* Earth Ground Checklist */}
      <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 text-tiny flex items-start gap-2.5">
        <FileCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-emerald-800 dark:text-emerald-300 block font-bold">
            Conexión de Tierra Obligatoria en Banco (Protección de Vida)
          </strong>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Antes de pulsar «ENERGIZAR 230V», conecta siempre la pinza de tierra (PE) al terminal de chasis metálico raspado del compresor. En caso de fallo súbito del aislamiento del devanado, disparará el diferencial del cuadro de taller evitando una descarga eléctrica letal al técnico.
          </p>
        </div>
      </div>
    </div>
  );
};
