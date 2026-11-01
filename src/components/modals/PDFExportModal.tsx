import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Table,
  StickyNote,
  GitBranch,
  Printer,
  RotateCw,
} from 'lucide-react';
import { CircuitProject, ComponentDefinition } from '../../types/circuit';
import { exportCircuitToPDF } from '../../utils/pdfExport';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  componentDefs: Map<string, ComponentDefinition>;
  canvasSvgRef?: React.RefObject<SVGSVGElement | null>;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  project,
  componentDefs,
  canvasSvgRef,
}) => {
  const [includeVisualPreview, setIncludeVisualPreview] = useState<boolean>(true);
  const [includeBOM, setIncludeBOM] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeWiring, setIncludeWiring] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage('Forbereder kretsdiagram og genererer PDF-sider...');

    try {
      const svgEl = canvasSvgRef?.current || document.querySelector('svg.circulab-canvas') as SVGSVGElement | null;

      await exportCircuitToPDF(project, componentDefs, {
        includeVisualPreview,
        includeBOM,
        includeNotes,
        includeWiring,
        orientation,
        canvasSvgElement: svgEl,
      });

      setStatusMessage('PDF-dokumentet ble lastet ned!');
      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('PDF export error:', err);
      setStatusMessage('Det oppstod en feil under PDF-generering. Vennligst prøv igjen.');
      setIsExporting(false);
    }
  };

  const compCount = project.components.length;
  const wireCount = project.wires.length;
  const noteCount = (project.notes || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 text-xs">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Eksporter kretsdesign til PDF</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generer utskriftsvennlig dokumentasjon med koblingsbilde, deleliste og notater
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Project Summary Banner */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Prosjekt</span>
              <span className="text-sm font-semibold text-white">{project.name}</span>
            </div>
            <div className="flex items-center space-x-3 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block">Komponenter</span>
                <span className="font-mono font-bold text-blue-400">{compCount} stk</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">Forbindelser</span>
                <span className="font-mono font-bold text-emerald-400">{wireCount} stk</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block">Notater</span>
                <span className="font-mono font-bold text-amber-400">{noteCount} stk</span>
              </div>
            </div>
          </div>

          {/* Orientation Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Sideretning (Papirformat A4):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrientation('landscape')}
                className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  orientation === 'landscape'
                    ? 'bg-blue-600/20 text-white border-blue-500 font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                <div className="w-5 h-3.5 border-2 border-current rounded-sm" />
                <span>Liggende (Anbefalt for kretser)</span>
              </button>

              <button
                onClick={() => setOrientation('portrait')}
                className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  orientation === 'portrait'
                    ? 'bg-blue-600/20 text-white border-blue-500 font-semibold'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                <div className="w-3.5 h-5 border-2 border-current rounded-sm" />
                <span>Stående (Portrett)</span>
              </button>
            </div>
          </div>

          {/* Section Inclusions Checkboxes */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Innhold som skal inkluderes i PDF-filen:
            </label>

            {/* Visual Circuit Snapshot */}
            <div
              onClick={() => setIncludeVisualPreview(!includeVisualPreview)}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded-xl flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center space-x-2.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-semibold text-white block">Kretsbilde / Visuell forhåndsvisning</span>
                  <span className="text-[10px] text-slate-400">
                    Gjengivelse av det monterte kretsbrettet og alle ledningsbaner
                  </span>
                </div>
              </div>
              {includeVisualPreview ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {/* BOM Table */}
            <div
              onClick={() => setIncludeBOM(!includeBOM)}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded-xl flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center space-x-2.5">
                <Table className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold text-white block">Stykkliste &amp; Komponenttabell (BOM)</span>
                  <span className="text-[10px] text-slate-400">
                    Oversikt over referansekoder, parametere, kapslinger og datablad-lenker
                  </span>
                </div>
              </div>
              {includeBOM ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {/* Notes */}
            <div
              onClick={() => setIncludeNotes(!includeNotes)}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded-xl flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center space-x-2.5">
                <StickyNote className="w-4 h-4 text-yellow-400" />
                <div>
                  <span className="font-semibold text-white block">Kretsnotater &amp; Klistrelapper</span>
                  <span className="text-[10px] text-slate-400">
                    Egne kommentarer og instruksjoner knyttet til kretsen
                  </span>
                </div>
              </div>
              {includeNotes ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {/* Wiring Table */}
            <div
              onClick={() => setIncludeWiring(!includeWiring)}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 rounded-xl flex items-center justify-between cursor-pointer transition select-none"
            >
              <div className="flex items-center space-x-2.5">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-white block">Ledningsoversikt / Koblingstabell</span>
                  <span className="text-[10px] text-slate-400">
                    Pinneliste over alle fysiske ledninger, fargekoder og forbindelsespunkter
                  </span>
                </div>
              </div>
              {includeWiring ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center space-x-2 text-blue-300">
              {isExporting && <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
          >
            Avbryt
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-lg shadow-red-600/30 flex items-center space-x-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Genererer PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Last ned PDF-dokument</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
