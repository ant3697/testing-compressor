import React from 'react';
import { useMechanicalCompressionSimulator } from '../hooks/useMechanicalCompressionSimulator';
import { MechanicalCompressionBenchViewer } from './MechanicalCompressionBenchViewer';
import { MechanicalCompressionControlsPanel } from './MechanicalCompressionControlsPanel';

export const MechanicalCompressionTester: React.FC = () => {
  const simulator = useMechanicalCompressionSimulator();
  const [subTab, setSubTab] = React.useState<'electricas' | 'mecanico'>('mecanico');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      <div className="lg:col-span-6 h-full">
        <MechanicalCompressionBenchViewer simulator={simulator} />
      </div>
      <div className="lg:col-span-6 h-full">
        <MechanicalCompressionControlsPanel
          simulator={simulator}
          averiasSubTab={subTab}
          onSelectSubTab={setSubTab}
        />
      </div>
    </div>
  );
};

export { MechanicalCompressionBenchViewer } from './MechanicalCompressionBenchViewer';
export { MechanicalCompressionControlsPanel } from './MechanicalCompressionControlsPanel';
