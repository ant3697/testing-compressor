import { useState, useEffect, useRef, useMemo } from 'react';

export type CompressionPreset = 'optimo' | 'valvula_rota' | 'desgaste' | 'biela_rota' | 'personalizado';
export type RetentionBehavior = 'holds' | 'slow_drop' | 'fast_drop';
export type TestingMethod = 'gauge' | 'finger';
export type MechanicalVerdict = 'OPTIMO' | 'VALVULA_ROTA' | 'DESGASTE' | 'BIELA_ROTA' | 'SIN_PRUEBA';

export interface MechanicalCaseDetails {
  name: string;
  shortDesc: string;
  targetPsi: number;
  retentionBehavior: RetentionBehavior;
  verdict: MechanicalVerdict;
  title: string;
  badge: string;
  symptomInSystem: string;
  rootCause: string;
  recommendedAction: string;
  color: string;
}

export const COMPRESSION_PRESETS_DATA: Record<Exclude<CompressionPreset, 'personalizado'>, MechanicalCaseDetails> = {
  optimo: {
    name: 'Rendimiento Volumétrico Óptimo',
    shortDesc: 'Supera > 26 - 31 Bar (380-450 PSI) y retiene la presión al cortar corriente (0V).',
    targetPsi: 430,
    retentionBehavior: 'holds',
    verdict: 'OPTIMO',
    title: 'Compresor Mecánicamente Sano (Láminas Flapper Estancas)',
    badge: 'ESTANQUEIDAD Y PRESIÓN ÓPTIMAS',
    symptomInSystem: 'Presiones correctas en la instalación. Salto térmico óptimo en evaporador y condensador caliente homogéneo.',
    rootCause: 'Láminas flapper de succión y descarga con cierre hermético sobre la placa de válvulas. Tolerancia pistón-cilindro de fábrica.',
    recommendedAction: 'Apto para el servicio. Mantener lubricación adecuada y montar filtro deshidratador nuevo.',
    color: '#10b981',
  },
  valvula_rota: {
    name: 'Válvula de Alta Rota / Comunicada',
    shortDesc: 'Llega con dificultad a 12 - 14 Bar (180-210 PSI) y cae inmediatamente a 0 al parar.',
    targetPsi: 195,
    retentionBehavior: 'fast_drop',
    verdict: 'VALVULA_ROTA',
    title: 'Lámina Flapper de Descarga Rota o Comunicada',
    badge: 'VÁLVULA DE ALTA COMUNICADA (RETROCESO)',
    symptomInSystem: 'En la máquina: Presión de alta muy baja y presión de baja anormalmente alta. El compresor funciona pero no produce frío en absoluto.',
    rootCause: 'Fractura por fatiga de la lámina de descarga o suciedad/carbonilla impidiendo el asentamiento. El gas comprimido retrocede al cárter.',
    recommendedAction: 'Compresor inservible. En motocompresores herméticos no se sustituyen láminas: reemplazo completo del compresor.',
    color: '#ef4444',
  },
  desgaste: {
    name: 'Falta de Compresión por Desgaste',
    shortDesc: 'No supera 14 - 17 Bar (210-250 PSI) tras 20s de marcha y tiene fuga lenta por segmentos.',
    targetPsi: 225,
    retentionBehavior: 'slow_drop',
    verdict: 'DESGASTE',
    title: 'Pérdida de Rendimiento Volumétrico (Desgaste de Segmentos)',
    badge: 'FALTA DE COMPRESIÓN (BLOW-BY)',
    symptomInSystem: 'El equipo enfría muy poco o no alcanza la temperatura de consigna en verano. El compresor marcha de continuo sin parar por termostato.',
    rootCause: 'Holgura excesiva entre pistón, segmentos y cilindro por rozamiento prolongado o lubricación deficiente (fuga interna blow-by).',
    recommendedAction: 'Sustituir compresor. El bajo rendimiento volumétrico dispara el consumo eléctrico y sobrecalienta el bobinado.',
    color: '#f59e0b',
  },
  biela_rota: {
    name: 'Rotura Mecánica de Biela / Pistón',
    shortDesc: 'El motor eléctrico gira pero no bombea nada de presión (0 Bar / 0 PSI).',
    targetPsi: 0,
    retentionBehavior: 'fast_drop',
    verdict: 'BIELA_ROTA',
    title: 'Desacople Mecánico Interno (Biela Partida)',
    badge: 'DESACOPLE MECÁNICO TOTAL',
    symptomInSystem: 'Consumo eléctrico anormalmente bajo (~0.4 A en vacío). Sin flujo de refrigerante ni compresión alguna.',
    rootCause: 'Golpe de líquido frigorífico incompresible en la aspiración que fracturó la biela o bulón del pistón.',
    recommendedAction: 'Compresor destruido mecánicamente. Obligatorio corregir la causa del retorno de líquido antes de montar el compresor nuevo.',
    color: '#8b5cf6',
  },
};

