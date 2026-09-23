import React, { useState, useEffect, useMemo } from 'react';
import { TerminalId, DiagnosticEvaluation, TerminalRole } from './types';
import { CompressorCockpitVisualizer } from './components/CompressorCockpitVisualizer';
import { GroundFaultTester } from './components/GroundFaultTester';
import { StartingSystemsSection } from './components/StartingSystemsSection';
import { QuickTroubleshootingGuide } from './components/QuickTroubleshootingGuide';
import { TechnicalReportModal } from './components/TechnicalReportModal';
import { EquationsModal } from './components/EquationsModal';
import { HelpModal } from './components/HelpModal';
import { COMPRESSOR_PRESETS } from './data/compressorData';
import { evaluateCompressor } from './utils/compressorDiagnosis';
import { useDirectStartSimulator } from './hooks/useDirectStartSimulator';
import { DirectStartBenchViewer } from './components/DirectStartBenchViewer';
import { DirectStartControlsPanel } from './components/DirectStartControlsPanel';
import { StartingSystemSchematicViewer } from './components/StartingSystemSchematicViewer';
import { StartingSystemsControlsPanel } from './components/StartingSystemsControlsPanel';
import { StartingSystemModal } from './components/StartingSystemModal';
import { ComponentsInfoModal, ComponentCategoryTab } from './components/ComponentsInfoModal';
import { WindingFaultSchematicViewer, WindingFaultType } from './components/WindingFaultSchematicViewer';
import { SchematicVariant } from './components/IntuitiveSchematicDiagram';
import { useMechanicalCompressionSimulator } from './hooks/useMechanicalCompressionSimulator';
import { MechanicalCompressionBenchViewer } from './components/MechanicalCompressionBenchViewer';
import { MechanicalCompressionControlsPanel } from './components/MechanicalCompressionControlsPanel';
import { startCompressorHum, stopCompressorHum } from './utils/audio';
import {
  Activity,
  Zap,
  RotateCw,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Wrench,
  BookOpen,
  Gauge,
} from 'lucide-react';

const FAULT_TO_CASE_INDEX: Record<string, number> = {
  case1: 0,
  open_klixon: 0,
  case2: 1,
  ground_fault: 1,
  case3: 2,
  open_winding: 2,
  case4: 3,
  shorted_turns: 3,
  case5: 4,
  case6: 5,
  bad_relay: 5,
};

const CASE_INDEX_TO_FAULT: WindingFaultType[] = [
  'case1',
  'case2',
  'case3',
  'case4',
  'case5',
  'case6',
];

