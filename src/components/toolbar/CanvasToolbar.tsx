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
  Maximize,
  RotateCcw,
  Sun,
  Moon,
  Download,
} from 'lucide-react';

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
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-2xl text-slate-200 select-none">
      {/* 1. History (Undo / Redo) */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
          canUndo
            ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title="Angre (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
        <span className="hidden sm:inline text-[11px] font-medium">Angre</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
          canRedo
            ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title="Gjenta (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden sm:inline text-[11px] font-medium">Gjenta</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 2. Zoom Controls */}
      <button
        onClick={onZoomOut}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
        title="Zoom ut (-)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={onResetZoom}
        className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono transition"
        title="Tilbakestill zoom til 100%"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={onZoomIn}
        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
        title="Zoom inn (+)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 3. Delete Selected Component/Wire */}
      <button
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        className={`p-1.5 rounded-lg flex items-center space-x-1 text-xs transition ${
          hasSelection
            ? 'hover:bg-red-950/80 text-slate-300 hover:text-red-400'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title="Slett valgt komponent eller ledning (Del / Backspace)"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline text-[11px] font-medium">Slett</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 4. Smart Circuit Guide Button */}
      <button
        onClick={onOpenGuide}
        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition shadow"
        title="Åpne Koblingsguide med smarte forslag"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        <span>Koblingsguide</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 5. Workspace Sidebar Visibility & Full Screen Toggle */}
      <button
        onClick={onToggleLeftSidebar}
        className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
          !isLeftSidebarOpen ? 'text-blue-400 bg-blue-900/30' : ''
        }`}
        title={isLeftSidebarOpen ? 'Skjul bibliotek-meny' : 'Vis bibliotek-meny'}
      >
        {isLeftSidebarOpen ? (
          <PanelLeftClose className="w-4 h-4" />
        ) : (
          <PanelLeftOpen className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={onToggleRightSidebar}
        className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
          !isRightSidebarOpen ? 'text-blue-400 bg-blue-900/30' : ''
        }`}
        title={isRightSidebarOpen ? 'Skjul egenskaper-meny' : 'Vis egenskaper-meny'}
      >
        {isRightSidebarOpen ? (
          <PanelRightClose className="w-4 h-4" />
        ) : (
          <PanelRightOpen className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={onToggleFullScreenWorkspace}
        className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
          isFullScreenWorkspace ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/40' : ''
        }`}
        title={
          isFullScreenWorkspace
            ? 'Gjenopprett sidemenyer'
            : 'Fullskjerm arbeidsflate (Skjul begge menyer)'
        }
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700/80 mx-1" />

      {/* 6. Canvas Background Theme Toggle (Dark vs Light) */}
      {onToggleCanvasTheme && (
        <button
          onClick={onToggleCanvasTheme}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title={
            canvasTheme === 'light'
              ? 'Bytt til mørkt canvas-rutemønster'
              : 'Bytt til lyst canvas-rutemønster'
          }
        >
          {canvasTheme === 'light' ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      )}

      {/* 7. Direct Export JSON */}
      {onExportJson && (
        <button
          onClick={onExportJson}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Last ned kretsdesign (.json)"
        >
          <Download className="w-4 h-4 text-emerald-400" />
        </button>
      )}
    </div>
  );
};
