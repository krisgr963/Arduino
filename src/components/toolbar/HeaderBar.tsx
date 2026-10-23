import React from 'react';
import { ERCWarning } from '../../types/circuit';
import {
  Play,
  Square,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  FileSpreadsheet,
  FolderOpen,
  StickyNote,
  Grid,
  Zap,
  Download,
  Sun,
  Moon,
  Check,
  RotateCw,
  Cloud,
} from 'lucide-react';

interface HeaderBarProps {
  projectName: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  warnings: ERCWarning[];
  onOpenERCWarnings: () => void;
  onOpenBOM: () => void;
  onOpenProjects: () => void;
  onAddStickyNote: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  activeWireColor: string;
  onChangeWireColor: (color: string) => void;
  onExportJson: () => void;
  canvasTheme: 'dark' | 'light';
  onToggleCanvasTheme: () => void;
  lastSavedTime: Date | null;
  isSaving: boolean;
  onManualSave: () => void;
}

const WIRE_COLORS = [
  { label: 'Rød (+ / VCC)', color: '#dc2626' },
  { label: 'Sort (GND / Jord)', color: '#0f172a' },
  { label: 'Blå (Signal)', color: '#2563eb' },
  { label: 'Grønn (Signal)', color: '#16a34a' },
  { label: 'Gul (Signal/Data)', color: '#eab308' },
  { label: 'Oransje (Spenning)', color: '#f97316' },
  { label: 'Fiolett (I2C/SPI)', color: '#9333ea' },
  { label: 'Hvit (Passiv)', color: '#f8fafc' },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  projectName,
  isSimulating,
  onToggleSimulation,
  warnings,
  onOpenERCWarnings,
  onOpenBOM,
  onOpenProjects,
  onAddStickyNote,
  snapToGrid,
  onToggleSnapToGrid,
  activeWireColor,
  onChangeWireColor,
  onExportJson,
  canvasTheme,
  onToggleCanvasTheme,
  lastSavedTime,
  isSaving,
  onManualSave,
}) => {
  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  const formatSaveTime = (date: Date | null) => {
    if (!date) return 'Lagret';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-slate-200 select-none z-30">
      {/* Brand & Project Name & Autosave Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-tight flex items-center space-x-1.5">
              <span>CircuLab</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">
                Fritzing Designer
              </span>
            </div>
            <button
              onClick={onOpenProjects}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 truncate max-w-[200px]"
              title="Klikk for å administrere prosjekter"
            >
              <FolderOpen className="w-3 h-3 text-slate-500" />
              <span className="truncate">{projectName}</span>
            </button>
          </div>
        </div>

        {/* Autosave Status Pill & Manual Save Button */}
        <button
          onClick={onManualSave}
          disabled={isSaving}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition ${
            isSaving
              ? 'bg-blue-900/40 border-blue-700 text-blue-300'
              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Klikk for å tvinge umiddelbar manuell lagring til localStorage"
        >
          {isSaving ? (
            <RotateCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-medium">
            {isSaving
              ? 'Lagrer...'
              : lastSavedTime
              ? `Autolagret kl. ${formatSaveTime(lastSavedTime)}`
              : 'Autolagret'}
          </span>
          <span className="text-[10px] text-blue-400 hover:text-blue-300 underline font-semibold ml-1">
            Lagre nå
          </span>
        </button>
      </div>

      {/* Center: SIMULATION CONTROL & WIRE COLOR PALETTE */}
      <div className="flex items-center space-x-4">
        {/* Run Simulation Toggle Button */}
        <button
          onClick={onToggleSimulation}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition-all ${
            isSimulating
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              <span>Stopp Simulering</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Kjør Simulering</span>
            </>
          )}
        </button>

        {/* Wire Color Selector */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 mr-1.5 font-medium">Ledningsfarge:</span>
          {WIRE_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => onChangeWireColor(c.color)}
              title={c.label}
              className={`w-5 h-5 rounded-full transition-transform ${
                activeWireColor === c.color
                  ? 'ring-2 ring-white scale-125'
                  : 'hover:scale-110 opacity-80'
              }`}
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>
      </div>

      {/* Right Tools: ERC, BOM, Notes, Grid, Projects */}
      <div className="flex items-center space-x-2">
        {/* Electrical Rule Check (ERC) Button */}
        <button
          onClick={onOpenERCWarnings}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition ${
            errorCount > 0
              ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
              : warningCount > 0
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-850'
          }`}
          title="Kretsvalidering & Elektriske regler (Hurtigtast: E)"
        >
          {errorCount > 0 ? (
            <AlertOctagon className="w-4 h-4 text-red-400" />
          ) : warningCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            {errorCount > 0
              ? `${errorCount} feil detektert`
              : warningCount > 0
              ? `${warningCount} advarsler`
              : 'Krets OK (0 feil)'}
          </span>
        </button>

        {/* BOM (Bill of Materials) */}
        <button
          onClick={onOpenBOM}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          title="Stykkliste (Bill of Materials)"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Stykkliste (BOM)</span>
        </button>

        {/* Sticky Note */}
        <button
          onClick={onAddStickyNote}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition"
          title="Legg til klistrelapp / notat (Hurtigtast: N)"
        >
          <StickyNote className="w-4 h-4 text-yellow-400" />
        </button>

        {/* Canvas Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleCanvasTheme}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition"
          title={
            canvasTheme === 'dark'
              ? 'Bytt til lys canvas-bakgrunn (ruteark)'
              : 'Bytt til mørk canvas-bakgrunn'
          }
        >
          {canvasTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400" />
          )}
        </button>

        {/* Snap to Grid */}
        <button
          onClick={onToggleSnapToGrid}
          className={`p-2 rounded-lg border transition ${
            snapToGrid
              ? 'bg-blue-600/30 text-blue-400 border-blue-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title={snapToGrid ? 'Rutenett-festing På (Snap) (Hurtigtast: G)' : 'Rutenett-festing Av (Hurtigtast: G)'}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Direct Download / Export JSON Button */}
        <button
          onClick={onExportJson}
          className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
          title="Last ned kretsdesign som .json-fil"
        >
          <Download className="w-4 h-4" />
          <span className="hidden md:inline">Eksporter JSON</span>
        </button>

        {/* Project Manager */}
        <button
          onClick={onOpenProjects}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Prosjekt</span>
        </button>
      </div>
    </header>
  );
};