export default function App() {
  // Theme state: dark (default #0a0a0c) or light (#f1f5f9)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  // Tab navigation matching user's layout:
  // 1. BOBINADOS | 2. ARRANQUES | 3. ARRANQUE DIRECTO | 4. AVERÍAS | PRESETS
  // Default to 'directo' so the workshop bench image (src/assets/arranque directo.png) is shown immediately
  const [activeTab, setActiveTab] = useState<'bobinados' | 'arranques' | 'directo' | 'averias' | 'presets'>('directo');

  // Orientation of bornes: apexDown (like the capture photo) or apexUp
  const [bornesOrientation, setBornesOrientation] = useState<'apexDown' | 'apexUp'>('apexDown');

  // Multimeter & Probes state
  const [multimeterReading, setMultimeterReading] = useState<string>('9.7');
  const [multimeterUnit, setMultimeterUnit] = useState<string>('Ω');
  const [multimeterTitle, setMultimeterTitle] = useState<string>('Medición: C ⟷ R (Marcha)');
  const [probeBlackPin, setProbeBlackPin] = useState<TerminalId | null>('pin3'); // Common pin (C)
  const [probeRedPin, setProbeRedPin] = useState<TerminalId | null>('pin1'); // Marcha pin (R)
  const [isBeeping, setIsBeeping] = useState<boolean>(false);

  // Ground testing state
  const [groundTestedPin, setGroundTestedPin] = useState<TerminalId | 'casing' | null>(null);
  const [highlightGround, setHighlightGround] = useState<boolean>(false);
  const [isGroundFault, setIsGroundFault] = useState<boolean>(false);

  // Resistance input values (R: Marcha C-R, S: Arranque C-S, Total R-S)
  const [rMarchaInput, setRMarchaInput] = useState<string>('9.7');
  const [rArranqueInput, setRArranqueInput] = useState<string>('13.1');
  const [rTotalInput, setRTotalInput] = useState<string>('22.8');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('capture_example');

  // Active photo preset highlighted (1, 2, 3, 4)
  const [activePhotoPreset, setActivePhotoPreset] = useState<1 | 2 | 3 | 4 | null>(1);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isEquationsModalOpen, setIsEquationsModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Direct Start Simulator state hook
  const directStartSimulator = useDirectStartSimulator(rMarchaInput, rArranqueInput);

  // Starting Systems Schematics state
  const [selectedStartingCircuit, setSelectedStartingCircuit] = useState<SchematicVariant>('HST_CSR_RELE');
  const [startingSimState, setStartingSimState] = useState<'idle' | 'starting' | 'running' | 'overload'>('idle');
  const [isStartingModalOpen, setIsStartingModalOpen] = useState<boolean>(false);
  const [modalVariant, setModalVariant] = useState<SchematicVariant>('HST_CSR_RELE');
  const [isComponentsModalOpen, setIsComponentsModalOpen] = useState<boolean>(false);
  const [componentsModalTab, setComponentsModalTab] = useState<ComponentCategoryTab>('all');

  // Winding Faults & Mechanical Diagnostics state
  const [selectedFault, setSelectedFault] = useState<WindingFaultType>('ground_fault');
  const [averiasSubTab, setAveriasSubTab] = useState<'electricas' | 'mecanico'>('mecanico');
  const mechanicalSimulator = useMechanicalCompressionSimulator();

  // Active tab audio synchronization: stops running audio on tab change, resuming if destination tab is active
  useEffect(() => {
    stopCompressorHum();
    if (activeTab === 'directo' && directStartSimulator.isMotorRunning && directStartSimulator.soundEnabled) {
      startCompressorHum(0.055, false);
    } else if (activeTab === 'arranques' && startingSimState === 'running') {
      startCompressorHum(0.055, false);
    } else if (
      activeTab === 'averias' &&
      averiasSubTab === 'mecanico' &&
      mechanicalSimulator.isCompressing
    ) {
      startCompressorHum(0.055, false);
    }
  }, [
    activeTab,
    averiasSubTab,
    directStartSimulator.isMotorRunning,
    directStartSimulator.soundEnabled,
    startingSimState,
    mechanicalSimulator.isCompressing,
  ]);

  // Helper to parse technician inputs (supports comma, decimal, empty, OL, infinity)
  function parseTechnicianInput(valStr: string): { val: number | null; isInfinity: boolean } {
    if (!valStr || valStr.trim() === '') {
      return { val: null, isInfinity: false };
    }
    const clean = valStr.trim().replace(',', '.').toLowerCase();
    if (clean === 'ol' || clean === '1.' || clean === 'inf' || clean === 'infinity') {
      return { val: Infinity, isInfinity: true };
    }
    const num = parseFloat(clean);
    if (isNaN(num)) {
      return { val: null, isInfinity: false };
    }
    if (num >= 9999) {
      return { val: Infinity, isInfinity: true };
    }
    return { val: num, isInfinity: false };
  }

  // Evaluation computation
  const evaluation: DiagnosticEvaluation = useMemo(() => {
    const pM = parseTechnicianInput(rMarchaInput);
    const pA = parseTechnicianInput(rArranqueInput);
    const pT = parseTechnicianInput(rTotalInput);

    // We pass to evaluateCompressor using standard pin assignments (pin1 = R, pin2 = S, pin3 = C)
    return evaluateCompressor(
      {
        r13: pM.val, // Pin 3 (C) - Pin 1 (R)
        r23: pA.val, // Pin 3 (C) - Pin 2 (S)
        r12: pT.val, // Pin 1 (R) - Pin 2 (S)
        r13Infinity: pM.isInfinity,
        r23Infinity: pA.isInfinity,
        r12Infinity: pT.isInfinity,
      },
      {
        pin1ToGround: isGroundFault ? 85.4 : null,
        pin2ToGround: isGroundFault ? 85.4 : null,
        pin3ToGround: isGroundFault ? 85.4 : null,
      }
    );
  }, [rMarchaInput, rArranqueInput, rTotalInput, isGroundFault]);

  // Handler for 4 photo preset chips at the bottom of the diagram card
  const handleSelectPhotoPreset = (photoNum: 1 | 2 | 3 | 4) => {
    setActivePhotoPreset(photoNum);
    setHighlightGround(false);
    setGroundTestedPin(null);

    if (photoNum === 1) {
      // Foto 1: C ⟷ R = 9.7 Ω (Marcha)
      setProbeBlackPin('pin3');
      setProbeRedPin('pin1');
      setMultimeterReading(rMarchaInput || '9.7');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 1: Marcha (C ⟷ R)');
      setIsBeeping(false);
    } else if (photoNum === 2) {
      // Foto 2: C ⟷ S = 13.1 Ω (Arranque)
      setProbeBlackPin('pin3');
      setProbeRedPin('pin2');
      setMultimeterReading(rArranqueInput || '13.1');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 2: Arranque (C ⟷ S)');
      setIsBeeping(false);
    } else if (photoNum === 3) {
      // Foto 3: R ⟷ S = 22.8 Ω (Total)
      setProbeBlackPin('pin1');
      setProbeRedPin('pin2');
      setMultimeterReading(rTotalInput || '22.8');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 3: Total Serie (R ⟷ S)');
      setIsBeeping(false);
    } else if (photoNum === 4) {
      // Foto 4: Borne ⟷ Masa = 1. (Tierra)
      setProbeBlackPin('pin3');
      setProbeRedPin('pin1');
      setGroundTestedPin('pin1');
      setHighlightGround(true);
      setMultimeterReading(isGroundFault ? '85.4' : '1.');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 4: Borne ⟷ Masa (Tierra)');
      setIsBeeping(isGroundFault);
    }
  };

  // Load preset from dropdown or preset tab
  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = COMPRESSOR_PRESETS.find((item) => item.id === presetId);
    if (!p) return;

    if (p.id === 'fault_open_start') {
      setRMarchaInput('9.7');
      setRArranqueInput('9999');
      setRTotalInput('9999');
      setIsGroundFault(false);
      handleSelectPhotoPreset(2);
      return;
    }

    if (p.id === 'fault_ground_leak') {
      setRMarchaInput(p.rMarcha.toString());
      setRArranqueInput(p.rArranque.toString());
      setRTotalInput(p.rTotal.toString());
      setIsGroundFault(true);
      handleSelectPhotoPreset(4);
      return;
    }

    setRMarchaInput(p.rMarcha.toString());
    setRArranqueInput(p.rArranque.toString());
    setRTotalInput(p.rTotal.toString());
    setIsGroundFault(false);
    handleSelectPhotoPreset(1);
  };

  // Pin clicked directly on schematic
  const handlePinClick = (pin: TerminalId) => {
    if (probeBlackPin !== pin) {
      setProbeRedPin(pin);
      if (pin === 'pin1') {
        setMultimeterReading(rMarchaInput);
        setMultimeterTitle('Medición: C ⟷ R (Marcha)');
      } else if (pin === 'pin2') {
        setMultimeterReading(rArranqueInput);
        setMultimeterTitle('Medición: C ⟷ S (Arranque)');
      }
    }
  };

  // Probes dragged or moved to terminals / ground contact
  const handleProbesChange = (black: TerminalId | 'casing' | null, red: TerminalId | 'casing' | null) => {
    // Both probes touching chassis metal
    if (black === 'casing' && red === 'casing') {
      setHighlightGround(true);
      setGroundTestedPin('casing');
      setActivePhotoPreset(4);
      setMultimeterReading('0.0');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Continuidad de Chasis: Carcasa ⟷ Carcasa');
      setIsBeeping(true);
      return;
    }

    if (black === 'casing' || red === 'casing') {
      const testedPin = black === 'casing' ? (red === 'casing' ? null : red) : black;
      setProbeBlackPin('pin3');
      setProbeRedPin(testedPin || 'pin1');
      setGroundTestedPin(testedPin);
      setHighlightGround(true);
      setActivePhotoPreset(4);
      setMultimeterReading(isGroundFault ? '85.4' : '1.');
      setMultimeterUnit('Ω');
      const pinLabel = testedPin === 'pin1' ? 'R (Marcha)' : testedPin === 'pin2' ? 'S (Arranque)' : testedPin === 'pin3' ? 'C (Común)' : 'Borne';
      setMultimeterTitle(`Foto 4: Borne ${pinLabel} ⟷ Carcasa (Tierra)`);
      setIsBeeping(isGroundFault);
      return;
    }

    setHighlightGround(false);
    setGroundTestedPin(null);
    setProbeBlackPin(black);
    setProbeRedPin(red);

    const pins = [black, red];
    if (pins.includes('pin3') && pins.includes('pin1')) {
      setActivePhotoPreset(1);
      setMultimeterReading(rMarchaInput || '9.7');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 1: Marcha (C ⟷ R)');
      setIsBeeping(false);
    } else if (pins.includes('pin3') && pins.includes('pin2')) {
      setActivePhotoPreset(2);
      setMultimeterReading(rArranqueInput || '13.1');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 2: Arranque (C ⟷ S)');
      setIsBeeping(false);
    } else if (pins.includes('pin1') && pins.includes('pin2')) {
      setActivePhotoPreset(3);
      setMultimeterReading(rTotalInput || '22.8');
      setMultimeterUnit('Ω');
      setMultimeterTitle('Foto 3: Total Serie (R ⟷ S)');
      setIsBeeping(false);
    } else if (black && red && black === red) {
      setActivePhotoPreset(null);
      setMultimeterReading('0.0');
      setMultimeterUnit('Ω');
      const label = black === 'pin1' ? 'R' : black === 'pin2' ? 'S' : 'C';
      setMultimeterTitle(`Cortocircuito: Mismo borne (${label} ⟷ ${label})`);
      setIsBeeping(true);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-primary selection:bg-amber-400 selection:text-black ${
        theme === 'dark' ? 'dark bg-[#080b11] text-slate-100' : 'light bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. TOP HEADER BAR (Matching elements from screenshot) */}
      <header className="w-full bg-[#0a0e17] text-white border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold shadow-sm shrink-0">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-body font-bold tracking-tight text-white">
                Comprobador de Compresores
              </span>
              <span className="hidden sm:inline text-small text-slate-400 font-normal">
                | Refrigeración Comercial y Doméstica
              </span>
            </div>
          </div>

          {/* Right Header Controls (3 pill buttons matching capture) */}
          <div className="flex items-center gap-2 text-small font-mono">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer text-tiny"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Technical Report Button - Single authoritative entry point */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer text-tiny"
              title="Abrir Informe Técnico de Comprobación de Compresor"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Reporte</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 flex flex-col justify-start gap-3">
        {/* Section Title Block matching screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Cálculo y Diagnóstico de Compresores
            </h2>
            <p className="text-small text-slate-600 dark:text-slate-400 font-secondary">
              Sistema de comprobación Pro • Regla de resistencias de devanados y aislamiento dieléctrico
            </p>
          </div>
        </div>

        {/* 3. COCKPIT CONTAINER (Sleek side-by-side Bento layout with fixed uniform dimensions) */}
        <div className="w-full bg-slate-200/70 dark:bg-[#0c101a] border border-slate-300 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[630px] items-stretch">
            {/* LEFT COLUMN: LA VENTANA DE ESQUEMAS TÉCNICOS (Reactivo a la solapa activa) */}
            <div className="lg:col-span-6 xl:col-span-6 h-[540px] lg:h-full flex flex-col">
              {/* SOLAPA 1: BOBINADOS */}
              {activeTab === 'bobinados' && (
                <CompressorCockpitVisualizer
                  orientation={bornesOrientation}
                  onToggleOrientation={() => setBornesOrientation(bornesOrientation === 'apexDown' ? 'apexUp' : 'apexDown')}
                  selectedPins={[probeBlackPin, probeRedPin]}
                  identifiedRoles={evaluation.identifiedRoles}
                  multimeterReading={multimeterReading}
                  multimeterUnit={multimeterUnit}
                  multimeterTitle={multimeterTitle}
                  isBeeping={isBeeping}
                  groundTestedPin={groundTestedPin}
                  highlightGround={highlightGround}
                  onPinClick={handlePinClick}
                  onSelectPhotoPreset={handleSelectPhotoPreset}
                  onProbesChange={handleProbesChange}
                  activePhotoPreset={activePhotoPreset}
                  rMarcha={rMarchaInput}
                  rArranque={rArranqueInput}
                  rTotal={rTotalInput}
                />
              )}

              {/* SOLAPA 2: BANCO DE ARRANQUE DIRECTO */}
              {activeTab === 'directo' && (
                <DirectStartBenchViewer
                  simulator={directStartSimulator}
                  rMarcha={rMarchaInput}
                  rArranque={rArranqueInput}
                />
              )}

              {/* SOLAPA 3: ESQUEMAS DE SISTEMAS DE ARRANQUE */}
              {activeTab === 'arranques' && (
                <StartingSystemSchematicViewer
                  selectedCircuit={selectedStartingCircuit}
                  simState={startingSimState}
                  onStartSimulation={() => {
                    setStartingSimState('starting');
                    setTimeout(() => setStartingSimState('running'), 1200);
                  }}
                  onOverload={() => setStartingSimState('overload')}
                  onReset={() => setStartingSimState('idle')}
                  onOpenModal={() => {
                    setModalVariant(selectedStartingCircuit);
                    setIsStartingModalOpen(true);
                  }}
                  onOpenComponentsModal={() => {
                    setComponentsModalTab('ptc');
                    setIsComponentsModalOpen(true);
                  }}
                />
              )}

              {/* SOLAPA 4: ESQUEMA DE AVERÍAS INTERNAS Y BOBINADOS */}
              {activeTab === 'averias' && averiasSubTab === 'electricas' && (
                <WindingFaultSchematicViewer
                  selectedFault={selectedFault}
                  onSelectFault={setSelectedFault}
                  rMarcha={rMarchaInput}
                  rArranque={rArranqueInput}
                  rTotal={rTotalInput}
                  orientation={bornesOrientation}
                  onToggleOrientation={() => setBornesOrientation(bornesOrientation === 'apexDown' ? 'apexUp' : 'apexDown')}
                />
              )}

              {/* SOLAPA 4 (SUB 2): BANCO DE PRUEBA MECÁNICA Y LÁMINAS FLAPPER */}
              {activeTab === 'averias' && averiasSubTab === 'mecanico' && (
                <MechanicalCompressionBenchViewer simulator={mechanicalSimulator} />
              )}

              {/* SOLAPA 5: PRESETS */}
              {activeTab === 'presets' && (
                <CompressorCockpitVisualizer
                  orientation={bornesOrientation}
                  onToggleOrientation={() => setBornesOrientation(bornesOrientation === 'apexDown' ? 'apexUp' : 'apexDown')}
                  selectedPins={[probeBlackPin, probeRedPin]}
                  identifiedRoles={evaluation.identifiedRoles}
                  multimeterReading={multimeterReading}
                  multimeterUnit={multimeterUnit}
                  multimeterTitle={multimeterTitle}
                  isBeeping={isBeeping}
                  groundTestedPin={groundTestedPin}
                  highlightGround={highlightGround}
                  onPinClick={handlePinClick}
                  onSelectPhotoPreset={handleSelectPhotoPreset}
                  onProbesChange={handleProbesChange}
                  activePhotoPreset={activePhotoPreset}
                  rMarcha={rMarchaInput}
                  rArranque={rArranqueInput}
                  rTotal={rTotalInput}
                />
              )}
            </div>

            {/* RIGHT COLUMN: INTERACTIVE MENUS & CONTROLS (~6 cols, locked height matching left) */}
            <div className="lg:col-span-6 xl:col-span-6 h-[580px] lg:h-full flex flex-col bg-white dark:bg-[#111624] rounded-xl border border-slate-200 dark:border-slate-800/90 p-3.5 shadow-sm overflow-hidden">
              {/* Top Horizontal Tab Bar matching screenshot exactly (Fixed position & height) */}
              <div className="w-full h-9 shrink-0 bg-slate-100 dark:bg-[#0a0d16] p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 mb-2.5 overflow-x-auto">
                <div className="flex items-center gap-1 font-mono text-tiny flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('bobinados')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                      activeTab === 'bobinados'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    1. Bobinados.
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('directo')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                      activeTab === 'directo'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    2. Arranque directo.
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('arranques')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                      activeTab === 'arranques'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    3. Esquemas.
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('averias')}
                    className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                      activeTab === 'averias'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    4. Averías.
                  </button>
                </div>

                {/* Presets shortcut pill */}
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`px-2.5 py-1 rounded text-tiny font-mono transition-all cursor-pointer font-bold flex items-center gap-1 ${
                    activeTab === 'presets'
                      ? 'bg-amber-400 text-black'
                      : 'text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400'
                  }`}
                  title="Ver biblioteca de presets y averías típicas"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">PRESETS</span>
                </button>
              </div>

              {/* Scrollable / Fixed Tab Content Viewport */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar flex flex-col">
                {/* TAB 1: 1. BOBINADOS (The primary cockpit view from screenshot) */}
                {activeTab === 'bobinados' && (
                  <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                    {/* Preset Dropdown Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                      <label className="text-tiny font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                        Compresor / Modelo:
                      </label>
                      <select
                        value={selectedPresetId}
                        onChange={(e) => handleLoadPreset(e.target.value)}
                        className="bg-slate-50 dark:bg-[#0a0d16] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 font-mono text-tiny cursor-pointer focus:outline-none focus:border-amber-400"
                      >
                        {COMPRESSOR_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.power} • {p.rMarcha} / {p.rArranque} Ω)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4 Parameter Rows with Badges R, S, Σ, D */}
                    <div className="space-y-1.5 font-mono shrink-0">
                    {/* Row R: Marcha C-R */}
                    <div
                      onClick={() => handleSelectPhotoPreset(1)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                        activePhotoPreset === 1
                          ? 'bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400'
                          : 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-small shadow-sm shrink-0">
                          R
                        </div>
                        <div>
                          <div className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Resistencia Marcha (C ⟷ R)
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                              • Hilo Grueso
                            </span>
                          </div>
                          <span className="text-tiny text-slate-500 dark:text-slate-400 font-sans">
                            Entre Común (C) y Marcha (R) • Valor menor
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={rMarchaInput}
                          placeholder="0.0"
                          onChange={(e) => {
                            setRMarchaInput(e.target.value);
                            if (activePhotoPreset === 1) {
                              setMultimeterReading(e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-right font-bold text-small focus:border-amber-400 focus:outline-none"
                        />
                        <span className="text-small text-slate-500 font-bold">Ω</span>
                      </div>
                    </div>

                    {/* Row S: Arranque C-S */}
                    <div
                      onClick={() => handleSelectPhotoPreset(2)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                        activePhotoPreset === 2
                          ? 'bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400'
                          : 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-small shadow-sm shrink-0">
                          S
                        </div>
                        <div>
                          <div className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Resistencia Arranque (C ⟷ S)
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-sans">
                              • Hilo Fino
                            </span>
                          </div>
                          <span className="text-tiny text-slate-500 dark:text-slate-400 font-sans">
                            Entre Común (C) y Arranque (S) • Valor intermedio
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={rArranqueInput}
                          placeholder="0.0"
                          onChange={(e) => {
                            setRArranqueInput(e.target.value);
                            if (activePhotoPreset === 2) {
                              setMultimeterReading(e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-right font-bold text-small focus:border-amber-400 focus:outline-none"
                        />
                        <span className="text-small text-slate-500 font-bold">Ω</span>
                      </div>
                    </div>

                    {/* Row Σ: Total Serie R-S */}
                    <div
                      onClick={() => handleSelectPhotoPreset(3)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                        activePhotoPreset === 3
                          ? 'bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400'
                          : 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-small shadow-sm shrink-0">
                          Σ
                        </div>
                        <div>
                          <div className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Resistencia Total Serie (R ⟷ S)
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-sans">
                              • Suma Teórica
                            </span>
                          </div>
                          <span className="text-tiny text-slate-500 dark:text-slate-400 font-sans">
                            Entre Marcha (R) y Arranque (S) • Valor mayor
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={rTotalInput}
                          placeholder="0.0"
                          onChange={(e) => {
                            setRTotalInput(e.target.value);
                            if (activePhotoPreset === 3) {
                              setMultimeterReading(e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-right font-bold text-small focus:border-amber-400 focus:outline-none"
                        />
                        <span className="text-small text-slate-500 font-bold">Ω</span>
                      </div>
                    </div>

                    {/* Row D: Aislamiento a Tierra */}
                    <div
                      onClick={() => handleSelectPhotoPreset(4)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                        activePhotoPreset === 4
                          ? 'bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400'
                          : 'bg-slate-50 dark:bg-[#0a0d16] border-slate-200 dark:border-slate-800/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-small shadow-sm shrink-0">
                          D
                        </div>
                        <div>
                          <div className="text-small font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            Aislamiento Dieléctrico a Carcasa
                            <span
                              className={`text-[10px] font-semibold font-sans ${
                                isGroundFault ? 'text-red-500' : 'text-emerald-500'
                              }`}
                            >
                              • {isGroundFault ? '¡DERIVADO!' : 'Aislado OK'}
                            </span>
                          </div>
                          <span className="text-tiny text-slate-500 dark:text-slate-400 font-sans">
                            Entre bornes y masa metálica (Foto 4)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGroundFault(!isGroundFault);
                          handleSelectPhotoPreset(4);
                        }}
                        className={`px-2.5 py-1 rounded text-tiny font-bold transition-all ${
                          isGroundFault
                            ? 'bg-red-500/20 text-red-400 border border-red-500'
                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500'
                        }`}
                      >
                        {isGroundFault ? 'Fuga (85.4 Ω)' : '1. (Aislado >2MΩ)'}
                      </button>
                    </div>
                  </div>

                  {/* YELLOW/AMBER CALLOUT DIAGNOSTIC BOX (Matching capture) */}
                  <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 text-slate-900 dark:text-amber-200 space-y-2.5 mt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="text-body font-bold block text-slate-900 dark:text-amber-300 font-mono">
                            {evaluation.veredictoGlobal === 'INCOMPLETO'
                              ? 'Estado del Motor: Pendiente de Mediciones'
                              : `Estado del Motor: ${evaluation.rTotalCalculada?.toFixed(1) ?? '22.8'} Ω (Desviación: ${evaluation.desviacionPorcentual?.toFixed(1) ?? '0.0'}%)`}
                          </span>
                          <span className="text-tiny text-slate-600 dark:text-amber-400/80 font-secondary block">
                            {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO'
                              ? `Óptimo: R(M) ${rMarchaInput} Ω + R(A) ${rArranqueInput} Ω = ${evaluation.rTotalCalculada?.toFixed(1)} Ω (Tolerancia admisible ±10%)`
                              : evaluation.diagnosticoTexto}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-tiny font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                          evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            : evaluation.veredictoGlobal === 'INCOMPLETO'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40'
                        }`}
                      >
                        {evaluation.veredictoGlobal === 'APTO_PARA_SERVICIO'
                          ? 'APTO'
                          : evaluation.veredictoGlobal === 'INCOMPLETO'
                          ? 'EN ESPERA'
                          : 'NO APTO'}
                      </span>
                    </div>

                    {/* Footer formula subtitle note */}
                    <div className="text-[11px] text-slate-500 dark:text-amber-400/70 font-mono pt-1.5 border-t border-amber-500/20 flex items-center justify-between">
                      <span>Fórmula: R_total = R_marcha + R_arranque</span>
                      <span className="text-tiny font-sans text-slate-400 dark:text-slate-500">
                        Tolerancia ±10%
                      </span>
                    </div>
                  </div>

                  {/* FUSED SECTION FROM FORMER TAB 2: COMPROBACIÓN DIELÉCTRICA DE FUGAS A MASA (TIERRA) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <GroundFaultTester
                      onSelectGroundTest={(pin, reading, isOk) => {
                        setProbeBlackPin('pin3');
                        setProbeRedPin(pin);
                        setGroundTestedPin(pin);
                        setHighlightGround(true);
                        setMultimeterReading(reading);
                        setIsGroundFault(!isOk);
                        setIsBeeping(!isOk);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SIMULADOR DE ARRANQUE DIRECTO (TALLER) */}
              {activeTab === 'directo' && (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <DirectStartControlsPanel
                    simulator={directStartSimulator}
                    onNavigateToWiring={() => setActiveTab('arranques')}
                  />
                </div>
              )}

              {/* TAB 3: ESQUEMAS DE SISTEMAS DE ARRANQUE */}
              {activeTab === 'arranques' && (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <StartingSystemsControlsPanel
                    selectedCircuit={selectedStartingCircuit}
                    onSelectCircuit={(circuit) => {
                      setSelectedStartingCircuit(circuit);
                      setStartingSimState('idle');
                    }}
                    simState={startingSimState}
                    onStartSimulation={() => {
                      setStartingSimState('starting');
                      setTimeout(() => setStartingSimState('running'), 1200);
                    }}
                    onOverload={() => setStartingSimState('overload')}
                    onReset={() => setStartingSimState('idle')}
                    onOpenModal={(circuit) => {
                      setModalVariant(circuit);
                      setIsStartingModalOpen(true);
                    }}
                    onOpenComponentsModal={(tab) => {
                      setComponentsModalTab(tab || 'all');
                      setIsComponentsModalOpen(true);
                    }}
                  />
                </div>
              )}

              {/* TAB 4: GUÍA DE AVERÍAS Y RENDIMIENTO MECÁNICO */}
              {activeTab === 'averias' && (
                <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                  {averiasSubTab === 'electricas' ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      {/* Sub-Tab Switcher in Averías */}
                      <div className="flex items-center justify-between gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#0a0d16] border border-slate-200 dark:border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAveriasSubTab('mecanico')}
                          className="flex-1 py-1.5 px-2 rounded-md font-mono text-tiny font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                        >
                          <Gauge className="w-3.5 h-3.5" />
                          <span>1. Válvulas Flapper y Compresión</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAveriasSubTab('electricas')}
                          className="flex-1 py-1.5 px-2 rounded-md font-mono text-tiny font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-amber-400 text-black shadow-sm"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>2. Averías Eléctricas (Bobinados)</span>
                        </button>
                      </div>
                      <QuickTroubleshootingGuide
                        selectedCaseIndex={FAULT_TO_CASE_INDEX[selectedFault] ?? 0}
                        onSelectCase={(idx) => {
                          const fault = CASE_INDEX_TO_FAULT[idx] || 'case1';
                          setSelectedFault(fault);
                        }}
                      />
                    </div>
                  ) : (
                    <MechanicalCompressionControlsPanel
                      simulator={mechanicalSimulator}
                      averiasSubTab={averiasSubTab}
                      onSelectSubTab={setAveriasSubTab}
                      onOpenReport={() => setIsReportModalOpen(true)}
                    />
                  )}
                </div>
              )}

              {/* TAB 5: BIBLIOTECA DE PRESETS */}
              {activeTab === 'presets' && (
                <div className="space-y-3 flex-1 font-secondary">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-small text-slate-900 dark:text-white">
                        Biblioteca de Compresores y Casos Reales
                      </h4>
                      <p className="text-tiny text-slate-500 dark:text-slate-400">
                        Selecciona un caso para cargar sus medidas al multímetro y esquema:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-tiny font-mono">
                    {COMPRESSOR_PRESETS.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          handleLoadPreset(p.id);
                          setActiveTab('bobinados');
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                          selectedPresetId === p.id
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0a0d16]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.power}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span>M: {p.rMarcha}Ω • A: {p.rArranque}Ω</span>
                          <span className="font-bold text-amber-500">Σ {p.rTotal}Ω</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. BOTTOM FOOTER BAR (Matching bottom layout in screenshot) */}
      <footer className="w-full bg-[#0a0e17] text-white border-t border-slate-800/80 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Title */}
          <div className="flex items-center gap-2 text-small font-secondary text-slate-400">
            <span className="font-bold text-slate-200">Compresor Pro</span>
            <span>•</span>
            <span>Software de Diagnóstico de Motores Herméticos Monofásicos</span>
          </div>

          {/* Right Action Buttons: [ ❓ Ayuda ] */}
          <div className="flex items-center gap-2 font-mono text-tiny">
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Ayuda</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 5. MODALS */}
      {/* Technical Work Order Printable Report */}
      <TechnicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        evaluation={evaluation}
        mechanicalData={{
          targetPsi: parseFloat(mechanicalSimulator.maxPressureInput) || 0,
          retentionBehavior: mechanicalSimulator.retentionBehavior,
          title: mechanicalSimulator.activeCaseInfo.title,
          badge: mechanicalSimulator.activeCaseInfo.badge,
          isApto: mechanicalSimulator.verdict === 'OPTIMO',
        }}
      />

      {/* Step-by-step Equations and Mathematical Rules Modal */}
      <EquationsModal
        isOpen={isEquationsModalOpen}
        onClose={() => setIsEquationsModalOpen(false)}
        evaluation={evaluation}
      />

      {/* User Help & Troubleshooting Procedures Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Starting System Physical Wiring Interactive Modal */}
      <StartingSystemModal
        isOpen={isStartingModalOpen}
        onClose={() => setIsStartingModalOpen(false)}
        initialVariant={modalVariant}
      />

      {/* Starting System Components & PTC Technical Info Modal */}
      <ComponentsInfoModal
        isOpen={isComponentsModalOpen}
        onClose={() => setIsComponentsModalOpen(false)}
        initialTab={componentsModalTab}
      />
    </div>
  );
}
