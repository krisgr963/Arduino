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
  PanelLeft,
  PanelRight,
  Maximize2,
  LayoutGrid,
  Layers,
  FileText,
  Image as ImageIcon,
  Route,
  Gauge,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface HeaderBarProps {
  projectName: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  simulationSpeed?: number;
  onChangeSimulationSpeed?: (speed: number) => void;
  warnings: ERCWarning[];
  onOpenERCWarnings: () => void;
  onOpenBOM: () => void;
  onOpenProjects: () => void;
  onAddStickyNote: () => void;
  onAutoLayout?: () => void;
  onAutoRouteWires?: () => void;
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
  onOpenLayers?: () => void;
  onOpenPDFExport?: () => void;
  onOpenImageExport?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
  isFullScreenWorkspace?: boolean;
  onToggleFullScreenWorkspace?: () => void;
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
  simulationSpeed = 1.0,
  onChangeSimulationSpeed,
  warnings,
  onOpenERCWarnings,
  onOpenBOM,
  onOpenProjects,
  onAddStickyNote,
  onAutoLayout,
  onAutoRouteWires,
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
  onOpenLayers,
  onOpenPDFExport,
  onOpenImageExport,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  isFullScreenWorkspace,
  onToggleFullScreenWorkspace,
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
            <Tooltip title="Prosjektvelger" description="Klikk for å administrere eller bytte prosjekt" position="bottom">
              <button
                onClick={onOpenProjects}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 truncate max-w-[200px]"
                aria-label="Administrer prosjekter"
              >
                <FolderOpen className="w-3 h-3 text-slate-500" />
                <span className="truncate">{projectName}</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Autosave Status Pill & Manual Save Button */}
        <Tooltip
          title="Nettleserlagring (localStorage)"
          description="Klikk for å tvinge umiddelbar manuell lagring"
          position="bottom"
        >
          <button
            onClick={onManualSave}
            disabled={isSaving}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition ${
              isSaving
                ? 'bg-blue-900/40 border-blue-700 text-blue-300'
                : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
            }`}
            aria-label="Manuell lagring"
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
        </Tooltip>
      </div>

      {/* Center: SIMULATION CONTROL & WIRE COLOR PALETTE */}
      <div className="flex items-center space-x-4">
        {/* Run Simulation Toggle Button */}
        <Tooltip
          title={isSimulating ? 'Stopp kretsimulering' : 'Start kretsimulering'}
          description="Beregner spenninger, strømmer, LED-lysstyrke og advarer mot kortslutning"
          position="bottom"
        >
          <button
            onClick={onToggleSimulation}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition-all ${
              isSimulating
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-105'
            }`}
            aria-label={isSimulating ? 'Stopp simulering' : 'Kjør simulering'}
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
        </Tooltip>

        {/* Simulation Speed Slider Control */}
        {onChangeSimulationSpeed && (
          <Tooltip
            title="Simuleringshastighet"
            description="Juster klokkehastigheten for logikksimuleringen (0.1x til 5.0x). Sakte fart er ideelt for å se logiske pulser i sakte film, mens høy fart øker oscillasjonen."
            shortcut={`${simulationSpeed.toFixed(1)}x`}
            position="bottom"
          >
            <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-inner text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline text-[11px] font-medium text-slate-300">Hastighet:</span>
              </div>

              {/* Speed Slider Input */}
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={simulationSpeed}
                onChange={(e) => onChangeSimulationSpeed(parseFloat(e.target.value))}
                className="w-16 sm:w-20 md:w-24 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition"
                aria-label="Simuleringshastighet slider"
              />

              {/* Multiplier Badge with Click-to-Reset to 1.0x */}
              <button
                type="button"
                onClick={() => onChangeSimulationSpeed(1.0)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white border border-cyan-500/30 text-[10px] font-mono font-bold transition shadow-sm"
                title="Klikk for å tilbakestille til standard 1.0x"
              >
                {simulationSpeed === 1.0 ? '1.0x' : `${simulationSpeed.toFixed(1)}x`}
              </button>
            </div>
          </Tooltip>
        )}

        {/* Wire Color Selector */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 mr-1.5 font-medium">Ledningsfarge:</span>
          {WIRE_COLORS.map((c) => (
            <Tooltip key={c.color} title={c.label} description="Velg farge for nye ledninger" position="bottom">
              <button
                onClick={() => onChangeWireColor(c.color)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  activeWireColor === c.color
                    ? 'ring-2 ring-white scale-125'
                    : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: c.color }}
                aria-label={c.label}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Right Tools: ERC, BOM, Notes, Grid, Projects */}
      <div className="flex items-center space-x-2">
        {/* Electrical Rule Check (ERC) Button */}
        <Tooltip
          title="Kretsvalidering (ERC)"
          shortcut="E"
          description="Analyser kretsen for kortslutninger, overspenning og ufullstendige koblinger"
          position="bottom"
        >
          <button
            onClick={onOpenERCWarnings}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition ${
              errorCount > 0
                ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
                : warningCount > 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-850'
            }`}
            aria-label="Kretsvalidering panel"
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
        </Tooltip>

        {/* BOM (Bill of Materials) */}
        <Tooltip
          title="Stykkliste (BOM)"
          description="Oversikt over alle komponenter, antall og estimert kostnad"
          position="bottom"
        >
          <button
            onClick={onOpenBOM}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            aria-label="Stykkliste"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Stykkliste (BOM)</span>
          </button>
        </Tooltip>

        {/* Sticky Note */}
        <Tooltip
          title="Ny klistrelapp"
          shortcut="N"
          description="Fest et gult notat eller påminnelse direkte på kretsbrettet"
          position="bottom"
        >
          <button
            onClick={onAddStickyNote}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition"
            aria-label="Legg til klistrelapp"
          >
            <StickyNote className="w-4 h-4 text-yellow-400" />
          </button>
        </Tooltip>

        {/* Autolayout-knapp */}
        {onAutoLayout && (
          <Tooltip
            title="Autolayout"
            shortcut="L"
            description="Organiser alle komponenter automatisk med jevn rutenett-avstand"
            position="bottom"
          >
            <button
              onClick={onAutoLayout}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              aria-label="Automatisk rutenett-organisering"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Autolayout</span>
            </button>
          </Tooltip>
        )}

        {/* Auto-route ledninger-knapp */}
        {onAutoRouteWires && (
          <Tooltip
            title="Auto-route ledninger"
            shortcut="R"
            description="Rydder opp i komplekse koblinger og finner den mest direkte og ryddige stien mellom pinner"
            position="bottom"
          >
            <button
              onClick={onAutoRouteWires}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              aria-label="Auto-route ledninger"
            >
              <Route className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Auto-route</span>
            </button>
          </Tooltip>
        )}

        {/* Canvas Theme Toggle (Dark / Light) */}
        <Tooltip
          title={canvasTheme === 'dark' ? 'Bytt til lyst ruteark' : 'Bytt til mørkt ruteark'}
          description="Veksle lerretets utseende og kontrast"
          position="bottom"
        >
          <button
            onClick={onToggleCanvasTheme}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition"
            aria-label="Veksle lerret bakgrunn"
          >
            {canvasTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </Tooltip>

        {/* Snap to Grid */}
        <Tooltip
          title="Fest til rutenett"
          shortcut="G"
          description={snapToGrid ? 'Rutenett-festing er PÅ (10px grid)' : 'Rutenett-festing er AV'}
          position="bottom"
        >
          <button
            onClick={onToggleSnapToGrid}
            className={`p-2 rounded-lg border transition ${
              snapToGrid
                ? 'bg-blue-600/30 text-blue-400 border-blue-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            aria-label="Veksle rutenettfesting"
          >
            <Grid className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Sidebar Visning / Fullskjerm Toggle Button Group */}
        {onToggleLeftSidebar && (
          <div className="hidden lg:flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <Tooltip
              title={isLeftSidebarOpen ? 'Skjul bibliotek' : 'Vis bibliotek'}
              shortcut="["
              description="Veksle venstre komponentmeny"
              position="bottom"
            >
              <button
                onClick={onToggleLeftSidebar}
                className={`p-1.5 rounded-md text-xs transition flex items-center space-x-1 ${
                  isLeftSidebarOpen
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                aria-label="Veksle bibliotek-meny"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                <span className="text-[10px]">Bibliotek</span>
              </button>
            </Tooltip>

            {onToggleRightSidebar && (
              <Tooltip
                title={isRightSidebarOpen ? 'Skjul egenskaper' : 'Vis egenskaper'}
                shortcut="]"
                description="Veksle høyre inspektørpanel"
                position="bottom"
              >
                <button
                  onClick={onToggleRightSidebar}
                  className={`p-1.5 rounded-md text-xs transition flex items-center space-x-1 ${
                    isRightSidebarOpen
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                  aria-label="Veksle egenskaper-meny"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Egenskaper</span>
                </button>
              </Tooltip>
            )}

            {onToggleFullScreenWorkspace && (
              <Tooltip
                title={isFullScreenWorkspace ? 'Gjenopprett menyer' : 'Fullskjerm'}
                shortcut="\"
                description="Skjul begge menyer for maksimal arbeidsflate"
                position="bottom"
              >
                <button
                  onClick={onToggleFullScreenWorkspace}
                  className={`p-1.5 rounded-md text-xs transition ${
                    isFullScreenWorkspace
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                  aria-label="Fullskjerm arbeidsflate"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        )}

        {/* Layer Manager Drawer Button */}
        {onOpenLayers && (
          <Tooltip
            title="Lag-system"
            description="Organiser, skjul og lås lag for komponenter, ledninger og notater"
            position="bottom"
          >
            <button
              onClick={onOpenLayers}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
              aria-label="Åpne lag-system"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline">Lag</span>
            </button>
          </Tooltip>
        )}

        {/* PDF Documentation Export Button */}
        {onOpenPDFExport && (
          <Tooltip
            title="Eksporter PDF"
            description="Last ned komplett kretsdokumentasjon med koblingsbilde, stykkliste og notater"
            position="bottom"
          >
            <button
              onClick={onOpenPDFExport}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
              aria-label="Eksporter kretsdesign som PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
          </Tooltip>
        )}

        {/* High-Res Image (PNG/SVG) Export Button */}
        {onOpenImageExport && (
          <Tooltip
            title="Eksporter Bilde"
            description="Last ned høyoppløselig PNG (opptil 300 DPI) eller skalerbar SVG for presentasjoner"
            position="bottom"
          >
            <button
              onClick={onOpenImageExport}
              className="px-3 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
              aria-label="Eksporter bilde som PNG eller SVG"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden md:inline">Bilde</span>
            </button>
          </Tooltip>
        )}

        {/* Direct Download / Export JSON Button */}
        <Tooltip
          title="Eksporter prosjekt"
          description="Last ned kretsdesignet lokalt som .json"
          position="bottom"
        >
          <button
            onClick={onExportJson}
            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
            aria-label="Last ned kretsdesign som json"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">JSON</span>
          </button>
        </Tooltip>

        {/* Project Manager */}
        <Tooltip
          title="Prosjekter & Eksempler"
          description="Åpne maler, eksempler og administrer prosjekter"
          position="bottom"
        >
          <button
            onClick={onOpenProjects}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow transition"
            aria-label="Åpne prosjektvelger"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Prosjekt</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
