import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, RotateCcw } from 'lucide-react';

export interface ZoomPanViewerProps {
  children: React.ReactNode;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  className?: string;
  containerClassName?: string;
  toolbarPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showToolbar?: boolean;
  showHints?: boolean;
  title?: string;
}

/**
 * ZoomPanViewer Component
 * Provides Zoom In (+), Zoom Out (-), Zoom All / Reset (100%), and smooth Pan (drag to move)
 * for windows presenting images or interactive technical schematics.
 */
export const ZoomPanViewer: React.FC<ZoomPanViewerProps> = ({
  children,
  initialZoom = 1,
  minZoom = 0.8,
  maxZoom = 3.5,
  step = 0.25,
  className = '',
  containerClassName = '',
  toolbarPosition = 'top-right',
  showToolbar = true,
  showHints = true,
  title
}) => {
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panModeLocked, setPanModeLocked] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // Zoom In handler
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(maxZoom, +(prev + step).toFixed(2));
      return next;
    });
  }, [maxZoom, step]);

  // Zoom Out handler
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(minZoom, +(prev - step).toFixed(2));
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  }, [minZoom, step]);

  // Zoom All / Fit / Reset handler
  const handleZoomAll = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPanModeLocked(false);
  }, []);

  // Toggle Pan Mode
  const handleTogglePanMode = useCallback(() => {
    setPanModeLocked((prev) => !prev);
  }, []);

  // Clamp pan so image cannot be moved completely outside view
  const clampPan = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      if (!containerRef.current) return { x: newX, y: newY };
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const maxPanX = Math.max(0, (width * (currentZoom - 1)) / 2 + 120);
      const maxPanY = Math.max(0, (height * (currentZoom - 1)) / 2 + 120);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      };
    },
    []
  );

  // Wheel zoom handling with passive: false for e.preventDefault()
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? step : -step;
      setZoom((prev) => {
        const next = Math.min(maxZoom, Math.max(minZoom, +(prev + delta).toFixed(2)));
        if (next <= 1) {
          setPan({ x: 0, y: 0 });
        }
        return next;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [maxZoom, minZoom, step]);

  // Pointer Down for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on an interactive control (button, input, select, etc.) and panModeLocked is not on,
    // don't start pan drag so button click works seamlessly!
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
    if (isInteractive && !panModeLocked) {
      return;
    }

    // Allow panning if pan mode locked OR if zoomed in (zoom > 1) or secondary mouse button
    if (panModeLocked || zoom > 1 || e.button === 1) {
      setIsPanning(true);
      hasMovedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move for panning
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    const nextPan = clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom);
    setPan(nextPan);
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Double click to toggle Zoom 100% vs 200%
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="button"]')) return;
    if (zoom > 1.1) {
      handleZoomAll();
    } else {
      setZoom(1.8);
    }
  };

  // Toolbar position classes
  const toolbarPosClass = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  }[toolbarPosition];

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: isPanning
          ? 'grabbing'
          : panModeLocked
          ? 'grab'
          : zoom > 1
          ? 'grab'
          : 'default',
        touchAction: 'none',
      }}
    >
      {/* FLOATING ZOOM / PAN TOOLBAR */}
      {showToolbar && (
        <div
          className={`absolute z-30 flex items-center gap-1 p-1 bg-slate-950/85 hover:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl text-white transition-all ${toolbarPosClass}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              zoom <= minZoom
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Alejar (Zoom Out)"
            aria-label="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Indicator / Zoom All / Reset Button */}
          <button
            type="button"
            onClick={handleZoomAll}
            className="px-2 h-7 rounded text-[11px] font-mono font-bold flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Ajustar todo / Zoom All (100%)"
            aria-label="Ajustar todo (100%)"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
              zoom >= maxZoom
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Acercar (Zoom In)"
            aria-label="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Pan Tool Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePanMode}
            className={`px-2 h-7 rounded text-[11px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              panModeLocked
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={panModeLocked ? 'Desactivar modo paneo' : 'Activar modo paneo (arrastrar para mover)'}
            aria-label="Herramienta Paneo"
          >
            <Move className="w-3 h-3" />
            <span className="hidden sm:inline">Paneo</span>
          </button>

          {/* Reset Position (if panned) */}
          {(pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={() => setPan({ x: 0, y: 0 })}
              className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Centrar vista"
              aria-label="Centrar vista"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* HELPER HINT AT BOTTOM OF VIEWER */}
      {showHints && zoom > 1 && (
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none text-[9px] font-mono bg-black/75 backdrop-blur-xs text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded shadow">
          Arrastra para mover la imagen • Rueda: Zoom
        </div>
      )}

      {/* TRANSFORMABLE CONTENT CONTAINER */}
      <div
        ref={contentRef}
        className={`w-full h-full transform-gpu transition-transform origin-center ${
          isPanning ? 'duration-0' : 'duration-150'
        } ${containerClassName}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
};
