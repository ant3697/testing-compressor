import { DiagnosticEvaluation, TerminalId, TerminalRole } from '../types';

interface PairMeasurementInput {
  r12: number | null; // Pin 1 - Pin 2
  r23: number | null; // Pin 2 - Pin 3
  r13: number | null; // Pin 1 - Pin 3
  r12Infinity?: boolean;
  r23Infinity?: boolean;
  r13Infinity?: boolean;
}

interface GroundTestInput {
  pin1ToGround: number | null; // null = infinite
  pin2ToGround: number | null;
  pin3ToGround: number | null;
}

export function evaluateCompressor(
  measurements: PairMeasurementInput,
  groundTests: GroundTestInput
): DiagnosticEvaluation {
  const alerts: string[] = [];
  const details: string[] = [];

  const r12 = measurements.r12Infinity ? Infinity : (measurements.r12 ?? null);
  const r23 = measurements.r23Infinity ? Infinity : (measurements.r23 ?? null);
  const r13 = measurements.r13Infinity ? Infinity : (measurements.r13 ?? null);

  // Check if inputs are filled
  if (r12 === null || r23 === null || r13 === null) {
    return {
      identifiedRoles: { pin1: null, pin2: null, pin3: null },
      rMarcha: null,
      rArranque: null,
      rTotalMedida: null,
      rTotalCalculada: null,
      desviacionPorcentual: null,
      estadoDevanados: 'incompleto',
      estadoTierra: 'no_medido',
      veredictoGlobal: 'INCOMPLETO',
      diagnosticoTexto: 'Faltan mediciones para completar la identificación de bornes.',
      detallesTecnicos: ['Introduce los 3 valores de resistencia entre bornes para diagnosticar.'],
      alertas: ['Medición incompleta'],
    };
  }

  // Check for open windings (Infinity / OL)
  const is12Inf = !isFinite(r12);
  const is23Inf = !isFinite(r23);
  const is13Inf = !isFinite(r13);

  if (is12Inf || is23Inf || is13Inf) {
    const brokenList: string[] = [];
    if (is12Inf) brokenList.push('Bornes 1-2');
    if (is23Inf) brokenList.push('Bornes 2-3');
    if (is13Inf) brokenList.push('Bornes 1-3');

    alerts.push(`Circuito abierto (OL) detectado en: ${brokenList.join(', ')}`);
    details.push('Existe un devanado cortado interiormente en el compresor.');
    details.push('El motor no podrá arrancar o disparará el klixon por rotor bloqueado.');

    return {
      identifiedRoles: { pin1: null, pin2: null, pin3: null },
      rMarcha: null,
      rArranque: null,
      rTotalMedida: null,
      rTotalCalculada: null,
      desviacionPorcentual: null,
      estadoDevanados: 'abierto',
      estadoTierra: 'no_medido',
      veredictoGlobal: 'BOBINADO_DANADO',
      diagnosticoTexto: 'DEVANADO ABIERTO / CORTADO: El compresor está dañado y debe ser sustituido.',
      detallesTecnicos: details,
      alertas: alerts,
    };
  }

  // Check for negative resistances
  if (
    (r12 !== null && isFinite(r12) && r12 < 0) ||
    (r23 !== null && isFinite(r23) && r23 < 0) ||
    (r13 !== null && isFinite(r13) && r13 < 0)
  ) {
    return {
      identifiedRoles: { pin1: null, pin2: null, pin3: null },
      rMarcha: null,
      rArranque: null,
      rTotalMedida: null,
      rTotalCalculada: null,
      desviacionPorcentual: null,
      estadoDevanados: 'incompleto',
      estadoTierra: 'no_medido',
      veredictoGlobal: 'INCOMPLETO',
      diagnosticoTexto: 'VALOR NEGATIVO NO VÁLIDO: Las resistencias de devanados deben ser siempre positivas (> 0 Ω).',
      detallesTecnicos: ['Verifique que no haya signos negativos o errores de tecleo en los campos de entrada.'],
      alertas: ['Valor negativo detectado'],
    };
  }

  // Check for dead shorts (0 ohms or extremely low)
  if (r12 <= 0.2 || r23 <= 0.2 || r13 <= 0.2) {
    alerts.push('Cortocircuito franco detectado (resistencia prácticamente 0 Ω).');
    return {
      identifiedRoles: { pin1: null, pin2: null, pin3: null },
      rMarcha: null,
      rArranque: null,
      rTotalMedida: null,
      rTotalCalculada: null,
      desviacionPorcentual: null,
      estadoDevanados: 'cortocircuito',
      estadoTierra: 'no_medido',
      veredictoGlobal: 'BOBINADO_DANADO',
      diagnosticoTexto: 'CORTOCIRCUITO DIRECTO: Devanado quemado por contacto entre espiras o sobrecalentamiento.',
      detallesTecnicos: ['El compresor provocará un disparo inmediato del magnetotérmico.'],
      alertas: alerts,
    };
  }

  // Find maximum measurement
  // Pair 1-2 vs Pair 2-3 vs Pair 1-3
  const pairs = [
    { name: '1-2', val: r12, pins: ['pin1', 'pin2'] as [TerminalId, TerminalId], commonPin: 'pin3' as TerminalId },
    { name: '2-3', val: r23, pins: ['pin2', 'pin3'] as [TerminalId, TerminalId], commonPin: 'pin1' as TerminalId },
    { name: '1-3', val: r13, pins: ['pin1', 'pin3'] as [TerminalId, TerminalId], commonPin: 'pin2' as TerminalId },
  ];

  pairs.sort((a, b) => b.val - a.val);
  const maxPair = pairs[0];
  const secondPair = pairs[1];
  const thirdPair = pairs[2];

  // The common pin is the pin opposite to the maximum pair
  const commonPin = maxPinOpposite(maxPair.name);

  // The other two pins are the two in the maxPair
  const otherPins = maxPair.pins; // [pinA, pinB]

  // Get resistance from common to otherPin[0] and common to otherPin[1]
  const resToPinA = getPairValue(commonPin, otherPins[0], r12, r23, r13);
  const resToPinB = getPairValue(commonPin, otherPins[1], r12, r23, r13);

  let runPin: TerminalId;
  let startPin: TerminalId;
  let rMarcha: number;
  let rArranque: number;

  // The lower resistance from Common is Marcha (Run)
  // The intermediate resistance from Common is Arranque (Start)
  if (resToPinA <= resToPinB) {
    runPin = otherPins[0];
    startPin = otherPins[1];
    rMarcha = resToPinA;
    rArranque = resToPinB;
  } else {
    runPin = otherPins[1];
    startPin = otherPins[0];
    rMarcha = resToPinB;
    rArranque = resToPinA;
  }

  const identifiedRoles: { pin1: TerminalRole; pin2: TerminalRole; pin3: TerminalRole } = {
    pin1: commonPin === 'pin1' ? 'C' : runPin === 'pin1' ? 'R' : 'S',
    pin2: commonPin === 'pin2' ? 'C' : runPin === 'pin2' ? 'R' : 'S',
    pin3: commonPin === 'pin3' ? 'C' : runPin === 'pin3' ? 'R' : 'S',
  };

  const rTotalMedida = maxPair.val;
  const rTotalCalculada = Number((rMarcha + rArranque).toFixed(2));
  const diff = Math.abs(rTotalMedida - rTotalCalculada);
  const desviacionPorcentual = rTotalMedida > 0 ? Number(((diff / rTotalMedida) * 100).toFixed(1)) : 0.0;

  // Check ground test
  let estadoTierra: 'aislado' | 'derivado' | 'fuga_ligera' = 'aislado';
  const groundVals = [groundTests.pin1ToGround, groundTests.pin2ToGround, groundTests.pin3ToGround];

  for (let i = 0; i < groundVals.length; i++) {
    const val = groundVals[i];
    if (val !== null && isFinite(val)) {
      if (val < 2000000) { // < 2 MΩ is considered leak in refrigeration / electrical codes
        if (val < 1000) {
          estadoTierra = 'derivado';
          alerts.push(`Derivación directa a masa en Pin ${i + 1}: ${val} Ω. ¡PELIGRO ELÉCTRICO!`);
        } else {
          estadoTierra = 'fuga_ligera';
          alerts.push(`Fuga de aislamiento detectada en Pin ${i + 1}: ${(val / 1000).toFixed(1)} kΩ (debe ser > 2 MΩ).`);
        }
      }
    }
  }

  // Evaluate windings health
  let estadoDevanados: DiagnosticEvaluation['estadoDevanados'] = 'optimo';
  if (desviacionPorcentual <= 5.0) {
    estadoDevanados = 'optimo';
    details.push(`Regla de oro verificada: R(Marcha) [${rMarcha} Ω] + R(Arranque) [${rArranque} Ω] = ${rTotalCalculada} Ω.`);
    details.push(`Suma medida R(Marcha-Arranque) = ${rTotalMedida} Ω (Desviación mínima: ${desviacionPorcentual}%).`);
  } else if (desviacionPorcentual <= 10.0) {
    estadoDevanados = 'aceptable';
    details.push(`Desviación de ${desviacionPorcentual}% dentro de las tolerancias normales de multímetro y temperatura.`);
  } else {
    estadoDevanados = 'desbalanceado';
    alerts.push(`Desviación alta (${desviacionPorcentual}%): la suma calculada (${rTotalCalculada} Ω) difiere de la medida (${rTotalMedida} Ω).`);
    details.push('Posible cortocircuito parcial entre espiras o recalentamiento del aislamiento interno del barniz.');
  }

  details.push(`Borne Común (C): ${getPinDisplayName(commonPin)}.`);
  details.push(`Borne Marcha (R / P): ${getPinDisplayName(runPin)} (Resistencia menor: ${rMarcha} Ω).`);
  details.push(`Borne Arranque (S / A): ${getPinDisplayName(startPin)} (Resistencia intermedia: ${rArranque} Ω).`);

  let veredictoGlobal: DiagnosticEvaluation['veredictoGlobal'] = 'APTO_PARA_SERVICIO';
  let diagnosticoTexto = '';

  if (estadoTierra === 'derivado') {
    veredictoGlobal = 'DERIVADO_A_MASA';
    diagnosticoTexto = 'COMPRESOR DERIVADO A MASA / QUEMADO: El compresor tiene contacto con la carcasa metálica y disparará el diferencial de seguridad. Debe reemplazarse de inmediato.';
  } else if (estadoTierra === 'fuga_ligera') {
    veredictoGlobal = 'DERIVADO_A_MASA';
    diagnosticoTexto = 'FUGA DE AISLAMIENTO A TIERRA: El compresor presenta resistencia finita a carcasa (< 2 MΩ). Riesgo inminente de disparo de protecciones.';
  } else if (estadoDevanados === 'desbalanceado') {
    veredictoGlobal = 'BOBINADO_DANADO';
    diagnosticoTexto = 'ANOMALÍA EN DEVANADOS: La suma de resistencias no es coherente. Hay espiras en cortocircuito que provocarán sobreconsumo y disparo de térmico.';
  } else {
    veredictoGlobal = 'APTO_PARA_SERVICIO';
    diagnosticoTexto = 'COMPRESOR ELÉCTRICAMENTE CORRECTO: Devanados en perfecto estado, jerarquía de resistencias coherente y aislamiento a tierra sin derivaciones.';
  }

  return {
    identifiedRoles,
    rMarcha,
    rArranque,
    rTotalMedida,
    rTotalCalculada,
    desviacionPorcentual,
    estadoDevanados,
    estadoTierra,
    veredictoGlobal,
    diagnosticoTexto,
    detallesTecnicos: details,
    alertas: alerts,
  };
}

function maxPinOpposite(pairName: string): TerminalId {
  if (pairName === '1-2') return 'pin3';
  if (pairName === '2-3') return 'pin1';
  return 'pin2'; // '1-3'
}

function getPairValue(p1: TerminalId, p2: TerminalId, r12: number, r23: number, r13: number): number {
  if ((p1 === 'pin1' && p2 === 'pin2') || (p1 === 'pin2' && p2 === 'pin1')) return r12;
  if ((p1 === 'pin2' && p2 === 'pin3') || (p1 === 'pin3' && p2 === 'pin2')) return r23;
  return r13;
}

export function getPinDisplayName(pin: TerminalId): string {
  if (pin === 'pin1') return 'Borne 1';
  if (pin === 'pin2') return 'Borne 2';
  return 'Borne 3';
}
