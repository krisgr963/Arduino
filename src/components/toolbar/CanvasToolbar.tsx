import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Lightbulb,
  Sun,
  Moon,
  Download,
  LayoutGrid,
  Layers,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface CanvasToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onAutoLayout?: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  isFullScreenWorkspace: boolean;
  onToggleFullScreenWorkspace: () => void;
  onOpenGuide: () => void;
  canvasTheme?: 'dark' | 'light';
  onToggleCanvasTheme?: () => void;
  onExportJson?: () => void;
  onOpenLayers?: () => void;
  onOpenPDFExport?: () => void;
  onOpenImageExport?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  hasSelection,
  onDeleteSelected,
  onAutoLayout,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  isFullScreenWorkspace,
  onToggleFullScreenWorkspace,
  onOpenGuide,
  canvasTheme,
  onToggleCanvasTheme,
  onExportJson,
  onOpenLayers,
  onOpenPDFExport,
  onOpenImageExport,
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-slate-200 select-none">
      {/* 1. History (Undo / Redo) */}
      <Tooltip
        title="Angre"
        description="Tilbakestill forrige handling på lerretet"
        shortcut="Ctrl+Z"
        position="bottom"
      >
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
            canUndo
              ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          aria-label="Angre siste handling"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] font-medium">Angre</span>
        </button>
      </Tooltip>

      <Tooltip
        title="Gjenta"
        description="Gjenopprett handling som ble angret"
        shortcut="Ctrl+Y"
        position="bottom"
      >
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
            canRedo
              ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          aria-label="Gjenta handling"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] font-medium">Gjenta</span>
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 2. Zoom Controls */}
      <Tooltip
        title="Zoom ut"
        description="Forminsk lerretet for større oversikt"
        shortcut="-"
        position="bottom"
      >
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Zoom ut"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </Tooltip>

      <Tooltip
        title="Tilbakestill zoom"
        description="Sett lerretet til 100% standardskalert visning"
        shortcut="0"
        position="bottom"
      >
        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono transition"
          aria-label="Tilbakestill zoom til 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
      </Tooltip>

      <Tooltip
        title="Zoom inn"
        description="Forstørr pinner og komponenter"
        shortcut="+"
        position="bottom"
      >
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
          aria-label="Zoom inn"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 3. Delete Selected Component/Wire */}
      <Tooltip
        title="Slett valgt"
        description="Fjern markerte komponenter eller ledninger fra kretsen"
        shortcut={['Del', '⌫']}
        position="bottom"
      >
        <button
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
            hasSelection
              ? 'hover:bg-red-950/80 text-slate-300 hover:text-red-400'
              : 'text-slate-600 cursor-not-allowed'
          }`}
          aria-label="Slett valgte elementer"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] font-medium">Slett</span>
        </button>
      </Tooltip>

      {/* 3b. Autolayout Button */}
      {onAutoLayout && (
        <Tooltip
          title="Autolayout"
          description="Organiser alle komponenter automatisk med jevn rutenett-avstand"
          shortcut="L"
          position="bottom"
        >
          <button
            onClick={onAutoLayout}
            className="p-1.5 rounded-lg flex items-center space-x-1 text-xs hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition"
            aria-label="Automatisk rutenett-layout"
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline text-[11px] font-medium">Autolayout</span>
          </button>
        </Tooltip>
      )}

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 4. Smart Circuit Guide Button */}
      <Tooltip
        title="Koblingsguide"
        description="Få trinnvise råd, pinout-forslag og kretsdiagrammer"
        position="bottom"
      >
        <button
          onClick={onOpenGuide}
          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition shadow"
          aria-label="Åpne Koblingsguide"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Koblingsguide</span>
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 5. Workspace Sidebar Visibility & Full Screen Toggle */}
      <Tooltip
        title={isLeftSidebarOpen ? 'Skjul bibliotek' : 'Vis bibliotek'}
        description="Veksle venstre komponentbibliotek"
        shortcut="["
        position="bottom"
      >
        <button
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
            !isLeftSidebarOpen ? 'text-blue-400 bg-blue-900/30' : ''
          }`}
          aria-label="Veksle bibliotek-meny"
        >
          {isLeftSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>
      </Tooltip>

      <Tooltip
        title={isRightSidebarOpen ? 'Skjul egenskaper' : 'Vis egenskaper'}
        description="Veksle høyre inspektør- og egenskapspanel"
        shortcut="]"
        position="bottom"
      >
        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
            !isRightSidebarOpen ? 'text-blue-400 bg-blue-900/30' : ''
          }`}
          aria-label="Veksle egenskaper-meny"
        >
          {isRightSidebarOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </Tooltip>

      <Tooltip
        title={isFullScreenWorkspace ? 'Gjenopprett menyer' : 'Fullskjerm lerret'}
        description="Skjul begge sidemenyer for maksimal arbeidsflate"
        shortcut="\"
        position="bottom"
      >
        <button
          onClick={onToggleFullScreenWorkspace}
          className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
            isFullScreenWorkspace ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40' : ''
          }`}
          aria-label="Fullskjerm arbeidsflate"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 6. Canvas Background Theme Toggle (Dark vs Light) */}
      {onToggleCanvasTheme && (
        <Tooltip
          title={canvasTheme === 'light' ? 'Mørkt rutemønster' : 'Lyst rutemønster'}
          description="Veksle lerretets bakgrunnsfarge og rutenett"
          position="bottom"
        >
          <button
            onClick={onToggleCanvasTheme}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Veksle lyst eller mørkt lerret"
          >
            {canvasTheme === 'light' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </Tooltip>
      )}

      {/* 7. Layer System Drawer */}
      {onOpenLayers && (
        <Tooltip
          title="Lag-system"
          description="Vis, skjul eller lås lag for komponenter, ledninger og notater"
          position="bottom"
        >
          <button
            onClick={onOpenLayers}
            className="p-1.5 rounded-lg text-slate-300 hover:text-purple-300 hover:bg-slate-800 transition"
            aria-label="Åpne lag-system"
          >
            <Layers className="w-4 h-4 text-purple-400" />
          </button>
        </Tooltip>
      )}

      {/* 8. Export PDF */}
      {onOpenPDFExport && (
        <Tooltip
          title="Eksporter PDF"
          description="Last ned utskriftsvennlig kretsdokumentasjon og BOM som PDF"
          position="bottom"
        >
          <button
            onClick={onOpenPDFExport}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-300 hover:bg-slate-800 transition"
            aria-label="Eksporter PDF"
          >
            <FileText className="w-4 h-4 text-red-400" />
          </button>
        </Tooltip>
      )}

      {/* 9. Export High-Res Image (PNG/SVG) */}
      {onOpenImageExport && (
        <Tooltip
          title="Eksporter Bilde"
          description="Last ned høyoppløselig PNG (opptil 300 DPI) eller skalerbar SVG for presentasjoner"
          position="bottom"
        >
          <button
            onClick={onOpenImageExport}
            className="p-1.5 rounded-lg text-slate-300 hover:text-purple-300 hover:bg-slate-800 transition"
            aria-label="Eksporter bilde som PNG eller SVG"
          >
            <ImageIcon className="w-4 h-4 text-purple-400" />
          </button>
        </Tooltip>
      )}

      {/* 10. Direct Export JSON */}
      {onExportJson && (
        <Tooltip
          title="Eksporter prosjekt"
          description="Last ned kretsdesignet som .json fil"
          position="bottom"
        >
          <button
            onClick={onExportJson}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Last ned prosjektfil"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </Tooltip>
      )}
    </div>
  );
};
