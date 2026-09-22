import { StartingSystemInfo } from '../types';

export interface CompressorPreset {
  id: string;
  name: string;
  type: string;
  refrigerant: string;
  power: string;
  description: string;
  rMarcha: number;
  rArranque: number;
  rTotal: number;
  groundResistance: number | null; // null means infinite / isolated
  systemSuggested: 'RSIR' | 'PSC' | 'CSIR' | 'CSR';
  note: string;
}

export const CAPTURE_EXAMPLE: CompressorPreset = {
  id: 'capture_example',
  name: 'Ejemplo de la Captura (Manual Técnico)',
  type: 'Hermético Monofásico Frigorífico',
  refrigerant: 'R134a / R600a',
  power: '1/4 HP (aprox.)',
  description: 'Datos exactos de las fotografías con multímetro KT-3900 de la captura adjunta.',
  rMarcha: 9.7,
  rArranque: 13.1,
  rTotal: 22.8,
  groundResistance: null, // "1." (Circuito abierto / Infinito)
  systemSuggested: 'RSIR',
  note: 'Comprobación perfecta: 9.7 + 13.1 = 22.8 Ω y aislamiento a tierra "1." (infinito)',
};

export const COMPRESSOR_PRESETS: CompressorPreset[] = [
  CAPTURE_EXAMPLE,
  {
    id: 'embraco_1_5',
    name: 'Embraco 1/5 HP (Nevera doméstica)',
    type: 'Compresor Reciprocante',
    refrigerant: 'R600a (Isobutano)',
    power: '1/5 HP',
    description: 'Compresor doméstico con sistema RSIR/PTC y capilar.',
    rMarcha: 14.2,
    rArranque: 18.5,
    rTotal: 32.7,
    groundResistance: null,
    systemSuggested: 'RSIR',
    note: 'Marcha 14.2 Ω < Arranque 18.5 Ω. Suma = 32.7 Ω. Aislamiento OK.',
  },
  {
    id: 'danfoss_1_3',
    name: 'Secop / Danfoss 1/3 HP (Botellero/Comercial)',
    type: 'Compresor Comercial LBP',
    refrigerant: 'R134a',
    power: '1/3 HP',
    description: 'Equipo comercial ligero con sistema CSIR y alto par.',
    rMarcha: 6.8,
    rArranque: 11.4,
    rTotal: 18.2,
    groundResistance: null,
    systemSuggested: 'CSIR',
    note: 'Marcha 6.8 Ω, Arranque 11.4 Ω. Suma = 18.2 Ω.',
  },
  {
    id: 'tecumseh_1_2',
    name: 'Tecumseh 1/2 HP (Cámara frigorífica / Vitrina)',
    type: 'Compresor Comercial MBP',
    refrigerant: 'R404A / R449A',
    power: '1/2 HP',
    description: 'Sistema con válvula de expansión termostática (TXV) tipo CSR.',
    rMarcha: 3.4,
    rArranque: 7.9,
    rTotal: 11.3,
    groundResistance: null,
    systemSuggested: 'CSR',
    note: 'Motores de mayor potencia tienen menor resistencia óhmica.',
  },
  {
    id: 'split_ac_psc',
    name: 'Compresor Rotativo A/A (Sistema PSC)',
    type: 'Compresor Rotativo Hermético',
    refrigerant: 'R410A / R32',
    power: '1 CV (9000-12000 BTU)',
    description: 'Compresor de climatización con condensador permanente intercalado.',
    rMarcha: 2.1,
    rArranque: 4.6,
    rTotal: 6.7,
    groundResistance: null,
    systemSuggested: 'PSC',
    note: 'Bajo par de arranque (LST), presión equilibrada por capilar.',
  },
  {
    id: 'fault_open_start',
    name: '⚠️ Falla: Bobinado de Arranque Abierto',
    type: 'Avería Típica',
    refrigerant: 'Cualquiera',
    power: '1/4 HP',
    description: 'El motor zumba y corta el protector térmico (Klixon) sin llegar a arrancar.',
    rMarcha: 9.7,
    rArranque: 999999, // Abierto / OL
    rTotal: 999999,
    groundResistance: null,
    systemSuggested: 'RSIR',
    note: 'El multímetro marcará "OL" / "1." entre C-A y entre P-A. ¡Bobina cortada!',
  },
  {
    id: 'fault_ground_leak',
    name: '⚠️ Falla: Compresor Derivado a Masa (Tierra)',
    type: 'Avería Crítica',
    refrigerant: 'Cualquiera',
    power: '1/3 HP',
    description: 'Salta el interruptor diferencial de la vivienda o local inmediatamente al enchufar.',
    rMarcha: 8.5,
    rArranque: 12.0,
    rTotal: 20.5,
    groundResistance: 145, // Resistencia baja a carcasa
    systemSuggested: 'RSIR',
    note: 'Existe continuidad (145 Ω) entre los bornes y la carcasa metálica. Peligro de electrocución.',
  },
  {
    id: 'fault_short_turns',
    name: '⚠️ Falla: Espiras en Cortocircuito',
    type: 'Avería Eléctrica',
    refrigerant: 'Cualquiera',
    power: '1/2 HP',
    description: 'El motor arranca con sobreconsumo y se recalienta rápidamente.',
    rMarcha: 3.2,
    rArranque: 8.5,
    rTotal: 7.9, // La suma no cuadra: 3.2 + 8.5 = 11.7 != 7.9
    groundResistance: null,
    systemSuggested: 'CSIR',
    note: 'La regla fundamental R_total = R_marcha + R_arranque no se cumple (desvío > 30%).',
  },
];

