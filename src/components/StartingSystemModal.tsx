import React, { useEffect, useState } from 'react';
import { X, Play, AlertTriangle, RefreshCw, Zap, CheckCircle2, Info, ChevronLeft, ChevronRight, Activity, Cable } from 'lucide-react';
import { IntuitiveSchematicDiagram, SchematicVariant } from './IntuitiveSchematicDiagram';
import { RealCompressorWiringSimulation } from './RealCompressorWiringSimulation';

interface StartingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVariant: SchematicVariant;
}

interface VariantDetail {
  id: SchematicVariant;
  name: string;
  shortName: string;
  category: 'LST (Bajo Par)' | 'HST (Alto Par)';
  subCategory: string;
  expansionType: string;
  description: string;
  bornesGuide: {
    borne: string;
    connection: string;
    role: string;
  }[];
  disconnectionMechanism: string;
  capacitorRole?: string;
  commonFailures: string[];
}

const VARIANT_DETAILS: Record<SchematicVariant, VariantDetail> = {
  RSIR_RELE: {
    id: 'RSIR_RELE',
    name: 'RSIR con Relé de Arranque Amperimétrico',
    shortName: 'RSIR (Relé)',
    category: 'LST (Bajo Par)',
    subCategory: 'Resistant Start Induction Run',
    expansionType: 'Tubo Capilar (Presiones equilibradas en parada)',
    description:
      'Arranque puramente resistivo. El devanado de arranque tiene hilo más fino y mayor resistencia, creando un desfase natural de unos 30° respecto al devanado de marcha para iniciar el giro.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de Motor (Klixon)', role: 'Punto común de alimentación para ambos devanados.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 pasando por la bobina del relé', role: 'Devanado principal de régimen permanente (baja resistencia).' },
      { borne: 'S (Arranque)', connection: 'Contacto normalmente abierto (N.A.) del relé', role: 'Devanado auxiliar de arranque. Se energiza solo durante 1-2 segundos.' },
    ],
    disconnectionMechanism:
      'Al conectar tensión, la corriente de rotor parado es 4 a 6 veces la nominal. Esta alta corriente atraviesa la bobina del relé, creando un campo magnético que eleva el émbolo y cierra el contacto hacia S. Al acelerar el motor, la corriente cae, el electroimán pierde fuerza y el contacto cae por gravedad, desconectando el devanado auxiliar S.',
    commonFailures: [
      'Bobina del relé cortada o fogueada (el compresor intenta arrancar pero solo zumba y salta por Klixon).',
      'Contactos del relé soldados o pegados (el devanado S queda conectado permanentemente, provocando calentamiento extremo y corte térmico).',
      'Relé montado invertido (si se instala boca abajo, el émbolo cae por gravedad y cierra el contacto permanentemente).',
    ],
  },
  RSIR_PTC: {
    id: 'RSIR_PTC',
    name: 'RSIR con Termistor PTC (Estado Sólido)',
    shortName: 'RSIR (PTC)',
    category: 'LST (Bajo Par)',
    subCategory: 'Resistant Start Induction Run',
    expansionType: 'Tubo Capilar (Requiere 3-5 min de parada para enfriamiento)',
    description:
      'Sustituye el relé electromecánico por una pastilla semiconductora cerámica PTC (Positive Temperature Coefficient). No tiene partes móviles, no genera arcos eléctricos y es completamente silencioso.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de Motor (Klixon)', role: 'Punto común de ambos devanados.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 directa', role: 'Devanado principal energizado de forma continua.' },
      { borne: 'S (Arranque)', connection: 'A través de la pastilla cerámica PTC desde C2', role: 'Alimentado en frío; se bloquea térmicamente al calentarse.' },
    ],
    disconnectionMechanism:
      'En reposo a temperatura ambiente, la pastilla PTC presenta muy baja resistencia (15 a 25 Ω). Al conectar corriente, circula corriente hacia S creando el par de arranque. En menos de 0.5 a 1.5 segundos, el paso de corriente calienta la pastilla a más de 120 °C; a esa temperatura crítica, su resistencia salta bruscamente a más de 10.000 Ω, reduciendo la corriente residual a unos pocos miliamperios (desconexión virtual del devanado S).',
    commonFailures: [
      'Pastilla cerámica agrietada, pulverizada o carbonizada (el compresor no arranca y corta por Klixon en 4 segundos).',
      'Re-arranque inmediato tras un microcorte: la PTC continúa caliente (>100°C) con alta resistencia, impidiendo el paso de corriente a S. El motor zumba sin par hasta cortar por térmico.',
    ],
  },
  RSCR_RELE: {
    id: 'RSCR_RELE',
    name: 'RSCR con Relé de Arranque + Condensador de Marcha',
    shortName: 'RSCR (Relé + Cond.)',
    category: 'LST (Bajo Par)',
    subCategory: 'Resistant Start Capacitor Run',
    expansionType: 'Tubo Capilar (Alta eficiencia energética)',
    description:
      'Añade un condensador de marcha permanente conectado en paralelo con el contacto del relé (puente directo entre los bornes S y R). Aporta par motriz continuo y mejora notablemente el factor de potencia.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector Klixon', role: 'Alimentación común protegida.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 a través de bobina del relé', role: 'Conexión al devanado principal y borne inferior del condensador de marcha.' },
      { borne: 'S (Arranque)', connection: 'Contacto de relé + borne superior del condensador de marcha', role: 'Recibe corriente directa durante el arranque y corriente desfasada en marcha.' },
    ],
    disconnectionMechanism:
      'El relé desconecta la vía directa de alta corriente desde C2. Sin embargo, el devanado auxiliar S no queda completamente desconectado: sigue recibiendo una corriente senoidal desfasada 90° a través del condensador permanente de marcha conectado entre S y R, colaborando en el giro continuo.',
    capacitorRole:
      'Condensador de marcha (2 a 6 µF, 400-450 VAC, polipropileno autorregenerable). Diseñado para trabajo continuo ininterrumpido. Aumenta el par motor, reduce el consumo de amperios en un 15-20% y eleva el cos φ a casi 0.95.',
    commonFailures: [
      'Condensador descapacitado o en circuito abierto (el motor arranca pero consume más amperios de lo normal y la carcasa se sobrecalienta).',
      'Condensador cortocircuitado (quema la bobina auxiliar de arranque o funde el fusible de línea).',
    ],
  },
  RSCR_PTC: {
    id: 'RSCR_PTC',
    name: 'RSCR con Termistor PTC + Condensador de Marcha',
    shortName: 'RSCR (PTC + Cond.)',
    category: 'LST (Bajo Par)',
    subCategory: 'Resistant Start Capacitor Run',
    expansionType: 'Tubo Capilar (Estándar en refrigeración doméstica moderna A+++)',
    description:
      'El esquema más utilizado en frigoríficos y congeladores domésticos modernos. Combina la fiabilidad sin desgaste mecánico del relé PTC con la alta eficiencia energética del condensador permanente.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de Motor', role: 'Punto común de alimentación.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 directa + Borne inferior del Condensador', role: 'Devanado principal.' },
      { borne: 'S (Arranque)', connection: 'Salida de PTC + Borne superior del Condensador', role: 'Devanado auxiliar con alimentación permanente capacitiva.' },
    ],
    disconnectionMechanism:
      'Durante el primer segundo, la PTC fría alimenta con fuerza el borne S. Al calentarse la PTC, su resistencia se hace enorme y la corriente principal busca el camino a través del condensador de marcha, quedando el motor en régimen permanente con devanado auxiliar activo desfasado.',
    capacitorRole:
      'Condensador de régimen continuo (3 a 5 µF, 400V). Garantiza un giro más suave, con menor vibración acústica y menor calentamiento del estator.',
    commonFailures: [
      'Pérdida de capacidad del condensador por calor del compresor.',
      'Degradación de la pastilla PTC con el paso de los años.',
    ],
  },
  CSIR_RELE: {
    id: 'CSIR_RELE',
    name: 'CSIR: Capacitor Start - Induction Run',
    shortName: 'CSIR (Alto Par)',
    category: 'HST (Alto Par)',
    subCategory: 'Alto Par de Arranque con Condensador Electrolítico',
    expansionType: 'Válvula de Expansión Termostática (TXV) o Capilar sin equilibrar',
    description:
      'Sistema para aplicaciones comerciales (vitrinas, botelleros, cámaras frigoríficas) donde el compresor debe vencer altas contrapresiones de gas refrigerante al arrancar.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector Térmico', role: 'Alimentación común.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 pasando por bobina de relé', role: 'Bobina de régimen.' },
      { borne: 'S (Arranque)', connection: 'Relé de corriente en serie con Condensador de Arranque', role: 'Devanado auxiliar con inyección de par extremo.' },
    ],
    disconnectionMechanism:
      'El condensador de arranque electrolítico de alta capacidad (60-160 µF) genera un desfase perfecto de casi 90° entre corrientes. Una vez que el compresor alcanza el 75-80% de su velocidad nominal, la corriente cae, el relé abre su contacto y desconecta el condensador electrolítico para evitar que explote.',
    capacitorRole:
      'Condensador electrolítico no polarizado de alta capacidad (60 a 160 µF, 250-330 VAC). OJO: Solo puede soportar estar conectado durante 2 o 3 segundos consecutivos; no tolera régimen continuo.',
    commonFailures: [
      'Explosión o hinchamiento del condensador si el relé queda soldado.',
      'Resistencia de descarga (15-20 kΩ) desoldada entre bornes del condensador.',
    ],
  },
  HST_CSR_RELE: {
    id: 'HST_CSR_RELE',
    name: 'CSR con Relé de Arranque (Capacitor Star Run)',
    shortName: 'CSR (Relé)',
    category: 'HST (Alto Par)',
    subCategory: 'CSR según Lámina Oficial - Desconexión por Relé',
    expansionType: 'Válvula de Expansión (TXV) y Tubo Capilar de Alto Par',
    description:
      'Esquema superior izquierdo de la lámina oficial HST. El condensador electrolítico de arranque está en serie con el contacto normalmente abierto del relé de corriente amperométrico.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 pasando por el Protector de motor (Klixon)', role: 'Punto común de alimentación para ambos devanados.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 atravesando la bobina del relé de arranque', role: 'Alimenta el devanado principal y excita el electroimán de arranque.' },
      { borne: 'S (Arranque)', connection: 'Contacto N.A. del relé en serie con Condensador de Arranque', role: 'Recibe fuerte inyección capacitiva de par durante el pico inicial.' },
    ],
    disconnectionMechanism:
      'Al conectar la red, la corriente de arranque es muy alta y activa la bobina del relé, cerrando su contacto. La corriente circula a través del condensador de arranque hacia el borne S. Al acelerar el rotor, la corriente cae por debajo del umbral del relé, el contacto se abre por gravedad y el condensador de arranque queda totalmente desconectado.',
    capacitorRole:
      'Condensador de arranque electrolítico (60 a 160 µF, 250-330 VAC). Trabajo exclusivamente intermitente (1 a 2 segundos).',
    commonFailures: [
      'Relé trabado con contacto pegado: el condensador no se desconecta y se sobrecalienta o estalla.',
      'Condensador descapacitado: el compresor zumba con rotor bloqueado y salta por el protector Klixon.',
    ],
  },
  HST_CSR_PTC: {
    id: 'HST_CSR_PTC',
    name: 'CSR con PTC (Capacitor Star Run)',
    shortName: 'CSR (PTC)',
    category: 'HST (Alto Par)',
    subCategory: 'CSR según Lámina Oficial - Desconexión Térmica de Estado Sólido',
    expansionType: 'Válvula de Expansión y Sistemas Comerciales Ligeros',
    description:
      'Esquema superior derecho de la lámina oficial HST. Sustituye el relé electromecánico por un termistor cerámico PTC en serie con el condensador de arranque.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de motor Klixon', role: 'Alimentación común protegida frente a sobreintensidad y temperatura.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 directa al borne R', role: 'Devanado de régimen continuo sin caídas de tensión.' },
      { borne: 'S (Arranque)', connection: 'Línea C2 a través de PTC y Condensador de arranque en serie', role: 'Devanado auxiliar con inyección de par inicial.' },
    ],
    disconnectionMechanism:
      'En reposo la pastilla PTC está fría y presenta baja resistencia (~15-25 Ω). Al conectar corriente, circula un intenso flujo hacia el condensador de arranque y el borne S. En menos de 1 segundo, la PTC se autocalienta a >120°C, disparando su resistencia a miles de ohmios y bloqueando prácticamente la corriente hacia el condensador de arranque.',
    capacitorRole:
      'Condensador de arranque (50 a 100 µF, 250-330 VAC). Desconectado térmicamente por el bloqueo de alta resistencia de la pastilla PTC.',
    commonFailures: [
      'Intento de re-arranque antes de enfriar la PTC (requiere ~3-5 min de pausa tras un corte de luz).',
      'Pastilla PTC fracturada o quemada por picos de tensión.',
    ],
  },
  HST_CSIR_RELE: {
    id: 'HST_CSIR_RELE',
    name: 'CSIR con Relé de Arranque + Condensador de Marcha',
    shortName: 'CSIR (Relé + 2 Cond.)',
    category: 'HST (Alto Par)',
    subCategory: 'CSIR según Lámina Oficial (Marco Rojo) - Doble Condensador con Relé',
    expansionType: 'Válvula de Expansión (TXV) - Cámaras, Vitrinas y Congelación',
    description:
      'Esquema inferior izquierdo de la lámina oficial HST (enmarcado en rojo). Combina el par brutal del condensador de arranque gobernado por relé con la eficiencia continua de un condensador permanente de marcha conectado entre bornes S y R.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de motor (Klixon)', role: 'Punto común de ambos devanados.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 vía bobina de relé + Terminal inferior del Condensador de Marcha', role: 'Devanado principal y referencia de fase para el condensador de marcha.' },
      { borne: 'S (Arranque)', connection: 'Salida del Condensador de arranque (vía relé) + Terminal superior del Condensador de Marcha', role: 'Devanado auxiliar que trabaja en arranque con 2 condensadores en paralelo y en marcha con el de régimen.' },
    ],
    disconnectionMechanism:
      'Durante el primer segundo, el relé conecta el condensador de arranque en paralelo con el de marcha, sumando capacidades (ej: 80 µF + 15 µF = 95 µF) para un par de arranque máximo. Al coger revoluciones, el relé abre su contacto y desconecta el de arranque; el condensador de marcha permanente queda en servicio continuo entre S y R.',
    capacitorRole:
      'Doble condensador: Condensador de arranque (60-120 µF intermitente) para empuje inicial + Condensador de marcha (10-30 µF, 400-450 VAC continuo) para cos φ ~ 0.95 y bajo consumo.',
    commonFailures: [
      'Pérdida de capacidad en el condensador de marcha: aumento de consumo eléctrico y sobrecalentamiento del compresor.',
      'Contacto del relé fogueado que no desconecta el condensador electrolítico.',
    ],
  },
  HST_CSIR_PTC: {
    id: 'HST_CSIR_PTC',
    name: 'CSIR con PTC + Condensador de Marcha',
    shortName: 'CSIR (PTC + 2 Cond.)',
    category: 'HST (Alto Par)',
    subCategory: 'CSIR según Lámina Oficial (Marco Rojo) - Doble Condensador con PTC',
    expansionType: 'Válvula de Expansión y Compresores Comerciales Eficientes',
    description:
      'Esquema inferior derecho de la lámina oficial HST (enmarcado en rojo). Emplea termistor PTC para desconectar el condensador de arranque y mantiene un condensador de marcha permanente conectado entre bornes S y R.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector de motor', role: 'Alimentación común protegida térmicamente.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 directa + Borne inferior del Condensador de Marcha', role: 'Devanado principal.' },
      { borne: 'S (Arranque)', connection: 'Salida de PTC con Cond. Arranque + Borne superior del Condensador de Marcha', role: 'Devanado auxiliar con doble capacidad en arranque y régimen continuo capacitivo.' },
    ],
    disconnectionMechanism:
      'Al arrancar, la PTC conduce sumando el condensador de arranque al de marcha. Al calentarse la PTC (>120°C), se aísla el condensador de arranque y el motor continúa funcionando de forma óptima gracias al condensador de marcha permanente entre S y R.',
    capacitorRole:
      'Doble condensador: Condensador de arranque electrolítico con desconexión por PTC + Condensador de marcha permanente de polipropileno (400V) para trabajo continuo.',
    commonFailures: [
      'Degradación térmica de la pastilla PTC tras años de servicio.',
      'Falla del condensador permanente que obliga a trabajar en régimen desequilibrado.',
    ],
  },
  CSR_POTENCIAL: {
    id: 'CSR_POTENCIAL',
    name: 'CSR: Capacitor Start and Run (Relé Voltimétrico)',
    shortName: 'CSR (Potencial)',
    category: 'HST (Alto Par)',
    subCategory: 'Máximo Par y Máxima Eficiencia (Relé de Potencial)',
    expansionType: 'Válvulas TXV comerciales y climatización industrial',
    description:
      'El sistema monofásico más avanzado y potente. Utiliza dos condensadores (uno electrolítico de arranque y otro de marcha permanente) gobernados por un relé voltimétrico de potencial.',
    bornesGuide: [
      { borne: 'C (Común)', connection: 'Línea C1 vía Protector Térmico', role: 'Alimentación común.' },
      { borne: 'R (Marcha)', connection: 'Línea C2 directa', role: 'Devanado principal.' },
      { borne: 'S (Arranque)', connection: 'Contacto N.C. con Condensador de Arranque + Condensador de Marcha', role: 'Máximo par en arranque y máxima eficiencia en marcha.' },
    ],
    disconnectionMechanism:
      'El contacto del relé de potencial es normalmente cerrado (N.C.). Al arrancar, ambos condensadores suman su capacidad en paralelo hacia S. Conforme el motor gana revoluciones, la tensión inducida (f.e.m. inversa) en el devanado auxiliar supera los 300-400 V, excitando la bobina del relé que abre el contacto y saca del circuito el condensador de arranque.',
    capacitorRole:
      'Doble condensador: Condensador de arranque electrolítico (80-120 µF) para el empuje inicial + Condensador de marcha (15-35 µF) permanente.',
    commonFailures: [
      'Bobina voltimétrica del relé quemada: el contacto nunca abre y el condensador de arranque se destruye por sobrecalentamiento.',
      'Contactos N.C. picados o con carbonilla por el arco de desconexión.',
    ],
  },
};

