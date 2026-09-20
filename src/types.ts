export type TerminalId = 'pin1' | 'pin2' | 'pin3';

export type TerminalRole = 'C' | 'R' | 'S'; // Común, Run/Marcha, Start/Arranque

export interface TerminalMeasurement {
  id: string;
  terminalA: TerminalId;
  terminalB: TerminalId;
  label: string;
  value: number | null; // in Ohms
  isInfinity: boolean;
}

export interface GroundMeasurement {
  terminal: TerminalId;
  value: number | null; // in Ohms or MOhm
  isInfinity: boolean;
  status: 'ok' | 'leak' | 'short';
}

export interface DiagnosticEvaluation {
  identifiedRoles: {
    pin1: TerminalRole | null;
    pin2: TerminalRole | null;
    pin3: TerminalRole | null;
  };
  rMarcha: number | null; // C - R (menor)
  rArranque: number | null; // C - S (intermedia)
  rTotalMedida: number | null; // R - S (mayor)
  rTotalCalculada: number | null; // rMarcha + rArranque
  desviacionPorcentual: number | null; // error %
  estadoDevanados: 'optimo' | 'aceptable' | 'desbalanceado' | 'abierto' | 'cortocircuito' | 'incompleto';
  estadoTierra: 'aislado' | 'derivado' | 'fuga_ligera' | 'no_medido';
  veredictoGlobal: 'APTO_PARA_SERVICIO' | 'REVISAR_ESCUADRAS' | 'BOBINADO_DANADO' | 'DERIVADO_A_MASA' | 'INCOMPLETO';
  diagnosticoTexto: string;
  detallesTecnicos: string[];
  alertas: string[];
}

export type StartingSystemType = 'RSIR' | 'PSC' | 'CSIR' | 'CSR';

export interface StartingSystemInfo {
  id: StartingSystemType;
  nombre: string;
  traduccion: string;
  parArranque: 'LST' | 'HST';
  parDescripcion: string;
  sistemaExpansion: 'Capilar' | 'Válvula de expansión (TXV)';
  componentes: string[];
  descripcionFuncionamiento: string;
  releTipo: 'Relé de Corriente (Amperimétrico)' | 'Ninguno' | 'Relé de Tensión (Voltimétrico)';
  condensador: 'Ninguno' | 'Condensador de Marcha Permanente' | 'Condensador Electrolítico de Arranque' | 'Condensador de Arranque + Condensador de Marcha';
  klixon: boolean;
}
