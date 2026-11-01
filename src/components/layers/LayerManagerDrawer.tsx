import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  X,
  Check,
  Shield,
  Palette,
  Info,
  Sparkles,
} from 'lucide-react';
import { CircuitLayer, CircuitProject } from '../../types/circuit';
import { Tooltip } from '../common/Tooltip';

interface LayerManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  layers: CircuitLayer[];
  project: CircuitProject;
  onUpdateLayers: (updatedLayers: CircuitLayer[]) => void;
  onMoveComponentsToLayer?: (sourceLayerId: string, targetLayerId: string) => void;
}

const PRESET_LAYER_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#64748b', // Slate
];

export const LayerManagerDrawer: React.FC<LayerManagerDrawerProps> = ({
  isOpen,
  onClose,
  layers,
  project,
  onUpdateLayers,
  onMoveComponentsToLayer,
}) => {
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#8b5cf6');
  const [isAddingLayer, setIsAddingLayer] = useState(false);

  if (!isOpen) return null;

  // Toggle Visibility for a single layer
  const handleToggleVisibility = (layerId: string) => {
    const updated = layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
    onUpdateLayers(updated);
  };

  // Toggle Lock for a single layer
  const handleToggleLock = (layerId: string) => {
    const updated = layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l));
    onUpdateLayers(updated);
  };

  // Make all visible
  const handleShowAll = () => {
    const updated = layers.map((l) => ({ ...l, visible: true }));
    onUpdateLayers(updated);
  };

  // Hide all
  const handleHideAll = () => {
    const updated = layers.map((l) => ({ ...l, visible: false }));
    onUpdateLayers(updated);
  };

  // Unlock all
  const handleUnlockAll = () => {
    const updated = layers.map((l) => ({ ...l, locked: false }));
    onUpdateLayers(updated);
  };

  // Create new layer
  const handleCreateLayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLayerName.trim();
    if (!trimmed) return;

    const newId = `layer_${Date.now()}`;
    const newLayer: CircuitLayer = {
      id: newId,
      name: trimmed,
      color: newLayerColor,
      visible: true,
      locked: false,
      isDefault: false,
    };

    onUpdateLayers([...layers, newLayer]);
    setNewLayerName('');
    setIsAddingLayer(false);
  };

  // Delete custom layer
  const handleDeleteLayer = (layerId: string) => {
    // Reassign items to default component layer
    onMoveComponentsToLayer?.(layerId, 'layer_components');
    const updated = layers.filter((l) => l.id !== layerId);
    onUpdateLayers(updated);
  };

  // Count items assigned to each layer
  const getLayerStats = (layerId: string) => {
    const isCompDefault = layerId === 'layer_components';
    const isWireDefault = layerId === 'layer_wires';
    const isNoteDefault = layerId === 'layer_notes';

    const compCount = project.components.filter(
      (c) => c.layerId === layerId || (!c.layerId && isCompDefault)
    ).length;

    const wireCount = project.wires.filter(
      (w) => w.layerId === layerId || (!w.layerId && isWireDefault)
    ).length;

    const noteCount = (project.notes || []).filter(
      (n) => n.layerId === layerId || (!n.layerId && isNoteDefault)
    ).length;

    return { compCount, wireCount, noteCount, total: compCount + wireCount + noteCount };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-200 text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Lag-system for kretsdesign</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Organiser komponenter, ledninger og notater på uavhengige lag
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Lukk lagpanel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toolbar Actions */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Hurtighandlinger:</span>
            <button
              onClick={handleShowAll}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              <span>Vis alle</span>
            </button>
            <button
              onClick={handleHideAll}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <EyeOff className="w-3 h-3 text-slate-400" />
              <span>Skjul alle</span>
            </button>
            <button
              onClick={handleUnlockAll}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center space-x-1"
            >
              <Unlock className="w-3 h-3 text-amber-400" />
              <span>Lås opp alle</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddingLayer(true)}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md shadow flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nytt lag</span>
          </button>
        </div>

        {/* Layer Creation Form (collapsible) */}
        {isAddingLayer && (
          <form
            onSubmit={handleCreateLayer}
            className="p-3.5 bg-slate-950/90 border-b border-slate-800 space-y-2.5 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">Opprett et nytt lag</span>
              <button
                type="button"
                onClick={() => setIsAddingLayer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="F.eks. Strømtilførsel (5V / GND), Sensor-nett..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                autoFocus
              />

              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                {PRESET_LAYER_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewLayerColor(col)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newLayerColor === col ? 'ring-2 ring-white scale-110' : 'opacity-80'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition"
              >
                Opprett
              </button>
            </div>
          </form>
        )}

        {/* Layer List */}
        <div className="p-4 space-y-2.5 overflow-y-auto max-h-[55vh]">
          {layers.map((layer) => {
            const stats = getLayerStats(layer.id);

            return (
              <div
                key={layer.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between ${
                  !layer.visible
                    ? 'bg-slate-950/60 border-slate-850 opacity-60'
                    : layer.locked
                    ? 'bg-slate-850/90 border-amber-500/30'
                    : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Left: Color swatch & Layer details */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: layer.color }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-xs truncate">
                        {layer.name}
                      </span>
                      {layer.isDefault && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-700/70 text-slate-300 font-mono">
                          Standard
                        </span>
                      )}
                      {layer.locked && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center space-x-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Låst</span>
                        </span>
                      )}
                      {!layer.visible && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">
                          Skjult
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>
                        {stats.total === 0
                          ? 'Ingen elementer'
                          : `${stats.compCount > 0 ? `${stats.compCount} komponenter, ` : ''}${
                              stats.wireCount > 0 ? `${stats.wireCount} ledninger, ` : ''
                            }${stats.noteCount > 0 ? `${stats.noteCount} notater` : ''}`.replace(
                              /,\s*$/,
                              ''
                            )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Toggle Visibility & Lock */}
                <div className="flex items-center space-x-1.5 shrink-0 ml-3">
                  {/* Visibility Button */}
                  <Tooltip
                    title={layer.visible ? 'Skjul lag' : 'Vis lag'}
                    description={
                      layer.visible
                        ? 'Gjør alle elementer på dette laget usynlige på lerretet'
                        : 'Gjør elementene på dette laget synlige igjen'
                    }
                    position="left"
                  >
                    <button
                      onClick={() => handleToggleVisibility(layer.id)}
                      className={`p-2 rounded-lg border transition ${
                        layer.visible
                          ? 'bg-slate-900 hover:bg-slate-700 text-emerald-400 border-slate-700'
                          : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                      aria-label="Veksle synlighet"
                    >
                      {layer.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>

                  {/* Lock Button */}
                  <Tooltip
                    title={layer.locked ? 'Lås opp lag' : 'Lås lag'}
                    description={
                      layer.locked
                        ? 'Tillat flytting, redigering og sletting av elementer på dette laget'
                        : 'Lås elementene i ro slik at de ikke kan flyttes eller slettes ved et uhell'
                    }
                    position="left"
                  >
                    <button
                      onClick={() => handleToggleLock(layer.id)}
                      className={`p-2 rounded-lg border transition ${
                        layer.locked
                          ? 'bg-amber-950/60 text-amber-300 border-amber-600/50 hover:bg-amber-900/60'
                          : 'bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                      }`}
                      aria-label="Veksle lås"
                    >
                      {layer.locked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                  </Tooltip>

                  {/* Delete Button (Only for custom layers) */}
                  {!layer.isDefault && (
                    <Tooltip title="Slett lag" description="Flytter elementer til standardlag" position="left">
                      <button
                        onClick={() => handleDeleteLayer(layer.id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                        aria-label="Slett lag"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip / Helper Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Du kan velge lag for enhver komponent i egenskapspanelet til høyre.</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition shrink-0 ml-2"
          >
            Ferdig
          </button>
        </div>
      </div>
    </div>
  );
};
