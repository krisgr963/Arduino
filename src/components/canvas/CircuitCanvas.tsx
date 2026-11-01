import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CircuitComponentInstance,
  CircuitLayer,
  ComponentDefinition,
  PinDefinition,
  StickyNote,
  WireConnection,
} from '../../types/circuit';
import { ComponentRenderer } from './ComponentRenderer';
import { WireRenderer } from './WireRenderer';
import { Hand, MousePointer, BoxSelect } from 'lucide-react';

interface CircuitCanvasProps {
  components: CircuitComponentInstance[];
  wires: WireConnection[];
  notes: StickyNote[];
  layers?: CircuitLayer[];
  componentDefs: Map<string, ComponentDefinition>;
  selectedComponentId?: string | null;
  selectedComponentIds?: string[];
  selectedWireId?: string | null;
  selectedWireIds?: string[];
  activeWireColor: string;
  isSimulating: boolean;
  activeWireIds: Set<string>;
  snapToGrid: boolean;
  gridSize?: number;
  onSelectComponent: (id: string | null) => void;
  onSelectComponents?: (ids: string[]) => void;
  onSelectWire: (id: string | null) => void;
  onSelectWires?: (ids: string[]) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onBulkUpdatePositions?: (updates: { id: string; x: number; y: number }[]) => void;
  onAddWire: (wire: WireConnection) => void;
  onDeleteWire: (wireId: string) => void;
  onToggleComponentState?: (componentId: string) => void;
  onDropNewComponent?: (typeId: string, x: number, y: number) => void;
  onUpdateNote?: (note: StickyNote) => void;
  onDeleteNote?: (noteId: string) => void;
  multimeterActive?: boolean;
  onProbePin?: (pinInfo: { componentId: string; pinId: string; pinName: string; compLabel: string }) => void;
  canvasTheme?: 'dark' | 'light';
  zoom?: number;
  pan?: { x: number; y: number };
  onZoomChange?: (newZoom: number) => void;
  onPanChange?: (newPan: { x: number; y: number }) => void;
  onComponentDragEnd?: () => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  wires,
  notes,
  layers,
  componentDefs,
  selectedComponentId,
  selectedComponentIds,
  selectedWireId,
  selectedWireIds,
  activeWireColor,
  isSimulating,
  activeWireIds,
  snapToGrid,
  gridSize = 10,
  onSelectComponent,
  onSelectComponents,
  onSelectWire,
  onSelectWires,
  onUpdateComponentPosition,
  onBulkUpdatePositions,
  onAddWire,
  onDeleteWire,
  onToggleComponentState,
  onDropNewComponent,
  onUpdateNote,
  onDeleteNote,
  multimeterActive,
  onProbePin,
  canvasTheme = 'dark',
  zoom: externalZoom,
  pan: externalPan,
  onZoomChange,
  onPanChange,
  onComponentDragEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper functions for layer visibility and lock status
  const isLayerVisible = useCallback(
    (layerId?: string, defaultId = 'layer_components') => {
      if (!layers || layers.length === 0) return true;
      const targetId = layerId || defaultId;
      const l = layers.find((lay) => lay.id === targetId);
      return l ? l.visible : true;
    },
    [layers]
  );

  const isLayerLocked = useCallback(
    (layerId?: string, defaultId = 'layer_components') => {
      if (!layers || layers.length === 0) return false;
      const targetId = layerId || defaultId;
      const l = layers.find((lay) => lay.id === targetId);
      return l ? l.locked : false;
    },
    [layers]
  );

  // Normalize selected IDs
  const activeSelectedCompIds = selectedComponentIds ?? (selectedComponentId ? [selectedComponentId] : []);
  const activeSelectedWireIds = selectedWireIds ?? (selectedWireId ? [selectedWireId] : []);

  // Pan & Zoom state (controlled or uncontrolled fallback)
  const [internalZoom, setInternalZoom] = useState(1);
  const [internalPan, setInternalPan] = useState({ x: 50, y: 50 });

  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const pan = externalPan !== undefined ? externalPan : internalPan;

  const updateZoom = useCallback(
    (z: number) => {
      if (onZoomChange) onZoomChange(z);
      else setInternalZoom(z);
    },
    [onZoomChange]
  );

  const updatePan = useCallback(
    (p: { x: number; y: number }) => {
      if (onPanChange) onPanChange(p);
      else setInternalPan(p);
    },
    [onPanChange]
  );

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Touch device interaction mode: 'select' (draw marquee / tap to select) or 'pan' (drag to pan)
  const [touchMode, setTouchMode] = useState<'select' | 'pan'>('select');