export const STARTING_SYSTEMS: StartingSystemInfo[] = [
  {
    id: 'RSIR',
    nombre: 'RSIR',
    traduccion: 'Resistor Start Induction Run (Arranque resistivo, marcha inductiva)',
    parArranque: 'LST',
    parDescripcion: 'Bajo par de arranque (Low Starting Torque)',
    sistemaExpansion: 'Capilar',
    componentes: [
      'Protector térmico bimetálico (Klixon) en borne Común',
      'Relé de intensidad / corriente (R. Int) con contacto N.A.',
      'Devanado de arranque resistivo (hilo fino, mayor resistencia)',
      'Devanado de marcha inductivo (hilo grueso, menor resistencia)',
    ],
    descripcionFuncionamiento:
      'Para sistemas donde las presiones de alta y baja se igualan durante la parada (tubo capilar). En el momento de conexión, la alta corriente inicial por el devanado de marcha activa la bobina del relé de intensidad (R. Int), cerrando su contacto y alimentando el devanado de arranque. Al ganar velocidad el rotor, la corriente disminuye, la bobina del relé deja caer el contacto y el devanado de arranque se desconecta.',
    releTipo: 'Relé de Intensidad',
    condensador: 'Ninguno',
    klixon: true,
  },
  {
    id: 'PSC',
    nombre: 'PSC',
    traduccion: 'Permanent Split Capacitor (Condensador siempre intercalado)',
    parArranque: 'LST',
    parDescripcion: 'Bajo par de arranque (Low Starting Torque)',
    sistemaExpansion: 'Capilar',
    componentes: [
      'Protector térmico bimetálico (Klixon) en borne Común',
      'Condensador de marcha permanente conectado entre bornes R y S',
      'Sin relé de arranque ni piezas móviles mecánicas',
    ],
    descripcionFuncionamiento:
      'El condensador permanente permanece conectado en serie con el devanado de arranque en todo momento (tanto en el arranque como en marcha). Mejora el factor de potencia y la eficiencia energética del motor. Se utiliza ampliamente en aire acondicionado, bombas de calor y compresores de refrigeración comercial ligera con tubo capilar.',
    releTipo: 'Ninguno',
    condensador: 'Condensador de Marcha Permanente',
    klixon: true,
  },
  {
    id: 'CSIR',
    nombre: 'CSIR',
    traduccion: 'Capacitor Start Induction Run (Arranque capacitivo, marcha inductiva)',
    parArranque: 'HST',
    parDescripcion: 'Alto par de arranque (High Starting Torque)',
    sistemaExpansion: 'Válvula de expansión (TXV)',
    componentes: [
      'Protector térmico bimetálico (Klixon) en borne Común',
      'Relé de intensidad / corriente (R. Int)',
      'Condensador electrolítico de arranque de alta capacidad (60 a 160 µF)',
      'Devanado de arranque y de marcha',
    ],
    descripcionFuncionamiento:
      'Diseñado para sistemas donde no se igualan las presiones en parada (válvula de expansión termostática) y el compresor debe arrancar contra contrapresión. Un condensador electrolítico en serie con el contacto del relé de corriente desfasa la corriente 90°, generando un par motor muy elevado. Al alcanzar ~75% de velocidad, el relé de corriente desconecta el condensador y el devanado de arranque.',
    releTipo: 'Relé de Intensidad',
    condensador: 'Condensador Electrolítico de Arranque',
    klixon: true,
  },
  {
    id: 'CSR',
    nombre: 'CSR',
    traduccion: 'Capacitor Start and Run (Arranque con relé de tensión)',
    parArranque: 'HST',
    parDescripcion: 'Alto par de arranque y máxima eficiencia de marcha (High Starting Torque)',
    sistemaExpansion: 'Válvula de expansión (TXV)',
    componentes: [
      'Protector térmico bimetálico (Klixon) en borne Común',
      'Relé de tensión / potencial (R. Ten) con contacto N.C.',
      'Condensador de marcha permanente (polipropileno, 10 a 35 µF)',
      'Condensador electrolítico de arranque (80 a 200 µF)',
    ],
    descripcionFuncionamiento:
      'Combina el elevado par del condensador de arranque con la eficiencia del condensador permanente. Durante el arranque, ambos condensadores están en paralelo sumando capacidad. A medida que el motor acelera, el devanado auxiliar induce una alta tensión (f.e.m.) en la bobina del relé de tensión (R. Ten), la cual abre su contacto normalmente cerrado desconectando el condensador de arranque, quedando el de marcha conectado.',
    releTipo: 'Relé de Tensión (Voltimétrico)',
    condensador: 'Condensador de Arranque + Condensador de Marcha',
    klixon: true,
  },
];
