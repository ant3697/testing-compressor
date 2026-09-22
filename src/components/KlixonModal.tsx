import React, { useEffect } from 'react';
import { X, ShieldAlert, Zap, Thermometer, CheckCircle2, AlertTriangle } from 'lucide-react';
import klixonImg from '../assets/klixon.png';
import { ZoomPanViewer } from './ZoomPanViewer';

interface KlixonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KlixonModal: React.FC<KlixonModalProps> = ({ isOpen, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="klixon-modal-title"
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="klixon-modal-title" className="text-base sm:text-lg font-black text-white tracking-wide">
                  Protector Térmico Bimetálico (Klixon)
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Seguridad Motor
                </span>
              </div>
              <p className="text-xs text-slate-400 font-secondary">
                Protección combinada de sobretemperatura y sobreintensidad para compresores herméticos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            title="Cerrar ventana (Esc)"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200">
          {/* Main Visual Display: klixon.png with ZoomPanViewer */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col items-center justify-center">
            {/* Image Container with Zoom and Panning */}
            <div className="relative w-full h-[360px] sm:h-[400px] overflow-hidden bg-slate-950/80 flex items-center justify-center">
              <ZoomPanViewer
                className="w-full h-full flex items-center justify-center"
                containerClassName="w-full h-full flex items-center justify-center p-2"
                initialZoom={1}
                minZoom={0.75}
                maxZoom={4}
                toolbarPosition="top-right"
                title="Fotografía de Detalle: Protector Térmico Klixon en Taller"
              >
                <img
                  src={klixonImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/klixon.png';
                  }}
                  alt="Detalle del Protector Térmico Klixon"
                  className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-md select-none pointer-events-none"
                  draggable={false}
                />
              </ZoomPanViewer>
            </div>
          </div>

          {/* Technical Explanations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Card 1: Función y Ubicación */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Función y Conexión</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Va conectado en <strong>serie directa con el borne Común (C)</strong>. Si abre por sobrecarga, interrumpe la fase a <em>ambos devanados</em> (Marcha y Arranque), desenergizando por completo el motor.
              </p>
              <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px] font-mono">
                Línea Fase (L) ➔ Klixon ➔ Borne Común (C)
              </div>
            </div>

            {/* Card 2: Principio Bimetálico */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
                <Thermometer className="w-4 h-4 text-sky-400" />
                <span>Acción Bimetálica</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Integra un disco bimetálico calibrado en contacto térmico con la carcasa del compresor (sensible a <strong>105 °C – 120 °C</strong>) y un filamento calefactor que reacciona de inmediato ante altas intensidades de arranque o rotor bloqueado.
              </p>
              <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-800/40 text-sky-200 text-[11px] font-mono">
                Disparo «Snap-Action» • Rearme auto al enfriar
              </div>
            </div>

            {/* Card 3: Comprobación con Polímetro */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Prueba con Polímetro</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold font-mono">✓</span>
                  <span><strong>En frío (OK):</strong> Continuidad directa (0.0 Ω a 0.5 Ω).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold font-mono">✗</span>
                  <span><strong>Disparado / Averiado:</strong> Circuito abierto (OL / ∞).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-400">Si permanece en OL tras 20 min frío, está quemado.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            Referencia: Banco de Prueba de Arranque Directo Frigorista
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
