import React from 'react';
import {
  CircuitComponentInstance,
  ComponentDefinition,
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
} from 'lucide-react';

interface ComponentInspectorProps {
  selectedComponent: CircuitComponentInstance | null;
  componentDef: ComponentDefinition | null;
  isSimulating: boolean;
  onUpdateComponent: (updated: CircuitComponentInstance) => void;
  onRotateComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedComponent,
  componentDef,
  isSimulating,
  onUpdateComponent,
  onRotateComponent,
  onDuplicateComponent,
  onDeleteComponent,
}) => {
  if (!selectedComponent || !componentDef) {
    return (
      <div className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col text-slate-300 text-xs">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Egenskaper</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
            <Sliders className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-white">Ingen komponent valgt</h4>
          <p className="text-slate-400 leading-relaxed">
            Klikk på en komponent eller ledning i arbeidsflaten for å endre verdier, notater og kretsegenskaper.
          </p>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 text-left w-full space-y-1.5 mt-4">
            <div className="text-[11px] font-bold text-slate-300">Tastatursnarveier:</div>
            <div className="text-[11px] text-slate-400">
              • <strong className="text-white">R</strong>: Roter valgt komponent 90°
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
              • <strong className="text-white">Delete / Backspace</strong>: Slett valgt
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

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200 text-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
              {componentDef.category}
            </span>
            <h3 className="font-bold text-white text-sm mt-0.5">{componentDef.name}</h3>
          </div>

          {/* Quick Actions (Rotate, Duplicate, Delete) */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onRotateComponent(selectedComponent.id)}
              title="Roter 90° (R)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDuplicateComponent(selectedComponent.id)}
              title="Dupliser komponent"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteComponent(selectedComponent.id)}
              title="Slett (Del)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Component Label Input */}
        <div className="mt-3">
          <label className="block text-[11px] text-slate-400 mb-1">Kretsreferanse (Label):</label>
          <input
            type="text"
            value={selectedComponent.label}
            onChange={handleLabelChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
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
            <label className="block text-[11px] text-slate-400 mb-1">Datablad URL:</label>
            <div className="flex space-x-1">
              <input
                type="url"
                value={selectedComponent.datasheetUrl || componentDef.datasheetUrl || ''}
                onChange={handleDatasheetChange}
                placeholder="https://..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              {(selectedComponent.datasheetUrl || componentDef.datasheetUrl) && (
                <a
                  href={selectedComponent.datasheetUrl || componentDef.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg border border-slate-700 flex items-center justify-center"
                  title="Åpne datablad i ny fane"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
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