  // Multi-component Bulk Dragging state
  const [dragInfo, setDragInfo] = useState<{
    startWorldX: number;
    startWorldY: number;
    compInitPositions: Map<string, { x: number; y: number }>;
  } | null>(null);

  // Marquee Bounding Box Selection state
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Wiring state
  const [drawingWireSource, setDrawingWireSource] = useState<{
    componentId: string;
    pin: PinDefinition;
    startX: number;
    startY: number;
  } | null>(null);
  const [wireCursorPos, setWireCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Hovered Pin tracking
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pinId: string } | null>(null);

  // Touch pinch zoom tracking for Android
  const touchPinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null>(null);

  // Convert client viewport coordinates to canvas SVG world coordinates
  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / zoom;
      const y = (clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Compute absolute pin coordinates accounting for component position and rotation
  const getAbsolutePinCoords = useCallback(
    (comp: CircuitComponentInstance, pin: PinDefinition) => {
      const def = componentDefs.get(comp.typeId);
      const w = def?.width || 60;
      const h = def?.height || 60;
      const rotation = comp.rotation || 0;

      if (rotation === 0) {
        return { x: comp.x + pin.x, y: comp.y + pin.y };
      }

      // Rotate around component center (comp.x + w/2, comp.y + h/2)
      const cx = comp.x + w / 2;
      const cy = comp.y + h / 2;
      const px = comp.x + pin.x;
      const py = comp.y + pin.y;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const rx = cos * (px - cx) - sin * (py - cy) + cx;
      const ry = sin * (px - cx) + cos * (py - cy) + cy;

      return { x: Math.round(rx), y: Math.round(ry) };
    },
    [componentDefs]
  );

  // Wheel Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 2.5);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    updateZoom(newZoom);
    updatePan({ x: newPanX, y: newPanY });
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click or Alt+click -> Pan
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Cancel drawing wire on background click
    if (drawingWireSource) {
      setDrawingWireSource(null);
      setWireCursorPos(null);
      return;
    }

    if (e.button === 0) {
      // Left click on background: start Marquee selection
      const world = clientToWorld(e.clientX, e.clientY);
      setMarquee({
        startX: world.x,
        startY: world.y,
        currentX: world.x,
        currentY: world.y,
      });

      // If shift not held, clear existing selection
      if (!e.shiftKey) {
        onSelectComponents?.([]);
        onSelectWires?.([]);
        onSelectComponent(null);
        onSelectWire(null);
      }
    }
  };

  // Global Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      updatePan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const world = clientToWorld(e.clientX, e.clientY);

    // Update ongoing wire rubber-banding
    if (drawingWireSource) {
      setWireCursorPos(world);
      return;
    }

    // Update ongoing Marquee selection box
    if (marquee) {
      setMarquee((prev) => (prev ? { ...prev, currentX: world.x, currentY: world.y } : null));
      return;
    }

