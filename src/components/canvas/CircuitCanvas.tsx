import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CircuitComponentInstance,
  ComponentDefinition,
  PinDefinition,
  StickyNote,
  WireConnection,
} from '../../types/circuit';
import { ComponentRenderer } from './ComponentRenderer';
import { WireRenderer } from './WireRenderer';

interface CircuitCanvasProps {
  components: CircuitComponentInstance[];
  wires: WireConnection[];
  notes: StickyNote[];
  componentDefs: Map<string, ComponentDefinition>;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  activeWireColor: string;
  isSimulating: boolean;
  activeWireIds: Set<string>;
  snapToGrid: boolean;
  gridSize?: number;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
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
  componentDefs,
  selectedComponentId,
  selectedWireId,
  activeWireColor,
  isSimulating,
  activeWireIds,
  snapToGrid,
  gridSize = 10,
  onSelectComponent,
  onSelectWire,
  onUpdateComponentPosition,
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

  // Pan & Zoom state (controlled or uncontrolled fallback)
  const [internalZoom, setInternalZoom] = useState(1);
  const [internalPan, setInternalPan] = useState({ x: 50, y: 50 });

  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const pan = externalPan !== undefined ? externalPan : internalPan;

  const updateZoom = (z: number) => {
    if (onZoomChange) onZoomChange(z);
    else setInternalZoom(z);
  };

  const updatePan = (p: { x: number; y: number }) => {
    if (onPanChange) onPanChange(p);
    else setInternalPan(p);
  };

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Component Dragging state
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

    // Zoom towards mouse pointer
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    updateZoom(newZoom);
    updatePan({ x: newPanX, y: newPanY });
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle click or space down -> Pan
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

    // Deselect
    onSelectComponent(null);
    onSelectWire(null);
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
    }

    // Dragging component
    if (draggingCompId) {
      let nextX = world.x - dragOffset.x;
      let nextY = world.y - dragOffset.y;

      if (snapToGrid) {
        nextX = Math.round(nextX / gridSize) * gridSize;
        nextY = Math.round(nextY / gridSize) * gridSize;
      }

      onUpdateComponentPosition(draggingCompId, nextX, nextY);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingCompId) {
      setDraggingCompId(null);
      onComponentDragEnd?.();
    }
  };

  // Start dragging component
  const handleComponentMouseDown = (compId: string, e: React.MouseEvent) => {
    if (isSimulating || drawingWireSource) return;
    e.stopPropagation();

    onSelectComponent(compId);
    onSelectWire(null);

    const comp = components.find((c) => c.id === compId);
    if (!comp) return;

    const world = clientToWorld(e.clientX, e.clientY);
    setDraggingCompId(compId);
    setDragOffset({
      x: world.x - comp.x,
      y: world.y - comp.y,
    });
  };

  // Pin interaction
  const handlePinMouseDown = (
    compId: string,
    pin: PinDefinition,
    _e: React.MouseEvent
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
        // Clicked same pin: cancel
        setDrawingWireSource(null);
        setWireCursorPos(null);
        return;
      }

      // Create new wire
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

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireId) {
          onDeleteWire(selectedWireId);
          onSelectWire(null);
        }
      } else if (e.key === 'Escape') {
        setDrawingWireSource(null);
        setWireCursorPos(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, onDeleteWire, onSelectWire]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-default transition-colors duration-200 ${
        canvasTheme === 'light' ? 'bg-[#f4f6f9]' : 'bg-slate-900'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Zoom / Navigation HUD indicator */}
      <div
        className={`absolute bottom-4 left-4 z-20 flex items-center space-x-2 backdrop-blur-md px-3 py-1.5 rounded-lg border text-xs shadow-lg transition-colors ${
          canvasTheme === 'light'
            ? 'bg-white/95 border-slate-300 text-slate-700'
            : 'bg-slate-800/90 border-slate-700 text-slate-300'
        }`}
      >
        <span className="font-mono">{Math.round(zoom * 100)}%</span>
        <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
        <span>{components.length} komponenter</span>
        <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
        <span>{wires.length} ledninger</span>
        {drawingWireSource && (
          <>
            <span className={canvasTheme === 'light' ? 'text-slate-300' : 'text-slate-500'}>|</span>
            <span className="text-emerald-500 font-semibold animate-pulse">
              Kobler ledning... (Klikk på målpinnen, eller Esc for å avbryte)
            </span>
          </>
        )}
      </div>

      {/* Main SVG World */}
      <svg
        className="w-full h-full absolute inset-0"
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

        {/* 1. WIRES LAYER (rendered below components for clean jumper aesthetics) */}
        <g id="wires-layer">
          {wires.map((wire) => {
            const fromComp = components.find((c) => c.id === wire.fromComponentId);
            const toComp = components.find((c) => c.id === wire.toComponentId);
            const fromDef = fromComp ? componentDefs.get(fromComp.typeId) : null;
            const toDef = toComp ? componentDefs.get(toComp.typeId) : null;

            const fromPin = fromDef?.pins.find((p) => p.id === wire.fromPinId);
            const toPin = toDef?.pins.find((p) => p.id === wire.toPinId);

            if (!fromComp || !toComp || !fromPin || !toPin) return null;

            const p1 = getAbsolutePinCoords(fromComp, fromPin);
            const p2 = getAbsolutePinCoords(toComp, toPin);

            return (
              <WireRenderer
                key={wire.id}
                wire={wire}
                fromX={p1.x}
                fromY={p1.y}
                toX={p2.x}
                toY={p2.y}
                isSelected={selectedWireId === wire.id}
                isEnergized={activeWireIds.has(wire.id)}
                isSimulating={isSimulating}
                onSelectWire={(wId) => onSelectWire(wId)}
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
          {notes.map((note) => (
            <g key={note.id} transform={`translate(${note.x}, ${note.y})`} className="cursor-move">
              <rect
                width={note.width}
                height={note.height}
                rx={6}
                fill={note.color || '#fef08a'}
                stroke="#ca8a04"
                strokeWidth={1}
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
              />
              <foreignObject width={note.width} height={note.height}>
                <div className="p-2 text-xs font-sans text-slate-800 leading-tight select-text overflow-hidden h-full flex flex-col justify-between">
                  <p className="whitespace-pre-wrap">{note.text}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote?.(note.id);
                    }}
                    className="self-end text-[10px] text-slate-500 hover:text-red-600 font-semibold"
                  >
                    Slett
                  </button>
                </div>
              </foreignObject>
            </g>
          ))}
        </g>

        {/* 3. COMPONENTS LAYER */}
        <g id="components-layer">
          {components.map((comp) => {
            const def = componentDefs.get(comp.typeId);
            if (!def) return null;

            return (
              <g
                key={comp.id}
                onMouseDown={(e) => handleComponentMouseDown(comp.id, e)}
                className="cursor-move"
              >
                <ComponentRenderer
                  component={comp}
                  definition={def}
                  isSelected={selectedComponentId === comp.id}
                  isSimulating={isSimulating}
                  hoveredPinId={hoveredPin?.componentId === comp.id ? hoveredPin.pinId : null}
                  activePinId={
                    drawingWireSource?.componentId === comp.id ? drawingWireSource.pin.id : null
                  }
                  onPinMouseDown={(pin, e) => handlePinMouseDown(comp.id, pin, e)}
                  onPinMouseEnter={(pin) => setHoveredPin({ componentId: comp.id, pinId: pin.id })}
                  onPinMouseLeave={() => setHoveredPin(null)}
                  onComponentClick={() => {
                    if (isSimulating) {
                      onToggleComponentState?.(comp.id);
                    }
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
