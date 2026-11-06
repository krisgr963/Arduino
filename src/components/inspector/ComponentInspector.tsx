import React from 'react';
import {
  AlignmentType,
  CircuitComponentInstance,
  CircuitLayer,
  ComponentDefinition,
  DEFAULT_LAYERS,
  DistributionType,
} from '../../types/circuit';
import {
  RotateCw,
  Copy,
  Trash2,
  ExternalLink,
  BookOpen,
  Sliders,
  Zap,
  Info,
  Layers,
  Sparkles,
  PanelRightClose,
  Lock,
  Eye,
  FileText,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { DatasheetPreviewCard } from './DatasheetPreviewCard';

interface ComponentInspectorProps {
  selectedComponent: CircuitComponentInstance | null;
  selectedComponents?: CircuitComponentInstance[];
  componentDef: ComponentDefinition | null;
  componentDefs?: Map<string, ComponentDefinition>;
  layers?: CircuitLayer[];
  isSimulating: boolean;
  onUpdateComponent: (updated: CircuitComponentInstance) => void;
  onRotateComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onAlignComponents?: (type: AlignmentType) => void;
  onDistributeComponents?: (type: DistributionType) => void;
  onSelectComponentById?: (id: string) => void;
  onClose?: () => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedComponent,
  selectedComponents = [],
  componentDef,
  componentDefs,
  layers,
  isSimulating,
  onUpdateComponent,
  onRotateComponent,
  onDuplicateComponent,
  onDeleteComponent,
  onAlignComponents,
  onDistributeComponents,
  onSelectComponentById,
  onClose,
}) => {
  const isMultiSelect = selectedComponents.length > 1;

  // Alignment and Distribution control panel
  const renderAlignmentControls = () => {
    return (
      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Justering &amp; Fordeling</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            {selectedComponents.length} komponenter
          </span>
        </div>

        {/* Alignment Grid */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1.5 font-medium">Juster kanter og senter:</label>
          <div className="grid grid-cols-6 gap-1 bg-slate-900/90 p-1.5 rounded-lg border border-slate-700/60">
            {/* Align Left */}
            <Tooltip title="Venstrejuster" description="Juster til venstre ytterkant" position="bottom">
              <button
                onClick={() => onAlignComponents?.('left')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Venstrejuster"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="2" height="12" rx="0.5" fill="#3b82f6" />
                  <rect x="5" y="3" width="8" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="5" y="9.5" width="5" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>

            {/* Align Center H */}
            <Tooltip title="Midtstill H" description="Sentrer horisontalt" position="bottom">
              <button
                onClick={() => onAlignComponents?.('center-h')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Midtstill horisontalt"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <line x1="8" y1="1" x2="8" y2="15" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" />
                  <rect x="3" y="3" width="10" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="5" y="9.5" width="6" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>

            {/* Align Right */}
            <Tooltip title="Høyrejuster" description="Juster til høyre ytterkant" position="bottom">
              <button
                onClick={() => onAlignComponents?.('right')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Høyrejuster"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="13" y="2" width="2" height="12" rx="0.5" fill="#3b82f6" />
                  <rect x="3" y="3" width="8" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="6" y="9.5" width="5" height="3.5" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>

            {/* Align Top */}
            <Tooltip title="Toppjuster" description="Juster til øverste ytterkant" position="bottom">
              <button
                onClick={() => onAlignComponents?.('top')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Toppjuster"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="1" width="12" height="2" rx="0.5" fill="#3b82f6" />
                  <rect x="3" y="5" width="3.5" height="8" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="9.5" y="5" width="3.5" height="5" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>

            {/* Align Center V */}
            <Tooltip title="Midtstill V" description="Sentrer vertikalt" position="bottom">
              <button
                onClick={() => onAlignComponents?.('center-v')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Midtstill vertikalt"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <line x1="1" y1="8" x2="15" y2="8" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" />
                  <rect x="3" y="3" width="3.5" height="10" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="9.5" y="5" width="3.5" height="6" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>

            {/* Align Bottom */}
            <Tooltip title="Bunnjuster" description="Juster til nederste ytterkant" position="bottom">
              <button
                onClick={() => onAlignComponents?.('bottom')}
                className="w-full p-1.5 rounded hover:bg-slate-700/90 text-slate-300 hover:text-white flex items-center justify-center transition"
                aria-label="Bunnjuster"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="2" y="13" width="12" height="2" rx="0.5" fill="#3b82f6" />
                  <rect x="3" y="3" width="3.5" height="8" rx="1" fill="currentColor" opacity="0.8" />
                  <rect x="9.5" y="6" width="3.5" height="5" rx="1" fill="currentColor" opacity="0.8" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Distribution Buttons */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1.5 font-medium">Fordel med jevn avstand:</label>
          <div className="grid grid-cols-2 gap-2">
            <Tooltip
              title="Fordel horisontalt"
              description="Jevn avstand langs X-aksen (krever 3+ komponenter)"
              position="bottom"
              disabled={selectedComponents.length < 3}
            >
              <button
                onClick={() => onDistributeComponents?.('horizontal')}
                disabled={selectedComponents.length < 3}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center space-x-1.5 transition ${
                  selectedComponents.length >= 3
                    ? 'bg-slate-900/90 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700/60'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-blue-400">
                  <rect x="1" y="2" width="1.5" height="12" rx="0.5" fill="currentColor" opacity="0.5" />
                  <rect x="13.5" y="2" width="1.5" height="12" rx="0.5" fill="currentColor" opacity="0.5" />
                  <rect x="4" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" />
                  <rect x="9.5" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" />
                </svg>
                <span>Horisontalt</span>
              </button>
            </Tooltip>

            <Tooltip
              title="Fordel vertikalt"
              description="Jevn avstand langs Y-aksen (krever 3+ komponenter)"
              position="bottom"
              disabled={selectedComponents.length < 3}
            >
              <button
                onClick={() => onDistributeComponents?.('vertical')}
                disabled={selectedComponents.length < 3}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center space-x-1.5 transition ${
                  selectedComponents.length >= 3
                    ? 'bg-slate-900/90 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700/60'
                    : 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-blue-400">
                  <rect x="2" y="1" width="12" height="1.5" rx="0.5" fill="currentColor" opacity="0.5" />
                  <rect x="2" y="13.5" width="12" height="1.5" rx="0.5" fill="currentColor" opacity="0.5" />
                  <rect x="4" y="4" width="8" height="2.5" rx="0.5" fill="currentColor" />
                  <rect x="4" y="9.5" width="8" height="2.5" rx="0.5" fill="currentColor" />
                </svg>
                <span>Vertikalt</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  };

  // If nothing is selected
  if (!selectedComponent && selectedComponents.length === 0) {
    return (
      <div className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col text-slate-300 text-xs select-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Egenskaper</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="Skjul egenskaper-meny (Hurtigtast: ] )"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
            <Sliders className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-white">Ingen komponent valgt</h4>
          <p className="text-slate-400 leading-relaxed">
            Klikk på en komponent, eller dra en markering over flere komponenter for bulk-redigering og justering.
          </p>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 text-left w-full space-y-1.5 mt-4">
            <div className="text-[11px] font-bold text-slate-300">Tastatursnarveier &amp; Tips:</div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">Dra på lerretet</strong>: Boks-markering (velg flere)
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">R</strong>: Roter valgt(e) 90°
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">G</strong>: Festing til rutenett (Snap on/off)
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">N</strong>: Ny klistrelapp / notat
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">E</strong>: Åpne ERC-valideringspanel
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">Delete / Backspace</strong>: Slett valgte
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">Ctrl+Z / Ctrl+Y</strong>: Angre / Gjenta
            </div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">Escape</strong>: Avbryt ledningsføring
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-Selection View
  if (isMultiSelect) {
    return (
      <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 text-xs overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                  Gruppe
                </span>
                <span className="px-1.5 py-0.2 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-[10px] font-mono font-bold">
                  {selectedComponents.length} valgt
                </span>
              </div>
              <h3 className="font-bold text-white text-sm mt-0.5">Flervalg / Gruppe</h3>
            </div>

            {/* Quick Actions (Rotate, Duplicate, Delete) for entire selection */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => selectedComponents.forEach((c) => onRotateComponent(c.id))}
                title="Roter alle valgte 90° (R)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => selectedComponents.forEach((c) => onDuplicateComponent(c.id))}
                title="Dupliser alle valgte"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => selectedComponents.forEach((c) => onDeleteComponent(c.id))}
                title="Slett alle valgte (Del)"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
                  title="Skjul egenskaper-meny (Hurtigtast: ] )"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Alignment and Distribution Controls */}
          {renderAlignmentControls()}

          {/* List of Selected Components */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Valgte komponenter ({selectedComponents.length}):
            </h4>

            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {selectedComponents.map((comp) => {
                const def = componentDefs?.get(comp.typeId);
                return (
                  <div
                    key={comp.id}
                    onClick={() => onSelectComponentById?.(comp.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer transition group"
                  >
                    <div>
                      <div className="font-semibold text-white group-hover:text-blue-400 transition">
                        {comp.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {def?.name || comp.typeId} · ({comp.x}, {comp.y})
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComponent(comp.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400 rounded"
                      title="Fjern fra kretsen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Component Selection View
  if (!selectedComponent || !componentDef) return null;

  const { properties, state } = selectedComponent;

  const handlePropertyChange = (key: string, value: any) => {
    onUpdateComponent({
      ...selectedComponent,
      properties: {
        ...properties,
        [key]: value,
      },
    });
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateComponent({
      ...selectedComponent,
      label: e.target.value,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateComponent({
      ...selectedComponent,
      notes: e.target.value,
    });
  };

  const handleDatasheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateComponent({
      ...selectedComponent,
      datasheetUrl: e.target.value,
    });
  };

  const handleLayerChange = (layerId: string) => {
    onUpdateComponent({
      ...selectedComponent,
      layerId,
    });
  };

  const activeLayerId = selectedComponent.layerId || 'layer_components';
  const availableLayers = layers && layers.length > 0 ? layers : DEFAULT_LAYERS;
  const activeLayer = availableLayers.find((l) => l.id === activeLayerId);

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 text-xs overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
              {componentDef.category}
            </span>
            <h3 className="font-bold text-white text-sm mt-0.5">{componentDef.name}</h3>
          </div>

          {/* Quick Actions (Rotate, Duplicate, Delete, Close) */}
          <div className="flex items-center space-x-1">
            <Tooltip title="Roter 90°" shortcut="R" description="Roter komponenten en kvart omdreining" position="bottom">
              <button
                onClick={() => onRotateComponent(selectedComponent.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                aria-label="Roter 90 grader"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Dupliser" description="Lag en kopi av komponenten" position="bottom">
              <button
                onClick={() => onDuplicateComponent(selectedComponent.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                aria-label="Dupliser komponent"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            <Tooltip title="Slett" shortcut="Del" description="Fjern komponenten fra kretsen" position="bottom">
              <button
                onClick={() => onDeleteComponent(selectedComponent.id)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-400 transition"
                aria-label="Slett komponent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>

            {onClose && (
              <Tooltip title="Skjul egenskaper" shortcut="]" description="Lukk inspektørpanelet" position="left">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
                  aria-label="Skjul egenskaper-meny"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Component Label Input & Layer Assignment */}
        <div className="mt-3 space-y-2">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Kretsreferanse (Label):</label>
            <input
              type="text"
              value={selectedComponent.label}
              onChange={handleLabelChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-slate-400">Tilhørende lag:</label>
              {activeLayer?.locked && (
                <span className="text-[10px] text-amber-400 font-semibold flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Låst lag</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow"
                style={{ backgroundColor: activeLayer?.color || '#3b82f6' }}
              />
              <select
                value={activeLayerId}
                onChange={(e) => handleLayerChange(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {availableLayers.map((lay) => (
                  <option key={lay.id} value={lay.id}>
                    {lay.name} {lay.locked ? '🔒 (Låst)' : ''} {!lay.visible ? '👁️ (Skjult)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Live Simulation Monitor Status */}
        {isSimulating && state && (
          <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Simuleringsstatus</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] ${
                  state.simBurned
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : state.simActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {state.simBurned ? 'ØDELAGT' : state.simActive ? 'AKTIV' : 'INAKTIV'}
              </span>
            </div>

            {state.simVoltage !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Spenning (V):</span>
                <span className="font-mono font-bold text-white">
                  {state.simVoltage.toFixed(2)} V
                </span>
              </div>
            )}
            {state.simCurrent !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Beregnet strøm:</span>
                <span className="font-mono font-bold text-blue-400">
                  {state.simCurrent} mA
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Property Definitions (e.g. Resistance, LED Color) */}
        {componentDef.propertyDefinitions && componentDef.propertyDefinitions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Parametere &amp; Verdier
            </h4>
            {componentDef.propertyDefinitions.map((propDef) => {
              const val = properties[propDef.key] ?? propDef.defaultValue;

              return (
                <div key={propDef.key}>
                  <label className="block text-[11px] text-slate-400 mb-1">{propDef.label}</label>

                  {propDef.type === 'select' && propDef.options && (
                    <select
                      value={val}
                      onChange={(e) => handlePropertyChange(propDef.key, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {propDef.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {propDef.type === 'number' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min={propDef.min ?? 0}
                        max={propDef.max ?? 100}
                        step={propDef.step ?? 1}
                        value={val}
                        onChange={(e) =>
                          handlePropertyChange(propDef.key, parseFloat(e.target.value))
                        }
                        className="flex-1 accent-blue-500"
                      />
                      <span className="font-mono text-white text-xs w-10 text-right">{val}</span>
                    </div>
                  )}

                  {propDef.type === 'color' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={val}
                        onChange={(e) => handlePropertyChange(propDef.key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handlePropertyChange(propDef.key, e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Notes & Datasheet */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Notater &amp; Datablad</span>
          </h4>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Egne notater / Merknader:
            </label>
            <textarea
              value={selectedComponent.notes || ''}
              onChange={handleNotesChange}
              rows={3}
              placeholder="F.eks. kobles til sensorport 2, krever pullup..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] text-slate-400">Datablad URL:</label>
              {(selectedComponent.datasheetUrl || componentDef.datasheetUrl) && (
                <span className="text-[10px] text-blue-400 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Datablad tilknyttet</span>
                </span>
              )}
            </div>
            <div className="flex space-x-1">
              <input
                type="url"
                value={selectedComponent.datasheetUrl || componentDef.datasheetUrl || ''}
                onChange={handleDatasheetChange}
                placeholder="https://... (eller lim inn datablad-lenke)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              {(selectedComponent.datasheetUrl || componentDef.datasheetUrl) && (
                <Tooltip title="Åpne datablad" description="Åpne dokumentet i ny nettleserfane" position="left">
                  <a
                    href={selectedComponent.datasheetUrl || componentDef.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg border border-slate-700 flex items-center justify-center transition"
                    aria-label="Åpne datablad i ny fane"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Tooltip>
              )}
            </div>
          </div>

        </div>

        {/* Dedikert 'Forhåndsvisning'-seksjon for Datablad, Utdrag og Skjema */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Forhåndsvisning</span>
            </h4>
            {(selectedComponent.datasheetUrl || componentDef.datasheetUrl) ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Dokumentasjon aktiv</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Ingen datablad valgt</span>
            )}
          </div>

          {(selectedComponent.datasheetUrl || componentDef.datasheetUrl) ? (
            <DatasheetPreviewCard
              selectedComponent={selectedComponent}
              componentDef={componentDef}
              datasheetUrl={selectedComponent.datasheetUrl || componentDef.datasheetUrl}
              onOpenExternal={() => {
                const url = selectedComponent.datasheetUrl || componentDef.datasheetUrl;
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
            />
          ) : (
            <div className="bg-slate-900/60 border border-dashed border-slate-700/80 rounded-xl p-3 text-center space-y-1.5 text-slate-400">
              <div className="flex justify-center text-slate-500">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Ingen datablad-lenke er definert ennå
              </p>
              <p className="text-[10px] text-slate-500 leading-normal">
                Skriv eller lim inn en URL i feltet ovenfor for å se teknisk utdrag, skjematisk tegning eller iframe-forhåndsvisning.
              </p>
            </div>
          )}
        </div>

        {/* Pinout List */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tilkoblingspunkter ({componentDef.pins.length} pinner)
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {componentDef.pins.map((pin) => (
              <div
                key={pin.id}
                className="flex items-center justify-between p-1.5 rounded bg-slate-800/60 border border-slate-700/50 text-[11px]"
              >
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pin.type === 'power'
                        ? 'bg-red-500'
                        : pin.type === 'ground'
                        ? 'bg-slate-900 border border-slate-500'
                        : pin.type === 'analog'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-mono font-semibold text-white">{pin.name}</span>
                </div>
                <span className="text-[10px] text-slate-400">{pin.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