    // Bulk Dragging of all selected components
    if (dragInfo) {
      const deltaX = world.x - dragInfo.startWorldX;
      const deltaY = world.y - dragInfo.startWorldY;

      dragInfo.compInitPositions.forEach((pos, compId) => {
        let nextX = pos.x + deltaX;
        let nextY = pos.y + deltaY;

        if (snapToGrid) {
          nextX = Math.round(nextX / gridSize) * gridSize;
          nextY = Math.round(nextY / gridSize) * gridSize;
        }

        onUpdateComponentPosition(compId, nextX, nextY);
      });
    }
  };

  // Finalize Marquee selection on release
  const finishMarqueeSelection = () => {
    if (!marquee) return;

    const minX = Math.min(marquee.startX, marquee.currentX);
    const maxX = Math.max(marquee.startX, marquee.currentX);
    const minY = Math.min(marquee.startY, marquee.currentY);
    const maxY = Math.max(marquee.startY, marquee.currentY);
    const width = maxX - minX;
    const height = maxY - minY;

    setMarquee(null);

    // If simply tapped/clicked without dragging, keep cleared
    if (width < 6 && height < 6) {
      return;
    }

    // Find all components intersecting the marquee rectangle (excluding hidden or locked layers)
    const selectedComps: string[] = [];
    components.forEach((comp) => {
      if (!isLayerVisible(comp.layerId, 'layer_components')) return;
      if (isLayerLocked(comp.layerId, 'layer_components')) return;

      const def = componentDefs.get(comp.typeId);
      const compW = def?.width || 60;
      const compH = def?.height || 60;

      // Axis-aligned bounding box intersection
      const compRight = comp.x + compW;
      const compBottom = comp.y + compH;

      const intersects =
        comp.x < maxX && compRight > minX && comp.y < maxY && compBottom > minY;

      if (intersects) {
        selectedComps.push(comp.id);
      }
    });

    // Find all wires with endpoints inside the marquee rectangle (excluding hidden or locked layers)
    const selectedW: string[] = [];
    wires.forEach((wire) => {
      if (!isLayerVisible(wire.layerId, 'layer_wires')) return;
      if (isLayerLocked(wire.layerId, 'layer_wires')) return;

      const fromComp = components.find((c) => c.id === wire.fromComponentId);
      const toComp = components.find((c) => c.id === wire.toComponentId);
      const fromDef = fromComp ? componentDefs.get(fromComp.typeId) : null;
      const toDef = toComp ? componentDefs.get(toComp.typeId) : null;
      const fromPin = fromDef?.pins.find((p) => p.id === wire.fromPinId);
      const toPin = toDef?.pins.find((p) => p.id === wire.toPinId);

      if (fromComp && toComp && fromPin && toPin) {
        const p1 = getAbsolutePinCoords(fromComp, fromPin);
        const p2 = getAbsolutePinCoords(toComp, toPin);

        const p1Inside = p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY;
        const p2Inside = p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY;

        if (p1Inside || p2Inside) {
          selectedW.push(wire.id);
        }
      }
    });

    if (onSelectComponents) onSelectComponents(selectedComps);
    if (onSelectWires) onSelectWires(selectedW);
    onSelectComponent(selectedComps[0] || null);
    onSelectWire(selectedW[0] || null);
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);

    if (marquee) {
      finishMarqueeSelection();
    }

    if (dragInfo) {
      setDragInfo(null);
      onComponentDragEnd?.();
    }
  };

  // Component Mouse Down (Handles single & bulk dragging, and shift-multiselect)
  const handleComponentMouseDown = (compId: string, e: React.MouseEvent) => {
    if (isSimulating || drawingWireSource) return;

    const clickedComp = components.find((c) => c.id === compId);
    if (!clickedComp) return;

    // Locked layer check: locked components cannot be dragged or selected
    if (isLayerLocked(clickedComp.layerId, 'layer_components')) {
      return;
    }

    e.stopPropagation();

    const world = clientToWorld(e.clientX, e.clientY);
    let targetSelection: string[] = [];

    if (e.shiftKey) {
      // Toggle component in/out of selection with Shift
      if (activeSelectedCompIds.includes(compId)) {
        targetSelection = activeSelectedCompIds.filter((id) => id !== compId);
      } else {
        targetSelection = [...activeSelectedCompIds, compId];
      }
    } else {
      // If clicking on an already selected component, maintain group selection for bulk drag!
      if (activeSelectedCompIds.includes(compId)) {
        targetSelection = activeSelectedCompIds;
      } else {
        targetSelection = [compId];
      }
    }

    if (onSelectComponents) onSelectComponents(targetSelection);
    onSelectComponent(targetSelection[0] || null);
    onSelectWire(null);
    if (onSelectWires) onSelectWires([]);

    // Initialize bulk drag position map (filter out any locked components)
    const compInitPositions = new Map<string, { x: number; y: number }>();
    components.forEach((c) => {
      if (targetSelection.includes(c.id) && !isLayerLocked(c.layerId, 'layer_components')) {
        compInitPositions.set(c.id, { x: c.x, y: c.y });
      }
    });

    setDragInfo({
      startWorldX: world.x,
      startWorldY: world.y,
      compInitPositions,
    });
  };

  // Touch Events for Android & Mobile Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (drawingWireSource) return;

    if (e.touches.length === 2) {
      // Two fingers: Pinch to zoom & Pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const mid = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };

      touchPinchRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { ...pan },
        midpoint: mid,
      };
      setMarquee(null);
      setIsPanning(false);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];

      if (touchMode === 'pan') {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      } else {
        // 'select' mode: start marquee box
        const world = clientToWorld(touch.clientX, touch.clientY);
        setMarquee({
          startX: world.x,
          startY: world.y,
          currentX: world.x,
          currentY: world.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchRef.current) {
      // Handle Pinch to Zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / touchPinchRef.current.initialDist;
      const newZoom = Math.min(Math.max(touchPinchRef.current.initialZoom * ratio, 0.25), 2.5);

      const mid = touchPinchRef.current.midpoint;
      const newPanX = mid.x - (mid.x - touchPinchRef.current.initialPan.x) * (newZoom / touchPinchRef.current.initialZoom);
      const newPanY = mid.y - (mid.y - touchPinchRef.current.initialPan.y) * (newZoom / touchPinchRef.current.initialZoom);

      updateZoom(newZoom);
      updatePan({ x: newPanX, y: newPanY });
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];

      if (isPanning) {
        updatePan({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
        return;
      }

      const world = clientToWorld(touch.clientX, touch.clientY);

      // Wire rubberband
      if (drawingWireSource) {
        setWireCursorPos(world);
        return;
      }

      // Marquee box
      if (marquee) {
        setMarquee((prev) => (prev ? { ...prev, currentX: world.x, currentY: world.y } : null));
        return;
      }

      // Drag components on touch
      if (dragInfo) {
        const deltaX = world.x - dragInfo.startWorldX;
        const deltaY = world.y - dragInfo.startWorldY;

        dragInfo.compInitPositions.forEach((pos, compId) => {
          let nextX = pos.x + deltaX;
          let nextY = pos.y + deltaY;

          if (snapToGrid) {
            nextX = Math.round(nextX / gridSize) * gridSize;
            nextY = Math.round(nextY / gridSize) * gridSize;
          }

          onUpdateComponentPosition(compId, nextX, nextY);
        });
      }
    }
  };

  const handleTouchEnd = () => {
    touchPinchRef.current = null;
    if (isPanning) setIsPanning(false);

    if (marquee) {
      finishMarqueeSelection();
    }

    if (dragInfo) {
      setDragInfo(null);
      onComponentDragEnd?.();
    }
  };

  // Pin interaction
  const handlePinMouseDown = (
    compId: string,
    pin: PinDefinition,
    _e: React.MouseEvent | React.TouchEvent
  ) => {
    if (multimeterActive) {
      const comp = components.find((c) => c.id === compId);
      onProbePin?.({
        componentId: compId,
        pinId: pin.id,
        pinName: pin.name,
        compLabel: comp?.label || '',
      });
      return;
    }

    if (!drawingWireSource) {
      // Start drawing wire
      const comp = components.find((c) => c.id === compId);
      if (!comp) return;
      const coords = getAbsolutePinCoords(comp, pin);
      setDrawingWireSource({
        componentId: compId,
        pin,
        startX: coords.x,
        startY: coords.y,
      });
      setWireCursorPos(coords);
    } else {
      // Finish drawing wire if different pin
      if (drawingWireSource.componentId === compId && drawingWireSource.pin.id === pin.id) {
        setDrawingWireSource(null);
        setWireCursorPos(null);
        return;
      }

      const newWire: WireConnection = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromComponentId: drawingWireSource.componentId,
        fromPinId: drawingWireSource.pin.id,
        toComponentId: compId,
        toPinId: pin.id,
        color: activeWireColor,
      };

      onAddWire(newWire);
      setDrawingWireSource(null);
      setWireCursorPos(null);
    }
  };

  // Drag and Drop from Sidebar onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const typeId = e.dataTransfer.getData('application/circulab-component');
    if (!typeId) return;

    const world = clientToWorld(e.clientX, e.clientY);
    const def = componentDefs.get(typeId);
    const w = def?.width || 60;
    const h = def?.height || 60;

    let posX = world.x - w / 2;
    let posY = world.y - h / 2;

    if (snapToGrid) {
      posX = Math.round(posX / gridSize) * gridSize;
      posY = Math.round(posY / gridSize) * gridSize;
    }

    onDropNewComponent?.(typeId, posX, posY);
  };

  // Keyboard shortcut listener (Del, Backspace to delete selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        setDrawingWireSource(null);
        setWireCursorPos(null);
        setMarquee(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-default transition-colors duration-200 touch-none ${
        canvasTheme === 'light' ? 'bg-[#f4f6f9]' : 'bg-slate-900'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ touchAction: 'none' }}
    >
      {/* Zoom / Navigation HUD indicator + Mobile Touch Mode Toggle */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2">
        <div
          className={`backdrop-blur-md px-3 py-1.5 rounded-lg border text-xs shadow-lg transition-colors flex items-center space-x-2 ${
            canvasTheme === 'light'
              ? 'bg-white/95 border-slate-300 text-slate-700'
              : 'bg-slate-800/90 border-slate-700 text-slate-300'
          }`}
        >
          <span className="font-mono">{Math.round(zoom * 100)}%</span>
          <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
          <span>{components.length} komponenter</span>
          {activeSelectedCompIds.length > 0 && (
            <>
              <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
              <span className="text-blue-500 font-bold">{activeSelectedCompIds.length} valgt</span>
            </>
          )}
          {drawingWireSource && (
            <>
              <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
              <span className="text-emerald-500 font-semibold animate-pulse">
                Kobler ledning...
              </span>
            </>
          )}
        </div>

        {/* Android / Touch Device Mode Switcher (Select vs Pan) */}
        <div className="flex items-center space-x-1 bg-slate-800/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 shadow-lg text-slate-300 text-xs">
          <button
            onClick={() => setTouchMode('select')}
            className={`p-1.5 rounded flex items-center space-x-1 transition ${
              touchMode === 'select'
                ? 'bg-blue-600 text-white font-semibold'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="Boks-markering (Dra for å velge flere)"
          >
            <BoxSelect className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Boksvalg</span>
          </button>
          <button
            onClick={() => setTouchMode('pan')}
            className={`p-1.5 rounded flex items-center space-x-1 transition ${
              touchMode === 'pan'
                ? 'bg-blue-600 text-white font-semibold'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="Panorer lerret (Dra for å flytte visning)"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Panorer</span>
          </button>
        </div>
      </div>

      {/* Main SVG World */}
      <svg
        className="circulab-canvas w-full h-full absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Grid Pattern with light/dark adaptive colors */}
          <pattern id="circulab-grid-small" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle
              cx="5"
              cy="5"
              r="0.8"
              fill={canvasTheme === 'light' ? '#94a3b8' : '#334155'}
              opacity={canvasTheme === 'light' ? 0.45 : 0.6}
            />
          </pattern>
          <pattern id="circulab-grid-large" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="url(#circulab-grid-small)" />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke={canvasTheme === 'light' ? '#cbd5e1' : '#475569'}
              strokeWidth={canvasTheme === 'light' ? 0.9 : 0.8}
              opacity={canvasTheme === 'light' ? 0.75 : 0.4}
            />
          </pattern>
        </defs>

        {/* Endless Grid Canvas Background */}
        <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#circulab-grid-large)" />

        {/* 1. WIRES LAYER */}
        <g id="wires-layer">
          {wires
            .filter((wire) => isLayerVisible(wire.layerId, 'layer_wires'))
            .map((wire) => {
              const fromComp = components.find((c) => c.id === wire.fromComponentId);
              const toComp = components.find((c) => c.id === wire.toComponentId);
              const fromDef = fromComp ? componentDefs.get(fromComp.typeId) : null;
              const toDef = toComp ? componentDefs.get(toComp.typeId) : null;

              const fromPin = fromDef?.pins.find((p) => p.id === wire.fromPinId);
              const toPin = toDef?.pins.find((p) => p.id === wire.toPinId);

              if (!fromComp || !toComp || !fromPin || !toPin) return null;

              const p1 = getAbsolutePinCoords(fromComp, fromPin);
              const p2 = getAbsolutePinCoords(toComp, toPin);

              const isWireSelected = activeSelectedWireIds.includes(wire.id);
              const isLocked = isLayerLocked(wire.layerId, 'layer_wires');

              return (
                <WireRenderer
                  key={wire.id}
                  wire={wire}
                  fromX={p1.x}
                  fromY={p1.y}
                  toX={p2.x}
                  toY={p2.y}
                  isSelected={isWireSelected}
                  isEnergized={activeWireIds.has(wire.id)}
                  isSimulating={isSimulating}
                  onSelectWire={(wId) => {
                    if (isLocked) return;
                    if (onSelectWires) onSelectWires([wId]);
                    onSelectWire(wId);
                    onSelectComponent(null);
                    if (onSelectComponents) onSelectComponents([]);
                  }}
                />
              );
            })}

          {/* Active Rubber-Band Wire Being Drawn */}
          {drawingWireSource && wireCursorPos && (
            <g className="pointer-events-none">
              <path
                d={`M ${drawingWireSource.startX} ${drawingWireSource.startY} Q ${(drawingWireSource.startX + wireCursorPos.x) / 2} ${(drawingWireSource.startY + wireCursorPos.y) / 2 + 20} ${wireCursorPos.x} ${wireCursorPos.y}`}
                fill="none"
                stroke={activeWireColor}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <circle
                cx={wireCursorPos.x}
                cy={wireCursorPos.y}
                r={6}
                fill={activeWireColor}
                opacity={0.8}
              />
            </g>
          )}
        </g>

        {/* 2. STICKY NOTES LAYER */}
        <g id="notes-layer">
          {notes
            .filter((note) => isLayerVisible(note.layerId, 'layer_notes'))
            .map((note) => {
              const isLocked = isLayerLocked(note.layerId, 'layer_notes');

              return (
                <g
                  key={note.id}
                  transform={`translate(${note.x}, ${note.y})`}
                  className={isLocked ? 'cursor-default' : 'cursor-move'}
                >
                  <rect
                    width={note.width}
                    height={note.height}
                    rx={6}
                    fill={note.color || '#fef08a'}
                    stroke={isLocked ? '#eab308' : '#ca8a04'}
                    strokeWidth={isLocked ? 1.5 : 1}
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
                  />
                  <foreignObject width={note.width} height={note.height}>
                    <div className="p-2 text-xs font-sans text-slate-800 leading-tight select-text overflow-hidden h-full flex flex-col justify-between">
                      <p className="whitespace-pre-wrap">{note.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        {isLocked ? (
                          <span className="text-[9px] text-amber-800 font-semibold flex items-center space-x-0.5">
                            🔒 Låst lag
                          </span>
                        ) : (
                          <span />
                        )}
                        {!isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote?.(note.id);
                            }}
                            className="text-[10px] text-slate-500 hover:text-red-600 font-semibold"
                          >
                            Slett
                          </button>
                        )}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
        </g>

        {/* 3. COMPONENTS LAYER */}
        <g id="components-layer">
          {components
            .filter((comp) => isLayerVisible(comp.layerId, 'layer_components'))
            .map((comp) => {
              const def = componentDefs.get(comp.typeId);
              if (!def) return null;

              const isCompSelected = activeSelectedCompIds.includes(comp.id);
              const isLocked = isLayerLocked(comp.layerId, 'layer_components');

              return (
                <g
                  key={comp.id}
                  onMouseDown={(e) => handleComponentMouseDown(comp.id, e)}
                  onTouchStart={(e) => {
                    if (touchMode !== 'pan') {
                      handleComponentMouseDown(comp.id, {
                        clientX: e.touches[0].clientX,
                        clientY: e.touches[0].clientY,
                        shiftKey: false,
                        stopPropagation: () => e.stopPropagation(),
                      } as any);
                    }
                  }}
                  className={isLocked ? 'cursor-default' : 'cursor-move'}
                >
                  <ComponentRenderer
                    component={comp}
                    definition={def}
                    isSelected={isCompSelected}
                    isSimulating={isSimulating}
                    hoveredPinId={hoveredPin?.componentId === comp.id ? hoveredPin.pinId : null}
                    activePinId={
                      drawingWireSource?.componentId === comp.id ? drawingWireSource.pin.id : null
                    }
                    onPinMouseDown={(pin, e) => {
                      if (isLocked) return;
                      handlePinMouseDown(comp.id, pin, e);
                    }}
                    onPinMouseEnter={(pin) => {
                      if (!isLocked) setHoveredPin({ componentId: comp.id, pinId: pin.id });
                    }}
                    onPinMouseLeave={() => setHoveredPin(null)}
                    onComponentClick={() => {
                      if (isSimulating) {
                        onToggleComponentState?.(comp.id);
                      }
                    }}
                  />

                  {/* Lock Indicator Badge for Locked Components */}
                  {isLocked && (
                    <g
                      transform={`translate(${comp.x + def.width - 20}, ${comp.y + 4})`}
                      className="pointer-events-none"
                    >
                      <circle cx="8" cy="8" r="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.2" />
                      <path
                        d="M5 8V6a3 3 0 0 1 6 0v2 M4 8h8v6H4z"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              );
            })}
        </g>

        {/* 4. MARQUEE BOUNDING BOX SELECTION RECTANGLE */}
        {marquee && (
          <g id="marquee-layer" className="pointer-events-none">
            <rect
              x={Math.min(marquee.startX, marquee.currentX)}
              y={Math.min(marquee.startY, marquee.currentY)}
              width={Math.abs(marquee.currentX - marquee.startX)}
              height={Math.abs(marquee.currentY - marquee.startY)}
              fill="#3b82f6"
              fillOpacity={0.15}
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              rx={2}
            />
          </g>
        )}
      </svg>
    </div>
  );
};