const VARIANT_ORDER: SchematicVariant[] = [
  'RSIR_RELE',
  'RSIR_PTC',
  'RSCR_RELE',
  'RSCR_PTC',
  'HST_CSR_RELE',
  'HST_CSR_PTC',
  'HST_CSIR_RELE',
  'HST_CSIR_PTC',
  'CSIR_RELE',
  'CSR_POTENCIAL',
];

export const StartingSystemModal: React.FC<StartingSystemModalProps> = ({
  isOpen,
  onClose,
  initialVariant,
}) => {
  const [currentVariant, setCurrentVariant] = useState<SchematicVariant>(initialVariant);
  const [simState, setSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [viewMode, setViewMode] = useState<'schematic' | 'wiring'>('schematic');

  useEffect(() => {
    setCurrentVariant(initialVariant);
    setSimState('idle');
  }, [initialVariant, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDetails = VARIANT_DETAILS[currentVariant];
  const currentIndex = VARIANT_ORDER.indexOf(currentVariant);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % VARIANT_ORDER.length;
    setCurrentVariant(VARIANT_ORDER[nextIndex]);
    setSimState('idle');
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + VARIANT_ORDER.length) % VARIANT_ORDER.length;
    setCurrentVariant(VARIANT_ORDER[prevIndex]);
    setSimState('idle');
  };

  const handleSimulate = () => {
    setSimState('starting');
    setTimeout(() => {
      setSimState('running');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Maximized Modal Dialog Container */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0d121f] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-100 dark:bg-[#080c16] border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold font-mono text-sm shadow-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    currentDetails.category.includes('LST')
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                  }`}
                >
                  {currentDetails.category}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {currentDetails.subCategory}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5">
                {currentDetails.name}
              </h3>
            </div>
          </div>

          {/* Quick Navigator & Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Esquema anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-tiny font-mono text-slate-400 hidden sm:inline">
              {currentIndex + 1} / {VARIANT_ORDER.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Siguiente esquema"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Cerrar ventana maximizada (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable with synchronized controls) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          {/* Quick Variant Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-tiny font-mono">
            {VARIANT_ORDER.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setCurrentVariant(v);
                  setSimState('idle');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentVariant === v
                    ? 'bg-amber-400 text-black shadow-sm ring-2 ring-amber-400/30'
                    : 'bg-slate-100 dark:bg-[#141a29] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {VARIANT_DETAILS[v].shortName}
              </button>
            ))}
          </div>

          {/* TABS: ESQUEMA ELÉCTRICO vs CONEXIÓN REAL EN BORNES */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('schematic')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'schematic'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#141a29] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Esquema Eléctrico Simulado</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('wiring')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  viewMode === 'wiring'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-[#141a29] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Cable className="w-4 h-4" />
                <span>Simulador de Conexión en Bornes (Compresor Real)</span>
              </button>
            </div>

            <span className="text-tiny font-mono text-slate-400 hidden sm:inline">
              {viewMode === 'schematic' ? 'Diagrama Unifilar Interactivo' : 'Placa de Bornas C-S-R Real'}
            </span>
          </div>

          {/* MAIN STAGE (Schematic or Real Wiring) */}
          {viewMode === 'schematic' ? (
            <div className="bg-slate-50 dark:bg-[#070a12] p-4 sm:p-6 rounded-2xl border-2 border-slate-300 dark:border-slate-800 relative">
              {/* Simulation floating bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-tiny font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Simulación de Ciclo:
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulate}
                    className="px-3 py-1 rounded text-tiny font-bold bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Iniciar Arranque</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimState('overload')}
                    className="px-3 py-1 rounded text-tiny font-bold bg-rose-600/15 border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-600/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Probar Klixon</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimState('idle')}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer"
                    title="Restablecer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* State pill */}
                <div className="flex items-center gap-2 text-tiny font-mono">
                  <span className="text-slate-500">Circuito:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold ${
                      simState === 'idle'
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : simState === 'starting'
                        ? 'bg-amber-400 text-black animate-pulse'
                        : simState === 'running'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {simState === 'idle' && '⚪ REPOSO (0 V)'}
                    {simState === 'starting' && '🟡 ARRANQUE ACTIVO (BOBINA S CONECTADA)'}
                    {simState === 'running' && '🟢 RÉGIMEN NOMINAL (MARCHA R ACTIVA)'}
                    {simState === 'overload' && '🔴 PROTECTOR KLIXON ABIERTO'}
                  </span>
                </div>
              </div>

              {/* The SVG Schematic Diagram in Maximized size */}
              <div className="w-full max-w-3xl mx-auto flex items-center justify-center">
                <IntuitiveSchematicDiagram variant={currentVariant} simState={simState} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border-2 border-slate-800 relative">
              <RealCompressorWiringSimulation variant={currentVariant} simState={simState} />
            </div>
          )}

          {/* TECHNICAL ANALYSIS & IN-DEPTH BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-small">
            {/* Left Card: Desconexión de Bobina y Conexiones */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101524] border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-small">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Mecanismo de Desconexión de la Bobina S
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-tiny mt-1.5 leading-relaxed">
                  {currentDetails.disconnectionMechanism}
                </p>
              </div>

              {currentDetails.capacitorRole && (
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
                  <h5 className="font-bold text-sky-800 dark:text-sky-300 text-tiny uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Función del Condensador
                  </h5>
                  <p className="text-sky-900 dark:text-sky-200 text-tiny mt-1 leading-relaxed">
                    {currentDetails.capacitorRole}
                  </p>
                </div>
              )}

              {/* Bornes Table */}
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-tiny uppercase tracking-wider mb-1.5">
                  Asignación de Bornes en Compresor
                </h5>
                <div className="space-y-1.5 font-mono text-tiny">
                  {currentDetails.bornesGuide.map((b) => (
                    <div
                      key={b.borne}
                      className="p-2 rounded bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="font-bold text-amber-500">{b.borne}:</span>
                      <span className="text-slate-600 dark:text-slate-400 font-sans text-right">
                        {b.connection}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Guía de Averías y Comprobación en Taller */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101524] border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-small">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Diagnóstico de Averías y Síntomas Típicos
              </h4>
              <ul className="space-y-2 text-tiny">
                {currentDetails.commonFailures.map((f, i) => (
                  <li
                    key={i}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Technical Tip */}
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-tiny text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <strong>Regla de oro frigorista:</strong> En sistemas con capilar, si el compresor se detiene, esperar siempre un mínimo de 3 minutos antes de volver a conectar para permitir la igualación de presiones y el enfriamiento de la PTC.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 bg-slate-100 dark:bg-[#080c16] border-t border-slate-200 dark:border-slate-800 text-tiny text-slate-500 dark:text-slate-400 shrink-0">
          <span className="hidden sm:inline">
            Presione <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300">Esc</kbd> para salir o use el botón Cerrar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-lg bg-slate-800 text-white dark:bg-slate-200 dark:text-black font-bold hover:bg-slate-700 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
};
