import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  FileCode,
  Layers,
  Palette,
  Eye,
  Crop,
} from 'lucide-react';
import { CircuitProject, ComponentDefinition } from '../../types/circuit';
import {
  calculateCircuitBounds,
  copyPngToClipboard,
  copySvgToClipboard,
  downloadFile,
  exportToPng,
  generateSvgString,
  ImageExportOptions,
} from '../../utils/imageExport';

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CircuitProject;
  componentDefs: Map<string, ComponentDefinition>;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  isOpen,
  onClose,
  project,
  componentDefs,
}) => {
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [scale, setScale] = useState<1 | 2 | 3>(2); // 2x default for ultra-sharp presentations
  const [background, setBackground] = useState<'dark' | 'white' | 'transparent' | 'blueprint'>('dark');
  const [cropToContent, setCropToContent] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute bounding box
  const bounds = useMemo(() => {
    return calculateCircuitBounds(project, componentDefs, 60);
  }, [project, componentDefs]);

  // Dimensions based on scale and crop
  const calculatedWidth = useMemo(() => {
    const baseW = cropToContent ? bounds.width : 1600;
    return Math.round(baseW * (format === 'png' ? scale : 1));
  }, [cropToContent, bounds.width, format, scale]);

  const calculatedHeight = useMemo(() => {
    const baseH = cropToContent ? bounds.height : 1000;
    return Math.round(baseH * (format === 'png' ? scale : 1));
  }, [cropToContent, bounds.height, format, scale]);

  // Safe filename
  const safeFilename = useMemo(() => {
    const name = (project.name || 'kretsdesign')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    return `${name}_${format === 'png' ? `${scale}x` : 'vector'}.${format}`;
  }, [project.name, scale, format]);

  // Generate a live preview when modal opens or settings change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const canvasSvg = document.querySelector('svg.circulab-canvas') as SVGSVGElement | null;

    if (!canvasSvg) {
      setPreviewDataUrl(null);
      return;
    }

    const options: ImageExportOptions = {
      format: 'png',
      scale: 1, // 1x is fast for preview
      background,
      cropToContent,
      includeWatermark,
      includeNotes,
    };

    exportToPng(canvasSvg, bounds, options, project)
      .then((res) => {
        if (isMounted) {
          setPreviewDataUrl(res.dataUrl);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Preview generation failed:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, background, cropToContent, includeWatermark, includeNotes, bounds, project]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const canvasSvg = document.querySelector('svg.circulab-canvas') as SVGSVGElement | null;
      if (!canvasSvg) {
        throw new Error('Fant ikke kretslerretet (SVG). Vennligst prøv igjen.');
      }

      const options: ImageExportOptions = {
        format,
        scale,
        background,
        cropToContent,
        includeWatermark,
        includeNotes,
      };

      if (format === 'svg') {
        const svgString = generateSvgString(canvasSvg, bounds, options, project);
        downloadFile(svgString, safeFilename, 'image/svg+xml');
      } else {
        const { blob } = await exportToPng(canvasSvg, bounds, options, project);
        downloadFile(blob, safeFilename, 'image/png');
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      setErrorMessage(err.message || 'Kunne ikke eksportere bildet');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const canvasSvg = document.querySelector('svg.circulab-canvas') as SVGSVGElement | null;
      if (!canvasSvg) {
        throw new Error('Fant ikke kretslerretet');
      }

      const options: ImageExportOptions = {
        format,
        scale,
        background,
        cropToContent,
        includeWatermark,
        includeNotes,
      };

      let success = false;
      if (format === 'svg') {
        const svgString = generateSvgString(canvasSvg, bounds, options, project);
        success = await copySvgToClipboard(svgString);
      } else {
        const { blob } = await exportToPng(canvasSvg, bounds, options, project);
        success = await copyPngToClipboard(blob);
      }

      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        setErrorMessage('Nettleseren støtter ikke direkte bildekopiering. Bruk "Last ned" i stedet.');
      }
    } catch (err: any) {
      console.error('Clipboard copy error:', err);
      setErrorMessage(err.message || 'Kunne ikke kopiere til utklippstavle');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Eksporter Kretsbilde (PNG / SVG)
              </h2>
              <p className="text-xs text-slate-400">
                Lagre høyoppløselig bildefil for presentasjoner, rapporter eller dokumentasjon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Controls, Right Preview */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Controls Column */}
          <div className="space-y-4">
            {/* Format Selector Tabs */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Filformat
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                    format === 'png'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>PNG (Bilde)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('svg')}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                    format === 'svg'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>SVG (Vektor)</span>
                </button>
              </div>
            </div>

            {/* Resolution Scale (for PNG) */}
            {format === 'png' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Oppløsning / Skalering
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: '1x Standard', desc: 'Web / Skjerm (~1000px)' },
                    { val: 2, label: '2x Retina', desc: 'Presentasjon (~2000px)' },
                    { val: 3, label: '3x Ultra-HD', desc: 'Trykk 300 DPI (~3000px)' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setScale(item.val as any)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        scale === item.val
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Style */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Bakgrunnsfarge
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dark', label: 'Mørk Slate', color: '#090d16' },
                  { id: 'white', label: 'Hvit Papir', color: '#ffffff' },
                  { id: 'blueprint', label: 'Blåkopi (Navy)', color: '#0f172a' },
                  { id: 'transparent', label: 'Gjennomsiktig', color: 'transparent' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackground(bg.id as any)}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border text-xs font-medium transition ${
                      background === bg.id
                        ? 'border-blue-500 bg-blue-600/15 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-slate-600 shrink-0 shadow-sm"
                      style={{
                        backgroundColor: bg.color,
                        backgroundImage:
                          bg.id === 'transparent'
                            ? 'radial-gradient(#64748b 1px, transparent 1px)'
                            : undefined,
                        backgroundSize: '4px 4px',
                      }}
                    />
                    <span>{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <Crop className="w-3.5 h-3.5 text-blue-400" />
                  Beskjær tett rundt kretsen
                </span>
                <input
                  type="checkbox"
                  checked={cropToContent}
                  onChange={(e) => setCropToContent(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Inkluder tittel & vannmerke
                </span>
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition">
                <span className="text-xs text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Inkluder klistrelapper og notater
                </span>
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Preview Column */}
          <div className="flex flex-col justify-between bg-slate-950 rounded-2xl p-4 border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  Forhåndsvisning
                </span>
                <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                  {calculatedWidth} × {calculatedHeight} px
                </span>
              </div>

              {/* Preview Canvas Box */}
              <div
                className="w-full h-52 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative"
                style={{
                  backgroundColor:
                    background === 'white'
                      ? '#ffffff'
                      : background === 'blueprint'
                      ? '#0f172a'
                      : '#090d16',
                }}
              >
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Krets forhåndsvisning"
                    className="max-w-full max-h-full object-contain drop-shadow"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-500 text-xs">
                    Genererer forhåndsvisning...
                  </div>
                )}
              </div>
            </div>

            {/* File details card */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Filnavn:</span>
                <span className="font-mono text-slate-200 font-medium truncate max-w-[180px]">
                  {safeFilename}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Format:</span>
                <span className="font-bold uppercase text-blue-400">
                  {format === 'png' ? `PNG (${scale}x Skalert)` : 'SVG (Vektor)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Komponenter:</span>
                <span className="text-slate-200 font-mono">
                  {project.components.length} stk
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-center space-x-2">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Avbryt
          </button>

          <div className="flex items-center space-x-3">
            {/* Copy to Clipboard */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleCopyToClipboard}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                copySuccess
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Kopier bilde eller SVG-kode direkte til utklippstavlen"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Kopiert til utklippstavle!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopier</span>
                </>
              )}
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'Eksporterer...'
                  : `Last ned ${format.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