export function useMechanicalCompressionSimulator() {
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('optimo');
  const [methodType, setMethodType] = useState<TestingMethod>('gauge');
  
  // Custom manual inputs
  const [maxPressureInput, setMaxPressureInput] = useState<string>('430');
  const [retentionBehavior, setRetentionBehavior] = useState<RetentionBehavior>('holds');
  const [retentionTimeSecInput, setRetentionTimeSecInput] = useState<string>('30');
  
  // Live simulation states
  const [currentPsi, setCurrentPsi] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isMeasuringRetention, setIsMeasuringRetention] = useState<boolean>(false);
  const [initialRetentionPsi, setInitialRetentionPsi] = useState<number>(0);
  const [retentionElapsedSec, setRetentionElapsedSec] = useState<number>(0);
  const [oilWarningAcknowledged, setOilWarningAcknowledged] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentPsi(0);
    setIsCompressing(false);
    setIsMeasuringRetention(false);
    setRetentionElapsedSec(0);
    setInitialRetentionPsi(0);
  };

  const handleSelectPreset = (preset: CompressionPreset) => {
    setSelectedPreset(preset);
    resetSimulation();
    if (preset !== 'personalizado') {
      const data = COMPRESSION_PRESETS_DATA[preset];
      setMaxPressureInput(data.targetPsi.toString());
      setRetentionBehavior(data.retentionBehavior);
      setRetentionTimeSecInput(data.retentionBehavior === 'holds' ? '30' : data.retentionBehavior === 'slow_drop' ? '15' : '2');
    }
  };

  // Start pumping compression
  const startCompression = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsMeasuringRetention(false);
    setIsCompressing(true);
    setRetentionElapsedSec(0);

    const parsedTarget = parseFloat(maxPressureInput) || 0;

    timerRef.current = window.setInterval(() => {
      setCurrentPsi((prev) => {
        if (parsedTarget === 0) return 0;
        const step = Math.max(12, (parsedTarget - prev) * 0.25);
        const next = Math.min(parsedTarget, prev + step);
        const vibration = next >= parsedTarget ? (Math.random() * 4 - 2) : (Math.random() * 2 - 1);
        return Math.max(0, Math.round(next + vibration));
      });
    }, 140);
  };

  // Cut 230V to 0V and measure valve seal retention
  const stopAndMeasureRetention = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompressing(false);
    setIsMeasuringRetention(true);
    setInitialRetentionPsi(currentPsi);
    setRetentionElapsedSec(0);

    const dropRatePerSec =
      retentionBehavior === 'holds'
        ? 0.4
        : retentionBehavior === 'slow_drop'
        ? 4.2
        : 45.0;

    timerRef.current = window.setInterval(() => {
      setRetentionElapsedSec((s) => s + 0.2);
      setCurrentPsi((prev) => {
        if (prev <= 0) return 0;
        const dropFactor = (dropRatePerSec / 100) * prev * 0.2;
        const next = Math.max(0, prev - dropFactor);
        return Math.round(next * 10) / 10;
      });
    }, 200);
  };

  const parsedMaxPsi = parseFloat(maxPressureInput) || 0;
  const currentBar = Math.round((currentPsi * 0.0689476) * 10) / 10;
  const maxBar = Math.round((parsedMaxPsi * 0.0689476) * 10) / 10;

  // Needle angle for Gauge SVG (0 PSI = -135deg, 500 PSI = +135deg)
  const needleAngle = Math.min(135, Math.max(-135, -135 + (currentPsi / 500) * 270));

  // Determine technical verdict dynamically based on technician input or preset
  const verdict: MechanicalVerdict = useMemo(() => {
    if (parsedMaxPsi === 0) return 'BIELA_ROTA';
    if (retentionBehavior === 'fast_drop') return 'VALVULA_ROTA';
    if (parsedMaxPsi < 280) return 'DESGASTE';
    if (parsedMaxPsi >= 350 && retentionBehavior === 'holds') return 'OPTIMO';
    if (parsedMaxPsi >= 280 && parsedMaxPsi < 350) return 'DESGASTE';
    return 'OPTIMO';
  }, [parsedMaxPsi, retentionBehavior]);

  const activeCaseInfo: MechanicalCaseDetails = useMemo(() => {
    if (selectedPreset !== 'personalizado') {
      return COMPRESSION_PRESETS_DATA[selectedPreset];
    }
    // Custom case details computed dynamically
    if (verdict === 'OPTIMO') {
      return {
        name: 'Personalizado: Rendimiento Óptimo',
        shortDesc: `Presión de ${parsedMaxPsi} PSI con retención firme.`,
        targetPsi: parsedMaxPsi,
        retentionBehavior,
        verdict: 'OPTIMO',
        title: 'Compresor Mecánicamente Apto (Láminas Estancas)',
        badge: 'ESTANQUEIDAD Y PRESIÓN ÓPTIMAS',
        symptomInSystem: 'Caudal de refrigerante correcto. Presiones de trabajo y subenfriamiento/recalentamiento dentro de especificación.',
        rootCause: 'Láminas flapper de descarga sellan perfectamente sin retorno de gas.',
        recommendedAction: 'Apto para el servicio. Cambiar filtro deshidratador y evacuar a <500 micrones.',
        color: '#10b981',
      };
    } else if (verdict === 'VALVULA_ROTA') {
      return {
        name: 'Personalizado: Válvula Comunicada',
        shortDesc: `Alcanza ${parsedMaxPsi} PSI pero pierde la presión inmediatamente al corte.`,
        targetPsi: parsedMaxPsi,
        retentionBehavior,
        verdict: 'VALVULA_ROTA',
        title: 'Lámina Flapper de Descarga Rota o Deformada',
        badge: 'VÁLVULA DE ALTA COMUNICADA (RETROCESO)',
        symptomInSystem: 'Presión de alta no sube y presión de baja sube rápidamente tras el apagado. No produce frío.',
        rootCause: 'Rotura o falta de hermeticidad en la válvula de descarga. El gas retrocede al cárter.',
        recommendedAction: 'Sustitución obligatoria del compresor hermético.',
        color: '#ef4444',
      };
    } else if (verdict === 'DESGASTE') {
      return {
        name: 'Personalizado: Desgaste Mecánico',
        shortDesc: `Presión insuficiente (${parsedMaxPsi} PSI < 350 PSI) por fuga en segmentos.`,
        targetPsi: parsedMaxPsi,
        retentionBehavior,
        verdict: 'DESGASTE',
        title: 'Pérdida de Rendimiento Volumétrico (Desgaste de Segmentos)',
        badge: 'FALTA DE COMPRESIÓN (BLOW-BY)',
        symptomInSystem: 'Rendimiento frigorífico insuficiente en días calurosos. Compresor en marcha constante.',
        rootCause: 'Desgaste por fricción en cilindro y segmentos o lubricación degradada.',
        recommendedAction: 'Sustituir compresor por pérdida de rendimiento frigorífico.',
        color: '#f59e0b',
      };
    } else {
      return {
        name: 'Personalizado: Sin Compresión',
        shortDesc: '0 PSI generados en descarga.',
        targetPsi: 0,
        retentionBehavior,
        verdict: 'BIELA_ROTA',
        title: 'Desacople Mecánico Interno (Biela Rota)',
        badge: 'DESACOPLE MECÁNICO TOTAL',
        symptomInSystem: 'El motor eléctrico gira pero no bombea gas. Consumo eléctrico en vacío.',
        rootCause: 'Golpe de líquido o fatiga de biela.',
        recommendedAction: 'Sustituir compresor y verificar trampa de succión.',
        color: '#8b5cf6',
      };
    }
  }, [selectedPreset, verdict, parsedMaxPsi, retentionBehavior]);

  return {
    selectedPreset,
    handleSelectPreset,
    methodType,
    setMethodType,
    maxPressureInput,
    setMaxPressureInput: (val: string) => {
      setSelectedPreset('personalizado');
      setMaxPressureInput(val);
    },
    retentionBehavior,
    setRetentionBehavior: (beh: RetentionBehavior) => {
      setSelectedPreset('personalizado');
      setRetentionBehavior(beh);
    },
    retentionTimeSecInput,
    setRetentionTimeSecInput,
    currentPsi,
    currentBar,
    maxBar,
    isCompressing,
    isMeasuringRetention,
    initialRetentionPsi,
    retentionElapsedSec,
    needleAngle,
    verdict,
    activeCaseInfo,
    startCompression,
    stopAndMeasureRetention,
    resetSimulation,
    oilWarningAcknowledged,
    setOilWarningAcknowledged,
  };
}

export type UseMechanicalCompressionSimulatorReturn = ReturnType<typeof useMechanicalCompressionSimulator>;
